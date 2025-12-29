/**
 * Project Utilities
 */

import type { ToolContext } from '../../lib/context.js';
import { DB_SCHEMAS } from '@human-os/core';

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Resolve a project by ID or slug
 */
export async function resolveProjectId(
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
export async function isProjectOwner(ctx: ToolContext, projectId: string): Promise<boolean> {
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
