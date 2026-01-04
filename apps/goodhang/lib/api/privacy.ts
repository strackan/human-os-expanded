// Privacy validation and sanitization utilities for public profiles

import type { PublicProfile, CategoryScores } from '@/lib/assessment/types';

/**
 * Sanitize a public profile to respect privacy settings
 * - Hide scores if show_scores is false
 * - Remove email if not present
 */
export function sanitizePublicProfile(profile: Record<string, unknown>): PublicProfile {
  const sanitized: PublicProfile = {
    user_id: profile.user_id as string,
    session_id: profile.session_id as string | null,
    profile_slug: profile.profile_slug as string,
    name: profile.name as string,
    career_level: profile.career_level as string,
    years_experience: profile.years_experience as number,
    show_scores: (profile.show_scores as boolean) || false,
    published_at: profile.published_at as string,
    updated_at: profile.updated_at as string,
  };

  // Optional fields
  if (profile.email) {
    sanitized.email = profile.email as string;
  }

  if (profile.self_description) {
    sanitized.self_description = profile.self_description as string;
  }

  if (profile.personality_type) {
    sanitized.personality_type = profile.personality_type as string;
  }

  if (profile.archetype) {
    sanitized.archetype = profile.archetype as string;
  }

  if (profile.badges) {
    sanitized.badges = profile.badges as string[];
  }

  if (profile.best_fit_roles) {
    sanitized.best_fit_roles = profile.best_fit_roles as string[];
  }

  if (profile.public_summary) {
    sanitized.public_summary = profile.public_summary as string;
  }

  if (profile.video_url) {
    sanitized.video_url = profile.video_url as string;
  }

  // Only include scores if show_scores is true
  if (profile.show_scores) {
    sanitized.overall_score = profile.overall_score as number;
    sanitized.category_scores = profile.category_scores as CategoryScores;
  }

  return sanitized;
}

/**
 * Sanitize an array of public profiles
 */
export function sanitizePublicProfiles(profiles: Array<Record<string, unknown>>): PublicProfile[] {
  return profiles.map(sanitizePublicProfile);
}

/**
 * Validate that a profile is ready to be published
 * Returns an array of validation errors, empty if valid
 */
export function validateProfileForPublishing(session: Record<string, unknown>, profile: Record<string, unknown>): string[] {
  const errors: string[] = [];

  // Check assessment completion
  if (session.status !== 'completed') {
    errors.push('Assessment must be completed before publishing');
  }

  // Check required fields
  if (!profile.full_name || typeof profile.full_name !== 'string' || profile.full_name.trim().length === 0) {
    errors.push('Profile name is required');
  }

  if (!session.archetype) {
    errors.push('Archetype must be determined before publishing');
  }

  if (!session.career_level) {
    errors.push('Career level is required');
  }

  if (session.years_experience === null || session.years_experience === undefined) {
    errors.push('Years of experience is required');
  }

  // Check that at least some assessment data exists
  if (!session.overall_score && !session.category_scores) {
    errors.push('Assessment scores are missing');
  }

  return errors;
}

/**
 * Check if a user can publish their profile
 */
export function canPublishProfile(session: Record<string, unknown>, profile: Record<string, unknown>): boolean {
  return validateProfileForPublishing(session, profile).length === 0;
}

/**
 * Privacy settings interface
 */
export interface PrivacySettings {
  show_scores: boolean;
  show_email: boolean;
  video_url?: string;
}

/**
 * Validate privacy settings
 */
export function validatePrivacySettings(settings: Partial<PrivacySettings>): {
  valid: boolean;
  settings: PrivacySettings;
  errors: string[];
} {
  const errors: string[] = [];
  const validatedSettings: PrivacySettings = {
    show_scores: settings.show_scores ?? false,
    show_email: settings.show_email ?? false,
  };

  if (settings.video_url) {
    // Validate video URL format
    try {
      const url = new URL(settings.video_url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('Video URL must use HTTP or HTTPS protocol');
      }
      validatedSettings.video_url = settings.video_url;
    } catch {
      errors.push('Invalid video URL format');
    }
  }

  return {
    valid: errors.length === 0,
    settings: validatedSettings,
    errors,
  };
}
