import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth';
import { prisma } from '../../../../lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { snippet, description, startIndex, endIndex, highlightColor, labelId } = body;

    // Verify the snippet belongs to the user
    const existingSnippet = await prisma.entrySnippets.findFirst({
      where: {
        id: parseInt(params.id),
        entry: {
          owner: {
            email: session.user.email,
          },
        },
      },
    });

    if (!existingSnippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    const updatedSnippet = await prisma.entrySnippets.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        snippet: snippet || existingSnippet.snippet,
        description: description !== undefined ? description : existingSnippet.description,
        startIndex: startIndex !== undefined ? startIndex : existingSnippet.startIndex,
        endIndex: endIndex !== undefined ? endIndex : existingSnippet.endIndex,
        highlightColor: highlightColor || existingSnippet.highlightColor,
        labelId: labelId ? parseInt(labelId) : null,
      },
      include: {
        label: true,
      },
    });

    return NextResponse.json(updatedSnippet);
  } catch (error) {
    console.error('Error updating snippet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the snippet belongs to the user
    const existingSnippet = await prisma.entrySnippets.findFirst({
      where: {
        id: parseInt(params.id),
        entry: {
          owner: {
            email: session.user.email,
          },
        },
      },
    });

    if (!existingSnippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    await prisma.entrySnippets.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    return NextResponse.json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 