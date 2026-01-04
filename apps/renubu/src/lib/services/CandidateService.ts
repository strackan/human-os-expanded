/**
 * Candidate Service
 *
 * Service layer for managing candidates in the Talent Orchestration System (Release 1.5).
 * Handles CRUD operations, analysis updates, and filtering for AI-powered interview candidates.
 */

import { createClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import type {
  Candidate,
  CreateCandidateParams,
  UpdateCandidateAnalysisParams,
  CandidateFilters,
  CandidateTier,
  CandidateArchetype,
  CandidateStatus,
} from '@/types/talent';

export class CandidateService {
  /**
   * Create a new candidate
   */
  static async createCandidate(
    params: CreateCandidateParams,
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<Candidate> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .insert({
          [DB_COLUMNS.USER_ID]: userId,
          [DB_COLUMNS.NAME]: params.name,
          [DB_COLUMNS.EMAIL]: params.email,
          [DB_COLUMNS.LINKEDIN_URL]: params.linkedin_url,
          [DB_COLUMNS.REFERRAL_SOURCE]: params.referral_source,
          [DB_COLUMNS.STATUS]: 'pending' as CandidateStatus,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating candidate:', error);
        throw new Error(`Failed to create candidate: ${error.message}`);
      }

      return data as Candidate;
    } catch (error) {
      console.error('CandidateService.createCandidate error:', error);
      throw error;
    }
  }

  /**
   * Get candidate by ID
   */
  static async getCandidateById(
    candidateId: string,
    supabaseClient?: SupabaseClient
  ): Promise<Candidate | null> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .select('*')
        .eq(DB_COLUMNS.ID, candidateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Error fetching candidate:', error);
        throw new Error(`Failed to fetch candidate: ${error.message}`);
      }

      return data as Candidate;
    } catch (error) {
      console.error('CandidateService.getCandidateById error:', error);
      throw error;
    }
  }

  /**
   * Get candidate by email (for returning candidates - Release 1.6)
   */
  static async getCandidateByEmail(
    email: string,
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<Candidate | null> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .select('*')
        .eq(DB_COLUMNS.EMAIL, email)
        .eq(DB_COLUMNS.USER_ID, userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching candidate by email:', error);
        throw new Error(`Failed to fetch candidate by email: ${error.message}`);
      }

      return data as Candidate;
    } catch (error) {
      console.error('CandidateService.getCandidateByEmail error:', error);
      throw error;
    }
  }

  /**
   * Get all candidates with optional filtering and pagination
   */
  static async getCandidates(
    filters: CandidateFilters = {},
    userId: string,
    page: number = 1,
    limit: number = 50,
    supabaseClient?: SupabaseClient
  ): Promise<{ candidates: Candidate[]; total: number }> {
    try {
      const supabase = supabaseClient || createClient();

      let query = supabase
        .from(DB_TABLES.CANDIDATES)
        .select('*', { count: 'exact' })
        .eq(DB_COLUMNS.USER_ID, userId);

      // Apply filters
      if (filters.tier) {
        if (Array.isArray(filters.tier)) {
          query = query.in(DB_COLUMNS.TIER, filters.tier);
        } else {
          query = query.eq(DB_COLUMNS.TIER, filters.tier);
        }
      }

      if (filters.archetype) {
        if (Array.isArray(filters.archetype)) {
          query = query.in(DB_COLUMNS.ARCHETYPE, filters.archetype);
        } else {
          query = query.eq(DB_COLUMNS.ARCHETYPE, filters.archetype);
        }
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in(DB_COLUMNS.STATUS, filters.status);
        } else {
          query = query.eq(DB_COLUMNS.STATUS, filters.status);
        }
      }

      if (filters.min_score !== undefined) {
        query = query.gte(DB_COLUMNS.OVERALL_SCORE, filters.min_score);
      }

      if (filters.max_score !== undefined) {
        query = query.lte(DB_COLUMNS.OVERALL_SCORE, filters.max_score);
      }

      if (filters.relationship_strength) {
        if (Array.isArray(filters.relationship_strength)) {
          query = query.in(DB_COLUMNS.RELATIONSHIP_STRENGTH, filters.relationship_strength);
        } else {
          query = query.eq(DB_COLUMNS.RELATIONSHIP_STRENGTH, filters.relationship_strength);
        }
      }

      // Sort by score descending by default
      query = query.order(DB_COLUMNS.OVERALL_SCORE, { ascending: false, nullsFirst: false });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching candidates:', error);
        throw new Error(`Failed to fetch candidates: ${error.message}`);
      }

      return {
        candidates: (data || []) as Candidate[],
        total: count || 0,
      };
    } catch (error) {
      console.error('CandidateService.getCandidates error:', error);
      throw error;
    }
  }

  /**
   * Update candidate after interview analysis
   */
  static async updateAnalysis(
    candidateId: string,
    params: UpdateCandidateAnalysisParams,
    supabaseClient?: SupabaseClient
  ): Promise<Candidate> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .update({
          [DB_COLUMNS.INTERVIEW_TRANSCRIPT]: params.interview_transcript,
          [DB_COLUMNS.ANALYSIS]: params.analysis,
          [DB_COLUMNS.ARCHETYPE]: params.archetype,
          [DB_COLUMNS.OVERALL_SCORE]: params.overall_score,
          [DB_COLUMNS.DIMENSIONS]: params.dimensions,
          [DB_COLUMNS.TIER]: params.tier,
          [DB_COLUMNS.FLAGS]: params.flags,
          [DB_COLUMNS.STATUS]: params.status,
          [DB_COLUMNS.UPDATED_AT]: new Date().toISOString(),
        })
        .eq(DB_COLUMNS.ID, candidateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating candidate analysis:', error);
        throw new Error(`Failed to update candidate analysis: ${error.message}`);
      }

      return data as Candidate;
    } catch (error) {
      console.error('CandidateService.updateAnalysis error:', error);
      throw error;
    }
  }

  /**
   * Update candidate status
   */
  static async updateStatus(
    candidateId: string,
    status: CandidateStatus,
    supabaseClient?: SupabaseClient
  ): Promise<Candidate> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .update({
          [DB_COLUMNS.STATUS]: status,
          [DB_COLUMNS.UPDATED_AT]: new Date().toISOString(),
        })
        .eq(DB_COLUMNS.ID, candidateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating candidate status:', error);
        throw new Error(`Failed to update candidate status: ${error.message}`);
      }

      return data as Candidate;
    } catch (error) {
      console.error('CandidateService.updateStatus error:', error);
      throw error;
    }
  }

  /**
   * Get candidates by tier (for pipeline views)
   */
  static async getCandidatesByTier(
    tier: CandidateTier,
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<Candidate[]> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .select('*')
        .eq(DB_COLUMNS.USER_ID, userId)
        .eq(DB_COLUMNS.TIER, tier)
        .order(DB_COLUMNS.OVERALL_SCORE, { ascending: false })
        .order(DB_COLUMNS.CREATED_AT, { ascending: false });

      if (error) {
        console.error('Error fetching candidates by tier:', error);
        throw new Error(`Failed to fetch candidates by tier: ${error.message}`);
      }

      return (data || []) as Candidate[];
    } catch (error) {
      console.error('CandidateService.getCandidatesByTier error:', error);
      throw error;
    }
  }

  /**
   * Get candidates by archetype
   */
  static async getCandidatesByArchetype(
    archetype: CandidateArchetype,
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<Candidate[]> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .select('*')
        .eq(DB_COLUMNS.USER_ID, userId)
        .eq(DB_COLUMNS.ARCHETYPE, archetype)
        .order(DB_COLUMNS.OVERALL_SCORE, { ascending: false })
        .order(DB_COLUMNS.CREATED_AT, { ascending: false });

      if (error) {
        console.error('Error fetching candidates by archetype:', error);
        throw new Error(`Failed to fetch candidates by archetype: ${error.message}`);
      }

      return (data || []) as Candidate[];
    } catch (error) {
      console.error('CandidateService.getCandidatesByArchetype error:', error);
      throw error;
    }
  }

  /**
   * Update intelligence file (Release 1.6)
   */
  static async updateIntelligenceFile(
    candidateId: string,
    intelligenceFile: any,
    supabaseClient?: SupabaseClient
  ): Promise<Candidate> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .update({
          [DB_COLUMNS.INTELLIGENCE_FILE]: intelligenceFile,
          [DB_COLUMNS.UPDATED_AT]: new Date().toISOString(),
        })
        .eq(DB_COLUMNS.ID, candidateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating intelligence file:', error);
        throw new Error(`Failed to update intelligence file: ${error.message}`);
      }

      return data as Candidate;
    } catch (error) {
      console.error('CandidateService.updateIntelligenceFile error:', error);
      throw error;
    }
  }

  /**
   * Update check-in tracking (Release 1.6)
   */
  static async updateCheckInTracking(
    candidateId: string,
    relationshipStrength: 'cold' | 'warm' | 'hot',
    supabaseClient?: SupabaseClient
  ): Promise<Candidate> {
    try {
      const supabase = supabaseClient || createClient();

      // Increment check-in count and update last check-in
      const { data, error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .update({
          [DB_COLUMNS.LAST_CHECK_IN]: new Date().toISOString(),
          [DB_COLUMNS.CHECK_IN_COUNT]: supabase.rpc('increment', { row_id: candidateId }),
          [DB_COLUMNS.RELATIONSHIP_STRENGTH]: relationshipStrength,
          [DB_COLUMNS.UPDATED_AT]: new Date().toISOString(),
        })
        .eq(DB_COLUMNS.ID, candidateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating check-in tracking:', error);
        throw new Error(`Failed to update check-in tracking: ${error.message}`);
      }

      return data as Candidate;
    } catch (error) {
      console.error('CandidateService.updateCheckInTracking error:', error);
      throw error;
    }
  }

  /**
   * Delete candidate (soft delete)
   */
  static async deleteCandidate(
    candidateId: string,
    supabaseClient?: SupabaseClient
  ): Promise<void> {
    try {
      const supabase = supabaseClient || createClient();

      const { error } = await supabase
        .from(DB_TABLES.CANDIDATES)
        .delete()
        .eq(DB_COLUMNS.ID, candidateId);

      if (error) {
        console.error('Error deleting candidate:', error);
        throw new Error(`Failed to delete candidate: ${error.message}`);
      }
    } catch (error) {
      console.error('CandidateService.deleteCandidate error:', error);
      throw error;
    }
  }
}
