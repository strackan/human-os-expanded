/**
 * recall Edge Function
 *
 * RAG search over execution history - find past actions without re-executing.
 *
 * GET /functions/v1/recall?query=Grace&entity=grace-hopper&limit=5
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
    const query = url.searchParams.get('query');
    const entity = url.searchParams.get('entity');
    const limit = parseInt(url.searchParams.get('limit') || '5');

    // If entity specified, use recall_entity
    if (entity && !query) {
      return jsonResponse(await recallByEntity(supabase, layer, entity, limit));
    }

    // Otherwise, search by query
    if (!query) {
      return errorResponse('query or entity parameter required');
    }

    return jsonResponse(await recallExecutions(supabase, layer, query, entity, limit));

  } catch (error) {
    console.error('recall error:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * Search past executions by query and optional entity
 */
async function recallExecutions(
  supabase: any,
  layer: string,
  query: string,
  entity: string | null,
  limit: number
): Promise<{
  executions: Array<{
    id: string;
    pattern: string;
    request: string;
    summary: string;
    entities: string[];
    when: string;
  }>;
  total: number;
  hint: string;
}> {
  let dbQuery = supabase
    .schema('human_os')
    .from('execution_logs')
    .select('id, alias_pattern, input_request, result_summary, entities, created_at')
    .eq('layer', layer)
    .or(`input_request.ilike.%${query}%,result_summary.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entity) {
    dbQuery = dbQuery.contains('entities', [entity]);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error(`Recall failed: ${error.message}`);
  }

  const executions = (data || []).map((r: any) => ({
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
}

/**
 * Get all executions related to a specific entity
 */
async function recallByEntity(
  supabase: any,
  layer: string,
  entity: string,
  limit: number
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
  const { data, error } = await supabase
    .schema('human_os')
    .from('execution_logs')
    .select('id, alias_pattern, input_request, result_summary, created_at')
    .eq('layer', layer)
    .contains('entities', [entity])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Recall entity failed: ${error.message}`);
  }

  const executions = (data || []).map((r: any) => ({
    id: r.id,
    pattern: r.alias_pattern,
    request: r.input_request,
    summary: r.result_summary,
    when: formatRelativeTime(new Date(r.created_at)),
  }));

  return {
    entity,
    executions,
    total: executions.length,
  };
}

/**
 * Format a date as relative time
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

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
}
