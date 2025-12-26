import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, entryIds } = body;

    if (!action || !entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request. Action and entryIds are required' }, { status: 400 });
    }

    // Validate that all entries belong to the user
    const userEntries = await prisma.entry.findMany({
      where: {
        id: { in: entryIds },
        ownerId: session.user.id
      },
      include: {
        status: true,
        entryProps: true
      }
    });

    if (userEntries.length !== entryIds.length) {
      return NextResponse.json({ error: 'Some entries not found or not owned by user' }, { status: 404 });
    }

    let results = [];

    if (action === 'delete') {
      // Only allow deleting drafts and archived entries
      const invalidEntries = userEntries.filter(entry => 
        entry.status.status !== 'Draft' && entry.status.status !== 'Archived'
      );

      if (invalidEntries.length > 0) {
        return NextResponse.json({ 
          error: 'Only draft and archived entries can be deleted',
          invalidEntries: invalidEntries.map(e => ({ id: e.id, status: e.status.status }))
        }, { status: 400 });
      }

      // Delete all valid entries
      await prisma.entry.deleteMany({
        where: { id: { in: entryIds } }
      });

      results = userEntries.map(entry => ({
        id: entry.id,
        title: entry.entryProps?.title || 'Untitled Entry',
        action: 'deleted'
      }));

    } else if (action === 'archive') {
      // Get the "Archived" status ID
      const archivedStatus = await prisma.entryStatus.findFirst({
        where: { status: 'Archived' }
      });

      if (!archivedStatus) {
        return NextResponse.json({ error: 'Archived status not found' }, { status: 500 });
      }

      // Only allow archiving drafts and published entries
      const invalidEntries = userEntries.filter(entry => 
        entry.status.status !== 'Draft' && entry.status.status !== 'Published'
      );

      if (invalidEntries.length > 0) {
        return NextResponse.json({ 
          error: 'Only draft and published entries can be archived',
          invalidEntries: invalidEntries.map(e => ({ id: e.id, status: e.status.status }))
        }, { status: 400 });
      }

      // Archive all valid entries
      await prisma.entry.updateMany({
        where: { id: { in: entryIds } },
        data: { 
          statusId: archivedStatus.id,
          updatedDate: new Date()
        }
      });

      results = userEntries.map(entry => ({
        id: entry.id,
        title: entry.entryProps?.title || 'Untitled Entry',
        action: 'archived'
      }));

    } else {
      return NextResponse.json({ error: 'Invalid action. Supported actions: delete, archive' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${results.length} entr${results.length === 1 ? 'y' : 'ies'}`,
      results
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
} 