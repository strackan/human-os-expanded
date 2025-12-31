/**
 * Queue Tools
 *
 * Mobile to Desktop sync via claude_queue table.
 * Items logged on mobile are processed when starting a desktop session.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { DB_SCHEMAS, TASK_STATUS, DEFAULTS } from '@human-os/core';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const queueTools: Tool[] = [
  {
    name: 'add_queue_item',
    description: 'Add an item to the processing queue for later handling. Use when on mobile or unable to complete immediately.',
    inputSchema: {
      type: 'object',
      properties: {
        intent_type: {
          type: 'string',
          enum: ['task', 'event', 'decision', 'note', 'memory_edit'],
          description: 'Type of item being queued',
        },
        payload: {
          type: 'object',
          description: 'Item data - structure depends on intent_type. task: {title, context_tags?, priority?, due_date?, notes?}. note/event: {content, interaction_type?, occurred_at?}. decision: {decision, context?, outcome?}',
        },
        target_table: {
          type: 'string',
          description: 'Optional hint for where this should land when processed',
        },
        notes: {
          type: 'string',
          description: 'Context or instructions for processing',
        },
        session_id: {
          type: 'string',
          description: 'Group related items (auto-generated if not provided)',
        },
      },
      required: ['intent_type', 'payload'],
    },
  },
  {
    name: 'update_queue_item',
    description: 'Update a pending queue item (change payload, status, or notes)',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: {
          type: 'string',
          description: 'UUID of the queue item to update',
        },
        payload: {
          type: 'object',
          description: 'Updated payload data (replaces existing)',
        },
        status: {
          type: 'string',
          enum: ['pending', 'skipped'],
          description: 'Change status (can skip items to ignore them)',
        },
        notes: {
          type: 'string',
          description: 'Update notes/context',
        },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'process_queue',
    description: 'Process all pending queue items. Routes each item to appropriate table based on intent_type.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'process_queue_item',
    description: 'Process a single queue item by ID',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: {
          type: 'string',
          description: 'UUID of the queue item to process',
        },
      },
      required: ['item_id'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle queue tool calls
 * Returns result if handled, null if not a queue tool
 */
export async function handleQueueTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'add_queue_item': {
      const { intent_type, payload, target_table, notes, session_id } = args;
      if (!intent_type || !payload) throw new Error('intent_type and payload are required');
      const input: QueueItemInput = {
        intent_type: intent_type as IntentType,
        payload: payload as Record<string, unknown>,
        target_table: target_table as string | undefined,
        notes: notes as string | undefined,
        session_id: session_id as string | undefined,
      };
      return queueItem(ctx, input);
    }

    case 'update_queue_item': {
      const { item_id, payload, status, notes } = args;
      if (!item_id) throw new Error('item_id is required');
      const updates: QueueItemUpdate = {};
      if (payload !== undefined) updates.payload = payload as Record<string, unknown>;
      if (status !== undefined) updates.status = status as QueueItemUpdate['status'];
      if (notes !== undefined) updates.notes = notes as string;
      return updateQueueItem(ctx, item_id as string, updates);
    }

    case 'process_queue': {
      return processQueueItems(ctx);
    }

    case 'process_queue_item': {
      const { item_id } = args as { item_id: string };
      if (!item_id) throw new Error('item_id is required');
      return processQueueItem(ctx, item_id);
    }

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

export type IntentType = 'task' | 'event' | 'decision' | 'note' | 'memory_edit';
export type QueueStatus = 'pending' | 'processed' | 'skipped' | 'failed';

export interface QueueItem {
  id: string;
  created_at: string;
  user_id: string;
  intent_type: IntentType;
  payload: Record<string, unknown>;
  target_table: string | null;
  status: QueueStatus;
  processed_at: string | null;
  error_message: string | null;
  session_id: string | null;
  notes: string | null;
}

export interface QueueItemInput {
  intent_type: IntentType;
  payload: Record<string, unknown>;
  target_table?: string;
  notes?: string;
  session_id?: string;
}

