/**
 * Data Providers - Barrel Exports
 * Central export point for all workflow data providers
 * Phase: 2B.2 (Data Extraction)
 */

// Main workflow context provider (use this in most cases)
export {
  useWorkflowContext,
  getWorkflowContext,
  type WorkflowContext,
  type CustomerContext
} from './workflowContextProvider';

// Stakeholder provider (for direct access)
export {
  fetchStakeholders,
  fetchPrimaryContact,
  type Stakeholder,
  type StakeholderData
} from './stakeholderProvider';

// Contract/Expansion provider (for direct access)
export {
  fetchExpansionData,
  type ContractData,
  type UsageData,
  type MarketData,
  type PricingScenario,
  type ExpansionData
} from './contractProvider';
