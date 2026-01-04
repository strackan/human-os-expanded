/**
 * Evaluate Escalate Triggers Cron Job API
 *
 * POST /api/cron/evaluate-escalate-triggers
 * - Manual trigger for testing the escalate cron job logic
 * - Requires admin authorization or cron secret
 *
 * Phase 1.2: Escalate Enhanced - Unified Trigger Architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEscalateService } from '@/lib/services/WorkflowEscalateService';
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

    console.log('[evaluate-escalate-triggers] Starting escalate trigger evaluation...');
    const startTime = Date.now();

    // Use service role client for cron operations
    const supabase = createServiceRoleClient();

    // Run the evaluation
    const escalateService = new WorkflowEscalateService(supabase);
    const results = await escalateService.evaluateAllEscalatedWorkflows();

    const duration = Date.now() - startTime;

    console.log(
      `[evaluate-escalate-triggers] Complete: ${results.evaluated} evaluated, ${results.notified} notified, ${results.errors} errors in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      evaluated: results.evaluated,
      notified: results.notified,
      errors: results.errors,
      errorDetails: results.errorDetails,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[evaluate-escalate-triggers] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to evaluate escalate triggers' },
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
