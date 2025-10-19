/**
 * Workflow Scoring Algorithm
 *
 * Calculates priority scores for workflows to enable intelligent ranking
 * All weights and thresholds are loaded from configuration
 *
 * Ported from automation-backup JavaScript implementation to TypeScript
 */

import { WorkflowType, type WorkflowInstance, type CustomerData, type UserContext, type PriorityFactors, createPriorityFactors, ExperienceLevel } from './types';

/**
 * Scoring Configuration Interface
 */
export interface ScoringConfig {
  // ARR-based scoring
  arr_breakpoints: {
    high: number;    // $150k+
    medium: number;  // $100k+
  };
  arr_multipliers: {
    high: number;    // 2x for $150k+
    medium: number;  // 1.5x for $100k-$150k
    low: number;     // 1x for < $100k
  };

  // Renewal stage urgency scores
  renewal_stage_urgency: {
    [stage: string]: number;
  };

  // Account plan multipliers
  account_plan_multipliers: {
    invest: number;
    expand: number;
    manage: number;
    monitor: number;
  };

  // Strategic workflow base scores (by account plan type)
  strategic_base_scores: {
    invest: number;
    expand: number;
  };

  // Opportunity workflow scoring
  opportunity_base_score: number;
  opportunity_score_multiplier: number; // multiply opportunity_score by this

  // Risk workflow scoring
  risk_base_score: number;
  risk_score_multiplier: number; // multiply risk_score by this

  // User context factors
  workload_penalty_per_workflow: number;  // reduce score by N points per existing workflow
  experience_multipliers: {
    expert: number;
    senior: number;
    mid: number;
    junior: number;
  };
}

/**
 * Hardcoded Scoring Configuration (Fallback)
 * Used only if database config is not available
 */
const SCORING_CONFIG_FALLBACK: ScoringConfig = {
  // ARR-based scoring
  arr_breakpoints: {
    high: 150000,    // $150k+
    medium: 100000   // $100k+
  },
  arr_multipliers: {
    high: 2.0,       // 2x for $150k+
    medium: 1.5,     // 1.5x for $100k-$150k
    low: 1.0         // 1x for < $100k
  },

  // Renewal stage urgency scores
  renewal_stage_urgency: {
    'Overdue': 100,
    'Emergency': 90,
    'Critical': 80,
    'Signature': 70,
    'Finalize': 60,
    'Negotiate': 50,
    'Engage': 40,
    'Prepare': 30,
    'Monitor': 20,
    // Lowercase variants for flexibility
    'overdue': 100,
    'emergency': 90,
    'critical': 80,
    'signature': 70,
    'finalize': 60,
    'negotiate': 50,
    'engage': 40,
    'prepare': 30,
    'monitor': 20
  },

  // Account plan multipliers
  account_plan_multipliers: {
    'invest': 1.5,
    'expand': 1.3,
    'manage': 1.0,
    'monitor': 0.8
  },

  // Strategic workflow base scores (by account plan type)
  strategic_base_scores: {
    'invest': 70,
    'expand': 60
  },

  // Opportunity workflow scoring
  opportunity_base_score: 50,
  opportunity_score_multiplier: 0.5, // multiply opportunity_score by this

  // Risk workflow scoring
  risk_base_score: 60,
  risk_score_multiplier: 0.6, // multiply risk_score by this

  // User context factors
  workload_penalty_per_workflow: 2,  // reduce score by 2 points per existing workflow
  experience_multipliers: {
    'expert': 1.2,   // Senior CSMs can handle more complex/urgent workflows
    'senior': 1.1,
    'mid': 1.0,
    'junior': 0.9    // Junior CSMs get slightly lower priority for complex workflows
  }
};

/**
 * Get scoring configuration
 * Currently returns fallback config - will be enhanced to load from database
 *
 * @returns Scoring configuration
 */
export function getScoringConfig(): ScoringConfig {
  // TODO: Load from database/config when configuration system is implemented
  return SCORING_CONFIG_FALLBACK;
}

/**
 * Get ARR multiplier based on customer ARR
 *
 * @param arr - Annual recurring revenue
 * @returns Multiplier (1.0, 1.5, or 2.0)
 */
export function getARRMultiplier(arr: number): number {
  const config = getScoringConfig();

  if (!arr || arr <= 0) return config.arr_multipliers.low;

  if (arr >= config.arr_breakpoints.high) {
    return config.arr_multipliers.high;
  } else if (arr >= config.arr_breakpoints.medium) {
    return config.arr_multipliers.medium;
  } else {
    return config.arr_multipliers.low;
  }
}

/**
 * Get urgency score for renewal stage
 *
 * @param stage - Renewal stage name
 * @returns Urgency score (0-100)
 */
export function getRenewalStageUrgency(stage: string | undefined): number {
  const config = getScoringConfig();
  if (!stage) return 0;
  return config.renewal_stage_urgency[stage] || 0;
}

