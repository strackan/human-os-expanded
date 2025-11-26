/**
 * Pricing Optimization Service
 *
 * Wraps the pricing optimization engine database functions.
 * Provides TypeScript interface for calculating pricing recommendations
 * and tracking outcomes.
 *
 * Core value proposition: Maximize NRR while minimizing churn risk.
 * Target: >70% pricing recommendation acceptance rate.
 */

import { createClient } from '@/lib/supabase/server';

// =========================================================================
// TYPES
// =========================================================================

export interface PricingScenario {
  scenario: 'Conservative' | 'Recommended' | 'Aggressive';
  targetPrice: number;
  increasePercent: number;
  increaseAmount: number;
  probability: number;
  pros: string[];
  cons: string[];
}

export interface PricingFactors {
  stickinessScore: number; // 0-100
  valueIndex: number; // 0.95-1.05
  marketAdjustment: number; // -2 to +3
  riskMultiplier: number; // 0.5-1.1
  trendAdjustment: number; // -2 to +2
  baseIncrease: number; // Before risk adjustment
}

export interface DataQuality {
  usage: 'complete' | 'partial' | 'placeholder';
  financial: 'complete' | 'partial' | 'placeholder';
  risk: 'complete' | 'partial' | 'placeholder';
  competitive: 'complete' | 'partial' | 'placeholder';
}

export interface PricingRecommendation {
  targetPrice: number;
  increasePercent: number;
  increaseAmount: number;
  confidence: number; // 0-100
  scenarios: PricingScenario[];
  factors: PricingFactors;
  dataQuality: DataQuality;
}

export interface CSMInputs {
  price_increase_cap?: number; // Max % increase from contract/discovery
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
}

export interface PricingOutcome {
  recommendationId: string;
  accepted: boolean;
  finalPrice: number;
  selectedScenario?: 'Conservative' | 'Recommended' | 'Aggressive' | 'Custom';
  notes?: string;
}

export interface PricingAcceptanceMetrics {
  acceptedCount: number;
  rejectedCount: number;
  totalRecommendations: number;
  acceptanceRate: number; // Percentage
  avgAcceptedIncrease: number;
  avgFinalIncrease: number;
  avgPriceDeviation: number;
  avgPercentDeviation: number;
  avgConfidenceAccepted: number;
  avgConfidenceRejected: number;
  conservativeCount: number;
  recommendedCount: number;
  aggressiveCount: number;
  customCount: number;
  firstRenewal: Date | null;
  lastRenewal: Date | null;
  uniqueCustomers: number;
}

// =========================================================================
// SERVICE
// =========================================================================

export class PricingOptimizationService {
  /**
   * Calculate pricing recommendation for a customer
   *
   * Analyzes 5 key factors:
   * 1. Stickiness Score (switching cost)
   * 2. Value Leverage Index (value delivered vs. price paid)
   * 3. Market Position (peer benchmark comparison)
   * 4. Risk Multiplier (churn risk, budget pressure, competitive threat)
   * 5. Trend Adjustment (usage, support, sentiment trends)
   *
   * Returns 3 scenarios: Conservative, Recommended (primary), Aggressive
   *
   * @param customerId - UUID of customer to analyze
   * @param csmInputs - Optional CSM preferences (risk tolerance, price cap)
   * @returns Pricing recommendation with scenarios, factors, and confidence
   */
  static async calculateRecommendation(
    customerId: string,
    csmInputs: CSMInputs = {}
  ): Promise<PricingRecommendation> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('calculate_pricing_recommendation', {
      p_customer_id: customerId,
      p_csm_inputs: csmInputs
    });

    if (error) {
      throw new Error(`Failed to calculate pricing recommendation: ${error.message}`);
    }

    if (!data) {
      throw new Error('No pricing recommendation returned from database');
    }

