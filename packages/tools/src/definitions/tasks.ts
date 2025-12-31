/**
 * Task Tools
 *
 * Unified definitions for task management.
 * Single definition → MCP + REST + do()
 */

import { z } from 'zod';
import { defineTool } from '../registry.js';
import { DB_SCHEMAS, TASK_STATUS, DEFAULTS } from '@human-os/core';

// =============================================================================
// ADD TASK
// =============================================================================

export const addTask = defineTool({
  name: 'add_task',
  description: 'Add a new task to your task list',
  platform: 'founder',
  category: 'tasks',

  input: z.object({
    title: z.string().min(1).describe('Task title'),
    description: z.string().optional().describe('Detailed description'),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional().describe('Priority level'),
    context_tags: z.array(z.string()).optional().describe('Context tags (e.g., ["work", "urgent"])'),
    due_date: z.string().optional().describe('Due date (ISO format)'),
    notes: z.string().optional().describe('Additional notes'),
  }),

  handler: async (ctx, input) => {
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
  },

  rest: { method: 'POST', path: '/tasks' },

  alias: {
    pattern: 'add {title} to my tasks',
    priority: 50,
  },
});

// =============================================================================
// GET URGENT TASKS
// =============================================================================

export const getUrgentTasks = defineTool({
  name: 'get_urgent_tasks',
  description: 'Get tasks that are urgent (critical, high priority, or due soon)',
  platform: 'founder',
  category: 'tasks',

  input: z.object({
    limit: z.number().optional().default(10).describe('Maximum tasks to return'),
  }),

  handler: async (ctx, input) => {
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
      .limit(input.limit || 10);

    if (error) {
      return { success: false, tasks: [], error: error.message };
    }

    return { success: true, tasks: data || [] };
  },

  rest: { method: 'GET', path: '/tasks/urgent' },

  alias: {
    pattern: "what's urgent",
    priority: 10,
  },
});

// =============================================================================
// COMPLETE TASK
// =============================================================================

export const completeTask = defineTool({
  name: 'complete_task',
  description: 'Mark a task as complete',
  platform: 'founder',
  category: 'tasks',

  input: z.object({
    task_id: z.string().describe('Task ID to complete'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.task_id)
      .eq('user_id', ctx.userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, task: data };
  },

  rest: { method: 'POST', path: '/tasks/:task_id/complete' },

  alias: {
    pattern: 'complete task {task_id}',
    priority: 50,
  },
});

// =============================================================================
// LIST TASKS
// =============================================================================

export const listTasks = defineTool({
  name: 'list_all_tasks',
  description: 'List all tasks with optional filters',
  platform: 'founder',
  category: 'tasks',

  input: z.object({
    status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'archived']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    context_tag: z.string().optional(),
    limit: z.number().optional().default(50),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('tasks')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(input.limit || 50);

    if (input.status) {
      query = query.eq('status', input.status);
    }
    if (input.priority) {
      query = query.eq('priority', input.priority);
    }
    if (input.context_tag) {
      query = query.contains('context_tags', [input.context_tag]);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, tasks: [], error: error.message };
    }

    return { success: true, tasks: data || [] };
  },

  rest: { method: 'GET', path: '/tasks' },

  alias: {
    pattern: 'show my tasks',
    priority: 50,
  },
});
