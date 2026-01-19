/**
 * API Route: Renubu Chat Stream
 *
 * SSE streaming endpoint for Renubu's post-Sculptor workflow.
 * Returns tokens incrementally as they're generated.
 */

import { NextRequest } from 'next/server';
import { AnthropicService, type ConversationMessage } from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import {
  getQuestionsSystemPrompt,
  getContextSystemPrompt,
  type PersonaFingerprint,
} from '@/lib/renubu/prompts';
import {
  createErrorResponse,
  getSSEHeaders,
} from '@/lib/api/streaming-response';

// =============================================================================
// TYPES
// =============================================================================

interface CurrentQuestion {
  id?: string;
  title?: string;
  prompt?: string;
  text?: string;
  slug?: string;
}

interface RenubuChatStreamRequest {
  message: string;
  conversation_history: ConversationMessage[];
  mode: 'questions' | 'context';
  current_question?: CurrentQuestion;
  persona_fingerprint?: PersonaFingerprint;
  session_id?: string;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export async function OPTIONS() {
  return new Response(null, { headers: getSSEHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body: RenubuChatStreamRequest = await request.json();
    const {
      message,
      conversation_history = [],
      mode,
      current_question,
      persona_fingerprint,
    } = body;

    if (!message) {
      return createErrorResponse('Message is required', 'MISSING_MESSAGE', 400);
    }

    if (!mode || !['questions', 'context'].includes(mode)) {
      return createErrorResponse('Mode must be "questions" or "context"', 'INVALID_MODE', 400);
    }

    // Build system prompt based on mode
    let systemPrompt: string;

    if (mode === 'questions') {
      if (!current_question) {
        return createErrorResponse(
          'current_question is required in questions mode',
          'MISSING_QUESTION',
          400
        );
      }
      systemPrompt = getQuestionsSystemPrompt(persona_fingerprint || null, current_question);
    } else {
      systemPrompt = getContextSystemPrompt(persona_fingerprint || null);
    }

    // Build messages array
    const messages: ConversationMessage[] = [
      ...conversation_history,
      { role: 'user', content: message },
    ];

    console.log('[API /renubu/chat/stream] Generating streaming response:', {
      mode,
      messageCount: messages.length,
      hasPersona: !!persona_fingerprint,
      questionTitle: current_question?.title || current_question?.slug || 'none',
    });

    // Create streaming generator
    const streamGenerator = AnthropicService.generateStreamingConversation({
      messages,
      systemPrompt,
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 500,
      temperature: 0.7,
    });

    // Create wrapper to process stream and detect next_action
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

      // Detect next action
      const NEXT_QUESTION_MARKER = '<!-- NEXT_QUESTION -->';
      const hasNextQuestionMarker = fullContent.includes(NEXT_QUESTION_MARKER);

      let nextAction: 'continue' | 'next_question' | 'transition_to_context' = 'continue';
      if (mode === 'questions' && hasNextQuestionMarker) {
        nextAction = 'next_question';
      }

      // Strip marker from content
      const cleanedContent = fullContent.replace(NEXT_QUESTION_MARKER, '').trim();

      return {
        content: cleanedContent,
        tokensUsed: finalResult?.tokensUsed ?? { input: 0, output: 0, total: 0 },
        model: finalResult?.model ?? '',
        stopReason: finalResult?.stopReason ?? 'end_turn',
        metadata: {
          next_action: nextAction,
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
    console.error('[API /renubu/chat/stream] Error:', error);
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
        console.error('[renubu/stream] Error:', error);
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
