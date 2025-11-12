/**
 * Anthropic Service
 *
 * Handles integration with Anthropic's Claude API for AI-powered email generation.
 * Uses Claude 3.5 Haiku for fast, cost-effective email composition.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface AnthropicCompletionParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
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
      const model = params.model || 'claude-haiku-4-5-20251001'; // Haiku 4.5
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

      const model = params.model || 'claude-haiku-4-5-20251001';
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
