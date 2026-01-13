/**
 * Workflow Registry
 *
 * Central registry for all workflow configurations.
 * Each workflow is self-contained with all its steps, branches, and artifacts.
 *
 * DUAL-MODE SUPPORT (InHerSight 0.1.9):
 * - When USE_WORKFLOW_TEMPLATE_SYSTEM=true: Compiles from database templates
 * - When USE_WORKFLOW_TEMPLATE_SYSTEM=false: Uses hardcoded configs below
 *
 * NEW WORKFLOWS: Only add to template system, not here (avoid compounding debt)
 */

import { WorkflowConfig } from '../../config/WorkflowConfig';
import { renewalPlanningWorkflow } from './RenewalPlanning';

// ============================================================================
// LEGACY WORKFLOW REGISTRY (FROZEN - No new workflows)
// ============================================================================
export const workflowRegistry: Record<string, WorkflowConfig> = {
  'renewal-planning': renewalPlanningWorkflow,
  // LEGACY WORKFLOWS ONLY - DO NOT ADD NEW ONES
  // Use template system for all new workflows
};

export type WorkflowId = keyof typeof workflowRegistry;

// ============================================================================
// TEMPLATE MAPPING (NEW)
// ============================================================================
// Maps workflow identifiers to template names for database-driven compilation
export const WORKFLOW_TEMPLATE_MAPPING: Record<string, string> = {
  'renewal-planning': 'renewal_base',
  'renewal-90-day': 'renewal_base',
  'renewal-120-day-at-risk': 'renewal_base', // Will get at-risk mod if risk_score > 60
  'contact-recovery': 'contact_recovery',
  'contact-crisis': 'contact_crisis',
  'contact-onboarding': 'contact_onboarding',
  // Add new mappings as templates are created
};

/**
 * Get a workflow by its ID
 *
 * DUAL-MODE: Checks feature flag to determine source
 * - Template mode: Returns template name for compilation
 * - Legacy mode: Returns hardcoded config
 */
export const getWorkflow = (id: string): WorkflowConfig | undefined => {
  // Feature flag check will be done at call site
  // This function returns legacy config only
  return workflowRegistry[id];
};

/**
 * Get all available workflow IDs
 */
export const getAllWorkflowIds = (): string[] => {
  return Object.keys(workflowRegistry);
};

/**
 * Check if a workflow exists
 */
export const workflowExists = (id: string): boolean => {
  return id in workflowRegistry;
};
