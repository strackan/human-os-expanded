/**
 * search Edge Function
 *
 * Pack search & serendipity engine - find people, companies, connection points.
 *
 * GET /functions/v1/search?query=AI&type=person&limit=10
 * GET /functions/v1/search/connections?viewer=justin&target=grace
 * GET /functions/v1/search/similar?person=justin&limit=5
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createServiceClient, getUserId, getLayer } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createServiceClient();
    const userId = getUserId(req);
    const layer = getLayer(userId);

    const url = new URL(req.url);
    const path = url.pathname.replace('/search', '').replace('/', '');

    // Route based on path
    if (path === 'connections') {
      return jsonResponse(await findConnectionPoints(supabase, url.searchParams));
    }

    if (path === 'similar') {
      return jsonResponse(await findSimilarPeople(supabase, url.searchParams, layer));
    }

    // Default: pack search / quick search
    return jsonResponse(await packSearch(supabase, url.searchParams, layer));

  } catch (error) {
    console.error('search error:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * Pack search - multi-dimensional identity discovery
 */
async function packSearch(
  supabase: any,
  params: URLSearchParams,
  layer: string
): Promise<{ results: any[]; total: number }> {
  const keyword = params.get('query') || params.get('keyword');
  const entityType = params.get('type') || params.get('entity_type');
  const packType = params.get('pack_type');
  const location = params.get('location');
  const limit = parseInt(params.get('limit') || '20');

  // Parse tags if provided
  let tags: string[] | null = null;
  const tagsParam = params.get('tags');
  if (tagsParam) {
    tags = tagsParam.split(',').map(t => t.trim());
  }

  const { data, error } = await supabase.rpc('pack_search', {
    p_keyword: keyword || null,
    p_entity_type: entityType || null,
    p_pack_type: packType || null,
    p_tags: tags,
    p_location: location || null,
    p_layer: layer,
    p_limit: limit,
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
 * Find connection points between two people (serendipity engine)
 */
async function findConnectionPoints(
  supabase: any,
  params: URLSearchParams
): Promise<{
  viewer_slug: string;
  target_slug: string;
  connection_points: any[];
  suggested_openers: any[];
}> {
  const viewerSlug = params.get('viewer');
  const targetSlug = params.get('target');

  if (!viewerSlug || !targetSlug) {
    throw new Error('viewer and target parameters required');
  }

  // Get connection points
  const { data: connectionPoints, error: cpError } = await supabase.rpc('find_connection_points', {
    p_viewer_slug: viewerSlug,
    p_target_slug: targetSlug,
  });

  if (cpError) {
    throw new Error(`Find connection points failed: ${cpError.message}`);
  }

  // Generate openers
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
 * Find similar people based on tags/interests
 */
async function findSimilarPeople(
  supabase: any,
  params: URLSearchParams,
  layer: string
): Promise<any[]> {
  const personSlug = params.get('person');
  const limit = parseInt(params.get('limit') || '10');

  if (!personSlug) {
    throw new Error('person parameter required');
  }

  // Get person's tags
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

  // Collect all tags
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
  const { data, error } = await supabase.rpc('pack_search', {
    p_keyword: null,
    p_entity_type: 'person',
    p_pack_type: null,
    p_tags: allTags.slice(0, 5),
    p_location: null,
    p_layer: layer,
    p_limit: limit + 1, // +1 to account for filtering out the person
  });

  if (error) {
    throw new Error(`Find similar people failed: ${error.message}`);
  }

  // Filter out the original person
  return (data || []).filter((r: any) => r.entity_slug !== personSlug).slice(0, limit);
}
