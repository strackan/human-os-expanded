/**
 * Onboarding Message API
 *
 * POST /api/onboarding/message — Send user message, get sculptor response
 *
 * Returns plain JSON. The client handles typing animation locally.
 *
 * When Claude responds with only a tool_use (no text), we send the tool
 * results back so Claude continues with its conversational text response.
 */

import Anthropic from '@anthropic-ai/sdk';
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

    // Call Anthropic (blocking)
    const response = await AnthropicService.generateConversation({
      messages,
      systemPrompt,
      tools: [SCULPTOR_METADATA_TOOL],
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 500,
      temperature: 0.8,
    });

    let fullContent = response.content;
    let toolUseData: SculptorMetadata | null = null;

    // Extract sculptor metadata from tool use
    if (response.toolUses && response.toolUses.length > 0) {
      const metadataTool = response.toolUses.find(t => t.name === 'update_session_metadata');
      if (metadataTool) {
        toolUseData = metadataTool.input as SculptorMetadata;
      }
    }

    // When Claude stops for tool_use, send tool results back so it
    // continues with its conversational text response
    if (response.stopReason === 'tool_use' && response.toolUses?.length) {

      const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
      const client = new Anthropic({ apiKey });

      // Build the full message history including the tool_use + tool_result turn
      const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Assistant's tool_use response
      apiMessages.push({
        role: 'assistant',
        content: response.toolUses.map((tu) => ({
          type: 'tool_use' as const,
          id: tu.id,
          name: tu.name,
          input: tu.input,
        })),
      });

      // User's tool_result
      apiMessages.push({
        role: 'user',
        content: response.toolUses.map((tu) => ({
          type: 'tool_result' as const,
          tool_use_id: tu.id,
          content: JSON.stringify({ success: true }),
        })),
      });

      const followUp = await client.messages.create({
        model: CLAUDE_SONNET_CURRENT,
        max_tokens: 500,
        temperature: 0.8,
        system: systemPrompt,
        messages: apiMessages,
        tools: [
          {
            name: SCULPTOR_METADATA_TOOL.name,
            description: SCULPTOR_METADATA_TOOL.description,
            input_schema: SCULPTOR_METADATA_TOOL.input_schema as Anthropic.Tool['input_schema'],
          },
        ],
      });

      // Extract text from follow-up
      for (const block of followUp.content) {
        if (block.type === 'text') {
          fullContent += block.text;
        } else if (block.type === 'tool_use' && block.name === 'update_session_metadata') {
          // Merge any additional metadata from follow-up
          toolUseData = { ...toolUseData, ...(block.input as SculptorMetadata) };
        }
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
