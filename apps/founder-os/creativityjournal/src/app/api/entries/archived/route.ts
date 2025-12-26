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

    // Get the "Archived" status ID
    const archivedStatus = await prisma.entryStatus.findFirst({
      where: { status: 'Archived' }
    });

    if (!archivedStatus) {
      return NextResponse.json({ error: 'Archived status not found' }, { status: 500 });
    }

    // Get all archived entries for the user
    const archivedEntries = await prisma.entry.findMany({
      where: {
        ownerId: session.user.id,
        statusId: archivedStatus.id
      },
      include: {
        entryProps: true
      },
      orderBy: {
        updatedDate: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      count: archivedEntries.length,
      entries: archivedEntries.map(entry => ({
        id: entry.id,
        title: entry.entryProps?.title || '',
        content: entry.entryProps?.content || '',
        sat: entry.entryProps?.sat || 5,
        wordcount: entry.entryProps?.wordcount || 0,
        charcount: entry.entryProps?.charcount || 0,
        createdDate: entry.createdDate.toISOString(),
        updatedDate: entry.updatedDate.toISOString(),
        archivedDate: entry.updatedDate.toISOString() // Use updatedDate as archived date
      }))
    });

  } catch (error) {
    console.error('Get archived entries error:', error);
    return NextResponse.json({ error: 'Failed to get archived entries' }, { status: 500 });
  }
} 