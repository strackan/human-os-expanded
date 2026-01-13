/**
 * Evaluate Triggers Cron Job API
 *
 * POST /api/cron/evaluate-triggers
 * - Manual trigger for testing the cron job logic
 * - Requires admin authorization or cron secret
 *
 * Phase 1.0: Workflow Snoozing - Services + Daily Cron Job
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowSnoozeService } from '@/lib/services/WorkflowSnoozeService';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Check for cron secret or admin authorization
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    // Validate authorization
    if (cronSecret) {
      const providedSecret = authHeader?.replace('Bearer ', '');
      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid cron secret' },
          { status: 401 }
        );
      }
    } else if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization provided' },
        { status: 401 }
      );
    }

    console.log('[evaluate-triggers] Starting trigger evaluation...');
    const startTime = Date.now();

    // Use service role client for cron operations
    const supabase = createServiceRoleClient();

    // Run the evaluation
    const snoozeService = new WorkflowSnoozeService(supabase);
    const results = await snoozeService.evaluateAllSnoozedWorkflows();

    const duration = Date.now() - startTime;

    console.log(
      `[evaluate-triggers] Complete: ${results.evaluated} evaluated, ${results.surfaced} surfaced, ${results.errors} errors in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      evaluated: results.evaluated,
      surfaced: results.surfaced,
      errors: results.errors,
      errorDetails: results.errorDetails,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[evaluate-triggers] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to evaluate triggers' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to trigger evaluation.' },
    { status: 405 }
  );
}
