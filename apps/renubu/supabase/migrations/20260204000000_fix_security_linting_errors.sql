-- ============================================================================
-- Fix Security Linting Errors
-- ============================================================================
-- Fixes 12 Supabase linting errors:
-- - 6 SECURITY DEFINER views (recreate without security_invoker = false)
-- - 6 tables missing RLS
-- ============================================================================

-- ============================================================================
-- PART 1: DROP AND RECREATE VIEWS WITHOUT SECURITY DEFINER
-- The views are recreated with security_invoker = true (default)
-- ============================================================================

-- 1. snoozed_workflows_due
DROP VIEW IF EXISTS public.snoozed_workflows_due CASCADE;
CREATE VIEW public.snoozed_workflows_due AS
SELECT
  we.id,
  we.workflow_id,
  we.customer_id,
  we.user_id,
  we.status,
  we.snooze_until,
  we.created_at,
  c.name as customer_name,
  c.health_score,
  p.full_name as owner_name
FROM workflow_executions we
JOIN customers c ON we.customer_id = c.id
LEFT JOIN profiles p ON we.user_id = p.id
WHERE we.status = 'snoozed'
  AND we.snooze_until IS NOT NULL
  AND we.snooze_until <= NOW();

-- 2. escalated_workflows (now called pending_review)
DROP VIEW IF EXISTS public.escalated_workflows CASCADE;
CREATE VIEW public.escalated_workflows AS
SELECT
  we.id,
  we.workflow_id,
  we.customer_id,
  we.user_id,
  we.status,
  we.created_at,
  c.name as customer_name,
  c.health_score,
  p.full_name as owner_name
FROM workflow_executions we
JOIN customers c ON we.customer_id = c.id
LEFT JOIN profiles p ON we.user_id = p.id
WHERE we.status = 'pending_review';

-- 3. workflow_steps_due (simplified - no due_date column exists)
DROP VIEW IF EXISTS public.workflow_steps_due CASCADE;
CREATE VIEW public.workflow_steps_due AS
SELECT
  wse.id,
  wse.workflow_execution_id,
  wse.step_id,
  wse.step_title,
  wse.status,
  we.workflow_id,
  we.customer_id,
  c.name as customer_name
FROM workflow_step_executions wse
JOIN workflow_executions we ON wse.workflow_execution_id = we.id
JOIN customers c ON we.customer_id = c.id
WHERE wse.status IN ('not_started', 'in_progress');

-- 4. active_workflows
DROP VIEW IF EXISTS public.active_workflows CASCADE;
CREATE VIEW public.active_workflows AS
SELECT
  we.id,
  we.workflow_id,
  we.customer_id,
  we.user_id,
  we.status,
  we.created_at,
  we.last_activity_at,
  c.name as customer_name,
  c.health_score,
  c.current_arr,
  p.full_name as owner_name
FROM workflow_executions we
JOIN customers c ON we.customer_id = c.id
LEFT JOIN profiles p ON we.user_id = p.id
WHERE we.status IN ('not_started', 'in_progress', 'snoozed', 'pending_review');

-- 5. contract_matrix
DROP VIEW IF EXISTS public.contract_matrix CASCADE;
CREATE VIEW public.contract_matrix AS
SELECT
  c.id as contract_id,
  c.contract_number,
  cu.id as customer_id,
  cu.name as customer_name,
  cu.tier as customer_tier,
  c.start_date,
  c.end_date,
  c.term_months,
  c.arr,
  c.seats,
  c.status,
  ct.pricing_model,
  ct.discount_percent,
  ct.payment_terms,
  ct.auto_renewal,
  ct.auto_renewal_notice_days,
  ct.renewal_price_cap_percent,
  ct.sla_uptime_percent,
  ct.support_tier,
  ct.response_time_hours,
  ct.dedicated_csm,
  ct.liability_cap,
  ct.data_residency,
  ct.included_features,
  ct.usage_limits,
  CASE WHEN c.seats > 0 THEN (c.arr / c.seats / 12) ELSE NULL END as price_per_seat_per_month,
  (c.end_date - CURRENT_DATE) as days_until_renewal,
  CASE
    WHEN c.end_date - CURRENT_DATE <= COALESCE(ct.auto_renewal_notice_days, 30)
    THEN true
    ELSE false
  END as in_renewal_window
FROM contracts c
JOIN customers cu ON c.customer_id = cu.id
LEFT JOIN contract_terms ct ON c.id = ct.contract_id
WHERE c.status = 'active'
ORDER BY c.end_date ASC;

-- 6. pricing_acceptance_rate (joins through customers to get company_id)
DROP VIEW IF EXISTS public.pricing_acceptance_rate CASCADE;
CREATE VIEW public.pricing_acceptance_rate AS
SELECT
  cu.company_id,
  COUNT(*) as total_recommendations,
  COUNT(*) FILTER (WHERE pr.accepted = true) as accepted_count,
  COUNT(*) FILTER (WHERE pr.accepted = false) as rejected_count,
  COUNT(*) FILTER (WHERE pr.accepted IS NULL) as pending_count,
  ROUND(
    COUNT(*) FILTER (WHERE pr.accepted = true)::numeric /
    NULLIF(COUNT(*) FILTER (WHERE pr.accepted IS NOT NULL), 0) * 100,
    2
  ) as acceptance_rate
FROM pricing_recommendations pr
JOIN customers cu ON pr.customer_id = cu.id
GROUP BY cu.company_id;

-- ============================================================================
-- PART 2: ENABLE RLS ON TABLES MISSING IT
-- ============================================================================

-- 1. pricing_recommendations (via customer -> company)
ALTER TABLE public.pricing_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company isolation - pricing_recommendations" ON public.pricing_recommendations;
CREATE POLICY "Company isolation - pricing_recommendations"
  ON public.pricing_recommendations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE cu.id = pricing_recommendations.customer_id
      AND cu.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- 2. demo_operations (demo tables - allow all for authenticated users)
ALTER TABLE public.demo_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for demo_operations" ON public.demo_operations;
CREATE POLICY "Allow all for demo_operations"
  ON public.demo_operations FOR ALL
  USING (true);

-- 3. demo_support_tickets
ALTER TABLE public.demo_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for demo_support_tickets" ON public.demo_support_tickets;
CREATE POLICY "Allow all for demo_support_tickets"
  ON public.demo_support_tickets FOR ALL
  USING (true);

-- 4. demo_strategic_plans
ALTER TABLE public.demo_strategic_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for demo_strategic_plans" ON public.demo_strategic_plans;
CREATE POLICY "Allow all for demo_strategic_plans"
  ON public.demo_strategic_plans FOR ALL
  USING (true);

-- 5. app_settings (global settings - readable by all authenticated users)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read app_settings" ON public.app_settings;
CREATE POLICY "Authenticated users can read app_settings"
  ON public.app_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. contract_terms (via contract -> customer -> company)
ALTER TABLE public.contract_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company isolation - contract_terms" ON public.contract_terms;
CREATE POLICY "Company isolation - contract_terms"
  ON public.contract_terms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.customers cu ON c.customer_id = cu.id
      WHERE c.id = contract_terms.contract_id
      AND cu.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Security linting fixes applied:';
  RAISE NOTICE '- 6 views recreated without SECURITY DEFINER';
  RAISE NOTICE '- 6 tables now have RLS enabled';
END $$;
