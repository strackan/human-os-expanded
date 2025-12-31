/**
 * Queue Service
 *
 * Mobile to Desktop sync via claude_queue table.
 * Items logged on mobile are processed when starting a desktop session.
 */

import { DB_SCHEMAS, TASK_STATUS, DEFAULTS } from '@human-os/core';
import type { ServiceContext, ServiceResult } from './types.js';

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

// =============================================================================
// QUEUE SERVICE
// =============================================================================

export class QueueService {
  /**
   * Add an item to the queue for later processing
   */
  static async add(ctx: ServiceContext, input: QueueItemInput): Promise<QueueResult> {
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
   * Get pending queue items
   */
  static async getPending(ctx: ServiceContext): Promise<ServiceResult<QueueItem[]>> {
    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('claude_queue')
      .select('*')
      .eq('user_id', ctx.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  }

  /**
   * Get a single queue item by ID
   */
  static async getById(ctx: ServiceContext, itemId: string): Promise<ServiceResult<QueueItem>> {
    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('claude_queue')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', ctx.userId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Queue item not found' };
    }

    return { success: true, data };
  }

  /**
   * Update a pending queue item
   */
  static async update(
    ctx: ServiceContext,
    itemId: string,
    updates: QueueItemUpdate
  ): Promise<QueueResult> {
    // First verify the item exists and is pending
    const existing = await this.getById(ctx, itemId);
    if (!existing.success || !existing.data) {
      return { success: false, message: 'Queue item not found' };
    }

    if (existing.data.status !== 'pending' && updates.status !== 'pending') {
      return {
        success: false,
        message: `Cannot update item with status '${existing.data.status}'`,
      };
    }

    const updateData: Record<string, unknown> = {};
    if (updates.payload !== undefined) updateData.payload = updates.payload;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('claude_queue')
      .update(updateData)
      .eq('id', itemId);

    if (error) {
      return { success: false, message: `Update failed: ${error.message}` };
    }

    return {
      success: true,
      queued_id: itemId,
      message: `Queue item updated${updates.status === 'skipped' ? ' (marked as skipped)' : ''}`,
    };
  }

  /**
   * Process all pending queue items
   */
  static async processAll(ctx: ServiceContext): Promise<ProcessResult> {
    const pending = await this.getPending(ctx);

    if (!pending.success || !pending.data || pending.data.length === 0) {
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

    for (const item of pending.data) {
      try {
        await this.routeAndInsert(ctx, item);
        await this.markProcessed(ctx, item.id);
        results.processed++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await this.markFailed(ctx, item.id, errorMessage);
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
   * Process a single queue item by ID
   */
  static async processOne(ctx: ServiceContext, itemId: string): Promise<QueueResult> {
    const item = await this.getById(ctx, itemId);
    if (!item.success || !item.data) {
      return { success: false, message: 'Queue item not found' };
    }

    if (item.data.status !== 'pending') {
      return {
        success: false,
        message: `Item has status '${item.data.status}', cannot process`,
      };
    }

    try {
      await this.routeAndInsert(ctx, item.data);
      await this.markProcessed(ctx, itemId);
      return {
        success: true,
        queued_id: itemId,
        message: `Successfully processed ${item.data.intent_type}`,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.markFailed(ctx, itemId, errorMessage);
      return { success: false, message: `Failed to process: ${errorMessage}` };
    }
  }

  // ===========================================================================
  // INTERNAL HELPERS
  // ===========================================================================

  private static async routeAndInsert(ctx: ServiceContext, item: QueueItem): Promise<void> {
    const payload = item.payload;

    switch (item.intent_type) {
      case 'task': {
        if (!payload.title || typeof payload.title !== 'string') {
          throw new Error('Task requires a title');
        }

        const { error } = await ctx.supabase
          .schema(DB_SCHEMAS.FOUNDER_OS)
          .from('tasks')
          .insert({
            user_id: item.user_id,
            title: payload.title,
            context_tags: Array.isArray(payload.context_tags) ? payload.context_tags : [],
            priority: payload.priority || DEFAULTS.TASK_PRIORITY,
            due_date: payload.due_date || null,
            description: payload.description || payload.notes || item.notes || null,
            status: TASK_STATUS.TODO,
          });

        if (error) throw new Error(`Failed to create task: ${error.message}`);
        break;
      }

      case 'note':
      case 'event': {
        // Accept content from payload or fallback to item.notes
        const content = payload.content || item.notes;
        if (!content || typeof content !== 'string') {
          throw new Error('Note/event requires content (in payload.content or notes field)');
        }

        const { error } = await ctx.supabase.from('interactions').insert({
          owner_id: item.user_id,
          layer: ctx.layer || 'public',
          interaction_type: payload.interaction_type || 'note',
          content: content,
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

        const decisionContent = `Decision: ${payload.decision}${
          payload.context ? ` (Context: ${payload.context})` : ''
        }${payload.outcome ? ` → Outcome: ${payload.outcome}` : ''}`;

        const { error } = await ctx.supabase.from('interactions').insert({
          owner_id: item.user_id,
          layer: ctx.layer || 'public',
          interaction_type: 'note',
          content: decisionContent,
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

  private static async markProcessed(ctx: ServiceContext, itemId: string): Promise<void> {
    await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('claude_queue')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', itemId);
  }

  private static async markFailed(
    ctx: ServiceContext,
    itemId: string,
    errorMessage: string
  ): Promise<void> {
    await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('claude_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
        processed_at: new Date().toISOString(),
      })
      .eq('id', itemId);
  }
}
