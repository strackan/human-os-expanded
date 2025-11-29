/**
 * Workflow Type System
 *
 * Defines data structures and types for the workflow assignment system
 * Supports 4 workflow categories: renewal, strategic, opportunity, risk
 */

/**
 * Workflow Type Enum
 * Defines the 4 main categories of workflows
 */
const WorkflowType = {
  RENEWAL: 'renewal',        // Based on renewal stage (9 stages: Overdue -> Monitor)
  STRATEGIC: 'strategic',    // Based on account_plan (invest/manage/monitor/expand)
  OPPORTUNITY: 'opportunity', // Based on opportunity score (future)
  RISK: 'risk'               // Based on risk score (future)
};

/**
 * Creates a WorkflowInstance object
 * This is what gets created when a workflow is assigned to a customer
 *
 * @typedef {Object} WorkflowInstance
 * @property {string} id - Unique workflow instance ID
 * @property {string} type - Workflow type (renewal|strategic|opportunity|risk)
 * @property {string} customer_id - Customer this workflow is for
 * @property {Object} config - Workflow configuration/template
 * @property {number} priority_score - Calculated priority score (for ranking)
 * @property {Object} priority_factors - Breakdown of scoring factors
 * @property {Object} metadata - Additional context (stage, ARR, dates, etc.)
 * @property {string} status - Workflow status (pending|in_progress|completed|skipped)
 * @property {string} assigned_to - User ID of assigned CSM
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * Factory function to create a WorkflowInstance
 *
 * @param {Object} params - Workflow instance parameters
 * @returns {WorkflowInstance}
 */
function createWorkflowInstance({
  id,
  type,
  customer_id,
  config,
  priority_score = 0,
  priority_factors = {},
  metadata = {},
  status = 'pending',
  assigned_to = null,
  created_at = new Date().toISOString(),
  updated_at = new Date().toISOString()
}) {
  return {
    id,
    type,
    customer_id,
    config,
    priority_score,
    priority_factors,
    metadata,
    status,
    assigned_to,
    created_at,
    updated_at
  };
}

/**
 * Creates a UserContext object
 * Information about the CSM that can influence workflow prioritization and customization
 *
 * @typedef {Object} UserContext
 * @property {string} user_id - User/CSM ID
 * @property {string} full_name - CSM full name
 * @property {string} email - CSM email
 * @property {string} experience_level - Experience level (junior|mid|senior|expert)
 * @property {number} current_workload - Number of active workflows currently assigned
 * @property {Array<string>} specialties - Areas of expertise (e.g., ['renewals', 'upsells', 'enterprise'])
 * @property {Object} preferences - CSM preferences for workflow customization
 * @property {string} preferences.communication_style - Preferred style (formal|casual|technical)
 * @property {string} preferences.workflow_complexity - Preferred complexity (simple|standard|detailed)
 * @property {Object} performance_metrics - Historical performance data
 * @property {number} performance_metrics.close_rate - Renewal close rate (0-1)
 * @property {number} performance_metrics.avg_response_time - Avg response time in hours
 * @property {number} performance_metrics.customer_satisfaction - CSAT score (0-100)
 * @property {Array<string>} territories - Territories/segments managed
 */

/**
 * Factory function to create a UserContext
 *
 * @param {Object} params - User context parameters
 * @returns {UserContext}
 */
function createUserContext({
  user_id,
  full_name,
  email,
  experience_level = 'mid',
  current_workload = 0,
  specialties = [],
  preferences = {},
  performance_metrics = {},
  territories = []
}) {
  return {
    user_id,
    full_name,
    email,
    experience_level,
    current_workload,
    specialties,
    preferences: {
      communication_style: preferences.communication_style || 'standard',
      workflow_complexity: preferences.workflow_complexity || 'standard'
    },
    performance_metrics: {
      close_rate: performance_metrics.close_rate || null,
      avg_response_time: performance_metrics.avg_response_time || null,
      customer_satisfaction: performance_metrics.customer_satisfaction || null
    },
    territories
  };
}

/**
 * Creates a WorkflowAssignment object
 * This is the output structure for the dashboard - combines workflow with customer data
 *
 * @typedef {Object} WorkflowAssignment
 * @property {WorkflowInstance} workflow - The workflow instance
 * @property {Object} customer - Customer data
 * @property {string} customer.id - Customer ID
 * @property {string} customer.domain - Customer domain
 * @property {number} customer.arr - Annual recurring revenue
 * @property {string} customer.renewal_date - Renewal date (ISO format)
 * @property {string} customer.owner - Owner/CSM user ID
 * @property {Object} context - Additional context for display
 * @property {number} context.days_until_renewal - Days until renewal
 * @property {string} context.renewal_stage - Current renewal stage
 * @property {string} context.account_plan - Account plan type (invest|manage|monitor|expand)
 * @property {number} context.opportunity_score - Opportunity score (future)
 * @property {number} context.risk_score - Risk score (future)
 * @property {UserContext} user_context - CSM context (optional)
 */

/**
 * Factory function to create a WorkflowAssignment
 *
 * @param {Object} params - Assignment parameters
 * @returns {WorkflowAssignment}
 */
