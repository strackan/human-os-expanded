/**
 * Account Review Conversation Types (v0.1.12)
 *
 * Extended types for the new conversation-based account review flow
 * that includes Strategic Account Plan creation and Intel capture.
 */

import type { AccountReviewPhase } from '@/lib/workflows/llm/systemPrompts';

/**
 * Conversation mode determines UX behavior
 */
export type ConversationMode = 'deep-dive' | 'quick-review';

/**
 * Strategic quadrant (calculated from Risk × Opportunity)
 */
export type StrategicQuadrant = 'invest' | 'expand' | 'rescue' | 'maintain';

/**
 * CSM-selected strategy
 */
export type AccountStrategy = 'invest' | 'expand' | 'save' | 'monitor' | 'maintain';

/**
 * Activity types for Strategic Account Plan
 */
export type ActivityType =
  | 'qbr'
  | 'executive_meeting'
  | 'training'
  | 'renewal_prep'
  | 'expansion_pitch'
  | 'health_check'
  | 'success_planning'
  | 'onboarding'
  | 'risk_mitigation'
  | 'custom';

/**
 * Activity status
 */
export type ActivityStatus = 'planned' | 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'overdue';

/**
 * Intel captured during phase review
 */
export interface PhaseIntel {
  phaseId: AccountReviewPhase;
  aiAssessment: string;
  csmNotes?: string;
  agreement: 'agreed' | 'modified';
  agreedAt: string;
  riskImpact?: number;
  opportunityImpact?: number;
}

/**
 * Planned activity in Strategic Account Plan
 */
export interface PlannedActivity {
  id?: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  targetQuarter?: number;
  targetDate?: string;
  assignedTo?: string;
  status: ActivityStatus;
}

/**
 * Strategic Account Plan state
 */
export interface AccountPlanState {
  id?: string;
  planYear: number;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'active' | 'completed';

  // Strategy selection
  strategy: AccountStrategy;
  calculatedQuadrant: StrategicQuadrant;
  differsFromQuadrant: boolean;
  rationale?: string;

  // Scores at creation
  riskScoreAtCreation?: number;
  opportunityScoreAtCreation?: number;
  healthScoreAtCreation?: number;
  tierAtCreation?: string;
  arrAtCreation?: number;

  // Planned activities
  activities: PlannedActivity[];
}

/**
 * Certification state
 */
export interface CertificationState {
  status: 'pending' | 'certified';
  certifiedAt?: string;
  certifiedBy?: string;
}

/**
 * Extended Account Review State with conversation features
 */
export interface AccountReviewConversationState {
  // Base identifiers
  customerId: string;
  customerName: string;

  // Conversation mode
  conversationMode: ConversationMode;
  autoAdvanceEnabled: boolean;
  autoAdvanceSecondsRemaining?: number;

  // Phase tracking
  currentPhase: AccountReviewPhase;
  phases: AccountReviewPhase[];

  // Intel captured during review
  phaseIntel: Record<string, PhaseIntel>;

  // Quadrant and scores
  calculatedQuadrant: StrategicQuadrant;
  currentRiskScore: number;
  currentOpportunityScore: number;

  // Strategic Account Plan
  accountPlan: AccountPlanState;

  // Existing plan (if any)
  existingPlanId?: string;
  existingPlanYear?: number;

  // Certification
  certification: CertificationState;

