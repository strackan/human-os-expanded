/**
 * Workflow Determination Logic
 *
 * Determines which workflows a customer should receive based on their data
 * Supports 4 workflow types: renewal, strategic, opportunity, risk
 * Thresholds loaded from database with caching
 */

const { WorkflowType } = require('./workflow-types');
const { getAllConfig, getAllWorkflowProperties } = require('./config-data-access');

/**
 * Hardcoded workflow thresholds (Fallback)
 * Used only if database is empty or not available
 */
const WORKFLOW_THRESHOLDS_FALLBACK = {
  // Strategic workflows trigger for these account plans
  strategic_account_plans: ['invest', 'expand'],

  // Opportunity workflow threshold
  opportunity_score_min: 70,

  // Risk workflow threshold
  risk_score_min: 60
};

/**
 * Get workflow determination thresholds from database (cached)
 * Falls back to hardcoded thresholds if database unavailable
 *
 * @returns {Object} Workflow thresholds
 */
function getWorkflowThresholds() {
  try {
    // Get all config (uses cache if available)
    const allConfig = getAllConfig();

    // Return workflow config if available
    if (allConfig && allConfig.workflow) {
      // Add fallback for strategic_account_plans if not in database
      if (!allConfig.workflow.strategic_account_plans) {
        allConfig.workflow.strategic_account_plans = WORKFLOW_THRESHOLDS_FALLBACK.strategic_account_plans;
      }
      return allConfig.workflow;
    }

    // Fallback: try direct workflow properties query
    const workflowProps = getAllWorkflowProperties();
    if (workflowProps && Object.keys(workflowProps).length > 0) {
      // Add fallback for strategic_account_plans if not in database
      if (!workflowProps.strategic_account_plans) {
        workflowProps.strategic_account_plans = WORKFLOW_THRESHOLDS_FALLBACK.strategic_account_plans;
      }
      return workflowProps;
    }
  } catch (error) {
    console.warn('[workflow-determination] Database config unavailable, using fallback:', error.message);
  }

  // Final fallback to hardcoded thresholds
  return WORKFLOW_THRESHOLDS_FALLBACK;
}

/**
 * Check if customer should have a renewal workflow
 * Renewal workflows are assigned to all customers with an active renewal
 *
 * @param {Object} customer - Customer data
 * @returns {boolean}
 */
function shouldHaveRenewalWorkflow(customer) {
  // Customer needs a renewal workflow if they have:
  // 1. An active renewal_id
  // 2. OR a renewal_date in the future

  if (customer.renewal_id) {
    return true;
  }

  if (customer.renewal_date) {
    // Check if renewal date is in the future (or recently past)
    const renewalDate = new Date(customer.renewal_date);
    const today = new Date();

    // Include renewals up to 30 days overdue
    const daysOverdue = Math.floor((today - renewalDate) / (1000 * 60 * 60 * 24));

    return daysOverdue < 30; // Still relevant if less than 30 days overdue
  }

  return false;
}

/**
 * Check if customer should have a strategic workflow
 * Strategic workflows are for high-touch accounts (invest/expand plans)
 *
 * @param {Object} customer - Customer data
 * @returns {boolean}
 */
function shouldHaveStrategicWorkflow(customer) {
  if (!customer.account_plan) {
    return false;
  }

  const thresholds = getWorkflowThresholds();
  return thresholds.strategic_account_plans.includes(customer.account_plan);
}

/**
 * Check if customer should have an opportunity workflow
 * Opportunity workflows are for upsell/expansion opportunities
 *
 * @param {Object} customer - Customer data
 * @returns {boolean}
 */
function shouldHaveOpportunityWorkflow(customer) {
  const thresholds = getWorkflowThresholds();

  if (customer.opportunity_score && customer.opportunity_score >= thresholds.opportunity_score_min) {
    return true;
  }

  return false;
}

/**
 * Check if customer should have a risk workflow
 * Risk workflows are for at-risk accounts that need intervention
 *
 * @param {Object} customer - Customer data
 * @returns {boolean}
 */
