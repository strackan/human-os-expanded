/**
 * Workflow Determination Logic
 *
 * Determines which workflows a customer should receive based on their data
 * Supports 4 workflow types: renewal, strategic, opportunity, risk
 * Thresholds loaded from configuration
 *
 * Ported from automation-backup JavaScript implementation to TypeScript
 */

import { WorkflowType, type CustomerData } from './types';

/**
 * Hardcoded workflow thresholds (Fallback)
 * Used only if database config is not available
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
 * Workflow Thresholds Interface
 */
export interface WorkflowThresholds {
  strategic_account_plans: string[];
  opportunity_score_min: number;
  risk_score_min: number;
}

/**
 * Get workflow determination thresholds
 * Currently returns fallback thresholds - will be enhanced to load from database
 *
 * @returns Workflow thresholds
 */
export function getWorkflowThresholds(): WorkflowThresholds {
  // TODO: Load from database/config when configuration system is implemented
  return WORKFLOW_THRESHOLDS_FALLBACK;
}

/**
 * Check if customer should have a renewal workflow
 * Renewal workflows are assigned to all customers with an active renewal
 *
 * @param customer - Customer data
 * @returns true if customer should have renewal workflow
 */
export function shouldHaveRenewalWorkflow(customer: CustomerData): boolean {
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
    const daysOverdue = Math.floor((today.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysOverdue < 30; // Still relevant if less than 30 days overdue
  }

  return false;
}

/**
 * Check if customer should have a strategic workflow
 * Strategic workflows are for high-touch accounts (invest/expand plans)
 *
 * @param customer - Customer data
 * @returns true if customer should have strategic workflow
 */
export function shouldHaveStrategicWorkflow(customer: CustomerData): boolean {
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
 * @param customer - Customer data
 * @returns true if customer should have opportunity workflow
 */
export function shouldHaveOpportunityWorkflow(customer: CustomerData): boolean {
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
 * @param customer - Customer data
 * @returns true if customer should have risk workflow
 */
export function shouldHaveRiskWorkflow(customer: CustomerData): boolean {
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
 * @param customer - Customer data with all context
 * @returns Array of workflow types (e.g., ['renewal', 'strategic'])
 */
export function determineWorkflowsForCustomer(customer: CustomerData): WorkflowType[] {
  const workflows: WorkflowType[] = [];

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
 * Workflow Explanation Interface
 */
export interface WorkflowExplanation {
  customer_id: string;
  domain: string;
  workflows: WorkflowType[];
  reasons: {
    renewal?: string;
    strategic?: string;
    opportunity?: string;
    risk?: string;
    none?: string;
  };
}

/**
 * Get explanation of why a customer has specific workflows
 * Useful for debugging and transparency
 *
 * @param customer - Customer data
 * @returns Explanation object with reasons for each workflow
 */
export function getWorkflowDeterminationExplanation(customer: CustomerData): WorkflowExplanation {
  const thresholds = getWorkflowThresholds();

  const explanation: WorkflowExplanation = {
    customer_id: customer.customer_id || customer.id || '',
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
