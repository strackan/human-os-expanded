/**
 * Reject Step Review API
 *
 * POST /api/workflows/executions/[id]/steps/[stepId]/review/reject
 * - Reject a specific workflow step with comments and feedback
 *
 * Phase 1.4: Review Rejection Enhancement
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowReviewService } from '@/lib/services/WorkflowReviewService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params;

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

    // Parse request body
    const body = await request.json();
    const { comments, reason } = body;

    // Validate inputs
    if (!comments) {
      return NextResponse.json(
        { error: 'Comments are required' },
        { status: 400 }
      );
    }

    if (comments.length < 10) {
      return NextResponse.json(
        { error: 'Comments must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Reject the step
    const reviewService = new WorkflowReviewService(supabase);
    await reviewService.rejectStep(
      id,
      stepId,
      userId,
      comments,
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Step rejected successfully',
      executionId: id,
      stepId
    });

  } catch (error) {
    console.error('[reject-step-review] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject step' },
      { status: 500 }
    );
  }
}
