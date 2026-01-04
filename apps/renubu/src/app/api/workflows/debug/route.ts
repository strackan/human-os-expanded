/**
 * Debug API - Check workflow status in database
 * GET /api/workflows/debug?workflowId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get workflow with all relevant fields
    const { data: workflow, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) {
      return NextResponse.json({
        error: error.message,
        workflowId,
        found: false
      });
    }

    // Get count of snoozed workflows for this user
    const { data: snoozedWorkflows, error: snoozedError } = await supabase
      .from('workflow_executions')
      .select('id, status, user_id, wake_triggers')
      .eq('user_id', workflow.user_id)
      .eq('status', 'snoozed');

    return NextResponse.json({
      workflow: {
        id: workflow.id,
        status: workflow.status,
        user_id: workflow.user_id,
        wake_triggers: workflow.wake_triggers,
        trigger_fired_at: workflow.trigger_fired_at,
        last_evaluated_at: workflow.last_evaluated_at,
        created_at: workflow.created_at,
      },
      snoozedWorkflowsForUser: snoozedWorkflows,
      snoozedCount: snoozedWorkflows?.length || 0,
    });

  } catch (error) {
    console.error('[debug] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
