/**
 * Thread Complete API
 *
 * POST /api/workflows/chat/threads/[threadId]/complete
 * - Mark thread as completed
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

    return NextResponse.json({
      success: true,
      thread: {
        id: updatedThread.id,
        status: updatedThread.status,
        endedAt: updatedThread.ended_at,
        returnToStep: updatedThread.return_to_step
      }
    });

  } catch (error) {
    console.error('Error in complete thread API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
