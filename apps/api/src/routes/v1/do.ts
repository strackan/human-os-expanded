/**
 * Do Route - Natural Language Command Router
 *
 * POST /v1/do
 * The unified endpoint that routes natural language requests to aliases.
 * This is the "user vocabulary as API" pattern.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContextEngine, KnowledgeGraph, Layer } from '@human-os/core';
import { type AuthenticatedRequest, requireScope } from '../../middleware/auth.js';

const DoRequestSchema = z.object({
  request: z.string().min(1, 'Request is required'),
  context: z
    .object({
      modes: z.array(z.string()).optional(),
      focusEntity: z.string().optional(),
    })
    .optional(),
});

const ListAliasesSchema = z.object({
  includeDescriptions: z.boolean().optional().default(true),
});

/**
 * Create do routes
 */
export function createDoRoutes(
  supabase: SupabaseClient,
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph
): Router {
  const router = Router();

  /**
   * POST /v1/do
   * Execute a natural language command
   */
  router.post('/', requireScope('founder-os:write'), async (req: AuthenticatedRequest, res) => {
    try {
      const input = DoRequestSchema.parse(req.body);
      const userId = req.apiKey?.ownerId;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in API key' });
      }

      // Import alias system dynamically
      const { AliasResolver, AliasExecutor } = await import('@human-os/aliases');

      const layer = `founder:${userId}` as Layer;

      // Initialize resolver
      const resolver = new AliasResolver({
        supabaseUrl: process.env['SUPABASE_URL']!,
        supabaseKey: process.env['SUPABASE_SERVICE_ROLE_KEY']!,
        defaultLayer: layer,
        enableSemanticFallback: true,
        semanticThreshold: 0.7,
      });

      // Try to match the request to an alias
      const match = await resolver.resolve(input.request, layer, input.context?.modes);

      if (!match) {
        // No match found - return suggestions
        const aliases = await resolver.listAliases(layer, false);
        return res.status(404).json({
          success: false,
          summary: `No matching alias found for: "${input.request}"`,
          suggestions: aliases.slice(0, 5).map((a: { pattern: string }) => a.pattern),
          error: 'No matching alias. Try one of the suggested patterns or use learn_alias to create a new one.',
        });
      }

      // Initialize executor
      const executor = new AliasExecutor({
        supabaseUrl: process.env['SUPABASE_URL']!,
        supabaseKey: process.env['SUPABASE_SERVICE_ROLE_KEY']!,
      });

      // Build execution context
      const execCtx = {
        layer,
        userId,
        modeContext: input.context?.modes,
        vars: {},
        outputs: {},
        invokeTool: async (toolName: string, params: Record<string, unknown>) => {
          // Route to internal tool handlers
          return invokeToolInternal(toolName, params, userId, supabase, contextEngine, knowledgeGraph);
        },
        log: (message: string, data?: unknown) => {
          console.error(`[do] ${message}`, data ? JSON.stringify(data) : '');
        },
      };

      // Execute the alias
      const result = await executor.execute(match.alias, match.extractedVars, input.request, execCtx);

      return res.json({
        success: result.success,
        summary: result.summary,
        matchedAlias: match.alias.pattern,
        matchType: match.matchType,
        error: result.error,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[do] Error:', error);
      return res.status(500).json({ error: message });
    }
  });

  /**
   * GET /v1/do/aliases
   * List available aliases
   */
  router.get('/aliases', requireScope('founder-os:read'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.apiKey?.ownerId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in API key' });
      }

      const includeDescriptions = req.query['includeDescriptions'] !== 'false';

      const { AliasResolver } = await import('@human-os/aliases');

      const layer = `founder:${userId}` as Layer;

      const resolver = new AliasResolver({
        supabaseUrl: process.env['SUPABASE_URL']!,
        supabaseKey: process.env['SUPABASE_SERVICE_ROLE_KEY']!,
        defaultLayer: layer,
        enableSemanticFallback: false,
        semanticThreshold: 0.7,
      });

      const aliases = await resolver.listAliases(layer, includeDescriptions);

      return res.json({
        aliases,
        hint: 'Use POST /v1/do with any of these patterns. Variables in {braces} will be extracted from your request.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}

/**
 * Invoke an internal tool by name
 */
async function invokeToolInternal(
  toolName: string,
  params: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient,
  contextEngine: ContextEngine,
  knowledgeGraph: KnowledgeGraph
): Promise<unknown> {
  // Handle queue tools
  if (toolName === 'add_queue_item') {
    return addQueueItem(params, userId, supabase);
  }

  if (toolName === 'process_queue') {
    return processQueue(userId, supabase);
  }

  // Handle task tools
  if (toolName === 'add_task') {
    return addTask(params, userId, supabase);
  }

  if (toolName === 'get_urgent_tasks') {
    return getUrgentTasks(userId, supabase);
  }

  if (toolName === 'complete_task') {
    return completeTask(params, userId, supabase);
  }

  if (toolName === 'list_all_tasks') {
    return listAllTasks(params, userId, supabase);
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

// =============================================================================
// QUEUE HELPERS
// =============================================================================

async function addQueueItem(
  params: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<unknown> {
  const { data, error } = await supabase
    .schema('founder_os')
    .from('claude_queue')
    .insert({
      user_id: userId,
      intent_type: params.intent_type,
      payload: params.payload,
      target_table: params.target_table || null,
      notes: params.notes || null,
      session_id: params.session_id || `api-${Date.now()}`,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `Failed to queue item: ${error.message}` };
  }

  return {
    success: true,
    queued_id: data.id,
    message: `Queued ${params.intent_type} for processing`,
  };
}

async function processQueue(userId: string, supabase: SupabaseClient): Promise<unknown> {
  const { data: pending, error } = await supabase
    .schema('founder_os')
    .from('claude_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    return { processed: 0, failed: [], summary: `Error: ${error.message}` };
  }

  if (!pending || pending.length === 0) {
    return { processed: 0, failed: [], summary: 'No pending items in queue' };
  }

  let processed = 0;
  const failed: { id: string; error: string }[] = [];

  for (const item of pending) {
    try {
      // Route based on intent_type
      if (item.intent_type === 'task') {
        await supabase.schema('founder_os').from('tasks').insert({
          user_id: userId,
          title: item.payload.title,
          context_tags: item.payload.context_tags || [],
          priority: item.payload.priority || 'medium',
          due_date: item.payload.due_date || null,
          notes: item.payload.notes || null,
          status: 'todo',
        });
      }

      // Mark as processed
      await supabase
        .schema('founder_os')
        .from('claude_queue')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', item.id);

      processed++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await supabase
        .schema('founder_os')
        .from('claude_queue')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', item.id);
      failed.push({ id: item.id, error: errorMessage });
    }
  }

  return { processed, failed, summary: `Processed ${processed} items` };
}

// =============================================================================
// TASK HELPERS
// =============================================================================

async function addTask(
  params: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<unknown> {
  const { data, error } = await supabase
    .schema('founder_os')
    .from('tasks')
    .insert({
      user_id: userId,
      title: params.title,
      description: params.description || null,
      context_tags: params.context_tags || [],
      priority: params.priority || 'medium',
      due_date: params.due_date || null,
      status: 'todo',
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, task: data };
}

async function getUrgentTasks(userId: string, supabase: SupabaseClient): Promise<unknown> {
  const { data, error } = await supabase
    .schema('founder_os')
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['todo', 'in_progress'])
    .or('priority.eq.critical,priority.eq.high,due_date.lte.' + new Date().toISOString().split('T')[0])
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10);

  if (error) {
    return { tasks: [], error: error.message };
  }

  return { tasks: data || [] };
}

async function completeTask(
  params: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<unknown> {
  const { data, error } = await supabase
    .schema('founder_os')
    .from('tasks')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', params.task_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, task: data };
}

async function listAllTasks(
  params: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<unknown> {
  const status = params.status as string | undefined;
  const limit = (params.limit as number) || 50;

  let query = supabase
    .schema('founder_os')
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return { tasks: [], error: error.message };
  }

  return { tasks: data || [] };
}
