-- Consolidated seed data for public schema (migrated from MVP)
-- This replaces both the old public seed data and incorporates MVP data

-- Clear existing data to ensure clean seed
TRUNCATE TABLE public.notes CASCADE;
TRUNCATE TABLE public.tasks CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.renewals CASCADE;
TRUNCATE TABLE public.contracts CASCADE;
TRUNCATE TABLE public.alerts CASCADE;
TRUNCATE TABLE public.contacts CASCADE;
TRUNCATE TABLE public.customers CASCADE;

-- Insert customers (migrated from MVP schema with updated structure)
INSERT INTO public.customers (id, name, domain, industry, health_score, current_arr, renewal_date, assigned_to, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'ACME Corporation', 'acme.com', 'Technology', 85, 250000, '2024-12-31', NULL, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'Initech', 'initech.com', 'Financial Services', 72, 180000, '2024-11-15', NULL, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'Risky Corp', 'riskycorp.com', 'Healthcare', 45, 95000, '2024-10-20', NULL, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440013', 'TechVision', 'techvision.com', 'Manufacturing', 68, 120000, '2024-09-30', NULL, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'DataOne Solutions', 'dataone.com', 'Technology', 92, 320000, '2024-08-15', NULL, NOW(), NOW());

-- Insert contacts (migrated from MVP schema)
INSERT INTO public.contacts (id, first_name, last_name, email, phone, title, company_id, is_primary, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'John', 'Smith', 'john.smith@acme.com', '+1-555-0101', 'CTO', '550e8400-e29b-41d4-a716-446655440010', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440102', 'Sarah', 'Johnson', 'sarah.johnson@initech.com', '+1-555-0102', 'VP Engineering', '550e8400-e29b-41d4-a716-446655440011', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440103', 'Michael', 'Chen', 'michael.chen@riskycorp.com', '+1-555-0103', 'IT Director', '550e8400-e29b-41d4-a716-446655440012', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440104', 'Emily', 'Davis', 'emily.davis@techvision.com', '+1-555-0104', 'Operations Manager', '550e8400-e29b-41d4-a716-446655440013', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440105', 'David', 'Wilson', 'david.wilson@dataone.com', '+1-555-0105', 'VP Technology', '550e8400-e29b-41d4-a716-446655440014', true, NOW(), NOW());

-- Update customers with primary_contact_id
UPDATE public.customers SET primary_contact_id = '550e8400-e29b-41d4-a716-446655440101' WHERE id = '550e8400-e29b-41d4-a716-446655440010';
UPDATE public.customers SET primary_contact_id = '550e8400-e29b-41d4-a716-446655440102' WHERE id = '550e8400-e29b-41d4-a716-446655440011';
UPDATE public.customers SET primary_contact_id = '550e8400-e29b-41d4-a716-446655440103' WHERE id = '550e8400-e29b-41d4-a716-446655440012';
UPDATE public.customers SET primary_contact_id = '550e8400-e29b-41d4-a716-446655440104' WHERE id = '550e8400-e29b-41d4-a716-446655440013';
UPDATE public.customers SET primary_contact_id = '550e8400-e29b-41d4-a716-446655440105' WHERE id = '550e8400-e29b-41d4-a716-446655440014';

-- Insert renewals (migrated from MVP schema)
INSERT INTO public.renewals (id, customer_id, renewal_date, current_arr, proposed_arr, probability, stage, risk_level, assigned_to, notes, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '2024-12-31', 250000, 275000, 85, 'negotiation', 'low', NULL, 'Customer is very satisfied with current service level. Discussed expansion opportunities for Q2.', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '2024-11-15', 180000, 198000, 70, 'discovery', 'medium', NULL, 'Customer expressed concerns about pricing. Need to prepare competitive analysis.', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', '2024-10-20', 95000, 104500, 40, 'at_risk', 'high', NULL, 'Customer experiencing some challenges with adoption. Recommend additional training.', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', '2024-09-30', 120000, 132000, 60, 'discovery', 'medium', NULL, 'Customer was impressed with new features. Interested in early access program.', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', '2024-08-15', 320000, 352000, 90, 'negotiation', 'low', NULL, 'Customer has ambitious growth plans. Need to align our roadmap with their objectives.', NOW(), NOW());

-- Insert tasks (migrated from MVP schema)
INSERT INTO public.tasks (id, renewal_id, customer_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'QBR Preparation', 'Prepare quarterly business review materials', 'in_progress', 'high', NULL, NOW() + INTERVAL '7 days', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', 'Contract Review', 'Review and negotiate renewal terms', 'pending', 'medium', NULL, NOW() + INTERVAL '14 days', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'Risk Assessment', 'Conduct customer health assessment', 'pending', 'high', NULL, NOW() + INTERVAL '3 days', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', 'Feature Demo', 'Demonstrate new product features', 'completed', 'low', NULL, NOW() - INTERVAL '2 days', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', 'Success Planning', 'Develop customer success plan', 'in_progress', 'medium', NULL, NOW() + INTERVAL '21 days', NOW(), NOW());

-- Insert events (migrated from MVP schema)
INSERT INTO public.events (id, title, description, event_type, customer_id, user_id, event_date, status, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'QBR Meeting', 'Quarterly business review with executive team', 'meeting', '550e8400-e29b-41d4-a716-446655440010', NULL, NOW() + INTERVAL '7 days', 'scheduled', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440041', 'Renewal Discussion', 'Discuss renewal terms and pricing', 'call', '550e8400-e29b-41d4-a716-446655440011', NULL, NOW() + INTERVAL '14 days', 'scheduled', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440042', 'Health Check', 'Customer health assessment meeting', 'meeting', '550e8400-e29b-41d4-a716-446655440012', NULL, NOW() + INTERVAL '3 days', 'scheduled', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440043', 'Product Demo', 'Demonstrate new features and capabilities', 'demo', '550e8400-e29b-41d4-a716-446655440013', NULL, NOW() - INTERVAL '2 days', 'completed', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440044', 'Success Planning', 'Customer success planning workshop', 'workshop', '550e8400-e29b-41d4-a716-446655440014', NULL, NOW() + INTERVAL '21 days', 'scheduled', NOW(), NOW());

-- Insert notes (migrated from MVP schema)
INSERT INTO public.notes (id, customer_id, renewal_id, user_id, content, note_type, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020', NULL, 'Customer is very satisfied with current service level. Discussed expansion opportunities for Q2.', 'meeting', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440021', NULL, 'Customer expressed concerns about pricing. Need to prepare competitive analysis.', 'call', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440022', NULL, 'Customer experiencing some challenges with adoption. Recommend additional training.', 'risk', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440023', NULL, 'Customer was impressed with new features. Interested in early access program.', 'general', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440024', NULL, 'Customer has ambitious growth plans. Need to align our roadmap with their objectives.', 'general', NOW(), NOW()); 