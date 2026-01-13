/**
 * Thread Complete API
 *
 * POST /api/workflows/chat/threads/[threadId]/complete
 * - Mark thread as completed
 * - Updates corresponding workflow step execution
 * - Returns returnToStep for navigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(
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

    // Get thread details first
    const { data: thread, error: threadError } = await supabase
      .from('workflow_chat_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Update thread status to completed
    const { data: updatedThread, error: updateError } = await supabase
      .from('workflow_chat_threads')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', threadId)
      .select()
      .single();

    if (updateError || !updatedThread) {
      console.error('Error completing thread:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete thread' },
        { status: 500 }
      );
    }

    // Update corresponding workflow step execution (if exists)
    if (thread.workflow_execution_id && thread.step_id) {
      const { data: stepExecution } = await supabase
        .from('workflow_step_executions')
        .select('*')
        .eq('workflow_execution_id', thread.workflow_execution_id)
        .eq('step_id', thread.step_id)
        .single();

      if (stepExecution) {
        // Calculate duration
        const startedAt = new Date(stepExecution.started_at);
        const completedAt = new Date();
        const durationSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000);

        // Update step execution
        await supabase
          .from('workflow_step_executions')
          .update({
            status: 'completed',
            completed_at: completedAt.toISOString(),
            duration_seconds: durationSeconds,
            metadata: {
              ...stepExecution.metadata,
              threadCompleted: true,
              totalMessages: updatedThread.total_messages,
              totalTokens: updatedThread.total_tokens
            }
          })
          .eq('id', stepExecution.id);

        console.log(`[Thread Complete] Updated step execution ${stepExecution.id} for step ${thread.step_id}`);
      }
    }

    return NextResponse.json({
      success: true,
      thread: {
        id: updatedThread.id,
        status: updatedThread.status,
        endedAt: updatedThread.ended_at,
        returnToStep: updatedThread.return_to_step
      },
      stepUpdated: !!(thread.workflow_execution_id && thread.step_id)
    });

  } catch (error) {
    console.error('Error in complete thread API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
