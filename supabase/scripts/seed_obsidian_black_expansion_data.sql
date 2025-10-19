-- ============================================================================
-- Seed Obsidian Black Expansion Data
-- Purpose: Add contract and expansion metrics for Obsidian Black expansion workflow
-- Phase: 2B.4 (Fix expansion data for simplified single-customer demo)
-- ============================================================================
-- Context: Obsidian Black is an at-risk account with relationship issues but
-- solid product adoption. Different expansion story than TechFlow (proactive growth).
-- ============================================================================

-- Delete existing expansion data for Obsidian Black (in case re-running)
DELETE FROM public.contracts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';
DELETE FROM public.customer_properties WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Create Contract for Obsidian Black
INSERT INTO public.contracts (
  customer_id,
  contract_number,
  start_date,
  end_date,
  arr,
  seats,
  contract_type,
  status,
  auto_renewal,
  notes,
  is_demo,
  created_at,
  updated_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'OBSBLK-CONTRACT-2024',
  '2024-01-15',
  '2026-01-15',
  185000.00,  -- $185K ARR ($8.60/seat * 45 seats * 12 months)
  45,  -- 45 seats
  'subscription',
  'active',
  true,  -- Auto-renewal enabled
  'At-risk account with relationship challenges but strong product fit. Recovery opportunity through value demonstration and relationship repair.',
  true,  -- is_demo flag
  NOW(),
  NOW()
);

-- Update/Insert Customer Properties with Expansion Metrics
INSERT INTO public.customer_properties (
  customer_id,
  usage_score,
  health_score,
  nps_score,
  current_arr,
  revenue_impact_tier,
  churn_risk_score,
  -- Usage metrics (showing moderate utilization, room for growth)
  active_users,
  license_capacity,
  utilization_percent,
  yoy_growth,
  last_month_growth,
  peak_usage,
  adoption_rate,
  -- Market data (showing underpricing opportunity)
  market_price_average,
  market_percentile,
  price_gap,
  similar_customer_range,
  opportunity_value,
  created_at,
  last_updated
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  72,  -- 7.2/10 usage (solid but not stellar)
  58,  -- 5.8/10 health (at-risk)
  65,  -- 6.5/10 NPS (satisfied but concerns)
  185000.00,
  4,  -- Tier 4 (high-value, strategic account)
  4,  -- Churn risk 4/5 (high risk due to relationship issues)
  -- Usage metrics
  52,   -- Active users (15% above capacity - showing growth)
  45,   -- License capacity (matching contract seats)
  115,  -- 115% utilization (slightly over, indicating need)
  28,   -- 28% YoY growth (healthy growth trend)
  8,    -- 8% last month growth
  58,   -- Peak usage
  87,   -- 87% adoption rate (good product fit)
  -- Market data
  10.50,  -- Market average: $10.50/seat
  32,     -- They're at 32nd percentile (paying $8.60, below market)
  1.90,   -- $1.90 below market average ($10.50 - $8.60)
  '$9.00 - $12.50',
  '$120K incremental ARR over 2 years',
  NOW(),
  NOW()
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify Obsidian Black contract
SELECT
  '✅ Obsidian Black Contract' as check,
  contract_number,
  '$' || arr as arr,
  seats,
  start_date,
  end_date,
  status
FROM public.contracts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Verify Obsidian Black usage metrics
SELECT
  '✅ Obsidian Black Usage' as check,
  active_users,
  license_capacity,
  utilization_percent || '%' as utilization,
  yoy_growth || '%' as yoy_growth,
  adoption_rate || '%' as adoption
FROM public.customer_properties
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Verify Obsidian Black market data
SELECT
  '✅ Obsidian Black Market Data' as check,
  '$' || market_price_average as market_avg,
  market_percentile || 'th percentile' as position,
  '$' || price_gap as gap_below_market,
  similar_customer_range,
  opportunity_value
FROM public.customer_properties
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- ============================================================================
-- SEEDING COMPLETE
-- ============================================================================
-- ✅ Obsidian Black now has expansion data
-- Contract: $185K ARR, 45 seats ($8.60/seat)
-- Usage: 115% utilization (52 active / 45 capacity), 28% YoY growth
-- Market: 32nd percentile ($1.90 below market average)
-- Expansion Opportunity: $120K incremental over 2 years
-- Story: At-risk account with solid usage & growth - opportunity to strengthen
--        relationship through value-based expansion
-- ============================================================================
