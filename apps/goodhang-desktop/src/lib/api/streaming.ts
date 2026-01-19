/**
 * Streaming API Utilities
 *
 * Parses SSE events from response body and provides callbacks
 * for token, complete, and error events.
 */

import { getBaseUrl } from './client';

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
  metadata?: Record<string, unknown>;
}

export interface ErrorEvent {
  type: 'error';
  error: string;
  code?: string;
}

export type SSEEvent = TokenEvent | CompleteEvent | ErrorEvent;

export interface StreamingCallbacks {
  /** Called for each text token received */
  onToken?: (text: string) => void;
  /** Called when the stream completes successfully */
  onComplete?: (event: CompleteEvent) => void;
  /** Called when an error occurs */
  onError?: (error: string, code?: string) => void;
  /** Called when the stream starts */
  onStart?: () => void;
}

export interface StreamingRequestOptions {
  /** Auth token for Authorization header */
  token?: string | null;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Request timeout in milliseconds */
  timeout?: number;
}

// =============================================================================
// SSE PARSER
// =============================================================================

/**
 * Parse SSE events from a ReadableStream
 */
async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith(':')) {
          continue;
        }

        // Parse data lines
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

    // Process any remaining data in buffer
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

/**
 * Make a streaming POST request and process SSE events
 *
 * @param endpoint - API endpoint path
 * @param body - Request body
 * @param callbacks - Event callbacks
 * @param options - Request options
 * @returns Promise that resolves when stream completes
 */
export async function streamingFetch<T extends Record<string, unknown>>(
  endpoint: string,
  body: T,
  callbacks: StreamingCallbacks,
  options: StreamingRequestOptions = {}
): Promise<CompleteEvent | null> {
  const { token, signal, timeout = 60000 } = options;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

  // Combine signals
  const combinedSignal = signal
    ? anySignal([signal, controller.signal])
    : controller.signal;

  try {
    callbacks.onStart?.();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: combinedSignal,
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }
      callbacks.onError?.(errorMessage, `HTTP_${response.status}`);
      return null;
    }

    if (!response.body) {
      callbacks.onError?.('No response body', 'NO_BODY');
      return null;
    }

    // Process SSE events
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
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

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

/**
 * Combine multiple AbortSignals into one
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
  }

  return controller.signal;
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Create an AbortController with optional timeout
 */
export function createAbortController(timeoutMs?: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  if (timeoutMs) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  return {
    controller,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
}

/**
 * Helper to accumulate tokens into a string
 */
export function createTokenAccumulator(): {
  onToken: (text: string) => void;
  getText: () => string;
  clear: () => void;
} {
  let accumulated = '';

  return {
    onToken: (text: string) => {
      accumulated += text;
    },
    getText: () => accumulated,
    clear: () => {
      accumulated = '';
    },
  };
}
