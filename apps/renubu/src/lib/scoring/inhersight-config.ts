/**
 * InHerSight Default Signal Configurations
 *
 * These are the default signal mappings for InHerSight customer data.
 * Use setupInHerSightSignals() to populate signal_configurations for a company.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SignalCategory, NormalizationType } from './types';

/**
 * InHerSight signal definitions
 */
export const INHERSIGHT_SIGNALS: Array<{
  signal_key: string;
  signal_name: string;
  description: string;
  category: SignalCategory;
  normalization_type: NormalizationType;
  min_value: number;
  max_value: number;
  weight: number;
  is_risk_signal: boolean;
  is_opportunity_signal: boolean;
  source_field: string;
}> = [
  // =====================
  // Adoption Signals
  // =====================
  {
    signal_key: 'profile_completion_pct',
    signal_name: 'Profile Completion',
    description: 'Percentage of company profile completed on InHerSight',
    category: 'adoption',
    normalization_type: 'linear',
    min_value: 0,
    max_value: 100,
    weight: 2.0,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'profile_completion_pct',
  },
  {
    signal_key: 'products_count',
    signal_name: 'Products in Package',
    description: 'Number of InHerSight products in customer package',
    category: 'adoption',
    normalization_type: 'linear',
    min_value: 1,
    max_value: 10,
    weight: 1.5,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'products_count',
  },
  {
    signal_key: 'job_postings_active',
    signal_name: 'Active Job Postings',
    description: 'Number of active job postings on platform',
    category: 'adoption',
    normalization_type: 'log',
    min_value: 0,
    max_value: 100,
    weight: 1.0,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'job_postings_active',
  },

  // =====================
  // Engagement Signals
  // =====================
  {
    signal_key: 'brand_impressions',
    signal_name: 'Brand Impressions',
    description: 'Monthly brand impressions on InHerSight',
    category: 'engagement',
    normalization_type: 'log',
    min_value: 0,
    max_value: 1000000,
    weight: 1.5,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'brand_impressions',
  },
  {
    signal_key: 'profile_views',
    signal_name: 'Profile Views',
    description: 'Monthly profile views on InHerSight',
    category: 'engagement',
    normalization_type: 'log',
    min_value: 0,
    max_value: 100000,
    weight: 2.0,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'profile_views',
  },
  {
    signal_key: 'apply_clicks',
    signal_name: 'Apply Clicks',
    description: 'Monthly apply button clicks',
    category: 'engagement',
    normalization_type: 'log',
    min_value: 0,
    max_value: 10000,
    weight: 2.5,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'apply_clicks',
  },
  {
    signal_key: 'job_matches',
    signal_name: 'Job Matches',
    description: 'Monthly job matches for candidates',
    category: 'engagement',
    normalization_type: 'log',
    min_value: 0,
    max_value: 50000,
    weight: 1.0,
    is_risk_signal: false,
    is_opportunity_signal: false,
    source_field: 'job_matches',
  },

  // =====================
  // Sentiment Signals
  // =====================
  {
    signal_key: 'ihs_score',
    signal_name: 'IHS Score',
    description: 'InHerSight overall company score (1-5 scale)',
    category: 'sentiment',
    normalization_type: 'linear',
    min_value: 1,
    max_value: 5,
    weight: 3.0, // High weight - key indicator
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'ihs_score',
  },
  {
    signal_key: 'new_ratings',
    signal_name: 'New Ratings',
    description: 'Number of new employee ratings this month',
    category: 'sentiment',
    normalization_type: 'log',
    min_value: 0,
    max_value: 100,
    weight: 1.5,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'new_ratings',
  },
  {
    signal_key: 'rating_trend',
    signal_name: 'Rating Trend',
    description: 'Change in IHS score over last quarter (-1 to +1)',
    category: 'sentiment',
    normalization_type: 'linear',
    min_value: -1,
    max_value: 1,
    weight: 2.0,
    is_risk_signal: true, // Declining ratings = risk
    is_opportunity_signal: true, // Improving ratings = opportunity
    source_field: 'rating_trend',
  },

  // =====================
  // Business Signals
  // =====================
  {
    signal_key: 'arr',
    signal_name: 'Annual Recurring Revenue',
    description: 'Customer ARR in dollars',
    category: 'business',
    normalization_type: 'log',
    min_value: 1000,
    max_value: 500000,
    weight: 2.0,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'current_arr',
  },
  {
    signal_key: 'contract_term_months',
    signal_name: 'Contract Term',
    description: 'Contract length in months',
    category: 'business',
    normalization_type: 'linear',
    min_value: 1,
    max_value: 36,
    weight: 1.0,
    is_risk_signal: false,
    is_opportunity_signal: false,
    source_field: 'contract_term_months',
  },
  {
    signal_key: 'days_to_renewal',
    signal_name: 'Days to Renewal',
    description: 'Days until contract renewal (inverse - closer = higher priority)',
    category: 'business',
    normalization_type: 'inverse',
    min_value: 0,
    max_value: 365,
    weight: 1.5,
    is_risk_signal: true, // Close renewal = action needed
    is_opportunity_signal: false,
    source_field: 'days_to_renewal',
  },

  // =====================
  // External Signals
  // =====================
  {
    signal_key: 'article_inclusions',
    signal_name: 'Article Features',
    description: 'Number of times featured in InHerSight articles',
    category: 'external',
    normalization_type: 'linear',
    min_value: 0,
    max_value: 20,
    weight: 1.5,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'article_inclusions',
  },
  {
    signal_key: 'industry_benchmark',
    signal_name: 'Industry Benchmark',
    description: 'Percentile ranking within industry',
    category: 'external',
    normalization_type: 'linear',
    min_value: 0,
    max_value: 100,
    weight: 1.0,
    is_risk_signal: false,
    is_opportunity_signal: true,
    source_field: 'industry_benchmark',
  },
];

