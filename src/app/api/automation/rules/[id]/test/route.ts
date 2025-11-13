/**
 * Automation Rules API - Test Rule Evaluation
 *
 * POST /api/automation/rules/[id]/test - Test rule evaluation
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { NextRequest, NextResponse } from 'next/server';
import { AutomationRuleService } from '@/lib/services/AutomationRuleService';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TestAutomationRuleResponse } from '@/types/automation-rules';

/**
 * POST /api/automation/rules/[id]/test
 * Test if a rule would trigger without actually launching a workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const ruleId = params.id;

    // Get the rule first to verify ownership
    const service = new AutomationRuleService(supabase);
    const rule = await service.getRule(ruleId, user.id);

    if (!rule) {
      return NextResponse.json(
        { error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    // Evaluate the rule (without launching workflow)
    const wouldTrigger = await service.evaluateRuleById(ruleId);

    // Determine which conditions matched
    const matchedConditions: string[] = [];
    if (wouldTrigger) {
      // For now, we'll just indicate that conditions were met
      // In a full implementation, we'd track which specific conditions matched
      matchedConditions.push(...rule.event_conditions.map(c => c.source));
    }

    const response: TestAutomationRuleResponse = {
      success: true,
      message: wouldTrigger
        ? 'Rule conditions are met - workflow would launch'
        : 'Rule conditions are not met - workflow would not launch',
      wouldTrigger,
      matchedConditions,
      workflowWouldLaunch: rule.workflow_config_id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[POST /api/automation/rules/[id]/test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to test automation rule' },
      { status: 500 }
    );
  }
}
