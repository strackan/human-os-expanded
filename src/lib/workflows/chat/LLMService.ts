/**
 * LLM Service
 *
 * Handles LLM integration for workflow chat threads.
 * Supports streaming responses, tool calling, and context management.
 * Integrates with MCP (Model Context Protocol) for enhanced AI capabilities.
 */

import { ChatService, type ChatMessage } from './ChatService';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMCPManager } from '@/lib/mcp/MCPManager';
import { getMCPClientConfigs } from '@/lib/mcp/config/mcp-registry';
import { isMCPEnabled } from '@/lib/mcp/config/mcp-registry';
import type { MCPToolCall } from '@/lib/mcp/types/mcp.types';

export interface LLMResponse {
  content: string;
  tokens_used: number;
  tool_calls?: ToolCall[];
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

export interface ToolCall {
  name: string;
  input: any;
  output?: any;
}

export interface LLMChatParams {
  thread_id: string;
  user_message: string;
  stream?: boolean;
  tools?: any[];
}

/**
 * LLM Service
 */
export class LLMService {
  private chatService: ChatService;
  private mcpEnabled: boolean;

  constructor(companyId?: string | null, supabase?: SupabaseClient) {
    this.chatService = new ChatService(companyId, supabase);
    this.mcpEnabled = isMCPEnabled();
  }

