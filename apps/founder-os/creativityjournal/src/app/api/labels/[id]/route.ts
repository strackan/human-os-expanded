import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const labelId = parseInt(params.id);
    if (isNaN(labelId)) {
      return NextResponse.json({ error: 'Invalid label ID' }, { status: 400 });
    }

    // Check if the label exists
    const existingLabel = await prisma.label.findUnique({
      where: {
        id: labelId,
      },
    });

    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 });
    }

    // Check if the label is used by any snippets
    const snippetCount = await prisma.entrySnippets.count({
      where: {
        labelId: labelId,
      },
    });

    if (snippetCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete label. It is used by ${snippetCount} snippet(s).` 
      }, { status: 409 });
    }

    await prisma.label.delete({
      where: {
        id: labelId,
      },
    });

    return NextResponse.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 