/**
 * BountyService
 *
 * Server-side service for bounty point persistence.
 * Manages daily bounty logs and streak calculation.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateBountyPoints } from '@/lib/workflows/bounty';

export interface BountyDailyLog {
  id: string;
  user_id: string;
  log_date: string;
  points_earned: number;
  workflows_completed: number;
  created_at: string;
  updated_at: string;
}

export class BountyService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get today's bounty log for a user (creates if doesn't exist)
   */
  async getTodayLog(userId: string): Promise<BountyDailyLog> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('bounty_daily_log')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', today)
      .single();

    if (data && !error) {
      return data as BountyDailyLog;
    }

    // Create today's entry
    const { data: newLog, error: insertError } = await this.supabase
      .from('bounty_daily_log')
      .insert({ user_id: userId, log_date: today, points_earned: 0, workflows_completed: 0 })
      .select()
      .single();

    if (insertError) {
      // Might have been created by a concurrent request
      const { data: retryData } = await this.supabase
        .from('bounty_daily_log')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today)
        .single();

      if (retryData) return retryData as BountyDailyLog;

      throw new Error(`Failed to create bounty log: ${insertError.message}`);
    }

    return newLog as BountyDailyLog;
  }

  /**
   * Record a workflow completion (upsert today's log)
   */
  async recordCompletion(userId: string, priorityScore: number): Promise<BountyDailyLog> {
    const { points } = calculateBountyPoints(priorityScore);
    const today = new Date().toISOString().split('T')[0];

    // Get or create today's log
    const currentLog = await this.getTodayLog(userId);

    // Update with new points
    const { data, error } = await this.supabase
      .from('bounty_daily_log')
      .update({
        points_earned: currentLog.points_earned + points,
        workflows_completed: currentLog.workflows_completed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('log_date', today)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record completion: ${error.message}`);
    }

    return data as BountyDailyLog;
  }

  /**
   * Calculate current streak (consecutive days with > 0 points)
   */
  async getStreak(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('bounty_daily_log')
      .select('log_date, points_earned')
      .eq('user_id', userId)
      .gt('points_earned', 0)
      .order('log_date', { ascending: false })
      .limit(30);

    if (error || !data || data.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < data.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];

      if (data[i].log_date === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get daily logs for a date range
   */
  async getHistory(userId: string, days: number): Promise<BountyDailyLog[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.supabase
      .from('bounty_daily_log')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', since.toISOString().split('T')[0])
      .order('log_date', { ascending: false });

    if (error) return [];
    return (data || []) as BountyDailyLog[];
  }
}
