/**
 * Workflow Execution Detail API
 *
 * GET /api/workflows/executions/[id]
 * - Get workflow execution by ID with step history
 *
 * PUT /api/workflows/executions/[id]
 * - Update workflow execution (status, current_step)
 *
 * Phase 3.2: Backend Workflow Execution & State Tracking
 * Phase 3.4: Workflow Execution Framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowExecutionService } from '@/lib/services/WorkflowExecutionService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get workflow execution with step history
    const execution = await WorkflowExecutionService.getExecution(resolvedParams.id, supabase);

    if (!execution) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ execution });

  } catch (error) {
    console.error('Error fetching workflow execution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workflow execution' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user (skip auth check in demo mode)
    if (!demoMode && !authBypassEnabled) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const { status, currentStep } = body;

    // Update execution
    const { data, error } = await supabase
      .from('workflow_executions')
      .update({
        ...(status && { status }),
        ...(currentStep !== undefined && { current_step: currentStep }),
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update execution: ${error.message}`);
    }

    return NextResponse.json({
      execution: data,
      message: 'Workflow execution updated successfully'
    });

  } catch (error) {
    console.error('Error updating workflow execution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workflow execution' },
      { status: 500 }
    );
  }
}
