/**
 * @human-os/analysis
 *
 * Unified semantic analysis for interviews, journals, and transcripts.
 * Combines emotion analysis with competency assessment and archetype classification.
 *
 * @example
 * ```typescript
 * import { analyzeTextEmotion, scoreInterview } from '@human-os/analysis';
 *
 * // Emotion analysis
 * const emotion = analyzeTextEmotion('I am so excited about this opportunity!');
 * console.log(emotion.dominantEmotion); // 'anticipation'
 *
 * // Interview scoring
 * const score = scoreInterview(transcriptText);
 * console.log(score.tier); // 'strong'
 * console.log(score.archetype?.primary); // 'technical_builder'
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Plutchik Model
  PlutchikEmotion,
  PlutchikVector,

  // VAD Model
  VadProfile,

  // Lexicon Types
  KeywordIntensity,
  LexiconEntry,
  DetectedKeyword,
  Lexicon,

  // Emotion Analysis
  TextEmotionAnalysis,
  EmotionComparison,

  // Interview Scoring
  InterviewDimension,
  DimensionScore,
  InterviewScore,
  InterviewTier,

  // Archetype Classification
  CandidateArchetype,
  ArchetypeClassification,

  // Competency Signals
  CompetencySignal,
  DetectedSignal,
  CompetencyProfile,

  // Context & Options
  AnalysisSourceType,
  AnalysisContext,
  ScoringOptions,

  // Storage
  StoredAnalysis,
} from './types/index.js';

// =============================================================================
// CORE - Emotion Analysis
// =============================================================================

export {
  EmotionAnalyzer,
  emotionAnalyzer,
  analyzeTextEmotion,
  compareTextEmotions,
  OPPOSITE_EMOTIONS,
} from './core/index.js';

// =============================================================================
// SCORING - Interview & Archetype
// =============================================================================

export {
  InterviewScorer,
  interviewScorer,
  scoreInterview,
  ArchetypeClassifier,
  archetypeClassifier,
  classifyArchetype,
} from './scoring/index.js';

// =============================================================================
// LEXICONS
// =============================================================================

export {
  EMOTION_LEXICON,
  getKeywordsForEmotion,
  getLexiconStats,
  COMPETENCY_LEXICON,
  getKeywordsForSignal,
  getCompetencyLexiconStats,
  type CompetencyLexiconEntry,
  type CompetencyLexicon,
} from './lexicons/index.js';

// =============================================================================
// CONDUCTOR - Immersive Interview Experience
// =============================================================================

export {
  // Engine
  ConductorEngine,
  createConductorEngine,

  // Scenes & Characters
  SCENES,
  CHARACTERS,
  getNextScene,
  getFollowUpPrompt,
  shouldTransition,
  getTotalExpectedExchanges,

  // Handlers
  dndHandler,
  professionalHandler,
  hiringManagerHandler,
  candidateSummaryHandler,
  formatResult,

  // Types
  type Scene,
  type Character,
  type SceneConfig,
  type TranscriptEntry,
  type ScenePrompt,
  type InterviewComplete,
  type AssessmentResult,
  type AssessmentHandler,
  type DnDStats,
  type DnDClass,
  type DnDSheet,
  type CompetencyRating,
  type HiringRecommendation,
  type ProfessionalAssessment,
  type InterviewState,
  type HiringManagerReport,
  type CandidateSummary,
} from './conductor/index.js';
