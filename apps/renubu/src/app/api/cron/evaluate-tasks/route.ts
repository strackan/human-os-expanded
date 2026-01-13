/**
 * Daily Task Evaluation Cron Job
 *
 * GET /api/cron/evaluate-tasks
 * - Runs daily at 6am (configured in vercel.json)
 * - Resurfaces snoozed tasks
 * - Sets force_action flags on tasks past 7-day deadline
 * - Auto-skips abandoned tasks
 * - Cleans up old notifications
 *
 * Security:
 * - Protected by CRON_SECRET environment variable
 * - Only accessible by Vercel Cron or with valid secret
 *
 * Phase 3.3: Task State Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { DailyTaskEvaluationService } from '@/lib/services/DailyTaskEvaluationService';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require CRON_SECRET
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('[CronJob] Unauthorized cron request');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[CronJob] Starting daily task evaluation...');

    // Use service role client (has elevated permissions)
    const supabase = createServiceRoleClient();

    // Run daily evaluation
    const result = await DailyTaskEvaluationService.runDailyEvaluation(supabase);

    // Format summary for logging
    const summary = DailyTaskEvaluationService.formatEvaluationSummary(result);
    console.log(summary);

    // Return result
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      summary
    });

  } catch (error) {
    console.error('[CronJob] Error during daily task evaluation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run daily evaluation',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Allow POST as well (for manual triggering via API testing)
export async function POST(request: NextRequest) {
  return GET(request);
}
