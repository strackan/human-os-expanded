/**
 * Onboarding Message API
 *
 * POST /api/onboarding/message — Send user message, get sculptor response
 *
 * Returns plain JSON (not SSE). The client handles typing animation locally.
 * SSE streaming works for the init route but fails to deliver tokens for this
 * route on Vercel regardless of approach (streaming, blocking+fake-stream, etc).
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
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return Response.json({ error: 'message and sessionId required' }, { status: 400 });
    }

    const service = new OnboardingService(supabase);
    const session = await service.getActiveSession(user.id);

    if (!session || session.id !== sessionId) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Append user message to log
    await service.appendMessage(session.id, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Reload session to get updated log
    const reloadedSession = await service.getActiveSession(user.id);
    if (!reloadedSession) {
      return Response.json({ error: 'Session lost' }, { status: 500 });
    }

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

    console.log('[Onboarding Message] Calling Anthropic, messages:', messages.length);

    // Call Anthropic (blocking)
    const response = await AnthropicService.generateConversation({
      messages,
      systemPrompt,
      tools: [SCULPTOR_METADATA_TOOL],
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 500,
      temperature: 0.8,
    });

    const fullContent = response.content;
    let toolUseData: SculptorMetadata | null = null;

    console.log('[Onboarding Message] Got response, length:', fullContent.length);

    if (response.toolUses && response.toolUses.length > 0) {
      const metadataTool = response.toolUses.find(t => t.name === 'update_session_metadata');
      if (metadataTool) {
        toolUseData = metadataTool.input as SculptorMetadata;
      }
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
    const phase = toolUseData?.current_phase || currentPhase;

    if (toolUseData) {
      const updates: Partial<Pick<import('@/lib/services/OnboardingService').OnboardingSession, 'current_phase' | 'opener_used' | 'opener_depth' | 'transition_trigger'>> = {};
      if (toolUseData.current_phase) updates.current_phase = toolUseData.current_phase;
      if (toolUseData.opener_used) updates.opener_used = toolUseData.opener_used;
      if (shouldTransition) updates.transition_trigger = 'sculptor_tool';
      if (Object.keys(updates).length > 0) {
        await service.updateSession(session.id, updates);
      }
    }

    return Response.json({
      content: fullContent,
      phase,
      shouldTransition,
    });
  } catch (error) {
    console.error('[Onboarding Message API] error:', error);
    return Response.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
