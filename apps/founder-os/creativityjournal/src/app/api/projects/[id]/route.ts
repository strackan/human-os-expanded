import { NextRequest, NextResponse } from 'next/server';
import { getCustomSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/roles';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        projectStatus: true,
        tasks: {
          include: {
            taskStatus: true,
            taskPriority: true,
          },
          orderBy: {
            createdDate: 'desc',
          },
        },
        entries: {
          include: {
            entryProps: true,
            status: true,
          },
          orderBy: {
            createdDate: 'desc',
          },
        },
        _count: {
          select: {
            tasks: true,
            entries: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage projects
    // Both admin and author can manage projects
    const userRole = session.user.role || 'author';
    if (userRole !== ROLES.ADMIN && userRole !== ROLES.AUTHOR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, projectStatusId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        description: description || null,
        projectStatusId: projectStatusId || existingProject.projectStatusId,
      },
      include: {
        projectStatus: true,
        _count: {
          select: {
            tasks: true,
            entries: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomSession(request);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage projects
    // Both admin and author can manage projects
    const userRole = session.user.role || 'author';
    if (userRole !== ROLES.ADMIN && userRole !== ROLES.AUTHOR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const projectId = parseInt(params.id);

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            tasks: true,
            entries: true,
          },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project has associated tasks or entries
    if (existingProject._count.tasks > 0 || existingProject._count.entries > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete project with associated tasks or entries. Please remove or reassign them first.',
        details: {
          taskCount: existingProject._count.tasks,
          entryCount: existingProject._count.entries,
        }
      }, { status: 400 });
    }

    // Delete the project
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ 
      message: 'Project deleted successfully',
      deletedProject: {
        id: projectId,
        name: existingProject.name,
      }
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 