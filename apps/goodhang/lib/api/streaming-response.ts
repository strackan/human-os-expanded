/**
 * Streaming Response Utility
 *
 * Shared SSE response builder for all chat routes.
 * Provides consistent event formatting and error handling.
 */

import type { StreamingConversationResult } from '@/lib/services/AnthropicService';

// =============================================================================
// TYPES
// =============================================================================

export type SSEEventType = 'token' | 'complete' | 'error';

export interface TokenEvent {
  type: 'token';
  text: string;
}

export interface CompleteEvent {
  type: 'complete';
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  stopReason: string;
  metadata?: {
    action?: string;
    progress?: Record<string, unknown>;
    toolResults?: unknown[];
    [key: string]: unknown;
  };
}

export interface ErrorEvent {
  type: 'error';
  error: string;
  code?: string | undefined;
}

export type SSEEvent = TokenEvent | CompleteEvent | ErrorEvent;

export interface StreamingResponseOptions {
  /** Metadata to include in the complete event */
  metadata?: Record<string, unknown>;
  /** Custom headers to add to the response */
  headers?: Record<string, string>;
}

// =============================================================================
// SSE FORMATTING
// =============================================================================

/**
 * Format an SSE event as a string
 */
export function formatSSEEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Format a token event
 */
export function formatTokenEvent(text: string): string {
  return formatSSEEvent({ type: 'token', text });
}

/**
 * Format a complete event
 */
export function formatCompleteEvent(
  result: StreamingConversationResult,
  metadata?: Record<string, unknown>
): string {
  return formatSSEEvent({
    type: 'complete',
    content: result.content,
    tokensUsed: result.tokensUsed,
    model: result.model,
    stopReason: result.stopReason,
    ...(metadata ? { metadata } : {}),
  });
}

/**
 * Format an error event
 */
export function formatErrorEvent(error: string, code?: string): string {
  return formatSSEEvent({ type: 'error', error, code });
}

// =============================================================================
// RESPONSE BUILDER
// =============================================================================

/**
 * Create SSE response headers
 */
export function getSSEHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...customHeaders,
  };
}

/**
 * Create a ReadableStream that yields SSE events from an async generator
 *
 * @param generator - Async generator that yields StreamingChunk objects
 * @param options - Additional options for the response
 */
export function createStreamingResponse(
  generator: AsyncGenerator<
    import('@/lib/services/AnthropicService').StreamingChunk,
    StreamingConversationResult,
    unknown
  >,
  options: StreamingResponseOptions = {}
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let result: StreamingConversationResult | undefined;

        // Process the generator
        while (true) {
          const { value, done } = await generator.next();

          if (done) {
            // The return value is the final result
            result = value;
            break;
          }

          // Yield token events for text chunks
          if (value.type === 'text' && value.text) {
            controller.enqueue(encoder.encode(formatTokenEvent(value.text)));
          }
        }

        // Send complete event with final result
        if (result) {
          controller.enqueue(
            encoder.encode(formatCompleteEvent(result, options.metadata))
          );
        }

        controller.close();
      } catch (error) {
        console.error('[streaming-response] Error in stream:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode(formatErrorEvent(errorMessage)));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: getSSEHeaders(options.headers),
  });
}

/**
 * Create an SSE error response
 */
export function createErrorResponse(
  error: string,
  code?: string,
  status: number = 500
): Response {
  const headers = getSSEHeaders();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(formatErrorEvent(error, code)));
      controller.close();
    },
  });

  return new Response(stream, { status, headers });
}

// =============================================================================
// HELPER FOR NON-STREAMING FALLBACK
// =============================================================================

/**
 * Create a streaming response from a pre-computed result
 * Useful for when streaming isn't needed but the client expects SSE
 */
export function createMockStreamingResponse(
  content: string,
  tokensUsed: { input: number; output: number; total: number },
  model: string,
  metadata?: Record<string, unknown>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send the entire content as a single token event
      controller.enqueue(encoder.encode(formatTokenEvent(content)));

      // Send complete event
      controller.enqueue(
        encoder.encode(
          formatCompleteEvent(
            {
              content,
              tokensUsed,
              model,
              stopReason: 'end_turn',
            },
            metadata
          )
        )
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: getSSEHeaders(),
  });
}
