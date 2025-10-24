/**
 * BLUESOFT SHOWCASE DEMO - Seed Data
 *
 * Creates the "Bluesoft" showcase customer and populates intelligence,
 * financials, usage, and engagement data across a 120-day renewal lifecycle.
 *
 * STORY: Bluesoft is a $180K ARR customer going through a renewal with
 * expansion opportunity. The journey shows various stages from initial
 * assessment to successful renewal with 10% growth.
 *
 * Run this AFTER BLUESOFT_DEMO_MIGRATION.sql
 *
 * Date: October 9, 2025
 */

-- =====================================================
-- PART 1: CREATE BLUESOFT CUSTOMER
-- =====================================================

-- Create Bluesoft customer (no user dependency)
DO $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Create or get Bluesoft customer
  INSERT INTO customers (
    id,
    name,
    domain,
    industry,
    health_score,
    current_arr,
    renewal_date,
    assigned_to,
    account_plan
  ) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Fixed UUID for easy reference
    'Bluesoft Corporation',
    'bluesoft.com',
    'Enterprise Software',
    85, -- Current health (after successful renewal)
    198000, -- Current ARR (after expansion)
    (CURRENT_DATE + INTERVAL '365 days')::DATE, -- Next renewal in 1 year
    NULL, -- No user assigned yet
    'expand' -- High value account
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    industry = EXCLUDED.industry,
    health_score = EXCLUDED.health_score,
    current_arr = EXCLUDED.current_arr,
    renewal_date = EXCLUDED.renewal_date,
    assigned_to = EXCLUDED.assigned_to,
    account_plan = EXCLUDED.account_plan;

  -- Store the customer ID for later use
  v_customer_id := '00000000-0000-0000-0000-000000000001';

  RAISE NOTICE 'Created/Updated Bluesoft customer with ID: %', v_customer_id;
END $$;

-- =====================================================
-- PART 2: STAKEHOLDERS
-- =====================================================

