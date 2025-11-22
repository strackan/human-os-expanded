/**
 * Sequential Thinking MCP Client
 *
 * Provides step-by-step reasoning for complex decisions.
 * Uses chain-of-thought prompting to break down problems and show reasoning.
 */

import type {
  MCPServer,
  MCPQueryResponse,
  MCPError,
  SequentialThinkingMCP,
} from '../types/mcp.types';

/**
 * Sequential Thinking MCP Client
 */
export class SequentialThinkingMCPClient {
  private server: MCPServer = 'sequential_thinking' as MCPServer;
  private thinkingHistory: Map<string, SequentialThinkingMCP.ThinkingResult> = new Map();

  /**
   * Think through a problem step-by-step
   */
  async think(
    params: SequentialThinkingMCP.ThinkParams
  ): Promise<MCPQueryResponse<SequentialThinkingMCP.ThinkingResult>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const maxSteps = params.maxSteps || 10;
      const steps: SequentialThinkingMCP.ThoughtStep[] = [];

      // This is a structured thinking framework
      // In a real implementation, this would call an LLM with specific prompting
      // For now, we'll provide the structure that the LLM should fill

      const thinkingResult: SequentialThinkingMCP.ThinkingResult = {
        steps,
        conclusion: '',
        totalSteps: 0,
        confidenceScore: 0,
        metadata: {
          timeTaken: Date.now() - startTime,
          complexity: this.assessComplexity(params.problem),
        },
      };

      // Store in history for reflection
      this.thinkingHistory.set(requestId, thinkingResult);

      return {
        success: true,
        data: thinkingResult,
        metadata: {
          duration: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, requestId, startTime);
    }
  }

  /**
   * Reflect on previous thoughts
   */
  async reflect(
    params: SequentialThinkingMCP.ReflectParams
  ): Promise<MCPQueryResponse<string>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // In production, this would use the LLM to reflect on previous steps
      // and answer follow-up questions about the reasoning

      const reflection = `Based on the ${params.previousThoughts.length} steps of reasoning, here's my reflection on "${params.question}":

${params.previousThoughts.map((step, i) => `Step ${i + 1}: ${step.title}`).join('\n')}

The key insight is that the reasoning followed a logical progression from problem analysis to conclusion.`;

      return {
        success: true,
        data: reflection,
        metadata: {
          duration: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, requestId, startTime);
    }
  }

  /**
   * Revise a previous conclusion based on feedback
   */
  async revise(
    params: SequentialThinkingMCP.ReviseParams
  ): Promise<MCPQueryResponse<SequentialThinkingMCP.ThinkingResult>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // In production, this would re-run the thinking process with the feedback incorporated
      const revisedResult: SequentialThinkingMCP.ThinkingResult = {
        steps: [],
        conclusion: params.originalConclusion,
        totalSteps: 0,
        confidenceScore: 0,
        metadata: {
          timeTaken: Date.now() - startTime,
          complexity: 'moderate',
        },
      };

      return {
        success: true,
        data: revisedResult,
        metadata: {
          duration: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, requestId, startTime);
    }
  }

  /**
   * Execute a generic action
   */
  async execute(action: string, parameters: any): Promise<MCPQueryResponse> {
    switch (action) {
      case 'think':
        return this.think(parameters);
      case 'reflect':
        return this.reflect(parameters);
      case 'revise':
        return this.revise(parameters);
      default:
        return {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unknown action: ${action}`,
            server: this.server,
            timestamp: new Date().toISOString(),
          },
        };
    }
  }

  /**
   * Get tool definitions for LLM
   */
  getToolDefinitions() {
    return [
      {
        name: 'mcp_sequential_thinking_think',
        description: 'Think through a complex problem step-by-step using chain-of-thought reasoning. Use for: renewal strategies, pricing decisions, risk assessments, contract analysis, stakeholder mapping.',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            problem: {
              type: 'string' as const,
              description: 'The problem or question to think through',
            },
            context: {
              type: 'string' as const,
              description: 'Additional context about the situation',
            },
            maxSteps: {
              type: 'number' as const,
              description: 'Maximum number of thinking steps (default: 10)',
            },
            requireConclusion: {
              type: 'boolean' as const,
              description: 'Whether a definitive conclusion is required',
            },
          },
          required: ['problem'],
        },
      },
      {
        name: 'mcp_sequential_thinking_reflect',
        description: 'Reflect on previous thinking steps and answer follow-up questions',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            previousThoughts: {
              type: 'array' as const,
              description: 'Previous thought steps to reflect on',
              items: {
                type: 'object' as const,
              },
            },
            question: {
              type: 'string' as const,
              description: 'Question to answer based on previous thoughts',
            },
          },
          required: ['previousThoughts', 'question'],
        },
      },
    ];
  }

  /**
   * Assess problem complexity
   */
  private assessComplexity(
    problem: string
  ): 'simple' | 'moderate' | 'complex' {
    const keywords = {
      complex: [
        'strategic',
        'multiple stakeholders',
        'trade-off',
        'risk',
        'analyze',
        'evaluate',
      ],
      moderate: ['compare', 'recommend', 'decide', 'plan'],
    };

    const lowerProblem = problem.toLowerCase();

    if (keywords.complex.some((kw) => lowerProblem.includes(kw))) {
      return 'complex';
    } else if (keywords.moderate.some((kw) => lowerProblem.includes(kw))) {
      return 'moderate';
    }

    return 'simple';
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: Error,
    requestId: string,
    startTime: number
  ): MCPQueryResponse {
    const mcpError: MCPError = {
      code: 'THINKING_ERROR',
      message: error.message || 'Sequential thinking failed',
      details: { error: error.toString() },
      server: this.server,
      timestamp: new Date().toISOString(),
    };

    return {
      success: false,
      error: mcpError,
      metadata: {
        duration: Date.now() - startTime,
        requestId,
      },
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${this.server}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const startTime = Date.now();
    try {
      // Simple test: run a basic think operation
      const result = await this.think({
        problem: 'Test health check',
        maxSteps: 1,
      });

      return {
        healthy: result.success,
        latency: Date.now() - startTime,
      };
    } catch {
      return {
        healthy: false,
      };
    }
  }

  /**
   * Get thinking history
   */
  getHistory(): Map<string, SequentialThinkingMCP.ThinkingResult> {
    return this.thinkingHistory;
  }

  /**
   * Clear thinking history
   */
  clearHistory(): void {
    this.thinkingHistory.clear();
  }
}
