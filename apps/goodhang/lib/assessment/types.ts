// Assessment Types for Good Hang - V2
// D&D-style character generation system

export type QuestionType = 'open_ended' | 'scale' | 'multiple_choice';

// Category scores type alias (used by PublicProfile and Results)
export type CategoryScores = Record<string, { overall: number; subscores?: Record<string, number>; dimensions?: Record<string, number> }>;

// AI Orchestration scores for work assessments (Module C/D)
export interface AIOrchestrationScores {
  technical_foundation: number;
  practical_use: number;
  conceptual_understanding: number;
  systems_thinking: number;
  judgment: number;
}

// Assessment dimensions (14-dimension work assessment - Module C/D)
export type AssessmentDimensions = Record<string, number>;

// Personality profile for work assessments (MBTI + Enneagram - Module C/D)
export interface PersonalityProfile {
  mbti: string;
  enneagram: string;
  traits: string[];
}

// MBTI personality types
export type PersonalityType =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

// Work assessment scoring dimensions (14 dimensions - Module C/D)
export type ScoringDimension =
  | 'iq' | 'eq' | 'empathy' | 'self_awareness'
  | 'technical' | 'ai_readiness' | 'organization'
  | 'executive_leadership' | 'gtm' | 'passions'
  | 'culture_fit' | 'personality' | 'motivation' | 'adaptability'
  | 'work_history';

// D&D Attributes (score 1-10 each)
export type AttributeCode = 'INT' | 'WIS' | 'CHA' | 'CON' | 'STR' | 'DEX';

export interface Attributes {
  INT: number; // Intelligence: Curiosity, learning, depth of thought
  WIS: number; // Wisdom: Self-awareness, emotional intelligence
  CHA: number; // Charisma: Social energy, presence
  CON: number; // Constitution: Consistency, follow-through, routine
  STR: number; // Strength: Assertiveness, drive, confrontation comfort
  DEX: number; // Dexterity: Adaptability, spontaneity, flexibility
}

// Alignment System (9-point grid)
export type OrderAxis = 'Lawful' | 'Neutral' | 'Chaotic';
export type MoralAxis = 'Good' | 'Neutral' | 'Evil';

export type Alignment =
  | 'Lawful Good'
  | 'Neutral Good'
  | 'Chaotic Good'
  | 'Lawful Neutral'
  | 'True Neutral'
  | 'Chaotic Neutral'
  | 'Lawful Evil'
  | 'Neutral Evil'
  | 'Chaotic Evil';

// D&D Races
export type Race =
  | 'Elven'
  | 'Half-Orc'
  | 'Tiefling'
  | 'Dwarven'
  | 'Human'
  | 'Halfling';

// D&D Classes
export type CharacterClass =
  | 'Paladin'
  | 'Wizard'
  | 'Bard'
  | 'Rogue'
  | 'Ranger'
  | 'Sorcerer'
  | 'Artificer'
  | 'Barbarian'
  | 'Cleric';

// Social Energy Patterns
export type SocialEnergy =
  | 'introvert'
  | 'extrovert'
  | 'ambivert'
  | 'selective_extrovert';

// Connection/Relationship Styles
export type RelationshipStyle =
  | 'depth_seeking'
  | 'breadth_seeking'
  | 'balanced'
  | 'experience_based';

export type ConnectionStyle =
  | 'conversation_based'
  | 'experience_based'
  | 'activity_based'
  | 'intellectual';

export type EnergyPattern =
  | 'spontaneous'
  | 'planned'
  | 'flexible'
  | 'routine_oriented';

// Character Profile (output)
export interface CharacterProfile {
  tagline: string; // Auto-generated 1-liner
  alignment: Alignment;
  race: Race;
  class: CharacterClass;
}

// Signals extracted from assessment
export interface AssessmentSignals {
  enneagram_hint?: string | undefined; // e.g., "7w8"
  interest_vectors: string[]; // e.g., ["counterculture", "travel", "philosophy"]
  social_energy: SocialEnergy;
  relationship_style: RelationshipStyle;
}

