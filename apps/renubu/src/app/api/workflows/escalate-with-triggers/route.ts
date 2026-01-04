/**
 * Request Workflow Review with Triggers API
 *
 * POST /api/workflows/request-review
 * - Request review for a workflow with one or more notification triggers
 *
 * Phase 1.2B: Review-Only Mode - Unified Trigger Architecture
 * Review semantics: Original user keeps ownership but is blocked until reviewer approves.
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowReviewService } from '@/lib/services/WorkflowReviewService';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { ReviewTrigger } from '@/types/review-triggers';

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
    const { workflowId, triggers, reviewerId, reason, logic } = body;

    // Validate inputs
    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'reviewerId is required' },
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

    // Request review for the workflow with triggers
    const reviewService = new WorkflowReviewService(supabase);
    await reviewService.requestReviewWithTriggers(
      workflowId,
      triggers as ReviewTrigger[],
      userId,
      reviewerId,
      reason,
      logic
    );

    // Generate human-readable summary
    const willNotify = triggers.length === 1
      ? `Will notify reviewer when ${triggers[0].type === 'date' ? 'date' : 'event'} trigger fires`
      : `Will notify reviewer when ${logic === 'AND' ? 'all' : 'any'} of ${triggers.length} triggers fire`;

    return NextResponse.json({
      success: true,
      message: `Review requested with ${triggers.length} trigger(s)`,
      workflowId,
      triggerCount: triggers.length,
      reviewRequested: reviewerId,
      willNotify
    });

  } catch (error) {
    console.error('[request-review] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request review' },
      { status: 500 }
    );
  }
}
