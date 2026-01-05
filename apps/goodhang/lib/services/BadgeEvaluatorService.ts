// BadgeEvaluatorService - Evaluates and awards badges based on assessment results

import {
  AssessmentDimensions,
  CategoryScores,
  BadgeDefinition,
  BadgeCondition,
  ScoringDimension
} from '../assessment/types';
import { BADGE_DEFINITIONS } from '../assessment/badge-definitions';

export interface BadgeEvaluationContext {
  dimensions: AssessmentDimensions;
  category_scores: CategoryScores;
  overall_score: number;
  experience_years?: number;
}

export class BadgeEvaluatorService {
  /**
   * Evaluates all badges and returns IDs of earned badges
   */
  static evaluateBadges(context: BadgeEvaluationContext): string[] {
    const earnedBadges: string[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      if (this.evaluateBadge(badge, context)) {
        earnedBadges.push(badge.id);
      }
    }

    return earnedBadges;
  }

  /**
   * Evaluates a single badge against the context
   */
  private static evaluateBadge(
    badge: BadgeDefinition,
    context: BadgeEvaluationContext
  ): boolean {
    const { criteria } = badge;
    const { conditions, requires_all = true } = criteria;

    if (!conditions || conditions.length === 0) {
      return false;
    }

    // AND logic (all conditions must pass)
    if (requires_all) {
      return conditions.every((condition) =>
        this.evaluateCondition(condition, context)
      );
    }

    // OR logic (at least one condition must pass)
    return conditions.some((condition) =>
      this.evaluateCondition(condition, context)
    );
  }

  /**
   * Evaluates a single condition
   */
  private static evaluateCondition(
    condition: BadgeCondition,
    context: BadgeEvaluationContext
  ): boolean {
    const {
      dimension,
      category,
      min_score,
      max_score,
      experience_years,
    } = condition;

    // Check dimension score
    if (dimension) {
      const dimensionScore = context.dimensions[dimension as ScoringDimension];
      if (dimensionScore === undefined) return false;

      if (min_score !== undefined && dimensionScore < min_score) return false;
      if (max_score !== undefined && dimensionScore > max_score) return false;
    }

    // Check category score
    if (category) {
      const categoryScore = context.category_scores[category]?.overall;
      if (categoryScore === undefined) return false;

      if (min_score !== undefined && categoryScore < min_score) return false;
      if (max_score !== undefined && categoryScore > max_score) return false;
    }

    // Check overall score (for achievement badges)
    if (!dimension && !category && min_score !== undefined) {
      if (context.overall_score < min_score) return false;
    }

    // Check experience years
    if (experience_years) {
      if (context.experience_years === undefined) return false;

      const { min, max } = experience_years;
      if (min !== undefined && context.experience_years < min) return false;
      if (max !== undefined && context.experience_years > max) return false;
    }

    return true;
  }

  /**
   * Gets full badge details for earned badge IDs
   */
  static getBadgeDetails(badgeIds: string[]): BadgeDefinition[] {
    return BADGE_DEFINITIONS.filter((badge) => badgeIds.includes(badge.id));
  }

  /**
   * Formats badges for API response
   */
  static formatBadgesForResponse(badgeIds: string[], earnedAt: string = new Date().toISOString()) {
    return this.getBadgeDetails(badgeIds).map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      earned_at: earnedAt,
    }));
  }

  /**
   * Extract experience years from answers (legacy format)
   * Looks for prof-1 question which asks about years of experience
   */
  static extractExperienceYears(answers: Record<string, { answer: string }>): number | undefined {
    const profAnswer = answers['prof-1'];
    if (!profAnswer?.answer) return undefined;

    return this.parseYearsFromText(profAnswer.answer);
  }

  /**
   * Extract experience years from interview transcript
   * Looks for prof-1 question which asks about years of experience
   */
  static extractExperienceYearsFromTranscript(
    transcript: Array<{ role: string; content: string; question_id?: string }>
  ): number | undefined {
    // Find the prof-1 question and its answer
    for (let i = 0; i < transcript.length; i++) {
      const entry = transcript[i];
      if (entry && entry.role === 'assistant' && entry.question_id === 'prof-1') {
        // The next entry should be the user's answer
        const answerEntry = transcript[i + 1];
        if (answerEntry?.role === 'user') {
          return this.parseYearsFromText(answerEntry.content);
        }
      }
    }
    return undefined;
  }

  /**
   * Parse years from text content
   */
  private static parseYearsFromText(text: string): number | undefined {
    const answerText = text.toLowerCase();

    // Look for patterns like "5 years", "10+ years", "3-5 years", etc.
    const patterns = [
      /(\d+)\+?\s*years?/i,
      /(\d+)-(\d+)\s*years?/i,
      /years?:\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = answerText.match(pattern);
      if (match) {
        // For ranges (3-5 years), take the upper bound
        const years = match[2] ? parseInt(match[2]) : parseInt(match[1] || "0");
        return years;
      }
    }

    return undefined;
  }
}
