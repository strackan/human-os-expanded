/**
 * Tauri command wrappers with TypeScript types
 */
import { invoke } from '@tauri-apps/api/core';

// Types
export interface ValidationResult {
  valid: boolean;
  sessionId?: string;
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

export interface AssessmentResults {
  sessionId: string;
  archetype: string;
  tier: string;
  personality: {
    mbti: string;
    enneagram: string;
  };
  dimensions: Record<string, number>;
  badges: string[];
  summary: string;
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
  sessionId: string
): Promise<AssessmentResults> {
  return invoke('fetch_assessment_results', { sessionId });
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
