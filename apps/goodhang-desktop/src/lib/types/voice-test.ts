/**
 * Voice Test Module - Type Definitions
 *
 * Types for the voice test onboarding flow that allows users to
 * iteratively test and refine their AI-generated voice.
 */

// =============================================================================
// STATE MACHINE
// =============================================================================

export type VoiceTestStage =
  | 'intro'                    // Agent explains voice test
  | 'choice'                   // "Let's do it" or "Later"
  | 'content_prompt'           // User provides topic details
  | 'generating'               // AI generating content
  | 'rating'                   // User rates 1-10
  | 'feedback'                 // If <9: collect 3 pieces of feedback
  | 'complete_type'            // Move to next content type
  | 'generating_commandments'  // Generating final commandments
  | 'complete';                // Show final commandments

// =============================================================================
// CONTENT TYPES
// =============================================================================

export type ContentType =
  | 'linkedin_post'
  | 'email'
  | 'connection_request'
  | 'note';

export type ContentStyle =
  | 'salesy'
  | 'thought_leadership'
  | 'introspective'
  | 'professional'
  | 'casual'
  | 'connection'
  | 'meeting_prep';

export interface ContentTypeConfig {
  id: string;
  type: ContentType;
  style: ContentStyle;
  label: string;
  description: string;
  promptHint: string;
  icon: string;
}

/**
 * All content types to test during voice calibration
 */
export const CONTENT_TYPES: ContentTypeConfig[] = [
  // LinkedIn Posts (3 styles)
  {
    id: 'linkedin_salesy',
    type: 'linkedin_post',
    style: 'salesy',
    label: 'LinkedIn: Promotional',
    description: 'A post promoting something you offer',
    promptHint: 'What product, service, or offering would you like to promote?',
    icon: 'megaphone',
  },
  {
    id: 'linkedin_thought',
    type: 'linkedin_post',
    style: 'thought_leadership',
    label: 'LinkedIn: Thought Leadership',
    description: 'A post sharing expertise or a contrarian take',
    promptHint: 'What insight or opinion would you like to share?',
    icon: 'lightbulb',
  },
  {
    id: 'linkedin_personal',
    type: 'linkedin_post',
    style: 'introspective',
    label: 'LinkedIn: Personal Story',
    description: 'A reflective or personal post',
    promptHint: 'What personal experience or reflection would you like to share?',
    icon: 'heart',
  },
  // Emails (2 styles)
  {
    id: 'email_professional',
    type: 'email',
    style: 'professional',
    label: 'Email: Professional',
    description: 'A business or professional email',
    promptHint: 'Who are you emailing and what\'s the main purpose?',
    icon: 'mail',
  },
  {
    id: 'email_followup',
    type: 'email',
    style: 'casual',
    label: 'Email: Follow-up',
    description: 'A casual follow-up or check-in email',
    promptHint: 'Who are you following up with and about what?',
    icon: 'reply',
  },
  // Other (2 types)
  {
    id: 'connection_request',
    type: 'connection_request',
    style: 'connection',
    label: 'Connection Request',
    description: 'A LinkedIn connection request message',
    promptHint: 'Who do you want to connect with and why?',
    icon: 'user-plus',
  },
  {
    id: 'meeting_notes',
    type: 'note',
    style: 'meeting_prep',
    label: 'Meeting Prep Notes',
    description: 'Notes or prep for an upcoming meeting',
    promptHint: 'What meeting are you preparing for?',
    icon: 'clipboard',
  },
];

// =============================================================================
// GENERATION & FEEDBACK
// =============================================================================

export interface VoiceFeedback {
  /** "What specifically didn't you like?" */
  whatDidntWork: string;
  /** "What would the 10 version look like?" */
  whatTenLooksLike: string;
  /** "What question/instruction would have helped?" */
  helpfulInstruction: string;
}

export interface GenerationAttempt {
  id: string;
  contentTypeId: string;
  userPrompt: string;
  generatedContent: string;
  rating: number | null;
  feedback: VoiceFeedback | null;
  timestamp: string;
}

export interface ContentTypeProgress {
  contentTypeId: string;
  completed: boolean;
  attempts: GenerationAttempt[];
  bestRating: number;
}

// =============================================================================
// COMMANDMENTS
// =============================================================================

export interface VoiceCommandment {
  number: number;
  title: string;
  description: string;
  examples: string[];
  contentTypes: string[];
}

export interface VoiceCommandmentsResult {
  commandments: VoiceCommandment[];
  summary: string;
  voiceScore: number;
}

// =============================================================================
// PERSISTENCE
// =============================================================================

export interface VoiceTestProgress {
  sessionId: string;
  stage: VoiceTestStage;
  currentContentTypeIndex: number;
  completedContentTypes: string[];
  allAttempts: GenerationAttempt[];
  currentAttempt: Partial<GenerationAttempt> | null;
  startedAt: string;
  lastUpdatedAt: string;
}

export interface VoiceTestCompletion {
  sessionId: string;
  completedAt: string;
  commandments: VoiceCommandment[];
  summary: string;
  totalAttempts: number;
  averageRating: number;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface GenerateContentRequest {
  session_id: string;
  content_type: ContentType;
  style: ContentStyle;
  user_prompt: string;
  previous_attempts?: {
    content: string;
    rating: number;
    feedback: VoiceFeedback;
  }[];
}

export interface GenerateContentResponse {
  content: string;
  voice_score: number;
}

export interface GenerateCommandmentsRequest {
  session_id: string;
  all_attempts: GenerationAttempt[];
}

export interface GenerateCommandmentsResponse {
  commandments: VoiceCommandment[];
  summary: string;
}

// =============================================================================
// SCULPTOR VOICE DATA (v0 source)
// =============================================================================

export interface SculptorVoiceData {
  tone: string;
  style: string;
  characteristics: string[];
  examples: string[];
}

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
// MESSAGES
// =============================================================================

export interface VoiceTestMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    stage?: VoiceTestStage;
    generatedContent?: string;
    rating?: number;
    feedback?: VoiceFeedback;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

export const STORAGE_KEYS = {
  PROGRESS: 'founder-os-voice-test-progress',
  COMPLETED: 'founder-os-voice-test-completed',
} as const;

export function getContentTypeById(id: string): ContentTypeConfig | undefined {
  return CONTENT_TYPES.find(ct => ct.id === id);
}

export function getContentTypesByType(type: ContentType): ContentTypeConfig[] {
  return CONTENT_TYPES.filter(ct => ct.type === type);
}

export function createEmptyProgress(sessionId: string): VoiceTestProgress {
  return {
    sessionId,
    stage: 'intro',
    currentContentTypeIndex: 0,
    completedContentTypes: [],
    allAttempts: [],
    currentAttempt: null,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}
