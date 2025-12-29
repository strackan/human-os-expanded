/**
 * Project Task Operations
 *
 * add_project_task, update_project_task, list_project_tasks, get_project_dashboard
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../../lib/context.js';
import { DB_SCHEMAS, TASK_STATUS, DEFAULTS } from '@human-os/core';
import type { AddProjectTaskParams, UpdateProjectTaskParams, ListProjectTasksParams } from './types.js';
import { resolveProjectId } from './utils.js';
import { getProject } from './project-crud.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const projectTaskTools: Tool[] = [
  {
    name: 'add_project_task',
    description: 'Create a task linked to a project and optionally a milestone.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        project_slug: { type: 'string', description: 'Project slug' },
        title: { type: 'string', description: 'Task title' },
        milestone_id: { type: 'string', description: 'Optional milestone UUID' },
        description: { type: 'string', description: 'Task description' },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          default: 'medium',
        },
        due_date: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
        energy_level: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Required energy level',
        },
        context_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Context tags',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_project_task',
    description: 'Update a task, including project and milestone assignment.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        project_id: { type: 'string', description: 'New project UUID (or null to unlink)' },
        milestone_id: { type: 'string', description: 'New milestone UUID (or null to unlink)' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'blocked', 'done', 'archived'],
        },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        due_date: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'list_project_tasks',
    description: 'List tasks for a project, optionally filtered by milestone and status.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        project_slug: { type: 'string', description: 'Project slug' },
        milestone_id: { type: 'string', description: 'Filter by milestone' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'blocked', 'done', 'archived'],
          description: 'Filter by status',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_project_dashboard',
    description: 'Get comprehensive project overview: details, milestones, task counts, overdue tasks, and linked items.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        project_slug: { type: 'string', description: 'Project slug' },
      },
      required: [],
    },
  },
];

// =============================================================================
// HANDLER
// =============================================================================

export async function handleProjectTaskTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'add_project_task':
      return addProjectTask(ctx, {
        project_id: args.project_id as string | undefined,
        project_slug: args.project_slug as string | undefined,
        title: args.title as string,
        milestone_id: args.milestone_id as string | undefined,
        description: args.description as string | undefined,
        priority: args.priority as string | undefined,
        due_date: args.due_date as string | undefined,
        energy_level: args.energy_level as string | undefined,
        context_tags: args.context_tags as string[] | undefined,
      });
    case 'update_project_task':
      return updateProjectTask(ctx, {
        task_id: args.task_id as string,
        project_id: args.project_id as string | null | undefined,
        milestone_id: args.milestone_id as string | null | undefined,
        title: args.title as string | undefined,
        description: args.description as string | undefined,
        status: args.status as string | undefined,
        priority: args.priority as string | undefined,
        due_date: args.due_date as string | undefined,
      });
    case 'list_project_tasks':
      return listProjectTasks(ctx, {
        project_id: args.project_id as string | undefined,
        project_slug: args.project_slug as string | undefined,
        milestone_id: args.milestone_id as string | undefined,
        status: args.status as string | undefined,
      });
    case 'get_project_dashboard':
      return getProjectDashboard(ctx, {
        project_id: args.project_id as string | undefined,
        project_slug: args.project_slug as string | undefined,
      });
    default:
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

async function addProjectTask(ctx: ToolContext, params: AddProjectTaskParams) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.project_slug);

  if (!projectId) {
    return { success: false, error: 'Project not found. Provide project_id or project_slug.' };
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .insert({
      user_id: ctx.userId,
      project_id: projectId,
      milestone_id: params.milestone_id,
      title: params.title,
      description: params.description,
      priority: params.priority || DEFAULTS.TASK_PRIORITY,
      due_date: params.due_date,
      energy_level: params.energy_level,
      context_tags: params.context_tags || [],
      status: TASK_STATUS.TODO,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, task: data };
}

async function updateProjectTask(ctx: ToolContext, params: UpdateProjectTaskParams) {
  const updates: Record<string, unknown> = {};
  if (params.project_id !== undefined) updates.project_id = params.project_id;
  if (params.milestone_id !== undefined) updates.milestone_id = params.milestone_id;
  if (params.title !== undefined) updates.title = params.title;
  if (params.description !== undefined) updates.description = params.description;
  if (params.priority !== undefined) updates.priority = params.priority;
  if (params.due_date !== undefined) updates.due_date = params.due_date;

  if (params.status !== undefined) {
    updates.status = params.status;
    if (params.status === TASK_STATUS.DONE) {
      updates.completed_at = new Date().toISOString();
    }
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .update(updates)
    .eq('id', params.task_id)
    .eq('user_id', ctx.userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, task: data };
}

async function listProjectTasks(ctx: ToolContext, params: ListProjectTasksParams) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.project_slug);

  if (!projectId) {
    return { success: false, error: 'Project not found. Provide project_id or project_slug.' };
  }

  let query = ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('project_id', projectId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (params.milestone_id) {
    query = query.eq('milestone_id', params.milestone_id);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Group by milestone if there are multiple
  const tasksWithMilestones = data || [];
  const grouped: Record<string, typeof tasksWithMilestones> = {};

  for (const task of tasksWithMilestones) {
    const key = task.milestone_id || 'no_milestone';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  }

  return {
    success: true,
    count: tasksWithMilestones.length,
    tasks: tasksWithMilestones,
    grouped_by_milestone: grouped,
  };
}

async function getProjectDashboard(
  ctx: ToolContext,
  params: { project_id?: string; project_slug?: string }
) {
  const projectResult = await getProject(ctx, params);
  if (!projectResult.success) return projectResult;

  const projectId = projectResult.project.id;

  // Get all milestones
  const { data: milestones } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  // Get all tasks
  const { data: tasks } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('project_id', projectId);

  // Find overdue tasks
  const todayStr = new Date().toISOString().split('T')[0]!;
  const overdueTasks = (tasks || []).filter(
    (t) => t.due_date && t.due_date < todayStr && t.status !== TASK_STATUS.DONE && t.status !== TASK_STATUS.ARCHIVED
  );

  // Get project links
  const { data: links } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('project_links')
    .select('*')
    .eq('project_id', projectId);

  return {
    success: true,
    project: projectResult.project,
    milestones: milestones || [],
    milestone_summary: projectResult.milestones,
    task_summary: projectResult.tasks,
    overdue_tasks: overdueTasks,
    links: links || [],
  };
}
