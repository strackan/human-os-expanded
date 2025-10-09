/**
 * Actions Execute API
 *
 * POST /api/workflows/actions/execute
 * - Execute saved actions (snooze, skip, escalate, etc.)
 * - Returns action result and next step navigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

interface ActionResult {
  success: boolean;
  message: string;
  returnToStep?: string;
  data?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionId, workflowExecutionId, params = {} } = body;

    if (!actionId) {
      return NextResponse.json(
        { error: 'actionId is required' },
        { status: 400 }
      );
    }

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

    // Fetch saved action
    const { data: action, error: actionError } = await supabase
      .from('saved_actions')
      .select('*')
      .eq('action_id', actionId)
      .single();

    if (actionError || !action) {
      console.error('Error fetching action:', actionError);
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    // Execute action based on type
    let result: ActionResult;

    // Check if custom handler exists
    if (action.handler && action.handler.startsWith('code:')) {
      // Custom code handler (future implementation)
      result = {
        success: false,
        message: 'Custom code handlers not yet implemented'
      };
    } else {
      // Execute built-in action
      result = await executeBuiltInAction(action.action_type, params);
    }

    // Log execution
    await supabase.from('action_executions').insert({
      workflow_execution_id: workflowExecutionId || null,
      action_id: actionId,
      executed_by: user.id,
      params,
      result,
      success: result.success
    });

    return NextResponse.json({
      success: true,
      action: {
        id: action.id,
        actionId: action.action_id,
        actionType: action.action_type,
        label: action.action_label,
        description: action.description
      },
      result
    });

  } catch (error) {
    console.error('Error in execute action API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// Built-in Action Handlers
// =====================================================

async function executeBuiltInAction(
  actionType: string,
  params: Record<string, any>
): Promise<ActionResult> {
  switch (actionType) {
    case 'snooze':
      return executeSnooze(params);
    case 'skip':
      return executeSkip(params);
    case 'escalate':
      return executeEscalate(params);
    case 'schedule':
      return executeSchedule(params);
    default:
      return {
        success: false,
        message: `Unknown action type: ${actionType}`
      };
  }
}

async function executeSnooze(params: Record<string, any>): Promise<ActionResult> {
  const days = params.days || 7;
  const resumeDate = new Date();
  resumeDate.setDate(resumeDate.getDate() + days);

  return {
    success: true,
    message: `Workflow snoozed for ${days} days`,
    returnToStep: params.returnToStep,
    data: {
      days,
      resumeDate: resumeDate.toISOString(),
      reason: params.reason || 'User requested snooze'
    }
  };
}

async function executeSkip(params: Record<string, any>): Promise<ActionResult> {
  return {
    success: true,
    message: 'Step skipped',
    returnToStep: params.returnToStep,
    data: {
      reason: params.reason || 'User skipped step',
      skippedAt: new Date().toISOString()
    }
  };
}

async function executeEscalate(params: Record<string, any>): Promise<ActionResult> {
  const escalateTo = params.escalateTo || 'manager';

  return {
    success: true,
    message: `Workflow escalated to ${escalateTo}`,
    returnToStep: params.returnToStep,
    data: {
      escalatedTo: escalateTo,
      escalatedAt: new Date().toISOString(),
      reason: params.reason || 'User requested escalation',
      urgency: params.urgency || 'normal'
    }
  };
}

async function executeSchedule(params: Record<string, any>): Promise<ActionResult> {
  const scheduledDate = params.scheduledDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    success: true,
    message: 'Follow-up scheduled',
    returnToStep: params.returnToStep,
    data: {
      scheduledDate,
      scheduledAt: new Date().toISOString(),
      title: params.title || 'Follow-up',
      description: params.description || ''
    }
  };
}
