/**
 * Anthropic Agent Loop
 *
 * Implements agent-style tool execution loop that runs until Claude
 * returns without requesting tool calls.
 *
 * Features:
 * - Automatic tool execution and result handling
 * - Max iterations safeguard
 * - Streaming support
 * - MCP tool integration
 */

import {
  AnthropicService,
  type ConversationMessage,
  type AnthropicTool,
  type AnthropicConversationResponse,
  type StreamingConversationResult,
} from './AnthropicService';
import { withRetry, ANTHROPIC_RETRY_OPTIONS, type RetryOptions } from './anthropic-retry';

// =============================================================================
// TYPES
// =============================================================================

export interface ToolExecutor {
  /** Execute a tool and return the result */
  execute: (toolName: string, input: Record<string, unknown>) => Promise<ToolResult>;
  /** Get available tools */
  getTools: () => AnthropicTool[];
  /** Check if a tool is available */
  hasToolDefinition: (toolName: string) => boolean;
}

export interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface AgentLoopOptions {
  /** Maximum iterations before stopping (default: 5) */
  maxIterations?: number;
  /** Retry options for API calls */
  retryOptions?: RetryOptions;
  /** Callback for each iteration */
  onIteration?: (iteration: number, response: AnthropicConversationResponse) => void;
  /** Callback when tool is executed */
  onToolExecuted?: (toolName: string, input: unknown, result: ToolResult) => void;
  /** Model to use */
  model?: string;
  /** Max tokens for response */
  maxTokens?: number;
  /** Temperature for generation */
  temperature?: number;
}

export interface AgentLoopResult {
  /** Final response content */
  content: string;
  /** Total tokens used across all iterations */
  totalTokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  /** Number of iterations executed */
  iterations: number;
  /** Tool calls made during the loop */
  toolCalls: Array<{
    name: string;
    input: unknown;
    result: ToolResult;
  }>;
  /** Final stop reason */
  stopReason: string;
}

export interface StreamingAgentChunk {
  type: 'text' | 'tool_start' | 'tool_result' | 'iteration_start' | 'complete';
  text?: string;
  tool?: {
    name: string;
    input?: unknown;
    result?: ToolResult;
  };
  iteration?: number;
  final?: AgentLoopResult;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_ITERATIONS = 5;
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.7;

// =============================================================================
// AGENT LOOP IMPLEMENTATION
// =============================================================================

/**
 * Run an agent loop that executes tools until Claude returns without tool calls
 *
 * @param messages - Initial conversation messages
 * @param systemPrompt - System prompt
 * @param toolExecutor - Tool executor instance
 * @param options - Agent loop options
 */
export async function runAgentLoop(
  messages: ConversationMessage[],
  systemPrompt: string,
  toolExecutor: ToolExecutor,
  options: AgentLoopOptions = {}
): Promise<AgentLoopResult> {
  const {
    maxIterations = DEFAULT_MAX_ITERATIONS,
    retryOptions = ANTHROPIC_RETRY_OPTIONS,
    onIteration,
    onToolExecuted,
    model,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  const tools = toolExecutor.getTools();
  let currentMessages = [...messages];
  let iterations = 0;
  const toolCalls: AgentLoopResult['toolCalls'] = [];
  const totalTokensUsed = { input: 0, output: 0, total: 0 };
  let lastResponse: AnthropicConversationResponse | null = null;

  while (iterations < maxIterations) {
    iterations++;

    // Make API call with retry
    const result = await withRetry(
      () =>
        AnthropicService.generateConversation({
          messages: currentMessages,
          systemPrompt,
          ...(tools.length > 0 ? { tools } : {}),
          ...(model ? { model } : {}),
          maxTokens,
          temperature,
        }),
      retryOptions
    );

    if (!result.success || !result.data) {
      throw result.error || new Error('Agent loop API call failed');
    }

    lastResponse = result.data;
    totalTokensUsed.input += lastResponse.tokensUsed.input;
    totalTokensUsed.output += lastResponse.tokensUsed.output;
    totalTokensUsed.total += lastResponse.tokensUsed.total;

    onIteration?.(iterations, lastResponse);

    // Check if there are tool uses
    if (!lastResponse.toolUses || lastResponse.toolUses.length === 0) {
      // No tool calls - we're done
      break;
    }

    // Execute tools and build tool results
    const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];

    for (const toolUse of lastResponse.toolUses) {
      const toolResult = await toolExecutor.execute(toolUse.name, toolUse.input);

      toolCalls.push({
        name: toolUse.name,
        input: toolUse.input,
        result: toolResult,
      });

      onToolExecuted?.(toolUse.name, toolUse.input, toolResult);

      // Format result for Claude
      const resultContent = toolResult.success
        ? JSON.stringify(toolResult.result)
        : `Error: ${toolResult.error}`;

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: resultContent,
      });
    }

