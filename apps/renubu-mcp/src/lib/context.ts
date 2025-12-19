/**
 * Shared context for renubu-mcp tool handlers
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ContextEngine } from '@human-os/core';

/**
 * Context passed to all tool handlers
 */
export interface ToolContext {
  supabaseUrl: string;
  supabaseKey: string;
  ownerId: string;
  /** Optional tenant ID for multi-tenant operations */
  tenantId?: string;
  /** Get lazily-initialized Supabase client (singleton per context) */
  getClient: () => SupabaseClient;
  /** Get lazily-initialized ContextEngine for hybrid storage */
  getContextEngine: () => ContextEngine;
}

/**
 * Create a ToolContext with lazy-loaded Supabase client and ContextEngine
 */
export function createToolContext(params: {
  supabaseUrl: string;
  supabaseKey: string;
  ownerId: string;
  tenantId?: string;
}): ToolContext {
  let client: SupabaseClient | null = null;
  let contextEngine: ContextEngine | null = null;

  return {
    ...params,
    getClient: () => {
      if (!client) {
        client = createClient(params.supabaseUrl, params.supabaseKey);
      }
      return client;
    },
    getContextEngine: () => {
      if (!contextEngine) {
        contextEngine = new ContextEngine({
          supabaseUrl: params.supabaseUrl,
          supabaseKey: params.supabaseKey,
          viewer: { userId: params.ownerId, tenantId: params.tenantId },
        });
      }
      return contextEngine;
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
