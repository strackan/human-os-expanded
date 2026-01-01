/**
 * Interview Conductor
 *
 * An immersive interview experience that extracts signals from natural conversation.
 * One rich question > 10 checkbox questions.
 *
 * @example
 * ```typescript
 * import { createConductorEngine, dndHandler, formatResult } from '@human-os/analysis';
 *
 * const conductor = createConductorEngine();
 *
 * // Start interview
 * const prompt1 = conductor.startInterview('Sarah Chen');
 * console.log(prompt1.prompt); // Earl's elevator greeting
 *
 * // Process responses
 * const prompt2 = conductor.processResponse("Oh yes, big day! Excited to be here.");
 *
 * // ... continue until complete
 *
 * if ('complete' in result) {
 *   // Format as D&D character sheet
 *   const sheet = formatResult(result.result, dndHandler);
 *   console.log(sheet.class); // "Artificer"
 * }
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
  DnDSheet,
  CompetencyRating,
  HiringRecommendation,
  ProfessionalAssessment,
  InterviewState,
} from './types.js';

// Engine
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
