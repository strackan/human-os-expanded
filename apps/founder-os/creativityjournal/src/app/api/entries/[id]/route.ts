import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session token from cookies (custom session validation)
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the session and user
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const entryId = parseInt(id);

    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    // Check if the entry exists and belongs to the user
    const entry = await prisma.entry.findFirst({
      where: {
        id: entryId,
        ownerId: session.user.id
      },
      include: {
        status: true,
        entryProps: true
      }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Only allow deleting drafts and archived entries
    if (entry.status.status !== 'Draft' && entry.status.status !== 'Archived') {
      return NextResponse.json({ 
        error: 'Only draft and archived entries can be deleted' 
      }, { status: 400 });
    }

    // Delete the entry and all related data
    await prisma.entry.delete({
      where: { id: entryId }
    });

    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully',
      deletedEntry: {
        id: entry.id,
        title: entry.entryProps?.title || 'Untitled Entry',
        status: entry.status.status
      }
    });

  } catch (error) {
    console.error('Delete entry error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = parseInt(id);
    
    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    // Get the session token from cookies (custom session validation)
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the session and user
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if the entry exists and belongs to the user
    const entry = await prisma.entry.findFirst({
      where: {
        id: entryId,
        ownerId: session.user.id
      },
      include: {
        entryProps: true,
        entrySecurity: true,
        entryMoods: {
          include: {
            mood: true
          }
        },
        entryUserMoods: {
          include: {
            userMood: true
          }
        },
        status: true
      }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Combine global mood IDs and user mood IDs
    const globalMoodIds = entry.entryMoods.map(em => em.moodId);
    const userMoodIds = entry.entryUserMoods.map(eum => eum.userMoodId);
    const allMoodIds = [...globalMoodIds, ...userMoodIds];

    // Combine mood data from both global and user moods
    const globalMoods = entry.entryMoods.map(em => ({
      id: em.mood.id,
      name: em.mood.name,
      type: 'global'
    }));
    const userMoods = entry.entryUserMoods.map(eum => ({
      id: eum.userMood.id,
      name: eum.userMood.moodName,
      type: 'user'
    }));
    const allMoods = [...globalMoods, ...userMoods];

    return NextResponse.json({ 
      success: true, 
      id: entry.id,
      subject: entry.entryProps?.title || '',
      content: entry.entryProps?.content || '',
      moodIds: allMoodIds,
      moods: allMoods,
      moodContext: entry.entryProps?.moodContext || '',
      satisfaction: entry.entryProps?.sat || 5,
      wordCount: entry.entryProps?.wordcount || 0,
      charCount: entry.entryProps?.charcount || 0,
      status: entry.status.status,
      statusId: entry.statusId,
      createdDate: entry.createdDate,
      updatedDate: entry.updatedDate,
      publishedDate: entry.publishedDate,
      isPrivate: entry.entrySecurity?.isPrivate || false,
      hasBreakGlass: !!(entry.entrySecurity?.breakGlassCode && entry.entrySecurity.breakGlassExpires && entry.entrySecurity.breakGlassExpires > new Date())
    });

  } catch (error) {
    console.error('Error checking entry:', error);
    return NextResponse.json({ error: 'Error checking entry' }, { status: 500 });
  }
} 