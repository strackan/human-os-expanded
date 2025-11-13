/**
 * Automation Rules API - Evaluate All Rules
 *
 * POST /api/automation/rules/evaluate - Trigger evaluation of all active rules
 *
 * This endpoint is intended for manual triggering and cron jobs.
 * In production, this should be protected by API key or admin-only access.
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { NextRequest, NextResponse } from 'next/server';
import { AutomationRuleService } from '@/lib/services/AutomationRuleService';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * POST /api/automation/rules/evaluate
 * Evaluate all active automation rules
 *
 * This endpoint uses service role client to bypass RLS.
 * In production, protect with API key or admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin/cron access
    // For now, we'll allow any authenticated request
    // In production, verify API key or admin role

    // Optional: Check for authorization header
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.AUTOMATION_EVALUATION_API_KEY;

    // If API key is configured, require it
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid API key' },
        { status: 401 }
      );
    }

    console.log('[POST /api/automation/rules/evaluate] Starting evaluation of all active rules');

    // Use service role client to access all rules
    const supabase = createServiceRoleClient();
    const service = new AutomationRuleService(supabase);

    // Evaluate all active rules
    const results = await service.evaluateAllActiveRules();

    console.log('[POST /api/automation/rules/evaluate] Evaluation complete:', results);

    return NextResponse.json({
      success: true,
      message: 'Automation rule evaluation complete',
      evaluated: results.evaluated,
      launched: results.launched,
      errors: results.errors,
      errorDetails: results.errorDetails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[POST /api/automation/rules/evaluate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to evaluate automation rules',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
