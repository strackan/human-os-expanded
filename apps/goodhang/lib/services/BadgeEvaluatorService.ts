// BadgeEvaluatorService - Evaluates and awards badges based on assessment results
// Supports both personality (Module A/B) and work (Module C/D) assessments

import type { Attributes, Alignment, AssessmentSignals } from '../assessment/types';
import {
  BadgeDefinition,
  BadgeCondition,
  isAttributeCondition,
  isAlignmentCondition,
  isSocialPatternCondition,
  isWorkDimensionCondition,
  isWorkCategoryCondition,
  isExperienceCondition,
} from '../assessment/badge-types';
import {
  BADGE_DEFINITIONS,
  getPersonalityBadges,
  getWorkBadges,
} from '../assessment/badge-definitions';

// Context for personality badge evaluation (Module A/B)
export interface PersonalityBadgeContext {
  attributes: Attributes;
  alignment: Alignment;
  signals: AssessmentSignals;
  overall_score: number;
}

// Context for work badge evaluation (Module C/D - future)
export interface WorkBadgeContext {
  dimensions: Record<string, number>;
  category_scores: Record<string, { overall: number }>;
  overall_score: number;
  experience_years?: number;
}

// Combined context type
export type BadgeEvaluationContext = PersonalityBadgeContext | WorkBadgeContext;

// Type guard for personality context
function isPersonalityContext(context: BadgeEvaluationContext): context is PersonalityBadgeContext {
  return 'attributes' in context && 'alignment' in context;
}

// Type guard for work context
function isWorkContext(context: BadgeEvaluationContext): context is WorkBadgeContext {
  return 'dimensions' in context && 'category_scores' in context;
}

export class BadgeEvaluatorService {
  /**
   * Evaluates personality badges and returns IDs of earned badges
   */
  static evaluatePersonalityBadges(context: PersonalityBadgeContext): string[] {
    const earnedBadges: string[] = [];
    const personalityBadges = getPersonalityBadges();

    for (const badge of personalityBadges) {
      if (this.evaluateBadge(badge, context)) {
        earnedBadges.push(badge.id);
      }
    }

    return earnedBadges;
  }

  /**
   * Evaluates work badges and returns IDs of earned badges (for future Module C/D)
   */
  static evaluateWorkBadges(context: WorkBadgeContext): string[] {
    const earnedBadges: string[] = [];
    const workBadges = getWorkBadges();

    for (const badge of workBadges) {
      if (this.evaluateBadge(badge, context)) {
        earnedBadges.push(badge.id);
      }
    }

    return earnedBadges;
  }

  /**
   * Evaluates all applicable badges based on context type
   */
  static evaluateBadges(context: BadgeEvaluationContext): string[] {
    if (isPersonalityContext(context)) {
      return this.evaluatePersonalityBadges(context);
    } else if (isWorkContext(context)) {
      return this.evaluateWorkBadges(context);
    }
    return [];
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
   * Evaluates a single condition against the context
   */
  private static evaluateCondition(
    condition: BadgeCondition,
    context: BadgeEvaluationContext
  ): boolean {
    // Personality badge conditions
    if (isPersonalityContext(context)) {
      // Check attribute condition (e.g., INT >= 9)
      if (isAttributeCondition(condition)) {
        const attrValue = context.attributes[condition.attribute];
        return attrValue >= condition.min_score;
      }

      // Check alignment condition
      if (isAlignmentCondition(condition)) {
        if (condition.alignment) {
          const alignments = Array.isArray(condition.alignment)
            ? condition.alignment
            : [condition.alignment];
          if (!alignments.includes(context.alignment)) {
            return false;
          }
        }
        // Could also check order_axis and moral_axis if needed
        return true;
      }

      // Check social pattern condition
      if (isSocialPatternCondition(condition)) {
        if (condition.social_energy && context.signals.social_energy !== condition.social_energy) {
          return false;
        }
        if (condition.relationship_style && context.signals.relationship_style !== condition.relationship_style) {
          return false;
        }
        // Note: connection_style and energy_pattern are in matching profile, not signals
        // If needed, we could extend the context to include matching profile
        return true;
      }
    }

    // Work badge conditions (for future Module C/D)
    if (isWorkContext(context)) {
      // Check work dimension condition
      if (isWorkDimensionCondition(condition)) {
        const dimensionScore = context.dimensions[condition.dimension];
        if (dimensionScore === undefined) return false;
        return dimensionScore >= condition.min_score;
      }

      // Check work category condition
      if (isWorkCategoryCondition(condition)) {
        const categoryScore = context.category_scores[condition.category]?.overall;
        if (categoryScore === undefined) return false;
        return categoryScore >= condition.min_score;
      }

      // Check experience condition
      if (isExperienceCondition(condition)) {
        // Check overall score requirement
        if (condition.min_score !== undefined && context.overall_score < condition.min_score) {
          return false;
        }

        // Check experience years
        if (condition.experience_years) {
          if (context.experience_years === undefined) return false;
          const { min, max } = condition.experience_years;
          if (min !== undefined && context.experience_years < min) return false;
          if (max !== undefined && context.experience_years > max) return false;
        }
        return true;
      }
    }

    // Fallback for unhandled condition types
    return false;
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
      rarity: badge.rarity || 'common',
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
