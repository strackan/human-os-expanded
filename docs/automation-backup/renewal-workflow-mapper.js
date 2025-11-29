/**
 * Renewal Workflow Mapper
 *
 * Maps renewal stages to workflow configurations
 * Enables automatic workflow assignment based on customer renewal data
 */

const { getRenewalStage } = require('./renewal-helpers');

// Import renewal config templates
const OverdueConfig = require('./renewal-configs/0-Overdue');
const EmergencyConfig = require('./renewal-configs/1-Emergency');
const CriticalConfig = require('./renewal-configs/2-Critical');
const SignatureConfig = require('./renewal-configs/3-Signature');
const FinalizeConfig = require('./renewal-configs/4-Finalize');
const NegotiateConfig = require('./renewal-configs/5-Negotiate');
const EngageConfig = require('./renewal-configs/6-Engage');
const PrepareConfig = require('./renewal-configs/7-Prepare');
const MonitorConfig = require('./renewal-configs/8-Monitor');

/**
 * Stage to Config Mapping
 * Maps each renewal stage to its corresponding workflow configuration
 */
const STAGE_TO_CONFIG_MAP = {
  'Overdue': OverdueConfig,
  'Emergency': EmergencyConfig,
  'Critical': CriticalConfig,
  'Signature': SignatureConfig,
  'Finalize': FinalizeConfig,
  'Negotiate': NegotiateConfig,
  'Engage': EngageConfig,
  'Prepare': PrepareConfig,
  'Monitor': MonitorConfig
};

/**
 * Get the workflow config for a given renewal stage
 *
 * @param {string} stage - The renewal stage name
 * @returns {Object} The workflow configuration object
 * @throws {Error} If stage is not recognized
 */
function getConfigForStage(stage) {
  const config = STAGE_TO_CONFIG_MAP[stage];

  if (!config) {
    throw new Error(`No workflow config found for stage: ${stage}`);
  }

  return config;
}

/**
 * Generate a renewal workflow instance for a customer
 *
 * @param {Object} customerData - Customer data from database
 * @param {Object} renewalData - Renewal data including days_until_renewal
 * @returns {Object} Populated workflow configuration
 */
function generateRenewalWorkflow(customerData, renewalData) {
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
    }
  };
}

/**
 * Get all available renewal stages
 *
 * @returns {Array<string>} List of all stage names
 */
function getAllStages() {
  return Object.keys(STAGE_TO_CONFIG_MAP);
}

/**
 * Check if a stage has a configured workflow
 *
 * @param {string} stage - The renewal stage name
 * @returns {boolean} True if stage has a workflow
 */
function hasWorkflowForStage(stage) {
  return stage in STAGE_TO_CONFIG_MAP;
}

module.exports = {
  STAGE_TO_CONFIG_MAP,
  getConfigForStage,
  generateRenewalWorkflow,
  getAllStages,
  hasWorkflowForStage
};
