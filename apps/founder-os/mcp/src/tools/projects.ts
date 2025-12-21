/**
 * Project management tools
 *
 * Provides:
 * - Project CRUD: create_project, get_project, list_projects, update_project, close_project
 * - Milestones: add_milestone, update_milestone, list_milestones, complete_milestone
 * - Project Tasks: add_project_task, update_project_task, list_project_tasks, get_project_dashboard
 * - Project Links: link_to_project, unlink_from_project, get_project_links
 * - Project Members: add_project_member, remove_project_member, list_project_members
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { DB_SCHEMAS, TASK_STATUS, TASK_PRIORITY, DEFAULTS } from '@human-os/core';

// =============================================================================
// CONSTANTS
// =============================================================================

const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

const PROJECT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

const MILESTONE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
} as const;

const MEMBER_ROLE = {
  OWNER: 'owner',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
} as const;

const LINK_TYPE = {
  CONTACT: 'contact',
  COMPANY: 'company',
  GOAL: 'goal',
  ENTITY: 'entity',
} as const;

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const projectTools: Tool[] = [
  // ---------------------------------------------------------------------------
  // Project CRUD
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Milestones
  // ---------------------------------------------------------------------------
  {
    name: 'add_milestone',
    description: 'Add a milestone to a project.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        project_slug: { type: 'string', description: 'Project slug' },
        name: { type: 'string', description: 'Milestone name' },
        description: { type: 'string', description: 'Milestone description' },
        target_date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
        order_index: { type: 'number', description: 'Display order (default: auto-increment)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_milestone',
    description: 'Update a milestone. Auto-sets completed_date when status is set to completed.',
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'string', description: 'Milestone UUID' },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' },
        status: {
          type: 'string',
          enum: ['not_started', 'in_progress', 'completed', 'blocked'],
        },
        target_date: { type: 'string', description: 'Target date (YYYY-MM-DD)' },
        order_index: { type: 'number', description: 'New display order' },
      },
      required: ['milestone_id'],
    },
  },
  {
    name: 'list_milestones',
    description: 'List milestones for a project, ordered by order_index.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        project_slug: { type: 'string', description: 'Project slug' },
        status: {
          type: 'string',
          enum: ['not_started', 'in_progress', 'completed', 'blocked'],
          description: 'Filter by status',
        },
      },
      required: [],
    },
  },
  {
    name: 'complete_milestone',
    description: 'Mark a milestone as completed with current timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'string', description: 'Milestone UUID' },
      },
      required: ['milestone_id'],
    },
  },

  // ---------------------------------------------------------------------------
  // Project Tasks
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Project Links
  // ---------------------------------------------------------------------------
  {
    name: 'link_to_project',
    description: 'Link a contact, company, goal, or entity to a project.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        project_slug: { type: 'string', description: 'Project slug' },
        linked_type: {
          type: 'string',
          enum: ['contact', 'company', 'goal', 'entity'],
          description: 'Type of linked item',
        },
        linked_id: { type: 'string', description: 'UUID of the linked item' },
        relationship: {
          type: 'string',
          description: 'Nature of the link (e.g., design_partner, investor, advisor)',
        },
      },
      required: ['linked_type', 'linked_id'],
    },
  },
  {
    name: 'unlink_from_project',
    description: 'Remove a link from a project.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        project_slug: { type: 'string', description: 'Project slug' },
        linked_type: {
          type: 'string',
          enum: ['contact', 'company', 'goal', 'entity'],
        },
        linked_id: { type: 'string', description: 'UUID of the linked item' },
      },
      required: ['linked_type', 'linked_id'],
    },
  },
  {
    name: 'get_project_links',
    description: 'Get all links for a project with resolved names.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        project_slug: { type: 'string', description: 'Project slug' },
        linked_type: {
          type: 'string',
          enum: ['contact', 'company', 'goal', 'entity'],
          description: 'Filter by type',
        },
      },
      required: [],
    },
  },

  // ---------------------------------------------------------------------------
  // Project Members
  // ---------------------------------------------------------------------------
  {
    name: 'add_project_member',
    description: 'Add a member to a project. Only the project owner can add members.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        user_id: { type: 'string', description: 'User UUID to add' },
        role: {
          type: 'string',
          enum: ['contributor', 'viewer'],
          default: 'contributor',
        },
      },
      required: ['project_id', 'user_id'],
    },
  },
  {
    name: 'remove_project_member',
    description: 'Remove a member from a project. Only the project owner can remove members.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
        user_id: { type: 'string', description: 'User UUID to remove' },
      },
      required: ['project_id', 'user_id'],
    },
  },
  {
    name: 'list_project_members',
    description: 'List all members of a project with their roles.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project UUID' },
      },
      required: ['project_id'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle project tool calls
 * Returns result if handled, null if not a project tool
 */
