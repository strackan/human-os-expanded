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
 * The 11 core interview assessment dimensions
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
 * Extended dimensions for Good Hang assessment (14 total)
 * Includes the 11 core dimensions plus 3 Good Hang-specific
 */
export type GoodHangDimension =
  | InterviewDimension
  | 'organization'         // Organizational skills, planning, structure
  | 'executive_leadership' // Executive presence, strategic leadership
  | 'ai_readiness';        // AI fluency, prompt engineering, AI tool usage

/**
 * All 14 Good Hang dimensions as an array
 */
export const GOODHANG_DIMENSIONS: readonly GoodHangDimension[] = [
  'iq', 'eq', 'empathy', 'self_awareness',
  'technical', 'ai_readiness', 'gtm', 'personality',
  'motivation', 'work_history', 'passions', 'culture_fit',
  'organization', 'executive_leadership'
] as const;

/**
 * The 11 core dimensions as an array
 */
export const CORE_DIMENSIONS: readonly InterviewDimension[] = [
  'iq', 'personality', 'motivation', 'work_history',
  'passions', 'culture_fit', 'technical', 'gtm',
  'eq', 'empathy', 'self_awareness'
] as const;

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

/**
 * Good Hang tier (3-tier system)
 */
export type GoodHangTier = 'top_1' | 'benched' | 'passed';

// =============================================================================
// GOOD HANG SCORING (14-dimension system)
// =============================================================================

/**
 * Score for a Good Hang dimension (extends DimensionScore)
 */
export interface GoodHangDimensionScore {
  dimension: GoodHangDimension;
  score: number;        // 0-10 (normalized from 0-100)
  rawScore: number;     // 0-100 (original Good Hang scale)
  confidence: number;   // 0-1
  signals: string[];    // Evidence from transcript
  flags?: {
    green: string[];
    red: string[];
  };
}

/**
 * Good Hang category scores (aggregated from dimensions)
 */
export interface GoodHangCategoryScores {
  technical: {
    overall: number;      // 0-10
    subscores: {
      technical: number;
      ai_readiness: number;
      organization: number;
      iq: number;
    };
  };
  emotional: {
    overall: number;      // 0-10
    subscores: {
      eq: number;
      empathy: number;
      self_awareness: number;
      executive_leadership: number;
      gtm: number;
    };
  };
  creative: {
    overall: number;      // 0-10
    subscores: {
      passions: number;
      culture_fit: number;
      personality: number;
      motivation: number;
    };
  };
}

/**
 * Good Hang personality profile (MBTI + Enneagram)
 */
export interface GoodHangPersonalityProfile {
  mbti: string;           // e.g., "INTJ", "ENFP"
  enneagram: string;      // e.g., "Type 1", "Type 9"
  traits: string[];       // 3-5 descriptive traits
}

/**
 * AI Orchestration sub-scores (Good Hang specific)
 */
export interface AIOrchestrationScores {
  technical_foundation: number;     // 0-10
  practical_use: number;            // 0-10
  conceptual_understanding: number; // 0-10
  systems_thinking: number;         // 0-10
  judgment: number;                 // 0-10
}

/**
 * Good Hang badge earned
 */
export interface GoodHangBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

/**
 * Complete Good Hang assessment result
 */
export interface GoodHangScore {
  // Core identification
  sessionId: string;
  userId: string;

  // Dimension scores (14 dimensions)
  dimensions: Record<GoodHangDimension, GoodHangDimensionScore>;
  categoryScores: GoodHangCategoryScores;
  overallScore: number;           // 0-10 (normalized)
  overallScoreRaw: number;        // 0-100 (original scale)
  overallConfidence: number;      // 0-1

  // Emotional analysis (from @human-os/analysis)
  emotionalProfile: TextEmotionAnalysis;

  // Classification
  archetype: string;              // Custom descriptor e.g., "Technical Strategist"
  archetypeConfidence: 'high' | 'medium' | 'low';
  tier: GoodHangTier;

  // Personality (Good Hang specific)
  personalityProfile?: GoodHangPersonalityProfile;
  aiOrchestrationScores?: AIOrchestrationScores;

  // Flags and recommendations
  greenFlags: string[];
  redFlags: string[];
  recommendation: string;
  bestFitRoles: string[];

  // Badges
  badges: GoodHangBadge[];

  // Summaries
  publicSummary: string;
  detailedSummary: string;

  // Timestamps
  analyzedAt: string;
}

/**
 * Options for Good Hang scoring
 */
export interface GoodHangScoringOptions extends ScoringOptions {
  includePersonality?: boolean;        // Include MBTI/Enneagram
  includeAIOrchestration?: boolean;    // Include AI sub-scores
  includeBadges?: boolean;             // Evaluate and award badges
  experienceYears?: number;            // For badge evaluation
  dimensionWeights?: Partial<Record<GoodHangDimension, number>>;
}

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
