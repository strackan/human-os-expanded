/**
 * POST /api/orchestrator/executions/[id]/snooze
 *
 * Snooze a workflow execution for a specified number of days
 *
 * Body:
 * - days: number (required, 1-90)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateWorkflowPriorityScore } from '@/lib/workflows/orchestrator-db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: executionId } = await params;

    // Parse body
    const body = await request.json();
    const days = body.days;

    if (!days || days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'days must be between 1 and 90' },
        { status: 400 }
      );
    }

    // Calculate snooze_until date
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);

    // Update workflow execution
    const { data: execution, error: updateError } = await supabase
      .from('workflow_executions')
      .update({
        status: 'snoozed',
        snooze_until: snoozeUntil.toISOString(),
        snooze_days: days,
        snoozed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Recalculate priority (snoozed workflows get special priority based on due date)
    const newPriority = await calculateWorkflowPriorityScore(executionId);

    await supabase
      .from('workflow_executions')
      .update({ priority_score: newPriority })
      .eq('id', executionId);

    return NextResponse.json({
      success: true,
      execution,
      snooze_until: snoozeUntil.toISOString(),
      new_priority: newPriority
    });
  } catch (error) {
    console.error('Error snoozing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to snooze workflow' },
      { status: 500 }
    );
  }
}
