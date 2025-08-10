-- Consolidated seed data for public schema
-- This uses the consolidated public schema with all 15 customers from mockCustomers

-- Clear existing data to ensure clean seed
TRUNCATE TABLE public.notes CASCADE;
TRUNCATE TABLE public.tasks CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.renewals CASCADE;
TRUNCATE TABLE public.contracts CASCADE;
TRUNCATE TABLE public.alerts CASCADE;
TRUNCATE TABLE public.contacts CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.customer_properties CASCADE;

-- Insert customers from mockCustomers data into public schema
INSERT INTO public.customers (id, name, domain, industry, health_score, current_arr, renewal_date, primary_contact_name, primary_contact_email, created_at, updated_at) VALUES
-- Customer 1: Acme Corporation
('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'acmecorp.com', 'Technology', 85, 450000, '2024-08-15', 'John Smith', 'john.smith@acmecorp.com', NOW(), NOW()),
-- Customer 2: RiskyCorp
('550e8400-e29b-41d4-a716-446655440002', 'RiskyCorp', 'riskycorp.com', 'Manufacturing', 45, 380000, '2024-07-30', 'Sarah Johnson', 'sarah.johnson@riskycorp.com', NOW(), NOW()),
-- Customer 3: TechStart Inc
('550e8400-e29b-41d4-a716-446655440003', 'TechStart Inc', 'techstart.com', 'SaaS', 72, 120000, '2024-09-20', 'Michael Chen', 'michael.chen@techstart.com', NOW(), NOW()),
-- Customer 4: Global Solutions
('550e8400-e29b-41d4-a716-446655440004', 'Global Solutions', 'globalsolutions.com', 'Consulting', 92, 750000, '2024-10-05', 'Emily Davis', 'emily.davis@globalsolutions.com', NOW(), NOW()),
-- Customer 5: StartupXYZ
('550e8400-e29b-41d4-a716-446655440005', 'StartupXYZ', 'startupxyz.com', 'Fintech', 35, 85000, '2024-07-15', 'David Wilson', 'david.wilson@startupxyz.com', NOW(), NOW()),
-- Customer 6: Nimbus Analytics
('550e8400-e29b-41d4-a716-446655440006', 'Nimbus Analytics', 'nimbusanalytics.com', 'Analytics', 67, 210000, '2024-11-12', 'Lisa Rodriguez', 'lisa.rodriguez@nimbusanalytics.com', NOW(), NOW()),
-- Customer 7: Venture Partners
('550e8400-e29b-41d4-a716-446655440007', 'Venture Partners', 'venturepartners.com', 'Finance', 78, 540000, '2024-12-01', 'Robert Taylor', 'robert.taylor@venturepartners.com', NOW(), NOW()),
-- Customer 8: Horizon Systems
('550e8400-e29b-41d4-a716-446655440008', 'Horizon Systems', 'horizonsystems.com', 'Healthcare', 55, 305000, '2024-06-25', 'Jennifer Brown', 'jennifer.brown@horizonsystems.com', NOW(), NOW()),
-- Customer 9: Quantum Soft
('550e8400-e29b-41d4-a716-446655440009', 'Quantum Soft', 'quantumsoft.com', 'Software', 82, 190000, '2024-09-10', 'Mark Anderson', 'mark.anderson@quantumsoft.com', NOW(), NOW()),
-- Customer 10: Apex Media
('550e8400-e29b-41d4-a716-446655440010', 'Apex Media', 'apexmedia.com', 'Media', 64, 150000, '2024-08-05', 'Amanda White', 'amanda.white@apexmedia.com', NOW(), NOW()),
-- Customer 11: Stellar Networks
('550e8400-e29b-41d4-a716-446655440011', 'Stellar Networks', 'stellarnetworks.com', 'Telecom', 88, 620000, '2024-10-22', 'Chris Martinez', 'chris.martinez@stellarnetworks.com', NOW(), NOW()),
-- Customer 12: FusionWare
('550e8400-e29b-41d4-a716-446655440012', 'FusionWare', 'fusionware.com', 'Technology', 58, 97000, '2024-07-08', 'Nicole Garcia', 'nicole.garcia@fusionware.com', NOW(), NOW()),
-- Customer 13: Dynamic Ventures
('550e8400-e29b-41d4-a716-446655440013', 'Dynamic Ventures', 'dynamicventures.com', 'Retail', 49, 130000, '2024-11-30', 'Kevin Lee', 'kevin.lee@dynamicventures.com', NOW(), NOW()),
-- Customer 14: Prime Holdings
('550e8400-e29b-41d4-a716-446655440014', 'Prime Holdings', 'primeholdings.com', 'Logistics', 83, 410000, '2024-12-15', 'Rachel Kim', 'rachel.kim@primeholdings.com', NOW(), NOW()),
-- Customer 15: BetaWorks
('550e8400-e29b-41d4-a716-446655440015', 'BetaWorks', 'betaworks.com', 'Education', 61, 110000, '2024-09-05', 'Thomas Jackson', 'thomas.jackson@betaworks.com', NOW(), NOW());

-- Insert customer properties for additional fields (tier, usage, nps_score) from mockCustomers
INSERT INTO public.customer_properties (customer_id, usage_score, health_score, nps_score, current_arr, created_at, last_updated) VALUES
-- Customer 1: Acme Corporation (enterprise, usage: 92, nps: 45)
('550e8400-e29b-41d4-a716-446655440001', 92, 85, 45, 450000, NOW(), NOW()),
-- Customer 2: RiskyCorp (premium, usage: 65, nps: -10)
('550e8400-e29b-41d4-a716-446655440002', 65, 45, -10, 380000, NOW(), NOW()),
-- Customer 3: TechStart Inc (standard, usage: 70, nps: 30)
('550e8400-e29b-41d4-a716-446655440003', 70, 72, 30, 120000, NOW(), NOW()),
-- Customer 4: Global Solutions (enterprise, usage: 88, nps: 60)
('550e8400-e29b-41d4-a716-446655440004', 88, 92, 60, 750000, NOW(), NOW()),
-- Customer 5: StartupXYZ (standard, usage: 50, nps: -20)
('550e8400-e29b-41d4-a716-446655440005', 50, 35, -20, 85000, NOW(), NOW()),
-- Customer 6: Nimbus Analytics (premium, usage: 80, nps: 25)
('550e8400-e29b-41d4-a716-446655440006', 80, 67, 25, 210000, NOW(), NOW()),
-- Customer 7: Venture Partners (enterprise, usage: 74, nps: 15)
('550e8400-e29b-41d4-a716-446655440007', 74, 78, 15, 540000, NOW(), NOW()),
-- Customer 8: Horizon Systems (premium, usage: 60, nps: 5)
('550e8400-e29b-41d4-a716-446655440008', 60, 55, 5, 305000, NOW(), NOW()),
-- Customer 9: Quantum Soft (standard, usage: 85, nps: 40)
('550e8400-e29b-41d4-a716-446655440009', 85, 82, 40, 190000, NOW(), NOW()),
-- Customer 10: Apex Media (standard, usage: 77, nps: 20)
('550e8400-e29b-41d4-a716-446655440010', 77, 64, 20, 150000, NOW(), NOW()),
-- Customer 11: Stellar Networks (enterprise, usage: 91, nps: 55)
('550e8400-e29b-41d4-a716-446655440011', 91, 88, 55, 620000, NOW(), NOW()),
-- Customer 12: FusionWare (premium, usage: 63, nps: 10)
('550e8400-e29b-41d4-a716-446655440012', 63, 58, 10, 97000, NOW(), NOW()),
-- Customer 13: Dynamic Ventures (standard, usage: 57, nps: -5)
('550e8400-e29b-41d4-a716-446655440013', 57, 49, -5, 130000, NOW(), NOW()),
-- Customer 14: Prime Holdings (enterprise, usage: 86, nps: 35)
('550e8400-e29b-41d4-a716-446655440014', 86, 83, 35, 410000, NOW(), NOW()),
-- Customer 15: BetaWorks (standard, usage: 72, nps: 18)
('550e8400-e29b-41d4-a716-446655440015', 72, 61, 18, 110000, NOW(), NOW());

-- Store tier information in a separate table or as metadata
-- Note: The tier information (enterprise, premium, standard) could be added to customer_properties 
-- or stored as a separate field if needed by the application

-- Insert contacts for all 15 customers
INSERT INTO public.contacts (id, first_name, last_name, email, phone, title, customer_id, is_primary, created_at, updated_at) VALUES
-- Contact 1: John Smith - Acme Corporation
('550e8400-e29b-41d4-a716-446655440101', 'John', 'Smith', 'john.smith@acmecorp.com', '+1-555-0101', 'CTO', '550e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW()),
-- Contact 2: Sarah Johnson - RiskyCorp
('550e8400-e29b-41d4-a716-446655440102', 'Sarah', 'Johnson', 'sarah.johnson@riskycorp.com', '+1-555-0102', 'VP Operations', '550e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW()),
-- Contact 3: Michael Chen - TechStart Inc
('550e8400-e29b-41d4-a716-446655440103', 'Michael', 'Chen', 'michael.chen@techstart.com', '+1-555-0103', 'Product Manager', '550e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW()),
-- Contact 4: Emily Davis - Global Solutions
('550e8400-e29b-41d4-a716-446655440104', 'Emily', 'Davis', 'emily.davis@globalsolutions.com', '+1-555-0104', 'CEO', '550e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW()),
-- Contact 5: David Wilson - StartupXYZ
('550e8400-e29b-41d4-a716-446655440105', 'David', 'Wilson', 'david.wilson@startupxyz.com', '+1-555-0105', 'CTO', '550e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW()),
-- Contact 6: Lisa Rodriguez - Nimbus Analytics
('550e8400-e29b-41d4-a716-446655440106', 'Lisa', 'Rodriguez', 'lisa.rodriguez@nimbusanalytics.com', '+1-555-0106', 'Head of Analytics', '550e8400-e29b-41d4-a716-446655440006', true, NOW(), NOW()),
-- Contact 7: Robert Taylor - Venture Partners
('550e8400-e29b-41d4-a716-446655440107', 'Robert', 'Taylor', 'robert.taylor@venturepartners.com', '+1-555-0107', 'Managing Partner', '550e8400-e29b-41d4-a716-446655440007', true, NOW(), NOW()),
-- Contact 8: Jennifer Brown - Horizon Systems
('550e8400-e29b-41d4-a716-446655440108', 'Jennifer', 'Brown', 'jennifer.brown@horizonsystems.com', '+1-555-0108', 'VP Technology', '550e8400-e29b-41d4-a716-446655440008', true, NOW(), NOW()),
-- Contact 9: Mark Anderson - Quantum Soft
('550e8400-e29b-41d4-a716-446655440109', 'Mark', 'Anderson', 'mark.anderson@quantumsoft.com', '+1-555-0109', 'Lead Developer', '550e8400-e29b-41d4-a716-446655440009', true, NOW(), NOW()),
-- Contact 10: Amanda White - Apex Media
('550e8400-e29b-41d4-a716-446655440110', 'Amanda', 'White', 'amanda.white@apexmedia.com', '+1-555-0110', 'Creative Director', '550e8400-e29b-41d4-a716-446655440010', true, NOW(), NOW()),
-- Contact 11: Chris Martinez - Stellar Networks
('550e8400-e29b-41d4-a716-446655440111', 'Chris', 'Martinez', 'chris.martinez@stellarnetworks.com', '+1-555-0111', 'Network Engineer', '550e8400-e29b-41d4-a716-446655440011', true, NOW(), NOW()),
-- Contact 12: Nicole Garcia - FusionWare
('550e8400-e29b-41d4-a716-446655440112', 'Nicole', 'Garcia', 'nicole.garcia@fusionware.com', '+1-555-0112', 'Product Owner', '550e8400-e29b-41d4-a716-446655440012', true, NOW(), NOW()),
-- Contact 13: Kevin Lee - Dynamic Ventures
('550e8400-e29b-41d4-a716-446655440113', 'Kevin', 'Lee', 'kevin.lee@dynamicventures.com', '+1-555-0113', 'VP Sales', '550e8400-e29b-41d4-a716-446655440013', true, NOW(), NOW()),
-- Contact 14: Rachel Kim - Prime Holdings
('550e8400-e29b-41d4-a716-446655440114', 'Rachel', 'Kim', 'rachel.kim@primeholdings.com', '+1-555-0114', 'Operations Director', '550e8400-e29b-41d4-a716-446655440014', true, NOW(), NOW()),
-- Contact 15: Thomas Jackson - BetaWorks
('550e8400-e29b-41d4-a716-446655440115', 'Thomas', 'Jackson', 'thomas.jackson@betaworks.com', '+1-555-0115', 'Education Lead', '550e8400-e29b-41d4-a716-446655440015', true, NOW(), NOW());

-- Note: We no longer need to update primary_contact_id since we removed that column
-- The primary contact relationship is now handled through contacts.is_primary = true

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