/**
 * Workflow Orchestrator
 *
 * The "brain" of the workflow system - ties together all modules to generate
 * prioritized workflow assignments for CSMs.
 */

const { randomUUID } = require('crypto');
const { getCustomersNeedingWorkflows } = require('./workflow-data-access');
const { determineWorkflowsForCustomer } = require('./workflow-determination');
const {
  WorkflowType,
  createWorkflowInstance,
  createWorkflowAssignment,
  createUserContext
} = require('./workflow-types');
const { calculateWorkflowPriority, compareWorkflows } = require('./workflow-scoring');

// Try to load renewal workflow mapper (may not be available if using TS configs)
let getConfigForStage = null;
try {
  const mapper = require('./renewal-workflow-mapper');
  getConfigForStage = mapper.getConfigForStage;
} catch (error) {
  // Renewal workflow mapper not available (TS configs), will use fallback
  getConfigForStage = null;
}

/**
 * Generate all workflow assignments for a company
 * Main orchestrator function that brings everything together
 *
 * @param {string} companyId - Company ID to generate workflows for
 * @param {Object} options - Optional configuration
 * @param {string} options.ownerId - Filter to specific CSM
 * @param {Object} options.userContexts - Map of userId to UserContext objects
 * @param {boolean} options.includeMetadata - Include full metadata in response
 * @returns {Array<Object>} Array of WorkflowAssignment objects, sorted by priority
 */
function generateAllWorkflows(companyId, options = {}) {
  const { ownerId, userContexts = {}, includeMetadata = true } = options;

  // Step 1: Get all customers who need workflows
  const customers = getCustomersNeedingWorkflows(companyId, ownerId);

  if (customers.length === 0) {
    return [];
  }

  const workflowAssignments = [];

  // Step 2: Process each customer
  customers.forEach(customer => {
    // Step 3: Determine which workflow types this customer needs
    const workflowTypes = determineWorkflowsForCustomer(customer);

    if (workflowTypes.length === 0) {
      return; // Skip customers with no applicable workflows
    }

    // Step 4: Generate a workflow instance for each type
    workflowTypes.forEach(workflowType => {
      // Create workflow instance
      const workflow = createWorkflowInstance({
        id: randomUUID(),
        type: workflowType,
        customer_id: customer.customer_id,
        config: getWorkflowConfig(workflowType, customer),
        metadata: {
          renewal_stage: customer.renewal_stage,
          account_plan: customer.account_plan,
          days_until_renewal: customer.days_until_renewal,
          arr: customer.arr,
          generated_at: new Date().toISOString()
        },
        status: 'pending',
        assigned_to: customer.owner
      });

      // Step 5: Calculate priority score
      const userContext = userContexts[customer.owner] || null;
      const scoring = calculateWorkflowPriority(workflow, customer, userContext);

      // Update workflow with calculated score
      workflow.priority_score = scoring.totalScore;
      workflow.priority_factors = scoring.factors;

      // Step 6: Create workflow assignment with full context
      const assignment = createWorkflowAssignment({
        workflow,
        customer: {
          customer_id: customer.customer_id,
          domain: customer.domain,
          arr: customer.arr,
          renewal_date: customer.renewal_date,
          owner: customer.owner
        },
        context: {
          days_until_renewal: customer.days_until_renewal,
          renewal_stage: customer.renewal_stage,
          account_plan: customer.account_plan,
          opportunity_score: customer.opportunity_score || null,
          risk_score: customer.risk_score || null
        },
        user_context: userContext
      });

      workflowAssignments.push(assignment);
    });
  });

  // Step 7: Sort by priority (highest first)
  workflowAssignments.sort(compareWorkflows);

  return workflowAssignments;
}

/**
 * Get workflow config for a specific workflow type and customer
 *
 * @param {string} workflowType - Type of workflow
 * @param {Object} customer - Customer data
 * @returns {Object} Workflow configuration
 */
function getWorkflowConfig(workflowType, customer) {
  switch (workflowType) {
    case WorkflowType.RENEWAL:
      // Get renewal config based on stage
      if (getConfigForStage) {
        try {
          const config = getConfigForStage(customer.renewal_stage);
          return {
            ...config,
            stage: customer.renewal_stage,
            days_until_renewal: customer.days_until_renewal
          };
        } catch (error) {
          // Fall through to fallback
        }
      }
      // Fallback if stage config not found or mapper not available
      return {
        stage: customer.renewal_stage,
        template: `renewal-${customer.renewal_stage?.toLowerCase()}`,
        placeholderNote: 'Workflow template needs to be designed'
      };

    case WorkflowType.STRATEGIC:
      return {
        account_plan: customer.account_plan,
        template: `strategic-${customer.account_plan}`,
        placeholderNote: 'Strategic workflow template needs to be designed'
      };

    case WorkflowType.OPPORTUNITY:
      return {
        opportunity_score: customer.opportunity_score,
        template: 'opportunity-upsell',
        placeholderNote: 'Opportunity workflow template needs to be designed'
      };

    case WorkflowType.RISK:
      return {
        risk_score: customer.risk_score,
        template: 'risk-intervention',
        placeholderNote: 'Risk workflow template needs to be designed'
      };

    default:
      return {
        template: 'default',
        placeholderNote: 'Workflow template needs to be designed'
      };
  }
}

