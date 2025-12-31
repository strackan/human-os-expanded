/**
 * Search Tools
 *
 * Unified definitions for pack search & serendipity engine.
 * Single definition → MCP + REST + do()
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';

// =============================================================================
// PACK SEARCH
// =============================================================================

export const packSearch = defineTool({
  name: 'pack_search',
  description: 'Multi-dimensional identity discovery. Search across entities, identity packs, and context files. Use for finding people by skills, interests, location, or keywords.',
  platform: 'core',
  category: 'search',

  input: z.object({
    keyword: z.string().optional().describe('Search keyword (matches name, headline, tags, content)'),
    entity_type: z.enum(['person', 'company', 'project']).optional().describe('Filter by entity type'),
    pack_type: z.enum(['professional', 'interests', 'social', 'dating', 'expertise', 'founder']).optional().describe('Filter by identity pack type'),
    tags: z.array(z.string()).optional().describe('Filter by tags (any match)'),
    location: z.string().optional().describe('Filter by location (fuzzy match)'),
    limit: z.number().optional().default(20).describe('Max results to return'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase.rpc('pack_search', {
      p_keyword: input.keyword || null,
      p_entity_type: input.entity_type || null,
      p_pack_type: input.pack_type || null,
      p_tags: input.tags || null,
      p_location: input.location || null,
      p_layer: ctx.layer || null,
      p_limit: input.limit || 20,
    });

    if (error) {
      throw new Error(`Pack search failed: ${error.message}`);
    }

    return {
      results: data || [],
      total: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/search/pack' },

  alias: {
    pattern: 'find people {keyword}',
    priority: 30,
  },
});

// =============================================================================
// FIND CONNECTION POINTS
// =============================================================================

export const findConnectionPoints = defineTool({
  name: 'find_connection_points',
  description: 'Serendipity engine: Discover shared interests, mutual connections, and conversation openers between two people. Use before meeting someone or preparing for outreach.',
  platform: 'core',
  category: 'search',

  input: z.object({
    viewer_slug: z.string().describe('Slug of the person looking (usually the user)'),
    target_slug: z.string().describe('Slug of the person they want to connect with'),
  }),

  handler: async (ctx, input) => {
    const { data: connectionPoints, error: cpError } = await ctx.supabase.rpc('find_connection_points', {
      p_viewer_slug: input.viewer_slug,
      p_target_slug: input.target_slug,
    });

    if (cpError) {
      throw new Error(`Find connection points failed: ${cpError.message}`);
    }

    const { data: openers, error: opError } = await ctx.supabase.rpc('generate_openers', {
      p_viewer_slug: input.viewer_slug,
      p_target_slug: input.target_slug,
      p_limit: 3,
    });

    if (opError) {
      throw new Error(`Generate openers failed: ${opError.message}`);
    }

    return {
      viewer_slug: input.viewer_slug,
      target_slug: input.target_slug,
      connection_points: connectionPoints || [],
      suggested_openers: openers || [],
    };
  },

  rest: { method: 'GET', path: '/search/connections' },

  alias: {
    pattern: 'find connection points with {target_slug}',
    priority: 40,
  },
});

// =============================================================================
// QUICK SEARCH
// =============================================================================

export const quickSearch = defineTool({
  name: 'quick_search',
  description: 'Simple entity lookup by name or keyword. Faster than pack_search for basic queries.',
  platform: 'core',
  category: 'search',

  input: z.object({
    query: z.string().describe('Search query (name or keyword)'),
    type: z.enum(['person', 'company', 'project']).optional().describe('Entity type filter'),
    limit: z.number().optional().default(10).describe('Max results'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase.rpc('pack_search', {
      p_keyword: input.query,
      p_entity_type: input.type || null,
      p_pack_type: null,
      p_tags: null,
      p_location: null,
      p_layer: ctx.layer || null,
      p_limit: input.limit || 10,
    });

    if (error) {
      throw new Error(`Quick search failed: ${error.message}`);
    }

    return data || [];
  },

  rest: { method: 'GET', path: '/search/quick' },

  alias: {
    pattern: 'search {query}',
    priority: 20,
  },
});

// =============================================================================
// FIND SIMILAR PEOPLE
// =============================================================================

export const findSimilarPeople = defineTool({
  name: 'find_similar_people',
  description: 'Find people with similar interests and background to a given person. Useful for networking recommendations.',
  platform: 'core',
  category: 'search',

  input: z.object({
    person_slug: z.string().describe('Slug of the person to find similar people to'),
    limit: z.number().optional().default(10).describe('Max results'),
  }),

  handler: async (ctx, input) => {
    // First get the person's tags
    const { data: personData, error: personError } = await ctx.supabase
      .from('entities')
      .select(`
        id,
        identity_packs (tags, pack_type)
      `)
      .eq('slug', input.person_slug)
      .single();

    if (personError || !personData) {
      throw new Error(`Person not found: ${input.person_slug}`);
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

    // Search for similar people
    const { data, error } = await ctx.supabase.rpc('pack_search', {
      p_keyword: null,
      p_entity_type: 'person',
      p_pack_type: null,
      p_tags: allTags.slice(0, 5),
      p_location: null,
      p_layer: ctx.layer || null,
      p_limit: input.limit || 10,
    });

    if (error) {
      throw new Error(`Find similar people failed: ${error.message}`);
    }

    // Filter out the original person
    return (data || []).filter((r: { entity_slug: string }) => r.entity_slug !== input.person_slug);
  },

  rest: { method: 'GET', path: '/search/similar/:person_slug' },

  alias: {
    pattern: 'find people similar to {person_slug}',
    priority: 50,
  },
});
