/**
 * Glossary Tools
 *
 * Unified definitions for term definitions, shorthand, aliases, and slang.
 * Single definition → MCP + REST + do()
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';
import { DEFAULTS } from '@human-os/core';

// =============================================================================
// DEFINE TERM
// =============================================================================

export const defineTerm = defineTool({
  name: 'define_term',
  description: 'Define or update a term in the glossary. Use for shorthand, nicknames, slang, acronyms. Example: "Ruth = Justin\'s wife, Clinical Psychologist"',
  platform: 'core',
  category: 'glossary',

  extractable: true,
  extractCategory: 'glossary_terms',
  extractHint:
    'Definitions, acronyms, shorthand, nicknames, slang. Look for patterns like "X means Y", "X = Y", "X (which is Y)", or context where a term is explained inline. Also extract when someone defines a person by role ("Ruth is my wife").',

  input: z.object({
    term: z.string().describe('The term to define (case-insensitive matching)'),
    definition: z.string().describe('Full definition/explanation of the term'),
    term_type: z.enum(['person', 'group', 'acronym', 'slang', 'project', 'shorthand']).optional().default('shorthand').describe('Classification of the term'),
    short_definition: z.string().optional().describe('One-liner for inline expansion (auto-generated if not provided)'),
    entity_id: z.string().optional().describe('UUID of linked entity (if this term refers to an entity)'),
    context_tags: z.array(z.string()).optional().describe('Context tags like "personal", "work", "social"'),
    always_expand: z.boolean().optional().default(false).describe('Always show definition when term is used'),
  }),

  handler: async (ctx, input) => {
    const termNormalized = input.term.toLowerCase().trim();
    const shortDef = input.short_definition || input.definition.slice(0, 100);

    const { data, error } = await ctx.supabase
      .from('glossary')
      .upsert(
        {
          term: input.term.trim(),
          term_normalized: termNormalized,
          definition: input.definition,
          short_definition: shortDef,
          term_type: input.term_type || 'shorthand',
          entity_id: input.entity_id || null,
          context_tags: input.context_tags || [],
          always_expand: input.always_expand || false,
          layer: ctx.layer,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'layer,term_normalized',
          ignoreDuplicates: false,
        }
      )
      .select('id, term, definition, term_type, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(`Failed to define term: ${error.message}`);
    }

    const action = data.created_at === data.updated_at ? 'created' : 'updated';

    return {
      id: data.id,
      term: data.term,
      definition: data.definition,
      term_type: data.term_type,
      action,
    };
  },

  rest: { method: 'POST', path: '/glossary' },

  alias: {
    pattern: '{term} means {definition}',
    priority: 40,
  },
});

// =============================================================================
// LOOKUP TERM
// =============================================================================

export const lookupTerm = defineTool({
  name: 'lookup_term',
  description: 'Look up a term in the glossary. Returns definition and increments usage count. Use when user uses unfamiliar shorthand.',
  platform: 'core',
  category: 'glossary',

  input: z.object({
    term: z.string().describe('The term to look up'),
  }),

  handler: async (ctx, input) => {
    const termNormalized = input.term.toLowerCase().trim();

    const { data: exactMatch, error } = await ctx.supabase
      .from('glossary')
      .select(`
        id,
        term,
        definition,
        short_definition,
        term_type,
        entity_id,
        usage_count,
        context_tags
      `)
      .eq('layer', ctx.layer)
      .eq('term_normalized', termNormalized)
      .single();

    if (exactMatch && !error) {
      // Increment usage count
      await ctx.supabase
        .from('glossary')
        .update({
          usage_count: exactMatch.usage_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', exactMatch.id);

      // Get entity name if linked
      let entityName: string | null = null;
      if (exactMatch.entity_id) {
        const { data: entity } = await ctx.supabase
          .from('entities')
          .select('name')
          .eq('id', exactMatch.entity_id)
          .single();
        entityName = entity?.name || null;
      }

      return {
        found: true,
        term: {
          ...exactMatch,
          entity_name: entityName,
        },
      };
    }

    // If no exact match, try fuzzy search for suggestions
    const { data: suggestions } = await ctx.supabase
      .from('glossary')
      .select('term')
      .eq('layer', ctx.layer)
      .ilike('term_normalized', `%${termNormalized}%`)
      .limit(5);

    return {
      found: false,
      suggestions: suggestions?.map(s => s.term) || [],
    };
  },

  rest: { method: 'GET', path: '/glossary/lookup/:term' },

  alias: {
    pattern: 'what does {term} mean',
    priority: 30,
  },
});

// =============================================================================
// LIST GLOSSARY
// =============================================================================

export const listGlossary = defineTool({
  name: 'list_glossary',
  description: 'List all terms in the glossary, optionally filtered by type or tag',
  platform: 'core',
  category: 'glossary',

  input: z.object({
    term_type: z.enum(['person', 'group', 'acronym', 'slang', 'project', 'shorthand']).optional().describe('Filter by term type'),
    context_tag: z.string().optional().describe('Filter by context tag (e.g., "personal", "work")'),
    search: z.string().optional().describe('Search in term and definition'),
    limit: z.number().optional().default(50).describe('Max results to return'),
    offset: z.number().optional().default(0).describe('Offset for pagination'),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('glossary')
      .select(
        `
        id,
        term,
        definition,
        short_definition,
        term_type,
        entity_id,
        usage_count,
        context_tags
      `,
        { count: 'exact' }
      )
      .eq('layer', ctx.layer);

    if (input.term_type) {
      query = query.eq('term_type', input.term_type);
    }

    if (input.context_tag) {
      query = query.contains('context_tags', [input.context_tag]);
    }

    if (input.search) {
      query = query.or(`term.ilike.%${input.search}%,definition.ilike.%${input.search}%`);
    }

    const limit = input.limit || DEFAULTS.PAGE_LIMIT;
    const offset = input.offset || 0;

    query = query
      .order('usage_count', { ascending: false })
      .order('term', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list glossary: ${error.message}`);
    }

    return {
      terms: data || [],
      total: count || 0,
    };
  },

  rest: { method: 'GET', path: '/glossary' },

  alias: {
    pattern: 'show my glossary',
    priority: 50,
  },
});

// =============================================================================
// SEARCH GLOSSARY
// =============================================================================

export const searchGlossary = defineTool({
  name: 'search_glossary',
  description: 'Full-text search across glossary terms and definitions',
  platform: 'core',
  category: 'glossary',

  input: z.object({
    query: z.string().describe('Search query'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase.rpc('glossary_search', {
      p_query: input.query,
      p_layer: ctx.layer,
    });

    if (error) {
      throw new Error(`Failed to search glossary: ${error.message}`);
    }

    return data || [];
  },

  rest: { method: 'GET', path: '/glossary/search' },

  alias: {
    pattern: 'search glossary for {query}',
    priority: 40,
  },
});

// =============================================================================
// DELETE TERM
// =============================================================================

export const deleteTerm = defineTool({
  name: 'delete_term',
  description: 'Remove a term from the glossary',
  platform: 'core',
  category: 'glossary',

  input: z.object({
    term: z.string().describe('The term to delete'),
  }),

  handler: async (ctx, input) => {
    const termNormalized = input.term.toLowerCase().trim();

    const { error } = await ctx.supabase
      .from('glossary')
      .delete()
      .eq('layer', ctx.layer)
      .eq('term_normalized', termNormalized);

    if (error) {
      throw new Error(`Failed to delete term: ${error.message}`);
    }

    return { deleted: true, term: input.term };
  },

  rest: { method: 'DELETE', path: '/glossary/:term' },

  alias: {
    pattern: 'remove {term} from glossary',
    priority: 60,
  },
});
