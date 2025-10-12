/**
 * Branch API
 *
 * GET /api/workflows/[workflowId]/branches?stepId={stepId}
 * - Returns available chat branches for a workflow step
 * - Supports 4 branch types: fixed, llm, saved_action, rag
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const resolvedParams = await params;
    const workflowId = resolvedParams.workflowId;
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('stepId');

    if (!stepId) {
      return NextResponse.json(
        { error: 'stepId query parameter is required' },
        { status: 400 }
      );
    }

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get branches for this workflow step
    const { data: branches, error: branchesError } = await supabase
      .from('workflow_chat_branches')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('from_step_id', stepId)
      .order('branch_id', { ascending: true });

    if (branchesError) {
      console.error('Error fetching branches:', branchesError);
      return NextResponse.json(
        { error: 'Failed to fetch branches' },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const branchesArray = (branches || []).map(branch => ({
      id: branch.id,
      branchId: branch.branch_id,
      branchLabel: branch.branch_label,
      branchType: branch.branch_type, // 'fixed' | 'llm' | 'saved_action' | 'rag'
      userPrompts: branch.user_prompts,
      responseText: branch.response_text,
      nextStepId: branch.next_step_id,
      savedActionId: branch.saved_action_id,
      llmHandler: branch.llm_handler,
      allowOffScript: branch.allow_off_script || false,
      returnToStep: branch.return_to_step
    }));

    return NextResponse.json({
      success: true,
      workflowId,
      stepId,
      branches: branchesArray
    });

  } catch (error) {
    console.error('Error in branches API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
