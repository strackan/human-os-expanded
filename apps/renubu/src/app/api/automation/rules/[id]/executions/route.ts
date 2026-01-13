/**
 * Automation Rules API - Execution History
 *
 * GET /api/automation/rules/[id]/executions - Get execution history
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { NextRequest, NextResponse } from 'next/server';
import { AutomationRuleService } from '@/lib/services/AutomationRuleService';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { GetAutomationRuleExecutionsResponse } from '@/types/automation-rules';

/**
 * GET /api/automation/rules/[id]/executions
 * Get execution history for an automation rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: ruleId } = await params;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (isNaN(limit) || limit < 1 || limit > 500) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 500' },
        { status: 400 }
      );
    }

    // Get execution history
    const service = new AutomationRuleService(supabase);
    const executions = await service.getRuleExecutionHistory(ruleId, user.id, limit);

    // Calculate success rate
    const successCount = executions.filter(e => e.success).length;
    const successRate = executions.length > 0
      ? (successCount / executions.length) * 100
      : 0;

    const response: GetAutomationRuleExecutionsResponse = {
      executions,
      count: executions.length,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/automation/rules/[id]/executions] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get execution history' },
      { status: 500 }
    );
  }
}
