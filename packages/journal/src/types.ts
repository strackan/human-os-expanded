/**
 * Human OS Journal Types
 *
 * TypeScript interfaces for the journaling system including
 * entries, moods, entity linking, and leads.
 */

import type { Layer, Sentiment } from '@human-os/core';

// =============================================================================
// PLUTCHIK MOOD SYSTEM
// =============================================================================

/**
 * The 8 primary Plutchik emotions
 */
export type PlutchikEmotion =
  | 'joy'
  | 'trust'
  | 'fear'
  | 'surprise'
  | 'sadness'
  | 'anticipation'
  | 'anger'
  | 'disgust';

/**
 * Plutchik emotion profile with ratings for each dimension
 */
export interface PlutchikProfile {
  joy: number;
  trust: number;
  fear: number;
  surprise: number;
  sadness: number;
  anticipation: number;
  anger: number;
  disgust: number;
}

/**
 * Mood definition stored in the database
 */
export interface MoodDefinition {
  id: string;
  name: string;
  // Plutchik 8 dimensions (0-10)
  joyRating: number;
  trustRating: number;
  fearRating: number;
  surpriseRating: number;
  sadnessRating: number;
  anticipationRating: number;
  angerRating: number;
  disgustRating: number;
  // Additional properties
  intensity: number;
  arousalLevel: number;
  valence: number;
  dominance: number;
  // Categorization
  category?: string;
  colorHex: string;
  isCore: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Emotion analysis result
 */
export interface EmotionAnalysis {
  dominantEmotion: PlutchikEmotion;
  complexity: number;
  intensity: number;
  arousal: number;
  valence: number;
  dominance: number;
  plutchikProfile: PlutchikProfile;
}

/**
 * Emotion category with display info
 */
export interface EmotionCategory {
  name: string;
  color: string;
}

// =============================================================================
// TEXT EMOTION ANALYSIS (Text → Plutchik Vector)
// =============================================================================

/**
 * Plutchik 8-dimension vector with normalized scores (0-1)
 * Used for text emotion analysis and comparison
 */
export interface PlutchikVector {
  joy: number;        // 0-1 normalized
  trust: number;      // 0-1 normalized
  fear: number;       // 0-1 normalized
  surprise: number;   // 0-1 normalized
  sadness: number;    // 0-1 normalized
  anticipation: number; // 0-1 normalized
  anger: number;      // 0-1 normalized
  disgust: number;    // 0-1 normalized
}

/**
 * A detected emotional keyword in text
 */
export interface DetectedKeyword {
  word: string;
  emotion: PlutchikEmotion;
  confidence: number;       // 0-1, how strongly this word indicates the emotion
  intensity?: 'mild' | 'moderate' | 'intense';
}

/**
 * Result of text emotion analysis
 * Combines VAD (Valence-Arousal-Dominance) model with Plutchik categorical emotions
 */
export interface TextEmotionAnalysis {
  // VAD Dimensions (continuous, for intensity/polarity)
  valence: number;           // -1 (negative) to +1 (positive) - emotional polarity
  arousal: number;           // 0 (calm) to 1 (intense) - emotional intensity
  dominance: number;         // 0 (submissive) to 1 (dominant) - sense of control

  // Plutchik Vector (categorical, for specific emotion identification)
  plutchikVector: PlutchikVector;  // 8 dimensions, 0-1 each
  dominantEmotion: PlutchikEmotion;
  emotionConfidence: number;       // 0-1, confidence in dominant emotion

  // Detection details
  detectedKeywords: DetectedKeyword[];
  wordCount: number;
  emotionDensity: number;    // detectedKeywords.length / wordCount

