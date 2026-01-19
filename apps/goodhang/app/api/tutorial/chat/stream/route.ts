/**
 * API Route: Tutorial Chat Stream
 *
 * SSE streaming endpoint for the tutorial chat.
 * Returns tokens incrementally as they're generated.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  AnthropicService,
  type ConversationMessage,
} from '@/lib/services/AnthropicService';
import { CLAUDE_SONNET_CURRENT } from '@/lib/constants/claude-models';
import {
  type TutorialProgress,
  type TutorialContext,
  getTutorialSystemPrompt,
  parseActionFromResponse,
} from '@/lib/tutorial/prompts';
import { type PersonaFingerprint } from '@/lib/renubu/prompts';
import {
  createErrorResponse,
  getSSEHeaders,
} from '@/lib/api/streaming-response';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// =============================================================================
// TYPES
// =============================================================================

interface OutstandingQuestion {
  id: string;
  title: string;
  prompt: string;
  category: string;
  covers?: string[];
}

interface TutorialChatStreamRequest {
  message: string;
  conversation_history: ConversationMessage[];
  session_id: string;
  progress: TutorialProgress;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export async function OPTIONS() {
  return new Response(null, { headers: getSSEHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body: TutorialChatStreamRequest = await request.json();
    const { message, conversation_history = [], session_id, progress } = body;

    if (!session_id) {
      return createErrorResponse('session_id is required', 'MISSING_SESSION', 400);
    }

    if (!message) {
      return createErrorResponse('message is required', 'MISSING_MESSAGE', 400);
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, entity_slug, entity_name, metadata')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('[tutorial/chat/stream] Session not found:', sessionError);
      return createErrorResponse('Session not found', 'SESSION_NOT_FOUND', 404);
    }

    // Extract data from session
    const personaFingerprint: PersonaFingerprint | null =
      session.metadata?.persona_fingerprint || null;
    const outstandingQuestions: OutstandingQuestion[] =
      session.metadata?.outstanding_questions || [];
    const executiveReport = session.metadata?.executive_report || null;
    const firstName = session.entity_name?.split(' ')[0] || 'there';

    // Calculate current question based on progress
    const currentQuestion =
      progress.currentStep === 'questions' &&
      outstandingQuestions.length > progress.questionsAnswered
        ? outstandingQuestions[progress.questionsAnswered]
        : null;

    // Build tutorial context
    const tutorialContext: TutorialContext = {
      firstName,
      progress: {
        ...progress,
        totalQuestions: outstandingQuestions.length || 5,
      },
      personaFingerprint,
      currentQuestion,
      executiveReport,
    };

    // Build system prompt
    const systemPrompt = getTutorialSystemPrompt(tutorialContext);

    // Build messages array
    const messages: ConversationMessage[] = [
      ...conversation_history,
      { role: 'user', content: message },
    ];

    console.log('[API /tutorial/chat/stream] Generating streaming response:', {
      step: progress.currentStep,
      questionsAnswered: progress.questionsAnswered,
      totalQuestions: tutorialContext.progress.totalQuestions,
      messageCount: messages.length,
      hasPersona: !!personaFingerprint,
    });

    // Create streaming generator
    const streamGenerator = AnthropicService.generateStreamingConversation({
      messages,
      systemPrompt,
      model: CLAUDE_SONNET_CURRENT,
      maxTokens: 800,
      temperature: 0.7,
    });

    // Create wrapper generator that calculates progress on completion
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

      // Parse action from complete response
      const { action: parsedAction } = parseActionFromResponse(fullContent);

      // Calculate new progress
      const newProgress = { ...tutorialContext.progress };

      switch (parsedAction) {
        case 'show_report':
          newProgress.currentStep = 'about_you';
          newProgress.stepIndex = 1;
          break;
        case 'skip_report':
          newProgress.currentStep = 'gather_intro';
          newProgress.stepIndex = 2;
          break;
        case 'step_complete': {
          const stepOrder = ['welcome', 'about_you', 'gather_intro', 'questions', 'complete'] as const;
          const currentIndex = stepOrder.indexOf(newProgress.currentStep);
          const nextStep = stepOrder[currentIndex + 1];
          if (currentIndex < stepOrder.length - 1 && nextStep) {
            newProgress.currentStep = nextStep;
            newProgress.stepIndex = currentIndex + 1;
          }
          break;
        }
        case 'start_questions':
          newProgress.currentStep = 'questions';
          newProgress.stepIndex = 3;
          break;
        case 'question_answered':
          newProgress.questionsAnswered += 1;
          if (newProgress.questionsAnswered >= newProgress.totalQuestions) {
            newProgress.currentStep = 'complete';
            newProgress.stepIndex = 4;
          }
          break;
        case 'tutorial_complete':
          newProgress.currentStep = 'complete';
          newProgress.stepIndex = 4;
          break;
      }

      // Get next question if in questions step
      const nextQuestion =
        newProgress.currentStep === 'questions' &&
        outstandingQuestions.length > newProgress.questionsAnswered
          ? outstandingQuestions[newProgress.questionsAnswered]
          : null;

      // Return final result with metadata
      return {
        content: fullContent,
        tokensUsed: finalResult?.tokensUsed ?? { input: 0, output: 0, total: 0 },
        model: finalResult?.model ?? '',
        stopReason: finalResult?.stopReason ?? 'end_turn',
        metadata: {
          action: parsedAction,
          progress: newProgress,
          questions: outstandingQuestions,
          report: executiveReport,
          currentQuestion: nextQuestion,
        },
      };
    }

    // This is a simplified approach - we create a wrapper that processes the stream
    // and adds metadata to the complete event
    const wrappedGenerator = processStream() as AsyncGenerator<
      import('@/lib/services/AnthropicService').StreamingChunk,
      import('@/lib/services/AnthropicService').StreamingConversationResult & {
        metadata?: Record<string, unknown>;
      },
      unknown
    >;

    // Get metadata from the generator's return value
    return createStreamingResponseWithMetadata(wrappedGenerator);
  } catch (error) {
    console.error('[API /tutorial/chat/stream] Error:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * Create streaming response with metadata extraction from generator
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

        // Process the generator
        while (true) {
          const { value, done } = await generator.next();

          if (done) {
            finalResult = value;
            break;
          }

          // Yield token events for text chunks
          if (value.type === 'text' && value.text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', text: value.text })}\n\n`)
            );
          }
        }

        // Send complete event with final result and metadata
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
        console.error('[streaming-response] Error in stream:', error);
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
