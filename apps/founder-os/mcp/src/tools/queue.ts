/**
 * Queue Tools
 *
 * Mobile to Desktop sync via claude_queue table.
 * Items logged on mobile are processed when starting a desktop session.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

/**
 * Add an item to the queue for later processing
 */
export async function queueItem(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  input: QueueItemInput
): Promise<QueueResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .schema('founder')
    .from('claude_queue')
    .insert({
      user_id: userId,
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
export async function updateQueueItem(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  itemId: string,
  updates: QueueItemUpdate
): Promise<QueueResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // First verify the item exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .schema('founder')
    .from('claude_queue')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
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
    .schema('founder')
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
export async function processQueueItem(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  itemId: string
): Promise<SingleProcessResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch the item
  const { data: item, error: fetchError } = await supabase
    .schema('founder')
    .from('claude_queue')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !item) {
    return {
      success: false,
      item_id: itemId,
      message: `Queue item not found or access denied`,
      error: fetchError?.message,
    };
  }

  const queueItem = item as QueueItem;

  if (queueItem.status !== 'pending') {
    return {
      success: false,
      item_id: itemId,
      intent_type: queueItem.intent_type,
      message: `Item has status '${queueItem.status}', cannot process`,
    };
  }

  try {
    await routeAndInsert(supabase, queueItem);
    await markProcessed(supabase, itemId);
    return {
      success: true,
      item_id: itemId,
      intent_type: queueItem.intent_type,
      message: `Successfully processed ${queueItem.intent_type}`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await markFailed(supabase, itemId, errorMessage);
    return {
      success: false,
      item_id: itemId,
      intent_type: queueItem.intent_type,
      message: `Failed to process item`,
      error: errorMessage,
    };
  }
}

/**
 * Process all pending queue items for a user
 */
export async function processQueueItems(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): Promise<ProcessResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all pending items
  const { data: pending, error: fetchError } = await supabase
    .schema('founder')
    .from('claude_queue')
    .select('*')
    .eq('user_id', userId)
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

/**
 * Route item to appropriate table based on intent_type
 */
async function routeAndInsert(supabase: SupabaseClient, item: QueueItem): Promise<void> {
  const payload = item.payload;

  switch (item.intent_type) {
    case 'task': {
      // Validate required fields
      if (!payload.title || typeof payload.title !== 'string') {
        throw new Error('Task requires a title');
      }

      const { error } = await supabase.schema('founder').from('tasks').insert({
        user_id: item.user_id,
        title: payload.title,
        context_tags: Array.isArray(payload.context_tags) ? payload.context_tags : [],
        priority: payload.priority || 'medium',
        due_date: payload.due_date || null,
        notes: payload.notes || null,
        status: 'todo',
      });

      if (error) throw new Error(`Failed to create task: ${error.message}`);
      break;
    }

    case 'note':
    case 'event': {
      // Validate required fields
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
      // Decisions can go to daily_plans as a note, or we skip for manual handling
      if (!payload.decision || typeof payload.decision !== 'string') {
        throw new Error('Decision requires a decision field');
      }

      // For now, log as an interaction of type 'decision'
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
      // Memory edits are complex - for now, skip for manual handling
      // Future: could update glossary or context_files
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
    .schema('founder')
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
    .schema('founder')
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

/**
 * Get pending queue count (for display without processing)
 */
export async function getQueueCount(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): Promise<{ pending: number; failed: number }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count: pending } = await supabase
    .schema('founder')
    .from('claude_queue')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');

  const { count: failed } = await supabase
    .schema('founder')
    .from('claude_queue')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'failed');

  return {
    pending: pending || 0,
    failed: failed || 0,
  };
}
