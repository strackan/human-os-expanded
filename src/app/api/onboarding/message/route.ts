/**
 * Onboarding Message API
 *
 * POST /api/onboarding/message — Send user message, get sculptor response via SSE
 *
 * Uses non-streaming Anthropic call + fake-stream to client for reliability.
 * This avoids Vercel serverless issues with long-running streaming generators.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { OnboardingService, type ConversationEntry } from '@/lib/services/OnboardingService';
import { AnthropicService, type ConversationMessage } from '@/lib/services/AnthropicService';
import { getSculptorSystemPrompt, SCULPTOR_METADATA_TOOL } from '@/lib/onboarding/sculptor-prompt';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';

interface SculptorMetadata {
  current_phase?: number;
  opener_used?: string;
  should_transition?: boolean;
  detected_signals?: string[];
}

/** Max messages to include in Claude context to avoid token overflow. */
const MAX_CONTEXT_MESSAGES = 20;

function buildMessages(log: ConversationEntry[]): ConversationMessage[] {
  let entries: ConversationEntry[];
  if (log.length <= MAX_CONTEXT_MESSAGES) {
    entries = log;
  } else {
    const first2 = log.slice(0, 2);
    const lastN = log.slice(-(MAX_CONTEXT_MESSAGES - 2));
    entries = [...first2, ...lastN];
  }

  const messages = entries.map((e) => ({ role: e.role, content: e.content }));

  // Anthropic API requires the first message to have role 'user'.
  if (messages.length > 0 && messages[0].role !== 'user') {
    messages.unshift({ role: 'user', content: '[Continue the onboarding conversation.]' });
  }

  return messages;
}

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return new Response(JSON.stringify({ error: 'message and sessionId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const service = new OnboardingService(supabase);
    const session = await service.getActiveSession(user.id);

    if (!session || session.id !== sessionId) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Append user message to log
    await service.appendMessage(session.id, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Reload session to get updated log
    const updatedSession = await service.getActiveSession(user.id);
    if (!updatedSession) {
      return new Response(JSON.stringify({ error: 'Session lost' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || user.email?.split('@')[0] || 'there';
    const systemPrompt = getSculptorSystemPrompt(userName);
    const messages = buildMessages(updatedSession.conversation_log);

    console.log('[Onboarding Message] Calling Anthropic (non-streaming), messages:', messages.length);

    // --- Non-streaming call: get full response first, then stream to client ---
    let fullContent = '';
    let toolUseData: SculptorMetadata | null = null;
    let apiError: string | null = null;

    try {
      const response = await AnthropicService.generateConversation({
        messages,
        systemPrompt,
        tools: [SCULPTOR_METADATA_TOOL],
        model: CLAUDE_SONNET_CURRENT,
        maxTokens: 500,
        temperature: 0.8,
      });

      fullContent = response.content;
      console.log('[Onboarding Message] Got response, length:', fullContent.length,
        'toolUses:', response.toolUses?.length || 0);

      // Extract sculptor metadata from tool use
      if (response.toolUses && response.toolUses.length > 0) {
        const metadataTool = response.toolUses.find(t => t.name === 'update_session_metadata');
        if (metadataTool) {
          toolUseData = metadataTool.input as SculptorMetadata;
        }
      }
    } catch (err) {
      console.error('[Onboarding Message] Anthropic error:', err);
      apiError = err instanceof Error ? err.message : 'Failed to generate response';
    }

    // Persist assistant message
    if (fullContent) {
      await service.appendMessage(session.id, {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toISOString(),
        metadata: toolUseData ? { signals: toolUseData } : undefined,
      });
    }

    // Update session metadata
    const shouldTransition = !!toolUseData?.should_transition;
    const phase = toolUseData?.current_phase || updatedSession.current_phase;

    if (toolUseData) {
      const updates: Partial<Pick<import('@/lib/services/OnboardingService').OnboardingSession, 'current_phase' | 'opener_used' | 'opener_depth' | 'transition_trigger'>> = {};
      if (toolUseData.current_phase) updates.current_phase = toolUseData.current_phase;
      if (toolUseData.opener_used) updates.opener_used = toolUseData.opener_used;
      if (shouldTransition) updates.transition_trigger = 'sculptor_tool';
      if (Object.keys(updates).length > 0) {
        await service.updateSession(session.id, updates);
      }
    }

    // --- Stream the pre-fetched response to client as SSE ---
    const encoder = new TextEncoder();

    // Chunk the response into word-sized pieces for a typing effect
    const chunks = fullContent.match(/.{1,8}/g) || [];

    const stream = new ReadableStream({
      start(controller) {
        // Send error if API call failed
        if (apiError) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: apiError })}\n\n`)
          );
        }

        // Send content as token chunks
        for (const chunk of chunks) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`)
          );
        }

        // Send complete event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', phase, shouldTransition })}\n\n`)
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[Onboarding Message API] error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
