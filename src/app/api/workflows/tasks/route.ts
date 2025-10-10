/**
 * Workflow Tasks API
 *
 * GET  /api/workflows/tasks - Get tasks for current user (with filters)
 * POST /api/workflows/tasks - Create a new task
 *
 * Phase 2.3: Task Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

// =====================================================
// GET - Fetch tasks for current user
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, snoozed, in_progress, completed, skipped
    const customerId = searchParams.get('customerId');
    const workflowExecutionId = searchParams.get('workflowExecutionId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user (skip auth check in demo mode)
    let user = null;
    if (!demoMode && !authBypassEnabled) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      user = authUser;
    }

    // Build query
    let query = supabase
      .from('workflow_tasks')
      .select(`
        *,
        customer:customers(id, name),
        assigned_user:profiles!workflow_tasks_assigned_to_fkey(id, full_name, email),
        created_user:profiles!workflow_tasks_created_by_fkey(id, full_name, email),
        workflow_execution:workflow_executions!workflow_tasks_workflow_execution_id_fkey(id, status),
        artifacts:workflow_task_artifacts(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Only filter by assigned_to if we have a user (not in demo mode)
    if (user) {
      query = query.eq('assigned_to', user.id);
    }

    // Apply filters
    if (status) {
      if (status === 'active') {
        // Active tasks: pending, snoozed, or in_progress
        query = query.in('status', ['pending', 'snoozed', 'in_progress']);
      } else {
        query = query.eq('status', status);
      }
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (workflowExecutionId) {
      query = query.eq('workflow_execution_id', workflowExecutionId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('[Tasks API] Query error:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    // Calculate derived fields
    const enrichedTasks = tasks.map(task => {
      let daysUntilDeadline = null;
      if (task.max_snooze_date) {
        const deadline = new Date(task.max_snooze_date);
        const now = new Date();
        daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      let isOverdue = false;
      if (task.snoozed_until) {
        isOverdue = new Date(task.snoozed_until) < new Date();
      }

      return {
        ...task,
        daysUntilDeadline,
        isOverdue
      };
    });

    return NextResponse.json({
      tasks: enrichedTasks,
      total: enrichedTasks.length
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - Create a new task
// =====================================================

export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const {
      workflowExecutionId,
      stepExecutionId,
      customerId,
      taskType,
      action,
      description,
      priority = 'medium',
      taskCategory = 'csm_manual',
      assignedTo,
      metadata = {}
    } = body;

    // Validate required fields
    if (!customerId || !taskType || !action || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, taskType, action, description' },
        { status: 400 }
      );
    }

    // Create task
    const { data: task, error } = await supabase
      .from('workflow_tasks')
      .insert({
        workflow_execution_id: workflowExecutionId || null,
        step_execution_id: stepExecutionId || null,
        original_workflow_execution_id: workflowExecutionId || null,
        customer_id: customerId,
        assigned_to: assignedTo || user.id, // Assign to self if not specified
        created_by: user.id,
        task_type: taskType,
        task_category: taskCategory,
        action,
        description,
        priority,
        status: 'pending',
        metadata
      })
      .select(`
        *,
        customer:customers(id, name),
        assigned_user:profiles!workflow_tasks_assigned_to_fkey(id, full_name, email),
        workflow_execution:workflow_executions!workflow_tasks_workflow_execution_id_fkey(id, status)
      `)
      .single();

    if (error) {
      console.error('[Tasks API] Insert error:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }

    // Create notification for assigned user (if different from creator)
    if (assignedTo && assignedTo !== user.id) {
      await supabase.from('in_product_notifications').insert({
        user_id: assignedTo,
        notification_type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You've been assigned: ${action}`,
        priority: priority === 'urgent' ? 'urgent' : 'normal',
        link_url: `/tasks/${task.id}`,
        link_text: 'View Task',
        task_id: task.id,
        workflow_execution_id: workflowExecutionId || null
      });
    }

    return NextResponse.json({
      task,
      message: 'Task created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}
