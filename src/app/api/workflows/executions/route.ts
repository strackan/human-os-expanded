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
import { validateRequest, CreateWorkflowExecutionSchema, z } from '@/lib/validation';

// Extended schema for this endpoint (includes additional fields)
const ExtendedWorkflowExecutionSchema = CreateWorkflowExecutionSchema.extend({
  workflowName: z.string().min(1),
  workflowType: z.string().optional(),
  totalSteps: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, ExtendedWorkflowExecutionSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const {
      workflowConfigId,
      workflowName,
      workflowType,
      customerId,
      totalSteps
    } = validation.data;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user (skip auth check in demo mode)
    let userId: string;
    if (demoMode || authBypassEnabled) {
      // Use demo user ID in demo mode
      userId = '00000000-0000-0000-0000-000000000000'; // Demo user placeholder
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = user.id;
    }

    // Create workflow execution
    const execution = await WorkflowExecutionService.createExecution({
      workflowConfigId,
      workflowName,
      workflowType,
      customerId,
      userId: userId,
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