    // Add assistant message with tool use to conversation
    currentMessages = [
      ...currentMessages,
      {
        role: 'assistant',
        content: lastResponse.content || '',
        // Note: In a full implementation, we'd include tool_use blocks here
      },
      {
        role: 'user',
        content: JSON.stringify(toolResults),
        // Note: In a full implementation, this would be proper tool_result format
      },
    ];
  }

  return {
    content: lastResponse?.content || '',
    totalTokensUsed,
    iterations,
    toolCalls,
    stopReason: lastResponse?.stopReason || 'max_iterations',
  };
}

/**
 * Run a streaming agent loop
 *
 * @param messages - Initial conversation messages
 * @param systemPrompt - System prompt
 * @param toolExecutor - Tool executor instance
 * @param options - Agent loop options
 */
export async function* runStreamingAgentLoop(
  messages: ConversationMessage[],
  systemPrompt: string,
  toolExecutor: ToolExecutor,
  options: AgentLoopOptions = {}
): AsyncGenerator<StreamingAgentChunk, AgentLoopResult, unknown> {
  const {
    maxIterations = DEFAULT_MAX_ITERATIONS,
    onToolExecuted,
    model,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  const tools = toolExecutor.getTools();
  let currentMessages = [...messages];
  let iterations = 0;
  const toolCalls: AgentLoopResult['toolCalls'] = [];
  const totalTokensUsed = { input: 0, output: 0, total: 0 };
  let lastContent = '';
  let lastStopReason = 'end_turn';

  while (iterations < maxIterations) {
    iterations++;
    yield { type: 'iteration_start', iteration: iterations };

    // Create streaming generator
    const streamGenerator = AnthropicService.generateStreamingConversation({
      messages: currentMessages,
      systemPrompt,
      ...(tools.length > 0 ? { tools } : {}),
      ...(model ? { model } : {}),
      maxTokens,
      temperature,
    });

    // Collect the streamed response
    let result: StreamingConversationResult | undefined;

    // Manually iterate to capture the return value
    while (true) {
      const iterResult = await streamGenerator.next();
      if (iterResult.done) {
        result = iterResult.value;
        break;
      }
      const chunk = iterResult.value;
      if (chunk.type === 'text' && chunk.text) {
        yield { type: 'text', text: chunk.text };
      }
    }

    if (result) {
      totalTokensUsed.input += result.tokensUsed.input;
      totalTokensUsed.output += result.tokensUsed.output;
      totalTokensUsed.total += result.tokensUsed.total;
      lastContent = result.content;
      lastStopReason = result.stopReason;

      // Check for tool uses
      if (result.toolUses && result.toolUses.length > 0) {
        const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];

        for (const toolUse of result.toolUses) {
          yield {
            type: 'tool_start',
            tool: { name: toolUse.name, input: toolUse.input },
          };

          const toolResult = await toolExecutor.execute(toolUse.name, toolUse.input);

          toolCalls.push({
            name: toolUse.name,
            input: toolUse.input,
            result: toolResult,
          });

          onToolExecuted?.(toolUse.name, toolUse.input, toolResult);

          yield {
            type: 'tool_result',
            tool: { name: toolUse.name, result: toolResult },
          };

          const resultContent = toolResult.success
            ? JSON.stringify(toolResult.result)
            : `Error: ${toolResult.error}`;

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: resultContent,
          });
        }

        // Add to messages for next iteration
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: result.content || '' },
          { role: 'user', content: JSON.stringify(toolResults) },
        ];
      } else {
        // No tool calls - we're done
        break;
      }
    }
  }

  const finalResult: AgentLoopResult = {
    content: lastContent,
    totalTokensUsed,
    iterations,
    toolCalls,
    stopReason: lastStopReason,
  };

  yield { type: 'complete', final: finalResult };

  return finalResult;
}

// =============================================================================
// SIMPLE TOOL EXECUTOR
// =============================================================================

/**
 * Create a simple tool executor from a map of tool definitions and handlers
 */
export function createToolExecutor(
  toolDefinitions: AnthropicTool[],
  handlers: Record<string, (input: Record<string, unknown>) => Promise<unknown>>
): ToolExecutor {
  return {
    getTools: () => toolDefinitions,
    hasToolDefinition: (name: string) => toolDefinitions.some((t) => t.name === name),
    execute: async (toolName: string, input: Record<string, unknown>): Promise<ToolResult> => {
      const handler = handlers[toolName];

      if (!handler) {
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
      }

      try {
        const result = await handler(input);
        return { success: true, result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
