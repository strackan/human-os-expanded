/**
 * Unified Streaming Chat Client
 *
 * Shared logic for streaming chat across tutorial and production.
 */

import { streamingFetch, type StreamingCallbacks, type CompleteEvent } from './streaming';
import type { Message } from './types';

// =============================================================================
// TYPES
// =============================================================================

export type ChatType = 'tutorial' | 'production';

export interface StreamingChatConfig {
  endpoint: string;
  extraParams?: Record<string, unknown> | undefined;
  timeout?: number | undefined;
}

export interface StreamingChatCallbacks {
  onStart?: (() => void) | undefined;
  onToken?: ((text: string) => void) | undefined;
  onComplete?: ((event: CompleteEvent) => void) | undefined;
  onError?: ((error: string) => void) | undefined;
}

export interface StreamingChatOptions {
  token?: string | null | undefined;
  signal?: AbortSignal | undefined;
}

// =============================================================================
// CHAT TYPE CONFIGS
// =============================================================================

const CHAT_CONFIGS: Record<ChatType, StreamingChatConfig> = {
  tutorial: {
    endpoint: '/api/tutorial/chat/stream',
    timeout: 60000,
  },
  production: {
    endpoint: '/api/production/chat/stream',
    timeout: 120000,
  },
};

// =============================================================================
// STREAMING CHAT CLIENT
// =============================================================================

export async function sendStreamingMessage(
  chatType: ChatType,
  message: string,
  conversationHistory: Message[],
  params: Record<string, unknown>,
  callbacks: StreamingChatCallbacks,
  options: StreamingChatOptions = {}
): Promise<CompleteEvent | null> {
  const config = CHAT_CONFIGS[chatType];

  let endpoint = config.endpoint;
  if (params.sessionId && endpoint.includes('{sessionId}')) {
    endpoint = endpoint.replace('{sessionId}', String(params.sessionId));
  }

  const body = {
    message,
    conversation_history: conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    ...params,
  };

  return streamingFetch(
    endpoint,
    body,
    {
      onStart: callbacks.onStart,
      onToken: callbacks.onToken,
      onComplete: callbacks.onComplete,
      onError: callbacks.onError,
    },
    {
      token: options.token,
      signal: options.signal,
      timeout: config.timeout,
    }
  );
}

// =============================================================================
// HOOKS INTEGRATION
// =============================================================================

export function createStreamingHookCallbacks(
  hooks: {
    addStreamingPlaceholder: () => void;
    appendToLastAssistantMessage: (chunk: string) => void;
    finalizeStreamingMessage: (content: string) => void;
    setIsStreaming: (streaming: boolean) => void;
    setIsLoading: (loading: boolean) => void;
  },
  additionalCallbacks?: StreamingChatCallbacks
): StreamingCallbacks {
  return {
    onStart: () => {
      hooks.setIsLoading(true);
      hooks.setIsStreaming(true);
      hooks.addStreamingPlaceholder();
      additionalCallbacks?.onStart?.();
    },
    onToken: (text) => {
      hooks.appendToLastAssistantMessage(text);
      additionalCallbacks?.onToken?.(text);
    },
    onComplete: (event) => {
      hooks.finalizeStreamingMessage(event.content);
      hooks.setIsStreaming(false);
      hooks.setIsLoading(false);
      additionalCallbacks?.onComplete?.(event);
    },
    onError: (error) => {
      hooks.setIsStreaming(false);
      hooks.setIsLoading(false);
      additionalCallbacks?.onError?.(error);
    },
  };
}
