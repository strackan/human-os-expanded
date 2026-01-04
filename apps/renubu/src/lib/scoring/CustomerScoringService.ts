/**
 * Customer Scoring Service
 *
 * Unified scoring engine that:
 * - Ingests signals from multiple sources
 * - Normalizes into 5 category indices (Adoption, Engagement, Sentiment, Business, External)
 * - Calculates Risk, Opportunity, and Priority scores
 * - Applies tier-based multipliers
 *
 * This is the foundation for intelligent workflow prioritization.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  SignalConfiguration,
  CustomerSignal,
  CustomerCategoryIndices,
  TierConfiguration,
  SignalInput,
  ScoreCalculationResult,
  BatchCalculationResult,
  ScoringFactors,
  SignalCategory,
  TrendDirection,
  QuadrantResult,
  StrategicQuadrant,
  DEFAULT_CATEGORY_WEIGHTS,
  DEFAULT_TIER_CONFIG,
  QUADRANT_THRESHOLDS,
} from './types';

export class CustomerScoringService {
  private supabase: SupabaseClient;
  private companyId: string;

  // Cached configurations (per instance)
  private signalConfigCache: Map<string, SignalConfiguration> = new Map();
  private tierConfigCache: TierConfiguration[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(supabase: SupabaseClient, companyId: string) {
    this.supabase = supabase;
    this.companyId = companyId;
  }

  // ==========================================================================
  // Signal Recording
  // ==========================================================================

  /**
   * Record a single signal for a customer
   */
  async recordSignal(input: SignalInput): Promise<CustomerSignal> {
    const config = await this.getSignalConfig(input.signal_key);
    if (!config) {
      throw new Error(`Unknown signal: ${input.signal_key}. Configure it in signal_configurations first.`);
    }

    const normalizedValue = this.normalizeValue(input.raw_value, config);
    const recordedAt = input.recorded_at || new Date().toISOString();

    const { data, error } = await this.supabase
      .from('customer_signals')
      .upsert({
        customer_id: input.customer_id,
        company_id: this.companyId,
        signal_key: input.signal_key,
        raw_value: input.raw_value,
        normalized_value: normalizedValue,
        recorded_at: recordedAt,
        period_type: input.period_type || 'monthly',
        data_source: input.data_source,
        import_batch_id: input.import_batch_id,
      }, {
        onConflict: 'customer_id,signal_key,recorded_at',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record signal: ${error.message}`);
    }

    return data;
  }

  /**
   * Record multiple signals in batch
   */
  async recordSignalsBatch(inputs: SignalInput[]): Promise<{
    success_count: number;
    error_count: number;
    errors: Array<{ input: SignalInput; error: string }>;
  }> {
    const results = {
      success_count: 0,
      error_count: 0,
      errors: [] as Array<{ input: SignalInput; error: string }>,
    };

    // Group by unique config lookup to reduce DB calls
    const configsNeeded = [...new Set(inputs.map(i => i.signal_key))];
    for (const key of configsNeeded) {
      await this.getSignalConfig(key); // Pre-populate cache
    }

    // Prepare batch insert data
    const insertData: any[] = [];
    for (const input of inputs) {
      try {
        const config = await this.getSignalConfig(input.signal_key);
        if (!config) {
          results.errors.push({
            input,
            error: `Unknown signal: ${input.signal_key}`,
          });
          results.error_count++;
          continue;
        }

        const normalizedValue = this.normalizeValue(input.raw_value, config);
        insertData.push({
          customer_id: input.customer_id,
          company_id: this.companyId,
          signal_key: input.signal_key,
          raw_value: input.raw_value,
          normalized_value: normalizedValue,
          recorded_at: input.recorded_at || new Date().toISOString(),
          period_type: input.period_type || 'monthly',
          data_source: input.data_source,
          import_batch_id: input.import_batch_id,
        });
      } catch (err: any) {
        results.errors.push({ input, error: err.message });
        results.error_count++;
      }
    }

    // Batch upsert
    if (insertData.length > 0) {
      const { error } = await this.supabase
        .from('customer_signals')
        .upsert(insertData, {
          onConflict: 'customer_id,signal_key,recorded_at',
        });

      if (error) {
        // If batch fails, all entries in this batch are errors
        for (const item of insertData) {
          results.errors.push({
            input: { customer_id: item.customer_id, signal_key: item.signal_key, raw_value: item.raw_value },
            error: error.message,
          });
          results.error_count++;
        }
      } else {
        results.success_count = insertData.length;
      }
    }

    return results;
  }

  // ==========================================================================
  // Score Calculation
  // ==========================================================================

  /**
   * Calculate all scores for a customer
   */
  async calculateScores(customerId: string): Promise<ScoreCalculationResult> {
    // 1. Get latest signals for this customer
    const signals = await this.getLatestSignals(customerId);
    if (signals.length === 0) {
      throw new Error(`No signals found for customer ${customerId}`);
    }

    // 2. Get customer ARR for tier calculation
    const { data: customer, error: custError } = await this.supabase
      .from('customers')
      .select('current_arr, renewal_date')
      .eq('id', customerId)
      .single();

    if (custError) {
      throw new Error(`Failed to fetch customer: ${custError.message}`);
    }

    // 3. Get all signal configurations
    const configs = await this.getAllSignalConfigs();

    // 4. Calculate category indices
    const indices = this.calculateCategoryIndices(signals, configs);

    // 5. Calculate risk and opportunity scores
    const { riskScore, opportunityScore, riskFactors, opportunityFactors } =
      this.calculateRiskOpportunityScores(signals, configs, indices);

    // 6. Get tier and multiplier
    const tier = await this.getTierForARR(customer?.current_arr);
    const tierMultiplier = tier?.priority_multiplier ?? 1.0;

    // 7. Calculate timing multiplier (based on renewal date)
    const timingMultiplier = this.calculateTimingMultiplier(customer?.renewal_date);

    // 8. Calculate priority score
    const basePriority = riskScore * 0.6 + opportunityScore * 0.4;
    const priorityScore = Math.round(basePriority * tierMultiplier * timingMultiplier);

    // 9. Calculate health index (inverse of risk, weighted average of positives)
    const healthIndex = this.calculateHealthIndex(indices);

    // 10. Calculate trends (compare to previous calculation)
    const trends = await this.calculateTrends(customerId, healthIndex, riskScore);

    // 11. Build factors object
    const factors: ScoringFactors = {
      category_weights: DEFAULT_CATEGORY_WEIGHTS.risk,
      tier: tier ? {
        tier_key: tier.tier_key,
        tier_name: tier.tier_name,
        multiplier: tier.priority_multiplier,
        arr: customer?.current_arr || 0,
      } : undefined,
      risk: {
        base_score: riskScore,
        signal_contributions: riskFactors,
      },
      opportunity: {
        base_score: opportunityScore,
        signal_contributions: opportunityFactors,
      },
      priority: {
        base_score: basePriority,
        tier_multiplier: tierMultiplier,
        timing_multiplier: timingMultiplier,
        final_score: priorityScore,
      },
    };

    // 12. Store the calculation result
    const { error: storeError } = await this.supabase
      .from('customer_category_indices')
      .insert({
        customer_id: customerId,
        company_id: this.companyId,
        adoption_index: indices.adoption,
        engagement_index: indices.engagement,
        sentiment_index: indices.sentiment,
        business_index: indices.business,
        external_index: indices.external,
        health_index: healthIndex,
        risk_score: riskScore,
        opportunity_score: opportunityScore,
        priority_score: priorityScore,
        health_trend: trends.health,
        risk_trend: trends.risk,
        calculated_at: new Date().toISOString(),
        calculation_version: 'v1',
        factors,
      });

    if (storeError) {
      console.error('Failed to store indices:', storeError);
      // Continue - don't fail the calculation just because storage failed
    }

    // 13. Optionally sync to customers table
    await this.syncScoresToCustomer(customerId, riskScore, opportunityScore, healthIndex);

    return {
      customer_id: customerId,
      indices: {
        adoption: indices.adoption,
        engagement: indices.engagement,
        sentiment: indices.sentiment,
        business: indices.business,
        external: indices.external,
        health: healthIndex,
      },
      scores: {
        risk: riskScore,
        opportunity: opportunityScore,
        priority: priorityScore,
      },
      tier,
      trends,
      factors,
      calculated_at: new Date().toISOString(),
    };
  }

  /**
   * Calculate scores for multiple customers in batch
   *
   * OPTIMIZED: Uses batch queries instead of N+1 pattern
   * - Single query for all customer data
   * - Single query for all signals across all customers
   * - Single query for all previous indices (trend calculation)
   * - Batch insert for all new indices
   * - Batch update for all customer scores
   */
  async calculateScoresBatch(customerIds: string[]): Promise<BatchCalculationResult> {
    const startTime = Date.now();
    const results: ScoreCalculationResult[] = [];
    const errors: Array<{ customer_id: string; error: string }> = [];

    if (customerIds.length === 0) {
      return {
        success_count: 0,
        error_count: 0,
        results: [],
        errors: [],
        duration_ms: 0,
      };
    }

    try {
      // 1. Pre-load all configurations (single query, cached)
      const configs = await this.getAllSignalConfigs();

      // 2. Batch-fetch all customer data (single query)
      const { data: customersData, error: customersError } = await this.supabase
        .from('customers')
        .select('id, current_arr, renewal_date')
        .in('id', customerIds);

      if (customersError) {
        throw new Error(`Failed to fetch customers: ${customersError.message}`);
      }

      const customersMap = new Map(
        (customersData || []).map(c => [c.id, c])
      );

      // 3. Batch-fetch all signals for all customers (single query)
      const { data: allSignals, error: signalsError } = await this.supabase
        .from('customer_signals')
        .select('*')
        .in('customer_id', customerIds)
        .eq('company_id', this.companyId)
        .order('recorded_at', { ascending: false });

      if (signalsError) {
        throw new Error(`Failed to fetch signals: ${signalsError.message}`);
      }

      // Group signals by customer and deduplicate (latest per signal_key)
      const signalsByCustomer = new Map<string, CustomerSignal[]>();
      for (const signal of allSignals || []) {
        if (!signalsByCustomer.has(signal.customer_id)) {
          signalsByCustomer.set(signal.customer_id, []);
        }
        const customerSignals = signalsByCustomer.get(signal.customer_id)!;
        // Only add if we haven't seen this signal_key yet (since ordered by recorded_at desc)
        if (!customerSignals.some(s => s.signal_key === signal.signal_key)) {
          customerSignals.push(signal);
        }
      }

      // 4. Batch-fetch previous indices for trend calculation (single query)
      // Using a subquery pattern to get latest index per customer
      const { data: previousIndices, error: indicesError } = await this.supabase
        .from('customer_category_indices')
        .select('customer_id, health_index, risk_score, calculated_at')
        .in('customer_id', customerIds)
        .eq('company_id', this.companyId)
        .order('calculated_at', { ascending: false });

      if (indicesError) {
        console.error('Failed to fetch previous indices:', indicesError);
        // Continue - trends will default to 'stable'
      }

      // Get latest index per customer
      const previousByCustomer = new Map<string, { health_index: number; risk_score: number }>();
      for (const idx of previousIndices || []) {
        if (!previousByCustomer.has(idx.customer_id)) {
          previousByCustomer.set(idx.customer_id, {
            health_index: idx.health_index ?? 50,
            risk_score: idx.risk_score ?? 50,
          });
        }
      }

      // 5. Pre-fetch tier configuration (single query, cached)
      await this.getTierForARR(0); // This populates the tier cache

      // 6. Process each customer in memory (no DB calls in loop)
      const indicesToInsert: any[] = [];
      const customerUpdates: Array<{ id: string; risk_score: number; opportunity_score: number; health_score: number }> = [];
      const calculatedAt = new Date().toISOString();

      for (const customerId of customerIds) {
        try {
          const signals = signalsByCustomer.get(customerId) || [];
          if (signals.length === 0) {
            errors.push({ customer_id: customerId, error: 'No signals found' });
            continue;
          }

          const customer = customersMap.get(customerId);
          if (!customer) {
            errors.push({ customer_id: customerId, error: 'Customer not found' });
            continue;
          }

          // Calculate category indices
          const indices = this.calculateCategoryIndices(signals, configs);

          // Calculate risk and opportunity scores
          const { riskScore, opportunityScore, riskFactors, opportunityFactors } =
            this.calculateRiskOpportunityScores(signals, configs, indices);

          // Get tier and multiplier from cache
          const tier = this.findTierForARR(customer.current_arr || 0, this.tierConfigCache || []);
          const tierMultiplier = tier?.priority_multiplier ?? 1.0;

          // Calculate timing multiplier
          const timingMultiplier = this.calculateTimingMultiplier(customer.renewal_date);

          // Calculate priority score
          const basePriority = riskScore * 0.6 + opportunityScore * 0.4;
          const priorityScore = Math.round(basePriority * tierMultiplier * timingMultiplier);

          // Calculate health index
          const healthIndex = this.calculateHealthIndex(indices);

          // Calculate trends from cached previous data
          const previous = previousByCustomer.get(customerId);
          const healthDelta = previous ? healthIndex - previous.health_index : 0;
          const riskDelta = previous ? riskScore - previous.risk_score : 0;
          const trends = {
            health: (healthDelta > 5 ? 'improving' : healthDelta < -5 ? 'declining' : 'stable') as TrendDirection,
            risk: (riskDelta > 5 ? 'worsening' : riskDelta < -5 ? 'improving' : 'stable') as TrendDirection,
          };

          // Build factors object
          const factors: ScoringFactors = {
            category_weights: DEFAULT_CATEGORY_WEIGHTS.risk,
            tier: tier ? {
              tier_key: tier.tier_key,
              tier_name: tier.tier_name,
              multiplier: tier.priority_multiplier,
              arr: customer.current_arr || 0,
            } : undefined,
            risk: {
              base_score: riskScore,
              signal_contributions: riskFactors,
            },
            opportunity: {
              base_score: opportunityScore,
              signal_contributions: opportunityFactors,
            },
            priority: {
              base_score: basePriority,
              tier_multiplier: tierMultiplier,
              timing_multiplier: timingMultiplier,
              final_score: priorityScore,
            },
          };

          // Queue for batch insert
          indicesToInsert.push({
            customer_id: customerId,
            company_id: this.companyId,
            adoption_index: indices.adoption,
            engagement_index: indices.engagement,
            sentiment_index: indices.sentiment,
            business_index: indices.business,
            external_index: indices.external,
            health_index: healthIndex,
            risk_score: riskScore,
            opportunity_score: opportunityScore,
            priority_score: priorityScore,
            health_trend: trends.health,
            risk_trend: trends.risk,
            calculated_at: calculatedAt,
            calculation_version: 'v1',
            factors,
          });

          // Queue for batch update
          customerUpdates.push({
            id: customerId,
            risk_score: Math.round(riskScore),
            opportunity_score: Math.round(opportunityScore),
            health_score: Math.round(healthIndex),
          });

          // Build result
          results.push({
            customer_id: customerId,
            indices: {
              adoption: indices.adoption,
              engagement: indices.engagement,
              sentiment: indices.sentiment,
              business: indices.business,
              external: indices.external,
              health: healthIndex,
            },
            scores: {
              risk: riskScore,
              opportunity: opportunityScore,
              priority: priorityScore,
            },
            tier: tier ?? null,
            trends,
            factors,
            calculated_at: calculatedAt,
          });
        } catch (err: any) {
          errors.push({ customer_id: customerId, error: err.message });
        }
      }

      // 7. Batch-insert all indices (single query)
      if (indicesToInsert.length > 0) {
        const { error: insertError } = await this.supabase
          .from('customer_category_indices')
          .insert(indicesToInsert);

        if (insertError) {
          console.error('Failed to batch insert indices:', insertError);
          // Don't fail - calculations were successful, just storage failed
        }
      }

      // 8. Batch-update customer scores (using upsert for efficiency)
      if (customerUpdates.length > 0) {
        // Supabase doesn't support batch updates with different values easily,
        // so we use Promise.all with individual updates but limited concurrency
        const BATCH_SIZE = 50;
        for (let i = 0; i < customerUpdates.length; i += BATCH_SIZE) {
          const batch = customerUpdates.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(update =>
              this.supabase
                .from('customers')
                .update({
                  risk_score: update.risk_score,
                  opportunity_score: update.opportunity_score,
                  health_score: update.health_score,
                  updated_at: calculatedAt,
                })
                .eq('id', update.id)
            )
          );
        }
      }
    } catch (err: any) {
      // If batch setup fails, mark all customers as errored
      for (const customerId of customerIds) {
        errors.push({ customer_id: customerId, error: err.message });
      }
    }

    return {
      success_count: results.length,
      error_count: errors.length,
      results,
      errors,
      duration_ms: Date.now() - startTime,
    };
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  /**
   * Get the latest indices for a customer
   */
  async getLatestIndices(customerId: string): Promise<CustomerCategoryIndices | null> {
    const { data, error } = await this.supabase
      .from('customer_category_indices')
      .select('*')
      .eq('customer_id', customerId)
      .eq('company_id', this.companyId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch indices: ${error.message}`);
    }

    return data;
  }

  /**
   * Get indices history for a customer
   */
  async getIndicesHistory(
    customerId: string,
    limit: number = 10
  ): Promise<CustomerCategoryIndices[]> {
    const { data, error } = await this.supabase
      .from('customer_category_indices')
      .select('*')
      .eq('customer_id', customerId)
      .eq('company_id', this.companyId)
      .order('calculated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch indices history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Calculate strategic quadrant for a customer
   */
  async calculateQuadrant(customerId: string): Promise<QuadrantResult> {
    const indices = await this.getLatestIndices(customerId);

    const riskScore = indices?.risk_score ?? 50;
    const opportunityScore = indices?.opportunity_score ?? 50;

    const isHighRisk = riskScore >= QUADRANT_THRESHOLDS.risk_high;
    const isHighOpportunity = opportunityScore >= QUADRANT_THRESHOLDS.opportunity_high;

    let quadrant: StrategicQuadrant;
    if (isHighRisk && isHighOpportunity) {
      quadrant = 'invest';  // High risk + high opp = invest heavily
    } else if (!isHighRisk && isHighOpportunity) {
      quadrant = 'expand';  // Low risk + high opp = expand
    } else if (isHighRisk && !isHighOpportunity) {
      quadrant = 'rescue';  // High risk + low opp = rescue/save
    } else {
      quadrant = 'maintain'; // Low risk + low opp = maintain
    }

    return {
      quadrant,
      risk_level: isHighRisk ? 'high' : 'low',
      opportunity_level: isHighOpportunity ? 'high' : 'low',
      risk_score: riskScore,
      opportunity_score: opportunityScore,
    };
  }

  // ==========================================================================
  // Internal Helpers
  // ==========================================================================

  /**
   * Normalize a raw value using the signal's configuration
   */
  private normalizeValue(rawValue: number, config: SignalConfiguration): number {
    const min = config.min_value ?? 0;
    const max = config.max_value ?? 100;

    switch (config.normalization_type) {
      case 'linear':
        // Linear scaling from min-max to 0-100
        if (max === min) return 50; // Avoid division by zero
        const linear = ((rawValue - min) / (max - min)) * 100;
        return Math.max(0, Math.min(100, linear));

      case 'log':
        // Logarithmic scaling for values with high variance
        if (rawValue <= 0) return 0;
        const logMin = Math.log(Math.max(min, 1));
        const logMax = Math.log(Math.max(max, 2));
        const logValue = Math.log(rawValue);
        const logNorm = ((logValue - logMin) / (logMax - logMin)) * 100;
        return Math.max(0, Math.min(100, logNorm));

      case 'inverse':
        // Inverse: higher raw = lower normalized (for negative signals)
        const inverse = 100 - (((rawValue - min) / (max - min)) * 100);
        return Math.max(0, Math.min(100, inverse));

      case 'percentile':
        // For percentile, we'd need historical data - fall back to linear
        // TODO: Implement percentile calculation with historical signals
        return this.normalizeValue(rawValue, { ...config, normalization_type: 'linear' });

      default:
        return rawValue;
    }
  }

  /**
   * Get signal configuration from cache or database
   */
  private async getSignalConfig(signalKey: string): Promise<SignalConfiguration | null> {
    // Check cache first
    if (this.signalConfigCache.has(signalKey) && Date.now() < this.cacheExpiry) {
      return this.signalConfigCache.get(signalKey)!;
    }

    const { data, error } = await this.supabase
      .from('signal_configurations')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('signal_key', signalKey)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch signal config: ${error.message}`);
    }

    if (data) {
      this.signalConfigCache.set(signalKey, data);
      this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;
    }

    return data;
  }

  /**
   * Get all active signal configurations
   */
  private async getAllSignalConfigs(): Promise<SignalConfiguration[]> {
    const { data, error } = await this.supabase
      .from('signal_configurations')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch signal configs: ${error.message}`);
    }

    // Populate cache
    for (const config of data || []) {
      this.signalConfigCache.set(config.signal_key, config);
    }
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

    return data || [];
  }

  /**
   * Get latest signals for a customer
   */
  private async getLatestSignals(customerId: string): Promise<CustomerSignal[]> {
    // Get latest signal for each signal_key
    const { data, error } = await this.supabase
      .from('customer_signals')
      .select('*')
      .eq('customer_id', customerId)
      .eq('company_id', this.companyId)
      .order('recorded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch signals: ${error.message}`);
    }

    // Deduplicate to get only the latest per signal_key
    const latestByKey = new Map<string, CustomerSignal>();
    for (const signal of data || []) {
      if (!latestByKey.has(signal.signal_key)) {
        latestByKey.set(signal.signal_key, signal);
      }
    }

    return Array.from(latestByKey.values());
  }

  /**
   * Calculate category indices from signals
   */
  private calculateCategoryIndices(
    signals: CustomerSignal[],
    configs: SignalConfiguration[]
  ): Record<SignalCategory, number> {
    const categories: Record<SignalCategory, { sum: number; weightSum: number }> = {
      adoption: { sum: 0, weightSum: 0 },
      engagement: { sum: 0, weightSum: 0 },
      sentiment: { sum: 0, weightSum: 0 },
      business: { sum: 0, weightSum: 0 },
      external: { sum: 0, weightSum: 0 },
    };

    for (const signal of signals) {
      const config = configs.find(c => c.signal_key === signal.signal_key);
      if (!config || signal.normalized_value === undefined) continue;

      const category = config.category as SignalCategory;
      categories[category].sum += signal.normalized_value * config.weight;
      categories[category].weightSum += config.weight;
    }

    // Calculate weighted averages
    const result: Record<SignalCategory, number> = {
      adoption: 0,
      engagement: 0,
      sentiment: 0,
      business: 0,
      external: 0,
    };

    for (const [cat, data] of Object.entries(categories)) {
      result[cat as SignalCategory] = data.weightSum > 0
        ? Math.round(data.sum / data.weightSum)
        : 50; // Default to 50 if no signals in category
    }

    return result;
  }

  /**
   * Calculate risk and opportunity scores
   */
  private calculateRiskOpportunityScores(
    signals: CustomerSignal[],
    configs: SignalConfiguration[],
    indices: Record<SignalCategory, number>
  ): {
    riskScore: number;
    opportunityScore: number;
    riskFactors: Array<{ signal_key: string; value: number; weight: number; contribution: number }>;
    opportunityFactors: Array<{ signal_key: string; value: number; weight: number; contribution: number }>;
  } {
    const riskFactors: Array<{ signal_key: string; value: number; weight: number; contribution: number }> = [];
    const opportunityFactors: Array<{ signal_key: string; value: number; weight: number; contribution: number }> = [];

    // Calculate risk score (100 - weighted health)
    // Higher risk = lower category indices
    const weights = DEFAULT_CATEGORY_WEIGHTS.risk;
    const healthFromIndices =
      indices.adoption * weights.adoption +
      indices.engagement * weights.engagement +
      indices.sentiment * weights.sentiment +
      indices.business * weights.business +
      indices.external * weights.external;

    let riskScore = Math.round(100 - healthFromIndices);

    // Adjust risk based on individual risk signals
    for (const signal of signals) {
      const config = configs.find(c => c.signal_key === signal.signal_key);
      if (!config || !config.is_risk_signal) continue;

      // Risk signals add to risk when they're high
      const contribution = (signal.normalized_value ?? 50) * 0.1;
      riskScore = Math.min(100, riskScore + contribution);
      riskFactors.push({
        signal_key: signal.signal_key,
        value: signal.normalized_value ?? 0,
        weight: config.weight,
        contribution,
      });
    }

    // Calculate opportunity score from category indices + opportunity signals
    const oppWeights = DEFAULT_CATEGORY_WEIGHTS.opportunity;
    let opportunityScore = Math.round(
      indices.adoption * oppWeights.adoption +
      indices.engagement * oppWeights.engagement +
      indices.sentiment * oppWeights.sentiment +
      indices.business * oppWeights.business +
      indices.external * oppWeights.external
    );

    // Boost opportunity based on individual opportunity signals
    for (const signal of signals) {
      const config = configs.find(c => c.signal_key === signal.signal_key);
      if (!config || !config.is_opportunity_signal) continue;

      const contribution = (signal.normalized_value ?? 50) * 0.1;
      opportunityScore = Math.min(100, opportunityScore + contribution);
      opportunityFactors.push({
        signal_key: signal.signal_key,
        value: signal.normalized_value ?? 0,
        weight: config.weight,
        contribution,
      });
    }

    return {
      riskScore: Math.max(0, Math.min(100, riskScore)),
      opportunityScore: Math.max(0, Math.min(100, opportunityScore)),
      riskFactors,
      opportunityFactors,
    };
  }

  /**
   * Get tier configuration for a given ARR
   */
  private async getTierForARR(arr: number | undefined): Promise<TierConfiguration | null> {
    if (arr === undefined) return null;

    // Check cache
    if (this.tierConfigCache && Date.now() < this.cacheExpiry) {
      return this.findTierForARR(arr, this.tierConfigCache);
    }

    const { data, error } = await this.supabase
      .from('tier_configurations')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .order('tier_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch tier configs:', error);
      return null;
    }

    this.tierConfigCache = data || [];
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;

    return this.findTierForARR(arr, this.tierConfigCache);
  }

  private findTierForARR(arr: number, tiers: TierConfiguration[]): TierConfiguration | null {
    for (const tier of tiers) {
      const minOk = tier.min_arr == null || arr >= tier.min_arr;
      const maxOk = tier.max_arr == null || arr < tier.max_arr;
      if (minOk && maxOk) {
        return tier;
      }
    }
    return null;
  }

  /**
   * Calculate timing multiplier based on renewal proximity
   */
  private calculateTimingMultiplier(renewalDate: string | undefined): number {
    if (!renewalDate) return 1.0;

    const daysToRenewal = Math.floor(
      (new Date(renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Closer to renewal = higher multiplier
    if (daysToRenewal < 0) return 2.0;  // Overdue
    if (daysToRenewal < 30) return 1.5; // Critical
    if (daysToRenewal < 60) return 1.3; // Urgent
    if (daysToRenewal < 90) return 1.1; // Approaching
    return 1.0;
  }

  /**
   * Calculate health index from category indices
   */
  private calculateHealthIndex(indices: Record<SignalCategory, number>): number {
    const weights = { adoption: 0.25, engagement: 0.25, sentiment: 0.30, business: 0.10, external: 0.10 };
    return Math.round(
      indices.adoption * weights.adoption +
      indices.engagement * weights.engagement +
      indices.sentiment * weights.sentiment +
      indices.business * weights.business +
      indices.external * weights.external
    );
  }

  /**
   * Calculate trends by comparing to previous calculation
   */
  private async calculateTrends(
    customerId: string,
    currentHealth: number,
    currentRisk: number
  ): Promise<{ health: TrendDirection; risk: TrendDirection }> {
    const { data: previous } = await this.supabase
      .from('customer_category_indices')
      .select('health_index, risk_score')
      .eq('customer_id', customerId)
      .eq('company_id', this.companyId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (!previous) {
      return { health: 'stable', risk: 'stable' };
    }

    const healthDelta = currentHealth - (previous.health_index ?? 50);
    const riskDelta = currentRisk - (previous.risk_score ?? 50);

    return {
      health: healthDelta > 5 ? 'improving' : healthDelta < -5 ? 'declining' : 'stable',
      risk: riskDelta > 5 ? 'worsening' : riskDelta < -5 ? 'improving' : 'stable',
    };
  }

  /**
   * Sync calculated scores to the customers table
   */
  private async syncScoresToCustomer(
    customerId: string,
    riskScore: number,
    opportunityScore: number,
    healthScore: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .update({
        risk_score: Math.round(riskScore),
        opportunity_score: Math.round(opportunityScore),
        health_score: Math.round(healthScore),
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (error) {
      console.error('Failed to sync scores to customer:', error);
    }
  }

  /**
   * Clear the internal cache (useful after config changes)
   */
  clearCache(): void {
    this.signalConfigCache.clear();
    this.tierConfigCache = null;
    this.cacheExpiry = 0;
  }
}
