/**
 * Workflow Registry
 *
 * Central registry mapping workflow IDs to their configurations.
 * This makes it easy to add new workflows without modifying the engine.
 *
 * Usage:
 * ```typescript
 * const config = WorkflowRegistry['simple-renewal'];
 * ```
 */

import { WorkflowConfig } from './types';
import { SimpleRenewal } from './SimpleRenewal';
import { StrategicQBR } from './StrategicQBR';
import { HealthCheck } from './HealthCheck';

/**
 * Map of workflow IDs to workflow configurations
 */
export const WorkflowRegistry: Record<string, WorkflowConfig> = {
  'simple-renewal': SimpleRenewal,
  'strategic-qbr': StrategicQBR,
  'health-check': HealthCheck
};

/**
 * Get list of all available workflows
 */
export function getAvailableWorkflows(): Array<{ id: string; name: string }> {
  return Object.values(WorkflowRegistry).map((config) => ({
    id: config.id,
    name: config.name
  }));
}

/**
 * Get workflow config by ID
 */
export function getWorkflowConfig(id: string): WorkflowConfig | undefined {
  return WorkflowRegistry[id];
}
