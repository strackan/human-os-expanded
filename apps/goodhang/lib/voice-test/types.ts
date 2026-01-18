/**
 * Voice Test Types (Backend)
 *
 * Shared types for voice test API endpoints.
 */

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

// =============================================================================
// FEEDBACK & ATTEMPTS
// =============================================================================

export interface VoiceFeedback {
  whatDidntWork: string;
  whatTenLooksLike: string;
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

// =============================================================================
// API REQUEST/RESPONSE
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
// SCULPTOR DATA
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
