/**
 * @human-os/journal
 *
 * Journaling backend with Plutchik mood system and entity linking.
 * Provides services for journal entries, mood tracking, and entity resolution.
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Plutchik types
  PlutchikEmotion,
  PlutchikProfile,
  MoodDefinition,
  EmotionAnalysis,
  EmotionCategory,

  // Text emotion analysis types (NEW)
  PlutchikVector,
  DetectedKeyword,
  TextEmotionAnalysis,
  EmotionComparison,
  EmotionTrendDataPoint,
  EmotionTrendAnalysis,
  EmotionAnalysisFilter,
  StoredEmotionAnalysis,

  // Journal entry types
  JournalEntry,
  JournalEntryType,
  JournalEntryStatus,
  JournalEntryMood,

  // Entity linking types
  JournalEntityMention,
  EntityLinkResult,
  MentionType,
  EntityRelationshipType,

  // Lead types
  JournalLead,
  LeadStatus,
  InferredRelationship,
  LeadResolution,

  // Input types
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  ListJournalEntriesFilter,

  // Result types
  PaginatedJournalEntries,
  JournalSearchResult,
  JournalSearchResults,

  // Mood trend types
  MoodTrends,
  MoodTrendPoint,

  // Mode types
  JournalMode,
  ModePrompt,

  // Context types
  JournalServiceContext,
} from './types.js';

// =============================================================================
// SERVICE EXPORTS
// =============================================================================

export { JournalService, createJournalService } from './journal-service.js';
export { EntityLinker, createEntityLinker } from './entity-linker.js';
export { ModeLoader, createModeLoader } from './mode-loader.js';

// =============================================================================
// EMOTION ANALYZER EXPORTS (Text → Plutchik Vector)
// =============================================================================

export {
  EmotionAnalyzer,
  emotionAnalyzer,
  analyzeTextEmotion,
  compareTextEmotions,
} from './emotion-analyzer.js';

export {
  EMOTION_LEXICON,
  getKeywordsForEmotion,
  getLexiconStats,
  type LexiconEntry,
} from './data/emotion-lexicon.js';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export {
  // Categories and constants
  EMOTION_CATEGORIES,
  PLUTCHIK_EMOTIONS,

  // Analysis functions
  analyzeEmotion,
  getDominantEmotion,
  getDominantEmotions,
  calculateEmotionComplexity,
  calculateEmotionDistance,

  // Level helpers
  getEmotionIntensityLevel,
  getEmotionValence,
  getEmotionArousal,

  // Recommendations and insights
  getEmotionRecommendations,
  generateEmotionInsights,

  // Display helpers
  getEmotionColor,
  formatEmotionName,

  // Types
  type EmotionRecommendation,
} from './utils/emotion-utils.js';