// Matching preferences
export interface MatchingProfile {
  ideal_group_size: string; // e.g., "2-4 or 20+"
  connection_style: ConnectionStyle;
  energy_pattern: EnergyPattern;
  good_match_with: string[]; // e.g., ["creatives", "rule-breakers"]
  avoid_match_with: string[]; // e.g., ["rigid planners", "small-talk lovers"]
}

// Complete Assessment Results (V2/V3)
// AssessmentResults supports both V1 (work) and V2/V3 (personality/D&D) formats
// Type-specific fields are optional to allow gradual migration
export interface AssessmentResults {
  session_id: string;
  user_id: string;
  overall_score: number;
  analyzed_at: string;
  // Badges (shared between both systems)
  badges?: Badge[];
  // V2/V3 Personality Assessment (D&D character profile)
  profile?: CharacterProfile;
  character_profile?: CharacterProfile; // Alias for database column name
  attributes?: Attributes;
  signals?: AssessmentSignals;
  matching?: MatchingProfile;
  question_scores?: Record<string, QuestionScore>;
  // V1 Work Assessment fields (Module C/D)
  archetype?: string;
  archetype_confidence?: number;
  dimensions?: Record<string, number>;
  tier?: string;
  flags?: { green_flags?: string[]; red_flags?: string[] };
  recommendation?: string;
  best_fit_roles?: string[];
  personality_profile?: PersonalityProfile;
  ai_orchestration_scores?: AIOrchestrationScores;
  category_scores?: Record<string, { overall: number; dimensions?: Record<string, number> }>;
  public_summary?: string;
  detailed_summary?: string;
  is_published?: boolean;
}

// V2 Personality Assessment Results (strict type for Module A/B)
export interface PersonalityAssessmentResults {
  session_id: string;
  user_id: string;
  profile: CharacterProfile;
  attributes: Attributes;
  signals: AssessmentSignals;
  matching: MatchingProfile;
  question_scores: Record<string, QuestionScore>;
  overall_score: number;
  summary?: string;  // 300-500 word personality summary
  analyzed_at: string;
  badges?: Badge[];
}

export interface QuestionScore {
  question_id: string;
  score: number; // 0-10
  attribute_signals: Partial<Record<AttributeCode, number>>; // e.g., {"INT": 2, "DEX": 1}
  alignment_signal?: {
    axis: 'order' | 'moral';
    direction: OrderAxis | MoralAxis;
    strength: number; // 1-3
  } | undefined;
  extracted_interests: string[];
  notes: string;
}

// Alignment scoring state
export interface AlignmentScores {
  order: {
    lawful: number;
    neutral: number;
    chaotic: number;
  };
  moral: {
    good: number;
    neutral: number;
    evil: number;
  };
}

// Question Types (updated for v2)
export interface AssessmentQuestion {
  id: string;
  section: string;
  order: number;
  text: string;
  type: QuestionType;
  attributes: {
    primary: AttributeCode;
    secondary: AttributeCode | null;
  };
  alignment_indicator?: 'order_axis' | 'moral_axis';
  scoring_guidance?: string;
  required: boolean;
  followUp?: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  order: number;
  transitionMessage?: string | null;
  questions: AssessmentQuestion[];
}

export interface AssessmentConfig {
  id: string;
  title: string;
  version: string;
  estimatedMinutes: number;
  sections: AssessmentSection[];
  completionMessage: string;
  scoringPhilosophy?: string;
}

export interface InterviewMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

