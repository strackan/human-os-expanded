/**
 * Interview Conductor Handlers
 *
 * Pluggable handlers that format raw AssessmentResult into different output formats.
 * Each handler transforms the same core assessment data into a specific presentation.
 */

import type { AssessmentResult, AssessmentHandler } from '../types.js';

// Re-export all handlers
export { dndHandler } from './dnd-handler.js';
export { professionalHandler } from './professional-handler.js';
export { hiringManagerHandler, type HiringManagerReport } from './hiring-manager-handler.js';
export { candidateSummaryHandler, type CandidateSummary } from './candidate-summary-handler.js';

// Re-export utility functions that may be useful externally
export {
  avg,
  clamp,
  scoreToRating,
  tierToRecommendation,
  getCultureAlignment,
  getRoleFit,
  getBottomDimensions,
  formatDimensionName,
  formatArchetypeName,
  formatTierDisplay,
  generateNextSteps,
} from './utils.js';

// =============================================================================
// FORMAT HELPER
// =============================================================================

/**
 * Format an assessment result using a specific handler
 *
 * @param result - The raw assessment result
 * @param handler - The handler to use for formatting
 * @returns The formatted output in the handler's type
 */
export function formatResult<T>(result: AssessmentResult, handler: AssessmentHandler<T>): T {
  return handler.format(result);
}
