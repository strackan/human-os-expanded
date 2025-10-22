/**
 * Chat Service
 *
 * Manages workflow chat threads and messages.
 * Supports LLM-driven conversations, RAG, and fixed responses.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

export type ThreadType = 'llm' | 'rag' | 'fixed';
export type ThreadStatus = 'active' | 'completed' | 'abandoned';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'chart' | 'table' | 'code';

export interface ChatThread {
  id: string;
  workflow_execution_id: string;
  step_execution_id: string;
  thread_type: ThreadType;
  status: ThreadStatus;
  return_to_step?: string;
  total_messages: number;
  total_tokens: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: MessageRole;
  content: string;
  message_type: MessageType;
  metadata?: any;
  tokens_used?: number;
  sequence_number: number;
  created_at: string;
}

export interface CreateThreadParams {
  workflow_execution_id: string;
  step_execution_id: string;
  thread_type: ThreadType;
  return_to_step?: string;
  system_prompt?: string;
  context_data?: any;
}

export interface SendMessageParams {
  thread_id: string;
  content: string;
  role?: MessageRole;
  message_type?: MessageType;
  metadata?: any;
}

/**
 * Chat Service
 */
export class ChatService {
  private client: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.client = supabase || createBrowserClient();
  }

  /**
   * Create a new chat thread
   */
  async createThread(params: CreateThreadParams): Promise<ChatThread> {
    const { data, error } = await this.client
      .from('workflow_chat_threads')
      .insert({
        workflow_execution_id: params.workflow_execution_id,
        step_execution_id: params.step_execution_id,
        thread_type: params.thread_type,
        return_to_step: params.return_to_step,
        status: 'active',
        total_messages: 0,
        total_tokens: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create thread: ${error.message}`);
    }

    // If LLM thread, create LLM context
    if (params.thread_type === 'llm' && params.system_prompt) {
      await this.createLLMContext(data.id, {
        system_prompt: params.system_prompt,
        context_data: params.context_data || {},
      });
    }

    return data;
  }

  /**
   * Get a thread by ID
   */
  async getThread(threadId: string): Promise<ChatThread | null> {
    const { data, error } = await this.client
      .from('workflow_chat_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get thread: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all threads for a workflow execution
   */
  async getThreadsForExecution(executionId: string): Promise<ChatThread[]> {
    const { data, error } = await this.client
      .from('workflow_chat_threads')
      .select('*')
      .eq('workflow_execution_id', executionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get threads: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Send a message in a thread
   */
  async sendMessage(params: SendMessageParams): Promise<ChatMessage> {
    // Get current thread to determine next sequence number
    const thread = await this.getThread(params.thread_id);
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (thread.status !== 'active') {
      throw new Error('Cannot send message to inactive thread');
    }

    const sequence_number = thread.total_messages + 1;

    const { data, error } = await this.client
      .from('workflow_chat_messages')
      .insert({
        thread_id: params.thread_id,
        role: params.role || 'user',
        content: params.content,
        message_type: params.message_type || 'text',
        metadata: params.metadata,
        sequence_number,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    // Update thread message count
    await this.client
      .from('workflow_chat_threads')
      .update({
        total_messages: sequence_number,
      })
      .eq('id', params.thread_id);

    return data;
  }

  /**
   * Get messages in a thread
   */
  async getMessages(threadId: string, limit?: number): Promise<ChatMessage[]> {
    let query = this.client
      .from('workflow_chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('sequence_number', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Complete a thread
   */
  async completeThread(threadId: string): Promise<void> {
    const { error } = await this.client
      .from('workflow_chat_threads')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    if (error) {
      throw new Error(`Failed to complete thread: ${error.message}`);
    }
  }

  /**
   * Abandon a thread
   */
  async abandonThread(threadId: string): Promise<void> {
    const { error } = await this.client
      .from('workflow_chat_threads')
      .update({
        status: 'abandoned',
        ended_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    if (error) {
      throw new Error(`Failed to abandon thread: ${error.message}`);
    }
  }

  /**
   * Create LLM context for a thread
   */
  private async createLLMContext(
    threadId: string,
    params: {
      system_prompt: string;
      context_data: any;
      tools_available?: string[];
      model_used?: string;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<void> {
    const { error } = await this.client
      .from('workflow_llm_context')
      .insert({
        thread_id: threadId,
        system_prompt: params.system_prompt,
        tools_available: params.tools_available || [],
        context_data: params.context_data,
        model_used: params.model_used || 'gpt-4',
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2000,
        total_tokens_used: 0,
      });

    if (error) {
      throw new Error(`Failed to create LLM context: ${error.message}`);
    }
  }

  /**
   * Get LLM context for a thread
   */
  async getLLMContext(threadId: string): Promise<any> {
    const { data, error } = await this.client
      .from('workflow_llm_context')
      .select('*')
      .eq('thread_id', threadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get LLM context: ${error.message}`);
    }

    return data;
  }

  /**
   * Update LLM context tokens used
   */
  async updateTokensUsed(threadId: string, tokensUsed: number): Promise<void> {
    // Update LLM context
    const context = await this.getLLMContext(threadId);
    if (context) {
      await this.client
        .from('workflow_llm_context')
        .update({
          total_tokens_used: context.total_tokens_used + tokensUsed,
        })
        .eq('thread_id', threadId);
    }

    // Update thread
    const thread = await this.getThread(threadId);
    if (thread) {
      await this.client
        .from('workflow_chat_threads')
        .update({
          total_tokens: thread.total_tokens + tokensUsed,
        })
        .eq('id', threadId);
    }
  }

  /**
   * Record a tool call
   */
  async recordToolCall(
    threadId: string,
    messageId: string,
    toolName: string,
    toolInput: any,
    toolOutput?: any,
    success?: boolean,
    errorMessage?: string
  ): Promise<void> {
    const { error } = await this.client
      .from('workflow_llm_tool_calls')
      .insert({
        thread_id: threadId,
        message_id: messageId,
        tool_name: toolName,
        tool_input: toolInput,
        tool_output: toolOutput,
        success,
        error_message: errorMessage,
      });

    if (error) {
      throw new Error(`Failed to record tool call: ${error.message}`);
    }
  }

  /**
   * Get tool calls for a thread
   */
  async getToolCalls(threadId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('workflow_llm_tool_calls')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get tool calls: ${error.message}`);
    }

    return data || [];
  }
}

/**
 * Create a chat service instance
 */
export function createChatService(supabase?: SupabaseClient): ChatService {
  return new ChatService(supabase);
}
