-- Seed data for testing the task system

-- Add sample customers if they don't exist
INSERT INTO public.customers (id, name, industry, tier, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'technology', 'enterprise', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Initech', 'software', 'mid-market', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Risky Corp', 'fintech', 'startup', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'TechStart Inc', 'saas', 'standard', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Global Solutions', 'consulting', 'enterprise', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'StartupXYZ', 'fintech', 'standard', NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Nimbus Analytics', 'analytics', 'premium', NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Venture Partners', 'finance', 'enterprise', NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'Horizon Systems', 'healthcare', 'premium', NOW()),
('550e8400-e29b-41d4-a716-44665544000a', 'Quantum Soft', 'software', 'standard', NOW()),
('550e8400-e29b-41d4-a716-44665544000b', 'Apex Media', 'media', 'standard', NOW()),
('550e8400-e29b-41d4-a716-44665544000c', 'Stellar Networks', 'telecom', 'enterprise', NOW()),
('550e8400-e29b-41d4-a716-44665544000d', 'FusionWare', 'technology', 'premium', NOW()),
('550e8400-e29b-41d4-a716-44665544000e', 'Dynamic Ventures', 'retail', 'standard', NOW()),
('550e8400-e29b-41d4-a716-44665544000f', 'Prime Holdings', 'logistics', 'enterprise', NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'BetaWorks', 'education', 'standard', NOW())
ON CONFLICT (id) DO NOTHING;

-- Add sample customer properties
INSERT INTO public.customer_properties (customer_id, current_arr, revenue_impact_tier, churn_risk_score, health_score) VALUES
('550e8400-e29b-41d4-a716-446655440001', 500000.00, 5, 2, 85),
('550e8400-e29b-41d4-a716-446655440002', 250000.00, 4, 3, 70),
('550e8400-e29b-41d4-a716-446655440003', 75000.00, 2, 5, 45),
('550e8400-e29b-41d4-a716-446655440004', 120000.00, 3, 3, 72),
('550e8400-e29b-41d4-a716-446655440005', 750000.00, 5, 1, 92),
('550e8400-e29b-41d4-a716-446655440006', 85000.00, 2, 6, 35),
('550e8400-e29b-41d4-a716-446655440007', 210000.00, 3, 3, 67),
('550e8400-e29b-41d4-a716-446655440008', 540000.00, 4, 2, 78),
('550e8400-e29b-41d4-a716-446655440009', 305000.00, 3, 4, 55),
('550e8400-e29b-41d4-a716-44665544000a', 190000.00, 3, 2, 82),
('550e8400-e29b-41d4-a716-44665544000b', 150000.00, 3, 3, 64),
('550e8400-e29b-41d4-a716-44665544000c', 620000.00, 5, 1, 88),
('550e8400-e29b-41d4-a716-44665544000d', 97000.00, 2, 4, 58),
('550e8400-e29b-41d4-a716-44665544000e', 130000.00, 2, 5, 49),
('550e8400-e29b-41d4-a716-44665544000f', 410000.00, 4, 2, 83),
('550e8400-e29b-41d4-a716-446655440010', 110000.00, 2, 4, 61)
ON CONFLICT (customer_id) DO UPDATE SET
  current_arr = EXCLUDED.current_arr,
  revenue_impact_tier = EXCLUDED.revenue_impact_tier,
  churn_risk_score = EXCLUDED.churn_risk_score,
  health_score = EXCLUDED.health_score;

-- Add sample renewals
INSERT INTO public.renewals (id, customer_id, renewal_date, current_arr, stage, risk_level) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '30 days', 500000.00, 'discovery', 'medium'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE + INTERVAL '15 days', 250000.00, 'preparation', 'medium'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE + INTERVAL '5 days', 75000.00, 'outreach', 'high'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE + INTERVAL '80 days', 120000.00, 'planning', 'low'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE + INTERVAL '100 days', 750000.00, 'planning', 'low'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', CURRENT_DATE + INTERVAL '40 days', 85000.00, 'negotiation', 'high'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', CURRENT_DATE + INTERVAL '120 days', 210000.00, 'planning', 'medium'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', CURRENT_DATE + INTERVAL '150 days', 540000.00, 'planning', 'medium'),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', CURRENT_DATE + INTERVAL '20 days', 305000.00, 'negotiation', 'high'),
('660e8400-e29b-41d4-a716-44665544000a', '550e8400-e29b-41d4-a716-44665544000a', CURRENT_DATE + INTERVAL '70 days', 190000.00, 'planning', 'low'),
('660e8400-e29b-41d4-a716-44665544000b', '550e8400-e29b-41d4-a716-44665544000b', CURRENT_DATE + INTERVAL '60 days', 150000.00, 'preparation', 'medium'),
('660e8400-e29b-41d4-a716-44665544000c', '550e8400-e29b-41d4-a716-44665544000c', CURRENT_DATE + INTERVAL '90 days', 620000.00, 'planning', 'low'),
('660e8400-e29b-41d4-a716-44665544000d', '550e8400-e29b-41d4-a716-44665544000d', CURRENT_DATE + INTERVAL '25 days', 97000.00, 'outreach', 'medium'),
('660e8400-e29b-41d4-a716-44665544000e', '550e8400-e29b-41d4-a716-44665544000e', CURRENT_DATE + INTERVAL '110 days', 130000.00, 'planning', 'medium'),
('660e8400-e29b-41d4-a716-44665544000f', '550e8400-e29b-41d4-a716-44665544000f', CURRENT_DATE + INTERVAL '130 days', 410000.00, 'planning', 'low'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', CURRENT_DATE + INTERVAL '75 days', 110000.00, 'negotiation', 'medium')
ON CONFLICT (id) DO NOTHING;

-- Generate tasks for the renewals
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440001');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440002');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440003');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440004');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440005');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440006');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440007');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440008');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440009');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-44665544000a');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-44665544000b');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-44665544000c');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-44665544000d');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-44665544000e');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-44665544000f');
SELECT public.generate_renewal_tasks('660e8400-e29b-41d4-a716-446655440010');

-- Update action scores
SELECT public.update_action_scores(); 