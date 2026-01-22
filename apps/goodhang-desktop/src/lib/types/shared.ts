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
// D&D CHARACTER
// =============================================================================

export interface CharacterAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface CharacterProfile {
  race: string;
  characterClass: string;
  alignment: string;
  title?: string;
  attributes?: CharacterAttributes;
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
  | 'welcome'
  | 'about_you'
  | 'work_questions'
  | 'voice_testing'
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
