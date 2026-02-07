/**
 * Unified Streaming Chat Client
 *
 * Provides a unified interface for streaming chat across different chat types
 * (tutorial, renubu, sculptor) with shared logic for state management.
 */

import { streamingFetch, type StreamingCallbacks, type CompleteEvent } from './streaming';
import type { Message } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export type ChatType = 'tutorial' | 'renubu' | 'sculptor' | 'production';

export interface StreamingChatConfig {
  /** Base endpoint path (e.g., '/api/tutorial/chat/stream') */
  endpoint: string;
  /** Additional request body properties */
  extraParams?: Record<string, unknown>;
  /** Request timeout in ms */
  timeout?: number;
}

export interface StreamingChatCallbacks {
  /** Called when streaming starts */
  onStart?: () => void;
  /** Called for each token received */
  onToken?: (text: string) => void;
  /** Called when streaming completes */
  onComplete?: (event: CompleteEvent) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

export interface StreamingChatOptions {
  /** Auth token */
  token?: string | null;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

// =============================================================================
// CHAT TYPE CONFIGS
// =============================================================================

const CHAT_CONFIGS: Record<ChatType, StreamingChatConfig> = {
  tutorial: {
    endpoint: '/api/tutorial/chat/stream',
    timeout: 60000,
  },
  renubu: {
    endpoint: '/api/renubu/chat/stream',
    timeout: 60000,
  },
  sculptor: {
    endpoint: '/api/sculptor/sessions/{sessionId}/messages/stream',
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

/**
 * Send a streaming chat message
 *
 * @param chatType - Type of chat (tutorial, renubu, sculptor)
 * @param message - User message
 * @param conversationHistory - Conversation history
 * @param params - Additional parameters for the request
 * @param callbacks - Streaming callbacks
 * @param options - Request options
 * @returns Promise that resolves when streaming completes
 */
export async function sendStreamingMessage(
  chatType: ChatType,
  message: string,
  conversationHistory: Message[],
  params: Record<string, unknown>,
  callbacks: StreamingChatCallbacks,
  options: StreamingChatOptions = {}
): Promise<CompleteEvent | null> {
  const config = CHAT_CONFIGS[chatType];

  // Build endpoint (replace {sessionId} if present)
  let endpoint = config.endpoint;
  if (params.sessionId && endpoint.includes('{sessionId}')) {
    endpoint = endpoint.replace('{sessionId}', String(params.sessionId));
  }

  // Build request body
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
// CONVENIENCE HOOKS INTEGRATION
// =============================================================================

/**
 * Create streaming callbacks that integrate with useChatState hook
 *
 * @param hooks - Object containing hook methods from useChatState
 * @param additionalCallbacks - Additional callbacks to run
 */
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

// =============================================================================
// FEATURE FLAG UTILITY
// =============================================================================

/**
 * Check if streaming is enabled
 * Reads from VITE_USE_STREAMING environment variable
 */
export function isStreamingEnabled(): boolean {
  try {
    return import.meta.env.VITE_USE_STREAMING !== 'false';
  } catch {
    // Default to enabled if env is not available
    return true;
  }
}
