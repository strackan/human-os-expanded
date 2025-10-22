/**
 * Workflow Chat API
 *
 * High-level API for workflow chat interactions.
 * Combines ChatService and LLMService for complete chat functionality.
 */

import { ChatService, createChatService } from './ChatService';
import { LLMService, createLLMService } from './LLMService';
import type { SupabaseClient } from '@supabase/supabase-js';

export * from './ChatService';
export * from './LLMService';

export interface StartChatParams {
  workflow_execution_id: string;
  step_execution_id: string;
  workflow_id: string;
  step_id: string;
  branch_type: 'llm' | 'rag' | 'fixed';
  system_prompt?: string;
  context_data?: any;
}

export interface ChatResponseParams {
  thread_id: string;
  user_message: string;
  workflow_id?: string;
  step_id?: string;
  branch_id?: string;
}

/**
 * Start a new chat session for a workflow step
 */
export async function startChat(
  params: StartChatParams,
  supabase?: SupabaseClient
): Promise<{ thread_id: string; suggested_responses?: string[] }> {
  const chatService = createChatService(supabase);
  const llmService = createLLMService(supabase);

  // Create thread
  const thread = await chatService.createThread({
    workflow_execution_id: params.workflow_execution_id,
    step_execution_id: params.step_execution_id,
    thread_type: params.branch_type,
    system_prompt: params.system_prompt,
    context_data: params.context_data,
  });

  // Get suggested responses if this is a fixed branch
  let suggested_responses: string[] | undefined;
  if (params.branch_type === 'fixed') {
    suggested_responses = await llmService.getSuggestedResponses(
      params.workflow_id,
      params.step_id,
      supabase
    );
  }

  return {
    thread_id: thread.id,
    suggested_responses,
  };
}

/**
 * Send a message and get response
 */
export async function sendChatMessage(
  params: ChatResponseParams,
  supabase?: SupabaseClient
): Promise<{ response: string; next_step?: string; tokens_used?: number }> {
  const chatService = createChatService(supabase);
  const llmService = createLLMService(supabase);

  // Get thread to determine type
  const thread = await chatService.getThread(params.thread_id);
  if (!thread) {
    throw new Error('Thread not found');
  }

  if (thread.status !== 'active') {
    throw new Error('Thread is not active');
  }

  // Handle based on thread type
  if (thread.thread_type === 'fixed' && params.branch_id) {
    // Fixed branch response
    const result = await llmService.processFixedBranch(
      params.thread_id,
      params.branch_id,
      params.workflow_id!,
      params.step_id!,
      supabase
    );
    return result;
  } else if (thread.thread_type === 'llm') {
    // LLM response
    const response = await llmService.chat({
      thread_id: params.thread_id,
      user_message: params.user_message,
    });

    return {
      response: response.content,
      tokens_used: response.tokens_used,
    };
  } else if (thread.thread_type === 'rag') {
    // RAG response (TODO: implement RAG)
    // For now, use LLM with RAG context
    const response = await llmService.chat({
      thread_id: params.thread_id,
      user_message: params.user_message,
    });

    return {
      response: response.content,
      tokens_used: response.tokens_used,
    };
  }

  throw new Error('Unsupported thread type');
}

/**
 * Get chat history for a thread
 */
export async function getChatHistory(
  thread_id: string,
  supabase?: SupabaseClient
) {
  const chatService = createChatService(supabase);

  const [thread, messages] = await Promise.all([
    chatService.getThread(thread_id),
    chatService.getMessages(thread_id),
  ]);

  return {
    thread,
    messages,
  };
}

/**
 * Complete a chat session
 */
export async function completeChat(
  thread_id: string,
  supabase?: SupabaseClient
): Promise<void> {
  const chatService = createChatService(supabase);
  await chatService.completeThread(thread_id);
}

/**
 * Get all chat threads for a workflow execution
 */
export async function getExecutionChats(
  execution_id: string,
  supabase?: SupabaseClient
) {
  const chatService = createChatService(supabase);
  return chatService.getThreadsForExecution(execution_id);
}

/**
 * Get suggested responses for a workflow step
 */
export async function getSuggestedResponses(
  workflow_id: string,
  step_id: string,
  supabase?: SupabaseClient
): Promise<string[]> {
  const llmService = createLLMService(supabase);
  return llmService.getSuggestedResponses(workflow_id, step_id, supabase);
}
