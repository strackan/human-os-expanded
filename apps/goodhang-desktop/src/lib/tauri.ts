/**
 * Tauri command wrappers with TypeScript types
 */
import { invoke } from '@tauri-apps/api/core';

// Types
export interface ValidationResult {
  valid: boolean;
  sessionId?: string;
  hasExistingUser?: boolean;
  userId?: string;
  preview?: AssessmentPreview;
  error?: string;
}

export interface AssessmentPreview {
  tier: string;
  archetypeHint: string;
  overallScoreRange: string;
}

export interface ClaimResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export interface PersonalityProfile {
  mbti?: string;
  enneagram?: string;
  enneagram_wing?: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
}

export interface AssessmentResults {
  session_id: string;
  user_id?: string;
  archetype: string;
  archetype_confidence?: number;
  overall_score: number;
  dimensions: Record<string, number>;
  tier: string;
  best_fit_roles?: string[];
  personality_profile?: PersonalityProfile;
  badges?: Badge[];
  public_summary?: string;
  detailed_summary?: string;
  category_scores?: Record<string, number>;
}

// Commands
export async function validateActivationKey(
  code: string
): Promise<ValidationResult> {
  return invoke('validate_activation_key', { code });
}

export async function claimActivationKey(
  code: string,
  userId: string
): Promise<ClaimResult> {
  return invoke('claim_activation_key', { code, userId });
}

export async function fetchAssessmentResults(
  sessionId: string,
  token: string
): Promise<AssessmentResults> {
  return invoke('fetch_assessment_results', { sessionId, token });
}

export async function storeSession(
  userId: string,
  sessionId: string,
  token: string
): Promise<void> {
  return invoke('store_session', { userId, sessionId, token });
}

export async function getSession(): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  return invoke('get_session');
}

export async function clearSession(): Promise<void> {
  return invoke('clear_session');
}
