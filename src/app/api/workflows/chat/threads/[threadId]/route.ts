/**
 * Thread Get API
 *
 * GET /api/workflows/chat/threads/[threadId]
 * - Get thread metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const resolvedParams = await params;
    const threadId = resolvedParams.threadId;

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get thread
    const { data: thread, error: threadError } = await supabase
      .from('workflow_chat_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      console.error('Error fetching thread:', threadError);
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      thread: {
        id: thread.id,
        workflowExecutionId: thread.workflow_execution_id,
        stepId: thread.step_id,
        threadType: thread.thread_type,
        status: thread.status,
        returnToStep: thread.return_to_step,
        startedAt: thread.started_at,
        endedAt: thread.ended_at,
        totalMessages: thread.total_messages
      }
    });

  } catch (error) {
    console.error('Error in get thread API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
