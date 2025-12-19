/**
 * Task management tools
 *
 * Provides:
 * - get_urgent_tasks: Get tasks by urgency level
 * - add_task: Create new task with deadline
 * - complete_task: Mark task complete
 * - list_all_tasks: List all tasks
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { DB_SCHEMAS, TASK_STATUS, TASK_PRIORITY, DEFAULTS } from '@human-os/core';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const taskTools: Tool[] = [
  {
    name: 'get_urgent_tasks',
    description: 'Get tasks that need attention, ordered by urgency. Returns overdue, critical (due today), urgent (due in 1-2 days), and upcoming tasks. Call this at session start to check for tasks needing immediate attention.',
    inputSchema: {
      type: 'object',
      properties: {
        include_upcoming: {
          type: 'boolean',
          description: 'Include tasks due in 3-7 days',
          default: true,
        },
      },
      required: [],
    },
  },
  {
    name: 'add_task',
    description: 'Add a new task with a due date.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'What needs to be done' },
        due_date: { type: 'string', description: "When it's due (YYYY-MM-DD format)" },
        priority: {
          type: 'string',
          description: 'Task priority level',
          enum: ['critical', 'high', 'medium', 'low'],
          default: 'medium',
        },
        description: { type: 'string', description: 'Optional details' },
        context_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Context tags (e.g., "renubu", "personal", "good-hang")',
        },
      },
      required: ['title', 'due_date'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The UUID of the task to complete' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'list_all_tasks',
    description: 'List all tasks with a given status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['todo', 'in_progress', 'blocked', 'done', 'archived'],
          default: 'todo',
        },
      },
      required: [],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle task tool calls
 * Returns result if handled, null if not a task tool
 */
export async function handleTaskTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'get_urgent_tasks': {
      const { include_upcoming } = args as { include_upcoming?: boolean };
      return getUrgentTasks(ctx, include_upcoming ?? true);
    }

    case 'add_task': {
      const params = args as {
        title: string;
        due_date: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        description?: string;
        context_tags?: string[];
      };
      return addTask(ctx, params);
    }

    case 'complete_task': {
      const { task_id } = args as { task_id: string };
      return completeTask(ctx, task_id);
    }

    case 'list_all_tasks': {
      const { status } = args as { status?: string };
      return listAllTasks(ctx, status ?? TASK_STATUS.TODO);
    }

    default:
      return null; // Not handled by this module
  }
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

interface TaskFromDB {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  status: string;
  context_tags?: string[];
}

interface TaskWithUrgency {
  id: string;
  title: string;
  due_date?: string;
  priority: string;
  days_until_due?: number;
  urgency: 'overdue' | 'critical' | 'urgent' | 'upcoming' | 'normal';
  message?: string;
}

interface TaskSummary {
  overdue: TaskWithUrgency[];
  critical: TaskWithUrgency[];
  urgent: TaskWithUrgency[];
  upcoming: TaskWithUrgency[];
}

/**
 * Calculate urgency based on due date
 */
function calculateUrgency(dueDate: string | null | undefined): {
  urgency: 'overdue' | 'critical' | 'urgent' | 'upcoming' | 'normal';
  daysUntilDue: number | undefined;
} {
  if (!dueDate) {
    return { urgency: 'normal', daysUntilDue: undefined };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return { urgency: 'overdue', daysUntilDue };
  } else if (daysUntilDue === 0) {
    return { urgency: 'critical', daysUntilDue };
  } else if (daysUntilDue <= 2) {
    return { urgency: 'urgent', daysUntilDue };
  } else if (daysUntilDue <= 7) {
    return { urgency: 'upcoming', daysUntilDue };
  }
  return { urgency: 'normal', daysUntilDue };
}

/**
 * Generate urgency message for a task
 */
