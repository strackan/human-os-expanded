/**
 * Shared Type Definitions
 *
 * Common types used across multiple components in the desktop app.
 */

// =============================================================================
// MESSAGE TYPES
// =============================================================================

/**
 * Base chat message interface used across tutorial, renubu-chat, and voice-test
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Extended message with metadata (used in voice-test)
 */
export interface MessageWithMetadata extends Message {
  metadata?: Record<string, unknown>;
}

// =============================================================================
// EXECUTIVE REPORT
// =============================================================================

export interface PersonalityTrait {
  trait: string;
  description: string;
  insight: string;
}

export interface CommunicationStyle {
  style: string;
  preferences: string[];
}

export interface WorkStyle {
  approach: string;
  strengths: string[];
}

export interface VoiceProfile {
  tone: string;
  style: string;
  characteristics: string[];
  examples?: string[];
}

/**
 * Executive report generated from Sculptor session
 */
export interface ExecutiveReport {
  summary: string;
  personality: PersonalityTrait[];
  communication: CommunicationStyle;
  workStyle: WorkStyle;
  keyInsights: string[];
  voice?: VoiceProfile;
}

// =============================================================================
// D&D CHARACTER & ASSESSMENT RESULTS
// =============================================================================

export interface CharacterAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Also support API format with uppercase keys
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
  enneagram_hint?: string;  // e.g., "7w8"
  interest_vectors: string[];  // e.g., ["counterculture", "travel", "philosophy"]
  social_energy: SocialEnergy;
  relationship_style: RelationshipStyle;
}

export interface MatchingProfile {
  ideal_group_size: string;  // e.g., "2-4 or 20+"
  connection_style: ConnectionStyle;
  energy_pattern: EnergyPattern;
  good_match_with: string[];  // e.g., ["creatives", "rule-breakers"]
  avoid_match_with: string[];  // e.g., ["rigid planners", "small-talk lovers"]
}

export interface CharacterProfile {
  race: string;
  characterClass?: string;  // Desktop format
  class?: string;           // API format
  alignment: string;
  title?: string;
  tagline?: string;         // API format (same as title)
  attributes?: CharacterAttributes | ApiAttributes;
  // Extended assessment data
  signals?: AssessmentSignals;
  matching?: MatchingProfile;
  overall_score?: number;
  summary?: string;         // 300-500 word personality summary
}

// =============================================================================
// LOADING STATES
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

// =============================================================================
// QUICK ACTIONS
// =============================================================================

export interface QuickAction {
  label: string;
  value: string;
}

// =============================================================================
// PERSONA FINGERPRINT
// =============================================================================

export interface PersonaFingerprint {
  self_deprecation: number;
  directness: number;
  warmth: number;
  intellectual_signaling: number;
  comfort_with_sincerity: number;
  absurdism_tolerance: number;
  format_awareness: number;
  vulnerability_as_tool: number;
}

// =============================================================================
// EXTRACTED ENTITIES
// =============================================================================

export type EntityType = 'person' | 'company' | 'project' | 'goal' | 'task' | 'event';

export interface ExtractedEntity {
  type: EntityType;
  name: string;
  context: string;
  confirmed?: boolean;
}

// =============================================================================
// TUTORIAL TYPES
// =============================================================================

export type TutorialStep =
  | 'interview'
  | 'voice_testing'
  | 'question_e'
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

export interface OutstandingQuestion {
  id: string;
  title: string;
  prompt: string;
  category: string;
}

// =============================================================================
// SETUP MODE
// =============================================================================

export type ChecklistStatus = 'pending' | 'in_progress' | 'completed' | 'locked';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  status: ChecklistStatus;
  artifacts?: string[];
}
