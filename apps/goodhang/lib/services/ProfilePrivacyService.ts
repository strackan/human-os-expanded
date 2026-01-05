/**
 * Profile Privacy Service
 *
 * Centralized privacy controls for public profiles.
 * Ensures scores, emails, and other sensitive data are only shown
 * when explicitly permitted by the user.
 */

import type { PublicProfile } from '@/lib/assessment/types';

export class ProfilePrivacyService {
  /**
   * Apply privacy filters to a single profile
   * - Removes scores if show_scores is false
   * - Removes email if not explicitly set
   */
  static sanitizeProfile(profile: PublicProfile): PublicProfile {
    const sanitized = { ...profile };

    // Hide scores if user hasn't opted to show them
    if (!profile.show_scores) {
      delete sanitized.overall_score;
      delete sanitized.category_scores;
    }

    // Remove email field entirely if not provided
    if (!profile.email) {
      delete sanitized.email;
    }

    return sanitized;
  }

  /**
   * Apply privacy filters to multiple profiles
   */
  static sanitizeProfiles(profiles: PublicProfile[]): PublicProfile[] {
    return profiles.map(this.sanitizeProfile);
  }

  /**
   * Validate that a profile is safe to publish
   * Returns validation errors if any
   */
  static validateProfileForPublish(data: {
    name?: string;
    career_level?: string;
    archetype?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required to publish profile');
    }

    if (!data.career_level) {
      errors.push('Career level is required to publish profile');
    }

    // Archetype is optional but recommended
    if (!data.archetype) {
      console.warn('Profile published without archetype');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if scores should be visible for a profile
   */
  static shouldShowScores(profile: PublicProfile): boolean {
    return profile.show_scores === true;
  }

  /**
   * Check if email should be visible for a profile
   */
  static shouldShowEmail(profile: PublicProfile): boolean {
    return !!profile.email && profile.email.trim().length > 0;
  }

  /**
   * Redact sensitive information from profile for logging
   */
  static redactForLogging(profile: PublicProfile): Partial<PublicProfile> {
    return {
      user_id: profile.user_id.substring(0, 8) + '...',
      profile_slug: profile.profile_slug,
      name: profile.name,
      career_level: profile.career_level,
      ...(profile.archetype && { archetype: profile.archetype }),
      show_scores: profile.show_scores,
      // Email intentionally omitted for privacy
    };
  }
}
