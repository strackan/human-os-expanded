'use client';

/**
 * useChatService Hook
 *
 * Integrates with ChatService and LLMService
 * Manages chat thread, messages, and state
 */

import { useState, useEffect, useCallback } from 'react';
import { ChatService, type ChatMessage } from '@/lib/workflows/chat/ChatService';
import { LLMService } from '@/lib/workflows/chat/LLMService';

interface UseChatServiceParams {
  workflowExecutionId: string;
  stepExecutionId: string;
  workflowId: string;
  stepId: string;
  systemPrompt?: string;
}

interface UseChatServiceReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  threadId: string | null;
  initialized: boolean;
}

export function useChatService(params: UseChatServiceParams): UseChatServiceReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const chatService = new ChatService();
  const llmService = new LLMService();

  // Initialize thread on mount
  useEffect(() => {
    initializeThread();
  }, [params.workflowExecutionId, params.stepExecutionId]);

  const initializeThread = async () => {
    try {
      // Check if thread already exists for this step execution
      const { data: existingThreads } = await chatService['client']
        .from('workflow_chat_threads')
        .select('*')
        .eq('step_execution_id', params.stepExecutionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      let thread;

      if (existingThreads && existingThreads.length > 0) {
        // Use existing thread
        thread = existingThreads[0];
        console.log('[useChatService] Using existing thread:', thread.id);
      } else {
        // Create new thread
        thread = await chatService.createThread({
          workflow_execution_id: params.workflowExecutionId,
          step_execution_id: params.stepExecutionId,
          thread_type: 'llm',
          system_prompt: params.systemPrompt || 'You are a helpful CSM assistant. Help the user with their workflow tasks.',
          context_data: {
            workflowId: params.workflowId,
            stepId: params.stepId
          }
        });
        console.log('[useChatService] Created new thread:', thread.id);
      }

      setThreadId(thread.id);

      // Load existing messages
      const msgs = await chatService.getMessages(thread.id);
      setMessages(msgs);
      setInitialized(true);
    } catch (err) {
      console.error('[useChatService] Error initializing thread:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize chat');
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!threadId) {
      console.error('[useChatService] No thread ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send message and get LLM response (uses mock)
      await llmService.chat({
        thread_id: threadId,
        user_message: content
      });

      // Reload messages from database
      const updatedMessages = await chatService.getMessages(threadId);
      setMessages(updatedMessages);
    } catch (err) {
      console.error('[useChatService] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    threadId,
    initialized
  };
}
