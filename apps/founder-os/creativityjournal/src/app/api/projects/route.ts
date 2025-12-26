import { NextRequest, NextResponse } from 'next/server';
import { getCustomSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      include: {
        projectStatus: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdDate: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create projects
    // Both admin and author can create projects
    const userRole = session.user.role || 'author';
    if (userRole !== ROLES.ADMIN && userRole !== ROLES.AUTHOR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, projectStatusId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description: description || null,
        projectStatusId: projectStatusId || 1, // Default to "Active"
      },
      include: {
        projectStatus: true,
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 