/**
 * Account Review Context Builder (v0.1.12)
 *
 * Manages the accumulation and building of context across account review phases.
 * Each phase builds on prior approved phases to provide cumulative context to the LLM.
 *
 * Key responsibilities:
 * - Track phase approval state
 * - Build LLM prompts with accumulated context
 * - Format phase summaries for strategy synthesis
 */

import type { PhaseApproval, TabStatus } from '@/components/artifacts/TabbedContainerArtifact';
import {
  type AccountReviewPhase,
  type PhaseApprovalContext,
  ACCOUNT_REVIEW_PHASES,
  PHASE_DISPLAY_NAMES,
  buildAccountReviewPhasePrompt,
  buildSynthesisPrompt,
} from '@/lib/workflows/llm/systemPrompts';

/**
 * Account review state stored in workflow state
 */
export interface AccountReviewState {
  /** Customer ID for the review */
  customerId: string;
  /** Customer name for display */
  customerName: string;
  /** Phase approvals with LLM analysis and user comments */
  phaseApprovals: PhaseApproval[];
  /** Current active phase */
  currentPhase: AccountReviewPhase;
  /** Whether all phases are approved */
  allPhasesApproved: boolean;
  /** Synthesis result (populated after all phases approved) */
  synthesisResult?: SynthesisResult;
  /** Timestamp when review was started */
  startedAt: string;
  /** Timestamp when review was completed */
  completedAt?: string;
}

/**
 * Result of strategy synthesis
 */
export interface SynthesisResult {
  /** Engagement strategy summary */
  strategySummary: string;
  /** Meeting deck slides in PresentationArtifact format */
  deckSlides: any[];
  /** Renewal email draft */
  emailDraft: string;
  /** Meeting agenda */
  meetingAgenda: string;
  /** Raw LLM response */
  rawResponse: string;
  /** Generation timestamp */
  generatedAt: string;
}

/**
 * Initialize a new account review state
 */
