/**
 * Renewal Workflow Mapper
 *
 * Maps renewal stages to workflow configurations
 * Enables automatic workflow assignment based on customer renewal data
 */

import { getRenewalStage } from './renewal-helpers';

// Import renewal config templates
import OverdueConfig from './renewal-configs/0-Overdue';
import EmergencyConfig from './renewal-configs/1-Emergency';
import CriticalConfig from './renewal-configs/2-Critical';
import SignatureConfig from './renewal-configs/3-Signature';
import FinalizeConfig from './renewal-configs/4-Finalize';
import NegotiateConfig from './renewal-configs/5-Negotiate';
import EngageConfig from './renewal-configs/6-Engage';
import PrepareConfig from './renewal-configs/7-Prepare';
import MonitorConfig from './renewal-configs/8-Monitor';

/**
 * Stage to Config Mapping
 * Maps each renewal stage to its corresponding workflow configuration
 */
export const STAGE_TO_CONFIG_MAP = {
  'Overdue': OverdueConfig,
  'Emergency': EmergencyConfig,
  'Critical': CriticalConfig,
  'Signature': SignatureConfig,
  'Finalize': FinalizeConfig,
  'Negotiate': NegotiateConfig,
  'Engage': EngageConfig,
  'Prepare': PrepareConfig,
  'Monitor': MonitorConfig
} as const;

export type RenewalStage = keyof typeof STAGE_TO_CONFIG_MAP;

interface CustomerData {
  id: string;
  domain: string;
  arr?: number;
}

interface RenewalData {
  id?: string;
  days_until_renewal: number;
}

interface WorkflowMetadata {
  customerId: string;
  customerDomain: string;
  renewalId?: string;
  stage: string;
  daysUntilRenewal: number;
  generatedAt: string;
}

/**
 * Get the workflow config for a given renewal stage
 *
 * @param stage - The renewal stage name
 * @returns The workflow configuration object
 * @throws {Error} If stage is not recognized
 */
export function getConfigForStage(stage: string) {
  const config = STAGE_TO_CONFIG_MAP[stage as RenewalStage];

  if (!config) {
    throw new Error(`No workflow config found for stage: ${stage}`);
  }

  return config;
}

/**
 * Generate a renewal workflow instance for a customer
 *
 * @param customerData - Customer data from database
 * @param renewalData - Renewal data including days_until_renewal
 * @returns Populated workflow configuration
 */
export function generateRenewalWorkflow(customerData: CustomerData, renewalData: RenewalData) {
  // Calculate the renewal stage based on days until renewal
  const stage = getRenewalStage(renewalData.days_until_renewal);

  // Get the base config template for this stage
  const baseConfig = getConfigForStage(stage);

  // TODO: Variable injection will happen here
  // For now, just return the base config with metadata
  return {
    ...baseConfig,
    _metadata: {
      customerId: customerData.id,
      customerDomain: customerData.domain,
      renewalId: renewalData.id,
      stage: stage,
      daysUntilRenewal: renewalData.days_until_renewal,
      generatedAt: new Date().toISOString()
    } as WorkflowMetadata
  };
}

/**
 * Get all available renewal stages
 *
 * @returns List of all stage names
 */
export function getAllStages(): string[] {
  return Object.keys(STAGE_TO_CONFIG_MAP);
}

/**
 * Check if a stage has a configured workflow
 *
 * @param stage - The renewal stage name
 * @returns True if stage has a workflow
 */
export function hasWorkflowForStage(stage: string): boolean {
  return stage in STAGE_TO_CONFIG_MAP;
}
