/**
 * Workflow Scoring Configuration
 *
 * Central configuration for workflow prioritization and scoring.
 * All weights, thresholds, and multipliers that control how workflows
 * are prioritized and assigned.
 *
 * NOTE: Values can be edited here by non-technical users. Comments explain
 * what each value does. In the future, this can be moved to a database table.
 */

import { AccountPlan, ExperienceLevel } from '../types';

/**
 * ARR Breakpoints and Multipliers
 * Controls how customer value (ARR) affects workflow priority
 */
export const ARR_CONFIG = {
  breakpoints: {
    high: 150000,    // $150k+ ARR customers get highest priority
    medium: 100000   // $100k-$150k ARR customers get medium priority
  },
  multipliers: {
    high: 2.0,       // 2x priority for $150k+ customers
    medium: 1.5,     // 1.5x priority for $100k-$150k customers
    low: 1.0         // 1x priority for < $100k customers
  }
};

/**
 * Account Plan Multipliers
 * Controls how account engagement strategy affects workflow priority
 *
 * invest = High-touch strategic accounts (most attention)
 * expand = Growth-focused accounts (high attention)
 * manage = Standard accounts (normal attention)
 * monitor = Low-touch accounts (minimal attention)
 */
export const ACCOUNT_PLAN_MULTIPLIERS: Record<AccountPlan, number> = {
  [AccountPlan.INVEST]: 1.5,   // 50% higher priority for strategic accounts
  [AccountPlan.EXPAND]: 1.3,   // 30% higher priority for growth accounts
  [AccountPlan.MANAGE]: 1.0,   // Standard priority
  [AccountPlan.MONITOR]: 0.8   // 20% lower priority for low-touch accounts
};

/**
 * Renewal Stage Urgency Scores
 * Maps renewal stages to urgency scores (0-100)
 * Higher score = more urgent
 *
 * These scores determine the base priority for renewal workflows.
 * Stages progress from Monitor (least urgent) to Overdue (most urgent).
 */
export const RENEWAL_STAGE_URGENCY: Record<string, number> = {
  'Overdue': 100,     // CRITICAL: Renewal is past due
  'Emergency': 90,    // HIGH: Within 7 days of renewal
  'Critical': 80,     // HIGH: Within 14 days of renewal
  'Signature': 70,    // MEDIUM-HIGH: Awaiting signature
  'Finalize': 60,     // MEDIUM: Finalizing terms
  'Negotiate': 50,    // MEDIUM: Active negotiation
  'Engage': 40,       // MEDIUM-LOW: Initial engagement
  'Prepare': 30,      // LOW: Early preparation phase
  'Monitor': 20       // LOW: Monitoring only
};

/**
 * Strategic Workflow Base Scores
 * Base priority scores for strategic workflows by account plan type
 *
 * Only 'invest' and 'expand' plans get strategic workflows
 */
export const STRATEGIC_BASE_SCORES: Record<string, number> = {
  'invest': 70,    // High-touch strategic planning workflows
  'expand': 60     // Growth-focused expansion workflows
};

/**
 * Opportunity Workflow Scoring
 * Controls priority for upsell/expansion opportunity workflows
 */
export const OPPORTUNITY_CONFIG = {
  base_score: 50,           // Base priority score for opportunity workflows
  score_multiplier: 0.5,    // Multiply customer opportunity_score by this (0-100 scale)
  min_threshold: 70         // Minimum opportunity_score to trigger workflow
};

/**
 * Risk Workflow Scoring
 * Controls priority for at-risk customer intervention workflows
 */
export const RISK_CONFIG = {
  base_score: 60,           // Base priority score for risk workflows
  score_multiplier: 0.6,    // Multiply customer risk_score by this (0-100 scale)
  min_threshold: 60         // Minimum risk_score to trigger workflow
};

/**
 * Workflow Determination Thresholds
 * Controls when different workflow types are triggered
 */
