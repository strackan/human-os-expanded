/**
 * Workflow Step API
 *
 * GET /api/workflows/executions/[id]/steps
 * - Get all step executions for a workflow execution
 *
 * PUT /api/workflows/executions/[id]/steps
 * - Update step data and status
 *
 * Phase 3.4: Workflow Execution Framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

// =====================================================
// GET - Get Step Executions
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const executionId = resolvedParams.id;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';

    // Always use server client for auth check first
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use appropriate client for database queries
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : authSupabase;

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

    // Get step executions
    const { data: stepExecutions, error: stepsError } = await supabase
      .from('workflow_step_executions')
      .select('*')
      .eq('workflow_execution_id', executionId)
      .order('step_index', { ascending: true });

    if (stepsError) {
      console.error('[Steps API] Get steps error:', stepsError);
      return NextResponse.json(
        { error: 'Failed to fetch step executions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stepExecutions: stepExecutions || []
    });

  } catch (error) {
    console.error('Error fetching step executions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch step executions' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT - Update Step Execution
// =====================================================

export async function PUT(
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

    // Use UPSERT to insert or update based on unique constraint (workflow_execution_id + step_id)
    const { data: stepExecution, error } = await supabase
      .from('workflow_step_executions')
      .upsert({
        workflow_execution_id: executionId,
        step_id: stepId,
        step_index: stepIndex,
        step_title: `Step ${stepNumber}`,
        step_type: 'generic',
        status: status || 'in_progress',
        metadata: { ...stepData, artifacts },
        started_at: new Date().toISOString(),
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'workflow_execution_id,step_id', // Match unique constraint
        ignoreDuplicates: false // Update on conflict
      })
      .select()
      .single();

    if (error) {
      console.error('[Steps API] Upsert error:', error);
      throw new Error(`Failed to save step: ${error.message}`);
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