/**
 * InHerSight tier definitions
 */
export const INHERSIGHT_TIERS = [
  {
    tier_key: 'enterprise',
    tier_name: 'Enterprise',
    tier_order: 1,
    min_arr: 100000,
    max_arr: null,
    priority_multiplier: 5.0,
    response_time_hours: 4,
    touches_per_quarter: 12,
    color_hex: '#FFD700',
    icon_name: 'crown',
  },
  {
    tier_key: 'mid_market',
    tier_name: 'Mid-Market',
    tier_order: 2,
    min_arr: 25000,
    max_arr: 100000,
    priority_multiplier: 2.5,
    response_time_hours: 8,
    touches_per_quarter: 6,
    color_hex: '#C0C0C0',
    icon_name: 'building',
  },
  {
    tier_key: 'smb',
    tier_name: 'SMB',
    tier_order: 3,
    min_arr: 5000,
    max_arr: 25000,
    priority_multiplier: 1.0,
    response_time_hours: 24,
    touches_per_quarter: 3,
    color_hex: '#CD7F32',
    icon_name: 'store',
  },
  {
    tier_key: 'digital',
    tier_name: 'Digital',
    tier_order: 4,
    min_arr: null,
    max_arr: 5000,
    priority_multiplier: 0.5,
    response_time_hours: 48,
    touches_per_quarter: 1,
    color_hex: '#808080',
    icon_name: 'laptop',
  },
];

/**
 * Setup InHerSight signal configurations for a company
 */
export async function setupInHerSightSignals(
  supabase: SupabaseClient,
  companyId: string
): Promise<{ signals_created: number; tiers_created: number; errors: string[] }> {
  const errors: string[] = [];
  let signals_created = 0;
  let tiers_created = 0;

  // Insert signal configurations
  for (const signal of INHERSIGHT_SIGNALS) {
    const { error } = await supabase
      .from('signal_configurations')
      .upsert({
        company_id: companyId,
        ...signal,
        is_active: true,
      }, {
        onConflict: 'company_id,signal_key',
      });

    if (error) {
      errors.push(`Signal ${signal.signal_key}: ${error.message}`);
    } else {
      signals_created++;
    }
  }

  // Insert tier configurations
  for (const tier of INHERSIGHT_TIERS) {
    const { error } = await supabase
      .from('tier_configurations')
      .upsert({
        company_id: companyId,
        ...tier,
        is_active: true,
      }, {
        onConflict: 'company_id,tier_key',
      });

    if (error) {
      errors.push(`Tier ${tier.tier_key}: ${error.message}`);
    } else {
      tiers_created++;
    }
  }

  return {
    signals_created,
    tiers_created,
    errors,
  };
}

/**
 * Map InHerSight import data to signal inputs
 * Called during import to convert raw InHerSight metrics to signals
 */
export function mapInHerSightDataToSignals(
  customerId: string,
  data: Record<string, any>,
  recordedAt: string,
  importBatchId?: string
): Array<{
  customer_id: string;
  signal_key: string;
  raw_value: number;
  recorded_at: string;
  data_source: string;
  import_batch_id?: string;
}> {
  const signals: Array<{
    customer_id: string;
    signal_key: string;
    raw_value: number;
    recorded_at: string;
    data_source: string;
    import_batch_id?: string;
  }> = [];

  // Map each known field to its signal
  const fieldMappings: Record<string, string> = {
    profile_completion_pct: 'profile_completion_pct',
    products_count: 'products_count',
    job_postings_active: 'job_postings_active',
    brand_impressions: 'brand_impressions',
    profile_views: 'profile_views',
    apply_clicks: 'apply_clicks',
    job_matches: 'job_matches',
    ihs_score: 'ihs_score',
    new_ratings: 'new_ratings',
    rating_trend: 'rating_trend',
    current_arr: 'arr',
    contract_term_months: 'contract_term_months',
    article_inclusions: 'article_inclusions',
    industry_benchmark: 'industry_benchmark',
  };

  for (const [fieldName, signalKey] of Object.entries(fieldMappings)) {
    const value = data[fieldName];
    if (value !== undefined && value !== null && !isNaN(Number(value))) {
      signals.push({
        customer_id: customerId,
        signal_key: signalKey,
        raw_value: Number(value),
        recorded_at: recordedAt,
        data_source: 'inhersight_import',
        import_batch_id: importBatchId,
      });
    }
  }

  // Calculate days_to_renewal if renewal_date is present
  if (data.renewal_date) {
    const daysToRenewal = Math.floor(
      (new Date(data.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    signals.push({
      customer_id: customerId,
      signal_key: 'days_to_renewal',
      raw_value: Math.max(0, daysToRenewal),
      recorded_at: recordedAt,
      data_source: 'inhersight_import',
      import_batch_id: importBatchId,
    });
  }

  return signals;
}
