/**
 * @human-os/analysis - Unified Semantic Analysis Types
 *
 * Shared types for emotion analysis, interview scoring, and archetype classification.
 * Used across journal, interview, and transcript analysis systems.
 */

// =============================================================================
// PLUTCHIK EMOTION MODEL
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
 * Plutchik 8-dimension vector with normalized scores (0-1)
 */
export interface PlutchikVector {
  joy: number;
  trust: number;
  fear: number;
  surprise: number;
  sadness: number;
  anticipation: number;
  anger: number;
  disgust: number;
}

// =============================================================================
// VAD (VALENCE-AROUSAL-DOMINANCE) MODEL
// =============================================================================

/**
 * VAD dimensional scores
 */
export interface VadProfile {
  valence: number;    // -1 (negative) to +1 (positive) - emotional polarity
  arousal: number;    // 0 (calm) to 1 (intense) - emotional intensity
  dominance: number;  // 0 (submissive) to 1 (dominant) - sense of control
}

// =============================================================================
// LEXICON TYPES
// =============================================================================

/**
 * Keyword intensity levels
 */
export type KeywordIntensity = 'mild' | 'moderate' | 'intense';

/**
 * A lexicon entry mapping a word to its emotional properties
 */
export interface LexiconEntry {
  emotion: PlutchikEmotion;
  confidence: number;  // 0-1, how strongly this word indicates the emotion
  intensity: KeywordIntensity;
}

/**
 * A detected keyword in text
 */
export interface DetectedKeyword {
  word: string;
  emotion: PlutchikEmotion;
  confidence: number;
  intensity: KeywordIntensity;
}

/**
 * Custom lexicon type
 */
export type Lexicon = Record<string, LexiconEntry>;

// =============================================================================
// TEXT EMOTION ANALYSIS
// =============================================================================

/**
 * Result of text emotion analysis
 */
export interface TextEmotionAnalysis extends VadProfile {
  plutchikVector: PlutchikVector;
  dominantEmotion: PlutchikEmotion;
  emotionConfidence: number;
  detectedKeywords: DetectedKeyword[];
  wordCount: number;
  emotionDensity: number;
  method: 'keyword' | 'transformer';
}

/**
 * Result of comparing two texts emotionally
 */
export interface EmotionComparison {
  distance: number;           // Euclidean distance (0 = identical)
  similarity: number;         // Cosine similarity (0-1)
  shift: PlutchikVector;      // Change vector (text2 - text1)
  valenceChange: number;
  arousalChange: number;
  dominantShift: {
    from: PlutchikEmotion;
    to: PlutchikEmotion;
  };
}

// =============================================================================
// INTERVIEW SCORING
// =============================================================================

/**
 * The 11 interview assessment dimensions
 */
export type InterviewDimension =
  | 'iq'              // Cognitive ability, problem-solving
  | 'personality'     // Character traits, interpersonal style
  | 'motivation'      // Drive, ambition, why they want this
  | 'work_history'    // Track record, accomplishments
  | 'passions'        // Genuine interests, energy sources
  | 'culture_fit'     // Values alignment, team compatibility
  | 'technical'       // Domain expertise, hard skills
  | 'gtm'             // Go-to-market, sales/marketing acumen
  | 'eq'              // Emotional intelligence
  | 'empathy'         // Understanding others
  | 'self_awareness'; // Self-knowledge, growth mindset

/**
 * Score for a single dimension
 */
export interface DimensionScore {
  dimension: InterviewDimension;
  score: number;        // 0-10
  confidence: number;   // 0-1
  signals: string[];    // Evidence from transcript
  flags?: {
    green: string[];    // Positive indicators
    red: string[];      // Concerns
  };
}

/**
 * Complete interview scoring result
 */
export interface InterviewScore {
  dimensions: Record<InterviewDimension, DimensionScore>;
  overallScore: number;           // Weighted average (0-10)
  overallConfidence: number;      // 0-1
  emotionalProfile: TextEmotionAnalysis;
  archetype?: ArchetypeClassification;
  tier: InterviewTier;
  tierConfidence: number;
  summary: string;
  greenFlags: string[];
  redFlags: string[];
}

