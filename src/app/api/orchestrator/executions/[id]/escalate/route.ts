/**
 * POST /api/orchestrator/executions/[id]/escalate
 *
 * Escalate a workflow execution to another user
 * Note: This is escalation, NOT reassignment - original CSM stays assigned
 *
 * Body:
 * - escalation_user_id: string (required)
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
    const escalationUserId = body.escalation_user_id;

    if (!escalationUserId) {
      return NextResponse.json(
        { error: 'escalation_user_id is required' },
        { status: 400 }
      );
    }

    // Verify escalation user exists
    const { data: escalationUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', escalationUserId)
      .single();

    if (userError || !escalationUser) {
      return NextResponse.json(
        { error: 'Invalid escalation_user_id' },
        { status: 400 }
      );
    }

    // Update workflow execution (keep assigned_csm_id, just add escalation)
    const { data: execution, error: updateError } = await supabase
      .from('workflow_executions')
      .update({
        escalation_user_id: escalationUserId,
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
      execution,
      escalated_to: escalationUserId
    });
  } catch (error) {
    console.error('Error escalating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to escalate workflow' },
      { status: 500 }
    );
  }
}
