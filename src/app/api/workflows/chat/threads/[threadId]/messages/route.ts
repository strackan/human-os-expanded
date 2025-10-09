/**
 * Messages API
 *
 * GET /api/workflows/chat/threads/[threadId]/messages
 * - Get conversation history
 *
 * POST /api/workflows/chat/threads/[threadId]/messages
 * - Send user message and get LLM response (Ollama or mock fallback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';
import { LLMService } from '@/lib/services/LLMService';

// =====================================================
// GET - Fetch conversation history
// =====================================================

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

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('workflow_chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('sequence_number', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const messagesArray = (messages || []).map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      messageType: msg.message_type,
      metadata: msg.metadata,
      createdAt: msg.created_at,
      sequenceNumber: msg.sequence_number
    }));

    return NextResponse.json({
      success: true,
      threadId,
      messages: messagesArray
    });

  } catch (error) {
    console.error('Error in get messages API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - Send message and get LLM response
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const resolvedParams = await params;
    const threadId = resolvedParams.threadId;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
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

    // Get thread to verify it exists and get next sequence number
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

    // Get current message count for sequence number
    const { count } = await supabase
      .from('workflow_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    const nextSequence = (count || 0) + 1;

    // Save user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('workflow_chat_messages')
      .insert({
        thread_id: threadId,
        role: 'user',
        content: message,
        message_type: 'text',
        sequence_number: nextSequence
      })
      .select()
      .single();

    if (userMessageError || !userMessage) {
      console.error('Error saving user message:', userMessageError);
      return NextResponse.json(
        { error: 'Failed to save user message' },
        { status: 500 }
      );
    }

    // Get conversation history for LLM context
    const { data: conversationHistory } = await supabase
      .from('workflow_chat_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('sequence_number', { ascending: true });

    // Build messages array for LLM (exclude system messages, those are added by LLMService)
    const messages = (conversationHistory || [])
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    // Get customer context (optional - from workflow execution if available)
    let customerContext = undefined;
    if (thread.workflow_execution_id) {
      // TODO: Fetch customer context from workflow execution
      // For now, context is optional
    }

    // Generate LLM response (Ollama or mock fallback)
    const llmResponse = await LLMService.generateResponse(messages, customerContext);

    // Save assistant message
    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from('workflow_chat_messages')
      .insert({
        thread_id: threadId,
        role: 'assistant',
        content: llmResponse.content,
        message_type: llmResponse.messageType,
        metadata: llmResponse.metadata,
        sequence_number: nextSequence + 1
      })
      .select()
      .single();

    if (assistantMessageError || !assistantMessage) {
      console.error('Error saving assistant message:', assistantMessageError);
      return NextResponse.json(
        { error: 'Failed to save assistant message' },
        { status: 500 }
      );
    }

    // Update thread total_messages count
    await supabase
      .from('workflow_chat_threads')
      .update({ total_messages: nextSequence + 1 })
      .eq('id', threadId);

    return NextResponse.json({
      success: true,
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        messageType: userMessage.message_type,
        createdAt: userMessage.created_at,
        sequenceNumber: userMessage.sequence_number
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        messageType: assistantMessage.message_type,
        metadata: assistantMessage.metadata,
        createdAt: assistantMessage.created_at,
        sequenceNumber: assistantMessage.sequence_number,
        source: llmResponse.source // 'ollama' or 'mock' for debugging
      }
    });

  } catch (error) {
    console.error('Error in send message API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
