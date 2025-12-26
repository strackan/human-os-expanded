import { NextRequest, NextResponse } from 'next/server';
import { getCustomSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const statusId = searchParams.get('statusId');
    const priorityId = searchParams.get('priorityId');
    const entryId = searchParams.get('entryId');

    const where: any = {};
    
    if (projectId) where.projectId = parseInt(projectId);
    if (statusId) where.taskStatusId = parseInt(statusId);
    if (priorityId) where.taskPriorityId = parseInt(priorityId);
    if (entryId) where.entryId = parseInt(entryId);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        taskStatus: true,
        taskPriority: true,
        project: true,
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

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task, description, duedate, taskStatusId, taskPriorityId, projectId, entryId } = body;

    if (!task) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        task,
        description: description || null,
        duedate: duedate ? new Date(duedate) : null,
        taskStatusId: taskStatusId || 1, // Default to "To Do"
        taskPriorityId: taskPriorityId || null,
        projectId: projectId ? parseInt(projectId) : null,
        entryId: entryId ? parseInt(entryId) : null,
      },
      include: {
        taskStatus: true,
        taskPriority: true,
        project: true,
        entry: {
          include: {
            entryProps: true,
          },
        },
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 