// Database types for sessions
export interface AssessmentSession {
  id: string;
  user_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  current_section?: string;
  current_question?: number;
  answers: Record<string, AssessmentAnswer>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentAnswer {
  question_id: string;
  answer: string;
  answered_at: string;
}

// API Request/Response types
export interface StartAssessmentRequest {
  user_id: string;
}

export interface StartAssessmentResponse {
  session_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress?: {
    current_section: string;
    current_question: number;
    total_questions: number;
    percentage: number;
  };
  config: AssessmentConfig;
}

export interface SubmitAnswerRequest {
  question_id: string;
  answer: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  session_id: string;
  saved_at: string;
}

export interface CompleteAssessmentResponse {
  session_id: string;
  status: 'scoring' | 'completed';
  redirect_url: string;
}

export interface AssessmentStatusResponse {
  status: 'not_started' | 'in_progress' | 'completed';
  session_id?: string;
  progress?: {
    percentage: number;
    questions_answered: number;
    total_questions: number;
  };
  preview?: {
    overall_score: number;
    // V2 personality fields
    character_class?: CharacterClass;
    race?: Race;
    // V1 work assessment field
    archetype?: string;
  };
}

// Claude Scoring Types (for the AI scoring service)
export interface ClaudeScoringRequest {
  session_id: string;
  user_id: string;
  transcript: InterviewMessage[];
}

export interface ClaudeScoringResponse {
  profile: CharacterProfile;
  attributes: Attributes;
  signals: AssessmentSignals;
  matching: MatchingProfile;
  question_scores: Record<string, QuestionScore>;
  overall_score: number;
  analyzed_at: string;
}

// Race assignment rules
export interface RaceRule {
  race: Race;
  condition: string; // Human-readable condition
  modifiers: Partial<Attributes>;
}

// Class assignment rules
export interface ClassRule {
  class: CharacterClass;
  alignments: Alignment[];
  topAttributes: [AttributeCode, AttributeCode];
  description: string;
}

// Badge (earned badge for display)
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  earned_at: string;
}

// ============================================================
// PUBLIC PROFILE TYPES
// ============================================================

export interface PublicProfile {
  id?: string;
  user_id: string;
  session_id?: string | null;
  profile_slug: string;
  display_name?: string;
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  self_description?: string;
  overall_score?: number | null;
  category_scores?: CategoryScores | null;
  archetype?: string | null;
  badges?: Badge[] | null;
  show_scores?: boolean;
  show_badges?: boolean;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  // Work profile fields
  career_level?: string;
  years_experience?: number;
  personality_type?: string;
  strengths?: string[];
  areas_to_develop?: string[];
  best_fit_roles?: string[];
  public_summary?: string;
  video_url?: string;
  // V2 personality fields
  character_profile?: CharacterProfile | null;
  attributes?: Attributes | null;
}

export interface BrowseProfilesResponse {
  profiles: PublicProfile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  total_pages: number;
}

// ============================================================
// LIGHTNING ROUND TYPES
// ============================================================

export type LightningDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'intermediate' | 'advanced' | 'insane';

export interface LightningRoundQuestion {
  id: string;
  question: string;
  correct_answer: string;
  explanation?: string;
  question_type: string;
  difficulty: LightningDifficulty;
}

export interface StartLightningRoundRequest {
  session_id: string;
  difficulty?: LightningDifficulty;
}

export interface StartLightningRoundResponse {
  questions: LightningRoundQuestion[];
  duration_seconds: number;
  started_at: string;
}

export interface LightningRoundAnswer {
  question_id: string;
  answer: string;
  time_taken_ms?: number | undefined;
}

export interface SubmitLightningRoundRequest {
  session_id: string;
  answers: LightningRoundAnswer[];
}

export interface SubmitLightningRoundResponse {
  score: number;
  accuracy: number;
  percentile: number;
  difficulty_achieved: LightningDifficulty;
  correct_count: number;
  total_questions: number;
  questions_answered: number;
  time_bonus: number;
}

// =============================================================================
// FOUNDER OS / VOICE OS TYPES
// =============================================================================

export interface FounderOsCommandments {
  CURRENT_STATE: string;           // Who they are at their core
  STRATEGIC_THOUGHT_PARTNER: string; // How to help them think through decisions
  DECISION_MAKING: string;         // Decision style under pressure
  ENERGY_PATTERNS: string;         // What energizes vs drains them
  AVOIDANCE_PATTERNS: string;      // What "stuck" looks like
  RECOVERY_PROTOCOLS: string;      // How they reset and restore
  ACCOUNTABILITY_FRAMEWORK: string; // How they prefer accountability
  EMOTIONAL_SUPPORT: string;       // Emotional needs and boundaries
  WORK_STYLE: string;              // How to support their work
  CONVERSATION_PROTOCOLS: string;  // How to communicate with them
}

export interface FounderOsSummary {
  personality_type: string;
  key_patterns: string[];
  primary_challenges: string[];
  recommended_approach: string;
}

