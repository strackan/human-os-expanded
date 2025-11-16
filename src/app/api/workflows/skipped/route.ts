/**
 * Skipped Workflows API
 *
 * GET /api/workflows/skipped
 * - Get all skipped workflows for the current user
 * - Query params: ?userId=X&includeTriggered=true
 *
 * Phase 1.1: Skip Enhanced - Unified Trigger Architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowSkipService } from '@/lib/services/WorkflowSkipService';
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

    // Use userId from query param if provided, otherwise use authenticated user
    const targetUserId = userIdParam || userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get skipped workflows
    const skipService = new WorkflowSkipService(supabase);
    const workflows = await skipService.getSkippedWorkflows(targetUserId, includeTriggered);

    return NextResponse.json({
      workflows,
      count: workflows.length,
      includeTriggered
    });

  } catch (error) {
    console.error('[skipped] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch skipped workflows' },
      { status: 500 }
    );
  }
}
