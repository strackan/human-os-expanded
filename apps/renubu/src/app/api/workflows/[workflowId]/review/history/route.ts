/**
 * Get Workflow Rejection History API
 *
 * GET /api/workflows/[workflowId]/review/history
 * - Get the rejection history for a workflow
 *
 * Phase 1.4: Review Rejection Enhancement
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowReviewService } from '@/lib/services/WorkflowReviewService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await params;

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

    // In demo mode, get userId from query params
    if (demoMode || authBypassEnabled) {
      const searchParams = request.nextUrl.searchParams;
      userId = searchParams.get('userId') || 'demo-user';
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get rejection history
    const reviewService = new WorkflowReviewService(supabase);
    const history = await reviewService.getRejectionHistory(workflowId, userId);

    return NextResponse.json({
      success: true,
      workflowId,
      rejectionHistory: history,
      count: history.length
    });

  } catch (error) {
    console.error('[rejection-history] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get rejection history' },
      { status: 500 }
    );
  }
}
