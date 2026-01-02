/**
 * Interview Conductor
 *
 * An immersive interview experience that extracts signals from natural conversation.
 * One rich question > 10 checkbox questions.
 *
 * Two approaches available:
 *
 * 1. **Protocol-driven (recommended)** - Claude IS the interviewer:
 * ```typescript
 * import { createSessionManager, INTERVIEW_PROTOCOL } from '@human-os/analysis';
 *
 * const manager = createSessionManager();
 * const context = manager.startSession('Sarah Chen', 'goodhang_full');
 * // Load INTERVIEW_PROTOCOL into Claude's context
 * // Claude conducts the interview naturally
 * // Use manager.logExchange() to track signals
 * // Use manager.completeSession() to get assessment
 * ```
 *
 * 2. **State-machine (scripted prompts)** - Tool generates dialogue:
 * ```typescript
 * import { createConductorEngine, dndHandler, formatResult } from '@human-os/analysis';
 *
 * const conductor = createConductorEngine();
 * const prompt1 = conductor.startInterview('Sarah Chen');
 * const prompt2 = conductor.processResponse("Oh yes, big day!");
 * // ... continue until complete
 * ```
 */

// Types
export type {
  Scene,
  Character,
  SceneConfig,
  TranscriptEntry,
  ScenePrompt,
  InterviewComplete,
  AssessmentResult,
  AssessmentHandler,
  DnDStats,
  DnDClass,
  DnDRace,
  DnDSheet,
  CompetencyRating,
  HiringRecommendation,
  ProfessionalAssessment,
  InterviewState,
} from './types.js';

// Protocol-driven approach (recommended)
export {
  SessionManager,
  createSessionManager,
  type InterviewSession,
  type CapturedAttribute,
  type CaptureResult,
  type SessionContext,
} from './SessionManager.js';

// Attribute system
export {
  ATTRIBUTES,
  ATTRIBUTE_SETS,
  getAttributesForSet,
  getRequiredAttributesForSet,
  checkRequiredAttributesCaptured,
  getCaptureProgress,
  getSuggestedQuestions,
  type Attribute,
  type AttributeSet,
  type AttributeCategory,
  type CaptureMethod,
} from './attributes.js';

// State-machine approach (legacy)
export { ConductorEngine, createConductorEngine } from './ConductorEngine.js';

// Scenes & Characters
export { SCENES, CHARACTERS, getNextScene, getFollowUpPrompt, shouldTransition, getTotalExpectedExchanges } from './scenes.js';

// Handlers
export {
  dndHandler,
  professionalHandler,
  hiringManagerHandler,
  candidateSummaryHandler,
  formatResult,
} from './handlers.js';

// Handler Types
export type { HiringManagerReport, CandidateSummary } from './handlers.js';

// LLM Assessment (hybrid scoring)
export {
  LLMAssessmentSchema,
  validateAssessment,
  buildHybridAssessment,
  generateAssessmentPrompt,
  type LLMAssessment,
} from './LLMAssessment.js';
