/**
 * API Route: Sculptor Session Messages
 *
 * Handles sending messages in a Sculptor session.
 * Manages conversation history, LLM responses, and response capture.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import { SculptorService } from '@/lib/sculptor';
import { AnthropicService, type ConversationMessage } from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';

interface MessageRequestBody {
  message: string;
  conversation_history?: ConversationMessage[];
}

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body: MessageRequestBody = await request.json();
    const { message, conversation_history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use AdminClient to bypass RLS for full context access
    const supabase = getHumanOSAdminClient();
    const sculptorService = new SculptorService(supabase);

    // Get session
    const session = await sculptorService.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'revoked') {
      return NextResponse.json(
        { error: 'This session has been revoked' },
        { status: 403 }
      );
    }

    // Get template
    if (!session.template) {
      return NextResponse.json(
        { error: 'Session template not found' },
        { status: 500 }
      );
    }

    // Build system prompt - uses storage-based context if entity_slug is set, otherwise legacy scene_prompt
    const systemPrompt = await sculptorService.getSessionSystemPrompt(session);

    if (!systemPrompt) {
      return NextResponse.json(
        { error: 'Could not build system prompt' },
        { status: 500 }
      );
    }

    // Debug log to see what's being composed
    console.log('[API /sculptor/messages] System prompt length:', systemPrompt.length);
    console.log('[API /sculptor/messages] Using entity_slug:', !!session.entity_slug);
    console.log('[API /sculptor/messages] Entity slug:', session.entity_slug || 'none');
    console.log('[API /sculptor/messages] Legacy scene_prompt exists:', !!session.scene_prompt);

    // Add completed session handling
    const isCompleted = session.status === 'completed';
    const completedPromptAddition = isCompleted
      ? '\n\n---\n\nIMPORTANT: This session has already been completed. The Sculptor has disintegrated. Respond only with variations of: "You are in your bed wondering how you ended up drenched in lake water." Keep it short and mysterious.'
      : '';

    // Build conversation with the new message
    const messages: ConversationMessage[] = [
      ...conversation_history,
      { role: 'user', content: message },
    ];

    console.log('[API /sculptor/messages] Generating response for session:', sessionId);

    // Generate LLM response
    const response = await AnthropicService.generateConversation({
      messages,
      systemPrompt: systemPrompt + completedPromptAddition,
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 2000,
      temperature: 0.8, // Slightly higher for theatrical improvisation
    });

    console.log('[API /sculptor/messages] Response generated:', {
      contentLength: response.content.length,
      tokensUsed: response.tokensUsed.total,
    });

    // Capture response (for user's response to AI question)
    // Note: We capture the user's message as the response to the previous AI question
    if (conversation_history.length > 0) {
      const lastAssistantMessage = [...conversation_history]
        .reverse()
        .find((m) => m.role === 'assistant');

      if (lastAssistantMessage) {
        // Try to extract scene/question info from assistant message
        const sceneMatch = lastAssistantMessage.content.match(/## Scene \d+: ([^\n]+)/i);
        const scene = sceneMatch?.[1]?.toLowerCase().replace(/\s+/g, '-') ?? null;

        await sculptorService.captureResponse({
          session_id: sessionId,
          ...(scene ? { scene } : {}),
          question_text: lastAssistantMessage.content.slice(0, 200), // First 200 chars as context
          response_text: message,
        });
      }
    }

    // Save conversation history to session metadata for persistence
    const updatedConversation = [
      ...conversation_history,
      { role: 'user' as const, content: message },
      { role: 'assistant' as const, content: response.content },
    ];

    // Check for session completion marker
    const COMPLETION_MARKER = '<!-- SESSION_COMPLETE -->';
    const isSessionComplete = response.content.includes(COMPLETION_MARKER);
    let finalStatus = session.status;

    if (isSessionComplete && session.status !== 'completed') {
      console.log('[API /sculptor/messages] Session completion marker detected, marking as completed');
      finalStatus = 'completed';
    }

    await supabase
      .from('sculptor_sessions')
      .update({
        metadata: {
          ...((session.metadata as Record<string, unknown>) || {}),
          conversation_history: updatedConversation,
        },
        last_accessed_at: new Date().toISOString(),
        ...(isSessionComplete ? { status: 'completed' } : {}),
      })
      .eq('id', sessionId);

    // Strip the completion marker from the response shown to user
    const cleanedContent = response.content.replace(COMPLETION_MARKER, '').trim();

    return NextResponse.json({
      content: cleanedContent,
      tokensUsed: response.tokensUsed,
      model: response.model,
      session_status: finalStatus,
    });
  } catch (error) {
    console.error('[API /sculptor/messages] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve conversation history for a session
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    // Use AdminClient for full access
    const supabase = getHumanOSAdminClient();
    const sculptorService = new SculptorService(supabase);

    // Get session and responses
    const session = await sculptorService.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const responses = await sculptorService.getResponses(sessionId);

    // Extract conversation history from metadata
    const metadata = session.metadata as Record<string, unknown> | null;
    const conversationHistory = (metadata?.conversation_history as ConversationMessage[]) || [];

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        entity_name: session.entity_name,
        template_name: session.template?.name,
        scene_prompt_length: session.scene_prompt?.length || 0, // Debug info
      },
      conversation_history: conversationHistory,
      responses,
      response_count: responses.length,
    });
  } catch (error) {
    console.error('[API /sculptor/messages] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