export async function handleProjectTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    // Project CRUD
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

    // Milestones
    case 'add_milestone':
      return addMilestone(ctx, {
        project_id: args.project_id as string | undefined,
        project_slug: args.project_slug as string | undefined,
        name: args.name as string,
        description: args.description as string | undefined,
        target_date: args.target_date as string | undefined,
        order_index: args.order_index as number | undefined,
      });
    case 'update_milestone':
      return updateMilestone(ctx, {
        milestone_id: args.milestone_id as string,
        name: args.name as string | undefined,
        description: args.description as string | undefined,
        status: args.status as string | undefined,
        target_date: args.target_date as string | undefined,
        order_index: args.order_index as number | undefined,
      });
    case 'list_milestones':
      return listMilestones(ctx, {
        project_id: args.project_id as string | undefined,
        project_slug: args.project_slug as string | undefined,
        status: args.status as string | undefined,
      });
    case 'complete_milestone':
      return completeMilestone(ctx, { milestone_id: args.milestone_id as string });

    // Project Tasks
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

    // Project Links
    case 'link_to_project':
      return linkToProject(ctx, {
        project_id: args.project_id as string | undefined,
        project_slug: args.project_slug as string | undefined,
        linked_type: args.linked_type as string,
        linked_id: args.linked_id as string,
        relationship: args.relationship as string | undefined,
      });
    case 'unlink_from_project':
      return unlinkFromProject(ctx, {
        project_id: args.project_id as string | undefined,
        project_slug: args.project_slug as string | undefined,
        linked_type: args.linked_type as string,
        linked_id: args.linked_id as string,
      });
    case 'get_project_links':
      return getProjectLinks(ctx, {
        project_id: args.project_id as string | undefined,
        project_slug: args.project_slug as string | undefined,
        linked_type: args.linked_type as string | undefined,
      });

    // Project Members
    case 'add_project_member':
      return addProjectMember(ctx, {
        project_id: args.project_id as string,
        user_id: args.user_id as string,
        role: args.role as string | undefined,
      });
    case 'remove_project_member':
      return removeProjectMember(ctx, {
        project_id: args.project_id as string,
        user_id: args.user_id as string,
      });
    case 'list_project_members':
      return listProjectMembers(ctx, { project_id: args.project_id as string });

    default:
      return null; // Not handled by this module
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface CreateProjectParams {
  name: string;
  slug?: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  target_end_date?: string;
  readme_markdown?: string;
  github_repo_url?: string;
  claude_project_folder?: string;
}

interface UpdateProjectParams {
  project_id?: string;
  slug?: string;
  name?: string;
  new_slug?: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  target_end_date?: string;
  readme_markdown?: string;
  github_repo_url?: string;
  claude_project_folder?: string;
}

interface AddMilestoneParams {
  project_id?: string;
  project_slug?: string;
  name: string;
  description?: string;
  target_date?: string;
  order_index?: number;
}

interface UpdateMilestoneParams {
  milestone_id: string;
  name?: string;
  description?: string;
  status?: string;
  target_date?: string;
  order_index?: number;
}

