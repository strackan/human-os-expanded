/**
 * Onboarding Service
 *
 * Manages user onboarding flow and progress tracking.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface OnboardingProgress {
  userId: string;
  completedSteps: string[];
  currentStep: string;
  percentComplete: number;
  scheduledCall?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ONBOARDING_STEPS = [
  'account_created',
  'profile_setup',
  'first_entity_created',
  'first_context_added',
  'knowledge_graph_explored',
  'api_key_created',
  'first_api_call',
  'team_invited',
  'onboarding_complete',
];

export class OnboardingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get onboarding progress for a user
   */
  async getProgress(userId: string): Promise<OnboardingProgress> {
    const { data, error } = await this.supabase
      .schema('human_os')
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Create initial progress record
      const newProgress = {
        user_id: userId,
        steps_completed: ['account_created'],
        current_step: 'profile_setup',
        percent_complete: Math.round((1 / ONBOARDING_STEPS.length) * 100),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await this.supabase
        .schema('human_os')
        .from('onboarding_progress')
        .insert(newProgress);

      return {
        userId,
        completedSteps: ['account_created'],
        currentStep: 'profile_setup',
        percentComplete: Math.round((1 / ONBOARDING_STEPS.length) * 100),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return {
      userId: data.user_id,
      completedSteps: data.steps_completed || [],
      currentStep: data.current_step,
      percentComplete: data.percent_complete,
      scheduledCall: data.scheduled_call ? new Date(data.scheduled_call) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Mark an onboarding step as complete
   */
  async markStepComplete(userId: string, step: string): Promise<void> {
    if (!ONBOARDING_STEPS.includes(step)) {
      throw new Error(`Invalid onboarding step: ${step}`);
    }

    const progress = await this.getProgress(userId);

    if (progress.completedSteps.includes(step)) {
      return; // Already completed
    }

    const completedSteps = [...progress.completedSteps, step];
    const percentComplete = Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100);

    // Determine next step
    const nextStepIndex = ONBOARDING_STEPS.findIndex((s) => !completedSteps.includes(s));
    const currentStep = nextStepIndex >= 0 ? ONBOARDING_STEPS[nextStepIndex] : 'onboarding_complete';

    await this.supabase
      .schema('human_os')
      .from('onboarding_progress')
      .update({
        steps_completed: completedSteps,
        current_step: currentStep,
        percent_complete: percentComplete,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  /**
   * Schedule an onboarding call
   */
  async scheduleCall(userId: string, scheduledAt: Date): Promise<void> {
    await this.supabase
      .schema('human_os')
      .from('onboarding_progress')
      .update({
        scheduled_call: scheduledAt.toISOString(),
        onboarding_call_scheduled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  /**
   * Get recommended next steps for a user
   */
  async getNextSteps(userId: string): Promise<string[]> {
    const progress = await this.getProgress(userId);
    const { completedSteps } = progress;

    const nextSteps: string[] = [];

    if (!completedSteps.includes('profile_setup')) {
      nextSteps.push('Complete your profile with name and email');
    }

    if (!completedSteps.includes('first_entity_created')) {
      nextSteps.push('Create your first entity (person, company, or project)');
    }

    if (!completedSteps.includes('first_context_added')) {
      nextSteps.push('Add context to an entity using markdown files');
    }

    if (!completedSteps.includes('knowledge_graph_explored')) {
      nextSteps.push('Explore the knowledge graph connections');
    }

    if (!completedSteps.includes('api_key_created')) {
      nextSteps.push('Generate an API key for programmatic access');
    }

    if (!completedSteps.includes('first_api_call')) {
      nextSteps.push('Make your first API call to test integration');
    }

    if (!completedSteps.includes('team_invited')) {
      nextSteps.push('Invite team members to collaborate');
    }

    if (nextSteps.length === 0) {
      nextSteps.push('Onboarding complete! Start building with Human OS.');
    }

    return nextSteps.slice(0, 3);
  }

  /**
   * Check if onboarding is complete
   */
  async isComplete(userId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    return progress.percentComplete === 100;
  }
}
