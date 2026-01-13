/**
 * Reactivate Workflow Now API
 *
 * POST /api/workflows/reactivate-now
 * - Manually reactivate a skipped workflow (CSM override)
 *
 * Phase 1.1: Skip Enhanced - Unified Trigger Architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowSkipService } from '@/lib/services/WorkflowSkipService';
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

    // Reactivate the workflow
    const skipService = new WorkflowSkipService(supabase);
    await skipService.reactivateWorkflow(
      workflowId,
      'manual_reactivate',
      reason || 'Manual reactivation by user'
    );

    return NextResponse.json({
      success: true,
      message: 'Workflow reactivated successfully',
      workflowId
    });

  } catch (error) {
    console.error('[reactivate-now] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reactivate workflow' },
      { status: 500 }
    );
  }
}
