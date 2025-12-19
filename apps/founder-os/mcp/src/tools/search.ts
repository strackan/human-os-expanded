/**
 * Search Tools - Pack Search & Serendipity Engine
 *
 * Tools for multi-dimensional identity discovery and finding connection points.
 */

import { createClient } from '@supabase/supabase-js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const searchTools: Tool[] = [
  {
    name: 'pack_search',
    description: 'Multi-dimensional identity discovery. Search across entities, identity packs, and context files. Use for finding people by skills, interests, location, or keywords.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Search keyword (matches name, headline, tags, content)' },
        entity_type: {
          type: 'string',
          description: 'Filter by entity type',
          enum: ['person', 'company', 'project'],
        },
        pack_type: {
          type: 'string',
          description: 'Filter by identity pack type',
          enum: ['professional', 'interests', 'social', 'dating', 'expertise', 'founder'],
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags (any match)',
        },
        location: { type: 'string', description: 'Filter by location (fuzzy match)' },
        limit: { type: 'number', description: 'Max results to return', default: 20 },
      },
      required: [],
    },
  },
  {
    name: 'find_connection_points',
    description: 'Serendipity engine: Discover shared interests, mutual connections, and conversation openers between two people. Use before meeting someone or preparing for outreach.',
    inputSchema: {
      type: 'object',
      properties: {
        viewer_slug: { type: 'string', description: 'Slug of the person looking (usually the user)' },
        target_slug: { type: 'string', description: 'Slug of the person they want to connect with' },
      },
      required: ['viewer_slug', 'target_slug'],
    },
  },
  {
    name: 'quick_search',
    description: 'Simple entity lookup by name or keyword. Faster than pack_search for basic queries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (name or keyword)' },
        type: {
          type: 'string',
          description: 'Entity type filter',
          enum: ['person', 'company', 'project'],
        },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_similar_people',
    description: 'Find people with similar interests and background to a given person. Useful for networking recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        person_slug: { type: 'string', description: 'Slug of the person to find similar people to' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['person_slug'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle search tool calls
 * Returns result if handled, null if not a search tool
 */
export async function handleSearchTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'pack_search': {
      const params = args as {
        keyword?: string;
        entity_type?: string;
        pack_type?: string;
        tags?: string[];
        location?: string;
        limit?: number;
      };
      return packSearch(ctx.supabaseUrl, ctx.supabaseKey, {
        ...params,
        layer: ctx.layer,
      });
    }

    case 'find_connection_points': {
      const { viewer_slug, target_slug } = args as { viewer_slug: string; target_slug: string };
      return findConnectionPoints(ctx.supabaseUrl, ctx.supabaseKey, viewer_slug, target_slug);
    }

    case 'quick_search': {
      const { query, type, limit } = args as {
        query: string;
        type?: 'person' | 'company' | 'project';
        limit?: number;
      };
      return quickSearch(ctx.supabaseUrl, ctx.supabaseKey, query, { type, limit });
    }

    case 'find_similar_people': {
      const { person_slug, limit } = args as { person_slug: string; limit?: number };
      return findSimilarPeople(ctx.supabaseUrl, ctx.supabaseKey, person_slug, limit);
    }

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface PackSearchParams {
  keyword?: string;
  entity_type?: string;
  pack_type?: string;
  tags?: string[];
  location?: string;
  layer?: string;
  limit?: number;
}

export interface PackSearchResult {
  entity_id: string;
  entity_slug: string | null;
  entity_name: string;
  entity_type: string;
  pack_id: string | null;
  pack_type: string | null;
  headline: string | null;
  tags: string[];
  visibility: string | null;
  relevance_score: number;
  matching_snippet: string | null;
}

export interface ConnectionPoint {
  connection_type: string;
  topic: string;
  viewer_context: string | null;
  target_context: string | null;
  strength: number;
}

export interface Opener {
  opener: string;
  based_on: string;
  confidence: number;
}

export interface FindConnectionPointsResult {
  viewer_slug: string;
  target_slug: string;
  connection_points: ConnectionPoint[];
  suggested_openers: Opener[];
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Pack Search - Multi-dimensional identity discovery
 */
async function packSearch(
  supabaseUrl: string,
  supabaseKey: string,
  params: PackSearchParams
): Promise<{ results: PackSearchResult[]; total: number }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.rpc('pack_search', {
    p_keyword: params.keyword || null,
    p_entity_type: params.entity_type || null,
    p_pack_type: params.pack_type || null,
    p_tags: params.tags || null,
    p_location: params.location || null,
    p_layer: params.layer || null,
    p_limit: params.limit || 20,
  });

  if (error) {
    throw new Error(`Pack search failed: ${error.message}`);
  }

  return {
    results: data || [],
    total: data?.length || 0,
  };
}

/**
 * Find Connection Points - Serendipity Engine
 */
async function findConnectionPoints(
  supabaseUrl: string,
  supabaseKey: string,
  viewerSlug: string,
  targetSlug: string
): Promise<FindConnectionPointsResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: connectionPoints, error: cpError } = await supabase.rpc('find_connection_points', {
    p_viewer_slug: viewerSlug,
    p_target_slug: targetSlug,
  });

  if (cpError) {
    throw new Error(`Find connection points failed: ${cpError.message}`);
  }

  const { data: openers, error: opError } = await supabase.rpc('generate_openers', {
    p_viewer_slug: viewerSlug,
    p_target_slug: targetSlug,
    p_limit: 3,
  });

  if (opError) {
    throw new Error(`Generate openers failed: ${opError.message}`);
  }

  return {
    viewer_slug: viewerSlug,
    target_slug: targetSlug,
    connection_points: connectionPoints || [],
    suggested_openers: openers || [],
  };
}

/**
 * Quick Search - Simplified search for common use cases
 */
async function quickSearch(
  supabaseUrl: string,
  supabaseKey: string,
  query: string,
  options: {
    type?: 'person' | 'company' | 'project';
    limit?: number;
  } = {}
): Promise<PackSearchResult[]> {
  const result = await packSearch(supabaseUrl, supabaseKey, {
    keyword: query,
    entity_type: options.type,
    limit: options.limit || 10,
  });

  return result.results;
}

/**
 * Find Similar People - Find people with similar interests/background
 */
async function findSimilarPeople(
  supabaseUrl: string,
  supabaseKey: string,
  personSlug: string,
  limit: number = 10
): Promise<PackSearchResult[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: personData, error: personError } = await supabase
    .from('entities')
    .select(
      `
      id,
      identity_packs (tags, pack_type)
    `
    )
    .eq('slug', personSlug)
    .single();

  if (personError || !personData) {
    throw new Error(`Person not found: ${personSlug}`);
  }

  const allTags: string[] = [];
  const packs = personData.identity_packs as { tags: string[]; pack_type: string }[];

  if (packs) {
    for (const pack of packs) {
      if (pack.tags) {
        allTags.push(...pack.tags);
      }
    }
  }

  if (allTags.length === 0) {
    return [];
  }

  const result = await packSearch(supabaseUrl, supabaseKey, {
    entity_type: 'person',
    tags: allTags.slice(0, 5),
    limit,
  });

  return result.results.filter(r => r.entity_slug !== personSlug);
}