    return data as PricingRecommendation;
  }

  /**
   * Calculate individual factor: Stickiness Score
   *
   * Measures how difficult/costly it would be for customer to switch.
   * Higher score = more pricing power.
   *
   * Factors:
   * - Feature adoption (0-25 points)
   * - Integrations (0-20 points)
   * - Data volume (0-20 points)
   * - User adoption (0-15 points)
   * - Customizations (0-15 points)
   * - Tenure (0-5 points)
   *
   * @param customerId - UUID of customer
   * @returns Score 0-100 (higher = stickier)
   */
  static async calculateStickinessScore(customerId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('calculate_stickiness_score', {
      p_customer_id: customerId
    });

    if (error) {
      throw new Error(`Failed to calculate stickiness score: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Calculate individual factor: Value Leverage Index
   *
   * Ratio of value delivered to price paid. Higher value = more pricing power.
   *
   * @param customerId - UUID of customer
   * @returns Multiplier 0.95-1.05
   */
  static async calculateValueLeverageIndex(customerId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('calculate_value_leverage_index', {
      p_customer_id: customerId
    });

    if (error) {
      throw new Error(`Failed to calculate value leverage index: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Calculate individual factor: Market Position Adjustment
   *
   * Compares customer's current price to market benchmark.
   *
   * @param customerId - UUID of customer
   * @returns Adjustment -2 to +3 percentage points
   */
  static async getMarketPositionAdjustment(customerId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_market_position_adjustment', {
      p_customer_id: customerId
    });

    if (error) {
      throw new Error(`Failed to get market position adjustment: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Calculate individual factor: Risk Multiplier
   *
   * Churn risk reduces pricing aggressiveness.
   *
   * @param customerId - UUID of customer
   * @returns Multiplier 0.5-1.1
   */
  static async calculateRiskMultiplier(customerId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('calculate_risk_multiplier', {
      p_customer_id: customerId
    });

    if (error) {
      throw new Error(`Failed to calculate risk multiplier: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Calculate individual factor: Trend Adjustment
   *
   * Recent trends indicate momentum direction.
   *
   * @param customerId - UUID of customer
   * @returns Adjustment -2 to +2 percentage points
   */
  static async calculateTrendAdjustment(customerId: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('calculate_trend_adjustment', {
      p_customer_id: customerId
    });

    if (error) {
      throw new Error(`Failed to calculate trend adjustment: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Store pricing recommendation from workflow execution
   *
   * Saves recommendation to database for tracking and analysis.
   * Links to workflow execution for context.
   *
   * @param customerId - UUID of customer
   * @param executionId - UUID of workflow execution
   * @param recommendation - Pricing recommendation object
   * @returns UUID of stored recommendation
   */
  static async storeRecommendation(
    customerId: string,
    executionId: string,
    recommendation: PricingRecommendation
  ): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('store_pricing_recommendation', {
      p_customer_id: customerId,
      p_execution_id: executionId,
      p_recommendation: recommendation
    });

    if (error) {
      throw new Error(`Failed to store pricing recommendation: ${error.message}`);
    }

    if (!data) {
      throw new Error('No recommendation ID returned from storage');
    }

    return data as string;
  }

  /**
   * Update pricing recommendation with actual renewal outcome
   *
   * Call this after renewal closes to track acceptance rate and accuracy.
   * Used to measure >70% acceptance rate target.
   *
   * @param outcome - Pricing outcome with recommendation ID and final details
   */
  static async updateOutcome(outcome: PricingOutcome): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc('update_pricing_outcome', {
      p_recommendation_id: outcome.recommendationId,
      p_accepted: outcome.accepted,
      p_final_price: outcome.finalPrice,
      p_selected_scenario: outcome.selectedScenario || null,
      p_notes: outcome.notes || null
    });

    if (error) {
      throw new Error(`Failed to update pricing outcome: ${error.message}`);
    }
  }

  /**
   * Get pricing acceptance rate analytics
   *
   * Returns metrics for last 90 days:
   * - Acceptance rate (target: >70%)
   * - Average price deviation
   * - Scenario selection breakdown
   * - Confidence correlation
   *
   * @returns Acceptance metrics for last 90 days
   */
  static async getAcceptanceMetrics(): Promise<PricingAcceptanceMetrics> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pricing_acceptance_rate')
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to get acceptance metrics: ${error.message}`);
    }

    if (!data) {
      // No data yet - return empty metrics
      return {
        acceptedCount: 0,
        rejectedCount: 0,
        totalRecommendations: 0,
        acceptanceRate: 0,
        avgAcceptedIncrease: 0,
        avgFinalIncrease: 0,
        avgPriceDeviation: 0,
        avgPercentDeviation: 0,
        avgConfidenceAccepted: 0,
        avgConfidenceRejected: 0,
        conservativeCount: 0,
        recommendedCount: 0,
        aggressiveCount: 0,
        customCount: 0,
        firstRenewal: null,
        lastRenewal: null,
        uniqueCustomers: 0
      };
    }

    return {
      acceptedCount: data.accepted_count || 0,
      rejectedCount: data.rejected_count || 0,
      totalRecommendations: data.total_recommendations || 0,
      acceptanceRate: data.acceptance_rate || 0,
      avgAcceptedIncrease: data.avg_accepted_increase || 0,
      avgFinalIncrease: data.avg_final_increase || 0,
      avgPriceDeviation: data.avg_price_deviation || 0,
      avgPercentDeviation: data.avg_percent_deviation || 0,
      avgConfidenceAccepted: data.avg_confidence_accepted || 0,
      avgConfidenceRejected: data.avg_confidence_rejected || 0,
      conservativeCount: data.conservative_count || 0,
      recommendedCount: data.recommended_count || 0,
      aggressiveCount: data.aggressive_count || 0,
      customCount: data.custom_count || 0,
      firstRenewal: data.first_renewal ? new Date(data.first_renewal) : null,
      lastRenewal: data.last_renewal ? new Date(data.last_renewal) : null,
      uniqueCustomers: data.unique_customers || 0
    };
  }

  /**
   * Get historical pricing recommendations for a customer
   *
   * Returns all past recommendations with outcomes.
   * Useful for seeing recommendation evolution and accuracy over time.
   *
   * @param customerId - UUID of customer
   * @returns Array of historical recommendations
   */
  static async getCustomerRecommendationHistory(
    customerId: string
  ): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pricing_recommendations')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get recommendation history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get pricing recommendation by ID
   *
   * @param recommendationId - UUID of recommendation
   * @returns Pricing recommendation details
   */
  static async getRecommendationById(recommendationId: string): Promise<any> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pricing_recommendations')
      .select('*')
      .eq('id', recommendationId)
      .single();

    if (error) {
      throw new Error(`Failed to get recommendation: ${error.message}`);
    }

    return data;
  }
}

export default PricingOptimizationService;
