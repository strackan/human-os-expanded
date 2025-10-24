/**
 * Workflow Scoring Algorithm
 *
 * Calculates priority scores for workflows to enable intelligent ranking
 * All weights and thresholds are loaded from database with caching
 */

const { WorkflowType } = require('./workflow-types');
const { createPriorityFactors } = require('./workflow-types');
const { getAllConfig, getAllScoringProperties } = require('./config-data-access');

/**
 * Hardcoded Scoring Configuration (Fallback)
 * Used only if database is empty or not available
 */
const SCORING_CONFIG_FALLBACK = {
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

  // Renewal stage urgency scores (loaded from workflows table instead)
  renewal_stage_urgency: {
    'Overdue': 100,
    'Emergency': 90,
    'Critical': 80,
    'Signature': 70,
    'Finalize': 60,
    'Negotiate': 50,
    'Engage': 40,
    'Prepare': 30,
    'Monitor': 20
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
 * Build renewal stage urgency mapping from workflows table
 * Maps stage names to urgency scores
 *
 * @returns {Object} Mapping of stage name to urgency score
 */
function buildRenewalStageUrgency() {
  try {
    const { getWorkflowsByPlan } = require('./config-data-access');
    const renewalWorkflows = getWorkflowsByPlan('plan-renewal');

    const mapping = {};
    renewalWorkflows.forEach(workflow => {
      // Map both workflow_name (e.g., "Overdue Stage") and workflow_key (e.g., "overdue")
      // to urgency_score for flexible lookup
      const stageName = workflow.workflow_name.replace(' Stage', ''); // "Overdue Stage" → "Overdue"
      mapping[stageName] = workflow.urgency_score || 0;
      mapping[workflow.workflow_key] = workflow.urgency_score || 0;
    });

    return mapping;
  } catch (error) {
    console.warn('[workflow-scoring] Could not load renewal urgency from database:', error.message);
    return {};
  }
}

/**
 * Get scoring configuration from database (cached)
 * Falls back to hardcoded config if database unavailable
 *
 * @returns {Object} Scoring configuration
 */
function getScoringConfig() {
  try {
    // Get all config (uses cache if available)
    const allConfig = getAllConfig();

    // Return scoring config if available
    if (allConfig && allConfig.scoring) {
      const config = allConfig.scoring;

      // Add renewal stage urgency from workflows table
      if (!config.renewal_stage_urgency || Object.keys(config.renewal_stage_urgency).length === 0) {
        config.renewal_stage_urgency = buildRenewalStageUrgency();
      }

      return config;
    }

    // Fallback: try direct scoring properties query
    const scoringProps = getAllScoringProperties();
    if (scoringProps && Object.keys(scoringProps).length > 0) {
      // Add renewal stage urgency from workflows table
      scoringProps.renewal_stage_urgency = buildRenewalStageUrgency();
      return scoringProps;
    }
  } catch (error) {
    console.warn('[workflow-scoring] Database config unavailable, using fallback:', error.message);
  }

  // Final fallback to hardcoded config
  return SCORING_CONFIG_FALLBACK;
}

// Lazy-loaded reference to config (initialized on first use)
let SCORING_CONFIG = null;

/**
 * Get ARR multiplier based on customer ARR
 *
 * @param {number} arr - Annual recurring revenue
 * @returns {number} Multiplier (1.0, 1.5, or 2.0)
 */
function getARRMultiplier(arr) {
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
 * @param {string} stage - Renewal stage name
 * @returns {number} Urgency score (0-100)
 */
function getRenewalStageUrgency(stage) {
  const config = getScoringConfig();
  return config.renewal_stage_urgency[stage] || 0;
}

/**
 * Get account plan multiplier
 *
 * @param {string} accountPlan - Account plan type
 * @returns {number} Multiplier (0.8 - 1.5)
 */
function getAccountPlanMultiplier(accountPlan) {
  const config = getScoringConfig();
  if (!accountPlan) return 1.0;
  return config.account_plan_multipliers[accountPlan] || 1.0;
}

/**
 * Get user experience multiplier
 *
 * @param {string} experienceLevel - junior|mid|senior|expert
 * @returns {number} Multiplier (0.9 - 1.2)
 */
function getUserExperienceMultiplier(experienceLevel) {
  const config = getScoringConfig();
  if (!experienceLevel) return 1.0;
  return config.experience_multipliers[experienceLevel] || 1.0;
}

/**
 * Calculate workload penalty based on current assignments
 *
 * @param {number} currentWorkload - Number of active workflows assigned
 * @returns {number} Penalty score (negative)
 */
function getWorkloadPenalty(currentWorkload) {
  const config = getScoringConfig();
  if (!currentWorkload || currentWorkload <= 0) return 0;
  return -(currentWorkload * config.workload_penalty_per_workflow);
}

/**
 * Calculate base score for a workflow based on type and context
 *
 * @param {string} workflowType - Type of workflow (renewal|strategic|opportunity|risk)
 * @param {Object} context - Workflow context (customer data, stage, scores, etc.)
 * @returns {number} Base score before multipliers
 */
function calculateBaseScore(workflowType, context) {
  const config = getScoringConfig();

  switch (workflowType) {
    case WorkflowType.RENEWAL:
      // Base score comes from renewal stage urgency
      return getRenewalStageUrgency(context.renewal_stage || context.stage);

    case WorkflowType.STRATEGIC:
      // Base score from account plan type
      return config.strategic_base_scores[context.account_plan] || 50;

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
 * @param {string} workflowType - Type of workflow
 * @param {Object} context - Workflow context
 * @returns {number} Bonus points (0-20)
 */
function calculateStageBonus(workflowType, context) {
  if (workflowType === WorkflowType.RENEWAL) {
    // Extra bonus for critical renewal stages
    const stage = context.renewal_stage || context.stage;
    if (stage === 'Overdue') return 20;
    if (stage === 'Emergency') return 15;
    if (stage === 'Critical') return 10;
  }
  return 0;
}

/**
 * Calculate workflow priority score
 * Main scoring function with transparent factor breakdown
 *
 * @param {Object} workflow - Workflow instance
 * @param {Object} customer - Customer data
 * @param {Object} userContext - CSM user context (optional)
 * @returns {Object} {totalScore: number, factors: PriorityFactors}
 */
function calculateWorkflowPriority(workflow, customer, userContext = null) {
  // Extract context from workflow or customer
  const context = {
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
 * @param {Object} workflowA - First workflow assignment with priority_score
 * @param {Object} workflowB - Second workflow assignment with priority_score
 * @returns {number} Comparison result
 */
function compareWorkflows(workflowA, workflowB) {
  // Extract scores - check outer priority_score first (workflow assignments),
  // then fall back to nested workflow.priority_score (workflow instances)
  const scoreA = workflowA.priority_score ?? workflowA.workflow?.priority_score ?? 0;
  const scoreB = workflowB.priority_score ?? workflowB.workflow?.priority_score ?? 0;

  // Higher score comes first (descending order)
  return scoreB - scoreA;
}

/**
 * Get human-readable explanation of workflow score
 *
 * @param {Object} scoringResult - Result from calculateWorkflowPriority
 * @param {Object} workflow - Workflow instance
 * @param {Object} customer - Customer data
 * @returns {Object} Explanation object
 */
function explainWorkflowScore(scoringResult, workflow, customer) {
  const { totalScore, factors } = scoringResult;
  const explanation = {
    total_score: totalScore,
    breakdown: []
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

/**
 * Update scoring configuration
 * Updates database and invalidates cache
 * Note: This updates individual properties, not the entire config
 *
 * @param {Object} newConfig - New configuration values (key-value pairs)
 * @param {string} userId - User ID making the change (optional)
 */
function updateScoringConfig(newConfig, userId = 'system') {
  const { updateScoringProperty, invalidateCache } = require('./config-data-access');

  try {
    // Update each property in the database
    for (const [key, value] of Object.entries(newConfig)) {
      updateScoringProperty(key, value, userId);
    }

    // Cache is automatically invalidated by updateScoringProperty
    console.log(`[workflow-scoring] Updated ${Object.keys(newConfig).length} scoring properties`);
  } catch (error) {
    console.error('[workflow-scoring] Error updating scoring config:', error.message);
    throw error;
  }
}

module.exports = {
  // Main scoring functions
  calculateWorkflowPriority,
  compareWorkflows,
  explainWorkflowScore,

  // Helper functions
  getARRMultiplier,
  getRenewalStageUrgency,
  getAccountPlanMultiplier,
  getUserExperienceMultiplier,
  getWorkloadPenalty,

  // Configuration management
  updateScoringConfig,
  getScoringConfig
};
