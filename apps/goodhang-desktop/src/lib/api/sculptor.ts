/**
 * Sculptor API Client
 *
 * API methods for Sculptor session management.
 */

import { get, post } from './client';
import { streamingFetch, type StreamingCallbacks, type StreamingRequestOptions, type CompleteEvent } from './streaming';
import type { PersonaFingerprint, ExecutiveReport, Message } from '../types';

// =============================================================================
// REQUEST TYPES
// =============================================================================

export interface SaveAnswersRequest {
  answers: Array<{
    question_id: string;
    answer: string;
  }>;
  source?: string;
}

export interface ConsolidatedAnswerRequest {
  question_id: string;
  answer: string;
  covers?: string[];
  maps_to?: string[];
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface FinalizationResponse {
  status: string;
  outstanding_questions?: Array<{
    slug?: string;
    text?: string;
    category?: string;
    id?: string;
    title?: string;
    prompt?: string;
    covers?: string[];
    maps_to?: string[];
  }>;
  persona_fingerprint?: PersonaFingerprint;
}

export interface ReportResponse {
  report?: ExecutiveReport;
  status?: string;
}

// =============================================================================
// API METHODS
// =============================================================================

/**
 * Fetch finalization data for a session
 */
export async function getFinalizationData(
  sessionId: string,
  token?: string | null
): Promise<FinalizationResponse> {
  return get<FinalizationResponse>(
    `/api/sculptor/sessions/${sessionId}/finalize`,
    token
  );
}

/**
 * Get executive report for a session
 */
export async function getExecutiveReport(
  sessionId: string,
  token?: string | null
): Promise<ReportResponse> {
  return post<ReportResponse>(
    `/api/sculptor/sessions/${sessionId}/report`,
    { type: 'executive' },
    token
  );
}

/**
 * Save answers for a session
 */
export async function saveAnswers(
  sessionId: string,
  request: SaveAnswersRequest,
  token?: string | null
): Promise<{ success: boolean }> {
  return post<{ success: boolean }>(
    `/api/sculptor/sessions/${sessionId}/answers`,
    request,
    token
  );
}

/**
 * Save a single answer with consolidated format support
 */
export async function saveAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
  options?: { covers?: string[]; maps_to?: string[] },
  token?: string | null
): Promise<{ success: boolean }> {
  const body: ConsolidatedAnswerRequest = {
    question_id: questionId,
    answer,
  };

  if (options?.covers) body.covers = options.covers;
  if (options?.maps_to) body.maps_to = options.maps_to;

  return post<{ success: boolean }>(
    `/api/sculptor/sessions/${sessionId}/answers`,
    body,
    token
  );
}

/**
 * Send messages in a session
 */
export async function sendSessionMessage(
  sessionId: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  options?: {
    mode?: string;
    current_question?: unknown;
    persona_fingerprint?: PersonaFingerprint;
  },
  token?: string | null
): Promise<{ content: string; next_action?: string }> {
  return post<{ content: string; next_action?: string }>(
    `/api/sculptor/sessions/${sessionId}/messages`,
    {
      message,
      conversation_history: conversationHistory,
      ...options,
    },
    token
  );
}

// =============================================================================
// STREAMING API METHODS
// =============================================================================

export interface SculptorStreamingResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  session_status?: string;
}

export interface SculptorStreamingCallbacks extends StreamingCallbacks {
  /** Called when streaming completes with parsed response data */
  onResponse?: (response: SculptorStreamingResponse) => void;
}

/**
 * Send a message in a sculptor session with SSE streaming
 *
 * @param sessionId - Session ID
 * @param message - User message
 * @param conversationHistory - Conversation history
 * @param callbacks - Streaming callbacks
 * @param options - Request options including token
 */
export async function sendSessionMessageStreaming(
  sessionId: string,
  message: string,
  conversationHistory: Message[],
  callbacks: SculptorStreamingCallbacks,
  options?: StreamingRequestOptions & { token?: string | null }
): Promise<CompleteEvent | null> {
  const result = await streamingFetch(
    `/api/sculptor/sessions/${sessionId}/messages/stream`,
    {
      message,
      conversation_history: conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    },
    {
      onToken: callbacks.onToken,
      onError: callbacks.onError,
      onStart: callbacks.onStart,
      onComplete: (event) => {
        callbacks.onComplete?.(event);

        // Parse into sculptor response
        const metadata = event.metadata || {};
        const response: SculptorStreamingResponse = {
          content: event.content,
          tokensUsed: event.tokensUsed,
          model: event.model,
          session_status: metadata.session_status as string | undefined,
        };

        callbacks.onResponse?.(response);
      },
    },
    { token: options?.token, signal: options?.signal, timeout: options?.timeout ?? 60000 }
  );

  return result;
}
