/**
 * Project Member Operations
 *
 * add_project_member, remove_project_member, list_project_members
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../../lib/context.js';
import { DB_SCHEMAS } from '@human-os/core';
import { MEMBER_ROLE } from './constants.js';
import { isProjectOwner } from './utils.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const projectMemberTools: Tool[] = [
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
// HANDLER
// =============================================================================

export async function handleProjectMemberTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
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
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
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
