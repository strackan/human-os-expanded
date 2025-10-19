/**
 * Workflow Config Registry
 *
 * Phase 2D: Configuration Consolidation
 *
 * Central registry for all workflow configurations.
 * Maps workflow IDs to their declarative config files.
 */

import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { strategicPlanningWorkflowConfig } from './strategicPlanningWorkflow.config';
import { expansionWorkflowConfig } from './expansionWorkflow.config';
import { executiveEngagementWorkflowConfig } from './executiveEngagementWorkflow.config';
import { obsidianBlackPricingConfig } from './obsidianBlackPricing.config';
import { obsidianBlackCallDebriefConfig } from './obsidianBlackCallDebrief.config';

// ============================================================================
// Workflow ID Mapping
// ============================================================================

/**
 * Maps workflow IDs (from database workflow_definitions) to their config files
 *
 * These IDs should match:
 * - workflow_definitions.trigger_conditions.workflow_id in the database
 * - workflowId prop passed to TaskModeFullscreen
 */
const WORKFLOW_REGISTRY: Record<string, WorkflowConfig> = {
  // Demo workflows (from database seeding)
  'obsblk-strategic-planning': strategicPlanningWorkflowConfig,
  'obsblk-expansion': expansionWorkflowConfig,
  'obsblk-expansion-opportunity': expansionWorkflowConfig,
  'obsblk-executive-engagement': executiveEngagementWorkflowConfig,

  // Obsidian Black demo workflows (1-minute product demo)
  'obsidian-black-pricing': obsidianBlackPricingConfig,
  'obsidian-black-call-debrief': obsidianBlackCallDebriefConfig,

  // Alias mappings for backwards compatibility
  'strategic-planning': strategicPlanningWorkflowConfig,
  'expansion-opportunity': expansionWorkflowConfig,
  'executive-engagement': executiveEngagementWorkflowConfig,
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Get workflow configuration by ID
 *
 * @param workflowId - Workflow identifier (from database or legacy hardcoded value)
 * @returns WorkflowConfig object or null if not found
 *
 * @example
 * const config = getWorkflowConfig('obsblk-strategic-planning');
 * if (config) {
 *   console.log(config.slides.length); // 6
 * }
 */
export function getWorkflowConfig(workflowId: string): WorkflowConfig | null {
  const config = WORKFLOW_REGISTRY[workflowId];

  if (!config) {
    console.warn(`[Workflow Registry] No config found for workflowId: ${workflowId}`);
    console.warn('[Workflow Registry] Available workflow IDs:', Object.keys(WORKFLOW_REGISTRY));
    return null;
  }

  return config;
}

/**
 * Get all registered workflow IDs
 * Useful for debugging and validation
 */
export function getRegisteredWorkflowIds(): string[] {
  return Object.keys(WORKFLOW_REGISTRY);
}

/**
 * Check if a workflow ID is registered
 */
export function isWorkflowRegistered(workflowId: string): boolean {
  return workflowId in WORKFLOW_REGISTRY;
}

/**
 * Re-export workflow configs for direct import if needed
 */
export {
  strategicPlanningWorkflowConfig,
  expansionWorkflowConfig,
  executiveEngagementWorkflowConfig,
  obsidianBlackPricingConfig,
  obsidianBlackCallDebriefConfig,
};
