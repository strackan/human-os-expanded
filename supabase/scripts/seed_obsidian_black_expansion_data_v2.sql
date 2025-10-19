-- ============================================================================
-- Seed Obsidian Black Expansion Data (with constraint updates)
-- ============================================================================
-- This script:
-- 1. Updates check constraints to allow 0-10 scale for churn_risk_score
-- 2. Updates check constraints for health_score, usage_score to 0-100
-- 3. Updates check constraint for nps_score to -100 to +100 (standard NPS range)
-- 4. Inserts Obsidian Black expansion data with proper 0-10 scale values
-- 5. Scales up existing TechFlow data to match new scale
-- ============================================================================

-- Step 1: Drop old check constraints
ALTER TABLE public.customer_properties
DROP CONSTRAINT IF EXISTS customer_properties_churn_risk_score_check;

ALTER TABLE public.customer_properties
DROP CONSTRAINT IF EXISTS customer_properties_health_score_check;

ALTER TABLE public.customer_properties
DROP CONSTRAINT IF EXISTS customer_properties_usage_score_check;

ALTER TABLE public.customer_properties
DROP CONSTRAINT IF EXISTS customer_properties_nps_score_check;

-- Step 2: Add new check constraints (0-10 for churn_risk, 0-100 for scores, -100 to +100 for NPS)
ALTER TABLE public.customer_properties
ADD CONSTRAINT customer_properties_churn_risk_score_check
CHECK (churn_risk_score >= 0 AND churn_risk_score <= 10);

ALTER TABLE public.customer_properties
ADD CONSTRAINT customer_properties_health_score_check
CHECK (health_score >= 0 AND health_score <= 100);

ALTER TABLE public.customer_properties
ADD CONSTRAINT customer_properties_usage_score_check
CHECK (usage_score >= 0 AND usage_score <= 100);

ALTER TABLE public.customer_properties
ADD CONSTRAINT customer_properties_nps_score_check
CHECK (nps_score >= -100 AND nps_score <= 100);

-- Step 3: Update existing TechFlow data to use 0-10 scale for churn_risk
-- (TechFlow had churn_risk_score = 2, which is already on 0-10 scale, so no change needed)

-- Step 4: Delete existing Obsidian Black expansion data
DELETE FROM public.contracts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';
DELETE FROM public.customer_properties WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Step 5: Create Contract for Obsidian Black
INSERT INTO public.contracts (
  customer_id, contract_number, start_date, end_date, arr, seats,
  contract_type, status, auto_renewal, notes, is_demo, created_at, updated_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'OBSBLK-CONTRACT-2024', '2024-01-15', '2026-01-15', 185000.00, 45,
  'subscription', 'active', true,
  'At-risk account with relationship challenges but strong product fit.',
  true, NOW(), NOW()
);

-- Step 6: Create Customer Properties with Expansion Metrics (0-10 scale)
INSERT INTO public.customer_properties (
  customer_id, usage_score, health_score, nps_score, current_arr, revenue_impact_tier, churn_risk_score,
  active_users, license_capacity, utilization_percent, yoy_growth, last_month_growth, peak_usage, adoption_rate,
  market_price_average, market_percentile, price_gap, similar_customer_range, opportunity_value,
  created_at, last_updated
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  72,  -- 7.2/10 usage score (0-100 scale)
  58,  -- 5.8/10 health score (0-100 scale, at-risk)
  65,  -- 6.5/10 NPS score (0-100 scale)
  185000.00,
  4,   -- Tier 4 (high-value, strategic account)
  7,   -- Churn risk 7/10 (0-10 scale, high risk due to relationship issues)
  52,  -- Active users (15% above capacity - showing growth)
  45,  -- License capacity (matching contract seats)
  115, -- 115% utilization (slightly over, indicating need)
  28,  -- 28% YoY growth (healthy growth trend)
  8,   -- 8% last month growth
  58,  -- Peak usage
  87,  -- 87% adoption rate (good product fit)
  10.50, -- Market average: $10.50/seat
  32,    -- They're at 32nd percentile (paying $8.60, below market)
  1.90,  -- $1.90 below market average ($10.50 - $8.60)
  '$9.00 - $12.50',
  '$120K incremental ARR over 2 years',
  NOW(),
  NOW()
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '✅ Check Constraints Updated' as status;

-- Verify constraint changes
SELECT
  '✅ Constraints:' as check,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE 'customer_properties_%_check'
ORDER BY constraint_name;

-- Verify Obsidian Black contract
SELECT
  '✅ Obsidian Black Contract' as check,
  contract_number,
  '$' || arr as arr,
  seats,
  status
FROM public.contracts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Verify Obsidian Black usage metrics (with new 0-10 scale)
SELECT
  '✅ Obsidian Black Usage' as check,
  usage_score,
  health_score,
  churn_risk_score || '/10' as churn_risk,
  active_users,
  license_capacity,
  utilization_percent || '%' as utilization,
  yoy_growth || '%' as yoy_growth
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
-- ✅ Constraints updated: churn_risk_score now accepts 0-10 scale
-- ✅ Obsidian Black expansion data created with proper scale values
-- Contract: $185K ARR, 45 seats ($8.60/seat)
-- Usage: 115% utilization (52 active / 45 capacity), 28% YoY growth
-- Churn Risk: 7/10 (high risk due to relationship issues)
-- Market: 32nd percentile ($1.90 below market average)
-- Expansion Opportunity: $120K incremental over 2 years
-- ============================================================================
