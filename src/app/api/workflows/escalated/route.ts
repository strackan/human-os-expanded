/**
 * Pending Review Workflows API
 *
 * GET /api/workflows/pending-review (alias: /api/workflows/escalated)
 * - Get all workflows pending review for the current user
 * - Query params: ?userId=X&includeTriggered=true&includeRejected=false
 *
 * Phase 1.2B: Review-Only Mode - Unified Trigger Architecture
 * Phase 1.4: Review Rejection Enhancement - Added rejection info
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowReviewService } from '@/lib/services/WorkflowReviewService';
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
    const includeRejected = searchParams.get('includeRejected') === 'true';

    // Use userId from query param if provided, otherwise use authenticated user
    const targetUserId = userIdParam || userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get workflows pending review
    const reviewService = new WorkflowReviewService(supabase);
    const workflows = await reviewService.getPendingReviewWorkflows(targetUserId, includeTriggered);

    // Filter out rejected workflows unless explicitly requested
    const filteredWorkflows = includeRejected
      ? workflows
      : workflows.filter(w => w.review_status !== 'rejected');

    // Enhance response with rejection info summary
    const workflowsWithRejectionInfo = filteredWorkflows.map(workflow => ({
      ...workflow,
      has_rejection_history: (workflow.review_rejection_history?.length || 0) > 0,
      rejection_count: workflow.review_rejection_history?.length || 0,
      current_iteration: workflow.review_iteration || 1
    }));

    return NextResponse.json({
      workflows: workflowsWithRejectionInfo,
      count: workflowsWithRejectionInfo.length,
      includeTriggered,
      includeRejected,
      summary: {
        total: workflowsWithRejectionInfo.length,
        with_rejections: workflowsWithRejectionInfo.filter(w => w.has_rejection_history).length,
        pending: workflowsWithRejectionInfo.filter(w => w.review_status === 'pending').length,
        rejected: workflowsWithRejectionInfo.filter(w => w.review_status === 'rejected').length
      }
    });

  } catch (error) {
    console.error('[pending-review] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch pending review workflows' },
      { status: 500 }
    );
  }
}
