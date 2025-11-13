/**
 * Workflow Tasks API
 *
 * GET  /api/workflows/tasks - Get tasks for current user (with filters)
 * POST /api/workflows/tasks - Create a new task
 *
 * Phase 2.3: Task Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { validateQueryParams, validateRequest, CreateWorkflowTaskSchema, z } from '@/lib/validation';

// Query schema for GET endpoint
const WorkflowTaskQuerySchema = z.object({
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  workflowExecutionId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// =====================================================
// GET - Fetch tasks for current user
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const validation = validateQueryParams(request, WorkflowTaskQuerySchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { status, customerId, workflowExecutionId, limit = 50 } = validation.data;

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

    // Build query - join with customers to filter by company_id
    let query = supabase
      .from('workflow_tasks')
      .select(`
        *,
        customer:customers!workflow_tasks_customer_id_fkey(id, name, company_id),
        assigned_user:profiles!workflow_tasks_assigned_to_fkey(id, full_name, email),
        created_user:profiles!workflow_tasks_created_by_fkey(id, full_name, email),
        workflow_execution:workflow_executions!workflow_tasks_workflow_execution_id_fkey(id, status),
        artifacts:workflow_task_artifacts(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by assigned_to user
    query = query.eq('assigned_to', user.id);

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

    // Filter tasks to only those whose customer belongs to user's company
    const filteredTasks = tasks.filter(task => {
      const customer = Array.isArray(task.customer) ? task.customer[0] : task.customer;
      return customer?.company_id === profile.company_id;
    });

    // Calculate derived fields
    const enrichedTasks = filteredTasks.map(task => {
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

// Extended schema for this endpoint
const ExtendedWorkflowTaskSchema = CreateWorkflowTaskSchema.extend({
  stepExecutionId: z.string().uuid().optional(),
  taskCategory: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, ExtendedWorkflowTaskSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

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
      metadata = {},
    } = validation.data;

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

    // Verify customer ownership
    const { data: customer } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('id', customerId)
      .single();

    if (!customer || customer.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
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
