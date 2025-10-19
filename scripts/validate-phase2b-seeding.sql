-- ============================================================================
-- Phase 2B Database Seeding Validation (SQL Version)
-- Run this directly in Supabase SQL Editor to verify seeding
-- ============================================================================

-- Check 1: TechFlow Customer
SELECT
  '✅ Check 1: TechFlow Customer' as status,
  name,
  domain,
  health_score,
  current_arr,
  is_demo
FROM public.customers
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- Check 2: TechFlow Usage Metrics
SELECT
  '✅ Check 2: TechFlow Usage Metrics' as status,
  active_users,
  license_capacity,
  utilization_percent,
  yoy_growth,
  adoption_rate
FROM public.customer_properties
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002';

-- Check 3: TechFlow Market Data
SELECT
  '✅ Check 3: TechFlow Market Data' as status,
  market_price_average,
  market_percentile,
  price_gap,
  similar_customer_range,
  opportunity_value
FROM public.customer_properties
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002';

-- Check 4: TechFlow Contract
SELECT
  '✅ Check 4: TechFlow Contract' as status,
  contract_number,
  arr,
  seats,
  status,
  auto_renewal
FROM public.contracts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002';

-- Check 5: TechFlow Contact
SELECT
  '✅ Check 5: TechFlow Contact (Sarah Chen)' as status,
  first_name || ' ' || last_name as name,
  email,
  title,
  is_primary,
  relationship_strength,
  jsonb_array_length(key_concerns) as concerns_count,
  jsonb_array_length(leverage_points) as leverage_count
FROM public.contacts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002';

-- Check 6: Obsidian Black Contacts
SELECT
  '✅ Check 6: Obsidian Black Contacts (Marcus & Elena)' as status,
  first_name || ' ' || last_name as name,
  title,
  relationship_strength,
  jsonb_array_length(key_concerns) as concerns_count,
  jsonb_array_length(leverage_points) as leverage_count,
  CASE WHEN recent_interactions IS NOT NULL THEN 'Yes' ELSE 'No' END as has_interactions
FROM public.contacts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY is_primary DESC;

-- Check 7: Summary
SELECT
  '✅ Check 7: Summary' as status,
  (SELECT COUNT(*) FROM customers WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002')) as total_customers,
  (SELECT COUNT(*) FROM contacts WHERE customer_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002')) as total_contacts,
  (SELECT COUNT(*) FROM contracts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002') as techflow_contracts;

-- Expected Results Summary
SELECT
  '📊 Expected vs Actual' as validation,
  'TechFlow Customer' as item,
  '1' as expected,
  (SELECT COUNT(*)::text FROM customers WHERE id = '550e8400-e29b-41d4-a716-446655440002') as actual,
  CASE WHEN (SELECT COUNT(*) FROM customers WHERE id = '550e8400-e29b-41d4-a716-446655440002') = 1 THEN '✅ PASS' ELSE '❌ FAIL' END as result
UNION ALL
SELECT
  '📊 Expected vs Actual',
  'TechFlow utilization_percent',
  '140',
  (SELECT utilization_percent::text FROM customer_properties WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002'),
  CASE WHEN (SELECT utilization_percent FROM customer_properties WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002') = 140 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT
  '📊 Expected vs Actual',
  'TechFlow market_percentile',
  '18',
  (SELECT market_percentile::text FROM customer_properties WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002'),
  CASE WHEN (SELECT market_percentile FROM customer_properties WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002') = 18 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT
  '📊 Expected vs Actual',
  'TechFlow Contract',
  '1',
  (SELECT COUNT(*)::text FROM contracts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002'),
  CASE WHEN (SELECT COUNT(*) FROM contracts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002') = 1 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT
  '📊 Expected vs Actual',
  'Sarah Chen contact',
  '1',
  (SELECT COUNT(*)::text FROM contacts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002' AND first_name = 'Sarah'),
  CASE WHEN (SELECT COUNT(*) FROM contacts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440002' AND first_name = 'Sarah') = 1 THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT
  '📊 Expected vs Actual',
  'Marcus relationship_strength',
  'weak',
  (SELECT relationship_strength FROM contacts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001' AND first_name = 'Marcus'),
  CASE WHEN (SELECT relationship_strength FROM contacts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001' AND first_name = 'Marcus') = 'weak' THEN '✅ PASS' ELSE '❌ FAIL' END
UNION ALL
SELECT
  '📊 Expected vs Actual',
  'Elena relationship_strength',
  'moderate',
  (SELECT relationship_strength FROM contacts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001' AND first_name = 'Elena'),
  CASE WHEN (SELECT relationship_strength FROM contacts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001' AND first_name = 'Elena') = 'moderate' THEN '✅ PASS' ELSE '❌ FAIL' END;
