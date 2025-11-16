/**
 * Skip Workflow with Triggers API
 *
 * POST /api/workflows/skip-with-triggers
 * - Skip a workflow with one or more skip triggers
 *
 * Phase 1.1: Skip Enhanced - Unified Trigger Architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowSkipService } from '@/lib/services/WorkflowSkipService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { SkipTrigger } from '@/types/skip-triggers';

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
    const { workflowId, triggers, reason } = body;

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

    // Skip the workflow with triggers
    const skipService = new WorkflowSkipService(supabase);
    await skipService.skipWithTriggers(workflowId, triggers as SkipTrigger[], userId, reason);

    // Generate human-readable summary
    const willReactivate = triggers.length === 1
      ? `Will reactivate when ${triggers[0].type === 'date' ? 'date' : 'event'} trigger fires`
      : `Will reactivate when any of ${triggers.length} triggers fire`;

    return NextResponse.json({
      success: true,
      message: `Workflow skipped with ${triggers.length} trigger(s)`,
      workflowId,
      triggerCount: triggers.length,
      willReactivate
    });

  } catch (error) {
    console.error('[skip-with-triggers] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to skip workflow' },
      { status: 500 }
    );
  }
}