export function createAccountReviewState(
  customerId: string,
  customerName: string
): AccountReviewState {
  return {
    customerId,
    customerName,
    phaseApprovals: ACCOUNT_REVIEW_PHASES.map((phaseId) => ({
      phaseId,
      status: 'pending' as TabStatus,
      llmAnalysis: undefined,
      userComments: undefined,
      approvedAt: undefined,
    })),
    currentPhase: 'usage',
    allPhasesApproved: false,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Get the current phase approval
 */
export function getCurrentPhaseApproval(
  state: AccountReviewState
): PhaseApproval | undefined {
  return state.phaseApprovals.find((p) => p.phaseId === state.currentPhase);
}

/**
 * Get prior approved phases (for context building)
 */
export function getPriorApprovedPhases(
  state: AccountReviewState
): PhaseApprovalContext[] {
  const currentIndex = ACCOUNT_REVIEW_PHASES.indexOf(state.currentPhase);

  return state.phaseApprovals
    .filter((approval, index) => {
      // Only include phases before current that are approved
      return index < currentIndex && approval.status === 'approved' && approval.llmAnalysis;
    })
    .map((approval) => ({
      phaseId: approval.phaseId,
      phaseName: PHASE_DISPLAY_NAMES[approval.phaseId as AccountReviewPhase],
      llmAnalysis: approval.llmAnalysis || '',
      userComments: approval.userComments,
      approvedAt: approval.approvedAt,
    }));
}

/**
 * Get all approved phases (for synthesis)
 */
export function getAllApprovedPhases(
  state: AccountReviewState
): PhaseApprovalContext[] {
  return state.phaseApprovals
    .filter((approval) => approval.status === 'approved' && approval.llmAnalysis)
    .map((approval) => ({
      phaseId: approval.phaseId,
      phaseName: PHASE_DISPLAY_NAMES[approval.phaseId as AccountReviewPhase],
      llmAnalysis: approval.llmAnalysis || '',
      userComments: approval.userComments,
      approvedAt: approval.approvedAt,
    }));
}

/**
 * Update phase with LLM analysis
 */
export function setPhaseAnalysis(
  state: AccountReviewState,
  phaseId: string,
  analysis: string
): AccountReviewState {
  return {
    ...state,
    phaseApprovals: state.phaseApprovals.map((approval) =>
      approval.phaseId === phaseId
        ? { ...approval, llmAnalysis: analysis, status: 'current' as TabStatus }
        : approval
    ),
  };
}

/**
 * Approve a phase and advance to next
 */
export function approvePhase(
  state: AccountReviewState,
  phaseId: string,
  userComments?: string
): AccountReviewState {
  const phaseIndex = ACCOUNT_REVIEW_PHASES.indexOf(phaseId as AccountReviewPhase);
  const isLastPhase = phaseIndex === ACCOUNT_REVIEW_PHASES.length - 1;
  const nextPhase = isLastPhase ? phaseId : ACCOUNT_REVIEW_PHASES[phaseIndex + 1];

  const updatedApprovals = state.phaseApprovals.map((approval) =>
    approval.phaseId === phaseId
      ? {
          ...approval,
          status: 'approved' as TabStatus,
          userComments,
          approvedAt: new Date().toISOString(),
        }
      : approval
  );

  const allApproved = updatedApprovals.every((a) => a.status === 'approved');

  return {
    ...state,
    phaseApprovals: updatedApprovals,
    currentPhase: nextPhase as AccountReviewPhase,
    allPhasesApproved: allApproved,
    completedAt: allApproved ? new Date().toISOString() : undefined,
  };
}

/**
 * Build the LLM prompt for the current phase
 */
export function buildCurrentPhasePrompt(
  state: AccountReviewState,
  intelSummary: string
): string {
  const priorApprovals = getPriorApprovedPhases(state);
  return buildAccountReviewPhasePrompt(
    state.currentPhase,
    intelSummary,
    priorApprovals,
    state.customerName
  );
}

/**
 * Build the synthesis prompt after all phases approved
 */
export function buildStrategySynthesisPrompt(
  state: AccountReviewState,
  intelSummary: string
): string {
  const allApprovals = getAllApprovedPhases(state);
  return buildSynthesisPrompt(allApprovals, intelSummary, state.customerName);
}

/**
 * Get phase status for tab display
 */
export function getPhaseStatus(
  state: AccountReviewState,
  phaseId: string
): TabStatus {
  const approval = state.phaseApprovals.find((p) => p.phaseId === phaseId);
  if (!approval) return 'pending';

  if (approval.status === 'approved') return 'approved';
  if (phaseId === state.currentPhase) return 'current';
  return 'pending';
}

/**
 * Check if a phase can be accessed (current or prior approved)
 */
export function canAccessPhase(
  state: AccountReviewState,
  phaseId: string
): boolean {
  const targetIndex = ACCOUNT_REVIEW_PHASES.indexOf(phaseId as AccountReviewPhase);
  const currentIndex = ACCOUNT_REVIEW_PHASES.indexOf(state.currentPhase);

  // Can access current phase or any prior approved phase
  return targetIndex <= currentIndex;
}

/**
 * Calculate overall review progress
 */
export function calculateProgress(state: AccountReviewState): {
  completed: number;
  total: number;
  percentage: number;
} {
  const completed = state.phaseApprovals.filter(
    (a) => a.status === 'approved'
  ).length;
  const total = ACCOUNT_REVIEW_PHASES.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

/**
 * Serialize state for persistence
 */
export function serializeState(state: AccountReviewState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize state from persistence
 */
export function deserializeState(json: string): AccountReviewState {
  return JSON.parse(json) as AccountReviewState;
}

/**
 * Create a summary for workflow state storage
 */
export function createStateSummary(state: AccountReviewState): Record<string, any> {
  const progress = calculateProgress(state);

  return {
    customerId: state.customerId,
    customerName: state.customerName,
    currentPhase: state.currentPhase,
    progress: `${progress.completed}/${progress.total}`,
    progressPercentage: progress.percentage,
    allPhasesApproved: state.allPhasesApproved,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  };
}
