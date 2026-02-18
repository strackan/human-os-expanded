/**
 * Founder OS Types
 *
 * Shared types for the Founders web experience.
 * Ported from desktop app — no Tauri imports.
 */

// =============================================================================
// PRODUCT & AUTH TYPES
// =============================================================================

export type ProductType = 'human_os' | 'founder_os' | 'renubu' | 'gft' | 'voice_os' | 'goodhang';

export interface ValidationResult {
  valid: boolean;
  product?: ProductType;
  sessionId?: string;
  hasExistingUser?: boolean;
  userId?: string;
  humanOsUserId?: string;
  preview?: AssessmentPreview;
  error?: string;
  alreadyRedeemed?: boolean;
}

export interface AssessmentPreview {
  tier: string;
  archetypeHint: string;
  overallScoreRange: string;
}

export interface ClaimResult {
  success: boolean;
  product?: ProductType;
  userId?: string;
  humanOsUserId?: string;
  error?: string;
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// =============================================================================
// EXECUTIVE REPORT (Personal Assessment)
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
  coping: string;
}

export interface CommunicationStyle {
  style: string;
  preferences: string[];
}

export interface WorkStyle {
  approach: string;
  optimalConditions?: string[];
  strengths?: string[];
}

export interface VoiceProfile {
  tone: string;
  style: string;
  characteristics: string[];
  examples?: string[];
}

export interface ExecutiveReport {
  name?: string;
  tagline?: string;
  summary: string;
  strengths?: Strength[];
  challenges?: Challenge[];
  workStyle: WorkStyle;
  communication: CommunicationStyle;
  keyInsights: string[];
  voice?: VoiceProfile;
  personality?: PersonalityTrait[];
}

// =============================================================================
// CHARACTER PROFILE
// =============================================================================

export interface CharacterAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface ApiAttributes {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export type SocialEnergy = 'introvert' | 'extrovert' | 'ambivert' | 'selective_extrovert';
export type RelationshipStyle = 'depth_seeking' | 'breadth_seeking' | 'balanced' | 'experience_based';
export type ConnectionStyle = 'conversation_based' | 'experience_based' | 'activity_based' | 'intellectual';
export type EnergyPattern = 'spontaneous' | 'planned' | 'flexible' | 'routine_oriented';

export interface AssessmentSignals {
  enneagram_hint?: string;
  interest_vectors: string[];
  social_energy: SocialEnergy;
  relationship_style: RelationshipStyle;
}

export interface MatchingProfile {
  ideal_group_size: string;
  connection_style: ConnectionStyle;
  energy_pattern: EnergyPattern;
  good_match_with: string[];
  avoid_match_with: string[];
}

export interface CharacterProfile {
  race: string;
  characterClass?: string;
  class?: string;
  alignment: string;
  title?: string;
  tagline?: string;
  attributes?: CharacterAttributes | ApiAttributes;
  signals?: AssessmentSignals;
  matching?: MatchingProfile;
  overall_score?: number;
  summary?: string;
}

// =============================================================================
// LOADING & UI STATES
// =============================================================================

export interface LoadingStage {
  message: string;
  duration: number;
}

export interface LoadingState {
  active: boolean;
  stage: number;
  message: string;
}

export interface QuickAction {
  label: string;
  value: string;
}

// =============================================================================
// TUTORIAL TYPES
// =============================================================================

export type TutorialStep =
  | 'interview'
  | 'voice_testing'
  | 'question_e'
  | 'assessment_review'
  | 'tool_testing'
  | 'complete';

export interface TutorialProgress {
  currentStep: TutorialStep;
  stepIndex: number;
  questionsAnswered: number;
  totalQuestions: number;
  viewedReport: boolean;
}

export interface ReportConfirmations {
  status: boolean;
  personality: boolean;
  voice: boolean;
  character: boolean;
}

// =============================================================================
// USER STATUS
// =============================================================================

export interface GoodHangAssessment {
  completed: boolean;
  status: string;
  tier: string | null;
  archetype: string | null;
  overall_score: number | null;
  session_id: string | null;
}

export interface SculptorStatus {
  completed: boolean;
  status: string;
  transcript_available: boolean;
}

export interface IdentityProfile {
  completed: boolean;
  annual_theme: string | null;
  core_values: string[] | null;
}

export interface UserStatus {
  found: boolean;
  user?: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
  products: {
    goodhang: {
      enabled: boolean;
      assessment: GoodHangAssessment | null;
    };
    founder_os: {
      enabled: boolean;
      sculptor: SculptorStatus | null;
      identity_profile: IdentityProfile | null;
    };
    voice_os: {
      enabled: boolean;
      context_files_count: number;
    };
  };
  entities: {
    count: number;
    has_entity: boolean;
  };
  contexts: {
    available: string[];
    active: string | null;
  };
  recommended_action:
    | 'view_assessment'
    | 'start_onboarding'
    | 'continue_context'
    | 'complete_assessment';
}

// =============================================================================
// COMMANDMENTS
// =============================================================================

export interface FounderOsCommandments {
  CURRENT_STATE: string;
  STRATEGIC_THOUGHT_PARTNER: string;
  DECISION_MAKING: string;
  ENERGY_PATTERNS: string;
  AVOIDANCE_PATTERNS: string;
  RECOVERY_PROTOCOLS: string;
  ACCOUNTABILITY_FRAMEWORK: string;
  EMOTIONAL_SUPPORT: string;
  WORK_STYLE: string;
  CONVERSATION_PROTOCOLS: string;
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
  WRITING_ENGINE: string;
  SIGNATURE_MOVES: string;
  OPENINGS: string;
  MIDDLES: string;
  ENDINGS: string;
  THEMES: string;
  GUARDRAILS: string;
  STORIES: string;
  ANECDOTES: string;
  BLEND_HYPOTHESES: string;
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
// PRODUCTION TYPES
// =============================================================================

export type ProductionMode =
  | 'default'
  | 'journal'
  | 'brainstorm'
  | 'check-in'
  | 'crisis'
  | 'post'
  | 'search';

export interface DoGateResult {
  matched: boolean;
  confidence: number;
  aliasPattern: string | null;
  summary: string;
  resolvedEntities: string[];
  clarification: ClarificationOption[] | null;
}

export interface ClarificationOption {
  label: string;
  entitySlug: string;
  entityType: string;
}

export interface ProductionMetadata {
  doGateResult?: DoGateResult;
  mode?: ProductionMode;
  entities?: string[];
  modeSwitch?: {
    from: ProductionMode;
    to: ProductionMode;
    reason: string;
  };
}
