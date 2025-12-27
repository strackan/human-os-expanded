/**
 * Recall Tool - RAG Search Over Execution History
 *
 * Searches past executions using semantic similarity and text matching.
 * Enables queries like "what strings do I have tied to Grace?" without
 * polluting the main conversation context with historical data.
 *
 * Key benefits:
 * - Historical context available via RAG, not in working memory
 * - Entity-based queries (find all interactions with a person)
 * - Semantic search across past actions
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext, ToolHandler } from '../lib/context.js';
import { ExecutionRecaller } from '@human-os/aliases';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const recallTools: Tool[] = [
  {
    name: 'recall',
    description: `Search past executions and actions. Use this to find:
- Previous interactions with a person ("what have I done with Grace")
- Past string ties and reminders ("what strings do I have")
- Historical context without re-executing actions
- Patterns in past behavior

Returns summaries of past executions, not raw data.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query about past actions',
        },
        entity: {
          type: 'string',
          description: 'Optional entity slug to filter by (person, company, project)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 5)',
          default: 5,
        },
        useSemantic: {
          type: 'boolean',
          description: 'Use semantic similarity search (default: true)',
          default: true,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'recall_entity',
    description: 'Get all past executions related to a specific entity (person, company, project)',
    inputSchema: {
      type: 'object',
      properties: {
        entity: {
          type: 'string',
          description: 'Entity slug to search for',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 10)',
          default: 10,
        },
      },
      required: ['entity'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle recall tool calls
 */
export const handleRecallTools: ToolHandler = async (
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> => {
  switch (name) {
    case 'recall': {
      const query = args.query as string;
      const entity = args.entity as string | undefined;
      const limit = (args.limit as number) ?? 5;
      const useSemantic = (args.useSemantic as boolean) ?? true;
      return recallExecutions(query, entity, limit, useSemantic, ctx);
    }

    case 'recall_entity': {
      const entity = args.entity as string;
      const limit = (args.limit as number) ?? 10;
      return recallByEntity(entity, limit, ctx);
    }

    default:
      return null;
  }
};

// =============================================================================
// IMPLEMENTATION
// =============================================================================

/**
 * Search past executions with optional semantic similarity
 */
async function recallExecutions(
  query: string,
  entity: string | undefined,
  limit: number,
  useSemantic: boolean,
  ctx: ToolContext
): Promise<{
  executions: Array<{
    id: string;
    pattern: string;
    request: string;
    summary: string;
    entities: string[];
    when: string;
    relevance?: string;
  }>;
  total: number;
  hint: string;
}> {
  const recaller = new ExecutionRecaller(
    ctx.supabaseUrl,
    ctx.supabaseKey
    // TODO: Add embedding function when available
  );

  const results = await recaller.recall(query, ctx.layer, {
    entity,
    limit,
    useSemantic,
  });

  const executions = results.map(r => ({
    id: r.id,
    pattern: r.aliasPattern,
    request: r.inputRequest,
    summary: r.resultSummary,
    entities: r.entities,
    when: formatRelativeTime(r.createdAt),
    relevance: r.similarity !== undefined ? `${Math.round(r.similarity * 100)}%` : undefined,
  }));

  return {
    executions,
    total: executions.length,
    hint: executions.length === 0
      ? 'No matching executions found. Try a different query or check the entity name.'
      : `Found ${executions.length} relevant past execution(s).`,
  };
}

/**
 * Get all executions related to an entity
 */
async function recallByEntity(
  entity: string,
  limit: number,
  ctx: ToolContext
): Promise<{
  entity: string;
  executions: Array<{
    id: string;
    pattern: string;
    request: string;
    summary: string;
    when: string;
  }>;
  total: number;
}> {
  const recaller = new ExecutionRecaller(
    ctx.supabaseUrl,
    ctx.supabaseKey
  );

  const results = await recaller.recallByEntity(entity, ctx.layer, limit);

  const executions = results.map(r => ({
    id: r.id,
    pattern: r.aliasPattern,
    request: r.inputRequest,
    summary: r.resultSummary,
    when: formatRelativeTime(r.createdAt),
  }));

  return {
    entity,
    executions,
    total: executions.length,
  };
}

/**
 * Format a date as relative time (e.g., "2 days ago", "just now")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  } else {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  }
}
