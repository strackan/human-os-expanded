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
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

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
      .eq('id', resolvedParams.id)
      .single();

    if (!execution || execution.customer?.company_id !== profile.company_id) {
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
    const { data: existingExecution } = await supabase
      .from('workflow_executions')
      .select('*, customer:customers!workflow_executions_customer_id_fkey(id, company_id)')
      .eq('id', resolvedParams.id)
      .single();

    if (!existingExecution || existingExecution.customer?.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Workflow execution not found' },
        { status: 404 }
      );
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
