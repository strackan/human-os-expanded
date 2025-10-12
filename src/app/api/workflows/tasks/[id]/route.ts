/**
 * Task CRUD API
 *
 * GET /api/workflows/tasks/[id]
 * - Get task by ID
 *
 * PATCH /api/workflows/tasks/[id]
 * - Update task (complete, skip, update status)
 *
 * Phase 3.3: Task State Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTaskService } from '@/lib/services/WorkflowTaskService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get task
    const task = await WorkflowTaskService.getTask(taskId, supabase);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Parse request body
    const body = await request.json();
    const { action, skipReason, title, completed, priority, dueDate, assignedTo } = body;

    let task;

    // Handle action-based updates (workflow actions)
    if (action) {
      switch (action) {
        case 'complete':
          task = await WorkflowTaskService.completeTask(taskId, supabase);
          return NextResponse.json({
            task,
            message: 'Task completed successfully'
          });

        case 'skip':
          if (!skipReason) {
            return NextResponse.json(
              { error: 'skipReason is required for skip action' },
              { status: 400 }
            );
          }
          task = await WorkflowTaskService.skipTask(taskId, skipReason, supabase);
          return NextResponse.json({
            task,
            message: 'Task skipped successfully'
          });

        default:
          return NextResponse.json(
            { error: `Invalid action: ${action}. Valid actions are: complete, skip` },
            { status: 400 }
          );
      }
    }

    // Handle field-based updates (general updates)
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (completed !== undefined) {
      updates.completed = completed;
      updates.completed_at = completed ? new Date().toISOString() : null;
    }
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (assignedTo !== undefined) updates.assigned_to = assignedTo;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update provided' },
        { status: 400 }
      );
    }

    // Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('workflow_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError || !updatedTask) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      task: updatedTask,
      message: 'Task updated successfully'
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from('workflow_tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete task API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
