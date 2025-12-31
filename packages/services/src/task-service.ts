/**
 * Task Service
 *
 * ADHD-friendly task management for founders.
 * Urgency escalation, context tagging, and priority management.
 */

import { DB_SCHEMAS, TASK_STATUS, DEFAULTS } from '@human-os/core';
import type { ServiceContext, ServiceResult } from './types.js';

// =============================================================================
// TYPES
// =============================================================================

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  context_tags: string[];
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  context_tags?: string[];
  due_date?: string;
  notes?: string;
}

export interface TaskResult {
  success: boolean;
  task?: Task;
  error?: string;
}

export interface TaskListResult {
  success: boolean;
  tasks: Task[];
  error?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  context_tags?: string[];
  due_date?: string | null;
  notes?: string;
}

// =============================================================================
// TASK SERVICE
// =============================================================================

export class TaskService {
  /**
   * Add a new task
   */
  static async add(ctx: ServiceContext, input: TaskInput): Promise<TaskResult> {
    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .insert({
        user_id: ctx.userId,
        title: input.title,
        description: input.description || null,
        priority: input.priority || DEFAULTS.TASK_PRIORITY,
        context_tags: input.context_tags || [],
        due_date: input.due_date || null,
        notes: input.notes || null,
        status: TASK_STATUS.TODO,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, task: data };
  }

  /**
   * Get a task by ID
   */
  static async getById(ctx: ServiceContext, taskId: string): Promise<TaskResult> {
    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', ctx.userId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Task not found' };
    }

    return { success: true, task: data };
  }

  /**
   * Update a task
   */
  static async update(
    ctx: ServiceContext,
    taskId: string,
    updates: TaskUpdateInput
  ): Promise<TaskResult> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'done') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.context_tags !== undefined) updateData.context_tags = updates.context_tags;
    if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', ctx.userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, task: data };
  }

  /**
   * Complete a task
   */
  static async complete(ctx: ServiceContext, taskId: string): Promise<TaskResult> {
    return this.update(ctx, taskId, { status: 'done' });
  }

  /**
   * Delete a task
   */
  static async delete(ctx: ServiceContext, taskId: string): Promise<ServiceResult<void>> {
    const { error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', ctx.userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get urgent tasks (high priority, critical, or due soon)
   */
  static async getUrgent(ctx: ServiceContext, limit = 10): Promise<TaskListResult> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .select('*')
      .eq('user_id', ctx.userId)
      .in('status', ['todo', 'in_progress'])
      .or(`priority.eq.critical,priority.eq.high,due_date.lte.${today}`)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) {
      return { success: false, tasks: [], error: error.message };
    }

    return { success: true, tasks: data || [] };
  }

  /**
   * List all tasks with optional filters
   */
  static async list(
    ctx: ServiceContext,
    options: {
      status?: TaskStatus;
      priority?: TaskPriority;
      context_tag?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TaskListResult> {
    const { status, priority, context_tag, limit = 50, offset = 0 } = options;

    let query = ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (context_tag) {
      query = query.contains('context_tags', [context_tag]);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, tasks: [], error: error.message };
    }

    return { success: true, tasks: data || [] };
  }

  /**
   * Get tasks by context tag
   */
  static async getByContextTag(ctx: ServiceContext, tag: string): Promise<TaskListResult> {
    return this.list(ctx, { context_tag: tag });
  }

  /**
   * Archive completed tasks older than specified days
   */
  static async archiveOld(ctx: ServiceContext, olderThanDays = 30): Promise<ServiceResult<number>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('user_id', ctx.userId)
      .eq('status', 'done')
      .lt('completed_at', cutoffDate.toISOString())
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.length || 0 };
  }
}
