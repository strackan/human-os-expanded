/**
 * POST /api/orchestrator/executions/[id]/skip
 *
 * Skip a workflow execution with a reason
 *
 * Body:
 * - reason: string (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const executionId = params.id;

    // Parse body
    const body = await request.json();
    const reason = body.reason;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    // Update workflow execution
    const { data: execution, error: updateError } = await supabase
      .from('workflow_executions')
      .update({
        status: 'skipped',
        skip_reason: reason,
        skipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      execution
    });
  } catch (error) {
    console.error('Error skipping workflow:', error);
    return NextResponse.json(
      { error: 'Failed to skip workflow' },
      { status: 500 }
    );
  }
}
