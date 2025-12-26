import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the session and user
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user || session.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get the "Published" status ID
    const publishedStatus = await prisma.entryStatus.findFirst({
      where: { status: 'Published' }
    });

    if (!publishedStatus) {
      return NextResponse.json({ error: 'Published status not found' }, { status: 500 });
    }

    // Fetch only published entries for the user
    const entries = await prisma.entry.findMany({
      where: {
        ownerId: session.user.id,
        statusId: publishedStatus.id
      },
      include: {
        entryProps: true,
        entrySecurity: true,
        entryMoods: {
          include: {
            mood: true
          }
        },
        status: true
      },
      orderBy: {
        updatedDate: 'desc'
      }
    });

    // Transform the data to match the expected format
    const transformedEntries = entries.map(entry => ({
      id: entry.id,
      title: entry.entryProps?.title || '',
      content: entry.entryProps?.content || '',
      sat: entry.entryProps?.sat || 5,
      wordcount: entry.entryProps?.wordcount || 0,
      charcount: entry.entryProps?.charcount || 0,
      mood: entry.entryMoods[0]?.mood?.name || '',
      createdDate: entry.createdDate.toISOString(),
      updatedDate: entry.updatedDate.toISOString(),
      publishedDate: entry.publishedDate ? entry.publishedDate.toISOString() : null,
      status: entry.status.status,
      isPrivate: entry.entrySecurity?.isPrivate || false
    }));

    return NextResponse.json({
      success: true,
      entries: transformedEntries
    });

  } catch (error) {
    console.error('Fetch entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
} 