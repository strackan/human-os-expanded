/**
 * Anthropic Service
 *
 * Handles integration with Anthropic's Claude API for AI-powered email generation.
 * Uses Claude Haiku 4.5 for fast, cost-effective email composition.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_HAIKU_CURRENT } from '@/lib/constants/claude-models';

export interface AnthropicCompletionParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicConversationParams {
  messages: ConversationMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  tools?: AnthropicTool[];
}

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AnthropicToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AnthropicConversationResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  stopReason: string;
  toolUses?: AnthropicToolUse[];
}

export interface StreamingChunk {
  type: 'text' | 'tool_use_start' | 'tool_use_delta' | 'tool_use_end' | 'message_start' | 'message_delta' | 'message_stop';
  text?: string;
  toolUse?: {
    id: string;
    name: string;
    input?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export interface StreamingConversationResult {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  stopReason: string;
  toolUses?: AnthropicToolUse[];
}

export interface AnthropicCompletionResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  stopReason: string;
}

/**
 * Anthropic Service
 *
 * Provides methods for calling Claude API for text generation.
 * Follows existing service patterns (static methods, error handling).
 */
export class AnthropicService {
  /**
   * Generate a completion using Claude API
   *
   * @param params - Completion parameters
   * @returns Completion response with content and token usage
   * @throws Error if API call fails or API key is missing
   */
  static async generateCompletion(
    params: AnthropicCompletionParams
  ): Promise<AnthropicCompletionResponse> {
    try {
      // Validate API key
      const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error(
          'Anthropic API key not found. Set CLAUDE_API_KEY or ANTHROPIC_API_KEY in environment.'
        );
      }

      // Initialize client
      const client = new Anthropic({
        apiKey,
      });

      // Set defaults
      const model = params.model || CLAUDE_HAIKU_CURRENT;
      const maxTokens = params.maxTokens || 1024; // Reasonable for emails
      const temperature = params.temperature ?? 0.7; // Balanced creativity
      const systemPrompt = params.systemPrompt || 'You are a professional Customer Success Manager writing emails to customers.';

      // Call Claude API
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: params.prompt,
          },
        ],
      });

      // Extract text content from response
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => ('text' in block ? block.text : ''))
        .join('\n');

      // Build response object
      return {
        content: textContent,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        stopReason: response.stop_reason || 'end_turn',
      };
    } catch (error) {
      console.error('AnthropicService.generateCompletion error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid or missing Anthropic API key');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Anthropic API rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Anthropic API request timed out. Please try again.');
        }
        throw new Error(`Anthropic API error: ${error.message}`);
      }

      throw new Error('Unknown error calling Anthropic API');
    }
  }

  /**
   * Generate a conversation response with multi-turn support
   *
   * @param params - Conversation parameters including message history
   * @returns Conversation response with content and optional tool uses
   */
  static async generateConversation(
    params: AnthropicConversationParams
  ): Promise<AnthropicConversationResponse> {
    try {
      const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error(
          'Anthropic API key not found. Set CLAUDE_API_KEY or ANTHROPIC_API_KEY in environment.'
        );
      }

      const client = new Anthropic({ apiKey });

      const model = params.model || CLAUDE_HAIKU_CURRENT;
      const maxTokens = params.maxTokens || 2000;
      const temperature = params.temperature ?? 0.7;
      const systemPrompt = params.systemPrompt || 'You are a helpful AI assistant.';

      // Build request params
      const requestParams: Anthropic.MessageCreateParams = {
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: params.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      // Add tools if provided
      if (params.tools && params.tools.length > 0) {
        requestParams.tools = params.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema,
        }));
      }

      const response = await client.messages.create(requestParams);

      // Extract text content and tool uses
      let textContent = '';
      const toolUses: AnthropicToolUse[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += block.text;
        } else if (block.type === 'tool_use') {
          toolUses.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      return {
        content: textContent,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        stopReason: response.stop_reason || 'end_turn',
        ...(toolUses.length > 0 ? { toolUses } : {}),
      };
    } catch (error) {
      console.error('AnthropicService.generateConversation error:', error);

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid or missing Anthropic API key');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Anthropic API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Anthropic API error: ${error.message}`);
      }

      throw new Error('Unknown error calling Anthropic API');
    }
  }

  /**
   * Generate a streaming completion (for future use)
   *
   * @param params - Completion parameters
   * @returns AsyncGenerator that yields text chunks
   */
  static async *generateStreamingCompletion(
    params: AnthropicCompletionParams
  ): AsyncGenerator<string, void, unknown> {
    try {
      const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic API key not found');
      }

      const client = new Anthropic({ apiKey });

      const model = params.model || CLAUDE_HAIKU_CURRENT;
      const maxTokens = params.maxTokens || 1024;
      const temperature = params.temperature ?? 0.7;
      const systemPrompt = params.systemPrompt || 'You are a professional Customer Success Manager writing emails to customers.';

      const stream = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: params.prompt,
          },
        ],
        stream: true,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }
      }
    } catch (error) {
      console.error('AnthropicService.generateStreamingCompletion error:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming conversation response with multi-turn support
   *
   * @param params - Conversation parameters including message history
   * @yields StreamingChunk objects with text deltas and metadata
   * @returns Final StreamingConversationResult with complete content and usage
   */
  static async *generateStreamingConversation(
    params: AnthropicConversationParams
  ): AsyncGenerator<StreamingChunk, StreamingConversationResult, unknown> {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Anthropic API key not found. Set CLAUDE_API_KEY or ANTHROPIC_API_KEY in environment.'
      );
    }

    const client = new Anthropic({ apiKey });

    const model = params.model || CLAUDE_HAIKU_CURRENT;
    const maxTokens = params.maxTokens || 2000;
    const temperature = params.temperature ?? 0.7;
    const systemPrompt = params.systemPrompt || 'You are a helpful AI assistant.';

    // Build request params
    const requestParams: Anthropic.MessageCreateParams = {
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    };

    // Add tools if provided
    if (params.tools && params.tools.length > 0) {
      requestParams.tools = params.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      }));
    }

    try {
      const stream = await client.messages.create(requestParams);

      // Accumulate content and track token usage
      let fullContent = '';
      const toolUses: AnthropicToolUse[] = [];
      let currentToolUse: { id: string; name: string; inputJson: string } | null = null;
      let inputTokens = 0;
      let outputTokens = 0;
      let stopReason = 'end_turn';
      let responseModel = model;

      for await (const event of stream) {
        switch (event.type) {
          case 'message_start':
            if (event.message?.usage?.input_tokens) {
              inputTokens = event.message.usage.input_tokens;
            }
            if (event.message?.model) {
              responseModel = event.message.model;
            }
            yield {
              type: 'message_start',
              usage: { input_tokens: inputTokens },
            };
            break;

          case 'content_block_start':
            if (event.content_block?.type === 'tool_use') {
              currentToolUse = {
                id: event.content_block.id,
                name: event.content_block.name,
                inputJson: '',
              };
              yield {
                type: 'tool_use_start',
                toolUse: {
                  id: event.content_block.id,
                  name: event.content_block.name,
                },
              };
            }
            break;

          case 'content_block_delta':
            if (event.delta.type === 'text_delta') {
              fullContent += event.delta.text;
              yield {
                type: 'text',
                text: event.delta.text,
              };
            } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
              currentToolUse.inputJson += event.delta.partial_json;
              yield {
                type: 'tool_use_delta',
                toolUse: {
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                  input: event.delta.partial_json,
                },
              };
            }
            break;

          case 'content_block_stop':
            if (currentToolUse) {
              // Parse accumulated JSON and add to tool uses
              try {
                const input = currentToolUse.inputJson ? JSON.parse(currentToolUse.inputJson) : {};
                toolUses.push({
                  type: 'tool_use',
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                  input,
                });
              } catch {
                console.warn('Failed to parse tool input JSON:', currentToolUse.inputJson);
              }
              yield {
                type: 'tool_use_end',
                toolUse: {
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                },
              };
              currentToolUse = null;
            }
            break;

          case 'message_delta':
            if (event.delta?.stop_reason) {
              stopReason = event.delta.stop_reason;
            }
            if (event.usage?.output_tokens) {
              outputTokens = event.usage.output_tokens;
            }
            yield {
              type: 'message_delta',
              usage: { output_tokens: outputTokens },
            };
            break;

          case 'message_stop':
            yield { type: 'message_stop' };
            break;
        }
      }

      // Return final result
      return {
        content: fullContent,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        model: responseModel,
        stopReason,
        ...(toolUses.length > 0 ? { toolUses } : {}),
      };
    } catch (error) {
      console.error('AnthropicService.generateStreamingConversation error:', error);

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid or missing Anthropic API key');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Anthropic API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Anthropic API error: ${error.message}`);
      }

      throw new Error('Unknown error calling Anthropic API');
    }
  }

  /**
   * Test API key validity
   *
   * @returns True if API key works, false otherwise
   */
  static async testApiKey(): Promise<boolean> {
    try {
      await this.generateCompletion({
        prompt: 'Say "OK" if you can read this.',
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }
}
