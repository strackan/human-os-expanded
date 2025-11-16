/**
 * Approve Workflow Review API
 *
 * POST /api/workflows/approve-review
 * - Approve a workflow review (reviewer action)
 *
 * Phase 1.2B: Review-Only Mode - Unified Trigger Architecture
 * Review semantics: Reviewer approves, unblocking the original user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowReviewService } from '@/lib/services/WorkflowReviewService';
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

    // Parse request body
    const body = await request.json();
    const { workflowId, comments } = body;

    // Validate inputs
    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    // Approve the review
    const reviewService = new WorkflowReviewService(supabase);
    await reviewService.approveReview(
      workflowId,
      userId,
      comments
    );

    return NextResponse.json({
      success: true,
      message: 'Review approved successfully',
      workflowId
    });

  } catch (error) {
    console.error('[approve-review] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve review' },
      { status: 500 }
    );
  }
}
