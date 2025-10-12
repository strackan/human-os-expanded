-- ============================================================================
-- Obsidian Black Demo Data Seeding Script
-- Purpose: Seed Obsidian Black demo data for Act 1
--
-- DATA SPECIFICATION (PM Approved Oct 11, 2025):
-- - ARR: $185,000 (realistic mid-market)
-- - Health Score: 6.4/10 (moderate risk)
-- - Churn Probability: 42%
-- - Operation Blackout: $85K loss
-- ============================================================================

-- Use fixed UUID for Obsidian Black customer (makes it easy to reference)
DO $$
DECLARE
  v_aco_customer_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  v_marcus_contact_id UUID;
  v_elena_contact_id UUID;
  v_aco_contract_id UUID;
  v_aco_renewal_id UUID;
BEGIN

-- ============================================================================
-- 1. ACO CUSTOMER
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
  v_aco_customer_id,
  'Obsidian Black',
  'obsidianblack.ops',
  'Global Strategic Coordination Services',
  64,  -- 6.4/10 stored as integer (display as 6.4)
  185000.00,  -- $185K ARR
  '2026-04-15',
  true,  -- is_demo flag
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  health_score = 64,
  current_arr = 185000.00,
  renewal_date = '2026-04-15',
  is_demo = true,
  updated_at = NOW();

RAISE NOTICE 'ACO Customer created/updated: %', v_aco_customer_id;

-- ============================================================================
-- 2. CUSTOMER PROPERTIES (for advanced scoring)
-- ============================================================================

INSERT INTO public.customer_properties (
  customer_id,
  usage_score,
  health_score,
  nps_score,
  current_arr,
  revenue_impact_tier,
  churn_risk_score,
  created_at,
  last_updated
)
VALUES (
  v_aco_customer_id,
  72,  -- 7.2/10 usage
  64,  -- 6.4/10 health
  51,  -- 5.1/10 NPS
  185000.00,
  3,  -- Tier 3 (mid-market)
  4,  -- Churn risk 4/5 (moderate-high)
  NOW(),
  NOW()
)
ON CONFLICT (customer_id) DO UPDATE SET
  usage_score = 72,
  health_score = 64,
  nps_score = 51,
  current_arr = 185000.00,
  revenue_impact_tier = 3,
  churn_risk_score = 4,
  last_updated = NOW();

-- ============================================================================
-- 3. CONTACTS (Marcus & Elena)
-- ============================================================================

-- Marcus Castellan (Primary Contact - COO, frustrated)
INSERT INTO public.contacts (
  customer_id,
  first_name,
  last_name,
  email,
  phone,
  title,
  is_primary,
  is_demo,
  created_at,
  updated_at
)
VALUES (
  v_aco_customer_id,
  'Marcus',
  'Castellan',
  'marcus.castellan@obsidianblack.ops',
  '+1 (555) 0100',
  'Chief Operating Officer',
  true,  -- Primary contact
  true,  -- is_demo flag
  NOW(),
  NOW()
)
RETURNING id INTO v_marcus_contact_id;

RAISE NOTICE 'Marcus Castellan created: %', v_marcus_contact_id;

-- Dr. Elena Voss (Secondary - VP Tech Ops, evaluating competitors)
INSERT INTO public.contacts (
  customer_id,
  first_name,
  last_name,
  email,
  phone,
  title,
  is_primary,
  is_demo,
  created_at,
  updated_at
)
VALUES (
  v_aco_customer_id,
  'Elena',
  'Voss',
  'elena.voss@obsidianblack.ops',
  '+1 (555) 0101',
  'VP of Technical Operations',
  false,  -- Secondary contact
  true,   -- is_demo flag
  NOW(),
  NOW()
)
RETURNING id INTO v_elena_contact_id;

RAISE NOTICE 'Dr. Elena Voss created: %', v_elena_contact_id;

-- Update customer with primary contact
UPDATE public.customers
SET primary_contact_name = 'Marcus Castellan',
    primary_contact_email = 'marcus.castellan@obsidianblack.ops',
    updated_at = NOW()
WHERE id = v_aco_customer_id;

