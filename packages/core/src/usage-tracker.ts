/**
 * Usage Tracker
 *
 * Tracks user activity and engagement metrics for Human OS.
 * Provides analytics for usage events, retention cohorts, and onboarding progress.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Types of usage events that can be tracked
 */
export type UsageEventType =
  | 'context_save'
  | 'context_read'
  | 'entity_create'
  | 'link_query'
  | 'search'
  | 'audit';

/**
 * A usage event tracking user activity
 */
export interface UsageEvent {
  type: UsageEventType;
  entitySlug?: string;
  layer?: string;
  metadata?: Record<string, unknown>;
}

/**
 * User statistics aggregated from usage events
 */
export interface UserStats {
  totalEvents: number;
  contextSaves: number;
  contextReads: number;
  entitiesCreated: number;
  linkQueries: number;
  dailyActiveStreak: number;
}

/**
 * A single cohort with retention metrics
 */
export interface Cohort {
  cohortDate: string;
  totalUsers: number;
  retainedDay7: number;
  retainedDay30: number;
  avgEventsPerUser: number;
}

/**
 * Cohort analysis for retention tracking
 */
export interface CohortAnalysis {
  cohorts: Cohort[];
}

/**
 * Database row from usage_events table
 */
interface DatabaseUsageEvent {
  id: string;
  user_id: string;
  event_type: string;
  entity_slug?: string;
  layer?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/**
 * UsageTracker manages user activity tracking and analytics
 */
export class UsageTracker {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Track a usage event for a user
   */
  async track(userId: string, event: UsageEvent): Promise<void> {
    const { error } = await this.supabase
      .schema('human_os')
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: event.type,
        entity_slug: event.entitySlug,
        layer: event.layer,
        metadata: event.metadata || {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to track usage event: ${error.message}`);
    }
  }

  /**
   * Get user statistics for a given time period
   */
  async getUserStats(userId: string, days: number = 30): Promise<UserStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: events, error } = await this.supabase
      .schema('human_os')
      .from('usage_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }

    const typedEvents = (events || []) as DatabaseUsageEvent[];
    const contextSaves = typedEvents.filter((e) => e.event_type === 'context_save').length;
    const contextReads = typedEvents.filter((e) => e.event_type === 'context_read').length;
    const entitiesCreated = typedEvents.filter((e) => e.event_type === 'entity_create').length;
    const linkQueries = typedEvents.filter((e) => e.event_type === 'link_query').length;

    const dailyActiveStreak = await this.calculateDailyActiveStreak(userId);

    return {
      totalEvents: typedEvents.length,
      contextSaves,
      contextReads,
      entitiesCreated,
      linkQueries,
      dailyActiveStreak,
    };
  }

  /**
   * Calculate the user's current daily active streak
   */
  private async calculateDailyActiveStreak(userId: string): Promise<number> {
    const { data: events, error } = await this.supabase
      .schema('human_os')
      .from('usage_events')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !events || events.length === 0) {
      return 0;
    }

    const uniqueDates = new Set<string>();
    events.forEach((event: { created_at: string }) => {
      const date = new Date(event.created_at);
      const dateStr = date.toISOString().split('T')[0] ?? '';
      if (dateStr) uniqueDates.add(dateStr);
    });

    const sortedDates = Array.from(uniqueDates).sort().reverse();

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const dateAtIndex = sortedDates[i];
      if (!dateAtIndex) break;

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0] ?? '';

      if (dateAtIndex === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get retention cohort analysis
   */
  async getRetentionCohorts(): Promise<CohortAnalysis> {
    return this.calculateCohortsManually();
  }

  /**
   * Calculate cohorts manually
   */
  private async calculateCohortsManually(): Promise<CohortAnalysis> {
    const { data: allEvents, error } = await this.supabase
      .schema('human_os')
      .from('usage_events')
      .select('user_id, created_at')
      .order('created_at', { ascending: true });

    if (error || !allEvents) {
      return { cohorts: [] };
    }

    const userFirstEvent = new Map<string, string>();
    const typedEvents = allEvents as DatabaseUsageEvent[];

    typedEvents.forEach((event) => {
      if (!userFirstEvent.has(event.user_id)) {
        const date = new Date(event.created_at);
        const dateStr = date.toISOString().split('T')[0] ?? '';
        if (dateStr) userFirstEvent.set(event.user_id, dateStr);
      }
    });

    const cohortMap = new Map<string, Set<string>>();
    userFirstEvent.forEach((cohortDate, odcUserId) => {
      if (!cohortMap.has(cohortDate)) {
        cohortMap.set(cohortDate, new Set());
      }
      cohortMap.get(cohortDate)!.add(odcUserId);
    });

    const cohorts: Cohort[] = [];
    for (const [cohortDate, userIds] of cohortMap.entries()) {
      const day7Date = new Date(cohortDate);
      day7Date.setDate(day7Date.getDate() + 7);

      const day30Date = new Date(cohortDate);
      day30Date.setDate(day30Date.getDate() + 30);

      let retainedDay7 = 0;
      let retainedDay30 = 0;
      let totalEvents = 0;

      for (const odcUserId of userIds) {
        const userEvents = typedEvents.filter((e) => e.user_id === odcUserId);
        totalEvents += userEvents.length;

        const hasDay7Activity = userEvents.some((e) => {
          const eventDate = new Date(e.created_at);
          return eventDate >= day7Date;
        });

        const hasDay30Activity = userEvents.some((e) => {
          const eventDate = new Date(e.created_at);
          return eventDate >= day30Date;
        });

        if (hasDay7Activity) retainedDay7++;
        if (hasDay30Activity) retainedDay30++;
      }

      cohorts.push({
        cohortDate,
        totalUsers: userIds.size,
        retainedDay7,
        retainedDay30,
        avgEventsPerUser: totalEvents / userIds.size,
      });
    }

    cohorts.sort((a, b) => b.cohortDate.localeCompare(a.cohortDate));

    return { cohorts };
  }

  /**
   * Update user onboarding progress
   */
  async updateOnboardingProgress(userId: string, step: string): Promise<void> {
    // Get current progress
    const { data: existing } = await this.supabase
      .schema('human_os')
      .from('onboarding_progress')
      .select('steps_completed')
      .eq('user_id', userId)
      .single();

    const currentSteps = (existing?.steps_completed as string[]) || [];

    if (currentSteps.includes(step)) {
      return; // Already completed
    }

    const updatedSteps = [...currentSteps, step];

    const { error } = await this.supabase
      .schema('human_os')
      .from('onboarding_progress')
      .upsert({
        user_id: userId,
        steps_completed: updatedSteps,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to update onboarding progress: ${error.message}`);
    }
  }

  /**
   * Get user onboarding progress
   */
  async getOnboardingProgress(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .schema('human_os')
      .from('onboarding_progress')
      .select('steps_completed')
      .eq('user_id', userId)
      .single();

    if (error) {
      return [];
    }

    return (data?.steps_completed as string[]) || [];
  }
}
