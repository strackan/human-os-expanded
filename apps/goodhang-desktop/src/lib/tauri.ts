/**
 * Tauri command wrappers with TypeScript types
 */
import { invoke } from '@tauri-apps/api/core';

// Product types - matches human_os.products table
export type ProductType = 'human_os' | 'founder_os' | 'renubu' | 'gft' | 'voice_os' | 'goodhang';

// Types
export interface ValidationResult {
  valid: boolean;
  product?: ProductType;
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
  product?: ProductType;
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

// V3 Types (D&D Character Profile)
export interface CharacterProfile {
  tagline: string;
  alignment: string;
  race: string;
  class: string;
}

export interface Attributes {
  INT: number;
  WIS: number;
  CHA: number;
  CON: number;
  STR: number;
  DEX: number;
}

export interface AssessmentSignals {
  enneagram_hint?: string;
  interest_vectors?: string[];
  social_energy?: string;
  relationship_style?: string;
}

export interface MatchingProfile {
  ideal_group_size?: string;
  connection_style?: string;
  energy_pattern?: string;
  good_match_with?: string[];
  avoid_match_with?: string[];
}

// Assessment Results - supports both V1 (work) and V3 (D&D) formats
export interface AssessmentResults {
  session_id: string;
  user_id?: string;
  overall_score: number;

  // V1 fields (work assessment) - optional for V3 compatibility
  archetype?: string;
  archetype_confidence?: number;
  dimensions?: Record<string, number>;
  tier?: string;
  best_fit_roles?: string[];
  personality_profile?: PersonalityProfile;
  badges?: Badge[];
  public_summary?: string;
  detailed_summary?: string;
  category_scores?: Record<string, number>;

  // V3 fields (D&D character profile)
  character_profile?: CharacterProfile;
  attributes?: Attributes;
  signals?: AssessmentSignals;
  matching?: MatchingProfile;
  question_scores?: Record<string, unknown>;
}

// Helper to detect which format the results are in
export function isV3Results(results: AssessmentResults): boolean {
  return !!results.character_profile;
}

export function isV1Results(results: AssessmentResults): boolean {
  return !!results.archetype && !!results.dimensions;
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
