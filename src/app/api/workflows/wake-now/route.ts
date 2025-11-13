/**
 * Wake Workflow Now API
 *
 * POST /api/workflows/wake-now
 * - Manually wake a snoozed workflow (CSM override)
 *
 * Phase 1.0: Workflow Snoozing - Services + Daily Cron Job
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowSnoozeService } from '@/lib/services/WorkflowSnoozeService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : await createServerSupabaseClient();

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
    const { workflowId, reason } = body;

    // Validate inputs
    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    // Wake the workflow
    const snoozeService = new WorkflowSnoozeService(supabase);
    await snoozeService.surfaceWorkflow(
      workflowId,
      'manual_wake',
      reason || 'Manual wake by user'
    );

    return NextResponse.json({
      success: true,
      message: 'Workflow woken successfully',
      workflowId
    });

  } catch (error) {
    console.error('[wake-now] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to wake workflow' },
      { status: 500 }
    );
  }
}