export const WORKFLOW_THRESHOLDS = {
  // Which account plans trigger strategic workflows
  strategic_account_plans: [AccountPlan.INVEST, AccountPlan.EXPAND],

  // Minimum scores to trigger opportunity and risk workflows
  opportunity_score_min: OPPORTUNITY_CONFIG.min_threshold,
  risk_score_min: RISK_CONFIG.min_threshold
};

/**
 * User Context Factors
 * How CSM experience and workload affect workflow assignment
 */
export const USER_CONTEXT_CONFIG = {
  // Penalty per workflow already assigned (reduces priority for overloaded CSMs)
  workload_penalty_per_workflow: 2,

  // Experience level multipliers (affects workflow complexity assignment)
  experience_multipliers: {
    [ExperienceLevel.EXPERT]: 1.2,   // Senior CSMs handle more complex workflows
    [ExperienceLevel.SENIOR]: 1.1,   // Senior CSMs slight boost
    [ExperienceLevel.MID]: 1.0,      // Standard for mid-level
    [ExperienceLevel.JUNIOR]: 0.9    // Junior CSMs get slightly lower priority on complex workflows
  } as Record<ExperienceLevel, number>
};

/**
 * Stage Bonus Configuration
 * Extra priority points for critical situations
 */
export const STAGE_BONUS_CONFIG = {
  overdue: 20,      // +20 points for overdue renewals
  emergency: 15,    // +15 points for emergency renewals
  critical: 10      // +10 points for critical renewals
};

/**
 * Get ARR multiplier based on customer ARR
 */
export function getARRMultiplier(arr: number): number {
  if (!arr || arr <= 0) return ARR_CONFIG.multipliers.low;

  if (arr >= ARR_CONFIG.breakpoints.high) {
    return ARR_CONFIG.multipliers.high;
  } else if (arr >= ARR_CONFIG.breakpoints.medium) {
    return ARR_CONFIG.multipliers.medium;
  } else {
    return ARR_CONFIG.multipliers.low;
  }
}

/**
 * Get account plan multiplier
 */
export function getAccountPlanMultiplier(accountPlan: string | null): number {
  if (!accountPlan) return 1.0;
  return ACCOUNT_PLAN_MULTIPLIERS[accountPlan as AccountPlan] ?? 1.0;
}

/**
 * Get renewal stage urgency score
 */
export function getRenewalStageUrgency(stage: string | null): number {
  if (!stage) return 0;
  return RENEWAL_STAGE_URGENCY[stage] ?? 0;
}

/**
 * Get user experience multiplier
 */
export function getUserExperienceMultiplier(experienceLevel: string | null): number {
  if (!experienceLevel) return 1.0;
  return USER_CONTEXT_CONFIG.experience_multipliers[experienceLevel as ExperienceLevel] ?? 1.0;
}

/**
 * Get workload penalty
 */
export function getWorkloadPenalty(currentWorkload: number): number {
  if (!currentWorkload || currentWorkload <= 0) return 0;
  return -(currentWorkload * USER_CONTEXT_CONFIG.workload_penalty_per_workflow);
}

/**
 * Complete scoring configuration object
 * Export for backward compatibility with original system
 */
export const SCORING_CONFIG = {
  arr_breakpoints: ARR_CONFIG.breakpoints,
  arr_multipliers: ARR_CONFIG.multipliers,
  renewal_stage_urgency: RENEWAL_STAGE_URGENCY,
  account_plan_multipliers: ACCOUNT_PLAN_MULTIPLIERS,
  strategic_base_scores: STRATEGIC_BASE_SCORES,
  opportunity_base_score: OPPORTUNITY_CONFIG.base_score,
  opportunity_score_multiplier: OPPORTUNITY_CONFIG.score_multiplier,
  risk_base_score: RISK_CONFIG.base_score,
  risk_score_multiplier: RISK_CONFIG.score_multiplier,
  workload_penalty_per_workflow: USER_CONTEXT_CONFIG.workload_penalty_per_workflow,
  experience_multipliers: USER_CONTEXT_CONFIG.experience_multipliers
};