export interface FounderOsExtractionResult {
  commandments: FounderOsCommandments;
  summary: FounderOsSummary;
}

export interface VoiceOsCommandments {
  WRITING_ENGINE: string;    // Decision tree, ALWAYS/NEVER rules, vulnerability boundary, flavor elements
  SIGNATURE_MOVES: string;   // 3-5 unique techniques with structure and when-to-use
  OPENINGS: string;          // 4-6 opening patterns with examples and energy matches
  MIDDLES: string;           // 4-7 middle patterns with pairing suggestions
  ENDINGS: string;           // 4-6 ending patterns with pairing suggestions
  THEMES: string;            // Core beliefs with evidence, frequency, anti-patterns
  GUARDRAILS: string;        // YES/NO/THE LINE structure, hard NOs, sacred cows
  STORIES: string;           // Key narratives with vulnerability level tags
  ANECDOTES: string;         // Brief deployable examples
  BLEND_HYPOTHESES: string;  // 3-5 content archetypes with O+M+E combos
}

export interface VoiceOsSummary {
  voice_essence: string;
  signature_moves: string[];
  generation_guidance: string;
}

export interface VoiceOsExtractionResult {
  commandments: VoiceOsCommandments;
  summary: VoiceOsSummary;
}

// =============================================================================
// EXECUTIVE REPORT TYPES (for synthesis-prompt.ts)
// =============================================================================

export interface PersonalityTrait {
  trait: string;
  description: string;
  insight: string;
}

export interface Strength {
  strength: string;
  description: string;
}

export interface Challenge {
  challenge: string;
  description: string;
  coping: string; // How they overcome/manage this challenge
}

export interface CommunicationStyle {
  style: string;
  preferences: string[];
}

export interface WorkStyle {
  approach: string;
  optimalConditions?: string[];
  strengths?: string[]; // Legacy field for backwards compatibility
}

export interface VoiceProfile {
  tone: string;
  style: string;
  characteristics: string[];
  examples?: string[];
}

export interface ExecutiveReport {
  // Identity
  name?: string;
  tagline?: string;

  // Core summary
  summary: string;

  // Strengths and challenges
  strengths?: Strength[];
  challenges?: Challenge[];

  // Work and communication
  workStyle: WorkStyle;
  communication: CommunicationStyle;

  // Insights
  keyInsights: string[];

  // Voice profile
  voice?: VoiceProfile;

  // Legacy field for backwards compatibility
  personality?: PersonalityTrait[];
}

// =============================================================================
// COMMANDMENT & REGISTRY TYPES (for extraction-prompt.ts)
// =============================================================================

export interface CommandmentDef {
  name: string;
  description: string;
  category: 'founder' | 'voice';
  mustInclude: string[];
  mayInclude: string[];
  mustNotInclude: string[];
  populatedBy: string[];
}

export interface QuestionDef {
  id: string;
  text: string;
  source: 'question-e' | 'fos-interview' | 'voice-test';
  fills_gaps?: string[];
  priority?: 'high' | 'medium' | 'low';
}

export interface RegistrySchema {
  stories: RegistryStorySchema;
  anecdotes: RegistryAnecdoteSchema;
  events: RegistryEventSchema;
  people: RegistryPersonSchema;
  corrections: RegistryCorrectionSchema;
  parking_lot: RegistryParkingLotSchema;
}

export interface RegistryStorySchema {
  id: string;
  title: string;
  summary: string;
  core_quote: string;
  emotional_tone: string;
  tags: string[];
  used_in: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface RegistryAnecdoteSchema {
  id: string;
  summary: string;
  quote?: string;
  illustrates: string;
  tags: string[];
  used_in: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface RegistryEventSchema {
  id: string;
  date_range: string;
  summary: string;
  impact: string;
  tags: string[];
  used_in: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface RegistryPersonSchema {
  id: string;
  name: string;
  relationship: string;
  context: string;
  can_reference: boolean;
  reference_rules?: string;
  tags: string[];
}

export interface RegistryCorrectionSchema {
  id: string;
  original: string;
  corrected_to: string;
  quote?: string;
  affects: string[];
}

export interface RegistryParkingLotSchema {
  id: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  context: string;
  follow_up_questions?: string[];
}
