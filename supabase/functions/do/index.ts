/**
 * do() Edge Function
 *
 * Natural language command routing - "user vocabulary as API"
 *
 * POST /functions/v1/do
 * { "request": "add call Ruth to my tasks" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createServiceClient, getUserId, getLayer } from '../_shared/supabase.ts';

interface Alias {
  id: string;
  pattern: string;
  tool_name: string;
  description: string;
  priority: number;
}

interface MatchResult {
  alias: Alias;
  params: Record<string, string>;
  confidence: number;
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createServiceClient();
    const userId = getUserId(req);
    const layer = getLayer(userId);

    // Parse request
    const { request } = await req.json();
    if (!request || typeof request !== 'string') {
      return errorResponse('request field is required');
    }

    // Find matching alias
    const match = await findMatchingAlias(supabase, request, layer);

    if (!match) {
      return jsonResponse({
        matched: false,
        request,
        message: 'No matching alias found. Try rephrasing or use a direct tool.',
        suggestions: await getSuggestions(supabase, layer),
      });
    }

    // Execute the matched tool
    const result = await executeTool(supabase, match, userId, layer);

    // Log execution for recall
    await logExecution(supabase, {
      layer,
      aliasId: match.alias.id,
      aliasPattern: match.alias.pattern,
      inputRequest: request,
      toolName: match.alias.tool_name,
      params: match.params,
      resultSummary: summarizeResult(result),
      entities: extractEntities(match.params),
    });

    return jsonResponse({
      matched: true,
      alias: match.alias.pattern,
      tool: match.alias.tool_name,
      params: match.params,
      confidence: match.confidence,
      result,
    });

  } catch (error) {
    console.error('do() error:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * Find best matching alias for input request
 */
async function findMatchingAlias(
  supabase: any,
  request: string,
  layer: string
): Promise<MatchResult | null> {
  // Get all active aliases for this layer
  const { data: aliases, error } = await supabase
    .schema('human_os')
    .from('aliases')
    .select('id, pattern, tool_name, description, priority')
    .eq('layer', layer)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (error || !aliases?.length) {
    return null;
  }

  const normalizedRequest = request.toLowerCase().trim();
  let bestMatch: MatchResult | null = null;

  for (const alias of aliases) {
    const match = matchPattern(alias.pattern, normalizedRequest);
    if (match) {
      const confidence = calculateConfidence(alias.pattern, normalizedRequest, match);
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { alias, params: match, confidence };
      }
    }
  }

  return bestMatch;
}

/**
 * Match a pattern against input text
 * Pattern: "add {title} to my tasks"
 * Input: "add call ruth to my tasks"
 * Returns: { title: "call ruth" }
 */
function matchPattern(pattern: string, input: string): Record<string, string> | null {
  // Convert pattern to regex
  const paramNames: string[] = [];
  let regexStr = pattern
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
    .replace(/\\{(\w+)\\}/g, (_, name) => {
      paramNames.push(name);
      return '(.+?)'; // Non-greedy capture
    });

  // Add anchors and make whitespace flexible
  regexStr = '^' + regexStr.replace(/\s+/g, '\\s+') + '$';

  const regex = new RegExp(regexStr, 'i');
  const match = input.match(regex);

  if (!match) return null;

  const params: Record<string, string> = {};
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1].trim();
  });

  return params;
}

/**
 * Calculate match confidence (0-1)
 */
function calculateConfidence(
  pattern: string,
  input: string,
  params: Record<string, string>
): number {
  // Base confidence from pattern specificity
  const patternWords = pattern.split(/\s+/).length;
  const paramCount = Object.keys(params).length;
  const staticWords = patternWords - paramCount;

  // More static words = higher confidence
  return Math.min(0.5 + (staticWords * 0.1), 1.0);
}

/**
 * Execute the matched tool
 */
