/**
 * Automation Rules API - List and Create
 *
 * GET  /api/automation/rules - List user's automation rules
 * POST /api/automation/rules - Create new automation rule
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { NextRequest, NextResponse } from 'next/server';
import { AutomationRuleService } from '@/lib/services/AutomationRuleService';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  CreateAutomationRuleRequest,
  CreateAutomationRuleResponse,
  ListAutomationRulesResponse,
} from '@/types/automation-rules';

/**
 * GET /api/automation/rules
 * List automation rules for the current user
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');

    const filters: { isActive?: boolean } = {};
    if (isActiveParam !== null) {
      filters.isActive = isActiveParam === 'true';
    }

    // List rules
    const service = new AutomationRuleService(supabase);
    const rules = await service.listRules(user.id, filters);

    const response: ListAutomationRulesResponse = {
      rules,
      count: rules.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/automation/rules] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list automation rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automation/rules
 * Create a new automation rule
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateAutomationRuleRequest = await request.json();

    // Validate required fields
    if (!body.workflowConfigId) {
      return NextResponse.json(
        { error: 'workflowConfigId is required' },
        { status: 400 }
      );
    }

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!body.eventConditions || body.eventConditions.length === 0) {
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

    // If multiple conditions, require logic operator
    if (body.eventConditions.length > 1 && !body.logicOperator) {
      return NextResponse.json(
        { error: 'logicOperator is required when multiple conditions are specified' },
        { status: 400 }
      );
    }

    // Create rule
    const service = new AutomationRuleService(supabase);
    const rule = await service.createRule(user.id, {
      workflow_config_id: body.workflowConfigId,
      name: body.name,
      description: body.description,
      event_conditions: body.eventConditions,
      logic_operator: body.logicOperator,
      assign_to_user_id: body.assignToUserId,
      is_active: body.isActive,
    });

    const response: CreateAutomationRuleResponse = {
      success: true,
      message: `Automation rule "${rule.name}" created successfully`,
      rule,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[POST /api/automation/rules] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}
