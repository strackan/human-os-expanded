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

    // Only allow restoring archived entries
    if (entry.status.status !== 'Archived') {
      return NextResponse.json({ 
        error: 'Only archived entries can be restored' 
      }, { status: 400 });
    }

    // Get the draft status ID
    const draftStatus = await prisma.entryStatus.findFirst({
      where: { status: 'Draft' }
    });

    if (!draftStatus) {
      return NextResponse.json({ 
        error: 'Draft status not found' 
      }, { status: 500 });
    }

    // Update the entry status to draft
    const updatedEntry = await prisma.entry.update({
      where: { id: entryId },
      data: {
        statusId: draftStatus.id,
        updatedDate: new Date()
      },
      include: {
        status: true,
        entryProps: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Entry restored successfully',
      entry: {
        id: updatedEntry.id,
        status: updatedEntry.status.status,
        title: updatedEntry.entryProps?.title || 'Untitled Entry',
        updatedDate: updatedEntry.updatedDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Restore entry error:', error);
    return NextResponse.json({ 
      error: 'Failed to restore entry' 
    }, { status: 500 });
  }
} 