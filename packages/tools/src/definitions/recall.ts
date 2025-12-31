/**
 * Recall Tools
 *
 * Unified definitions for RAG search over execution history.
 * Single definition → MCP + REST + do()
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';

// =============================================================================
// RECALL (RAG SEARCH)
// =============================================================================

export const recall = defineTool({
  name: 'recall',
  description: `Search past executions and actions. Use this to find:
- Previous interactions with a person ("what have I done with Grace")
- Past string ties and reminders ("what strings do I have")
- Historical context without re-executing actions
- Patterns in past behavior

Returns summaries of past executions, not raw data.`,
  platform: 'founder',
  category: 'recall',

  input: z.object({
    query: z.string().describe('Natural language query about past actions'),
    entity: z.string().optional().describe('Optional entity slug to filter by (person, company, project)'),
    limit: z.number().optional().default(5).describe('Maximum results to return'),
    useSemantic: z.boolean().optional().default(true).describe('Use semantic similarity search'),
  }),

  handler: async (ctx, input) => {
    // Search execution_logs table
    let query = ctx.supabase
      .from('execution_logs')
      .select('id, alias_pattern, input_request, result_summary, entities, created_at')
      .eq('layer', ctx.layer)
      .order('created_at', { ascending: false })
      .limit(input.limit || 5);

    // Text search in request or summary
    if (input.query) {
      query = query.or(`input_request.ilike.%${input.query}%,result_summary.ilike.%${input.query}%`);
    }

    // Filter by entity if provided
    if (input.entity) {
      query = query.contains('entities', [input.entity]);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Recall failed: ${error.message}`);
    }

    const executions = (data || []).map((r: {
      id: string;
      alias_pattern: string;
      input_request: string;
      result_summary: string;
      entities: string[];
      created_at: string;
    }) => ({
      id: r.id,
      pattern: r.alias_pattern,
      request: r.input_request,
      summary: r.result_summary,
      entities: r.entities || [],
      when: formatRelativeTime(new Date(r.created_at)),
    }));

    return {
      executions,
      total: executions.length,
      hint: executions.length === 0
        ? 'No matching executions found. Try a different query or check the entity name.'
        : `Found ${executions.length} relevant past execution(s).`,
    };
  },

  rest: { method: 'GET', path: '/recall' },

  alias: {
    pattern: 'what have I done with {entity}',
    priority: 20,
  },
});

// =============================================================================
// RECALL BY ENTITY
// =============================================================================

export const recallEntity = defineTool({
  name: 'recall_entity',
  description: 'Get all past executions related to a specific entity (person, company, project)',
  platform: 'founder',
  category: 'recall',

  input: z.object({
    entity: z.string().describe('Entity slug to search for'),
    limit: z.number().optional().default(10).describe('Maximum results to return'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('execution_logs')
      .select('id, alias_pattern, input_request, result_summary, created_at')
      .eq('layer', ctx.layer)
      .contains('entities', [input.entity])
      .order('created_at', { ascending: false })
      .limit(input.limit || 10);

    if (error) {
      throw new Error(`Recall entity failed: ${error.message}`);
    }

    const executions = (data || []).map((r: {
      id: string;
      alias_pattern: string;
      input_request: string;
      result_summary: string;
      created_at: string;
    }) => ({
      id: r.id,
      pattern: r.alias_pattern,
      request: r.input_request,
      summary: r.result_summary,
      when: formatRelativeTime(new Date(r.created_at)),
    }));

    return {
      entity: input.entity,
      executions,
      total: executions.length,
    };
  },

  rest: { method: 'GET', path: '/recall/entity/:entity' },

  alias: {
    pattern: 'show history for {entity}',
    priority: 30,
  },
});

// =============================================================================
// HELPER
// =============================================================================

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
