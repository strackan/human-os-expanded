/**
 * Workflow Registry
 *
 * Central registry for all workflow configurations.
 * Each workflow is self-contained with all its steps, branches, and artifacts.
 */

import { WorkflowConfig } from '../../config/WorkflowConfig';
import { renewalPlanningWorkflow } from './RenewalPlanning';

export const workflowRegistry: Record<string, WorkflowConfig> = {
  'renewal-planning': renewalPlanningWorkflow,
  // TODO: Add more workflows:
  // 'needs-assessment': needsAssessmentWorkflow,
  // 'pricing-strategy': pricingStrategyWorkflow,
  // 'risk-assessment': riskAssessmentWorkflow,
  // 'opportunity-analysis': opportunityAnalysisWorkflow,
};

export type WorkflowId = keyof typeof workflowRegistry;

/**
 * Get a workflow by its ID
 */
export const getWorkflow = (id: string): WorkflowConfig | undefined => {
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
