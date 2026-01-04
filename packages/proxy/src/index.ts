/**
 * Claude API Proxy
 *
 * Transparent proxy for Anthropic API that captures conversations
 * for searchability and cross-org intelligence.
 *
 * Latency budget:
 * - Hot path (passthrough): +3-5ms
 * - Warm path (with context): +5-10ms
 *
 * Usage:
 * ```typescript
 * import { createProxy } from '@human-os/proxy';
 *
 * const proxy = createProxy({
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   supabaseUrl: process.env.SUPABASE_URL,
 *   supabaseKey: process.env.SUPABASE_SERVICE_KEY,
 * });
 *
 * // In your API route handler:
 * export async function POST(request: Request) {
 *   return proxy.handleMessages(request);
 * }
 * ```
 */

import type {
  ProxyConfig,
  ProxyResult,
  AnthropicRequest,
  AnthropicResponse,
  CapturePayload,
} from './types.js';
import { queueCapture, generateConversationId, type CaptureConfig } from './capture.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';

export interface ClaudeProxy {
  /**
   * Handle /v1/messages endpoint
   * Supports both streaming and non-streaming requests
   */
  handleMessages(request: Request): Promise<Response>;

  /**
   * Handle any Anthropic API endpoint (passthrough)
   */
  handleRequest(request: Request, path: string): Promise<Response>;
}

/**
 * Create a Claude API proxy instance
 */
export function createProxy(config: ProxyConfig = {}): ClaudeProxy {
  const baseUrl = config.baseUrl || ANTHROPIC_API_URL;

  // Lazy API key resolution - checked at request time, not creation time
  const getApiKey = () => {
    const key = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    return key;
  };

  const captureConfig: CaptureConfig = {
    supabaseUrl: config.supabaseUrl || process.env.SUPABASE_URL,
    supabaseKey: config.supabaseKey || process.env.SUPABASE_SERVICE_KEY,
    kv: config.kv, // Vercel KV client for Redis queue (~1-2ms)
    enabled: config.captureEnabled ?? true,
  };

  return {
    async handleMessages(request: Request): Promise<Response> {
      const startTime = Date.now();
      const conversationId = generateConversationId();

      try {
        // Parse request body
        const body = await request.json() as AnthropicRequest;
        const isStreaming = body.stream === true;

        // Resolve user ID (async-safe)
        const userId = config.getUserId
          ? await config.getUserId(request)
          : body.metadata?.user_id || null;

        // Forward to Anthropic
        const anthropicResponse = await fetch(`${baseUrl}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': getApiKey(),
            'anthropic-version': ANTHROPIC_VERSION,
          },
          body: JSON.stringify(body),
        });

        if (isStreaming) {
          // Streaming: capture happens via stream interceptor
          return handleStreamingResponse(
            anthropicResponse,
            body,
            conversationId,
            userId,
            startTime,
            captureConfig
          );
        } else {
          // Non-streaming: capture the full response
          return handleNonStreamingResponse(
            anthropicResponse,
            body,
            conversationId,
            userId,
            startTime,
            captureConfig
          );
        }
      } catch (error) {
        console.error('[proxy] Error:', error);
        return new Response(
          JSON.stringify({
            error: {
              type: 'proxy_error',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    },

    async handleRequest(request: Request, path: string): Promise<Response> {
      // Generic passthrough for other Anthropic endpoints
      const url = `${baseUrl}${path}`;

      const headers = new Headers(request.headers);
      headers.set('x-api-key', getApiKey());
      headers.set('anthropic-version', ANTHROPIC_VERSION);
      headers.delete('host');

      return fetch(url, {
        method: request.method,
        headers,
        body: request.method !== 'GET' ? await request.text() : undefined,
      });
    },
  };
}

/**
 * Handle non-streaming response
 */
async function handleNonStreamingResponse(
  anthropicResponse: Response,
  requestBody: AnthropicRequest,
  conversationId: string,
  userId: string | null,
  startTime: number,
  captureConfig: CaptureConfig
): Promise<Response> {
  const responseText = await anthropicResponse.text();
  const latencyMs = Date.now() - startTime;

  // Try to parse response for capture
  let responseData: AnthropicResponse | null = null;
  try {
    responseData = JSON.parse(responseText) as AnthropicResponse;
  } catch {
    // Response may not be JSON (error case)
  }

  // Fire-and-forget capture
  if (responseData) {
    const payload: CapturePayload = {
      conversation_id: conversationId,
      user_id: userId,
      model: requestBody.model,
      messages: requestBody.messages,
      response: {
        content: responseData.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join(''),
        stop_reason: responseData.stop_reason,
        usage: responseData.usage,
      },
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
    };

    queueCapture(payload, captureConfig);
  }

  // Return response with conversation ID header
  return new Response(responseText, {
    status: anthropicResponse.status,
    headers: {
      'Content-Type': 'application/json',
      'x-conversation-id': conversationId,
      'x-proxy-latency-ms': String(latencyMs),
    },
  });
}

/**
 * Handle streaming response with capture
 */
function handleStreamingResponse(
  anthropicResponse: Response,
  requestBody: AnthropicRequest,
  conversationId: string,
  userId: string | null,
  startTime: number,
  captureConfig: CaptureConfig
): Response {
  if (!anthropicResponse.body) {
    return new Response('No response body', { status: 500 });
  }

  // Create a transform stream to intercept chunks
  let accumulatedContent = '';
  let usage: { input_tokens: number; output_tokens: number } | undefined;
  let stopReason: string | undefined;

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      // Pass through immediately (don't block)
      controller.enqueue(chunk);

      // Parse SSE events for capture (async, non-blocking)
      try {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              // Accumulate content delta
              if (event.type === 'content_block_delta' && event.delta?.text) {
                accumulatedContent += event.delta.text;
              }

              // Capture usage from message_delta
              if (event.type === 'message_delta') {
                stopReason = event.delta?.stop_reason;
                if (event.usage) {
                  usage = event.usage;
                }
              }

              // Capture usage from message_start
              if (event.type === 'message_start' && event.message?.usage) {
                usage = {
                  input_tokens: event.message.usage.input_tokens,
                  output_tokens: 0,
                };
              }
            } catch {
              // Skip unparseable events
            }
          }
        }
      } catch {
        // Don't block on parse errors
      }
    },

    flush() {
      // Stream complete - fire capture
      const latencyMs = Date.now() - startTime;

      const payload: CapturePayload = {
        conversation_id: conversationId,
        user_id: userId,
        model: requestBody.model,
        messages: requestBody.messages,
        response: {
          content: accumulatedContent,
          stop_reason: stopReason,
          usage,
        },
        latency_ms: latencyMs,
        timestamp: new Date().toISOString(),
      };

      queueCapture(payload, captureConfig);
    },
  });

  const readable = anthropicResponse.body.pipeThrough(transformStream);

  return new Response(readable, {
    status: anthropicResponse.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'x-conversation-id': conversationId,
    },
  });
}

// Re-export types and utilities
export * from './types.js';
export { generateConversationId, queueCapture, CAPTURE_QUEUE_KEY } from './capture.js';
export type { CaptureConfig } from './capture.js';
export { consumeQueue } from './queue-consumer.js';
export type { QueueConsumerConfig, ConsumeResult } from './queue-consumer.js';
