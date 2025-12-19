/**
 * Glossary Tools
 *
 * Tools for managing term definitions, shorthand, aliases, and slang.
 * Allows quick capture of what terms mean to the user.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { DEFAULTS } from '@human-os/core';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const glossaryTools: Tool[] = [
  {
    name: 'define_term',
    description: 'Define or update a term in the glossary. Use for shorthand, nicknames, slang, acronyms. Example: "Ruth = Justin\'s wife, Clinical Psychologist"',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'The term to define (case-insensitive matching)' },
        definition: { type: 'string', description: 'Full definition/explanation of the term' },
        term_type: {
          type: 'string',
          description: 'Classification of the term',
          enum: ['person', 'group', 'acronym', 'slang', 'project', 'shorthand'],
          default: 'shorthand',
        },
        short_definition: { type: 'string', description: 'One-liner for inline expansion (auto-generated if not provided)' },
        entity_id: { type: 'string', description: 'UUID of linked entity (if this term refers to an entity)' },
        context_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Context tags like "personal", "work", "social"',
        },
        always_expand: { type: 'boolean', description: 'Always show definition when term is used', default: false },
      },
      required: ['term', 'definition'],
    },
  },
  {
    name: 'lookup_term',
    description: 'Look up a term in the glossary. Returns definition and increments usage count. Use when user uses unfamiliar shorthand.',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'The term to look up' },
      },
      required: ['term'],
    },
  },
  {
    name: 'list_glossary',
    description: 'List all terms in the glossary, optionally filtered by type or tag',
    inputSchema: {
      type: 'object',
      properties: {
        term_type: {
          type: 'string',
          description: 'Filter by term type',
          enum: ['person', 'group', 'acronym', 'slang', 'project', 'shorthand'],
        },
        context_tag: { type: 'string', description: 'Filter by context tag (e.g., "personal", "work")' },
        search: { type: 'string', description: 'Search in term and definition' },
        limit: { type: 'number', description: 'Max results to return', default: 50 },
      },
      required: [],
    },
  },
  {
    name: 'search_glossary',
    description: 'Full-text search across glossary terms and definitions',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'delete_term',
    description: 'Remove a term from the glossary',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'The term to delete' },
      },
      required: ['term'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle glossary tool calls
 * Returns result if handled, null if not a glossary tool
 */
export async function handleGlossaryTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'define_term': {
      const params = args as {
        term: string;
        definition: string;
        term_type?: string;
        short_definition?: string;
        entity_id?: string;
        context_tags?: string[];
        always_expand?: boolean;
      };
      return defineTerm(ctx, params);
    }

    case 'lookup_term': {
      const { term } = args as { term: string };
      return lookupTerm(ctx, term);
    }

    case 'list_glossary': {
      const params = args as {
        term_type?: string;
        context_tag?: string;
        search?: string;
        limit?: number;
      };
      return listGlossary(ctx, params);
    }

    case 'search_glossary': {
      const { query } = args as { query: string };
      return searchGlossary(ctx, query);
    }

    case 'delete_term': {
      const { term } = args as { term: string };
      return deleteTerm(ctx, term);
    }

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  short_definition: string | null;
  term_type: string;
  entity_id: string | null;
  entity_name?: string | null;
  usage_count: number;
  context_tags: string[];
}

export interface DefineTermResult {
  id: string;
  term: string;
  definition: string;
  term_type: string;
  action: 'created' | 'updated';
}

export interface LookupResult {
  found: boolean;
  term?: GlossaryTerm;
  suggestions?: string[];
}

export interface ListGlossaryResult {
  terms: GlossaryTerm[];
  total: number;
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Define or update a term in the glossary
 */
async function defineTerm(
  ctx: ToolContext,
  params: {
    term: string;
    definition: string;
    term_type?: string;
    short_definition?: string;
    entity_id?: string;
    context_tags?: string[];
    always_expand?: boolean;
  }
): Promise<DefineTermResult> {
  const supabase = ctx.getClient();

  const termNormalized = params.term.toLowerCase().trim();
  const shortDef = params.short_definition || params.definition.slice(0, 100);

  const { data, error } = await supabase
    .from('glossary')
    .upsert(
      {
        term: params.term.trim(),
        term_normalized: termNormalized,
        definition: params.definition,
        short_definition: shortDef,
        term_type: params.term_type || 'shorthand',
        entity_id: params.entity_id || null,
        context_tags: params.context_tags || [],
        always_expand: params.always_expand || false,
        layer: ctx.layer,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'layer,term_normalized',
        ignoreDuplicates: false,
      }
    )
    .select('id, term, definition, term_type')
    .single();

  if (error) {
    throw new Error(`Failed to define term: ${error.message}`);
  }

  const { data: checkData } = await supabase
    .from('glossary')
    .select('created_at, updated_at')
    .eq('id', data.id)
    .single();

  const action = checkData?.created_at === checkData?.updated_at ? 'created' : 'updated';

  return {
    id: data.id,
    term: data.term,
    definition: data.definition,
    term_type: data.term_type,
    action,
  };
}

/**
 * Look up a term in the glossary (case-insensitive)
 */
async function lookupTerm(ctx: ToolContext, term: string): Promise<LookupResult> {
  const supabase = ctx.getClient();

  const termNormalized = term.toLowerCase().trim();

  const { data: exactMatch, error } = await supabase
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
    await supabase
      .from('glossary')
      .update({
        usage_count: exactMatch.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', exactMatch.id);

    // Get entity name if linked
    let entityName: string | null = null;
    if (exactMatch.entity_id) {
      const { data: entity } = await supabase
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
  const { data: suggestions } = await supabase
    .from('glossary')
    .select('term')
    .eq('layer', ctx.layer)
    .ilike('term_normalized', `%${termNormalized}%`)
    .limit(5);

  return {
    found: false,
    suggestions: suggestions?.map(s => s.term) || [],
  };
}

/**
 * List all glossary terms (optionally filtered)
 */
async function listGlossary(
  ctx: ToolContext,
  params: {
    term_type?: string;
    context_tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ListGlossaryResult> {
  const supabase = ctx.getClient();

  let query = supabase
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

  if (params.term_type) {
    query = query.eq('term_type', params.term_type);
  }

  if (params.context_tag) {
    query = query.contains('context_tags', [params.context_tag]);
  }

  if (params.search) {
    query = query.or(`term.ilike.%${params.search}%,definition.ilike.%${params.search}%`);
  }

  const limit = params.limit || DEFAULTS.PAGE_LIMIT;
  const offset = params.offset || 0;

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
}

/**
 * Search glossary using full-text search
 */
async function searchGlossary(ctx: ToolContext, query: string): Promise<GlossaryTerm[]> {
  const supabase = ctx.getClient();

  const { data, error } = await supabase.rpc('glossary_search', {
    p_query: query,
    p_layer: ctx.layer,
  });

  if (error) {
    throw new Error(`Failed to search glossary: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a term from the glossary
 */
async function deleteTerm(ctx: ToolContext, term: string): Promise<{ deleted: boolean; term: string }> {
  const supabase = ctx.getClient();

  const termNormalized = term.toLowerCase().trim();

  const { error } = await supabase
    .from('glossary')
    .delete()
    .eq('layer', ctx.layer)
    .eq('term_normalized', termNormalized);

  if (error) {
    throw new Error(`Failed to delete term: ${error.message}`);
  }

  return { deleted: true, term };
}