/**
 * Interview tier for routing
 */
export type InterviewTier = 'top_1%' | 'strong' | 'moderate' | 'weak' | 'pass';

// =============================================================================
// ARCHETYPE CLASSIFICATION
// =============================================================================

/**
 * The 6 candidate archetypes
 */
export type CandidateArchetype =
  | 'technical_builder'      // Engineers, developers, technical problem solvers
  | 'gtm_operator'           // Sales, marketing, growth specialists
  | 'creative_strategist'    // Product, design, brand thinkers
  | 'execution_machine'      // Ops, project management, get-things-done
  | 'generalist_orchestrator' // Versatile, can wear many hats
  | 'domain_expert';         // Deep expertise in specific vertical

/**
 * Archetype classification result
 */
export interface ArchetypeClassification {
  primary: CandidateArchetype;
  primaryScore: number;       // 0-1
  secondary?: CandidateArchetype;
  secondaryScore?: number;
  allScores: Record<CandidateArchetype, number>;
  reasoning: string;
}

// =============================================================================
// COMPETENCY SIGNALS
// =============================================================================

/**
 * Types of competency signals detected in text
 */
export type CompetencySignal =
  | 'leadership'        // Influence, ownership, delegation
  | 'technical'         // Domain vocabulary, expertise
  | 'communication'     // Clarity, structure, storytelling
  | 'problem_solving'   // Analysis, frameworks, solutions
  | 'accountability'    // Ownership, responsibility language
  | 'growth_mindset'    // Learning, adaptation, feedback
  | 'collaboration'     // Team language, we vs I
  | 'confidence'        // Certainty markers
  | 'stress_response';  // Composure under pressure

/**
 * Detected competency signal
 */
export interface DetectedSignal {
  signal: CompetencySignal;
  word: string;
  weight: number;       // 0-1
  context?: string;     // Surrounding text
}

/**
 * Competency profile from text analysis
 */
export interface CompetencyProfile {
  signals: Record<CompetencySignal, number>;  // 0-1 scores
  detectedSignals: DetectedSignal[];
  dominantSignals: CompetencySignal[];        // Top 3
}

// =============================================================================
// ANALYSIS CONTEXT
// =============================================================================

/**
 * Source types for analysis
 */
export type AnalysisSourceType =
  | 'interview'
  | 'transcript'
  | 'journal'
  | 'social'
  | 'email'
  | 'text';

/**
 * Context for analysis operations
 */
export interface AnalysisContext {
  sourceType: AnalysisSourceType;
  sourceId?: string;
  participantNames?: string[];
  contextTags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Options for scoring
 */
export interface ScoringOptions {
  includeEmotional?: boolean;     // Include VAD + Plutchik analysis
  includeCompetency?: boolean;    // Include competency signals
  includeArchetype?: boolean;     // Include archetype classification
  includeFlags?: boolean;         // Include green/red flags
  customLexicon?: Lexicon;        // Additional keywords
  dimensionWeights?: Partial<Record<InterviewDimension, number>>;
}

// =============================================================================
// STORED ANALYSIS (for database)
// =============================================================================

/**
 * Stored analysis result (for persistence)
 */
export interface StoredAnalysis {
  id: string;
  sourceType: AnalysisSourceType;
  sourceId?: string;

  // Emotion scores
  plutchikVector: PlutchikVector;
  valence: number;
  arousal: number;
  dominance: number;
  dominantEmotion: PlutchikEmotion;
  emotionDensity: number;

  // Interview scores (optional)
  interviewScore?: InterviewScore;
  archetype?: ArchetypeClassification;
  tier?: InterviewTier;

  // Context
  participantNames?: string[];
  contextTags?: string[];
  wordCount: number;

  // Timestamps
  analyzedAt: Date;
  createdAt: Date;
}
