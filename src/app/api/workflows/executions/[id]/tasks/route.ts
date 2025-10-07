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
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const executionId = resolvedParams.id;

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
