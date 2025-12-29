/**
 * Milestone Operations
 *
 * add_milestone, update_milestone, list_milestones, complete_milestone
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../../lib/context.js';
import { DB_SCHEMAS } from '@human-os/core';
import { MILESTONE_STATUS } from './constants.js';
import type { AddMilestoneParams, UpdateMilestoneParams } from './types.js';
import { resolveProjectId, isProjectOwner } from './utils.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const milestoneTools: Tool[] = [
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
];

// =============================================================================
// HANDLER
// =============================================================================

export async function handleMilestoneTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
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
    default:
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
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
