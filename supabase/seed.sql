-- Seed data for testing the task system

-- Add sample customers if they don't exist
INSERT INTO public.customers (id, name, industry, tier, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'technology', 'enterprise', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Initech', 'software', 'mid-market', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Risky Corp', 'fintech', 'startup', NOW())
ON CONFLICT (id) DO NOTHING;

-- Add sample customer properties
INSERT INTO public.customer_properties (customer_id, current_arr, revenue_impact_tier, churn_risk_score, health_score) VALUES
('550e8400-e29b-41d4-a716-446655440001', 500000.00, 5, 2, 85),
('550e8400-e29b-41d4-a716-446655440002', 250000.00, 4, 3, 70),
('550e8400-e29b-41d4-a716-446655440003', 75000.00, 2, 5, 45)
ON CONFLICT (customer_id) DO UPDATE SET
  current_arr = EXCLUDED.current_arr,
  revenue_impact_tier = EXCLUDED.revenue_impact_tier,
  churn_risk_score = EXCLUDED.churn_risk_score,
  health_score = EXCLUDED.health_score;

-- Add sample renewals
INSERT INTO public.renewals (id, customer_id, renewal_date, current_arr, stage, risk_level) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '30 days', 500000.00, 'discovery', 'medium'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE + INTERVAL '15 days', 250000.00, 'preparation', 'medium'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE + INTERVAL '5 days', 75000.00, 'outreach', 'high')
ON CONFLICT (id) DO NOTHING;

-- Generate tasks for the renewals
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440001');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440002');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440003');

-- Update action scores
SELECT public.update_action_scores(); 