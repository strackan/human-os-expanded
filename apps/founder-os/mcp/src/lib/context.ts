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
 * Record property — global flag to persist the interaction to the user's context layer.
 * When true, the tool should save a record of this interaction (contact logged,
 * decision made, note captured, etc.) to the context engine for future recall.
 */
export const RECORD_PROPERTY = {
  record: {
    type: 'boolean',
    description:
      'When true, persist a record of this interaction to the context layer ' +
      'for future recall. Use for decisions, contacts, notable events, or ' +
      'anything the user might want to reference later.',
  },
} as const;

/**
 * All global properties added to every tool input schema
 */
const GLOBAL_PROPERTIES = {
  ...MODE_PROPERTY,
  ...RECORD_PROPERTY,
} as const;

/**
 * Add global properties (mode + record) to a tool's input schema
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
        ...GLOBAL_PROPERTIES,
      },
    },
  };
}

/**
 * Add global properties to multiple tools
 */
export function withModeProperties(tools: Tool[]): Tool[] {
  return tools.map(withModeProperty);
}

// =============================================================================
// DIRECT-CALL GATE
// =============================================================================

/**
 * Tools that bypass the direct-call gate.
 * These are either routing tools (do, recall) or lightweight session tools
 * that need to work without do() routing.
 */
export const UNGATED_TOOLS = new Set([
  'do',
  'list_aliases',
  'learn_alias',
  'recall',
  'get_session_context',
  'load_commandments',
  'load_mode',
  'extract',
  'list_extraction_categories',
  'flush',
]);

/**
 * Override property added to all gated tool schemas.
 * When true, bypasses the direct-call gate.
 */
export const OVERRIDE_PROPERTY = {
  override: {
    type: 'boolean',
    description:
      'Set to true to bypass the do() routing gate. ' +
      'Direct tool calls dump full payloads into context — use do() instead for concise results. ' +
      'Only override when explicitly asked or when do() cannot route the request.',
  },
} as const;

/**
 * Add override property to a tool's input schema (for gated tools only)
 */
export function withGateProperty(tool: Tool): Tool {
  if (UNGATED_TOOLS.has(tool.name)) return tool;

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
        ...OVERRIDE_PROPERTY,
      },
    },
  };
}

/**
 * Add override property to multiple tools
 */
export function withGateProperties(tools: Tool[]): Tool[] {
  return tools.map(withGateProperty);
}

/**
 * Check if a direct tool call should be gated
 * Returns the gate message if blocked, or null if allowed
 */
export function checkDirectCallGate(
  name: string,
  args: Record<string, unknown>
): string | null {
  if (UNGATED_TOOLS.has(name)) return null;
  if (args.override === true) return null;

  return (
    `Direct call to "${name}" was blocked to prevent context bloat.\n\n` +
    `Use do() instead: do({ request: "your intent in natural language" })\n\n` +
    `To override: ${name}({ ...args, override: true })\n` +
    `Only override when the user explicitly asks or do() cannot route the request.`
  );
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
 * Check if the record flag is set on tool arguments
 */
export function getRecordFlag(args: Record<string, unknown>): boolean {
  return args.record === true;
}

/**
 * Record an interaction to the context layer.
 * Call this from any tool handler when `record: true` is set.
 *
 * This is a global helper so tools don't need to duplicate recording logic.
 */
export async function recordInteraction(
  ctx: ToolContext,
  params: {
    /** Short summary of what happened */
    summary: string;
    /** Tool that generated this record */
    toolName: string;
    /** Structured data to persist */
    data: Record<string, unknown>;
    /** Optional folder override (default: 'interactions') */
    folder?: string;
  }
): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0];
    const slug = `${params.toolName}-${Date.now()}`;
    const folder = params.folder || 'interactions';

    const content = [
      '---',
      `tool: ${params.toolName}`,
      `date: ${date}`,
      `recorded: true`,
      '---',
      '',
      `# ${params.summary}`,
      '',
      '```json',
      JSON.stringify(params.data, null, 2),
      '```',
    ].join('\n');

    await ctx.contextEngine.saveContext(ctx.layer, folder, slug, content);
  } catch {
    // Recording is best-effort — don't fail the tool
    console.error(`Failed to record interaction: ${params.summary}`);
  }
}

/**
 * Context passed to all tool handlers
 */
export interface ToolContext {
  supabaseUrl: string;
  supabaseKey: string;
  /** User slug for display/routing (e.g., "justin") */
  userId: string;
  /** User UUID for database operations - resolved at startup */
  userUUID: string;
  layer: Layer;
  contextEngine: ContextEngine;
  knowledgeGraph: KnowledgeGraph;
  /** Get lazily-initialized Supabase client (singleton per context) */
  getClient: () => SupabaseClient;
  /** Active tools for the current bundle (set at startup, used by do.ts for discovery) */
  activeTools?: import('@modelcontextprotocol/sdk/types.js').Tool[];
}

/**
 * Create a ToolContext with lazy-loaded Supabase client
 */
export function createToolContext(params: {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  userUUID: string;
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

/** Schema where users table lives */
const USERS_SCHEMA = 'human_os';

/**
 * Resolve user UUID from slug
 * Call this at server startup to get the actual UUID for database operations
 */
export async function resolveUserUUID(
  supabaseUrl: string,
  supabaseKey: string,
  userSlug: string
): Promise<string> {
  const client = createClient(supabaseUrl, supabaseKey);

  // First try users table in human_os schema
  const { data: userData, error: userError } = await client
    .schema(USERS_SCHEMA)
    .from('users')
    .select('id')
    .eq('slug', userSlug)
    .single();

  if (userData?.id) {
    return userData.id;
  }

  // Try by email pattern (slug@human-os.io)
  const { data: emailData } = await client
    .schema(USERS_SCHEMA)
    .from('users')
    .select('id')
    .eq('email', `${userSlug}@human-os.io`)
    .single();

  if (emailData?.id) {
    return emailData.id;
  }

  // If not found, log warning and return the slug as-is
  // This allows graceful degradation for development
  console.error(
    `Warning: Could not resolve UUID for user "${userSlug}". ` +
      `Database operations may fail. Create user in 'human_os.users' table with slug="${userSlug}".`
  );

  // Return a deterministic UUID based on the slug for consistency
  // This is a fallback - proper setup should have the user in the database
  return userSlug;
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
