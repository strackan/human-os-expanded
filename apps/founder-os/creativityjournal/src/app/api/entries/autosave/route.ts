import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
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
    const { title, content, sat, wordcount, charcount, moodId, entryId } = await request.json();

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    // Verify the entry belongs to the user
    const existingEntry = await prisma.entry.findFirst({
      where: {
        id: entryId,
        ownerId: user.id
      }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Update entry props (auto-save doesn't update mood to avoid conflicts)
    await prisma.entryProps.upsert({
      where: { entryId },
      update: {
        title: title || '',
        content: content || '',
        sat: sat || 5,
        wordcount: wordcount || 0,
        charcount: charcount || 0
      },
      create: {
        entryId,
        title: title || '',
        content: content || '',
        sat: sat || 5,
        wordcount: wordcount || 0,
        charcount: charcount || 0
      }
    });

    // Update entry timestamp
    await prisma.entry.update({
      where: { id: entryId },
      data: { updatedDate: new Date() }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    return NextResponse.json({ error: 'Failed to auto-save' }, { status: 500 });
  }
} 