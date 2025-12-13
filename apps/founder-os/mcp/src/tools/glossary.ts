/**
 * Glossary Tools
 *
 * Tools for managing term definitions, shorthand, aliases, and slang.
 * Allows quick capture of what terms mean to the user.
 */

import { createClient } from '@supabase/supabase-js';

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

export interface FrequentTermsResult {
  terms: {
    term: string;
    short_definition: string | null;
    term_type: string;
    usage_count: number;
  }[];
}

/**
 * Define or update a term in the glossary
 */
export async function defineTerm(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
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
  const supabase = createClient(supabaseUrl, supabaseKey);

  const termNormalized = params.term.toLowerCase().trim();
  const shortDef = params.short_definition || params.definition.slice(0, 100);

  // Use upsert to handle both create and update
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
        layer,
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

  // Check if it was created or updated by querying created_at vs updated_at
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
 * Also increments usage count
 */
export async function lookupTerm(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
  term: string
): Promise<LookupResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const termNormalized = term.toLowerCase().trim();

  // First, try exact match
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
    .eq('layer', layer)
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
    .eq('layer', layer)
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
export async function listGlossary(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
  params: {
    term_type?: string;
    context_tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ListGlossaryResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase
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
    `, { count: 'exact' })
    .eq('layer', layer);

  if (params.term_type) {
    query = query.eq('term_type', params.term_type);
  }

  if (params.context_tag) {
    query = query.contains('context_tags', [params.context_tag]);
  }

  if (params.search) {
    query = query.or(`term.ilike.%${params.search}%,definition.ilike.%${params.search}%`);
  }

  const limit = params.limit || 50;
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
 * Get frequently used terms (for session context injection)
 */
export async function getFrequentTerms(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
  limit: number = 10
): Promise<FrequentTermsResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('glossary')
    .select('term, short_definition, term_type, usage_count')
    .eq('layer', layer)
    .gt('usage_count', 0)
    .order('usage_count', { ascending: false })
    .order('last_used_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get frequent terms: ${error.message}`);
  }

  return {
    terms: data || [],
  };
}

/**
 * Search glossary using full-text search
 */
export async function searchGlossary(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
  query: string
): Promise<GlossaryTerm[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Use the glossary_search function we created in the migration
  const { data, error } = await supabase.rpc('glossary_search', {
    p_query: query,
    p_layer: layer,
  });

  if (error) {
    throw new Error(`Failed to search glossary: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a term from the glossary
 */
export async function deleteTerm(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
  term: string
): Promise<{ deleted: boolean; term: string }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const termNormalized = term.toLowerCase().trim();

  const { error } = await supabase
    .from('glossary')
    .delete()
    .eq('layer', layer)
    .eq('term_normalized', termNormalized);

  if (error) {
    throw new Error(`Failed to delete term: ${error.message}`);
  }

  return { deleted: true, term };
}
