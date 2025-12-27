/**
 * Shared context for tool handlers
 *
 * Provides a single object with all the dependencies needed by tool handlers,
 * eliminating the need to pass multiple parameters to every function.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ContextEngine, KnowledgeGraph, Layer } from '@human-os/core';

// =============================================================================
// EXECUTION MODE
// =============================================================================

/**
 * Execution mode for MCP tool calls
 *
 * - tactical: Deterministic action mode. Expect predictable responses,
 *   confirmations, and button-style interactions. Forces static workflow
 *   progression even if LLM mode is enabled.
 *
 * - strategic: Information gathering mode. Allows exploratory conversation,
 *   multi-turn interactions, and non-deterministic conclusions. Enables
 *   LLM orchestration even if static mode is the default.
 *
 * When not specified, tools use their default behavior.
 */
export type ExecutionMode = 'tactical' | 'strategic';

/**
 * Mode property definition for tool schemas
 */
export const MODE_PROPERTY = {
  mode: {
    type: 'string',
    enum: ['tactical', 'strategic'],
    description:
      'Execution mode: "tactical" for deterministic actions (buttons, confirmations), ' +
      '"strategic" for exploratory/information-gathering interactions. ' +
      'When omitted, uses default behavior.',
  },
} as const;

/**
 * Add mode property to a tool's input schema
 * This allows per-call mode override for any tool
 */
export function withModeProperty(tool: Tool): Tool {
  const schema = tool.inputSchema as {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };

  return {
    ...tool,
    inputSchema: {
      ...schema,
      type: 'object' as const,
      properties: {
        ...schema.properties,
        ...MODE_PROPERTY,
      },
    },
  };
}

/**
 * Add mode property to multiple tools
 */
export function withModeProperties(tools: Tool[]): Tool[] {
  return tools.map(withModeProperty);
}

/**
 * Extract execution mode from tool arguments
 */
export function getExecutionMode(args: Record<string, unknown>): ExecutionMode | undefined {
  const mode = args.mode;
  if (mode === 'tactical' || mode === 'strategic') {
    return mode;
  }
  return undefined;
}

/**
 * Check if we should use deterministic/static behavior
 * Returns true for tactical mode, false for strategic, undefined for default
 */
export function shouldUseDeterministicMode(
  args: Record<string, unknown>,
  defaultUseLlmMode?: boolean
): boolean {
  const mode = getExecutionMode(args);
  if (mode === 'tactical') return true; // Force deterministic
  if (mode === 'strategic') return false; // Force LLM/exploratory
  // Default: use inverse of LLM mode (if LLM mode is true, not deterministic)
  return defaultUseLlmMode === undefined ? false : !defaultUseLlmMode;
}

/**
 * Context passed to all tool handlers
 */
export interface ToolContext {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  layer: Layer;
  contextEngine: ContextEngine;
  knowledgeGraph: KnowledgeGraph;
  /** Get lazily-initialized Supabase client (singleton per context) */
  getClient: () => SupabaseClient;
}

/**
 * Create a ToolContext with lazy-loaded Supabase client
 */
export function createToolContext(params: {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  layer: Layer;
  contextEngine: ContextEngine;
  knowledgeGraph: KnowledgeGraph;
}): ToolContext {
  let client: SupabaseClient | null = null;

  return {
    ...params,
    getClient: () => {
      if (!client) {
        client = createClient(params.supabaseUrl, params.supabaseKey);
      }
      return client;
    },
  };
}

/**
 * Standard tool handler function signature
 *
 * Returns the result if handled, or null if this handler doesn't handle the tool.
 * This allows chaining handlers until one matches.
 */
export type ToolHandler = (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
) => Promise<unknown | null>;

/**
 * Tool module structure - bundles tool definitions with their handler
 */
export interface ToolModule {
  /** MCP tool definitions */
  tools: import('@modelcontextprotocol/sdk/types.js').Tool[];
  /** Handler function for these tools */
  handler: ToolHandler;
}
