/**
 * Customer Scoring System Types
 *
 * Defines the type system for the unified scoring engine that:
 * - Ingests signals from multiple sources
 * - Normalizes into category indices
 * - Calculates Risk, Opportunity, and Priority scores
 */

// =============================================================================
// Signal Configuration Types
// =============================================================================

/**
 * Category for grouping signals
 */
export type SignalCategory = 'adoption' | 'engagement' | 'sentiment' | 'business' | 'external';

/**
 * How to normalize raw values to 0-100 scale
 */
export type NormalizationType = 'linear' | 'log' | 'percentile' | 'inverse';

/**
 * Signal configuration from database
 */
export interface SignalConfiguration {
  id: string;
  company_id: string;
  signal_key: string;
  signal_name: string;
  description?: string;
  category: SignalCategory;
  normalization_type: NormalizationType;
  min_value?: number;
  max_value?: number;
  weight: number;
  is_risk_signal: boolean;
  is_opportunity_signal: boolean;
  is_active: boolean;
  source_field?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Customer Signal Types
// =============================================================================

/**
 * Period type for time-series signals
 */
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

/**
 * Recorded signal value from database
 */
export interface CustomerSignal {
  id: string;
  customer_id: string;
  company_id: string;
  signal_key: string;
  raw_value: number;
  normalized_value?: number;
  recorded_at: string;
  period_type: PeriodType;
  data_source?: string;
  import_batch_id?: string;
  created_at: string;
}

/**
 * Input for recording a new signal
 */
export interface SignalInput {
  customer_id: string;
  signal_key: string;
  raw_value: number;
  recorded_at?: string;  // Defaults to now
  period_type?: PeriodType;
  data_source?: string;
  import_batch_id?: string;
}

// =============================================================================
// Category Index Types
// =============================================================================

/**
 * Trend direction for indices
 */
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'worsening';

/**
 * Calculated category indices from database
 */
export interface CustomerCategoryIndices {
  id: string;
  customer_id: string;
  company_id: string;
  adoption_index?: number;
  engagement_index?: number;
  sentiment_index?: number;
  business_index?: number;
  external_index?: number;
  health_index?: number;
  risk_score?: number;
  opportunity_score?: number;
  priority_score?: number;
  health_trend?: TrendDirection;
  risk_trend?: TrendDirection;
  calculated_at: string;
  calculation_version: string;
  factors: ScoringFactors;
}

/**
 * Detailed breakdown of how scores were calculated
 */
export interface ScoringFactors {
  // Category weights used
  category_weights: {
    adoption: number;
    engagement: number;
    sentiment: number;
    business: number;
    external: number;
  };

  // Tier information
  tier?: {
    tier_key: string;
    tier_name: string;
    multiplier: number;
    arr: number;
  };

  // Risk calculation breakdown
  risk?: {
    base_score: number;
    signal_contributions: Array<{
      signal_key: string;
      value: number;
      weight: number;
      contribution: number;
    }>;
  };

  // Opportunity calculation breakdown
  opportunity?: {
    base_score: number;
    signal_contributions: Array<{
      signal_key: string;
      value: number;
      weight: number;
      contribution: number;
    }>;
  };

  // Priority calculation breakdown
  priority?: {
    base_score: number;
    tier_multiplier: number;
    timing_multiplier: number;
    final_score: number;
  };

  // Custom data
  custom?: Record<string, any>;
}

// =============================================================================
// Tier Configuration Types
// =============================================================================

/**
 * Tier configuration from database
 */
export interface TierConfiguration {
  id: string;
  company_id: string;
  tier_key: string;
  tier_name: string;
  tier_order: number;
  min_arr?: number;
  max_arr?: number;
  priority_multiplier: number;
  response_time_hours?: number;
  touches_per_quarter?: number;
  color_hex?: string;
  icon_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Calculation Result Types
// =============================================================================

/**
 * Result from score calculation
 */
export interface ScoreCalculationResult {
  customer_id: string;
  indices: {
    adoption: number;
    engagement: number;
    sentiment: number;
    business: number;
    external: number;
    health: number;
  };
  scores: {
    risk: number;
    opportunity: number;
    priority: number;
  };
  tier: TierConfiguration | null;
  trends: {
    health: TrendDirection;
    risk: TrendDirection;
  };
  factors: ScoringFactors;
  calculated_at: string;
}

/**
 * Batch calculation result
 */
export interface BatchCalculationResult {
  success_count: number;
  error_count: number;
  results: ScoreCalculationResult[];
  errors: Array<{
    customer_id: string;
    error: string;
  }>;
  duration_ms: number;
}

// =============================================================================
// Quadrant Types
// =============================================================================

/**
 * Strategic quadrant (calculated from Risk × Opportunity matrix)
 */
export type StrategicQuadrant = 'invest' | 'expand' | 'rescue' | 'maintain';

/**
 * CSM-selected strategy
 */
export type AccountStrategy = 'invest' | 'expand' | 'save' | 'monitor' | 'maintain';

/**
 * Quadrant calculation result
 */
export interface QuadrantResult {
  quadrant: StrategicQuadrant;
  risk_level: 'high' | 'low';
  opportunity_level: 'high' | 'low';
  risk_score: number;
  opportunity_score: number;
}

// =============================================================================
// Service Configuration
// =============================================================================

/**
 * Default weights for category index → risk/opportunity calculation
 */
export const DEFAULT_CATEGORY_WEIGHTS = {
  // Risk score weights (higher index = lower risk, so these are inverse-ish)
  risk: {
    adoption: 0.35,
    engagement: 0.25,
    sentiment: 0.25,
    business: 0.05,
    external: 0.10,
  },
  // Opportunity score weights
  opportunity: {
    adoption: 0.30,
    engagement: 0.25,
    sentiment: 0.20,
    business: 0.10,
    external: 0.15,
  },
} as const;

/**
 * Default tier configuration (used when no company-specific config exists)
 */
export const DEFAULT_TIER_CONFIG: Omit<TierConfiguration, 'id' | 'company_id' | 'created_at' | 'updated_at'>[] = [
  { tier_key: 'enterprise', tier_name: 'Enterprise', tier_order: 1, min_arr: 100000, max_arr: undefined, priority_multiplier: 5.0, color_hex: '#FFD700', is_active: true },
  { tier_key: 'mid_market', tier_name: 'Mid-Market', tier_order: 2, min_arr: 25000, max_arr: 100000, priority_multiplier: 2.5, color_hex: '#C0C0C0', is_active: true },
  { tier_key: 'smb', tier_name: 'SMB', tier_order: 3, min_arr: 5000, max_arr: 25000, priority_multiplier: 1.0, color_hex: '#CD7F32', is_active: true },
  { tier_key: 'digital', tier_name: 'Digital', tier_order: 4, min_arr: undefined, max_arr: 5000, priority_multiplier: 0.5, color_hex: '#808080', is_active: true },
];

/**
 * Quadrant thresholds
 */
export const QUADRANT_THRESHOLDS = {
  risk_high: 50,     // Risk score >= 50 is "high risk"
  opportunity_high: 50, // Opportunity score >= 50 is "high opportunity"
} as const;
