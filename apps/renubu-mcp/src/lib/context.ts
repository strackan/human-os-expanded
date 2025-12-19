/**
 * Shared context for renubu-mcp tool handlers
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Context passed to all tool handlers
 */
export interface ToolContext {
  supabaseUrl: string;
  supabaseKey: string;
  ownerId: string;
  /** Get lazily-initialized Supabase client (singleton per context) */
  getClient: () => SupabaseClient;
}

/**
 * Create a ToolContext with lazy-loaded Supabase client
 */
export function createToolContext(params: {
  supabaseUrl: string;
  supabaseKey: string;
  ownerId: string;
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
 */
export type ToolHandler = (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
) => Promise<unknown | null>;
