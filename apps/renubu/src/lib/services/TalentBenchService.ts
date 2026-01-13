/**
 * Talent Bench Service
 *
 * Service layer for managing the talent bench - a curated pool of high-potential candidates
 * who are "benched" for future opportunities (Release 1.5).
 */

import { createClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import type {
  TalentBench,
  Candidate,
  AddToBenchParams,
  TalentBenchFilters,
  CandidateArchetype,
} from '@/types/talent';

export class TalentBenchService {
  /**
   * Add candidate to talent bench
   */
  static async addToBench(
    params: AddToBenchParams,
    supabaseClient?: SupabaseClient
  ): Promise<TalentBench> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.TALENT_BENCH)
        .insert({
          [DB_COLUMNS.CANDIDATE_ID]: params.candidate_id,
          [DB_COLUMNS.ARCHETYPE_PRIMARY]: params.archetype_primary,
          [DB_COLUMNS.ARCHETYPE_CONFIDENCE]: params.archetype_confidence,
          [DB_COLUMNS.BEST_FIT_ROLES]: params.best_fit_roles,
          [DB_COLUMNS.BENCHED_AT]: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to talent bench:', error);
        throw new Error(`Failed to add to talent bench: ${error.message}`);
      }

      return data as TalentBench;
    } catch (error) {
      console.error('TalentBenchService.addToBench error:', error);
      throw error;
    }
  }

  /**
   * Get all benched candidates with optional filtering
   */
  static async getBenchedCandidates(
    userId: string,
    filters: TalentBenchFilters = {},
    supabaseClient?: SupabaseClient
  ): Promise<Array<TalentBench & { candidate: Candidate }>> {
    try {
      const supabase = supabaseClient || createClient();

      let query = supabase
        .from(DB_TABLES.TALENT_BENCH)
        .select(`
          *,
          candidate:${DB_TABLES.CANDIDATES}!${DB_COLUMNS.CANDIDATE_ID} (*)
        `);

      // Filter by user through candidate relationship
      query = query.eq(`candidate.${DB_COLUMNS.USER_ID}`, userId);

      // Apply filters
      if (filters.archetype_primary) {
        if (Array.isArray(filters.archetype_primary)) {
          query = query.in(DB_COLUMNS.ARCHETYPE_PRIMARY, filters.archetype_primary);
        } else {
          query = query.eq(DB_COLUMNS.ARCHETYPE_PRIMARY, filters.archetype_primary);
        }
      }

      if (filters.archetype_confidence) {
        query = query.eq(DB_COLUMNS.ARCHETYPE_CONFIDENCE, filters.archetype_confidence);
      }

      // Order by score (from candidate) and benched date
      query = query.order(`candidate.${DB_COLUMNS.OVERALL_SCORE}`, { ascending: false, nullsFirst: false });
      query = query.order(DB_COLUMNS.BENCHED_AT, { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching benched candidates:', error);
        throw new Error(`Failed to fetch benched candidates: ${error.message}`);
      }

      return (data || []) as Array<TalentBench & { candidate: Candidate }>;
    } catch (error) {
      console.error('TalentBenchService.getBenchedCandidates error:', error);
      throw error;
    }
  }

  /**
   * Get benched candidates by archetype
   */
  static async getBenchedByArchetype(
    archetype: CandidateArchetype,
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<Array<TalentBench & { candidate: Candidate }>> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.TALENT_BENCH)
        .select(`
          *,
          candidate:${DB_TABLES.CANDIDATES}!${DB_COLUMNS.CANDIDATE_ID} (*)
        `)
        .eq(`candidate.${DB_COLUMNS.USER_ID}`, userId)
        .eq(DB_COLUMNS.ARCHETYPE_PRIMARY, archetype)
        .order(`candidate.${DB_COLUMNS.OVERALL_SCORE}`, { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching benched candidates by archetype:', error);
        throw new Error(`Failed to fetch benched candidates by archetype: ${error.message}`);
      }

      return (data || []) as Array<TalentBench & { candidate: Candidate }>;
    } catch (error) {
      console.error('TalentBenchService.getBenchedByArchetype error:', error);
      throw error;
    }
  }

  /**
   * Check if candidate is on bench
   */
  static async isOnBench(
    candidateId: string,
    supabaseClient?: SupabaseClient
  ): Promise<boolean> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.TALENT_BENCH)
        .select(DB_COLUMNS.ID)
        .eq(DB_COLUMNS.CANDIDATE_ID, candidateId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Ignore "not found" error
        console.error('Error checking bench status:', error);
        throw new Error(`Failed to check bench status: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      console.error('TalentBenchService.isOnBench error:', error);
      throw error;
    }
  }

  /**
   * Get bench entry by candidate ID
   */
  static async getBenchEntry(
    candidateId: string,
    supabaseClient?: SupabaseClient
  ): Promise<TalentBench | null> {
    try {
      const supabase = supabaseClient || createClient();

      const { data, error } = await supabase
        .from(DB_TABLES.TALENT_BENCH)
        .select('*')
        .eq(DB_COLUMNS.CANDIDATE_ID, candidateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching bench entry:', error);
        throw new Error(`Failed to fetch bench entry: ${error.message}`);
      }

      return data as TalentBench;
    } catch (error) {
      console.error('TalentBenchService.getBenchEntry error:', error);
      throw error;
    }
  }

  /**
   * Update bench entry
   */
  static async updateBenchEntry(
    candidateId: string,
    updates: Partial<Pick<TalentBench, 'archetype_primary' | 'archetype_confidence' | 'best_fit_roles'>>,
    supabaseClient?: SupabaseClient
  ): Promise<TalentBench> {
    try {
      const supabase = supabaseClient || createClient();

      const updateData: any = {};
      if (updates.archetype_primary !== undefined) {
        updateData[DB_COLUMNS.ARCHETYPE_PRIMARY] = updates.archetype_primary;
      }
      if (updates.archetype_confidence !== undefined) {
        updateData[DB_COLUMNS.ARCHETYPE_CONFIDENCE] = updates.archetype_confidence;
      }
      if (updates.best_fit_roles !== undefined) {
        updateData[DB_COLUMNS.BEST_FIT_ROLES] = updates.best_fit_roles;
      }

      const { data, error } = await supabase
        .from(DB_TABLES.TALENT_BENCH)
        .update(updateData)
        .eq(DB_COLUMNS.CANDIDATE_ID, candidateId)
        .select()
        .single();

      if (error) {
        console.error('Error updating bench entry:', error);
        throw new Error(`Failed to update bench entry: ${error.message}`);
      }

      return data as TalentBench;
    } catch (error) {
      console.error('TalentBenchService.updateBenchEntry error:', error);
      throw error;
    }
  }

  /**
   * Remove candidate from bench
   */
  static async removeFromBench(
    candidateId: string,
    supabaseClient?: SupabaseClient
  ): Promise<void> {
    try {
      const supabase = supabaseClient || createClient();

      const { error } = await supabase
        .from(DB_TABLES.TALENT_BENCH)
        .delete()
        .eq(DB_COLUMNS.CANDIDATE_ID, candidateId);

      if (error) {
        console.error('Error removing from bench:', error);
        throw new Error(`Failed to remove from bench: ${error.message}`);
      }
    } catch (error) {
      console.error('TalentBenchService.removeFromBench error:', error);
      throw error;
    }
  }

  /**
   * Get bench statistics
   */
  static async getBenchStats(
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<{
    total: number;
    by_archetype: Record<CandidateArchetype, number>;
    high_confidence: number;
  }> {
    try {
      const supabase = supabaseClient || createClient();

      // Get all benched candidates
      const { data, error } = await supabase
        .from(DB_TABLES.TALENT_BENCH)
        .select(`
          *,
          candidate:${DB_TABLES.CANDIDATES}!${DB_COLUMNS.CANDIDATE_ID} (${DB_COLUMNS.USER_ID})
        `)
        .eq(`candidate.${DB_COLUMNS.USER_ID}`, userId);

      if (error) {
        console.error('Error fetching bench stats:', error);
        throw new Error(`Failed to fetch bench stats: ${error.message}`);
      }

      const benchData = (data || []) as TalentBench[];

      // Calculate statistics
      const stats = {
        total: benchData.length,
        by_archetype: {} as Record<CandidateArchetype, number>,
        high_confidence: benchData.filter(b => b.archetype_confidence === 'high').length,
      };

      // Count by archetype
      benchData.forEach(bench => {
        const archetype = bench.archetype_primary as CandidateArchetype;
        stats.by_archetype[archetype] = (stats.by_archetype[archetype] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('TalentBenchService.getBenchStats error:', error);
      throw error;
    }
  }
}