INSERT INTO customer_stakeholders (customer_id, name, title, role, department, email, influence_level, decision_authority, is_champion, sentiment, last_interaction_date)
VALUES
  -- Decision Maker
  ('00000000-0000-0000-0000-000000000001', 'Sarah Chen', 'VP of Engineering', 'decision_maker', 'Engineering', 'sarah.chen@bluesoft.com', 'high', TRUE, FALSE, 'positive', CURRENT_DATE - INTERVAL '2 days'),

  -- Champion
  ('00000000-0000-0000-0000-000000000001', 'Marcus Thompson', 'Director of DevOps', 'champion', 'Engineering', 'marcus.thompson@bluesoft.com', 'high', FALSE, TRUE, 'positive', CURRENT_DATE - INTERVAL '1 day'),

  -- Influencers
  ('00000000-0000-0000-0000-000000000001', 'Emily Rodriguez', 'Senior Engineering Manager', 'influencer', 'Engineering', 'emily.rodriguez@bluesoft.com', 'medium', FALSE, TRUE, 'positive', CURRENT_DATE - INTERVAL '5 days'),

  ('00000000-0000-0000-0000-000000000001', 'David Kim', 'CFO', 'decision_maker', 'Finance', 'david.kim@bluesoft.com', 'high', TRUE, FALSE, 'neutral', CURRENT_DATE - INTERVAL '15 days'),

  -- Users
  ('00000000-0000-0000-0000-000000000001', 'Jessica Martinez', 'Engineering Team Lead', 'user', 'Engineering', 'jessica.martinez@bluesoft.com', 'low', FALSE, FALSE, 'positive', CURRENT_DATE - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 3: INTELLIGENCE DATA (120-day journey)
-- =====================================================

-- Day 0 (120 days before renewal) - Monitor Stage
-- Initial assessment, moderate health
INSERT INTO customer_intelligence (
  customer_id, risk_score, opportunity_score, health_score,
  health_trend, usage_trend, engagement_trend,
  churn_probability, expansion_probability,
  calculated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  28, 60, 72, -- Moderate risk, good opportunity, decent health
  'stable', 'stable', 'moderate',
  15.5, 45.0, -- 15.5% churn risk, 45% expansion probability
  CURRENT_DATE - INTERVAL '120 days'
);

-- Day 30 (90 days before) - Prepare Stage
-- QBR executed, health improves, expansion opportunity identified
INSERT INTO customer_intelligence (
  customer_id, risk_score, opportunity_score, health_score,
  health_trend, usage_trend, engagement_trend,
  churn_probability, expansion_probability,
  calculated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  22, 70, 78, -- Lower risk, higher opportunity
  'improving', 'increasing', 'high',
  10.0, 65.0, -- 10% churn risk, 65% expansion probability
  CURRENT_DATE - INTERVAL '90 days'
);

-- Day 60 (60 days before) - Negotiate Stage
-- Pricing concerns surface, health dips
INSERT INTO customer_intelligence (
  customer_id, risk_score, opportunity_score, health_score,
  health_trend, usage_trend, engagement_trend,
  churn_probability, expansion_probability,
  calculated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  35, 65, 68, -- Risk increases, some concerns
  'declining', 'stable', 'moderate',
  18.0, 55.0, -- 18% churn risk, 55% expansion probability
  CURRENT_DATE - INTERVAL '60 days'
);

-- Day 75 (45 days before) - Finalize Stage
-- Terms agreed, health recovers
INSERT INTO customer_intelligence (
  customer_id, risk_score, opportunity_score, health_score,
  health_trend, usage_trend, engagement_trend,
  churn_probability, expansion_probability,
  calculated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  25, 75, 75, -- Risk reduced, opportunity high
  'improving', 'increasing', 'high',
  12.0, 70.0, -- 12% churn risk, 70% expansion probability
  CURRENT_DATE - INTERVAL '45 days'
);

-- Day 90 (30 days before) - Signature Stage
-- Stakeholder alignment in progress
INSERT INTO customer_intelligence (
  customer_id, risk_score, opportunity_score, health_score,
  health_trend, usage_trend, engagement_trend,
  churn_probability, expansion_probability,
  calculated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  26, 78, 74, -- Stable, high opportunity
  'stable', 'increasing', 'high',
  13.0, 75.0, -- 13% churn risk, 75% expansion probability
  CURRENT_DATE - INTERVAL '30 days'
);

-- Day 105 (15 days before) - Critical Stage
-- Waiting on signatures, some anxiety
INSERT INTO customer_intelligence (
  customer_id, risk_score, opportunity_score, health_score,
  health_trend, usage_trend, engagement_trend,
  churn_probability, expansion_probability,
  calculated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  28, 76, 74, -- Slight risk increase (waiting)
  'stable', 'stable', 'moderate',
  14.0, 76.0, -- 14% churn risk, 76% expansion probability
  CURRENT_DATE - INTERVAL '15 days'
);

-- Day 115 (5 days before) - Emergency Stage
-- Urgent follow-ups, high urgency
INSERT INTO customer_intelligence (
  customer_id, risk_score, opportunity_score, health_score,
  health_trend, usage_trend, engagement_trend,
  churn_probability, expansion_probability,
  calculated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  30, 80, 73, -- Some risk, but high opportunity
  'stable', 'stable', 'moderate',
  15.0, 80.0, -- 15% churn risk, 80% expansion probability
  CURRENT_DATE - INTERVAL '5 days'
);

-- Day 120 (Renewal Day) - SUCCESS!
-- Renewed with 10% expansion
INSERT INTO customer_intelligence (
  customer_id, risk_score, opportunity_score, health_score,
  health_trend, usage_trend, engagement_trend,
  churn_probability, expansion_probability,
  calculated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  15, 90, 85, -- Low risk, very high opportunity
  'improving', 'increasing', 'high',
  5.0, 90.0, -- 5% churn risk, 90% expansion probability
  CURRENT_DATE
);

-- =====================================================
-- PART 4: FINANCIALS DATA
-- =====================================================

-- Historical baseline (12 months ago)
INSERT INTO customer_financials (
  customer_id, current_arr, previous_arr, projected_arr,
  arr_trend, growth_rate,
  arr_12_months_ago, arr_6_months_ago,
  payment_status, days_past_due,
  valid_from, valid_to
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  165000, 150000, 165000,
  'growing', 10.0,
  150000, 158000,
  'current', 0,
  CURRENT_DATE - INTERVAL '365 days',
  CURRENT_DATE - INTERVAL '121 days'
);

-- Start of renewal period (Day 0-119)
INSERT INTO customer_financials (
  customer_id, current_arr, previous_arr, projected_arr,
  arr_trend, growth_rate,
  arr_12_months_ago, arr_6_months_ago,
  payment_status, days_past_due,
  valid_from, valid_to
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  180000, 165000, 198000, -- Current: $180k, Projected: $198k (10% expansion)
  'growing', 9.09, -- (180k - 165k) / 165k * 100
  150000, 165000,
  'current', 0,
  CURRENT_DATE - INTERVAL '120 days',
  CURRENT_DATE - INTERVAL '1 day'
);

-- After renewal (Current state)
INSERT INTO customer_financials (
  customer_id, current_arr, previous_arr, projected_arr,
  arr_trend, growth_rate,
  arr_12_months_ago, arr_6_months_ago,
  payment_status, days_past_due,
  valid_from, valid_to
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  198000, 180000, 220000, -- Renewed at $198k, projecting $220k next year
  'growing', 10.0, -- (198k - 180k) / 180k * 100
  165000, 180000,
  'current', 0,
  CURRENT_DATE,
  NULL -- Current record, no end date
);

-- =====================================================
-- PART 5: USAGE METRICS DATA
-- =====================================================

-- Day 0 (120 days before) - Baseline usage
INSERT INTO customer_usage_metrics (
  customer_id, active_users, total_licensed_users, utilization_rate,
  last_activity_date, last_login_date,
  weekly_active_users, monthly_active_users,
  features_adopted, total_features, adoption_rate,
  usage_trend, metric_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  32, 40, 80.0, -- 32/40 users active
  CURRENT_DATE - INTERVAL '120 days',
  CURRENT_DATE - INTERVAL '120 days',
  28, 35,
  12, 20, 60.0, -- 12/20 features adopted
  'stable',
  (CURRENT_DATE - INTERVAL '120 days')::DATE
);

-- Day 30 (90 days before) - Usage improving after QBR
INSERT INTO customer_usage_metrics (
  customer_id, active_users, total_licensed_users, utilization_rate,
  last_activity_date, last_login_date,
  weekly_active_users, monthly_active_users,
  features_adopted, total_features, adoption_rate,
  usage_trend, metric_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  35, 40, 87.5, -- 35/40 users active
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE - INTERVAL '90 days',
  32, 38,
  14, 20, 70.0, -- 14/20 features adopted
  'increasing',
  (CURRENT_DATE - INTERVAL '90 days')::DATE
);

-- Day 60 (60 days before) - Slight dip during negotiations
INSERT INTO customer_usage_metrics (
  customer_id, active_users, total_licensed_users, utilization_rate,
  last_activity_date, last_login_date,
  weekly_active_users, monthly_active_users,
  features_adopted, total_features, adoption_rate,
  usage_trend, metric_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  34, 40, 85.0, -- 34/40 users active
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE - INTERVAL '60 days',
  30, 37,
  14, 20, 70.0,
  'stable',
  (CURRENT_DATE - INTERVAL '60 days')::DATE
);

-- Day 75 (45 days before) - Recovery after terms agreed
INSERT INTO customer_usage_metrics (
  customer_id, active_users, total_licensed_users, utilization_rate,
  last_activity_date, last_login_date,
  weekly_active_users, monthly_active_users,
  features_adopted, total_features, adoption_rate,
  usage_trend, metric_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  36, 40, 90.0, -- 36/40 users active
  CURRENT_DATE - INTERVAL '45 days',
  CURRENT_DATE - INTERVAL '45 days',
  33, 39,
  15, 20, 75.0, -- 15/20 features adopted
  'increasing',
  (CURRENT_DATE - INTERVAL '45 days')::DATE
);

-- Day 90 (30 days before) - Strong usage
INSERT INTO customer_usage_metrics (
  customer_id, active_users, total_licensed_users, utilization_rate,
  last_activity_date, last_login_date,
  weekly_active_users, monthly_active_users,
  features_adopted, total_features, adoption_rate,
  usage_trend, metric_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  37, 40, 92.5, -- 37/40 users active
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '30 days',
  35, 39,
  16, 20, 80.0, -- 16/20 features adopted
  'increasing',
  (CURRENT_DATE - INTERVAL '30 days')::DATE
);

-- Day 105 (15 days before) - Peak usage
INSERT INTO customer_usage_metrics (
  customer_id, active_users, total_licensed_users, utilization_rate,
  last_activity_date, last_login_date,
  weekly_active_users, monthly_active_users,
  features_adopted, total_features, adoption_rate,
  usage_trend, metric_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  38, 40, 95.0, -- 38/40 users active
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE - INTERVAL '15 days',
  36, 40,
  17, 20, 85.0, -- 17/20 features adopted
  'increasing',
  (CURRENT_DATE - INTERVAL '15 days')::DATE
);

-- Current (After renewal with expansion to 45 licenses)
INSERT INTO customer_usage_metrics (
  customer_id, active_users, total_licensed_users, utilization_rate,
  last_activity_date, last_login_date,
  weekly_active_users, monthly_active_users,
  features_adopted, total_features, adoption_rate,
  usage_trend, metric_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  40, 45, 88.9, -- 40/45 users active (expanded licenses)
  CURRENT_DATE,
  CURRENT_DATE,
  38, 42,
  18, 20, 90.0, -- 18/20 features adopted
  'increasing',
  CURRENT_DATE::DATE
);

-- =====================================================
-- PART 6: ENGAGEMENT DATA
-- =====================================================

-- Day 0 (120 days before) - Initial state
INSERT INTO customer_engagement (
  customer_id,
  last_contact_date, last_contact_type, contact_frequency,
  last_qbr_date, next_qbr_date, meetings_this_quarter,
  nps_score, csat_score, sentiment,
  open_support_tickets, closed_tickets_30d, avg_resolution_time_hours,
  engagement_score, engagement_trend,
  recorded_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '120 days', 'email', 'weekly',
  CURRENT_DATE - INTERVAL '210 days', -- QBR was 90 days before this
  CURRENT_DATE - INTERVAL '90 days', -- Next QBR scheduled
  1,
  7, 3.8, 'neutral',
  1, 5, 18.5,
  65, 'moderate',
  CURRENT_DATE - INTERVAL '120 days'
);

-- Day 30 (90 days before) - QBR executed
INSERT INTO customer_engagement (
  customer_id,
  last_contact_date, last_contact_type, contact_frequency,
  last_qbr_date, next_qbr_date, meetings_this_quarter,
  nps_score, csat_score, sentiment,
  open_support_tickets, closed_tickets_30d, avg_resolution_time_hours,
  engagement_score, engagement_trend,
  recorded_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '90 days', 'meeting', 'weekly',
  CURRENT_DATE - INTERVAL '90 days', -- QBR today
  CURRENT_DATE + INTERVAL '90 days', -- Next QBR scheduled
  3,
  8, 4.2, 'positive',
  0, 8, 14.2,
  78, 'high',
  CURRENT_DATE - INTERVAL '90 days'
);

-- Day 60 (60 days before) - Pricing concerns
INSERT INTO customer_engagement (
  customer_id,
  last_contact_date, last_contact_type, contact_frequency,
  last_qbr_date, next_qbr_date, meetings_this_quarter,
  nps_score, csat_score, sentiment,
  open_support_tickets, closed_tickets_30d, avg_resolution_time_hours,
  engagement_score, engagement_trend,
  recorded_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '65 days', 'call', 'weekly',
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE + INTERVAL '90 days',
  4,
  6, 3.5, 'neutral',
  3, 6, 22.3,
  68, 'moderate',
  CURRENT_DATE - INTERVAL '60 days'
);

-- Day 75 (45 days before) - Terms agreed
INSERT INTO customer_engagement (
  customer_id,
  last_contact_date, last_contact_type, contact_frequency,
  last_qbr_date, next_qbr_date, meetings_this_quarter,
  nps_score, csat_score, sentiment,
  open_support_tickets, closed_tickets_30d, avg_resolution_time_hours,
  engagement_score, engagement_trend,
  recorded_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '45 days', 'meeting', 'daily',
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE + INTERVAL '90 days',
  6,
  8, 4.3, 'positive',
  0, 9, 12.1,
  82, 'high',
  CURRENT_DATE - INTERVAL '45 days'
);

-- Day 90 (30 days before) - Signature stage
INSERT INTO customer_engagement (
  customer_id,
  last_contact_date, last_contact_type, contact_frequency,
  last_qbr_date, next_qbr_date, meetings_this_quarter,
  nps_score, csat_score, sentiment,
  open_support_tickets, closed_tickets_30d, avg_resolution_time_hours,
  engagement_score, engagement_trend,
  recorded_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '32 days', 'email', 'daily',
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE + INTERVAL '90 days',
  8,
  8, 4.4, 'positive',
  0, 10, 10.5,
  80, 'high',
  CURRENT_DATE - INTERVAL '30 days'
);

-- Day 105 (15 days before) - Critical stage
INSERT INTO customer_engagement (
  customer_id,
  last_contact_date, last_contact_type, contact_frequency,
  last_qbr_date, next_qbr_date, meetings_this_quarter,
  nps_score, csat_score, sentiment,
  open_support_tickets, closed_tickets_30d, avg_resolution_time_hours,
  engagement_score, engagement_trend,
  recorded_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '15 days', 'call', 'daily',
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE + INTERVAL '90 days',
  10,
  7, 4.1, 'positive',
  1, 11, 8.2,
  74, 'moderate',
  CURRENT_DATE - INTERVAL '15 days'
);

-- Current (After successful renewal)
INSERT INTO customer_engagement (
  customer_id,
  last_contact_date, last_contact_type, contact_frequency,
  last_qbr_date, next_qbr_date, meetings_this_quarter,
  nps_score, csat_score, sentiment,
  open_support_tickets, closed_tickets_30d, avg_resolution_time_hours,
  engagement_score, engagement_trend,
  recorded_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE, 'meeting', 'weekly',
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE + INTERVAL '90 days',
  12,
  9, 4.7, 'positive',
  0, 12, 6.5,
  90, 'high',
  CURRENT_DATE
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BLUESOFT DEMO SEED DATA COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created showcase customer:';
  RAISE NOTICE '  - Bluesoft Corporation';
  RAISE NOTICE '  - ID: 00000000-0000-0000-0000-000000000001';
  RAISE NOTICE '  - ARR: $198,000 (after 10%% expansion)';
  RAISE NOTICE '  - Health Score: 85';
  RAISE NOTICE '';
  RAISE NOTICE 'Seeded data:';
  RAISE NOTICE '  - 5 stakeholders';
  RAISE NOTICE '  - 8 intelligence snapshots (120-day journey)';
  RAISE NOTICE '  - 3 financial records (historical + current)';
  RAISE NOTICE '  - 7 usage metric snapshots';
  RAISE NOTICE '  - 8 engagement records';
  RAISE NOTICE '';
  RAISE NOTICE '120-Day Renewal Journey:';
  RAISE NOTICE '  Day 0: Monitor (Health: 72)';
  RAISE NOTICE '  Day 30: Prepare - QBR (Health: 78)';
  RAISE NOTICE '  Day 60: Negotiate (Health: 68)';
  RAISE NOTICE '  Day 75: Finalize (Health: 75)';
  RAISE NOTICE '  Day 90: Signature (Health: 74)';
  RAISE NOTICE '  Day 105: Critical (Health: 74)';
  RAISE NOTICE '  Day 115: Emergency (Health: 73)';
  RAISE NOTICE '  Day 120: SUCCESS! (Health: 85)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update Context API to read from these tables';
  RAISE NOTICE '========================================';
END $$;
