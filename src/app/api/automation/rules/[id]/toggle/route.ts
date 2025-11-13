/**
 * Automation Rules API - Toggle Active Status
 *
 * POST /api/automation/rules/[id]/toggle - Toggle active status
 *
 * Phase 1.4: Event-Driven Workflow Launcher
 */

import { NextRequest, NextResponse } from 'next/server';
import { AutomationRuleService } from '@/lib/services/AutomationRuleService';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/automation/rules/[id]/toggle
 * Toggle the active status of an automation rule
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

    // Parse request body
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Toggle active status
    const service = new AutomationRuleService(supabase);
    const rule = await service.toggleActive(ruleId, user.id, isActive);

    return NextResponse.json({
      success: true,
      message: `Automation rule ${isActive ? 'activated' : 'deactivated'}`,
      rule,
      isActive: rule.is_active,
    });
  } catch (error) {
    console.error('[POST /api/automation/rules/[id]/toggle] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle automation rule' },
      { status: 500 }
    );
  }
}