/**
 * Get prioritized workflow queue for a specific CSM
 *
 * @param {string} ownerId - CSM user ID
 * @param {string} companyId - Company ID
 * @param {Object} options - Optional configuration
 * @returns {Array<Object>} Sorted workflow assignments for this CSM
 */
function getWorkflowQueueForCSM(ownerId, companyId, options = {}) {
  // Get all workflows for this specific CSM
  return generateAllWorkflows(companyId, {
    ...options,
    ownerId
  });
}

/**
 * Group workflows by customer
 * Useful for showing "this customer has 3 workflows" in UI
 *
 * @param {Array<Object>} workflowAssignments - Array of workflow assignments
 * @returns {Object} Map of customer_id to array of workflows
 */
function groupWorkflowsByCustomer(workflowAssignments) {
  const grouped = {};

  workflowAssignments.forEach(assignment => {
    const customerId = assignment.customer.id;

    if (!grouped[customerId]) {
      grouped[customerId] = {
        customer: assignment.customer,
        workflows: [],
        total_priority: 0,
        highest_priority: 0
      };
    }

    grouped[customerId].workflows.push(assignment);
    grouped[customerId].total_priority += assignment.workflow.priority_score;
    grouped[customerId].highest_priority = Math.max(
      grouped[customerId].highest_priority,
      assignment.workflow.priority_score
    );
  });

  return grouped;
}

/**
 * Get workflow statistics for a company or CSM
 *
 * @param {Array<Object>} workflowAssignments - Array of workflow assignments
 * @returns {Object} Statistics object
 */
function getWorkflowStats(workflowAssignments) {
  const stats = {
    total_workflows: workflowAssignments.length,
    by_type: {
      renewal: 0,
      strategic: 0,
      opportunity: 0,
      risk: 0
    },
    by_stage: {},
    by_account_plan: {},
    unique_customers: new Set(),
    avg_priority: 0,
    priority_range: {
      min: Infinity,
      max: -Infinity
    }
  };

  let totalPriority = 0;

  workflowAssignments.forEach(assignment => {
    const { workflow, customer, context } = assignment;

    // Count by type
    if (stats.by_type[workflow.type] !== undefined) {
      stats.by_type[workflow.type]++;
    }

    // Count by renewal stage
    if (context.renewal_stage) {
      stats.by_stage[context.renewal_stage] = (stats.by_stage[context.renewal_stage] || 0) + 1;
    }

    // Count by account plan
    if (context.account_plan) {
      stats.by_account_plan[context.account_plan] = (stats.by_account_plan[context.account_plan] || 0) + 1;
    }

    // Track unique customers
    stats.unique_customers.add(customer.id);

    // Priority stats
    totalPriority += workflow.priority_score;
    stats.priority_range.min = Math.min(stats.priority_range.min, workflow.priority_score);
    stats.priority_range.max = Math.max(stats.priority_range.max, workflow.priority_score);
  });

  stats.unique_customers = stats.unique_customers.size;
  stats.avg_priority = workflowAssignments.length > 0
    ? Math.round(totalPriority / workflowAssignments.length)
    : 0;

  return stats;
}

/**
 * Filter workflows by criteria
 *
 * @param {Array<Object>} workflowAssignments - Array of workflow assignments
 * @param {Object} filters - Filter criteria
 * @returns {Array<Object>} Filtered workflow assignments
 */
function filterWorkflows(workflowAssignments, filters = {}) {
  let filtered = [...workflowAssignments];

  // Filter by workflow type
  if (filters.type) {
    filtered = filtered.filter(w => w.workflow.type === filters.type);
  }

  // Filter by renewal stage
  if (filters.stage) {
    filtered = filtered.filter(w => w.context.renewal_stage === filters.stage);
  }

  // Filter by account plan
  if (filters.account_plan) {
    filtered = filtered.filter(w => w.context.account_plan === filters.account_plan);
  }

  // Filter by minimum ARR
  if (filters.min_arr) {
    filtered = filtered.filter(w => w.customer.arr >= filters.min_arr);
  }

  // Filter by maximum ARR
  if (filters.max_arr) {
    filtered = filtered.filter(w => w.customer.arr <= filters.max_arr);
  }

  // Filter by minimum priority score
  if (filters.min_priority) {
    filtered = filtered.filter(w => w.workflow.priority_score >= filters.min_priority);
  }

  // Filter by days until renewal range
  if (filters.days_min !== undefined) {
    filtered = filtered.filter(w =>
      w.context.days_until_renewal !== null &&
      w.context.days_until_renewal >= filters.days_min
    );
  }

  if (filters.days_max !== undefined) {
    filtered = filtered.filter(w =>
      w.context.days_until_renewal !== null &&
      w.context.days_until_renewal <= filters.days_max
    );
  }

  return filtered;
}

/**
 * Get top N workflows
 *
 * @param {Array<Object>} workflowAssignments - Array of workflow assignments
 * @param {number} limit - Number of workflows to return
 * @returns {Array<Object>} Top N workflows
 */
function getTopWorkflows(workflowAssignments, limit = 10) {
  return workflowAssignments.slice(0, limit);
}

module.exports = {
  // Main orchestration functions
  generateAllWorkflows,
  getWorkflowQueueForCSM,

  // Helper functions
  groupWorkflowsByCustomer,
  getWorkflowStats,
  filterWorkflows,
  getTopWorkflows,

  // Internal (exported for testing)
  getWorkflowConfig
};
