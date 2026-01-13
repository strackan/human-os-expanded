/**
 * Thread Create API
 *
 * POST /api/workflows/chat/threads
 * - Create a new LLM conversation thread
 * - Creates system message with context
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

function getSystemPrompt(threadType: string): string {
  switch (threadType) {
    case 'llm':
      return 'You are a helpful AI assistant helping a Customer Success Manager with renewal workflows. You have access to customer data and can answer questions, generate insights, and provide recommendations.';
    case 'rag':
      return 'You are a helpful AI assistant with access to knowledge base articles, past renewal conversations, and best practices. Use this knowledge to provide accurate, contextual answers.';
    case 'analysis':
      return 'You are an AI analyst helping to analyze customer data, renewal trends, and provide data-driven insights.';
    default:
      return 'You are a helpful AI assistant.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowExecutionId, stepId, threadType, returnToStep } = body;

    if (!stepId) {
      return NextResponse.json(
        { error: 'stepId is required' },
        { status: 400 }
      );
    }

    if (!threadType) {
      return NextResponse.json(
        { error: 'threadType is required (llm|rag|analysis)' },
        { status: 400 }
      );
    }

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create thread
    const { data: thread, error: threadError } = await supabase
      .from('workflow_chat_threads')
      .insert({
        workflow_execution_id: workflowExecutionId || null,
        step_id: stepId,
        thread_type: threadType,
        started_by: user.id,
        status: 'active',
        return_to_step: returnToStep || null,
        total_messages: 0
      })
      .select()
      .single();

    if (threadError || !thread) {
      console.error('Error creating thread:', threadError);
      return NextResponse.json(
        { error: 'Failed to create thread' },
        { status: 500 }
      );
    }

    // Create system message
    const systemPrompt = getSystemPrompt(threadType);
    const { error: messageError } = await supabase
      .from('workflow_chat_messages')
      .insert({
        thread_id: thread.id,
        role: 'system',
        content: systemPrompt,
        sequence_number: 0
      });

    if (messageError) {
      console.error('Error creating system message:', messageError);
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
        totalMessages: thread.total_messages
      }
    });

  } catch (error) {
    console.error('Error in create thread API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
