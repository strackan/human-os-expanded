import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (entryId) {
      // Fetch snippets for a specific entry
      const snippets = await prisma.entrySnippets.findMany({
        where: {
          entryId: parseInt(entryId),
          entry: {
            owner: {
              email: session.user.email,
            },
          },
        },
        include: {
          label: true,
        },
        orderBy: {
          createdDate: 'desc',
        },
      });

      return NextResponse.json(snippets);
    } else {
      // Fetch all snippets for the user
      const snippets = await prisma.entrySnippets.findMany({
        where: {
          entry: {
            owner: {
              email: session.user.email,
            },
          },
        },
        include: {
          label: true,
          entry: {
            include: {
              entryProps: true,
            },
          },
        },
        orderBy: {
          createdDate: 'desc',
        },
      });

      return NextResponse.json(snippets);
    }
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entryId, snippet, description, startIndex, endIndex, highlightColor, labelId } = body;

    if (!entryId || !snippet || startIndex === undefined || endIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the entry belongs to the user
    const entry = await prisma.entry.findFirst({
      where: {
        id: parseInt(entryId),
        owner: {
          email: session.user.email,
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const newSnippet = await prisma.entrySnippets.create({
      data: {
        entryId: parseInt(entryId),
        snippet,
        description: description || '',
        startIndex,
        endIndex,
        highlightColor: highlightColor || '#FFEB3B',
        labelId: labelId ? parseInt(labelId) : null,
      },
      include: {
        label: true,
      },
    });

    return NextResponse.json(newSnippet);
  } catch (error) {
    console.error('Error creating snippet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 