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

    // Get the "Draft" status ID
    const draftStatus = await prisma.entryStatus.findFirst({
      where: { status: 'Draft' }
    });

    if (!draftStatus) {
      return NextResponse.json({ error: 'Draft status not found' }, { status: 500 });
    }

    // Check for active draft
    const draftEntry = await prisma.entry.findFirst({
      where: {
        ownerId: session.user.id,
        statusId: draftStatus.id
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
      hasDraft: !!draftEntry,
      draft: draftEntry ? {
        id: draftEntry.id,
        title: draftEntry.entryProps?.title || '',
        content: draftEntry.entryProps?.content || '',
        sat: draftEntry.entryProps?.sat || 5,
        wordcount: draftEntry.entryProps?.wordcount || 0,
        charcount: draftEntry.entryProps?.charcount || 0,
        createdDate: draftEntry.createdDate.toISOString(),
        updatedDate: draftEntry.updatedDate.toISOString()
      } : null
    });

  } catch (error) {
    console.error('Check draft error:', error);
    return NextResponse.json({ error: 'Failed to check draft' }, { status: 500 });
  }
} 