/**
 * Get account plan multiplier
 *
 * @param accountPlan - Account plan type
 * @returns Multiplier (0.8 - 1.5)
 */
export function getAccountPlanMultiplier(accountPlan: string | null | undefined): number {
  const config = getScoringConfig();
  if (!accountPlan) return 1.0;
  return config.account_plan_multipliers[accountPlan as keyof typeof config.account_plan_multipliers] || 1.0;
}

/**
 * Get user experience multiplier
 *
 * @param experienceLevel - junior|mid|senior|expert
 * @returns Multiplier (0.9 - 1.2)
 */
export function getUserExperienceMultiplier(experienceLevel: ExperienceLevel | undefined): number {
  const config = getScoringConfig();
  if (!experienceLevel) return 1.0;
  return config.experience_multipliers[experienceLevel] || 1.0;
}

/**
 * Calculate workload penalty based on current assignments
 *
 * @param currentWorkload - Number of active workflows assigned
 * @returns Penalty score (negative)
 */
export function getWorkloadPenalty(currentWorkload: number | undefined): number {
  const config = getScoringConfig();
  if (!currentWorkload || currentWorkload <= 0) return 0;
  return -(currentWorkload * config.workload_penalty_per_workflow);
}

/**
 * Workflow Context Interface (extracted from workflow/customer metadata)
 */
interface WorkflowContext {
  renewal_stage?: string;
  stage?: string;
  account_plan?: string | null;
  opportunity_score?: number | null;
  risk_score?: number | null;
  days_until_renewal?: number | null;
}

/**
 * Calculate base score for a workflow based on type and context
 *
 * @param workflowType - Type of workflow (renewal|strategic|opportunity|risk)
 * @param context - Workflow context (customer data, stage, scores, etc.)
 * @returns Base score before multipliers
 */
export function calculateBaseScore(workflowType: WorkflowType, context: WorkflowContext): number {
  const config = getScoringConfig();

  switch (workflowType) {
    case WorkflowType.RENEWAL:
      // Base score comes from renewal stage urgency
      return getRenewalStageUrgency(context.renewal_stage || context.stage);

    case WorkflowType.STRATEGIC:
      // Base score from account plan type
      if (context.account_plan) {
        return config.strategic_base_scores[context.account_plan as keyof typeof config.strategic_base_scores] || 50;
      }
      return 50;

    case WorkflowType.OPPORTUNITY:
      // Base score + opportunity score contribution
      const oppScore = context.opportunity_score || 0;
      return config.opportunity_base_score + (oppScore * config.opportunity_score_multiplier);

    case WorkflowType.RISK:
      // Base score + risk score contribution
      const riskScore = context.risk_score || 0;
      return config.risk_base_score + (riskScore * config.risk_score_multiplier);

    default:
      return 50; // Default base score
  }
}

/**
 * Calculate stage bonus for urgent situations
 *
 * @param workflowType - Type of workflow
 * @param context - Workflow context
 * @returns Bonus points (0-20)
 */
export function calculateStageBonus(workflowType: WorkflowType, context: WorkflowContext): number {
  if (workflowType === WorkflowType.RENEWAL) {
    // Extra bonus for critical renewal stages
    const stage = context.renewal_stage || context.stage;
    if (stage === 'Overdue' || stage === 'overdue') return 20;
    if (stage === 'Emergency' || stage === 'emergency') return 15;
    if (stage === 'Critical' || stage === 'critical') return 10;
  }
  return 0;
}

/**
 * Scoring Result Interface
 */
export interface ScoringResult {
  totalScore: number;
  factors: PriorityFactors;
}

/**
 * Calculate workflow priority score
 * Main scoring function with transparent factor breakdown
 *
 * @param workflow - Workflow instance
 * @param customer - Customer data
 * @param userContext - CSM user context (optional)
 * @returns Scoring result with total score and factor breakdown
 */
