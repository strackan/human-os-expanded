/**
 * Workflow Step API
 *
 * PUT /api/workflows/executions/[id]/steps
 * - Update step data and status
 *
 * Phase 3.4: Workflow Execution Framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function PUT(
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
    const { stepNumber, stepData, status, artifacts } = body;

    if (stepNumber === undefined) {
      return NextResponse.json(
        { error: 'stepNumber is required' },
        { status: 400 }
      );
    }

    // Map to existing table schema
    const stepId = `step-${stepNumber}`;
    const stepIndex = stepNumber - 1; // Convert to 0-based index

    // Check if step execution exists
    const { data: existing } = await supabase
      .from('workflow_step_executions')
      .select('id')
      .eq('workflow_execution_id', executionId)
      .eq('step_index', stepIndex)
      .single();

    let stepExecution;

    if (existing) {
      // Update existing step execution
      const { data, error } = await supabase
        .from('workflow_step_executions')
        .update({
          ...(stepData && { metadata: { ...stepData, artifacts } }),
          ...(status && { status }),
          ...(status === 'completed' && { completed_at: new Date().toISOString() }),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update step: ${error.message}`);
      }

      stepExecution = data;
    } else {
      // Create new step execution
      const { data, error } = await supabase
        .from('workflow_step_executions')
        .insert({
          workflow_execution_id: executionId,
          step_id: stepId,
          step_index: stepIndex,
          step_title: `Step ${stepNumber}`,
          step_type: 'generic',
          status: status || 'in_progress',
          metadata: { ...stepData, artifacts },
          started_at: new Date().toISOString(),
          ...(status === 'completed' && { completed_at: new Date().toISOString() })
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create step: ${error.message}`);
      }

      stepExecution = data;
    }

    return NextResponse.json({
      stepExecution,
      message: 'Step updated successfully'
    });

  } catch (error) {
    console.error('Error updating step:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update step' },
      { status: 500 }
    );
  }
}
