/**
 * Onboarding Message API
 *
 * POST /api/onboarding/message — Send user message, get sculptor response via SSE
 *
 * Uses the same pull-based streaming pattern as the init route so that the
 * fetch() resolves immediately and tokens stream in lazily.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { OnboardingService, type ConversationEntry } from '@/lib/services/OnboardingService';
import { AnthropicService, type ConversationMessage } from '@/lib/services/AnthropicService';
import { getSculptorSystemPrompt, SCULPTOR_METADATA_TOOL } from '@/lib/onboarding/sculptor-prompt';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import { SSE_HEADERS, sseEvent, streamFromGenerator } from '@/lib/onboarding/sse-helpers';

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
    // --- Fast pre-work (runs before Response is returned) ---
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

    const validSession = session;

    // Append user message to log
    await service.appendMessage(validSession.id, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Reload session to get updated log
    const reloadedSession = await service.getActiveSession(user.id);
    if (!reloadedSession) {
      return new Response(JSON.stringify({ error: 'Session lost' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Capture non-null references for use inside the generator closure
    const currentPhase = reloadedSession.current_phase;

    // Get user display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || user.email?.split('@')[0] || 'there';
    const systemPrompt = getSculptorSystemPrompt(userName);
    const messages = buildMessages(reloadedSession.conversation_log);

    console.log('[Onboarding Message] Starting stream, messages:', messages.length);

    // --- Non-streaming approach: fetch full response, then stream to client ---
    // The pull-based generator pattern yields 0 tokens to the client on Vercel
    // even though init (identical pattern) works. Use blocking call + fake stream.
    let fullContent = '';
    let toolUseData: SculptorMetadata | null = null;
    let apiError: string | null = null;

    try {
      console.log('[Onboarding Message] Calling Anthropic (blocking)...');
      const response = await AnthropicService.generateConversation({
        messages,
        systemPrompt,
        tools: [SCULPTOR_METADATA_TOOL],
        model: CLAUDE_SONNET_CURRENT,
        maxTokens: 500,
        temperature: 0.8,
      });

      fullContent = response.content;
      console.log('[Onboarding Message] Got response, length:', fullContent.length);

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
      await service.appendMessage(validSession.id, {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toISOString(),
        metadata: toolUseData ? { signals: toolUseData } : undefined,
      });
    }

    // Update session metadata
    const shouldTransition = !!toolUseData?.should_transition;
    const phase = toolUseData?.current_phase || currentPhase;

    if (toolUseData) {
      const updates: Partial<Pick<import('@/lib/services/OnboardingService').OnboardingSession, 'current_phase' | 'opener_used' | 'opener_depth' | 'transition_trigger'>> = {};
      if (toolUseData.current_phase) updates.current_phase = toolUseData.current_phase;
      if (toolUseData.opener_used) updates.opener_used = toolUseData.opener_used;
      if (shouldTransition) updates.transition_trigger = 'sculptor_tool';
      if (Object.keys(updates).length > 0) {
        await service.updateSession(validSession.id, updates);
      }
    }

    // Stream the pre-fetched response to client as SSE using pull-based generator
    async function* generateSSEEvents(): AsyncGenerator<Uint8Array, void, unknown> {
      if (apiError) {
        yield sseEvent({ type: 'error', message: apiError });
      }

      // Yield content as word-boundary chunks for typing effect
      if (fullContent) {
        const chunks = fullContent.match(/.{1,12}/g) || [];
        for (const chunk of chunks) {
          yield sseEvent({ type: 'token', content: chunk });
        }
      }

      yield sseEvent({ type: 'complete', phase, shouldTransition });
    }

    const stream = streamFromGenerator(generateSSEEvents());

    return new Response(stream, { headers: SSE_HEADERS });
  } catch (error) {
    console.error('[Onboarding Message API] error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
