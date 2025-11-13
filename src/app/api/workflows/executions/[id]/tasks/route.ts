/**
 * Workflow Execution Tasks API
 *
 * POST /api/workflows/executions/[id]/tasks
 * - Create a new task within a workflow execution
 *
 * Phase 3.3: Task State Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTaskService, CreateTaskParams } from '@/lib/services/WorkflowTaskService';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const executionId = resolvedParams.id;

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

    // Verify execution ownership via customer
    const { data: execution } = await supabase
      .from('workflow_executions')
      .select('*, customer:customers!workflow_executions_customer_id_fkey(id, company_id)')
      .eq('id', executionId)
      .single();

    if (!execution || execution.customer?.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      stepExecutionId,
      originalWorkflowExecutionId,
      customerId,
      assignedTo,
      recommendationId,
      taskType,
      taskCategory,
      action,
      description,
      priority,
      metadata
    } = body;

    // Validate required fields
    if (!customerId || !assignedTo || !taskType || !action || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, assignedTo, taskType, action, description' },
        { status: 400 }
      );
    }

    // Verify customer in request matches execution's customer and belongs to user's company
    const { data: customer } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('id', customerId)
      .single();

    if (!customer || customer.company_id !== profile.company_id || customerId !== execution.customer_id) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create task
    const taskParams: CreateTaskParams = {
      workflowExecutionId: executionId,
      stepExecutionId,
      originalWorkflowExecutionId,
      customerId,
      assignedTo,
      createdBy: user.id,
      recommendationId,
      taskType,
      taskCategory,
      action,
      description,
      priority: priority || 'medium',
      metadata: metadata || {}
    };

    const task = await WorkflowTaskService.createTask(taskParams, supabase);

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
