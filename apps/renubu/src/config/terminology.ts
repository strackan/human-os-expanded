/**
 * Global Terminology Configuration
 *
 * Centralized location for customer-facing terminology.
 * Change these constants to rebrand the entire application.
 */

export const TERMINOLOGY = {
  // Workflow terminology
  WORKFLOW_SINGULAR: 'Play',
  WORKFLOW_PLURAL: 'Plays',
  WORKFLOW_SINGULAR_LOWER: 'play',
  WORKFLOW_PLURAL_LOWER: 'plays',

  // Related terms
  TASK_MODE: 'Play Mode',
  TASK_MODE_LOWER: 'play mode',
} as const;

/**
 * Helper function to get workflow term with proper capitalization
 */
export function getWorkflowTerm(count: number = 1, capitalize: boolean = true): string {
  const term = count === 1 ? TERMINOLOGY.WORKFLOW_SINGULAR : TERMINOLOGY.WORKFLOW_PLURAL;
  return capitalize ? term : term.toLowerCase();
}