-- ============================================================================
-- 4. CONTRACT
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
  v_aco_customer_id,
  'ACO-CONTRACT-2023',
  '2023-04-15',
  '2026-04-15',
  185000.00,  -- $185K ARR
  450,  -- 450 operatives (seats)
  'subscription',
  'active',
  false,  -- NO auto-renewal (creates urgency!)
  '3-year contract, 99.5% uptime SLA, critical coordination platform',
  true,  -- is_demo flag
  NOW(),
  NOW()
)
RETURNING id INTO v_aco_contract_id;

RAISE NOTICE 'ACO Contract created: %', v_aco_contract_id;

-- ============================================================================
-- 5. RENEWAL
-- ============================================================================

INSERT INTO public.renewals (
  contract_id,
  customer_id,
  renewal_date,
  current_arr,
  proposed_arr,
  probability,
  stage,
  risk_level,
  expansion_opportunity,
  ai_risk_score,
  ai_recommendations,
  ai_confidence,
  last_contact_date,
  next_action,
  next_action_date,
  notes,
  current_phase,
  is_demo,
  created_at,
  updated_at
)
VALUES (
  v_aco_contract_id,
  v_aco_customer_id,
  '2026-04-15',
  185000.00,  -- Current ARR
  185000.00,  -- Proposed ARR (no change yet)
  58,  -- 58% renewal probability (moderate risk)
  'discovery',
  'medium',
  1700000.00,  -- Elena's $1.7M Global Synchronization Initiative
  42,  -- AI churn risk: 42%
  'Priority: Establish relationship with Dr. Elena Voss within 7 days. She is evaluating competitors and launching $1.7M initiative.',
  75,  -- AI confidence: 75%
  '2024-07-15',  -- Last contact (90 days ago)
  'Respond to Marcus email, reach out to Elena',
  CURRENT_DATE + INTERVAL '1 day',  -- Tomorrow
  'Account at moderate risk. Operation Blackout ($85K loss) damaged trust. Marcus disengaged for 90 days. Elena evaluating 3 competitors. High expansion potential with Elena initiative.',
  'planning',
  true,  -- is_demo flag
  NOW(),
  NOW()
)
RETURNING id INTO v_aco_renewal_id;

RAISE NOTICE 'ACO Renewal created: %', v_aco_renewal_id;

-- ============================================================================
-- 6. DEMO OPERATIONS (Villain "Projects")
-- ============================================================================

-- Operation Blackout (FAILED - the critical incident)
INSERT INTO public.demo_operations (
  customer_id,
  name,
  status,
  failure_reason,
  cost_impact,
  quarter,
  operation_date,
  created_at,
  updated_at
)
VALUES (
  v_aco_customer_id,
  'Operation Blackout',
  'failed',
  'Platform latency caused 47-second delay in critical coordination phase',
  85000.00,  -- $85K loss (~46% of ARR)
  'Q4 2024',
  '2024-10-15',
  NOW(),
  NOW()
);

-- Operation Nightfall (SUCCESS - for context)
INSERT INTO public.demo_operations (
  customer_id,
  name,
  status,
  failure_reason,
  cost_impact,
  quarter,
  operation_date,
  created_at,
  updated_at
)
VALUES (
  v_aco_customer_id,
  'Operation Nightfall',
  'success',
  NULL,
  NULL,  -- Success, no cost impact
  'Q3 2024',
  '2024-08-22',
  NOW(),
  NOW()
);

-- Operation Shadow Strike (SUCCESS - for context)
INSERT INTO public.demo_operations (
  customer_id,
  name,
  status,
  failure_reason,
  cost_impact,
  quarter,
  operation_date,
  created_at,
  updated_at
)
VALUES (
  v_aco_customer_id,
  'Operation Shadow Strike',
  'success',
  NULL,
  NULL,
  'Q2 2024',
  '2024-06-10',
  NOW(),
  NOW()
);

-- Operation Crimson Dawn (IN PROGRESS - for context)
INSERT INTO public.demo_operations (
  customer_id,
  name,
  status,
  failure_reason,
  cost_impact,
  quarter,
  operation_date,
  created_at,
  updated_at
)
VALUES (
  v_aco_customer_id,
  'Operation Crimson Dawn',
  'in_progress',
  NULL,
  NULL,
  'Q1 2025',
  '2025-01-15',
  NOW(),
  NOW()
);

RAISE NOTICE 'Demo operations seeded (4 operations)';

