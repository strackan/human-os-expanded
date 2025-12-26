import { NextRequest, NextResponse } from 'next/server';
import { getCustomSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskStatuses = await prisma.taskStatus.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    return NextResponse.json(taskStatuses);
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 