/**
 * Streaming API Utilities
 *
 * SSE parser for streaming chat responses.
 * Uses relative URLs (same-origin).
 */

// =============================================================================
// TYPES
// =============================================================================

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
  metadata?: Record<string, unknown> | undefined;
}

export interface ErrorEvent {
  type: 'error';
  error: string;
  code?: string | undefined;
}

export type SSEEvent = TokenEvent | CompleteEvent | ErrorEvent;

export interface StreamingCallbacks {
  onToken?: ((text: string) => void) | undefined;
  onComplete?: ((event: CompleteEvent) => void) | undefined;
  onError?: ((error: string, code?: string) => void) | undefined;
  onStart?: (() => void) | undefined;
}

export interface StreamingRequestOptions {
  token?: string | null | undefined;
  signal?: AbortSignal | undefined;
  timeout?: number | undefined;
}

// =============================================================================
// SSE PARSER
// =============================================================================

async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          try {
            const event = JSON.parse(data) as SSEEvent;
            yield event;
          } catch (e) {
            console.warn('[streaming] Failed to parse SSE event:', data, e);
          }
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        try {
          const event = JSON.parse(data) as SSEEvent;
          yield event;
        } catch (e) {
          console.warn('[streaming] Failed to parse final SSE event:', data, e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// =============================================================================
// STREAMING FETCH
// =============================================================================

export async function streamingFetch<T extends Record<string, unknown>>(
  endpoint: string,
  body: T,
  callbacks: StreamingCallbacks,
  options: StreamingRequestOptions = {}
): Promise<CompleteEvent | null> {
  const { token, signal, timeout = 60000 } = options;

  const controller = new AbortController();
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

  const combinedSignal = signal
    ? anySignal([signal, controller.signal])
    : controller.signal;

  try {
    callbacks.onStart?.();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: combinedSignal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      callbacks.onError?.(errorMessage, `HTTP_${response.status}`);
      return null;
    }

    if (!response.body) {
      callbacks.onError?.('No response body', 'NO_BODY');
      return null;
    }

    let completeEvent: CompleteEvent | null = null;

    for await (const event of parseSSEStream(response.body)) {
      switch (event.type) {
        case 'token':
          callbacks.onToken?.(event.text);
          break;
        case 'complete':
          completeEvent = event;
          callbacks.onComplete?.(event);
          break;
        case 'error':
          callbacks.onError?.(event.error, event.code);
          break;
      }
    }

    return completeEvent;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        callbacks.onError?.('Request aborted', 'ABORTED');
      } else {
        callbacks.onError?.(error.message, 'FETCH_ERROR');
      }
    } else {
      callbacks.onError?.('Unknown error', 'UNKNOWN');
    }

    return null;
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
