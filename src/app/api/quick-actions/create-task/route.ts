import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, dueDate, priority } = body;

    console.log('[Quick Action] Create Task:', { title, description, dueDate, priority });

    // Demo mode: Just return success without actually creating task
    // In production, this would:
    // 1. Create a record in the tasks table
    // 2. Assign to appropriate user
    // 3. Send notifications if needed

    return NextResponse.json({
      success: true,
      message: 'Task created successfully (demo mode)',
      data: {
        id: `task-${Date.now()}`,
        title,
        description,
        dueDate,
        priority,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Quick Action] Create Task Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