function getUrgencyMessage(title: string, urgency: string, daysUntilDue?: number): string | undefined {
  switch (urgency) {
    case 'overdue':
      return `${title} was due ${Math.abs(daysUntilDue || 0)} day(s) ago`;
    case 'critical':
      return `${title} is due TODAY`;
    case 'urgent':
      return `${title} is due in ${daysUntilDue} day(s)`;
    case 'upcoming':
      return `${title} is coming up (due in ${daysUntilDue} days)`;
    default:
      return undefined;
  }
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Get tasks that need attention, ordered by urgency.
 */
async function getUrgentTasks(
  ctx: ToolContext,
  includeUpcoming: boolean = true
): Promise<{
  attention_needed: string[];
  tasks: TaskSummary;
  total_requiring_attention: number;
}> {
  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .select('id, title, description, due_date, priority, status, context_tags')
    .eq('user_id', ctx.userId)
    .in('status', [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.BLOCKED])
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to get urgent tasks: ${error.message}`);
  }

  const tasks: TaskFromDB[] = data || [];

  const summary: TaskSummary = {
    overdue: [],
    critical: [],
    urgent: [],
    upcoming: [],
  };

  for (const t of tasks) {
    const { urgency, daysUntilDue } = calculateUrgency(t.due_date);

    if (urgency === 'normal') continue;
    if (urgency === 'upcoming' && !includeUpcoming) continue;

    const taskWithUrgency: TaskWithUrgency = {
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      priority: t.priority,
      days_until_due: daysUntilDue,
      urgency,
      message: getUrgencyMessage(t.title, urgency, daysUntilDue),
    };

    summary[urgency].push(taskWithUrgency);
  }

  const attention_needed: string[] = [];
  if (summary.overdue.length > 0) {
    attention_needed.push(`${summary.overdue.length} OVERDUE task(s)`);
  }
  if (summary.critical.length > 0) {
    attention_needed.push(`${summary.critical.length} task(s) due TODAY`);
  }
  if (summary.urgent.length > 0) {
    attention_needed.push(`${summary.urgent.length} urgent task(s) due soon`);
  }

  const totalCount =
    summary.overdue.length +
    summary.critical.length +
    summary.urgent.length +
    (includeUpcoming ? summary.upcoming.length : 0);

  return {
    attention_needed,
    tasks: summary,
    total_requiring_attention: totalCount,
  };
}

/**
 * Add a new task with a due date.
 */
async function addTask(
  ctx: ToolContext,
  params: {
    title: string;
    due_date: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    description?: string;
    context_tags?: string[];
  }
): Promise<{
  success: boolean;
  task_id?: string;
  title: string;
  due_date: string;
  priority: string;
  message: string;
  error?: string;
}> {
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.due_date)) {
    return {
      success: false,
      title: params.title,
      due_date: params.due_date,
      priority: params.priority || DEFAULTS.TASK_PRIORITY,
      message: '',
      error: `Invalid date format: ${params.due_date}. Use YYYY-MM-DD.`,
    };
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .insert({
      user_id: ctx.userId,
      title: params.title,
      description: params.description,
      due_date: params.due_date,
      priority: params.priority || DEFAULTS.TASK_PRIORITY,
      context_tags: params.context_tags || [],
      status: TASK_STATUS.TODO,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      title: params.title,
      due_date: params.due_date,
      priority: params.priority || DEFAULTS.TASK_PRIORITY,
      message: '',
      error: error.message,
    };
  }

  return {
    success: true,
    task_id: data?.id,
    title: params.title,
    due_date: params.due_date,
    priority: data?.priority || DEFAULTS.TASK_PRIORITY,
    message: `Task '${params.title}' added with due date ${params.due_date}.`,
  };
}

/**
 * Mark a task as completed.
 */
async function completeTask(
  ctx: ToolContext,
  taskId: string
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .update({
      status: TASK_STATUS.DONE,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', ctx.userId)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: '',
      error: error.message,
    };
  }

  if (!data) {
    return {
      success: false,
      message: '',
      error: 'Task not found',
    };
  }

  return {
    success: true,
    message: `Task '${data.title}' marked complete!`,
  };
}

/**
 * List all tasks with a given status.
 */
async function listAllTasks(
  ctx: ToolContext,
  status: string = TASK_STATUS.TODO
): Promise<{
  status_filter: string;
  count: number;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    priority: string;
    status: string;
    context_tags?: string[];
    created_at: string;
  }>;
}> {
  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .select('id, title, description, due_date, priority, status, context_tags, created_at')
    .eq('user_id', ctx.userId)
    .eq('status', status)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to list tasks: ${error.message}`);
  }

  const tasks = data || [];

  return {
    status_filter: status,
    count: tasks.length,
    tasks,
  };
}
