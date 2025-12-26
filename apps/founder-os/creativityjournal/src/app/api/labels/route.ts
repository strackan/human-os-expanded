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

    const labels = await prisma.label.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
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
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    // Check if label with same name already exists
    const existingLabel = await prisma.label.findFirst({
      where: {
        name: name,
      },
    });

    if (existingLabel) {
      return NextResponse.json({ error: 'Label with this name already exists' }, { status: 409 });
    }

    const newLabel = await prisma.label.create({
      data: {
        name,
        color: color.replace('#', ''), // Remove # from hex color
      },
    });

    return NextResponse.json(newLabel);
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 