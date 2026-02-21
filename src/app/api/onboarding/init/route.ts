/**
 * Onboarding Init API
 *
 * POST /api/onboarding/init — Trigger sculptor's opening message via SSE
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { OnboardingService } from '@/lib/services/OnboardingService';
import { AnthropicService } from '@/lib/services/AnthropicService';
import { getSculptorSystemPrompt, SCULPTOR_METADATA_TOOL } from '@/lib/onboarding/sculptor-prompt';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';

interface SculptorMetadata {
  current_phase?: number;
  opener_used?: string;
  should_transition?: boolean;
  detected_signals?: string[];
}

/** Convert an async generator of Uint8Array chunks into a pull-based ReadableStream */
function streamFromGenerator(gen: AsyncGenerator<Uint8Array, void, unknown>): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await gen.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
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
    const { sessionId } = body;

    const service = new OnboardingService(supabase);
    const session = await service.getActiveSession(user.id);

    if (!session || session.id !== sessionId) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validSession = session;

    // Get user display name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || user.email?.split('@')[0] || 'there';
    const systemPrompt = getSculptorSystemPrompt(userName);

    // Sculptor initiates — system trigger as first user message
    const systemTrigger = '[System: The user has just arrived at onboarding. Greet them warmly and ask your ice-breaker question. Keep it brief.]';
    const messages = [{ role: 'user' as const, content: systemTrigger }];

    // Persist the system trigger so conversation_log starts with a user message
    await service.appendMessage(validSession.id, {
      role: 'user',
      content: systemTrigger,
      timestamp: new Date().toISOString(),
    });

    console.log('[Onboarding Init] Starting stream for user:', userName);

    const encoder = new TextEncoder();

    async function* generateSSEEvents(): AsyncGenerator<Uint8Array, void, unknown> {
      let fullContent = '';
      let toolUseData: SculptorMetadata | null = null;

      try {
        const gen = AnthropicService.generateStreamingConversation({
          messages,
          systemPrompt,
          tools: [SCULPTOR_METADATA_TOOL],
          model: CLAUDE_SONNET_CURRENT,
          maxTokens: 500,
          temperature: 0.8,
        });

        for await (const event of gen) {
          if (event.type === 'text') {
            fullContent += event.content;
            yield encoder.encode(`data: ${JSON.stringify({ type: 'token', content: event.content })}\n\n`);
          } else if (event.type === 'tool_use') {
            toolUseData = event.toolUse.input as SculptorMetadata;
          }
        }
      } catch (err) {
        console.error('[Onboarding Init] Stream error:', err);
        const errMsg = err instanceof Error ? err.message : 'Stream error';
        yield encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`);
      }

      // Always persist + send complete
      try {
        if (fullContent) {
          await service.appendMessage(validSession.id, {
            role: 'assistant',
            content: fullContent,
            timestamp: new Date().toISOString(),
          });
        }

        if (toolUseData) {
          const updates: Record<string, unknown> = {};
          if (toolUseData.current_phase) updates.current_phase = toolUseData.current_phase;
          if (toolUseData.opener_used) updates.opener_used = toolUseData.opener_used;
          if (Object.keys(updates).length > 0) {
            await service.updateSession(validSession.id, updates as Partial<Pick<import('@/lib/services/OnboardingService').OnboardingSession, 'current_phase' | 'opener_used' | 'opener_depth' | 'transition_trigger'>>);
          }
        }

        yield encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          phase: toolUseData?.current_phase || 1,
          shouldTransition: false,
        })}\n\n`);
      } catch (persistErr) {
        console.error('[Onboarding Init] Persist error:', persistErr);
        yield encoder.encode(`data: ${JSON.stringify({ type: 'complete', phase: 1, shouldTransition: false })}\n\n`);
      }
    }

    const stream = streamFromGenerator(generateSSEEvents());

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[Onboarding Init API] error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to initialize onboarding' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
