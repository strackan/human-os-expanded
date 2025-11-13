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
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Authenticate user
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Get task with customer relationship
    const { data: task } = await supabase
      .from('workflow_tasks')
      .select('*, customer:customers!workflow_tasks_customer_id_fkey(id, company_id)')
      .eq('id', taskId)
      .single();

    if (!task || task.customer?.company_id !== profile.company_id) {
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

    // Authenticate user
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Verify task ownership
    const { data: existingTask } = await supabase
      .from('workflow_tasks')
      .select('*, customer:customers!workflow_tasks_customer_id_fkey(id, company_id)')
      .eq('id', taskId)
      .single();

    if (!existingTask || existingTask.customer?.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

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

    // Authenticate user
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 403 }
      );
    }

    // Verify task ownership before deletion
    const { data: task } = await supabase
      .from('workflow_tasks')
      .select('*, customer:customers!workflow_tasks_customer_id_fkey(id, company_id)')
      .eq('id', taskId)
      .single();

    if (!task || task.customer?.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
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
