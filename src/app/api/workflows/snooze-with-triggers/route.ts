/**
 * Snooze Workflow with Triggers API
 *
 * POST /api/workflows/snooze-with-triggers
 * - Snooze a workflow with one or more wake triggers
 *
 * Phase 1.0: Workflow Snoozing - Services + Daily Cron Job
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowSnoozeService } from '@/lib/services/WorkflowSnoozeService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { WakeTrigger } from '@/types/wake-triggers';

export async function POST(request: NextRequest) {
  try {
    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : await createServerSupabaseClient();

    // Get current user (skip auth check in demo mode)
    let userId = 'system';
    if (!demoMode && !authBypassEnabled) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = user.id;
    }

    // Parse request body
    const body = await request.json();
    const { workflowId, triggers } = body;

    // Validate inputs
    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    if (!triggers || !Array.isArray(triggers) || triggers.length === 0) {
      return NextResponse.json(
        { error: 'At least one trigger is required' },
        { status: 400 }
      );
    }

    // Validate trigger structure
    for (const trigger of triggers) {
      if (!trigger.id || !trigger.type || !trigger.config) {
        return NextResponse.json(
          { error: 'Invalid trigger structure. Each trigger must have id, type, and config' },
          { status: 400 }
        );
      }

      if (trigger.type !== 'date' && trigger.type !== 'event') {
        return NextResponse.json(
          { error: `Invalid trigger type: ${trigger.type}. Must be 'date' or 'event'` },
          { status: 400 }
        );
      }
    }

    // Snooze the workflow with triggers
    const snoozeService = new WorkflowSnoozeService(supabase);
    await snoozeService.snoozeWithTriggers(workflowId, triggers as WakeTrigger[], userId);

    return NextResponse.json({
      success: true,
      message: `Workflow snoozed with ${triggers.length} trigger(s)`,
      workflowId,
      triggerCount: triggers.length
    });

  } catch (error) {
    console.error('[snooze-with-triggers] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to snooze workflow' },
      { status: 500 }
    );
  }
}
