import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const entryId = parseInt(params.id);
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
        status: true
      }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Only allow archiving of drafts and published entries
    if (entry.status.status !== 'Draft' && entry.status.status !== 'Published') {
      return NextResponse.json({ 
        error: 'Only draft and published entries can be archived' 
      }, { status: 400 });
    }

    // Get the archived status ID
    const archivedStatus = await prisma.entryStatus.findFirst({
      where: { status: 'Archived' }
    });

    if (!archivedStatus) {
      return NextResponse.json({ 
        error: 'Archived status not found' 
      }, { status: 500 });
    }

    // Update the entry status to archived
    const updatedEntry = await prisma.entry.update({
      where: { id: entryId },
      data: {
        statusId: archivedStatus.id,
        updatedDate: new Date()
      },
      include: {
        status: true,
        entryProps: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Entry archived successfully',
      entry: {
        id: updatedEntry.id,
        status: updatedEntry.status.status,
        title: updatedEntry.entryProps?.title || 'Untitled Entry',
        updatedDate: updatedEntry.updatedDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Archive entry error:', error);
    return NextResponse.json({ 
      error: 'Failed to archive entry' 
    }, { status: 500 });
  }
} 