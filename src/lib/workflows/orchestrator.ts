/**
 * Workflow Orchestrator
 *
 * The "brain" of the workflow system - ties together all modules to generate
 * prioritized workflow assignments for CSMs.
 *
 * Ported from automation-backup JavaScript implementation to TypeScript
 */

import { randomUUID } from 'crypto';
import { determineWorkflowsForCustomer } from './determination';
import {
  WorkflowType,
  type WorkflowInstance,
  type WorkflowAssignment,
  type CustomerData,
  type UserContext,
  createWorkflowInstance,
  createWorkflowAssignment
} from './types';
import { calculateWorkflowPriority, compareWorkflows } from './scoring';

/**
 * Generate Workflows Options Interface
 */
export interface GenerateWorkflowsOptions {
  ownerId?: string;
  userContexts?: Record<string, UserContext>;
  includeMetadata?: boolean;
}

/**
 * Get workflow config for a specific workflow type and customer
 * This is a placeholder - will be enhanced when workflow templates are implemented
 *
 * @param workflowType - Type of workflow
 * @param customer - Customer data
 * @returns Workflow configuration
 */
export function getWorkflowConfig(workflowType: WorkflowType, customer: CustomerData): Record<string, any> {
  switch (workflowType) {
    case WorkflowType.RENEWAL:
      // Fallback renewal config
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
 * Generate all workflow assignments for customers
 * Main orchestrator function that brings everything together
 *
 * @param customers - Array of customer data
 * @param options - Optional configuration
 * @returns Array of WorkflowAssignment objects, sorted by priority
 */
export function generateAllWorkflows(
  customers: CustomerData[],
  options: GenerateWorkflowsOptions = {}
): WorkflowAssignment[] {
  const { userContexts = {}, includeMetadata = true } = options;

  if (customers.length === 0) {
    return [];
  }

  const workflowAssignments: WorkflowAssignment[] = [];

  // Process each customer
  customers.forEach(customer => {
    // Determine which workflow types this customer needs
    const workflowTypes = determineWorkflowsForCustomer(customer);

    if (workflowTypes.length === 0) {
      return; // Skip customers with no applicable workflows
    }

    // Generate a workflow instance for each type
    workflowTypes.forEach(workflowType => {
      // Create workflow instance
      const workflow = createWorkflowInstance({
        id: randomUUID(),
        type: workflowType,
        customer_id: customer.customer_id || customer.id || '',
        config: getWorkflowConfig(workflowType, customer),
        metadata: {
          workflow_type: workflowType,
          trigger_reason: 'automatic',
          source_data: {},
          generated_at: new Date().toISOString(),
          custom: {},
          renewal_stage: customer.renewal_stage,
          account_plan: customer.account_plan || undefined,
          days_until_renewal: customer.days_until_renewal || undefined,
          arr: customer.arr
        },
        status: 'pending' as any,
        assigned_to: customer.owner
      });

      // Calculate priority score
      const userContext = customer.owner ? userContexts[customer.owner] : null;
      const scoring = calculateWorkflowPriority(workflow, customer, userContext);

      // Update workflow with calculated score
      workflow.priority_score = scoring.totalScore;
      workflow.priority_factors = scoring.factors;

      // Create workflow assignment with full context
      const assignment = createWorkflowAssignment({
        workflow,
        customer: {
          customer_id: customer.customer_id || customer.id,
          id: customer.customer_id || customer.id,
          domain: customer.domain,
          arr: customer.arr,
          renewal_date: customer.renewal_date,
          owner: customer.owner
        },
        context: {
          days_until_renewal: customer.days_until_renewal || null,
          renewal_stage: customer.renewal_stage || null,
          account_plan: customer.account_plan || null,
          opportunity_score: customer.opportunity_score || null,
          risk_score: customer.risk_score || null
        },
        user_context: userContext
      });

      workflowAssignments.push(assignment);
    });
  });

  // Sort by priority (highest first)
  workflowAssignments.sort(compareWorkflows);

  return workflowAssignments;
}

/**
 * Get prioritized workflow queue for a specific CSM
 *
 * @param customers - Array of customer data (pre-filtered by owner)
 * @param options - Optional configuration
 * @returns Sorted workflow assignments for this CSM
 */
export function getWorkflowQueueForCSM(
  customers: CustomerData[],
  options: GenerateWorkflowsOptions = {}
): WorkflowAssignment[] {
  // Generate workflows for the pre-filtered customer list
  return generateAllWorkflows(customers, options);
}

/**
 * Grouped Workflows Interface
 */
export interface GroupedWorkflows {
  [customerId: string]: {
    customer: CustomerData;
    workflows: WorkflowAssignment[];
    total_priority: number;
    highest_priority: number;
  };
}

/**
 * Group workflows by customer
 * Useful for showing "this customer has 3 workflows" in UI
 *
 * @param workflowAssignments - Array of workflow assignments
 * @returns Map of customer_id to array of workflows
 */
export function groupWorkflowsByCustomer(workflowAssignments: WorkflowAssignment[]): GroupedWorkflows {
  const grouped: GroupedWorkflows = {};

  workflowAssignments.forEach(assignment => {
    const customerId = assignment.customer.id || assignment.customer.customer_id || '';

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
 * Workflow Statistics Interface
 */
export interface WorkflowStats {
  total_workflows: number;
  by_type: {
    renewal: number;
    strategic: number;
    opportunity: number;
    risk: number;
  };
  by_stage: Record<string, number>;
  by_account_plan: Record<string, number>;
  unique_customers: number;
  avg_priority: number;
  priority_range: {
    min: number;
    max: number;
  };
}

/**
 * Get workflow statistics for a company or CSM
 *
 * @param workflowAssignments - Array of workflow assignments
 * @returns Statistics object
 */
export function getWorkflowStats(workflowAssignments: WorkflowAssignment[]): WorkflowStats {
  const stats: WorkflowStats = {
    total_workflows: workflowAssignments.length,
    by_type: {
      renewal: 0,
      strategic: 0,
      opportunity: 0,
      risk: 0
    },
    by_stage: {},
    by_account_plan: {},
    unique_customers: 0,
    avg_priority: 0,
    priority_range: {
      min: Infinity,
      max: -Infinity
    }
  };

  const uniqueCustomers = new Set<string>();
  let totalPriority = 0;

  workflowAssignments.forEach(assignment => {
    const { workflow, customer, context } = assignment;

    // Count by type
    if (workflow.type in stats.by_type) {
      stats.by_type[workflow.type as keyof typeof stats.by_type]++;
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
    const customerId = customer.id || customer.customer_id || '';
    uniqueCustomers.add(customerId);

    // Priority stats
    totalPriority += workflow.priority_score;
    stats.priority_range.min = Math.min(stats.priority_range.min, workflow.priority_score);
    stats.priority_range.max = Math.max(stats.priority_range.max, workflow.priority_score);
  });

  stats.unique_customers = uniqueCustomers.size;
  stats.avg_priority = workflowAssignments.length > 0
    ? Math.round(totalPriority / workflowAssignments.length)
    : 0;

  return stats;
}

/**
 * Filter Workflows Options Interface
 */
export interface FilterWorkflowsOptions {
  type?: WorkflowType;
  stage?: string;
  account_plan?: string;
  min_arr?: number;
  max_arr?: number;
  min_priority?: number;
  days_min?: number;
  days_max?: number;
}

/**
 * Filter workflows by criteria
 *
 * @param workflowAssignments - Array of workflow assignments
 * @param filters - Filter criteria
 * @returns Filtered workflow assignments
 */
export function filterWorkflows(
  workflowAssignments: WorkflowAssignment[],
  filters: FilterWorkflowsOptions = {}
): WorkflowAssignment[] {
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
  if (filters.min_arr !== undefined) {
    filtered = filtered.filter(w => w.customer.arr >= filters.min_arr!);
  }

  // Filter by maximum ARR
  if (filters.max_arr !== undefined) {
    filtered = filtered.filter(w => w.customer.arr <= filters.max_arr!);
  }

  // Filter by minimum priority score
  if (filters.min_priority !== undefined) {
    filtered = filtered.filter(w => w.workflow.priority_score >= filters.min_priority!);
  }

  // Filter by days until renewal range
  if (filters.days_min !== undefined) {
    filtered = filtered.filter(w =>
      w.context.days_until_renewal !== null &&
      w.context.days_until_renewal >= filters.days_min!
    );
  }

  if (filters.days_max !== undefined) {
    filtered = filtered.filter(w =>
      w.context.days_until_renewal !== null &&
      w.context.days_until_renewal <= filters.days_max!
    );
  }

  return filtered;
}

/**
 * Get top N workflows
 *
 * @param workflowAssignments - Array of workflow assignments
 * @param limit - Number of workflows to return
 * @returns Top N workflows
 */
export function getTopWorkflows(workflowAssignments: WorkflowAssignment[], limit: number = 10): WorkflowAssignment[] {
  return workflowAssignments.slice(0, limit);
}
