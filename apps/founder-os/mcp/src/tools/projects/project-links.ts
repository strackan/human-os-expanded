/**
 * Project Link Operations
 *
 * link_to_project, unlink_from_project, get_project_links
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../../lib/context.js';
import { DB_SCHEMAS } from '@human-os/core';
import { LINK_TYPE } from './constants.js';
import type { LinkToProjectParams, UnlinkFromProjectParams } from './types.js';
import { resolveProjectId } from './utils.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const projectLinkTools: Tool[] = [
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
];

// =============================================================================
// HANDLER
// =============================================================================

export async function handleProjectLinkTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
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
    default:
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
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
          .from('okr_goals')
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
