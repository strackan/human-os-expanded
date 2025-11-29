/**
 * Workflow Execution Restart API
 *
 * POST /api/workflows/executions/[id]/restart
 * - Resets workflow execution back to the beginning
 * - Clears all progress, step states, and persisted data
 * - Used for emergency restart when workflow gets stuck
 */

import { NextRequest, NextResponse } from 'next/server';
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

    console.log(`[API] Restarting workflow execution: ${executionId}`);

    // Reset the workflow execution to initial state
    const { error: updateError } = await supabase
      .from('workflow_executions')
      .update({
        status: 'in_progress',
        current_step: 0,
        completed_at: null,
        // Clear all review-related fields
        review_status: null,
        reviewer_id: null,
        review_requested_at: null,
        review_reason: null,
        review_completed_at: null,
        review_iteration: 0,
        review_rejection_history: null,
        // Clear skip/wake trigger fields
        skip_trigger_fired_at: null,
        skip_fired_trigger_type: null,
        skip_fired_trigger_reason: null,
        skip_last_evaluated_at: null,
        // Clear escalate trigger fields
        escalate_trigger_fired_at: null,
        escalate_fired_trigger_type: null,
        escalate_fired_trigger_reason: null,
        escalate_last_evaluated_at: null,
        // Update timestamp
        updated_at: new Date().toISOString(),
      })
      .eq('id', executionId);

    if (updateError) {
      console.error('[API] Error resetting workflow execution:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset workflow execution' },
        { status: 500 }
      );
    }

    // Delete all step executions for this workflow
    const { error: deleteStepsError } = await supabase
      .from('workflow_step_executions')
      .delete()
      .eq('workflow_execution_id', executionId);

    if (deleteStepsError) {
      console.error('[API] Error deleting step executions:', deleteStepsError);
      // Don't fail the whole operation, just log it
    }

    // Delete all state snapshots for this workflow
    const { error: deleteSnapshotsError } = await supabase
      .from('workflow_state_snapshots')
      .delete()
      .eq('execution_id', executionId);

    if (deleteSnapshotsError) {
      console.error('[API] Error deleting state snapshots:', deleteSnapshotsError);
      // Don't fail the whole operation, just log it
    }

    // Delete any triggers associated with this workflow
    const triggerTables = [
      'workflow_wake_triggers',
      'workflow_skip_triggers',
      'workflow_review_triggers',
      'workflow_escalate_triggers'
    ];

    for (const table of triggerTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('workflow_execution_id', executionId);

      if (error) {
        console.error(`[API] Error deleting from ${table}:`, error);
        // Don't fail the whole operation, just log it
      }
    }

    console.log(`[API] Successfully restarted workflow execution: ${executionId}`);

    return NextResponse.json({
      success: true,
      message: 'Workflow restarted successfully',
      executionId
    });

  } catch (error: any) {
    console.error('[API] Error in restart endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
