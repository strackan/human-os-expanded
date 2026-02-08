/**
 * API Route: Sculptor Session Messages Stream
 *
 * SSE streaming endpoint for Sculptor session chat.
 * Returns tokens incrementally as they're generated.
 */

import { NextRequest } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import { SculptorService } from '@/lib/sculptor';
import { AnthropicService, type ConversationMessage } from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import { createErrorResponse, getSSEHeaders } from '@/lib/api/streaming-response';

// =============================================================================
// TYPES
// =============================================================================

interface MessageStreamRequestBody {
  message: string;
  conversation_history?: ConversationMessage[];
}

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export async function OPTIONS() {
  return new Response(null, { headers: getSSEHeaders() });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body: MessageStreamRequestBody = await request.json();
    const { message, conversation_history = [] } = body;

    if (!message) {
      return createErrorResponse('Message is required', 'MISSING_MESSAGE', 400);
    }

    // Use AdminClient to bypass RLS for full context access
    const supabase = getHumanOSAdminClient();
    const sculptorService = new SculptorService(supabase);

    // Get session
    const session = await sculptorService.getSession(sessionId);
    if (!session) {
      return createErrorResponse('Session not found', 'SESSION_NOT_FOUND', 404);
    }

    if (session.status === 'revoked') {
      return createErrorResponse('This session has been revoked', 'SESSION_REVOKED', 403);
    }

    // Get template
    if (!session.template) {
      return createErrorResponse('Session template not found', 'TEMPLATE_NOT_FOUND', 500);
    }

    // Build system prompt
    const systemPrompt = await sculptorService.getSessionSystemPrompt(session);
    if (!systemPrompt) {
      return createErrorResponse('Could not build system prompt', 'PROMPT_ERROR', 500);
    }

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

    console.log('[API /sculptor/messages/stream] Generating streaming response:', sessionId);

    // Create streaming generator
    const streamGenerator = AnthropicService.generateStreamingConversation({
      messages,
      systemPrompt: systemPrompt + completedPromptAddition,
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 2000,
      temperature: 0.8,
    });

    // Capture session values we need (session is already validated as non-null above)
    const sessionStatus = session.status;
    const sessionMetadata = (session.metadata as Record<string, unknown>) || {};

    // Create wrapper to process stream
    async function* processStream() {
      let fullContent = '';
      let finalResult: import('@/lib/services/AnthropicService').StreamingConversationResult | undefined;

      // Manually iterate to capture the return value
      while (true) {
        const iterResult = await streamGenerator.next();
        if (iterResult.done) {
          finalResult = iterResult.value;
          break;
        }
        const chunk = iterResult.value;
        if (chunk.type === 'text' && chunk.text) {
          fullContent += chunk.text;
        }
        yield chunk;
      }

      // Check for session completion marker
      const COMPLETION_MARKER = '<!-- SESSION_COMPLETE -->';
      const isSessionComplete = fullContent.includes(COMPLETION_MARKER);
      let finalStatus = sessionStatus;

      // Strip the completion marker
      const cleanedContent = fullContent.replace(COMPLETION_MARKER, '').trim();

      // Capture response
      if (conversation_history.length > 0) {
        const lastAssistantMessage = [...conversation_history]
          .reverse()
          .find((m) => m.role === 'assistant');

        if (lastAssistantMessage) {
          const sceneMatch = lastAssistantMessage.content.match(/## Scene \d+: ([^\n]+)/i);
          const scene = sceneMatch?.[1]?.toLowerCase().replace(/\s+/g, '-') ?? null;

          await sculptorService.captureResponse({
            session_id: sessionId,
            ...(scene ? { scene } : {}),
            question_text: lastAssistantMessage.content.slice(0, 200),
            response_text: message,
          });
        }
      }

      // Update session with conversation history
      const updatedConversation = [
        ...conversation_history,
        { role: 'user' as const, content: message },
        { role: 'assistant' as const, content: cleanedContent },
      ];

      if (isSessionComplete && sessionStatus !== 'completed') {
        console.log('[API /sculptor/messages/stream] Session completion marker detected');
        finalStatus = 'completed';
      }

      await supabase
        .from('sculptor_sessions')
        .update({
          metadata: {
            ...sessionMetadata,
            conversation_history: updatedConversation,
          },
          last_accessed_at: new Date().toISOString(),
          ...(isSessionComplete ? { status: 'completed' } : {}),
        })
        .eq('id', sessionId);

      // Auto-trigger finalization when session completes
      if (isSessionComplete && sessionStatus !== 'completed') {
        const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sculptor-gap-final`;
        fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        })
          .then(res => console.log(`[API /sculptor/messages/stream] Auto-finalize triggered: ${res.status}`))
          .catch(err => console.error('[API /sculptor/messages/stream] Auto-finalize failed:', err));
      }

      return {
        content: cleanedContent,
        tokensUsed: finalResult?.tokensUsed ?? { input: 0, output: 0, total: 0 },
        model: finalResult?.model ?? '',
        stopReason: finalResult?.stopReason ?? 'end_turn',
        metadata: {
          session_status: finalStatus,
        },
      };
    }

    const wrappedGenerator = processStream() as AsyncGenerator<
      import('@/lib/services/AnthropicService').StreamingChunk,
      import('@/lib/services/AnthropicService').StreamingConversationResult & {
        metadata?: Record<string, unknown>;
      },
      unknown
    >;

    return createStreamingResponseWithMetadata(wrappedGenerator);
  } catch (error) {
    console.error('[API /sculptor/messages/stream] Error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * Create streaming response with metadata extraction
 */
function createStreamingResponseWithMetadata(
  generator: AsyncGenerator<
    import('@/lib/services/AnthropicService').StreamingChunk,
    import('@/lib/services/AnthropicService').StreamingConversationResult & {
      metadata?: Record<string, unknown>;
    },
    unknown
  >
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let finalResult:
          | (import('@/lib/services/AnthropicService').StreamingConversationResult & {
              metadata?: Record<string, unknown>;
            })
          | undefined;

        while (true) {
          const { value, done } = await generator.next();

          if (done) {
            finalResult = value;
            break;
          }

          if (value.type === 'text' && value.text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', text: value.text })}\n\n`)
            );
          }
        }

        if (finalResult) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                content: finalResult.content,
                tokensUsed: finalResult.tokensUsed,
                model: finalResult.model,
                stopReason: finalResult.stopReason,
                metadata: finalResult.metadata,
              })}\n\n`
            )
          );
        }

        controller.close();
      } catch (error) {
        console.error('[sculptor/stream] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: getSSEHeaders(),
  });
}
