import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Publish entry API called');
    
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

    if (!session || !session.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = session.user;
    console.log('User email:', user.email);

    const body = await request.json();
    console.log('Request body:', body);

    const { entryId, subject, content, moodIds, moodContext, satisfaction, wordCount, charCount } = body;

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Check if the entry exists and belongs to the user
    const existingEntry = await prisma.entry.findFirst({
      where: {
        id: entryId,
        ownerId: user.id
      }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

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
    
    console.log('Separated mood IDs for publish:', { globalMoodIds, userMoodIds });

    // First, delete existing mood associations (both global and user moods)
    await prisma.entryMoods.deleteMany({
      where: { entryId: entryId }
    });
    
    await prisma.entryUserMoods.deleteMany({
      where: { entryId: entryId }
    });

    // Update the entry to published status (statusId: 2 = Published)
    const updatedEntry = await prisma.entry.update({
      where: { id: entryId },
      data: {
        statusId: 2, // Published status
        updatedDate: new Date(),
        publishedDate: new Date(),
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

    console.log('Entry published:', updatedEntry);
    return NextResponse.json({ 
      success: true, 
      entryId: updatedEntry.id,
      status: updatedEntry.status.status,
      statusId: updatedEntry.statusId
    });

  } catch (error) {
    console.error('Error publishing entry:', error);
    return NextResponse.json({ error: 'Error publishing entry' }, { status: 500 });
  }
} 