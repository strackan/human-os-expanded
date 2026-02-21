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

    // Get user display name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.full_name || user.email?.split('@')[0] || 'there';
    const systemPrompt = getSculptorSystemPrompt(userName);

    // Sculptor initiates — empty conversation, assistant goes first
    const messages = [{ role: 'user' as const, content: '[System: The user has just arrived at onboarding. Greet them warmly and ask your ice-breaker question. Keep it brief.]' }];

    const encoder = new TextEncoder();
    let fullContent = '';
    let toolUseData: SculptorMetadata | null = null;

    const stream = new ReadableStream({
      async start(controller) {
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
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'token', content: event.content })}\n\n`)
              );
            } else if (event.type === 'tool_use') {
              toolUseData = event.toolUse.input as SculptorMetadata;
            } else if (event.type === 'done') {
              // Persist the assistant message
              if (fullContent) {
                await service.appendMessage(session.id, {
                  role: 'assistant',
                  content: fullContent,
                  timestamp: new Date().toISOString(),
                });
              }

              // Update session metadata from tool call
              if (toolUseData) {
                const updates: Record<string, unknown> = {};
                if (toolUseData.current_phase) updates.current_phase = toolUseData.current_phase;
                if (toolUseData.opener_used) updates.opener_used = toolUseData.opener_used;
                if (Object.keys(updates).length > 0) {
                  await service.updateSession(session.id, updates as Partial<Pick<import('@/lib/services/OnboardingService').OnboardingSession, 'current_phase' | 'opener_used' | 'opener_depth' | 'transition_trigger'>>);
                }
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'complete',
                  phase: toolUseData?.current_phase || 1,
                  shouldTransition: false,
                })}\n\n`)
              );
            }
          }

          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
          );
          controller.close();
        }
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
    console.error('[Onboarding Init API] error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to initialize onboarding' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