interface AddProjectTaskParams {
  project_id?: string;
  project_slug?: string;
  title: string;
  milestone_id?: string;
  description?: string;
  priority?: string;
  due_date?: string;
  energy_level?: string;
  context_tags?: string[];
}

interface UpdateProjectTaskParams {
  task_id: string;
  project_id?: string | null;
  milestone_id?: string | null;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
}

interface ListProjectTasksParams {
  project_id?: string;
  project_slug?: string;
  milestone_id?: string;
  status?: string;
}

interface LinkToProjectParams {
  project_id?: string;
  project_slug?: string;
  linked_type: string;
  linked_id: string;
  relationship?: string;
}

interface UnlinkFromProjectParams {
  project_id?: string;
  project_slug?: string;
  linked_type: string;
  linked_id: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Resolve a project by ID or slug
 */
async function resolveProjectId(
  ctx: ToolContext,
  projectId?: string,
  projectSlug?: string
): Promise<string | null> {
  if (projectId) return projectId;

  if (projectSlug) {
    const { data, error } = await ctx
      .getClient()
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('projects')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('slug', projectSlug)
      .single();

    if (error || !data) return null;
    return data.id;
  }

  return null;
}

/**
 * Check if user is project owner
 */
async function isProjectOwner(ctx: ToolContext, projectId: string): Promise<boolean> {
  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', ctx.userId)
    .single();

  return !error && !!data;
}

// =============================================================================
// PROJECT CRUD IMPLEMENTATIONS
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

async function getProject(ctx: ToolContext, params: { project_id?: string; slug?: string }) {
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

// =============================================================================
// MILESTONE IMPLEMENTATIONS
// =============================================================================

async function addMilestone(ctx: ToolContext, params: AddMilestoneParams) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.project_slug);

  if (!projectId) {
    return { success: false, error: 'Project not found. Provide project_id or project_slug.' };
  }

  // Get max order_index if not provided
  let orderIndex = params.order_index;
  if (orderIndex === undefined) {
    const { data: maxOrder } = await ctx
      .getClient()
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('milestones')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    orderIndex = (maxOrder?.order_index || 0) + 1;
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('milestones')
    .insert({
      project_id: projectId,
      name: params.name,
      description: params.description,
      target_date: params.target_date,
      order_index: orderIndex,
      status: MILESTONE_STATUS.NOT_STARTED,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, milestone: data };
}

async function updateMilestone(ctx: ToolContext, params: UpdateMilestoneParams) {
  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;
  if (params.target_date !== undefined) updates.target_date = params.target_date;
  if (params.order_index !== undefined) updates.order_index = params.order_index;

  if (params.status !== undefined) {
    updates.status = params.status;
    if (params.status === MILESTONE_STATUS.COMPLETED) {
      updates.completed_date = new Date().toISOString().split('T')[0];
    }
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  // Verify the milestone belongs to a project owned by the user
  const { data: milestone, error: fetchError } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('milestones')
    .select('id, project_id')
    .eq('id', params.milestone_id)
    .single();

  if (fetchError || !milestone) {
    return { success: false, error: 'Milestone not found' };
  }

  const isOwner = await isProjectOwner(ctx, milestone.project_id);
  if (!isOwner) {
    return { success: false, error: 'Not authorized to update this milestone' };
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('milestones')
    .update(updates)
    .eq('id', params.milestone_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, milestone: data };
}

async function listMilestones(
  ctx: ToolContext,
  params: { project_id?: string; project_slug?: string; status?: string }
) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.project_slug);

  if (!projectId) {
    return { success: false, error: 'Project not found. Provide project_id or project_slug.' };
  }

  let query = ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: data?.length || 0, milestones: data || [] };
}

async function completeMilestone(ctx: ToolContext, params: { milestone_id: string }) {
  return updateMilestone(ctx, {
    milestone_id: params.milestone_id,
    status: MILESTONE_STATUS.COMPLETED,
  });
}

// =============================================================================
// PROJECT TASK IMPLEMENTATIONS
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

// =============================================================================
// PROJECT LINK IMPLEMENTATIONS
// =============================================================================

async function linkToProject(ctx: ToolContext, params: LinkToProjectParams) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.project_slug);

  if (!projectId) {
    return { success: false, error: 'Project not found. Provide project_id or project_slug.' };
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('project_links')
    .insert({
      project_id: projectId,
      linked_type: params.linked_type,
      linked_id: params.linked_id,
      relationship: params.relationship,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Link already exists' };
    }
    return { success: false, error: error.message };
  }

  return { success: true, link: data };
}

