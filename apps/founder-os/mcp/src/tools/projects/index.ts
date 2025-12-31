/**
 * Project Management Tools
 *
 * Provides:
 * - Project CRUD: create_project, get_project, list_projects, update_project, close_project
 * - Milestones: add_milestone, update_milestone, list_milestones, complete_milestone
 * - Project Tasks: add_project_task, update_project_task, list_project_tasks, get_project_dashboard
 * - Project Links: link_to_project, unlink_from_project, get_project_links
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../../lib/context.js';

// Import tool definitions
import { projectCrudTools, handleProjectCrudTools } from './project-crud.js';
import { milestoneTools, handleMilestoneTools } from './milestones.js';
import { projectTaskTools, handleProjectTaskTools } from './project-tasks.js';
import { projectLinkTools, handleProjectLinkTools } from './project-links.js';

// Re-export types and utilities
export * from './types.js';
export * from './constants.js';
export * from './utils.js';

// =============================================================================
// COMBINED TOOL DEFINITIONS
// =============================================================================

export const projectTools: Tool[] = [
  ...projectCrudTools,
  ...milestoneTools,
  ...projectTaskTools,
  ...projectLinkTools,
];

// =============================================================================
// COMBINED HANDLER
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
  // Try each handler in order
  let result: unknown | null;

  result = await handleProjectCrudTools(name, args, ctx);
  if (result !== null) return result;

  result = await handleMilestoneTools(name, args, ctx);
  if (result !== null) return result;

  result = await handleProjectTaskTools(name, args, ctx);
  if (result !== null) return result;

  result = await handleProjectLinkTools(name, args, ctx);
  if (result !== null) return result;

  return null; // Not handled by this module
}
