/**
 * Shared context for tool handlers
 *
 * Provides a single object with all the dependencies needed by tool handlers,
 * eliminating the need to pass multiple parameters to every function.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ContextEngine, KnowledgeGraph, Layer } from '@human-os/core';

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
