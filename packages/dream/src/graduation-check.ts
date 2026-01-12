/**
 * Graduation Check
 *
 * Checks if a user has met the criteria to graduate from Tutorial Mode
 * to Development Mode.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DreamConfig, OnboardingState } from './types.js';

// =============================================================================
// GRADUATION CRITERIA
// =============================================================================

export interface GraduationCriteria {
  questions: {
    answered: number;
    required: number;
    percentage: number;
    communicationPrefsComplete: boolean;
    crisisPatternsComplete: boolean;
  };
  milestones: {
    required: string[];
    requiredMet: boolean;
    optional: string[];
    optionalCount: number;
    optionalRequired: number;
  };
  interaction: {
    days: number;
    daysRequired: number;
  };
  eligible: boolean;
  missingRequirements: string[];
}

// =============================================================================
// GRADUATION CHECKER CLASS
// =============================================================================

export class GraduationChecker {
  private supabase: SupabaseClient;

  constructor(private config: DreamConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Get current onboarding state for user
   */
  async getOnboardingState(): Promise<OnboardingState | null> {
    const { data, error } = await this.supabase
      .schema('founder_os')
      .from('onboarding_state')
      .select('*')
      .eq('user_id', this.config.userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      userId: data.user_id,
      mode: data.mode,
      questionsAnswered: data.questions_answered || {},
      questionsAnsweredCount: data.questions_answered_count || 0,
      communicationPrefsComplete: data.communication_prefs_complete || false,
      crisisPatternsComplete: data.crisis_patterns_complete || false,
      milestonesCompleted: data.milestones_completed || {},
      milestonesCount: data.milestones_count || 0,
      daysOfInteraction: data.days_of_interaction || 0,
      personaSignals: data.persona_signals || {},
      graduatedAt: data.graduated_at,
      toughLoveEnabled: data.tough_love_enabled || false,
    };
  }

  /**
   * Check graduation eligibility using database function
   */
  async checkEligibility(): Promise<GraduationCriteria> {
    // Call the database function
    const { data, error } = await this.supabase.rpc('founder_os.check_graduation_eligibility', {
      p_user_id: this.config.userId,
    });

    if (error) {
      throw new Error(`Failed to check graduation eligibility: ${error.message}`);
    }

    const criteria = data?.criteria || {};
    const eligible = data?.eligible || false;

    // Build missing requirements list
    const missing: string[] = [];

    if (criteria.questions_answered < criteria.questions_required) {
      missing.push(
        `Need ${criteria.questions_required - criteria.questions_answered} more questions answered`
      );
    }
    if (!criteria.communication_prefs_complete) {
      missing.push('Communication preferences (G11-G14) not complete');
    }
    if (!criteria.crisis_patterns_complete) {
      missing.push('Crisis patterns (G15-G19) not complete');
    }
    if (!criteria.required_milestones_met) {
      missing.push('Required milestones (first_project, first_goal, first_task) not met');
    }
    if (criteria.optional_milestones_count < criteria.optional_milestones_required) {
      missing.push(
        `Need ${criteria.optional_milestones_required - criteria.optional_milestones_count} more optional milestones`
      );
    }
    if (criteria.days_of_interaction < criteria.days_required) {
      missing.push(
        `Need ${criteria.days_required - criteria.days_of_interaction} more days of interaction`
      );
    }

    return {
      questions: {
        answered: criteria.questions_answered || 0,
        required: criteria.questions_required || 17,
        percentage: Math.round(((criteria.questions_answered || 0) / 34) * 100),
        communicationPrefsComplete: criteria.communication_prefs_complete || false,
        crisisPatternsComplete: criteria.crisis_patterns_complete || false,
      },
      milestones: {
        required: ['first_project', 'first_goal', 'first_task'],
        requiredMet: criteria.required_milestones_met || false,
        optional: ['first_contact', 'first_company', 'first_glossary', 'first_journal', 'first_relationship'],
        optionalCount: criteria.optional_milestones_count || 0,
        optionalRequired: criteria.optional_milestones_required || 3,
      },
      interaction: {
        days: criteria.days_of_interaction || 0,
        daysRequired: criteria.days_required || 7,
      },
      eligible,
      missingRequirements: missing,
    };
  }

  /**
   * Attempt to graduate user to development mode
   */
  async graduate(): Promise<{
    success: boolean;
    message: string;
    criteria?: GraduationCriteria;
  }> {
    // First check eligibility
    const criteria = await this.checkEligibility();

    if (!criteria.eligible) {
      return {
        success: false,
        message: `Not eligible for graduation. Missing: ${criteria.missingRequirements.join(', ')}`,
        criteria,
      };
    }

    // Call the graduate function
    const { data, error } = await this.supabase.rpc('founder_os.graduate_to_development', {
      p_user_id: this.config.userId,
    });

    if (error) {
      return {
        success: false,
        message: `Failed to graduate: ${error.message}`,
        criteria,
      };
    }

    if (data?.success) {
      return {
        success: true,
        message: 'Successfully graduated to Development Mode!',
        criteria,
      };
    }

    return {
      success: false,
      message: data?.reason || 'Unknown error during graduation',
      criteria,
    };
  }

  /**
   * Record a daily interaction (for days_of_interaction tracking)
   */
  async recordInteraction(): Promise<{ success: boolean; newDay: boolean }> {
    const { data, error } = await this.supabase.rpc('founder_os.record_interaction', {
      p_user_id: this.config.userId,
    });

    if (error) {
      return { success: false, newDay: false };
    }

    return {
      success: data?.success || false,
      newDay: data?.new_day || false,
    };
  }

  /**
   * Record a milestone achievement
   */
  async recordMilestone(
    milestone:
      | 'first_contact'
      | 'first_company'
      | 'first_project'
      | 'first_goal'
      | 'first_task'
      | 'first_glossary'
      | 'first_journal'
      | 'first_relationship'
  ): Promise<{ success: boolean; firstTime: boolean }> {
    const { data, error } = await this.supabase.rpc('founder_os.record_milestone', {
      p_user_id: this.config.userId,
      p_milestone: milestone,
    });

    if (error) {
      return { success: false, firstTime: false };
    }

    return {
      success: data?.success || false,
      firstTime: data?.first_time || false,
    };
  }

  /**
   * Get a progress summary for display
   */
  async getProgressSummary(): Promise<string> {
    const criteria = await this.checkEligibility();

    const lines: string[] = [
      `## Tutorial Mode Progress`,
      ``,
      `**Questions:** ${criteria.questions.answered}/34 (${criteria.questions.percentage}%)`,
      `- Communication Prefs (G11-G14): ${criteria.questions.communicationPrefsComplete ? '✓' : '○'}`,
      `- Crisis Patterns (G15-G19): ${criteria.questions.crisisPatternsComplete ? '✓' : '○'}`,
      ``,
      `**Milestones:**`,
      `- Required: ${criteria.milestones.requiredMet ? '✓' : '○'} (project, goal, task)`,
      `- Optional: ${criteria.milestones.optionalCount}/${criteria.milestones.optionalRequired}`,
      ``,
      `**Interaction:** ${criteria.interaction.days}/${criteria.interaction.daysRequired} days`,
      ``,
    ];

    if (criteria.eligible) {
      lines.push(`**Status:** Ready to graduate! 🎓`);
    } else {
      lines.push(`**Remaining:**`);
      for (const req of criteria.missingRequirements) {
        lines.push(`- ${req}`);
      }
    }

    return lines.join('\n');
  }
}

/**
 * Create a graduation checker instance
 */
export function createGraduationChecker(config: DreamConfig): GraduationChecker {
  return new GraduationChecker(config);
}
