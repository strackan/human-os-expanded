/**
 * Sculptor Session Types
 *
 * Type definitions for the Sculptor interview session system.
 */

export type SculptorSessionStatus = 'active' | 'revoked' | 'completed';

export interface SculptorTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  system_prompt: string;
  output_format: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SculptorSession {
  id: string;
  access_code: string;
  template_id: string | null;
  entity_name: string | null;
  output_path: string | null;
  status: SculptorSessionStatus;
  thread_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  last_accessed_at: string | null;
  // Joined data
  template?: SculptorTemplate;
}

export interface SculptorResponse {
  id: string;
  session_id: string;
  scene: string | null;
  question_key: string | null;
  question_text: string | null;
  response_text: string | null;
  routing_target: string | null;
  sequence: number | null;
  created_at: string;
}

export interface CreateSessionParams {
  template_slug: string;
  entity_name?: string;
  output_path?: string;
  metadata?: Record<string, unknown>;
}

export interface ValidateCodeResult {
  valid: boolean;
  session?: SculptorSession;
  error?: string;
}

export interface CaptureResponseParams {
  session_id: string;
  scene?: string;
  question_key?: string;
  question_text?: string;
  response_text: string;
  routing_target?: string;
}

export interface ExportOptions {
  format: 'markdown' | 'json';
  include_metadata?: boolean;
}