-- ============================================================================
-- 7. DEMO SUPPORT TICKETS (Ticket Spike - 5 frustrated tickets)
-- ============================================================================

INSERT INTO public.demo_support_tickets (
  customer_id,
  ticket_number,
  subject,
  category,
  priority,
  resolution_time_hours,
  sentiment,
  created_at
)
VALUES
  (v_aco_customer_id, 'ACO-4728', 'Operative Smith cannot access Phase 3 coordination documents', 'permissions_error', 'high', 72, 'frustrated', NOW() - INTERVAL '3 days'),
  (v_aco_customer_id, 'ACO-4801', 'Timezone conversion bug in Jakarta facility coordination', 'bug', 'medium', 48, 'frustrated', NOW() - INTERVAL '6 days'),
  (v_aco_customer_id, 'ACO-4823', 'Performance degradation during peak operational hours', 'performance', 'high', NULL, 'frustrated', NOW() - INTERVAL '4 days'),
  (v_aco_customer_id, 'ACO-4856', 'Integration with Operative Management System v8.2 failing', 'integration', 'high', NULL, 'frustrated', NOW() - INTERVAL '2 days'),
  (v_aco_customer_id, 'ACO-4891', 'Dashboard not displaying real-time operational status', 'ux', 'medium', 24, 'neutral', NOW() - INTERVAL '1 day');

RAISE NOTICE 'Demo support tickets seeded (5 tickets, 4 frustrated)';

-- ============================================================================
-- 8. DEMO STRATEGIC PLAN (Pre-seeded for demo continuity)
-- ============================================================================

INSERT INTO public.demo_strategic_plans (
  customer_id,
  renewal_id,
  phase_1_tasks,
  phase_2_tasks,
  phase_3_tasks,
  success_probability,
  completed,
  created_at,
  updated_at
)
VALUES (
  v_aco_customer_id,
  v_aco_renewal_id,
  '[
    {"task": "Respond to Marcus email", "dueDate": "Day 1", "status": "pending"},
    {"task": "Intro outreach to Elena", "dueDate": "Day 3", "status": "pending"},
    {"task": "Schedule Marcus call", "dueDate": "Day 5", "status": "pending"}
  ]'::jsonb,
  '[
    {"task": "Elena discovery call", "dueDate": "Week 2", "status": "pending"},
    {"task": "Deliver Accountability Report", "dueDate": "Week 3", "status": "pending"},
    {"task": "Propose dedicated liaison", "dueDate": "Week 4", "status": "pending"},
    {"task": "Schedule Q1 QBR", "dueDate": "Week 4", "status": "pending"}
  ]'::jsonb,
  '[
    {"task": "Demo timezone automation prototype", "dueDate": "Month 2", "status": "pending"},
    {"task": "Expansion proposal presentation", "dueDate": "Month 2", "status": "pending"},
    {"task": "Q1 QBR execution", "dueDate": "Month 3", "status": "pending"},
    {"task": "Renewal negotiation kickoff", "dueDate": "Month 3", "status": "pending"}
  ]'::jsonb,
  78.0,  -- 78% success probability if plan executed
  false,  -- Not completed yet
  NOW(),
  NOW()
);

RAISE NOTICE 'Demo strategic plan seeded';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show what was created
SELECT 'Obsidian Black Customer:' as section, name, arr, health_score, renewal_date, is_demo
FROM customers
WHERE name = 'Obsidian Black';

SELECT 'Contacts:' as section, first_name || ' ' || last_name as name, title, email, is_primary
FROM contacts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY is_primary DESC;

SELECT 'Operations:' as section, name, status, cost_impact, operation_date
FROM demo_operations
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY operation_date DESC;

SELECT 'Support Tickets:' as section, ticket_number, subject, sentiment, created_at::date
FROM demo_support_tickets
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY created_at DESC;

-- ============================================================================
-- SEEDING COMPLETE
-- ============================================================================
RAISE NOTICE '✅ Obsidian Black Demo Data Seeding Complete!';
RAISE NOTICE 'Customer ID: 550e8400-e29b-41d4-a716-446655440001';
RAISE NOTICE 'ARR: $185,000';
RAISE NOTICE 'Health Score: 6.4/10';
RAISE NOTICE 'Churn Probability: 42%%';
RAISE NOTICE 'Operation Blackout Loss: $85,000';
