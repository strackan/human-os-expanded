-- ============================================================================
-- Seed TechFlow Industries Expansion Data
-- Purpose: Add customer, contract, and usage data for expansion opportunity workflow
-- Phase: 2B.1 (Data Extraction)
-- ============================================================================

DO $$
DECLARE
  v_techflow_customer_id UUID := '550e8400-e29b-41d4-a716-446655440002'; -- Different from Obsidian Black
  v_techflow_contract_id UUID;
BEGIN

-- ============================================================================
-- 1. TECHFLOW CUSTOMER
-- ============================================================================

INSERT INTO public.customers (
  id,
  name,
  domain,
  industry,
  health_score,
  current_arr,
  renewal_date,
  is_demo,
  created_at,
  updated_at
)
VALUES (
  v_techflow_customer_id,
  'TechFlow Industries',
  'techflow.io',
  'Technology & Software Development',
  82,  -- 8.2/10 - healthy, growing customer
  78000.00,  -- $78K ARR (current)
  '2025-09-15',
  true,  -- is_demo flag
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  health_score = 82,
  current_arr = 78000.00,
  renewal_date = '2025-09-15',
  is_demo = true,
  updated_at = NOW();

RAISE NOTICE 'TechFlow customer created/updated: %', v_techflow_customer_id;

-- ============================================================================
-- 2. CUSTOMER PROPERTIES (Usage & Market Data)
-- ============================================================================

INSERT INTO public.customer_properties (
  customer_id,
  usage_score,
  health_score,
  nps_score,
  current_arr,
  revenue_impact_tier,
  churn_risk_score,
  -- Usage metrics
  active_users,
  license_capacity,
  utilization_percent,
  yoy_growth,
  last_month_growth,
  peak_usage,
  adoption_rate,
  -- Market data
  market_price_average,
  market_percentile,
  price_gap,
  similar_customer_range,
  opportunity_value,
  created_at,
  last_updated
)
VALUES (
  v_techflow_customer_id,
  88,  -- 8.8/10 usage (high engagement)
  82,  -- 8.2/10 health
  75,  -- 7.5/10 NPS (satisfied)
  78000.00,
  3,  -- Tier 3 (mid-market, potential for growth)
  2,  -- Churn risk 2/5 (low - happy customer)
  -- Usage metrics (showing overutilization = expansion opportunity)
  140,  -- Active users (40% over capacity!)
  100,  -- License capacity
  140,  -- 140% utilization
  47,   -- 47% YoY growth
  12,   -- 12% last month growth
  152,  -- Peak usage
  94,   -- 94% adoption rate
  -- Market data
  10.20,  -- Market average: $10.20/seat
  18,     -- They're at 18th percentile (paying way below market)
  3.70,   -- $3.70 below market average
  '$8.50 - $12.00',
  '$290K over 3 years',
  NOW(),
  NOW()
)
ON CONFLICT (customer_id) DO UPDATE SET
  usage_score = 88,
  health_score = 82,
  nps_score = 75,
  current_arr = 78000.00,
  revenue_impact_tier = 3,
  churn_risk_score = 2,
  active_users = 140,
  license_capacity = 100,
  utilization_percent = 140,
  yoy_growth = 47,
  last_month_growth = 12,
  peak_usage = 152,
  adoption_rate = 94,
  market_price_average = 10.20,
  market_percentile = 18,
  price_gap = 3.70,
  similar_customer_range = '$8.50 - $12.00',
  opportunity_value = '$290K over 3 years',
  last_updated = NOW();

RAISE NOTICE 'TechFlow customer properties created/updated';

-- ============================================================================
-- 3. CONTRACT
-- ============================================================================

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
  v_techflow_customer_id,
  'TECHFLOW-CONTRACT-2023',
  '2023-09-15',
  '2025-09-15',
  78000.00,  -- $78K ARR ($6.50/seat * 100 * 12)
  100,  -- 100 seats (but 140 active users!)
  'subscription',
  'active',
  true,  -- Auto-renewal enabled
  '2-year contract, growing fast, excellent relationship, prime expansion candidate',
  true,  -- is_demo flag
  NOW(),
  NOW()
)
RETURNING id INTO v_techflow_contract_id;

RAISE NOTICE 'TechFlow contract created: %', v_techflow_contract_id;

-- ============================================================================
-- 4. PRIMARY CONTACT
-- ============================================================================

INSERT INTO public.contacts (
  customer_id,
  first_name,
  last_name,
  email,
  phone,
  title,
  is_primary,
  is_demo,
  relationship_strength,
  communication_style,
  key_concerns,
  leverage_points,
  recent_interactions,
  relationship_notes,
  created_at,
  updated_at
)
VALUES (
  v_techflow_customer_id,
  'Sarah',
  'Chen',
  'sarah.chen@techflow.io',
  '+1 (555) 0200',
  'VP of Engineering',
  true,  -- Primary contact
  true,  -- is_demo flag
  'strong',
  'Data-driven, appreciates proactive outreach, values partnership and transparency. Responsive and collaborative.',
  '[
    "Needs more capacity immediately - team is growing fast",
    "Budget approval process can be lengthy",
    "Wants to ensure pricing is fair and competitive"
  ]'::jsonb,
  '[
    "Loves the product - high NPS score",
    "Strong historical relationship and trust",
    "Actively hiring and expanding team",
    "Values our proactive approach"
  ]'::jsonb,
  'Last check-in 2 weeks ago. Mentioned team growth and expressed interest in capacity planning discussion. Very positive tone.',
  'Excellent relationship. Perfect candidate for proactive expansion outreach. Strong advocate internally.',
  NOW(),
  NOW()
);

RAISE NOTICE 'Sarah Chen (primary contact) created';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show what was created
SELECT 'TechFlow Customer:' as section, name, current_arr, health_score, renewal_date, is_demo
FROM customers
WHERE name = 'TechFlow Industries';

SELECT 'Usage Metrics:' as section,
  active_users,
  license_capacity,
  utilization_percent || '%' as utilization,
  yoy_growth || '%' as yoy_growth
FROM customer_properties
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002';

SELECT 'Market Data:' as section,
  market_price_average,
  market_percentile,
  price_gap,
  similar_customer_range,
  opportunity_value
FROM customer_properties
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002';

SELECT 'Contract:' as section, contract_number, arr, seats, start_date, end_date, auto_renewal
FROM contracts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002';

SELECT 'Primary Contact:' as section,
  first_name || ' ' || last_name as name,
  title,
  email,
  relationship_strength
FROM contacts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002';

-- ============================================================================
-- SEEDING COMPLETE
-- ============================================================================
RAISE NOTICE '✅ TechFlow Industries Expansion Data Seeding Complete!';
RAISE NOTICE 'Customer ID: 550e8400-e29b-41d4-a716-446655440002';
RAISE NOTICE 'ARR: $78,000 (current), Expansion opportunity: $290K over 3 years';
RAISE NOTICE 'Utilization: 140%% (40%% over capacity)';
RAISE NOTICE 'Pricing: 18th percentile ($3.70 below market average)';
