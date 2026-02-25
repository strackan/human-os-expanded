/**
 * ARIService
 *
 * Server-side service for ARI (AI Recommendability Index) features.
 * Manages score snapshots, entity mappings, and ARI client interactions.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ARIClient } from '@/lib/mcp/clients/ARIClient';
import type { ARIScoreSnapshot, ARIEntityMapping, ARIScore } from '@/lib/mcp/types/ari.types';
import { DB_TABLES } from '@/lib/constants/database';

export class ARIService {
  private supabase: SupabaseClient;
  private ariClient?: ARIClient;

  constructor(supabase: SupabaseClient, ariClient?: ARIClient) {
    this.supabase = supabase;
    this.ariClient = ariClient;
  }

  // ============================================================================
  // SCAN OPERATIONS
  // ============================================================================

  /**
   * Run ARI scan via MCP client and store snapshot
   */
  async runScan(params: {
    companyId: string;
    customerId?: string;
    entityName: string;
    entityType?: string;
    triggeredBy?: 'manual' | 'cron' | 'workflow';
  }): Promise<ARIScoreSnapshot | null> {
    if (!this.ariClient?.isEnabled()) {
      console.warn('[ARIService] ARI client not available');
      return null;
    }

    const scanResult = await this.ariClient.runScan(
      params.entityName,
      params.entityType || 'auto'
    );

    if (!scanResult) {
      console.error('[ARIService] Scan returned no results for:', params.entityName);
      return null;
    }

    return this.storeSnapshot(
      params.companyId,
      params.customerId || null,
      scanResult,
      params.triggeredBy || 'manual'
    );
  }

  // ============================================================================
  // SCORE QUERIES
  // ============================================================================

  /**
   * Get latest score for a customer's mapped entity
   */
  async getLatestScore(
    companyId: string,
    customerId: string
  ): Promise<ARIScoreSnapshot | null> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ARI_SCORE_SNAPSHOTS)
      .select('*')
      .eq('company_id', companyId)
      .eq('customer_id', customerId)
      .order('scan_completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data as ARIScoreSnapshot;
  }

  /**
   * Get score history for trending
   */
  async getScoreHistory(
    companyId: string,
    customerId: string,
    limit: number = 12
  ): Promise<ARIScoreSnapshot[]> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ARI_SCORE_SNAPSHOTS)
      .select('*')
      .eq('company_id', companyId)
      .eq('customer_id', customerId)
      .order('scan_completed_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data || []) as ARIScoreSnapshot[];
  }

  /**
   * Get all latest scores for a company's portfolio
   */
  async getPortfolioScores(companyId: string): Promise<ARIScoreSnapshot[]> {
    // Get distinct latest scores per entity using a subquery approach
    const { data, error } = await this.supabase
      .from(DB_TABLES.ARI_SCORE_SNAPSHOTS)
      .select('*')
      .eq('company_id', companyId)
      .order('scan_completed_at', { ascending: false });

    if (error || !data) return [];

    // Deduplicate: keep only the latest per entity
    const latestByEntity = new Map<string, ARIScoreSnapshot>();
    for (const snapshot of data as ARIScoreSnapshot[]) {
      const key = snapshot.ari_entity_name;
      if (!latestByEntity.has(key)) {
        latestByEntity.set(key, snapshot);
      }
    }

    return Array.from(latestByEntity.values());
  }

  // ============================================================================
  // ENTITY MAPPING OPERATIONS
  // ============================================================================

  /**
   * Map a Renubu customer to an ARI entity
   */
  async mapEntity(params: {
    companyId: string;
    customerId: string;
    entityName: string;
    entityType?: string;
    category?: string;
    competitors?: Array<{ name: string; entity_type: string }>;
  }): Promise<ARIEntityMapping | null> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ARI_ENTITY_MAPPINGS)
      .upsert(
        {
          company_id: params.companyId,
          customer_id: params.customerId,
          entity_name: params.entityName,
          entity_type: params.entityType || 'company',
          category: params.category || 'general',
          competitors: params.competitors || [],
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,customer_id,entity_name' }
      )
      .select()
      .single();

    if (error) {
      console.error('[ARIService] Failed to create mapping:', error.message);
      return null;
    }

    return data as ARIEntityMapping;
  }

  /**
   * Get entity mappings
   */
  async getMappings(
    companyId: string,
    customerId?: string
  ): Promise<ARIEntityMapping[]> {
    let query = this.supabase
      .from(DB_TABLES.ARI_ENTITY_MAPPINGS)
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return [];
    return (data || []) as ARIEntityMapping[];
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Store a scan result as a snapshot with delta calculation
   */
  private async storeSnapshot(
    companyId: string,
    customerId: string | null,
    scanResult: ARIScore,
    triggeredBy: 'manual' | 'cron' | 'workflow'
  ): Promise<ARIScoreSnapshot> {
    // Look up previous snapshot for delta calculation
    let previousScore: number | null = null;
    let scoreDelta: number | null = null;

    const previousQuery = this.supabase
      .from(DB_TABLES.ARI_SCORE_SNAPSHOTS)
      .select('overall_score')
      .eq('company_id', companyId)
      .eq('ari_entity_name', scanResult.entity)
      .order('scan_completed_at', { ascending: false })
      .limit(1);

    if (customerId) {
      previousQuery.eq('customer_id', customerId);
    }

    const { data: prevData } = await previousQuery.single();

    if (prevData) {
      previousScore = Number(prevData.overall_score);
      scoreDelta = Number((scanResult.ari_score - previousScore).toFixed(1));
    }

    // Build provider_scores from results
    const providerScores: Record<string, unknown> = {};
    if (scanResult.results?.length > 0) {
      for (const result of scanResult.results) {
        for (const [provider, response] of Object.entries(result.responses)) {
          if (!providerScores[provider]) {
            providerScores[provider] = {
              provider,
              model: response.model,
              mentioned_count: 0,
              total_questions: 0,
            };
          }
          const ps = providerScores[provider] as { mentioned_count: number; total_questions: number };
          ps.total_questions++;
          if (response.mentioned) ps.mentioned_count++;
        }
      }
    }

    const snapshot = {
      company_id: companyId,
      customer_id: customerId,
      ari_entity_name: scanResult.entity,
      entity_type: scanResult.entity_type || 'company',
      category: 'general',
      overall_score: scanResult.ari_score,
      mention_rate: scanResult.mention_rate,
      mentions_count: scanResult.mentions,
      total_prompts: scanResult.total_questions,
      avg_position_score: scanResult.avg_position_score,
      provider_scores: providerScores,
      sample_responses: scanResult.results?.slice(0, 3) || [],
      previous_score: previousScore,
      score_delta: scoreDelta,
      scan_triggered_by: triggeredBy,
      scan_completed_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from(DB_TABLES.ARI_SCORE_SNAPSHOTS)
      .insert(snapshot)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store ARI snapshot: ${error.message}`);
    }

    return data as ARIScoreSnapshot;
  }
}