async function executeTool(
  supabase: any,
  match: MatchResult,
  userId: string,
  layer: string
): Promise<unknown> {
  const { tool_name } = match.alias;
  const params = match.params;

  // Route to appropriate handler
  switch (tool_name) {
    case 'add_task':
      return addTask(supabase, userId, params);

    case 'add_queue_item':
      return addQueueItem(supabase, userId, params);

    case 'lookup_term':
      return lookupTerm(supabase, layer, params);

    case 'define_term':
      return defineTerm(supabase, layer, params);

    case 'quick_search':
      return quickSearch(supabase, layer, params);

    default:
      return {
        executed: false,
        message: `Tool ${tool_name} not yet implemented in edge function`,
        params
      };
  }
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

async function addTask(supabase: any, userId: string, params: Record<string, string>) {
  const { data, error } = await supabase
    .schema('founder_os')
    .from('tasks')
    .insert({
      user_id: userId,
      title: params.title || params.task || params.content,
      priority: params.priority || 'medium',
      status: 'todo',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add task: ${error.message}`);
  return { success: true, task: data, message: `Added task: ${data.title}` };
}

async function addQueueItem(supabase: any, userId: string, params: Record<string, string>) {
  const { data, error } = await supabase
    .schema('founder_os')
    .from('claude_queue')
    .insert({
      user_id: userId,
      intent_type: params.type || 'task',
      payload: { content: params.content || params.item },
      notes: params.notes,
      status: 'pending',
      session_id: `mobile-${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to queue: ${error.message}`);
  return { success: true, queued_id: data.id, message: 'Queued for desktop processing' };
}

async function lookupTerm(supabase: any, layer: string, params: Record<string, string>) {
  const term = (params.term || '').toLowerCase().trim();

  const { data, error } = await supabase
    .from('glossary')
    .select('term, definition, short_definition, term_type')
    .eq('layer', layer)
    .eq('term_normalized', term)
    .single();

  if (error || !data) {
    return { found: false, term: params.term };
  }

  return { found: true, term: data };
}

async function defineTerm(supabase: any, layer: string, params: Record<string, string>) {
  const term = params.term?.trim();
  const definition = params.definition || params.meaning;

  const { data, error } = await supabase
    .from('glossary')
    .upsert({
      term,
      term_normalized: term.toLowerCase(),
      definition,
      short_definition: definition.slice(0, 100),
      term_type: 'shorthand',
      layer,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'layer,term_normalized' })
    .select()
    .single();

  if (error) throw new Error(`Failed to define term: ${error.message}`);
  return { success: true, term: data.term, definition: data.definition };
}

async function quickSearch(supabase: any, layer: string, params: Record<string, string>) {
  const query = params.query || params.keyword;

  const { data, error } = await supabase.rpc('pack_search', {
    p_keyword: query,
    p_entity_type: null,
    p_pack_type: null,
    p_tags: null,
    p_location: null,
    p_layer: layer,
    p_limit: 10,
  });

  if (error) throw new Error(`Search failed: ${error.message}`);
  return { results: data || [], total: data?.length || 0 };
}

// =============================================================================
// HELPERS
// =============================================================================

async function getSuggestions(supabase: any, layer: string): Promise<string[]> {
  const { data } = await supabase
    .schema('human_os')
    .from('aliases')
    .select('pattern')
    .eq('layer', layer)
    .eq('is_active', true)
    .order('usage_count', { ascending: false })
    .limit(5);

  return data?.map((a: any) => a.pattern) || [];
}

async function logExecution(supabase: any, log: {
  layer: string;
  aliasId: string;
  aliasPattern: string;
  inputRequest: string;
  toolName: string;
  params: Record<string, string>;
  resultSummary: string;
  entities: string[];
}) {
  await supabase
    .schema('human_os')
    .from('execution_logs')
    .insert({
      layer: log.layer,
      alias_id: log.aliasId,
      alias_pattern: log.aliasPattern,
      input_request: log.inputRequest,
      tool_name: log.toolName,
      params: log.params,
      result_summary: log.resultSummary,
      entities: log.entities,
    });
}

function summarizeResult(result: unknown): string {
  if (typeof result === 'object' && result !== null) {
    const r = result as Record<string, unknown>;
    if (r.message) return String(r.message);
    if (r.success) return 'Success';
  }
  return JSON.stringify(result).slice(0, 200);
}

function extractEntities(params: Record<string, string>): string[] {
  // Extract potential entity references from params
  const entities: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (['person', 'entity', 'contact', 'company'].includes(key)) {
      entities.push(value.toLowerCase().replace(/\s+/g, '-'));
    }
  }
  return entities;
}
