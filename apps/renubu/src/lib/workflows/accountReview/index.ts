/**
 * Account Review Module (v0.1.12)
 *
 * LLM-driven account review workflow with phase-based approval.
 */

export {
  type AccountReviewState,
  type SynthesisResult,
  createAccountReviewState,
  getCurrentPhaseApproval,
  getPriorApprovedPhases,
  getAllApprovedPhases,
  setPhaseAnalysis,
  approvePhase,
  buildCurrentPhasePrompt,
  buildStrategySynthesisPrompt,
  getPhaseStatus,
  canAccessPhase,
  calculateProgress,
  serializeState,
  deserializeState,
  createStateSummary,
} from './contextBuilder';

export {
  type AccountReviewPhase,
  type PhaseApprovalContext,
  ACCOUNT_REVIEW_PHASES,
  PHASE_DISPLAY_NAMES,
} from '@/lib/workflows/llm/systemPrompts';
