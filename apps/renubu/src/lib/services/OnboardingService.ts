/**
 * OnboardingService
 *
 * Server-side service for First Contact onboarding session management.
 * Manages conversation state, message persistence, and session lifecycle.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES } from '@/lib/constants/database';

export interface OnboardingSession {
  id: string;
  user_id: string;
  status: 'in_progress' | 'completed' | 'skipped';
  started_at: string;
  completed_at: string | null;
  opener_used: string | null;
  opener_depth: number;
  transition_trigger: string | null;
  option_selected: string | null;
  conversation_log: ConversationEntry[];
  skip_requested: boolean;
  current_phase: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class OnboardingService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get the active (in_progress) onboarding session for a user.
   */
  async getActiveSession(userId: string): Promise<OnboardingSession | null> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get active session: ${error.message}`);
    }

    return data as OnboardingSession | null;
  }

  /**
   * Check if the user has already completed (or skipped) onboarding.
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .select('id')
      .eq('user_id', userId)
      .in('status', ['completed', 'skipped'])
      .limit(1);

    if (error) {
      console.error('[OnboardingService] hasCompletedOnboarding error:', error);
      return false;
    }

    return (data?.length ?? 0) > 0;
  }

  /**
   * Create a new onboarding session. Handles unique constraint
   * violations gracefully by returning the existing active session.
   */
  async createSession(userId: string): Promise<OnboardingSession> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .insert({
        user_id: userId,
        status: 'in_progress',
        conversation_log: [],
        current_phase: 1,
        opener_depth: 0,
      })
      .select()
      .single();

    if (data && !error) {
      return data as OnboardingSession;
    }

    // Unique constraint violation — return existing active session
    if (error?.code === '23505') {
      const existing = await this.getActiveSession(userId);
      if (existing) return existing;
    }

    throw new Error(`Failed to create onboarding session: ${error?.message}`);
  }

  /**
   * Append a message to the conversation log.
   */
  async appendMessage(sessionId: string, entry: ConversationEntry): Promise<void> {
    // Fetch current log
    const { data, error: fetchError } = await this.supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .select('conversation_log')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch conversation log: ${fetchError.message}`);
    }

    const log = (data?.conversation_log || []) as ConversationEntry[];
    log.push(entry);

    const { error: updateError } = await this.supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .update({
        conversation_log: log,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error(`Failed to append message: ${updateError.message}`);
    }
  }

  /**
   * Partial update on session metadata fields.
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Pick<OnboardingSession, 'current_phase' | 'opener_used' | 'opener_depth' | 'transition_trigger'>>
  ): Promise<void> {
    const { error } = await this.supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  /**
   * Mark session as completed with the selected option.
   */
  async completeSession(sessionId: string, optionSelected: string): Promise<OnboardingSession> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .update({
        status: 'completed',
        option_selected: optionSelected,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to complete session: ${error.message}`);
    }

    return data as OnboardingSession;
  }

  /**
   * Mark session as skipped.
   */
  async skipSession(sessionId: string): Promise<OnboardingSession> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ONBOARDING_SESSIONS)
      .update({
        status: 'skipped',
        skip_requested: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to skip session: ${error.message}`);
    }

    return data as OnboardingSession;
  }
}