function shouldHaveRiskWorkflow(customer) {
  const thresholds = getWorkflowThresholds();

  if (customer.risk_score && customer.risk_score >= thresholds.risk_score_min) {
    return true;
  }

  return false;
}

/**
 * Determine all workflows that should be created for a customer
 * Main entry point for workflow determination logic
 *
 * @param {Object} customer - Customer data with all context
 * @returns {Array<string>} Array of workflow types (e.g., ['renewal', 'strategic'])
 */
function determineWorkflowsForCustomer(customer) {
  const workflows = [];

  if (shouldHaveRenewalWorkflow(customer)) {
    workflows.push(WorkflowType.RENEWAL);
  }

  if (shouldHaveStrategicWorkflow(customer)) {
    workflows.push(WorkflowType.STRATEGIC);
  }

  if (shouldHaveOpportunityWorkflow(customer)) {
    workflows.push(WorkflowType.OPPORTUNITY);
  }

  if (shouldHaveRiskWorkflow(customer)) {
    workflows.push(WorkflowType.RISK);
  }

  return workflows;
}

/**
 * Get explanation of why a customer has specific workflows
 * Useful for debugging and transparency
 *
 * @param {Object} customer - Customer data
 * @returns {Object} Explanation object with reasons for each workflow
 */
function getWorkflowDeterminationExplanation(customer) {
  const thresholds = getWorkflowThresholds();

  const explanation = {
    customer_id: customer.customer_id || customer.id,
    domain: customer.domain,
    workflows: [],
    reasons: {}
  };

  if (shouldHaveRenewalWorkflow(customer)) {
    explanation.workflows.push(WorkflowType.RENEWAL);
    explanation.reasons.renewal = customer.renewal_id
      ? `Active renewal (${customer.renewal_id}), ${customer.days_until_renewal} days until renewal`
      : `Renewal date: ${customer.renewal_date}`;
  }

  if (shouldHaveStrategicWorkflow(customer)) {
    explanation.workflows.push(WorkflowType.STRATEGIC);
    explanation.reasons.strategic = `Account plan: ${customer.account_plan} (requires strategic attention)`;
  }

  if (shouldHaveOpportunityWorkflow(customer)) {
    explanation.workflows.push(WorkflowType.OPPORTUNITY);
    explanation.reasons.opportunity = `Opportunity score: ${customer.opportunity_score} (threshold: ${thresholds.opportunity_score_min})`;
  }

  if (shouldHaveRiskWorkflow(customer)) {
    explanation.workflows.push(WorkflowType.RISK);
    explanation.reasons.risk = `Risk score: ${customer.risk_score} (threshold: ${thresholds.risk_score_min})`;
  }

  if (explanation.workflows.length === 0) {
    explanation.reasons.none = 'Customer does not meet criteria for any workflows';
  }

  return explanation;
}

/**
 * Update workflow determination thresholds
 * Updates database and invalidates cache
 * Note: This updates individual properties, not the entire config
 *
 * @param {Object} newThresholds - New threshold values (key-value pairs)
 * @param {string} userId - User ID making the change (optional)
 */
function updateWorkflowThresholds(newThresholds, userId = 'system') {
  const { updateWorkflowProperty, invalidateCache } = require('./config-data-access');

  try {
    // Update each property in the database
    for (const [key, value] of Object.entries(newThresholds)) {
      updateWorkflowProperty(key, value, userId);
    }

    // Cache is automatically invalidated by updateWorkflowProperty
    console.log(`[workflow-determination] Updated ${Object.keys(newThresholds).length} workflow threshold properties`);
  } catch (error) {
    console.error('[workflow-determination] Error updating workflow thresholds:', error.message);
    throw error;
  }
}

module.exports = {
  // Main functions
  shouldHaveRenewalWorkflow,
  shouldHaveStrategicWorkflow,
  shouldHaveOpportunityWorkflow,
  shouldHaveRiskWorkflow,
  determineWorkflowsForCustomer,

  // Helper functions
  getWorkflowDeterminationExplanation,
  updateWorkflowThresholds,
  getWorkflowThresholds
};
