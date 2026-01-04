/**
 * Snoozed Workflows API
 *
 * GET /api/workflows/snoozed
 * - Get all snoozed workflows for the current user
 * - Query params: ?userId=X&includeTriggered=true
 *
 * Phase 1.0: Workflow Snoozing - Services + Daily Cron Job
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowSnoozeService } from '@/lib/services/WorkflowSnoozeService';
import { SmartSurfaceService } from '@/lib/services/SmartSurfaceService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : await createServerSupabaseClient();

    // Get current user (skip auth check in demo mode)
    let userId: string | undefined;
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get('userId');
    const includeTriggered = searchParams.get('includeTriggered') === 'true';
    const ranked = searchParams.get('ranked') === 'true'; // Whether to rank by priority

    // Use userId from query param if provided, otherwise use authenticated user
    const targetUserId = userIdParam || userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get snoozed workflows
    const snoozeService = new WorkflowSnoozeService(supabase);
    const workflows = await snoozeService.getSnoozedWorkflows(targetUserId, includeTriggered);

    // Optionally rank by priority
    let result = workflows;
    if (ranked) {
      const smartSurfaceService = new SmartSurfaceService();
      result = await smartSurfaceService.rankSnoozedWorkflows(workflows);
    }

    return NextResponse.json({
      workflows: result,
      count: result.length,
      includeTriggered,
      ranked
    });

  } catch (error) {
    console.error('[snoozed] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch snoozed workflows' },
      { status: 500 }
    );
  }
}
