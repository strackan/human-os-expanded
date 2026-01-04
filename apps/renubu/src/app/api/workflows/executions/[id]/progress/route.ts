/**
 * Workflow Execution Progress API
 *
 * POST /api/workflows/executions/[id]/progress
 * - Record workflow progression (step changes, branch selections)
 * - Update execution state
 * - Validate transitions
 *
 * Phase 3.2: Backend Workflow Execution & State Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowExecutionService } from '@/lib/services/WorkflowExecutionService';
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

    // Parse request body
    const body = await request.json();
    const {
      stepId,
      stepIndex,
      stepTitle,
      stepType,
      branchValue,
      action,
      metadata
    } = body;

    // Validate required fields
    if (!stepId || stepIndex === undefined || !stepTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: stepId, stepIndex, stepTitle' },
        { status: 400 }
      );
    }

    // Get current execution state
    const execution = await WorkflowExecutionService.getExecution(executionId, supabase);

    if (!execution) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    const responseData: Record<string, any> = {
      success: true,
      executionId
    };

    switch (action) {
      case 'completeStep':
        // Mark step as completed
        await WorkflowExecutionService.completeStep({
          executionId,
          stepId
        }, supabase);

        responseData.stepCompleted = true;

        // Check if this is the last step
        if (stepIndex === execution.total_steps - 1) {
          await WorkflowExecutionService.completeWorkflow(executionId, supabase);
          responseData.workflowCompleted = true;
        } else {
          responseData.nextStepIndex = stepIndex + 1;
        }
        break;

      case 'skipStep':
        // Mark step as skipped
        await WorkflowExecutionService.skipStep({
          executionId,
          stepId,
          stepIndex,
          stepTitle
        }, supabase);

        responseData.stepSkipped = true;

        // Check if this is the last step
        if (stepIndex === execution.total_steps - 1) {
          await WorkflowExecutionService.completeWorkflow(executionId, supabase);
          responseData.workflowCompleted = true;
        } else {
          responseData.nextStepIndex = stepIndex + 1;
        }
        break;

      case 'recordBranch':
      default:
        // Record branch selection and update step progress
        await WorkflowExecutionService.updateStepProgress({
          executionId,
          stepId,
          stepIndex,
          stepTitle,
          stepType,
          branchValue,
          metadata
        }, supabase);

        responseData.branchRecorded = true;
        responseData.branchValue = branchValue;
        break;
    }

    // Get updated execution state
    const updatedExecution = await WorkflowExecutionService.getExecution(executionId, supabase);

    responseData.execution = updatedExecution;

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error updating workflow progress:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workflow progress' },
      { status: 500 }
    );
  }
}
