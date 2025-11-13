/**
 * Automation Rules API - Get, Update, Delete
 *
 * GET    /api/automation/rules/[id] - Get specific rule
 * PATCH  /api/automation/rules/[id] - Update rule
 * DELETE /api/automation/rules/[id] - Delete rule
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { NextRequest, NextResponse } from 'next/server';
import { AutomationRuleService } from '@/lib/services/AutomationRuleService';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  UpdateAutomationRuleRequest,
  UpdateAutomationRuleResponse,
  GetAutomationRuleResponse,
  DeleteAutomationRuleResponse,
} from '@/types/automation-rules';

/**
 * GET /api/automation/rules/[id]
 * Get a specific automation rule
 */
export async function GET(
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

    // Get rule
    const service = new AutomationRuleService(supabase);
    const rule = await service.getRule(ruleId, user.id);

    if (!rule) {
      return NextResponse.json(
        { error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    // Optionally get recent executions
    const { searchParams } = new URL(request.url);
    const includeExecutions = searchParams.get('includeExecutions') === 'true';

    let recentExecutions;
    if (includeExecutions) {
      recentExecutions = await service.getRuleExecutionHistory(ruleId, user.id, 10);
    }

    const response: GetAutomationRuleResponse = {
      rule,
      recentExecutions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/automation/rules/[id]] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get automation rule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/automation/rules/[id]
 * Update an automation rule
 */
export async function PATCH(
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

    // Parse request body
    const body: UpdateAutomationRuleRequest = await request.json();

    // Validate event conditions if provided
    if (body.eventConditions !== undefined) {
      if (body.eventConditions.length === 0) {
        return NextResponse.json(
          { error: 'At least one event condition is required' },
          { status: 400 }
        );
      }

      if (body.eventConditions.length > 2) {
        return NextResponse.json(
          { error: 'Maximum 2 event conditions allowed per rule' },
          { status: 400 }
        );
      }
    }

    // Update rule
    const service = new AutomationRuleService(supabase);
    const rule = await service.updateRule(ruleId, user.id, {
      name: body.name,
      description: body.description,
      event_conditions: body.eventConditions,
      logic_operator: body.logicOperator,
      assign_to_user_id: body.assignToUserId,
      is_active: body.isActive,
    });

    const response: UpdateAutomationRuleResponse = {
      success: true,
      message: `Automation rule "${rule.name}" updated successfully`,
      rule,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[PATCH /api/automation/rules/[id]] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update automation rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/automation/rules/[id]
 * Delete an automation rule
 */
export async function DELETE(
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

    // Delete rule
    const service = new AutomationRuleService(supabase);
    await service.deleteRule(ruleId, user.id);

    const response: DeleteAutomationRuleResponse = {
      success: true,
      message: 'Automation rule deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[DELETE /api/automation/rules/[id]] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete automation rule' },
      { status: 500 }
    );
  }
}
