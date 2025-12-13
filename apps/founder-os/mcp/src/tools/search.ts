/**
 * Search Tools - Pack Search & Serendipity Engine
 *
 * Tools for multi-dimensional identity discovery and finding connection points.
 */

import { createClient } from '@supabase/supabase-js';

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

/**
 * Pack Search - Multi-dimensional identity discovery
 *
 * Search across entities, identity_packs, and context_files
 */
export async function packSearch(
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
 *
 * Discover shared interests, mutual connections, and similar facets
 * between two people.
 */
export async function findConnectionPoints(
  supabaseUrl: string,
  supabaseKey: string,
  viewerSlug: string,
  targetSlug: string
): Promise<FindConnectionPointsResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get connection points
  const { data: connectionPoints, error: cpError } = await supabase.rpc(
    'find_connection_points',
    {
      p_viewer_slug: viewerSlug,
      p_target_slug: targetSlug,
    }
  );

  if (cpError) {
    throw new Error(`Find connection points failed: ${cpError.message}`);
  }

  // Get suggested openers
  const { data: openers, error: opError } = await supabase.rpc(
    'generate_openers',
    {
      p_viewer_slug: viewerSlug,
      p_target_slug: targetSlug,
      p_limit: 3,
    }
  );

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
 * Update Context File TSVector - Index content for full-text search
 *
 * Call this after uploading/updating a context file to enable
 * full-text search on its content.
 */
export async function updateContextFileTsv(
  supabaseUrl: string,
  supabaseKey: string,
  fileId: string,
  content: string
): Promise<{ success: boolean }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase.rpc('update_context_file_tsv', {
    p_file_id: fileId,
    p_content: content,
  });

  if (error) {
    throw new Error(`Update TSV failed: ${error.message}`);
  }

  return { success: true };
}

/**
 * Quick Search - Simplified search for common use cases
 *
 * A wrapper that provides sensible defaults for quick entity lookups.
 */
export async function quickSearch(
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
 *
 * Given a person's slug, find others with overlapping tags or pack types.
 */
export async function findSimilarPeople(
  supabaseUrl: string,
  supabaseKey: string,
  personSlug: string,
  limit: number = 10
): Promise<PackSearchResult[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // First, get the person's tags
  const { data: personData, error: personError } = await supabase
    .from('entities')
    .select(`
      id,
      identity_packs (tags, pack_type)
    `)
    .eq('slug', personSlug)
    .single();

  if (personError || !personData) {
    throw new Error(`Person not found: ${personSlug}`);
  }

  // Collect all tags from their identity packs
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

  // Search for people with similar tags
  const result = await packSearch(supabaseUrl, supabaseKey, {
    entity_type: 'person',
    tags: allTags.slice(0, 5), // Use top 5 tags
    limit,
  });

  // Filter out the original person
  return result.results.filter(r => r.entity_slug !== personSlug);
}