export function calculateWorkflowPriority(
  workflow: WorkflowInstance,
  customer: CustomerData,
  userContext: UserContext | null = null
): ScoringResult {
  // Extract context from workflow or customer
  const context: WorkflowContext = {
    renewal_stage: workflow.metadata?.renewal_stage || customer.renewal_stage,
    stage: workflow.metadata?.stage,
    account_plan: workflow.metadata?.account_plan || customer.account_plan,
    opportunity_score: workflow.metadata?.opportunity_score || customer.opportunity_score,
    risk_score: workflow.metadata?.risk_score || customer.risk_score,
    days_until_renewal: workflow.metadata?.days_until_renewal || customer.days_until_renewal
  };

  // Calculate base score
  const base_score = calculateBaseScore(workflow.type, context);

  // Calculate multipliers
  const arr_multiplier = getARRMultiplier(customer.arr);
  const account_plan_multiplier = getAccountPlanMultiplier(context.account_plan);
  const experience_multiplier = userContext ? getUserExperienceMultiplier(userContext.experience_level) : 1.0;

  // Calculate bonuses and penalties
  const stage_bonus = calculateStageBonus(workflow.type, context);
  const workload_penalty = userContext ? getWorkloadPenalty(userContext.current_workload) : 0;

  // Calculate total score
  // Formula: ((base_score + stage_bonus) * arr_multiplier * account_plan_multiplier * experience_multiplier) + workload_penalty
  const totalScore = Math.round(
    ((base_score + stage_bonus) * arr_multiplier * account_plan_multiplier * experience_multiplier) + workload_penalty
  );

  // Build transparent factor breakdown
  const factors = createPriorityFactors({
    base_score,
    arr_multiplier,
    urgency_score: base_score, // For renewal workflows, base_score IS the urgency
    stage_bonus,
    account_plan_multiplier,
    opportunity_bonus: context.opportunity_score || 0,
    risk_penalty: 0, // Currently not penalizing for risk, but structure supports it
    custom: {
      workload_penalty,
      experience_multiplier,
      workflow_type: workflow.type,
      customer_arr: customer.arr
    }
  });

  return {
    totalScore,
    factors
  };
}

/**
 * Compare two workflows by priority score (for sorting)
 * Higher priority comes first
 *
 * @param workflowA - First workflow assignment
 * @param workflowB - Second workflow assignment
 * @returns Comparison result
 */
export function compareWorkflows(
  workflowA: { priority_score?: number; workflow?: { priority_score?: number } },
  workflowB: { priority_score?: number; workflow?: { priority_score?: number } }
): number {
  // Extract scores - check outer priority_score first (workflow assignments),
  // then fall back to nested workflow.priority_score (workflow instances)
  const scoreA = workflowA.priority_score ?? workflowA.workflow?.priority_score ?? 0;
  const scoreB = workflowB.priority_score ?? workflowB.workflow?.priority_score ?? 0;

  // Higher score comes first (descending order)
  return scoreB - scoreA;
}

/**
 * Score Explanation Interface
 */
export interface ScoreExplanation {
  total_score: number;
  breakdown: Array<{
    component: string;
    value: number;
    description: string;
  }>;
  calculation: string;
}

/**
 * Get human-readable explanation of workflow score
 *
 * @param scoringResult - Result from calculateWorkflowPriority
 * @param workflow - Workflow instance
 * @param customer - Customer data
 * @returns Explanation object
 */
export function explainWorkflowScore(
  scoringResult: ScoringResult,
  workflow: WorkflowInstance,
  customer: CustomerData
): ScoreExplanation {
  const { totalScore, factors } = scoringResult;
  const explanation: ScoreExplanation = {
    total_score: totalScore,
    breakdown: [],
    calculation: ''
  };

  // Base score explanation
  explanation.breakdown.push({
    component: 'Base Score',
    value: factors.base_score,
    description: `${workflow.type} workflow base score`
  });

  // ARR multiplier
  if (factors.arr_multiplier !== 1.0) {
    explanation.breakdown.push({
      component: 'ARR Multiplier',
      value: factors.arr_multiplier,
      description: `Customer ARR: $${customer.arr?.toLocaleString()} (${factors.arr_multiplier}x)`
    });
  }

  // Stage bonus
  if (factors.stage_bonus > 0) {
    explanation.breakdown.push({
      component: 'Urgency Bonus',
      value: factors.stage_bonus,
      description: `Critical stage bonus: +${factors.stage_bonus} points`
    });
  }

  // Account plan multiplier
  if (factors.account_plan_multiplier !== 1.0) {
    explanation.breakdown.push({
      component: 'Account Plan',
      value: factors.account_plan_multiplier,
      description: `Account plan: ${factors.custom.workflow_type === 'strategic' ? 'strategic account' : 'standard'} (${factors.account_plan_multiplier}x)`
    });
  }

  // Experience multiplier
  if (factors.custom.experience_multiplier !== 1.0) {
    explanation.breakdown.push({
      component: 'CSM Experience',
      value: factors.custom.experience_multiplier,
      description: `CSM experience adjustment (${factors.custom.experience_multiplier}x)`
    });
  }

  // Workload penalty
  if (factors.custom.workload_penalty !== 0) {
    explanation.breakdown.push({
      component: 'Workload Adjustment',
      value: factors.custom.workload_penalty,
      description: `Current workload penalty: ${factors.custom.workload_penalty} points`
    });
  }

  // Calculation summary
  explanation.calculation = `(${factors.base_score} + ${factors.stage_bonus}) × ${factors.arr_multiplier} × ${factors.account_plan_multiplier} × ${factors.custom.experience_multiplier} + ${factors.custom.workload_penalty} = ${totalScore}`;

  return explanation;
}
