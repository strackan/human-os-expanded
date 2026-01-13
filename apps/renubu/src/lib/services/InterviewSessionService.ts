/**
 * Interview Session Service
 *
 * Service layer for managing interview sessions for longitudinal intelligence (Release 1.6).
 * Tracks multiple sessions per candidate over time for relationship building.
 */

import { createClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import type {
  InterviewSession,
  CreateSessionParams,
  SessionFilters,
  SessionType,
  SessionSentiment,
} from '@/types/talent';

export class InterviewSessionService {
  /**
   * Create a new interview session
   */
  static async createSession(
    params: CreateSessionParams,
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .insert({
          [DB_COLUMNS.CANDIDATE_ID]: params.candidate_id,
          [DB_COLUMNS.SESSION_TYPE]: params.session_type,
          [DB_COLUMNS.INTERVIEW_TRANSCRIPT]: params.transcript,
          [DB_COLUMNS.DURATION_MINUTES]: params.duration_minutes,
          [DB_COLUMNS.QUESTIONS_ASKED]: params.questions_asked,
          [DB_COLUMNS.KEY_INSIGHTS]: params.key_insights,
          [DB_COLUMNS.SENTIMENT]: params.sentiment,
          [DB_COLUMNS.SESSION_DATE]: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw new Error(`Failed to create session: ${error.message}`);
      }

      return data as InterviewSession;
    } catch (error) {
      console.error('InterviewSessionService.createSession error:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for a candidate
   */
  static async getSessionsForCandidate(
    candidateId: string,
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession[]> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .select('*')
        .eq(DB_COLUMNS.CANDIDATE_ID, candidateId)
        .order(DB_COLUMNS.SESSION_DATE, { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        throw new Error(`Failed to fetch sessions: ${error.message}`);
      }

      return (data || []) as InterviewSession[];
    } catch (error) {
      console.error('InterviewSessionService.getSessionsForCandidate error:', error);
      throw error;
    }
  }

  /**
   * Get latest session for a candidate
   */
  static async getLatestSession(
    candidateId: string,
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession | null> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .select('*')
        .eq(DB_COLUMNS.CANDIDATE_ID, candidateId)
        .order(DB_COLUMNS.SESSION_DATE, { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching latest session:', error);
        throw new Error(`Failed to fetch latest session: ${error.message}`);
      }

      return data as InterviewSession;
    } catch (error) {
      console.error('InterviewSessionService.getLatestSession error:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  static async getSessionById(
    sessionId: string,
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession | null> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .select('*')
        .eq(DB_COLUMNS.ID, sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching session:', error);
        throw new Error(`Failed to fetch session: ${error.message}`);
      }

      return data as InterviewSession;
    } catch (error) {
      console.error('InterviewSessionService.getSessionById error:', error);
      throw error;
    }
  }

  /**
   * Query sessions with filters
   */
  static async querySessions(
    filters: SessionFilters = {},
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession[]> {
    try {
      const supabase = supabaseClient || createClient();

      let query = supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .select('*');

      // Apply filters
      if (filters.candidate_id) {
        query = query.eq(DB_COLUMNS.CANDIDATE_ID, filters.candidate_id);
      }

      if (filters.session_type) {
        if (Array.isArray(filters.session_type)) {
          query = query.in(DB_COLUMNS.SESSION_TYPE, filters.session_type);
        } else {
          query = query.eq(DB_COLUMNS.SESSION_TYPE, filters.session_type);
        }
      }

      if (filters.sentiment) {
        if (Array.isArray(filters.sentiment)) {
          query = query.in(DB_COLUMNS.SENTIMENT, filters.sentiment);
        } else {
          query = query.eq(DB_COLUMNS.SENTIMENT, filters.sentiment);
        }
      }

      if (filters.date_from) {
        query = query.gte(DB_COLUMNS.SESSION_DATE, filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte(DB_COLUMNS.SESSION_DATE, filters.date_to);
      }

      // Order by date descending
      query = query.order(DB_COLUMNS.SESSION_DATE, { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error querying sessions:', error);
        throw new Error(`Failed to query sessions: ${error.message}`);
      }

      return (data || []) as InterviewSession[];
    } catch (error) {
      console.error('InterviewSessionService.querySessions error:', error);
      throw error;
    }
  }

  /**
   * Update session analysis
   */
  static async updateSessionAnalysis(
    sessionId: string,
    analysis: any,
    updates?: any,
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession> {
    try {
      const supabase = supabaseClient || createClient();

      const updateData: any = {
        [DB_COLUMNS.ANALYSIS]: analysis,
        [DB_COLUMNS.UPDATED_AT]: new Date().toISOString(),
      };

      if (updates) {
        updateData[DB_COLUMNS.UPDATES] = updates;
      }

      const { data, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .update(updateData)
        .eq(DB_COLUMNS.ID, sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating session analysis:', error);
        throw new Error(`Failed to update session analysis: ${error.message}`);
      }

      return data as InterviewSession;
    } catch (error) {
      console.error('InterviewSessionService.updateSessionAnalysis error:', error);
      throw error;
    }
  }

  /**
   * Add key insights to session
   */
  static async addKeyInsights(
    sessionId: string,
    insights: string[],
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .update({
          [DB_COLUMNS.KEY_INSIGHTS]: insights,
          [DB_COLUMNS.UPDATED_AT]: new Date().toISOString(),
        })
        .eq(DB_COLUMNS.ID, sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error adding key insights:', error);
        throw new Error(`Failed to add key insights: ${error.message}`);
      }

      return data as InterviewSession;
    } catch (error) {
      console.error('InterviewSessionService.addKeyInsights error:', error);
      throw error;
    }
  }

  /**
   * Update session sentiment
   */
  static async updateSentiment(
    sessionId: string,
    sentiment: SessionSentiment,
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .update({
          [DB_COLUMNS.SENTIMENT]: sentiment,
          [DB_COLUMNS.UPDATED_AT]: new Date().toISOString(),
        })
        .eq(DB_COLUMNS.ID, sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating sentiment:', error);
        throw new Error(`Failed to update sentiment: ${error.message}`);
      }

      return data as InterviewSession;
    } catch (error) {
      console.error('InterviewSessionService.updateSentiment error:', error);
      throw error;
    }
  }

  /**
   * Get session count for candidate
   */
  static async getSessionCount(
    candidateId: string,
    supabaseClient?: SupabaseClient
  ): Promise<number> {
    try {
      const supabase = supabaseClient || createClient();

      const { count, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .select('*', { count: 'exact', head: true })
        .eq(DB_COLUMNS.CANDIDATE_ID, candidateId);

      if (error) {
        console.error('Error counting sessions:', error);
        throw new Error(`Failed to count sessions: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('InterviewSessionService.getSessionCount error:', error);
      throw error;
    }
  }

  /**
   * Get sessions by type
   */
  static async getSessionsByType(
    candidateId: string,
    sessionType: SessionType,
    supabaseClient?: SupabaseClient
  ): Promise<InterviewSession[]> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .select('*')
        .eq(DB_COLUMNS.CANDIDATE_ID, candidateId)
        .eq(DB_COLUMNS.SESSION_TYPE, sessionType)
        .order(DB_COLUMNS.SESSION_DATE, { ascending: false });

      if (error) {
        console.error('Error fetching sessions by type:', error);
        throw new Error(`Failed to fetch sessions by type: ${error.message}`);
      }

      return (data || []) as InterviewSession[];
    } catch (error) {
      console.error('InterviewSessionService.getSessionsByType error:', error);
      throw error;
    }
  }

  /**
   * Delete session
   */
  static async deleteSession(
    sessionId: string,
    supabaseClient?: SupabaseClient
  ): Promise<void> {
    try {
      const supabase = supabaseClient || createClient();

      const { error } = await supabase
        .from(DB_TABLES.INTERVIEW_SESSIONS)
        .delete()
        .eq(DB_COLUMNS.ID, sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        throw new Error(`Failed to delete session: ${error.message}`);
      }
    } catch (error) {
      console.error('InterviewSessionService.deleteSession error:', error);
      throw error;
    }
  }
}