export interface QueueResult {
  success: boolean;
  queued_id?: string;
  message: string;
}

export interface ProcessResult {
  processed: number;
  skipped: number;
  failed: FailedItem[];
  summary: string;
}

export interface FailedItem {
  id: string;
  intent_type: IntentType;
  error: string;
  payload: Record<string, unknown>;
}

export interface QueueItemUpdate {
  payload?: Record<string, unknown>;
  status?: 'pending' | 'skipped';
  notes?: string;
}

export interface SingleProcessResult {
  success: boolean;
  item_id: string;
  intent_type?: IntentType;
  message: string;
  error?: string;
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Add an item to the queue for later processing
 */
async function queueItem(ctx: ToolContext, input: QueueItemInput): Promise<QueueResult> {
  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('claude_queue')
    .insert({
      user_id: ctx.userUUID,
      intent_type: input.intent_type,
      payload: input.payload,
      target_table: input.target_table || null,
      notes: input.notes || null,
      session_id: input.session_id || `mobile-${Date.now()}`,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: `Failed to queue item: ${error.message}`,
    };
  }

  return {
    success: true,
    queued_id: data.id,
    message: `Queued ${input.intent_type} for processing on next desktop session`,
  };
}

/**
 * Update a pending queue item
 */
async function updateQueueItem(
  ctx: ToolContext,
  itemId: string,
  updates: QueueItemUpdate
): Promise<QueueResult> {
  const supabase = ctx.getClient();

  // First verify the item exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('claude_queue')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', ctx.userUUID)
    .single();

  if (fetchError || !existing) {
    return {
      success: false,
      message: `Queue item not found or access denied: ${itemId}`,
    };
  }

  // Can only update pending items
  if (existing.status !== 'pending' && updates.status !== 'pending') {
    return {
      success: false,
      message: `Cannot update item with status '${existing.status}'. Only pending items can be updated.`,
    };
  }

  const updateData: Record<string, unknown> = {};
  if (updates.payload !== undefined) updateData.payload = updates.payload;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { error } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('claude_queue')
    .update(updateData)
    .eq('id', itemId);

  if (error) {
    return {
      success: false,
      message: `Failed to update queue item: ${error.message}`,
    };
  }

  return {
    success: true,
    queued_id: itemId,
    message: `Queue item updated${updates.status === 'skipped' ? ' (marked as skipped)' : ''}`,
  };
}

/**
 * Process a single queue item by ID
 */
async function processQueueItem(ctx: ToolContext, itemId: string): Promise<SingleProcessResult> {
  const supabase = ctx.getClient();

  // Fetch the item
  const { data: item, error: fetchError } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('claude_queue')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', ctx.userUUID)
    .single();

  if (fetchError || !item) {
    return {
      success: false,
      item_id: itemId,
      message: `Queue item not found or access denied`,
      error: fetchError?.message,
    };
  }

  const queueItemData = item as QueueItem;

  if (queueItemData.status !== 'pending') {
    return {
      success: false,
      item_id: itemId,
      intent_type: queueItemData.intent_type,
      message: `Item has status '${queueItemData.status}', cannot process`,
    };
  }

  try {
    await routeAndInsert(supabase, queueItemData);
    await markProcessed(supabase, itemId);
    return {
      success: true,
      item_id: itemId,
      intent_type: queueItemData.intent_type,
      message: `Successfully processed ${queueItemData.intent_type}`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await markFailed(supabase, itemId, errorMessage);
    return {
      success: false,
      item_id: itemId,
      intent_type: queueItemData.intent_type,
      message: `Failed to process item`,
      error: errorMessage,
    };
  }
}

/**
 * Process all pending queue items for a user
 */
async function processQueueItems(ctx: ToolContext): Promise<ProcessResult> {
  const supabase = ctx.getClient();

  // Fetch all pending items
  const { data: pending, error: fetchError } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('claude_queue')
    .select('*')
    .eq('user_id', ctx.userUUID)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (fetchError) {
    return {
      processed: 0,
      skipped: 0,
      failed: [],
      summary: `Error fetching queue: ${fetchError.message}`,
    };
  }

  if (!pending || pending.length === 0) {
    return {
      processed: 0,
      skipped: 0,
      failed: [],
      summary: 'No pending items in queue',
    };
  }

  const results: ProcessResult = {
    processed: 0,
    skipped: 0,
    failed: [],
    summary: '',
  };

  for (const item of pending as QueueItem[]) {
    try {
      await routeAndInsert(supabase, item);
      await markProcessed(supabase, item.id);
      results.processed++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await markFailed(supabase, item.id, errorMessage);
      results.failed.push({
        id: item.id,
        intent_type: item.intent_type,
        error: errorMessage,
        payload: item.payload,
      });
    }
  }

  // Build summary
  const parts: string[] = [];
  if (results.processed > 0) {
    parts.push(`${results.processed} item${results.processed > 1 ? 's' : ''} processed`);
  }
  if (results.failed.length > 0) {
    parts.push(`${results.failed.length} failed - please review`);
  }
  results.summary = parts.length > 0 ? parts.join(', ') : 'Queue empty';

  return results;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Route item to appropriate table based on intent_type
 */
async function routeAndInsert(supabase: SupabaseClient, item: QueueItem): Promise<void> {
  const payload = item.payload;

  switch (item.intent_type) {
    case 'task': {
      if (!payload.title || typeof payload.title !== 'string') {
        throw new Error('Task requires a title');
      }

      const { error } = await supabase.schema(DB_SCHEMAS.FOUNDER_OS).from('tasks').insert({
        user_id: item.user_id,
        title: payload.title,
        context_tags: Array.isArray(payload.context_tags) ? payload.context_tags : [],
        priority: payload.priority || DEFAULTS.TASK_PRIORITY,
        due_date: payload.due_date || null,
        notes: payload.notes || null,
        status: TASK_STATUS.TODO,
      });

      if (error) throw new Error(`Failed to create task: ${error.message}`);
      break;
    }

    case 'note':
    case 'event': {
      if (!payload.content || typeof payload.content !== 'string') {
        throw new Error('Note/event requires content');
      }

      const { error } = await supabase.from('interactions').insert({
        owner_id: item.user_id,
        interaction_type: payload.interaction_type || 'note',
        summary: payload.content,
        occurred_at: payload.occurred_at || new Date().toISOString(),
        sentiment: payload.sentiment || null,
      });

      if (error) throw new Error(`Failed to create interaction: ${error.message}`);
      break;
    }

    case 'decision': {
      if (!payload.decision || typeof payload.decision !== 'string') {
        throw new Error('Decision requires a decision field');
      }

      const { error } = await supabase.from('interactions').insert({
        owner_id: item.user_id,
        interaction_type: 'note',
        summary: `Decision: ${payload.decision}${payload.context ? ` (Context: ${payload.context})` : ''}${payload.outcome ? ` → Outcome: ${payload.outcome}` : ''}`,
        occurred_at: new Date().toISOString(),
      });

      if (error) throw new Error(`Failed to log decision: ${error.message}`);
      break;
    }

    case 'memory_edit': {
      throw new Error('memory_edit requires manual handling - please process manually');
    }

    default:
      throw new Error(`Unknown intent_type: ${item.intent_type}`);
  }
}

/**
 * Mark a queue item as processed
 */
async function markProcessed(supabase: SupabaseClient, itemId: string): Promise<void> {
  const { error } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('claude_queue')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    console.error(`Failed to mark item ${itemId} as processed:`, error);
  }
}

/**
 * Mark a queue item as failed
 */
async function markFailed(supabase: SupabaseClient, itemId: string, errorMessage: string): Promise<void> {
  const { error } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('claude_queue')
    .update({
      status: 'failed',
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    console.error(`Failed to mark item ${itemId} as failed:`, error);
  }
}
