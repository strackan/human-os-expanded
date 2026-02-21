/**
 * Onboarding Message API
 *
 * POST /api/onboarding/message — Send user message, get sculptor response via SSE
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
  // Guard against legacy sessions where the system trigger wasn't saved.
  if (messages.length > 0 && messages[0].role !== 'user') {
    messages.unshift({ role: 'user', content: '[Continue the onboarding conversation.]' });
  }

  return messages;
}

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

    console.log('[Onboarding Message] Starting stream, messages count:', messages.length,
      'first role:', messages[0]?.role, 'last role:', messages[messages.length - 1]?.role);

    const encoder = new TextEncoder();
    let fullContent = '';
    let toolUseData: SculptorMetadata | null = null;
    let eventCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[Onboarding Message] Calling Anthropic API...');
          const gen = AnthropicService.generateStreamingConversation({
            messages,
            systemPrompt,
            tools: [SCULPTOR_METADATA_TOOL],
            model: CLAUDE_SONNET_CURRENT,
            maxTokens: 500,
            temperature: 0.8,
          });

          for await (const event of gen) {
            eventCount++;
            if (event.type === 'text') {
              fullContent += event.content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'token', content: event.content })}\n\n`)
              );
            } else if (event.type === 'tool_use') {
              console.log('[Onboarding Message] Tool use:', event.toolUse.name);
              toolUseData = event.toolUse.input as SculptorMetadata;
            } else if (event.type === 'done') {
              console.log('[Onboarding Message] Done event, stopReason:', event.stopReason);
            }
          }

          console.log('[Onboarding Message] Stream finished. Events:', eventCount, 'Content length:', fullContent.length);
        } catch (err) {
          console.error('[Onboarding Message] Stream error:', err);
          const errMessage = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errMessage })}\n\n`)
          );
        }

        // Always persist + send complete, even if stream errored or ended without 'done'
        try {
          if (fullContent) {
            await service.appendMessage(session.id, {
              role: 'assistant',
              content: fullContent,
              timestamp: new Date().toISOString(),
              metadata: toolUseData ? { signals: toolUseData } : undefined,
            });
          }

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

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              phase,
              shouldTransition,
            })}\n\n`)
          );
        } catch (persistErr) {
          console.error('[Onboarding Message] Persist error:', persistErr);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'complete', phase: updatedSession.current_phase, shouldTransition: false })}\n\n`)
          );
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
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
