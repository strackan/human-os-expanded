import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Create entry API called');
    
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

    if (!session || !session.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = session.user;
    const body = await request.json();
    const { subject, content, moodIds, moodContext, satisfaction, wordCount, charCount } = body;

    console.log('Creating new entry with status 0 (Draft)');
    
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

    const newEntry = await prisma.entry.create({
      data: {
        ownerId: user.id,
        statusId: 1, // Draft status (was 0, but should be 1)
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
        entrySecurity: {
          create: {
            isPrivate: false
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
        entrySecurity: true,
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

  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json({ error: 'Error creating entry' }, { status: 500 });
  }
} 