  // Analysis metadata
  method: 'keyword' | 'transformer';  // Which analysis method was used
}

/**
 * Result of comparing two texts emotionally
 */
export interface EmotionComparison {
  distance: number;          // Euclidean distance between vectors (0 = identical)
  similarity: number;        // 0-1, cosine similarity
  shift: PlutchikVector;     // Change from text1 to text2 (positive = increase)
  valenceChange: number;     // Change in valence (-2 to +2)
  arousalChange: number;     // Change in arousal (-1 to +1)
  dominantShift: {
    from: PlutchikEmotion;
    to: PlutchikEmotion;
  };
}

/**
 * Emotion trend data point for time-series analysis
 */
export interface EmotionTrendDataPoint {
  period: string;            // ISO date or period label (e.g., "2024-01")
  averageVector: PlutchikVector;
  averageValence: number;
  averageArousal: number;
  dominantEmotion: PlutchikEmotion;
  entryCount: number;
}

/**
 * Emotion trend analysis result
 */
export interface EmotionTrendAnalysis {
  dataPoints: EmotionTrendDataPoint[];
  overallTrend: {
    valenceDirection: 'improving' | 'declining' | 'stable';
    arousalDirection: 'increasing' | 'decreasing' | 'stable';
    dominantEmotions: PlutchikEmotion[];  // Most common across period
  };
  insights: string[];        // AI-generated observations
}

/**
 * Filter options for batch emotion analysis
 */
export interface EmotionAnalysisFilter {
  sourceType?: 'transcript' | 'journal' | 'text' | 'social';
  participantName?: string;
  contextTags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Stored emotion analysis result (from database)
 */
export interface StoredEmotionAnalysis {
  id: string;
  sourceType: 'transcript' | 'journal' | 'text' | 'social';
  sourceId?: string;
  sourceTextHash?: string;

  // Plutchik scores
  joy: number;
  trust: number;
  fear: number;
  surprise: number;
  sadness: number;
  anticipation: number;
  anger: number;
  disgust: number;

  // VAD
  valence: number;
  arousal: number;
  dominantEmotion: PlutchikEmotion;
  emotionDensity: number;

  // Context
  analyzedDate: Date;
  participantNames?: string[];
  contextTags?: string[];

  // Details
  wordCount: number;
  keywordCount: number;
  detectedKeywords: DetectedKeyword[];