async function unlinkFromProject(ctx: ToolContext, params: UnlinkFromProjectParams) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.project_slug);

  if (!projectId) {
    return { success: false, error: 'Project not found. Provide project_id or project_slug.' };
  }

  const { error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('project_links')
    .delete()
    .eq('project_id', projectId)
    .eq('linked_type', params.linked_type)
    .eq('linked_id', params.linked_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Link removed' };
}

async function getProjectLinks(
  ctx: ToolContext,
  params: { project_id?: string; project_slug?: string; linked_type?: string }
) {
  const projectId = await resolveProjectId(ctx, params.project_id, params.project_slug);

  if (!projectId) {
    return { success: false, error: 'Project not found. Provide project_id or project_slug.' };
  }

  let query = ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('project_links')
    .select('*')
    .eq('project_id', projectId);

  if (params.linked_type) {
    query = query.eq('linked_type', params.linked_type);
  }

  const { data: links, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Resolve names for each link type
  const enrichedLinks = await Promise.all(
    (links || []).map(async (link) => {
      let name: string | null = null;

      if (link.linked_type === LINK_TYPE.ENTITY) {
        const { data: entity } = await ctx
          .getClient()
          .from('entities')
          .select('name')
          .eq('id', link.linked_id)
          .single();
        name = entity?.name || null;
      } else if (link.linked_type === LINK_TYPE.GOAL) {
        const { data: goal } = await ctx
          .getClient()
          .schema(DB_SCHEMAS.FOUNDER_OS)
          .from('goals')
          .select('title')
          .eq('id', link.linked_id)
          .single();
        name = goal?.title || null;
      }
      // For contact/company, they are likely in entities table too

      return { ...link, resolved_name: name };
    })
  );

  return { success: true, count: enrichedLinks.length, links: enrichedLinks };
}

// =============================================================================
// PROJECT MEMBER IMPLEMENTATIONS
// =============================================================================

async function addProjectMember(
  ctx: ToolContext,
  params: { project_id: string; user_id: string; role?: string }
) {
  const isOwner = await isProjectOwner(ctx, params.project_id);
  if (!isOwner) {
    return { success: false, error: 'Only the project owner can add members' };
  }

  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('project_members')
    .insert({
      project_id: params.project_id,
      user_id: params.user_id,
      role: params.role || MEMBER_ROLE.CONTRIBUTOR,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'User is already a member of this project' };
    }
    return { success: false, error: error.message };
  }

  return { success: true, member: data };
}

async function removeProjectMember(
  ctx: ToolContext,
  params: { project_id: string; user_id: string }
) {
  const isOwner = await isProjectOwner(ctx, params.project_id);
  if (!isOwner) {
    return { success: false, error: 'Only the project owner can remove members' };
  }

  const { error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('project_members')
    .delete()
    .eq('project_id', params.project_id)
    .eq('user_id', params.user_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Member removed' };
}

async function listProjectMembers(ctx: ToolContext, params: { project_id: string }) {
  const { data, error } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('project_members')
    .select('*')
    .eq('project_id', params.project_id)
    .order('joined_at', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  // Get the project owner
  const { data: project } = await ctx
    .getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('projects')
    .select('user_id')
    .eq('id', params.project_id)
    .single();

  const members = [
    { user_id: project?.user_id, role: MEMBER_ROLE.OWNER, joined_at: null, is_owner: true },
    ...(data || []).map((m) => ({ ...m, is_owner: false })),
  ];

  return { success: true, count: members.length, members };
}