  // Timestamps
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

/**
 * Default activities suggested per strategy
 */
export const STRATEGY_DEFAULT_ACTIVITIES: Record<AccountStrategy, Partial<PlannedActivity>[]> = {
  invest: [
    { activityType: 'executive_meeting', title: 'Executive Sponsor Meeting', targetQuarter: 1 },
    { activityType: 'qbr', title: 'Q1 Business Review', targetQuarter: 1 },
    { activityType: 'expansion_pitch', title: 'Expansion Discussion', targetQuarter: 2 },
    { activityType: 'qbr', title: 'Q2 Business Review', targetQuarter: 2 },
    { activityType: 'qbr', title: 'Q3 Business Review', targetQuarter: 3 },
    { activityType: 'renewal_prep', title: 'Renewal Preparation', targetQuarter: 4 },
    { activityType: 'qbr', title: 'Q4 Business Review', targetQuarter: 4 },
  ],
  expand: [
    { activityType: 'qbr', title: 'Q1 Business Review', targetQuarter: 1 },
    { activityType: 'expansion_pitch', title: 'Product Expansion Discussion', targetQuarter: 1 },
    { activityType: 'training', title: 'New Feature Training', targetQuarter: 2 },
    { activityType: 'qbr', title: 'Q2 Business Review', targetQuarter: 2 },
    { activityType: 'success_planning', title: 'Success Plan Review', targetQuarter: 3 },
    { activityType: 'renewal_prep', title: 'Renewal Preparation', targetQuarter: 4 },
  ],
  save: [
    { activityType: 'risk_mitigation', title: 'Risk Assessment Follow-up', targetQuarter: 1 },
    { activityType: 'executive_meeting', title: 'Executive Alignment', targetQuarter: 1 },
    { activityType: 'health_check', title: 'Health Check Review', targetQuarter: 2 },
    { activityType: 'success_planning', title: 'Success Plan Revision', targetQuarter: 2 },
    { activityType: 'qbr', title: 'Progress Review', targetQuarter: 3 },
    { activityType: 'renewal_prep', title: 'Early Renewal Discussion', targetQuarter: 3 },
  ],
  monitor: [
    { activityType: 'health_check', title: 'Q1 Health Check', targetQuarter: 1 },
    { activityType: 'health_check', title: 'Q2 Health Check', targetQuarter: 2 },
    { activityType: 'health_check', title: 'Q3 Health Check', targetQuarter: 3 },
    { activityType: 'renewal_prep', title: 'Renewal Preparation', targetQuarter: 4 },
  ],
  maintain: [
    { activityType: 'qbr', title: 'Mid-Year Review', targetQuarter: 2 },
    { activityType: 'renewal_prep', title: 'Renewal Preparation', targetQuarter: 4 },
  ],
};

/**
 * Map quadrant to suggested strategy
 */
export const QUADRANT_TO_STRATEGY: Record<StrategicQuadrant, AccountStrategy> = {
  invest: 'invest',
  expand: 'expand',
  rescue: 'save',
  maintain: 'maintain',
};

/**
 * Strategy display labels
 */
export const STRATEGY_LABELS: Record<AccountStrategy, { label: string; description: string; color: string }> = {
  invest: {
    label: 'Invest',
    description: 'High-touch engagement with expansion focus',
    color: 'green',
  },
  expand: {
    label: 'Expand',
    description: 'Growth-focused with upsell opportunities',
    color: 'blue',
  },
  save: {
    label: 'Save',
    description: 'Retention focus with risk mitigation',
    color: 'orange',
  },
  monitor: {
    label: 'Monitor',
    description: 'Watch for changes, limited touch',
    color: 'yellow',
  },
  maintain: {
    label: 'Maintain',
    description: 'Steady state, standard engagement',
    color: 'gray',
  },
};

/**
 * Calculate quadrant from scores
 */
export function calculateQuadrant(riskScore: number, opportunityScore: number): StrategicQuadrant {
  const highRiskThreshold = 50;
  const highOppThreshold = 50;

  const isHighRisk = riskScore >= highRiskThreshold;
  const isHighOpp = opportunityScore >= highOppThreshold;

  if (isHighRisk && isHighOpp) return 'invest';
  if (!isHighRisk && isHighOpp) return 'expand';
  if (isHighRisk && !isHighOpp) return 'rescue';
  return 'maintain';
}

/**
 * Create initial conversation state
 */
export function createConversationState(
  customerId: string,
  customerName: string,
  riskScore: number,
  opportunityScore: number,
  existingPlanId?: string
): AccountReviewConversationState {
  const quadrant = calculateQuadrant(riskScore, opportunityScore);
  const suggestedStrategy = QUADRANT_TO_STRATEGY[quadrant];
  const currentYear = new Date().getFullYear();

  return {
    customerId,
    customerName,
    conversationMode: existingPlanId ? 'quick-review' : 'deep-dive',
    autoAdvanceEnabled: !!existingPlanId, // Only in quick-review mode
    currentPhase: 'usage',
    phases: ['usage', 'contract', 'contacts', 'expansion', 'risk'],
    phaseIntel: {},
    calculatedQuadrant: quadrant,
    currentRiskScore: riskScore,
    currentOpportunityScore: opportunityScore,
    accountPlan: {
      planYear: currentYear,
      periodStart: `${currentYear}-01-01`,
      periodEnd: `${currentYear}-12-31`,
      status: 'draft',
      strategy: suggestedStrategy,
      calculatedQuadrant: quadrant,
      differsFromQuadrant: false,
      riskScoreAtCreation: riskScore,
      opportunityScoreAtCreation: opportunityScore,
      activities: STRATEGY_DEFAULT_ACTIVITIES[suggestedStrategy].map((a, i) => ({
        id: undefined,
        activityType: a.activityType!,
        title: a.title!,
        description: a.description,
        targetQuarter: a.targetQuarter,
        targetDate: undefined,
        status: 'planned' as ActivityStatus,
      })),
    },
    existingPlanId,
    existingPlanYear: existingPlanId ? currentYear : undefined,
    certification: {
      status: 'pending',
    },
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}