  createdAt: Date;
}

// =============================================================================
// JOURNAL ENTRIES
// =============================================================================

/**
 * Types of journal entries
 */
export type JournalEntryType =
  | 'freeform'
  | 'gratitude'
  | 'mood_check'
  | 'mindfulness'
  | 'reflection'
  | 'daily_review';

/**
 * Entry status
 */
export type JournalEntryStatus = 'draft' | 'published' | 'archived';

/**
 * A journal entry
 */
export interface JournalEntry {
  id: string;
  // Ownership
  ownerId: string;
  tenantId?: string;
  layer: Layer;
  // Content
  title?: string;
  content: string;
  contentHtml?: string;
  // Entry metadata
  entryType: JournalEntryType;
  mode?: string;
  // Mood summary
  primaryMoodId?: string;
  primaryMood?: MoodDefinition;
  moodIntensity?: number;
  valence?: number;
  // AI analysis
  aiSummary?: string;
  aiInsights?: string[];
  extractedThemes?: string[];
  // Status
  status: JournalEntryStatus;
  isPrivate: boolean;
  // Timestamps
  entryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  // Relations (populated on fetch)
  moods?: JournalEntryMood[];
  entityMentions?: JournalEntityMention[];
}

/**
 * M:N relationship between entries and moods
 */
export interface JournalEntryMood {
  id: string;
  entryId: string;
  moodId: string;
  mood?: MoodDefinition;
  intensity: number;
  isPrimary: boolean;
  contextSnippet?: string;
  createdAt: Date;
}

// =============================================================================
// ENTITY LINKING
// =============================================================================

/**
 * Types of entity mentions
 */
export type MentionType = 'explicit' | 'inferred';

/**
 * Relationship types for entity mentions
 */
export type EntityRelationshipType =
  | 'mentioned'
  | 'met_with'
  | 'discussed'
  | 'grateful_for'
  | 'worked_with'
  | 'talked_to'
  | 'thought_about';

/**
 * An entity mention in a journal entry
 */
export interface JournalEntityMention {
  id: string;
  entryId: string;
  entityId: string;
  mentionText: string;
  mentionType: MentionType;
  contextSnippet?: string;
  relationshipType?: EntityRelationshipType;
  sentiment?: Sentiment;
  createdAt: Date;
  // Resolved entity info (populated on fetch)
  entity?: {
    id: string;
    name: string;
    entityType: string;
  };
}

/**
 * Result of entity resolution
 */
export interface EntityLinkResult {
  mentionText: string;
  resolved: boolean;
  entity?: {
    id: string;
    name: string;
    type: string;
    source: 'gft' | 'human_os' | 'entities';
  };
  lead?: {
    id: string;
    name: string;
    inferredRelationship: string;
  };
}

// =============================================================================
// JOURNAL LEADS
// =============================================================================

/**
 * Lead status
 */
export type LeadStatus = 'pending' | 'resolved' | 'ignored';

/**
 * Inferred relationship types
 */
export type InferredRelationship =
  | 'family'
  | 'colleague'
  | 'friend'
  | 'business'
  | 'unknown';

/**
 * An unresolved entity mention (lead)
 */
export interface JournalLead {
  id: string;
  ownerId: string;
  entryId?: string;
  // Lead info
  name: string;
  mentionContext?: string;
  inferredRelationship: InferredRelationship;
  // Resolution
  status: LeadStatus;
  resolvedEntityId?: string;
  // Action items
  actionRequired: string;
  notes?: string;
  // Timestamps
  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * Input for resolving a lead
 */
export interface LeadResolution {
  entityId?: string;
  createEntity?: {
    entityType: 'person' | 'company' | 'relationship';
    name: string;
    email?: string;
    metadata?: Record<string, unknown>;
  };
  ignore?: boolean;
}

// =============================================================================
// SERVICE INPUTS
// =============================================================================

/**
 * Input for creating a journal entry
 */
export interface CreateJournalEntryInput {
  content: string;
  title?: string;
  entryType?: JournalEntryType;
  mode?: string;
  moods?: Array<{
    name: string;
    intensity?: number;
  }>;
  entryDate?: Date;
  isPrivate?: boolean;
}

/**
 * Input for updating a journal entry
 */
export interface UpdateJournalEntryInput {
  content?: string;
  title?: string;
  moods?: Array<{
    name: string;
    intensity?: number;
  }>;
  status?: JournalEntryStatus;
  reanalyze?: boolean;
}

/**
 * Filters for listing entries
 */
export interface ListJournalEntriesFilter {
  after?: Date;
  before?: Date;
  entryType?: JournalEntryType;
  mood?: string;
  status?: JournalEntryStatus;
  limit?: number;
  offset?: number;
}

/**
 * Paginated entries result
 */
export interface PaginatedJournalEntries {
  entries: JournalEntry[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Search result
 */
export interface JournalSearchResult {
  id: string;
  title?: string;
  entryDate: Date;
  entryType: JournalEntryType;
  relevanceScore: number;
  matchingExcerpt?: string;
  primaryMood?: string;
}

/**
 * Search results
 */
export interface JournalSearchResults {
  results: JournalSearchResult[];
  totalCount: number;
}

// =============================================================================
// MOOD TRENDS
// =============================================================================

/**
 * Mood trend data point
 */
export interface MoodTrendPoint {
  date: Date;
  primaryMood?: string;
  averageValence: number;
  averageIntensity: number;
  entryCount: number;
}

/**
 * Mood trends analysis
 */
export interface MoodTrends {
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  trends: MoodTrendPoint[];
  dominantMoods: Array<{
    mood: string;
    count: number;
    percentage: number;
  }>;
  insights: string[];
  averageValence: number;
  averageIntensity: number;
  totalEntries: number;
}

// =============================================================================
// JOURNAL MODES
// =============================================================================

/**
 * Prompt configuration for a mode
 */
export interface ModePrompt {
  starter?: string;
  follow_up?: string;
  deeper?: string;
  rating?: string;
  exploration?: string;
}

/**
 * Journal mode configuration (from skill files)
 */
export interface JournalMode {
  title: string;
  mode: string;
  version?: string;
  prompts: ModePrompt[];
  moodFocus: string[];
  typicalEntities?: string[];
  usePlutchikWheel?: boolean;
  content: string;
}

// =============================================================================
// SERVICE CONTEXT
// =============================================================================

/**
 * Context for journal service operations
 */
export interface JournalServiceContext {
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  layer: Layer;
  tenantId?: string;
}
