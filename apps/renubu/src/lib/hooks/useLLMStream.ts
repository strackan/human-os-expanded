/**
 * useLLMStream Hook
 *
 * Manages LLM streaming connections with Server-Sent Events (SSE).
 *
 * Features:
 * - SSE connection management
 * - Token-by-token content streaming
 * - Error recovery and retry logic
 * - Stop/cancel generation
 * - Progress tracking
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// =====================================================
// Types
// =====================================================

export interface LLMStreamOptions {
  executionId: string;
  stepId: string;
  prompt?: string;
  context?: any;
  onComplete?: (content: string) => void;
  onError?: (error: Error) => void;
}

export interface LLMStreamState {
  isStreaming: boolean;
  content: string;
  error: string | null;
  isComplete: boolean;
  tokenCount: number;
}

// =====================================================
// useLLMStream Hook
// =====================================================

export function useLLMStream() {
  const [state, setState] = useState<LLMStreamState>({
    isStreaming: false,
    content: '',
    error: null,
    isComplete: false,
    tokenCount: 0
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // =====================================================
  // Start Streaming
  // =====================================================

  const startStreaming = useCallback(async (options: LLMStreamOptions) => {
    try {
      // Reset state
      setState({
        isStreaming: true,
        content: '',
        error: null,
        isComplete: false,
        tokenCount: 0
      });

      console.log('[useLLMStream] Starting stream for step:', options.stepId);

      // Create abort controller for fetch request
      abortControllerRef.current = new AbortController();

      // Build URL with query params
      const params = new URLSearchParams({
        executionId: options.executionId,
        stepId: options.stepId
      });

      if (options.prompt) {
        params.append('prompt', options.prompt);
      }

      if (options.context) {
        params.append('context', JSON.stringify(options.context));
      }

      const url = `/api/workflows/executions/${options.executionId}/steps/${options.stepId}/stream?${params}`;

      // Create EventSource for SSE
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      let accumulatedContent = '';
      let tokenCount = 0;

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'token') {
            // Token received
            accumulatedContent += data.content;
            tokenCount++;

            setState(prev => ({
              ...prev,
              content: accumulatedContent,
              tokenCount
            }));
          } else if (data.type === 'complete') {
            // Stream completed
            console.log('[useLLMStream] Stream complete, total tokens:', tokenCount);

            setState(prev => ({
              ...prev,
              isStreaming: false,
              isComplete: true
            }));

            eventSource.close();
            options.onComplete?.(accumulatedContent);
          } else if (data.type === 'error') {
            // Error occurred
            throw new Error(data.message || 'Unknown streaming error');
          }
        } catch (error) {
          console.error('[useLLMStream] Error parsing SSE data:', error);
          handleError(error as Error, options);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('[useLLMStream] EventSource error:', error);
        handleError(new Error('Connection lost'), options);
      };

    } catch (error) {
      console.error('[useLLMStream] Error starting stream:', error);
      handleError(error as Error, options);
    }
  }, []);

  // =====================================================
  // Stop Streaming
  // =====================================================

  const stopStreaming = useCallback(() => {
    console.log('[useLLMStream] Stopping stream');

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isStreaming: false,
      isComplete: true
    }));
  }, []);

  // =====================================================
  // Retry Streaming
  // =====================================================

  const retryStreaming = useCallback((options: LLMStreamOptions) => {
    console.log('[useLLMStream] Retrying stream');
    stopStreaming();
    setTimeout(() => {
      startStreaming(options);
    }, 1000); // Wait 1 second before retry
  }, [startStreaming, stopStreaming]);

  // =====================================================
  // Error Handling
  // =====================================================

  const handleError = useCallback((error: Error, options: LLMStreamOptions) => {
    console.error('[useLLMStream] Stream error:', error);

    setState(prev => ({
      ...prev,
      isStreaming: false,
      error: error.message,
      isComplete: false
    }));

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    options.onError?.(error);
  }, []);

  // =====================================================
  // Reset State
  // =====================================================

  const reset = useCallback(() => {
    stopStreaming();
    setState({
      isStreaming: false,
      content: '',
      error: null,
      isComplete: false,
      tokenCount: 0
    });
  }, [stopStreaming]);

  // =====================================================
  // Cleanup on Unmount
  // =====================================================

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // =====================================================
  // Return API
  // =====================================================

  return {
    ...state,
    startStreaming,
    stopStreaming,
    retryStreaming,
    reset
  };
}

// =====================================================
// Helper: Format Streaming Content
// =====================================================

export function formatStreamingContent(content: string): string {
  // Add smooth transitions for partial markdown
  // Handle incomplete code blocks, lists, etc.

  let formatted = content;

  // If content ends with an incomplete code block, add closing fence
  const codeBlockCount = (content.match(/```/g) || []).length;
  if (codeBlockCount % 2 === 1) {
    formatted += '\n```';
  }

  // If content ends with an incomplete list item, complete it
  if (/\n[-*+]\s*$/.test(content)) {
    formatted += '...';
  }

  return formatted;
}

// =====================================================
// Helper: Estimate Reading Time
// =====================================================

export function estimateReadingTime(tokenCount: number): string {
  // Rough estimate: 1 token ≈ 0.75 words
  // Average reading speed: 200 words per minute
  const words = Math.floor(tokenCount * 0.75);
  const minutes = Math.ceil(words / 200);

  if (minutes < 1) return 'Less than 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}
