/**
 * Workflow Executions API
 *
 * POST /api/workflows/executions
 * - Create a new workflow execution
 *
 * Phase 3.2: Backend Workflow Execution & State Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowExecutionService } from '@/lib/services/WorkflowExecutionService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

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
      workflowConfigId,
      workflowName,
      workflowType,
      customerId,
      totalSteps
    } = body;

    // Validate required fields
    if (!workflowConfigId || !workflowName || !customerId || !totalSteps) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowConfigId, workflowName, customerId, totalSteps' },
        { status: 400 }
      );
    }

    // Create workflow execution
    const execution = await WorkflowExecutionService.createExecution({
      workflowConfigId,
      workflowName,
      workflowType,
      customerId,
      userId: user.id,
      totalSteps
    }, supabase);

    return NextResponse.json({
      execution,
      message: 'Workflow execution created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating workflow execution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workflow execution' },
      { status: 500 }
    );
  }
}