  /**
   * Send a chat message and get LLM response
   */
  async chat(params: LLMChatParams): Promise<LLMResponse> {
    const { thread_id, user_message, stream = false, tools } = params;

    // 1. Record user message
    await this.chatService.sendMessage({
      thread_id,
      content: user_message,
      role: 'user',
    });

    // 2. Get thread context
    const context = await this.chatService.getLLMContext(thread_id);
    if (!context) {
      throw new Error('Thread does not have LLM context');
    }

    // 3. Get conversation history
    const messages = await this.chatService.getMessages(thread_id);

    // 4. Build LLM messages array
    const llmMessages = [
      { role: 'system', content: context.system_prompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // 5. Get tool definitions (including MCP tools if enabled)
    const toolDefinitions = await this.getAllToolDefinitions(
      tools || context.tools_available || []
    );

    // 6. Call LLM (using OpenAI API format)
    const response = await this.callLLM({
      messages: llmMessages,
      model: context.model_used || 'gpt-4',
      temperature: context.temperature || 0.7,
      max_tokens: context.max_tokens || 2000,
      tools: toolDefinitions,
      stream,
    });

    // 7. Execute MCP tool calls if any
    if (response.tool_calls && this.mcpEnabled) {
      response.tool_calls = await this.executeMCPTools(response.tool_calls);
    }

    // 8. Record assistant message
    const assistantMsg = await this.chatService.sendMessage({
      thread_id,
      content: response.content,
      role: 'assistant',
      metadata: {
        tokens_used: response.tokens_used,
        finish_reason: response.finish_reason,
      },
    });

    // 9. Update token usage
    await this.chatService.updateTokensUsed(thread_id, response.tokens_used);

    // 10. Record tool calls if any
    if (response.tool_calls) {
      for (const toolCall of response.tool_calls) {
        await this.chatService.recordToolCall(
          thread_id,
          assistantMsg.id,
          toolCall.name,
          toolCall.input,
          toolCall.output,
          true
        );
      }
    }

    return response;
  }

  /**
   * Call LLM API (placeholder - implement with actual LLM provider)
   */
  private async callLLM(params: {
    messages: any[];
    model: string;
    temperature: number;
    max_tokens: number;
    tools?: any[];
    stream?: boolean;
  }): Promise<LLMResponse> {
    // TODO: Implement actual LLM API call (OpenAI, Anthropic, etc.)
    // For now, return a mock response

    const userMessage = params.messages[params.messages.length - 1]?.content || '';

    // Mock response based on user input
    let content = "I understand. How can I help you with this workflow step?";

    // Simple pattern matching for demo purposes
    if (userMessage.toLowerCase().includes('quote')) {
      content = "I'll help you prepare a quote. Based on the account information, I recommend starting with the current pricing and considering any expansion opportunities.";
    } else if (userMessage.toLowerCase().includes('email')) {
      content = "I'll help you draft an email. What's the main purpose of this communication?";
    } else if (userMessage.toLowerCase().includes('call')) {
      content = "I'll help you schedule a call. What topics do you want to cover in the meeting?";
    }

    return {
      content,
      tokens_used: Math.floor(userMessage.length / 4) + Math.floor(content.length / 4), // Rough estimate
      finish_reason: 'stop',
    };
  }

  /**
   * Get all tool definitions (including MCP tools)
   */
  private async getAllToolDefinitions(toolNames: string[]): Promise<any[]> {
    const tools: any[] = [];

    // Get traditional tool definitions
    tools.push(...this.getToolDefinitions(toolNames));

    // Get MCP tool definitions if enabled
    if (this.mcpEnabled) {
      try {
        const mcpManager = getMCPManager({
          clients: getMCPClientConfigs(),
        });

        // Initialize if not already initialized
        if (!mcpManager) {
          console.warn('MCP Manager not initialized, skipping MCP tools');
        } else {
          const mcpTools = mcpManager.getToolDefinitions();
          tools.push(...mcpTools);
        }
      } catch (error) {
        console.error('Failed to get MCP tools:', error);
      }
    }

    return tools;
  }

  /**
   * Get tool definitions for available tools
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getToolDefinitions(toolNames: string[]): any[] {
    // TODO: Implement tool definitions registry
    // For now, return empty array
    return [];
  }

  /**
   * Execute MCP tool calls
   */
  private async executeMCPTools(toolCalls: ToolCall[]): Promise<ToolCall[]> {
    const executedCalls: ToolCall[] = [];

    for (const toolCall of toolCalls) {
      // Check if this is an MCP tool
      if (toolCall.name.startsWith('mcp_')) {
        try {
          const mcpManager = getMCPManager();

          const mcpToolCall: MCPToolCall = {
            id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'function',
            function: {
              name: toolCall.name,
              arguments: JSON.stringify(toolCall.input),
            },
          };

          const result = await mcpManager.executeTool(mcpToolCall);
          const parsedResult = JSON.parse(result.content);

          executedCalls.push({
            ...toolCall,
            output: parsedResult.data,
          });
        } catch (error) {
          console.error(`MCP tool execution failed for ${toolCall.name}:`, error);
          executedCalls.push({
            ...toolCall,
            output: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      } else {
        // Non-MCP tool, keep as is
        executedCalls.push(toolCall);
      }
    }

    return executedCalls;
  }

  /**
   * Stream chat response
   */
  async *streamChat(params: LLMChatParams): AsyncGenerator<string> {
    // TODO: Implement streaming
    // For now, just yield the full response
    const response = await this.chat({ ...params, stream: true });
    yield response.content;
  }

  /**
   * Get suggested responses based on branch configuration
   */
  async getSuggestedResponses(
    workflowId: string,
    stepId: string,
    supabase?: SupabaseClient
  ): Promise<string[]> {
    const client = supabase || this.chatService['client'];

    const { data, error } = await client
      .from('workflow_chat_branches')
      .select('branch_label, user_prompts')
      .eq('workflow_id', workflowId)
      .eq('step_id', stepId)
      .eq('branch_type', 'fixed');

    if (error) {
      console.error('Failed to get suggested responses:', error);
      return [];
    }

    // Flatten all user prompts from fixed branches
    const suggestions: string[] = [];
    data.forEach((branch) => {
      if (branch.user_prompts && Array.isArray(branch.user_prompts)) {
        suggestions.push(...branch.user_prompts);
      }
    });

    return suggestions;
  }

  /**
   * Process a fixed branch response
   */
  async processFixedBranch(
    threadId: string,
    branchId: string,
    workflowId: string,
    stepId: string,
    supabase?: SupabaseClient
  ): Promise<{ response: string; next_step?: string }> {
    const client = supabase || this.chatService['client'];

    // Get branch configuration
    const { data: branch, error } = await client
      .from('workflow_chat_branches')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('step_id', stepId)
      .eq('branch_id', branchId)
      .single();

    if (error || !branch) {
      throw new Error('Branch not found');
    }

    // Record response message
    await this.chatService.sendMessage({
      thread_id: threadId,
      content: branch.response_text || 'Acknowledged.',
      role: 'assistant',
    });

    return {
      response: branch.response_text || 'Acknowledged.',
      next_step: branch.next_step_id,
    };
  }
}

/**
 * Create an LLM service instance
 */
export function createLLMService(
  companyId?: string | null,
  supabase?: SupabaseClient
): LLMService {
  return new LLMService(companyId, supabase);
}
