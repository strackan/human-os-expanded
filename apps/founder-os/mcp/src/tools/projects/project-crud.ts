/**
 * Project CRUD Operations
 *
 * create_project, get_project, list_projects, update_project, close_project
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../../lib/context.js';
import { DB_SCHEMAS, TASK_STATUS } from '@human-os/core';
import { PROJECT_STATUS, PROJECT_PRIORITY, MILESTONE_STATUS } from './constants.js';
import type { CreateProjectParams, UpdateProjectParams } from './types.js';
import { generateSlug, resolveProjectId } from './utils.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const projectCrudTools: Tool[] = [
  {
    name: 'create_project',
    description: 'Create a new project with optional metadata. Auto-generates slug from name if not provided.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        slug: { type: 'string', description: 'URL-friendly identifier (auto-generated if omitted)' },
        description: { type: 'string', description: 'Project description' },
        status: {
          type: 'string',
          enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
          default: 'active',
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          default: 'medium',
        },
        start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        target_end_date: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
        readme_markdown: { type: 'string', description: 'Rich project documentation in markdown' },
        github_repo_url: { type: 'string', description: 'GitHub repository URL' },
        claude_project_folder: { type: 'string', description: 'Path to Claude project folder' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_project',
    description: 'Get a project by ID or slug with milestone counts and task stats.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        slug: { type: 'string', description: 'Project slug' },
      },
      required: [],
    },
  },
  {
    name: 'list_projects',
    description: 'List all projects with optional status and priority filters.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
          description: 'Filter by status',
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Filter by priority',
        },
      },
      required: [],
    },
  },
  {
    name: 'update_project',
    description: 'Update a project by ID or slug.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        slug: { type: 'string', description: 'Project slug (for lookup)' },
        name: { type: 'string', description: 'New project name' },
        new_slug: { type: 'string', description: 'New slug' },
        description: { type: 'string', description: 'New description' },
        status: {
          type: 'string',
          enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
        },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        target_end_date: { type: 'string', description: 'Target end date (YYYY-MM-DD)' },
        readme_markdown: { type: 'string', description: 'Updated readme' },
        github_repo_url: { type: 'string', description: 'GitHub repo URL' },
        claude_project_folder: { type: 'string', description: 'Claude project folder path' },
      },
      required: [],
    },
  },
  {
    name: 'close_project',
    description: 'Close a project by setting status to completed or cancelled. Sets actual_end_date and warns about open items.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        slug: { type: 'string', description: 'Project slug' },
        status: {
          type: 'string',
          enum: ['completed', 'cancelled'],
          description: 'Final status',
        },
      },
      required: ['status'],
    },
  },
];

// =============================================================================
// HANDLER
// =============================================================================

export async function handleProjectCrudTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'create_project': {
      const { name: projectName, slug, description, status, priority, start_date, target_end_date, readme_markdown, github_repo_url, claude_project_folder } = args;
      return createProject(ctx, {
        name: projectName as string,
        slug: slug as string | undefined,
        description: description as string | undefined,
        status: status as string | undefined,
        priority: priority as string | undefined,
        start_date: start_date as string | undefined,
        target_end_date: target_end_date as string | undefined,
        readme_markdown: readme_markdown as string | undefined,
        github_repo_url: github_repo_url as string | undefined,
        claude_project_folder: claude_project_folder as string | undefined,
      });
    }
    case 'get_project':
      return getProject(ctx, {
        project_id: args.project_id as string | undefined,
        slug: args.slug as string | undefined,
      });
    case 'list_projects':
      return listProjects(ctx, {
        status: args.status as string | undefined,
        priority: args.priority as string | undefined,
      });
    case 'update_project': {
      const { project_id, slug, name: projectName, new_slug, description, status, priority, start_date, target_end_date, readme_markdown, github_repo_url, claude_project_folder } = args;
      return updateProject(ctx, {
        project_id: project_id as string | undefined,
        slug: slug as string | undefined,
        name: projectName as string | undefined,
        new_slug: new_slug as string | undefined,
        description: description as string | undefined,
        status: status as string | undefined,
        priority: priority as string | undefined,
        start_date: start_date as string | undefined,
        target_end_date: target_end_date as string | undefined,
        readme_markdown: readme_markdown as string | undefined,
        github_repo_url: github_repo_url as string | undefined,
        claude_project_folder: claude_project_folder as string | undefined,
      });
    }
    case 'close_project':
      return closeProject(ctx, {
        project_id: args.project_id as string | undefined,
        slug: args.slug as string | undefined,
        status: args.status as string,
      });
    default:
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

async function createProject(ctx: ToolContext, params: CreateProjectParams) {
  const slug = params.slug || generateSlug(params.name);

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('projects')
    .insert({
      user_id: ctx.userId,
      name: params.name,
      slug,
      description: params.description,
      status: params.status || PROJECT_STATUS.ACTIVE,
      priority: params.priority || PROJECT_PRIORITY.MEDIUM,
      start_date: params.start_date,
      target_end_date: params.target_end_date,
      readme_markdown: params.readme_markdown,
      github_repo_url: params.github_repo_url,
      claude_project_folder: params.claude_project_folder,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    project: data,
    message: `Project '${params.name}' created with slug '${slug}'.`,
  };
}

export async function getProject(ctx: ToolContext, params: { project_id?: string; slug?: string }) {
  const { project_id, slug } = params;

  if (!project_id && !slug) {
    return { success: false, error: 'Either project_id or slug is required' };
  }

  let query = ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('projects')
    .select('*')
    .eq('user_id', ctx.userId);

  if (project_id) {
    query = query.eq('id', project_id);
  } else if (slug) {
    query = query.eq('slug', slug);
  }

  const { data: project, error } = await query.single();

  if (error || !project) {
    return { success: false, error: error?.message || 'Project not found' };
  }

  // Get milestone counts
  const { data: milestones } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('milestones')
    .select('status')
    .eq('project_id', project.id);

  const milestoneCounts = {
    total: milestones?.length || 0,
    not_started: milestones?.filter((m) => m.status === MILESTONE_STATUS.NOT_STARTED).length || 0,
    in_progress: milestones?.filter((m) => m.status === MILESTONE_STATUS.IN_PROGRESS).length || 0,
    completed: milestones?.filter((m) => m.status === MILESTONE_STATUS.COMPLETED).length || 0,
    blocked: milestones?.filter((m) => m.status === MILESTONE_STATUS.BLOCKED).length || 0,
  };

  // Get task counts
  const { data: tasks } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .select('status')
    .eq('user_id', ctx.userId)
    .eq('project_id', project.id);

  const taskCounts = {
    total: tasks?.length || 0,
    todo: tasks?.filter((t) => t.status === TASK_STATUS.TODO).length || 0,
    in_progress: tasks?.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length || 0,
    blocked: tasks?.filter((t) => t.status === TASK_STATUS.BLOCKED).length || 0,
    done: tasks?.filter((t) => t.status === TASK_STATUS.DONE).length || 0,
  };

  return {
    success: true,
    project,
    milestones: milestoneCounts,
    tasks: taskCounts,
  };
}

async function listProjects(ctx: ToolContext, params: { status?: string; priority?: string }) {
  let query = ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('projects')
    .select('id, name, slug, description, status, priority, start_date, target_end_date, created_at')
    .eq('user_id', ctx.userId)
    .order('priority', { ascending: true })
    .order('name', { ascending: true });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.priority) {
    query = query.eq('priority', params.priority);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    count: data?.length || 0,
    projects: data || [],
  };
}

async function updateProject(ctx: ToolContext, params: UpdateProjectParams) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.slug);

  if (!projectId) {
    return { success: false, error: 'Project not found' };
  }

  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.new_slug !== undefined) updates.slug = params.new_slug;
  if (params.description !== undefined) updates.description = params.description;
  if (params.status !== undefined) updates.status = params.status;
  if (params.priority !== undefined) updates.priority = params.priority;
  if (params.start_date !== undefined) updates.start_date = params.start_date;
  if (params.target_end_date !== undefined) updates.target_end_date = params.target_end_date;
  if (params.readme_markdown !== undefined) updates.readme_markdown = params.readme_markdown;
  if (params.github_repo_url !== undefined) updates.github_repo_url = params.github_repo_url;
  if (params.claude_project_folder !== undefined) updates.claude_project_folder = params.claude_project_folder;

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('user_id', ctx.userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, project: data };
}

async function closeProject(
  ctx: ToolContext,
  params: { project_id?: string; slug?: string; status: string }
) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.slug);

  if (!projectId) {
    return { success: false, error: 'Project not found' };
  }

  // Check for open milestones
  const { data: openMilestones } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('milestones')
    .select('id, name, status')
    .eq('project_id', projectId)
    .neq('status', MILESTONE_STATUS.COMPLETED);

  // Check for open tasks
  const { data: openTasks } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('tasks')
    .select('id, title, status')
    .eq('project_id', projectId)
    .eq('user_id', ctx.userId)
    .not('status', 'in', `(${TASK_STATUS.DONE},${TASK_STATUS.ARCHIVED})`);

  const warnings: string[] = [];
  if (openMilestones && openMilestones.length > 0) {
    warnings.push(`${openMilestones.length} open milestone(s)`);
  }
  if (openTasks && openTasks.length > 0) {
    warnings.push(`${openTasks.length} open task(s)`);
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('projects')
    .update({
      status: params.status,
      actual_end_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', projectId)
    .eq('user_id', ctx.userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    project: data,
    warnings: warnings.length > 0 ? warnings : undefined,
    message: `Project closed as '${params.status}'.${warnings.length > 0 ? ` Warning: ${warnings.join(', ')}` : ''}`,
  };
}
