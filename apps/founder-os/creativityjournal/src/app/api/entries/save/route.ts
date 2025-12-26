import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Save entry API called');
    
    // Get the session token from cookies (custom session validation)
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      console.log('No session token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the session and user
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    console.log('Session:', session);

    if (!session || !session.user || session.expires < new Date()) {
      console.log('No session or user found, or session expired');
      
      // Clean up expired or invalid session
      if (session) {
        await prisma.session.delete({
          where: { sessionToken }
        });
      }
      
      // Clear the corrupted cookie
      const response = NextResponse.json({ error: 'Session invalid or expired' }, { status: 401 });
      response.cookies.set('next-auth.session-token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;
    }

    const user = session.user;
    console.log('User email:', user.email);

    const body = await request.json();
    console.log('Request body:', body);

    const { entryId, subject, content, moodIds, moodContext, satisfaction, wordCount, charCount } = body;
    
    // Calculate fresh word and character counts from content
    const calculateCounts = (htmlContent: string) => {
      const text = htmlContent.replace(/<[^>]*>/g, ''); // Strip HTML tags
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      const charCount = text.length;
      return { wordCount, charCount };
    };
    
    const { wordCount: calculatedWordCount, charCount: calculatedCharCount } = calculateCounts(content || '');
    
    // Use calculated counts (more reliable than frontend state)
    const finalWordCount = calculatedWordCount;
    const finalCharCount = calculatedCharCount;
    
    console.log('Word/character count calculation:', {
      frontendCounts: { wordCount, charCount },
      calculatedCounts: { wordCount: calculatedWordCount, charCount: calculatedCharCount },
      finalCounts: { wordCount: finalWordCount, charCount: finalCharCount }
    });

    // Separate global mood IDs from user mood IDs by querying the database
    const globalMoodIds: number[] = [];
    const userMoodIds: number[] = [];
    
    if (moodIds && moodIds.length > 0) {
      // Convert all mood IDs to numbers - all should be integers now
      const numericMoodIds = moodIds.map(id => {
        if (typeof id === 'string') {
          const parsed = parseInt(id, 10);
          if (isNaN(parsed)) {
            console.warn(`Invalid mood ID received: ${id}. Skipping.`);
            return null;
          }
          return parsed;
        }
        return id;
      }).filter(id => id !== null && !isNaN(id));
      
      if (numericMoodIds.length > 0) {
        // Query UserMoods to find which IDs are user moods
        const userMoodRecords = await prisma.userMood.findMany({
          where: {
            id: { in: numericMoodIds },
            userId: user.id
          },
          select: { id: true }
        });
        
        const userMoodIdSet = new Set(userMoodRecords.map(um => um.id));
        
        // Separate IDs based on database lookup
        numericMoodIds.forEach(moodId => {
          if (userMoodIdSet.has(moodId)) {
            userMoodIds.push(moodId);
          } else {
            globalMoodIds.push(moodId);
          }
        });
      }
    }
    
    console.log('Separated mood IDs:', { globalMoodIds, userMoodIds });

    // For new entries (no entryId), create with status 0 (Draft)
    if (!entryId) {
      console.log('Creating new entry with status 0 (Draft)');
      
      const newEntry = await prisma.entry.create({
        data: {
          ownerId: user.id,
          statusId: 1, // Draft status
          entryProps: {
            create: {
              title: subject || '',
              content: content || '',
              sat: satisfaction || 5,
              wordcount: wordCount || 0,
              charcount: charCount || 0,
              moodContext: moodContext || ''
            }
          },
          // Add global mood associations
          entryMoods: globalMoodIds.length > 0 ? {
            create: globalMoodIds.map((moodId: number) => ({
              moodId: moodId
            }))
          } : undefined,
          // Add user mood associations
          entryUserMoods: userMoodIds.length > 0 ? {
            create: userMoodIds.map((userMoodId: number) => ({
              userMoodId: userMoodId
            }))
          } : undefined
        },
        include: {
          entryProps: true,
          status: true,
          entryMoods: {
            include: {
              mood: true
            }
          },
          entryUserMoods: {
            include: {
              userMood: true
            }
          }
        }
      });

      console.log('New entry created:', newEntry);
      return NextResponse.json({ 
        success: true, 
        entryId: newEntry.id,
        status: newEntry.status.status,
        statusId: newEntry.statusId
      });
    }

    // For existing entries, update the content and props
    console.log('Updating existing entry:', entryId);

    // Check if the entry exists and get its current status
    const existingEntry = await prisma.entry.findUnique({ 
      where: { id: entryId },
      include: { status: true }
    });
    console.log('Existing entry:', existingEntry);
    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found for update' }, { status: 404 });
    }

    // Determine if we need to revert to draft
    const shouldRevertToDraft = existingEntry.status.status === 'Published';
    console.log('Should revert to draft:', shouldRevertToDraft);

    // Use a transaction to ensure atomic deletion and creation of mood associations
    const updatedEntry = await prisma.$transaction(async (tx) => {
      // First, delete existing mood associations (both global and user moods)
      await tx.entryMoods.deleteMany({
        where: { entryId: entryId }
      });
      
      await tx.entryUserMoods.deleteMany({
        where: { entryId: entryId }
      });

      // Update the entry with new data
      const entry = await tx.entry.update({
        where: { id: entryId },
        data: {
          updatedDate: new Date(),
          // Revert to draft status if currently published
          statusId: shouldRevertToDraft ? 1 : existingEntry.statusId,
          entryProps: {
            upsert: {
              create: {
                title: subject || '',
                content: content || '',
                sat: satisfaction || 5,
                wordcount: wordCount || 0,
                charcount: charCount || 0,
                moodContext: moodContext || ''
              },
              update: {
                title: subject || '',
                content: content || '',
                sat: satisfaction || 5,
                wordcount: wordCount || 0,
                charcount: charCount || 0,
                moodContext: moodContext || ''
              }
            }
          }
        },
        include: {
          entryProps: true,
          status: true
        }
      });

      // Create new global mood associations
      if (globalMoodIds.length > 0) {
        await tx.entryMoods.createMany({
          data: globalMoodIds.map((moodId: number) => ({
            entryId: entryId,
            moodId: moodId
          }))
        });
      }

      // Create new user mood associations
      if (userMoodIds.length > 0) {
        await tx.entryUserMoods.createMany({
          data: userMoodIds.map((userMoodId: number) => ({
            entryId: entryId,
            userMoodId: userMoodId
          }))
        });
      }

      // Return the updated entry with all associations
      return await tx.entry.findUnique({
        where: { id: entryId },
        include: {
          entryProps: true,
          status: true,
          entryMoods: {
            include: {
              mood: true
            }
          },
          entryUserMoods: {
            include: {
              userMood: true
            }
          }
        }
      });
    });

    if (!updatedEntry) {
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }

    console.log('Entry updated:', updatedEntry);
    return NextResponse.json({ 
      success: true, 
      entryId: updatedEntry.id,
      status: updatedEntry.status.status,
      statusId: updatedEntry.statusId
    });

  } catch (error) {
    console.error('Error saving entry:', error);
    
    // If it's a JWT/session error, clear the corrupted cookie
    if (error.message?.includes('JWE') || error.message?.includes('JWT')) {
      const response = NextResponse.json({ 
        error: 'Session corrupted, please log in again',
        needsReauth: true
      }, { status: 401 });
      
      response.cookies.set('next-auth.session-token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      return response;
    }
    
    return NextResponse.json({ error: 'Error saving entry' }, { status: 500 });
  }
} 