function createWorkflowAssignment({
  workflow,
  customer,
  context = {},
  user_context = null
}) {
  return {
    workflow,
    customer: {
      id: customer.id || customer.customer_id,
      domain: customer.domain,
      arr: customer.arr,
      renewal_date: customer.renewal_date,
      owner: customer.owner
    },
    context: {
      days_until_renewal: context.days_until_renewal,
      renewal_stage: context.renewal_stage,
      account_plan: context.account_plan || null,
      opportunity_score: context.opportunity_score || null,
      risk_score: context.risk_score || null
    },
    user_context
  };
}

/**
 * Creates a WorkflowMetadata object
 * Extensible metadata that varies by workflow type
 *
 * @typedef {Object} WorkflowMetadata
 * @property {string} workflow_type - Type of workflow
 * @property {string} trigger_reason - Why this workflow was created
 * @property {Object} source_data - Original data that triggered workflow
 * @property {string} generated_at - ISO timestamp
 * @property {Object} custom - Type-specific custom fields
 */

/**
 * Factory function to create WorkflowMetadata
 *
 * @param {Object} params - Metadata parameters
 * @returns {WorkflowMetadata}
 */
function createWorkflowMetadata({
  workflow_type,
  trigger_reason,
  source_data = {},
  generated_at = new Date().toISOString(),
  custom = {}
}) {
  return {
    workflow_type,
    trigger_reason,
    source_data,
    generated_at,
    custom
  };
}

/**
 * Creates a PriorityFactors object
 * Breakdown of what influenced the priority score (for transparency)
 *
 * @typedef {Object} PriorityFactors
 * @property {number} base_score - Base score before multipliers
 * @property {number} arr_multiplier - ARR-based multiplier (e.g., 1.5x for >$150k)
 * @property {number} urgency_score - Urgency contribution (varies by workflow type)
 * @property {number} stage_bonus - Stage-specific bonus points
 * @property {number} account_plan_multiplier - Account plan multiplier (invest=1.5x, etc.)
 * @property {number} opportunity_bonus - Opportunity score bonus (future)
 * @property {number} risk_penalty - Risk score penalty (future)
 * @property {Object} custom - Additional type-specific factors
 */

/**
 * Factory function to create PriorityFactors
 *
 * @param {Object} params - Priority factors
 * @returns {PriorityFactors}
 */
function createPriorityFactors({
  base_score = 0,
  arr_multiplier = 1.0,
  urgency_score = 0,
  stage_bonus = 0,
  account_plan_multiplier = 1.0,
  opportunity_bonus = 0,
  risk_penalty = 0,
  custom = {}
}) {
  return {
    base_score,
    arr_multiplier,
    urgency_score,
    stage_bonus,
    account_plan_multiplier,
    opportunity_bonus,
    risk_penalty,
    custom
  };
}

/**
 * Workflow Status Enum
 */
const WorkflowStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  COMPLETED_WITH_SNOOZE: 'completed_with_snooze', // Steps done, but tasks snoozed
  SKIPPED: 'skipped',
  FAILED: 'failed'
};

/**
 * Task Status Enum
 */
const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SNOOZED: 'snoozed',
  SKIPPED: 'skipped'
};

/**
 * Task Owner Enum
 */
const TaskOwner = {
  AI: 'AI',
  CSM: 'CSM'
};

/**
 * Recommendation Status Enum
 */
const RecommendationStatus = {
  PENDING: 'pending',
  ACTIONED: 'actioned',
  SKIPPED: 'skipped',
  SNOOZED: 'snoozed'
};

/**
 * Account Plan Enum
 */
const AccountPlan = {
  INVEST: 'invest',
  EXPAND: 'expand',
  MANAGE: 'manage',
  MONITOR: 'monitor'
};

/**
 * Experience Level Enum
 */
const ExperienceLevel = {
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  EXPERT: 'expert'
};

/**
 * Communication Style Enum
 */
const CommunicationStyle = {
  FORMAL: 'formal',
  STANDARD: 'standard',
  CASUAL: 'casual',
  TECHNICAL: 'technical'
};

/**
 * Workflow Complexity Enum
 */
const WorkflowComplexity = {
  SIMPLE: 'simple',
  STANDARD: 'standard',
  DETAILED: 'detailed'
};

/**
 * Helper function to validate workflow type
 *
 * @param {string} type - The workflow type to validate
 * @returns {boolean}
 */
function isValidWorkflowType(type) {
  return Object.values(WorkflowType).includes(type);
}

/**
 * Helper function to validate workflow status
 *
 * @param {string} status - The status to validate
 * @returns {boolean}
 */
function isValidWorkflowStatus(status) {
  return Object.values(WorkflowStatus).includes(status);
}

/**
 * Helper function to validate account plan
 *
 * @param {string} plan - The account plan to validate
 * @returns {boolean}
 */
function isValidAccountPlan(plan) {
  return Object.values(AccountPlan).includes(plan);
}

module.exports = {
  // Enums
  WorkflowType,
  WorkflowStatus,
  TaskStatus,
  TaskOwner,
  RecommendationStatus,
  AccountPlan,
  ExperienceLevel,
  CommunicationStyle,
  WorkflowComplexity,

  // Factory functions
  createWorkflowInstance,
  createWorkflowAssignment,
  createWorkflowMetadata,
  createPriorityFactors,
  createUserContext,

  // Validation helpers
  isValidWorkflowType,
  isValidWorkflowStatus,
  isValidAccountPlan
};
