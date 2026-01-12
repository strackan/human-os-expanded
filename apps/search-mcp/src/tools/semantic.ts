/**
 * Semantic search tools - Dynamic, query-based retrieval
 *
 * Convention:
 * - search_* = dynamic, semantic, query-based (full-text, vector similarity)
 * - recall_* = deterministic, structured, parameter-based (see recall.ts)
 *
 * Search Tools:
 * - search_entities: Cross-entity semantic/full-text search
 * - search_journal: Full-text search across journal content
 * - search_transcript: Full-text search across transcript content
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

interface SearchContext {
  supabase: SupabaseClient;
  userId: string;
  layer: string;
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const searchTools: Tool[] = [
  {
    name: 'search_entities',
    description: `Semantic search across all entities.

Uses vector similarity or full-text search to find relevant entities.
For structured filters (by type, company, etc.), use recall_* tools instead.

Example: search_entities({ query: "AI strategy" })
Example: search_entities({ query: "investor contacts", types: ["person", "company"] })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (natural language)' },
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Entity types to search (default: all)',
        },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_journal',
    description: `Full-text search across journal entries and interactions.

Searches content, titles, and notes semantically.
For structured filters (by date, type, sentiment), use recall_journal instead.

Example: search_journal({ query: "feeling overwhelmed about launch" })
Example: search_journal({ query: "breakthrough moment" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (natural language)' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_transcript',
    description: `Full-text search across transcript content.

Searches summaries, topics, and raw transcript text.
For structured filters (by type, person, date), use recall_transcript instead.

Example: search_transcript({ query: "pricing objections" })
Example: search_transcript({ query: "integration requirements" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (natural language)' },
        callType: {
          type: 'string',
          enum: ['demo', 'customer', 'coaching', 'internal', 'investor', 'partnership', 'sales', 'support', 'other'],
          description: 'Optional type filter',
        },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
      required: ['query'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleSearchTools(
  name: string,
  args: Record<string, unknown>,
  ctx: SearchContext
): Promise<unknown | null> {
  switch (name) {
    case 'search_entities':
      return searchEntities(ctx, args as { query: string; types?: string[]; limit?: number });

    case 'search_journal':
      return searchJournal(ctx, args as { query: string; limit?: number });

    case 'search_transcript':
      return searchTranscript(ctx, args as { query: string; callType?: string; limit?: number });

    default:
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

async function searchEntities(
  ctx: SearchContext,
  params: { query: string; types?: string[]; limit?: number }
): Promise<{
  success: boolean;
  results?: Array<{ id: string; name: string; type: string; score: number; snippet?: string }>;
  count?: number;
  message: string;
  error?: string;
}> {
  try {
    const limit = Math.min(params.limit || 20, 100);

    // Try to use the search RPC if available
    const { data: rpcData, error: rpcError } = await ctx.supabase
      .rpc('search_entities', {
        query_text: params.query,
        entity_types: params.types || null,
        result_limit: limit,
      });

    if (!rpcError && rpcData) {
      return {
        success: true,
        results: rpcData,
        count: rpcData.length,
        message: `Found ${rpcData.length} results for "${params.query}"`,
      };
    }

    // Fallback: simple text search on name
    let query = ctx.supabase
      .from('entities')
      .select('id, name, entity_type, slug')
      .ilike('name', `%${params.query}%`)
      .limit(limit);

    if (params.types?.length) {
      query = query.in('entity_type', params.types);
    }

    const { data, error } = await query;

    if (error) throw error;

    const results = (data || []).map(entity => ({
      id: entity.id,
      name: entity.name,
      type: entity.entity_type,
      score: 1.0,
    }));

    return {
      success: true,
      results,
      count: results.length,
      message: results.length
        ? `Found ${results.length} results for "${params.query}"`
        : `No results found for "${params.query}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function searchJournal(
  ctx: SearchContext,
  params: { query: string; limit?: number }
): Promise<{
  success: boolean;
  results?: Array<{
    id: string;
    title?: string;
    type: string;
    occurredAt: string;
    snippet: string;
    score: number;
  }>;
  count?: number;
  message: string;
  error?: string;
}> {
  try {
    const limit = Math.min(params.limit || 20, 100);

    // Full-text search on title and content
    const { data, error } = await ctx.supabase
      .from('interactions')
      .select('id, title, content, interaction_type, occurred_at')
      .or(`title.ilike.%${params.query}%,content.ilike.%${params.query}%`)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const results = (data || []).map(entry => {
      // Extract snippet around match
      const content = entry.content || entry.title || '';
      const queryLower = params.query.toLowerCase();
      const contentLower = content.toLowerCase();
      const matchIndex = contentLower.indexOf(queryLower);

      let snippet = '';
      if (matchIndex >= 0) {
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(content.length, matchIndex + params.query.length + 50);
        snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
      } else {
        snippet = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      }

      return {
        id: entry.id,
        title: entry.title,
        type: entry.interaction_type,
        occurredAt: entry.occurred_at,
        snippet,
        score: matchIndex >= 0 ? 1.0 : 0.5,
      };
    });

    return {
      success: true,
      results,
      count: results.length,
      message: results.length
        ? `Found ${results.length} journal entries for "${params.query}"`
        : `No journal entries found for "${params.query}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function searchTranscript(
  ctx: SearchContext,
  params: { query: string; callType?: string; limit?: number }
): Promise<{
  success: boolean;
  results?: Array<{
    id: string;
    title: string;
    callDate?: string;
    callType?: string;
    participants: string[];
    snippet: string;
    score: number;
  }>;
  count?: number;
  message: string;
  error?: string;
}> {
  try {
    const limit = Math.min(params.limit || 20, 100);

    // Try RPC for proper FTS ranking
    const { data: rpcData, error: rpcError } = await ctx.supabase
      .schema('human_os')
      .rpc('search_transcripts', {
        p_query: params.query,
        p_layer: ctx.layer,
        p_limit: limit,
      });

    if (!rpcError && rpcData) {
      const results = (rpcData as Array<{
        id: string;
        title: string;
        call_date: string | null;
        call_type: string | null;
        summary: string | null;
        participants: Array<{ name: string }>;
        rank: number;
      }>).map(r => ({
        id: r.id,
        title: r.title,
        callDate: r.call_date || undefined,
        callType: r.call_type || undefined,
        participants: r.participants?.map(p => p.name) || [],
        snippet: r.summary?.substring(0, 150) || '',
        score: r.rank,
      }));

      return {
        success: true,
        results,
        count: results.length,
        message: `Found ${results.length} transcripts for "${params.query}"`,
      };
    }

    // Fallback: ilike search
    let query = ctx.supabase
      .schema('human_os')
      .from('transcripts')
      .select('id, title, call_date, call_type, summary, participants')
      .or(`summary.ilike.%${params.query}%,title.ilike.%${params.query}%`)
      .limit(limit);

    if (params.callType) {
      query = query.eq('call_type', params.callType);
    }

    const { data, error } = await query;

    if (error) throw error;

    const results = (data || []).map(r => {
      const summary = r.summary || '';
      const queryLower = params.query.toLowerCase();
      const summaryLower = summary.toLowerCase();
      const matchIndex = summaryLower.indexOf(queryLower);

      let snippet = '';
      if (matchIndex >= 0) {
        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(summary.length, matchIndex + params.query.length + 40);
        snippet = (start > 0 ? '...' : '') + summary.substring(start, end) + (end < summary.length ? '...' : '');
      } else {
        snippet = summary.substring(0, 100);
      }

      return {
        id: r.id,
        title: r.title,
        callDate: r.call_date || undefined,
        callType: r.call_type || undefined,
        participants: (r.participants as Array<{ name: string }>)?.map(p => p.name) || [],
        snippet,
        score: matchIndex >= 0 ? 1.0 : 0.5,
      };
    });

    return {
      success: true,
      results,
      count: results.length,
      message: results.length
        ? `Found ${results.length} transcripts for "${params.query}"`
        : `No transcripts found for "${params.query}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
