/**
 * Queue Tools
 *
 * Unified definitions for mobile → desktop sync.
 * Single definition → MCP + REST + do()
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';
import { DB_SCHEMAS, TASK_STATUS, DEFAULTS } from '@human-os/core';

// =============================================================================
// ADD QUEUE ITEM
// =============================================================================

export const addQueueItem = defineTool({
  name: 'add_queue_item',
  description: 'Add an item to the processing queue for later handling. Use when on mobile or unable to complete immediately.',
  platform: 'founder',
  category: 'queue',

  input: z.object({
    intent_type: z.enum(['task', 'event', 'decision', 'note', 'memory_edit']).describe('Type of item'),
    payload: z.record(z.unknown()).describe('Item data - structure depends on intent_type'),
    target_table: z.string().optional().describe('Optional hint for destination table'),
    notes: z.string().optional().describe('Context or instructions for processing'),
    session_id: z.string().optional().describe('Group related items'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('claude_queue')
      .insert({
        user_id: ctx.userId,
        intent_type: input.intent_type,
        payload: input.payload,
        target_table: input.target_table || null,
        notes: input.notes || null,
        session_id: input.session_id || `api-${Date.now()}`,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: `Failed to queue: ${error.message}` };
    }

    return {
      success: true,
      queued_id: data.id,
      message: `Queued ${input.intent_type} for processing on next desktop session`,
    };
  },

  rest: { method: 'POST', path: '/queue' },

  alias: {
    pattern: 'queue {item} for later',
    priority: 50,
  },
});

// =============================================================================
// PROCESS QUEUE
// =============================================================================

export const processQueue = defineTool({
  name: 'process_queue',
  description: 'Process all pending queue items. Routes each item to appropriate table based on intent_type.',
  platform: 'founder',
  category: 'queue',

  input: z.object({}),

  handler: async (ctx) => {
    // Fetch pending items
    const { data: pending, error: fetchError } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('claude_queue')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) {
      return { processed: 0, failed: [], summary: `Error: ${fetchError.message}` };
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
          const payload = item.payload as Record<string, unknown>;
          await ctx.supabase.schema(DB_SCHEMAS.FOUNDER_OS).from('tasks').insert({
            user_id: ctx.userId,
            title: payload.title,
            context_tags: payload.context_tags || [],
            priority: payload.priority || DEFAULTS.TASK_PRIORITY,
            due_date: payload.due_date || null,
            notes: payload.notes || null,
            status: TASK_STATUS.TODO,
          });
        }

        // Mark as processed
        await ctx.supabase
          .schema(DB_SCHEMAS.FOUNDER_OS)
          .from('claude_queue')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .eq('id', item.id);

        processed++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await ctx.supabase
          .schema(DB_SCHEMAS.FOUNDER_OS)
          .from('claude_queue')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('id', item.id);
        failed.push({ id: item.id, error: errorMessage });
      }
    }

    return { processed, failed, summary: `Processed ${processed} items` };
  },

  rest: { method: 'POST', path: '/queue/process' },

  alias: {
    pattern: 'process my queue',
    priority: 30,
  },
});

// =============================================================================
// GET PENDING QUEUE
// =============================================================================

export const getPendingQueue = defineTool({
  name: 'get_pending_queue',
  description: 'Get all pending queue items',
  platform: 'founder',
  category: 'queue',

  input: z.object({}),

  handler: async (ctx) => {
    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('claude_queue')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, items: [], error: error.message };
    }

    return { success: true, items: data || [], count: data?.length || 0 };
  },

  rest: { method: 'GET', path: '/queue' },

  alias: {
    pattern: "what's in my queue",
    priority: 40,
  },
});
