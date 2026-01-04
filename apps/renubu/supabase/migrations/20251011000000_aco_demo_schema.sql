-- ============================================================================
-- ACO Demo Schema Migration
-- Created: 2025-10-11
-- Purpose: Add demo-specific tables and architectural improvements for Act 1
-- ============================================================================
-- Changes:
--   1. Add renewal_id to workflow_executions (architectural fix)
--   2. Add demo_godmode to profiles (demo access control)
--   3. Add is_demo flags to existing tables (demo data isolation)
--   4. Create demo-specific tables (operations, tickets, strategic plans)
--   5. Grant demo_godmode to justin@renubu.com
-- ============================================================================

-- ============================================================================
-- ARCHITECTURAL IMPROVEMENTS
-- ============================================================================

-- Add renewal_id to workflow_executions
-- Purpose: Allow renewal-focused workflows to access renewal context directly
-- Note: Nullable to maintain backward compatibility with existing workflows
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS renewal_id UUID REFERENCES public.renewals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_executions_renewal_id
  ON public.workflow_executions(renewal_id);

COMMENT ON COLUMN public.workflow_executions.renewal_id IS 'Links workflow to specific renewal (for renewal-focused workflows like Strategic Planning)';

-- ============================================================================
-- DEMO ACCESS CONTROL
-- ============================================================================

-- Add demo_godmode to profiles
-- Purpose: Identify users who can reset demo data (sales engineers, admins)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS demo_godmode BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.demo_godmode IS 'Users with demo godmode can reset demo data via /api/demo/reset';

-- Grant demo_godmode to justin@renubu.com
UPDATE public.profiles
SET demo_godmode = true
WHERE email = 'justin@renubu.com';

-- ============================================================================
-- DEMO DATA FLAGS
-- ============================================================================

-- Add is_demo flags to existing tables
-- Purpose: Isolate demo data from production data for safe cleanup
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.renewals ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Indexes for efficient demo data filtering
CREATE INDEX IF NOT EXISTS idx_customers_is_demo ON public.customers(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_contacts_is_demo ON public.contacts(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_contracts_is_demo ON public.contracts(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_renewals_is_demo ON public.renewals(is_demo) WHERE is_demo = true;

-- ============================================================================
-- DEMO-SPECIFIC TABLES
-- ============================================================================

-- Demo Operations Table
-- Purpose: Store villain "projects" (Operation Blackout, etc.)
CREATE TABLE IF NOT EXISTS public.demo_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  failure_reason TEXT,
  cost_impact DECIMAL(12,2),
  quarter TEXT,
  operation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_operations_customer_id ON public.demo_operations(customer_id);
CREATE INDEX IF NOT EXISTS idx_demo_operations_date ON public.demo_operations(operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_demo_operations_status ON public.demo_operations(status);

COMMENT ON TABLE public.demo_operations IS 'ACO villain operations (Operation Blackout, Nightfall, etc.) - Demo data only';

-- Demo Support Tickets Table
-- Purpose: Store support tickets with villain themes for ticket spike detection
CREATE TABLE IF NOT EXISTS public.demo_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  resolution_time_hours INTEGER,
  sentiment TEXT CHECK (sentiment IN ('frustrated', 'neutral', 'satisfied')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_tickets_customer_id ON public.demo_support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_demo_tickets_created_at ON public.demo_support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_tickets_sentiment ON public.demo_support_tickets(sentiment);

COMMENT ON TABLE public.demo_support_tickets IS 'Support tickets for demo customers - tracks ticket spikes and sentiment';

-- Demo Strategic Plans Table
-- Purpose: Store strategic plans generated by Strategic Planning workflow
CREATE TABLE IF NOT EXISTS public.demo_strategic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  renewal_id UUID REFERENCES public.renewals(id) ON DELETE CASCADE,
  phase_1_tasks JSONB,
  phase_2_tasks JSONB,
  phase_3_tasks JSONB,
  success_probability NUMERIC,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_plans_customer_id ON public.demo_strategic_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_demo_plans_renewal_id ON public.demo_strategic_plans(renewal_id);

COMMENT ON TABLE public.demo_strategic_plans IS 'Strategic plans generated by Strategic Planning workflow - Demo data only';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has demo godmode
CREATE OR REPLACE FUNCTION public.has_demo_godmode(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(demo_godmode, false)
  FROM public.profiles
  WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON FUNCTION public.has_demo_godmode(UUID) IS 'Check if user has demo godmode permission (for demo reset endpoint)';

-- Function to reset ACO demo data
-- Purpose: Delete all demo-flagged records and prepare for re-seeding
-- Safety: Only deletes records where is_demo = true
CREATE OR REPLACE FUNCTION public.reset_aco_demo()
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  customers_deleted INTEGER,
  contacts_deleted INTEGER,
  contracts_deleted INTEGER,
  renewals_deleted INTEGER,
  operations_deleted INTEGER,
  tickets_deleted INTEGER,
  plans_deleted INTEGER,
  workflows_deleted INTEGER
) AS $$
DECLARE
  v_customers_deleted INTEGER := 0;
  v_contacts_deleted INTEGER := 0;
  v_contracts_deleted INTEGER := 0;
  v_renewals_deleted INTEGER := 0;
  v_operations_deleted INTEGER := 0;
  v_tickets_deleted INTEGER := 0;
  v_plans_deleted INTEGER := 0;
  v_workflows_deleted INTEGER := 0;
BEGIN
  -- Delete demo-specific tables (safest - only contain demo data)
  DELETE FROM public.demo_strategic_plans
  WHERE customer_id IN (SELECT id FROM public.customers WHERE is_demo = true);
  GET DIAGNOSTICS v_plans_deleted = ROW_COUNT;

  DELETE FROM public.demo_support_tickets
  WHERE customer_id IN (SELECT id FROM public.customers WHERE is_demo = true);
  GET DIAGNOSTICS v_tickets_deleted = ROW_COUNT;

  DELETE FROM public.demo_operations
  WHERE customer_id IN (SELECT id FROM public.customers WHERE is_demo = true);
  GET DIAGNOSTICS v_operations_deleted = ROW_COUNT;

  -- Delete workflow executions for demo customers
  DELETE FROM public.workflow_executions
  WHERE customer_id IN (SELECT id FROM public.customers WHERE is_demo = true);
  GET DIAGNOSTICS v_workflows_deleted = ROW_COUNT;

  -- Delete from existing tables (only is_demo = true records)
  -- Order matters due to foreign key constraints
  DELETE FROM public.renewals WHERE is_demo = true;
  GET DIAGNOSTICS v_renewals_deleted = ROW_COUNT;

  DELETE FROM public.contracts WHERE is_demo = true;
  GET DIAGNOSTICS v_contracts_deleted = ROW_COUNT;

  DELETE FROM public.contacts WHERE is_demo = true;
  GET DIAGNOSTICS v_contacts_deleted = ROW_COUNT;

  DELETE FROM public.customers WHERE is_demo = true;
  GET DIAGNOSTICS v_customers_deleted = ROW_COUNT;

  -- Return success with deletion counts
  RETURN QUERY SELECT
    true,
    'Demo data reset successfully',
    v_customers_deleted,
    v_contacts_deleted,
    v_contracts_deleted,
    v_renewals_deleted,
    v_operations_deleted,
    v_tickets_deleted,
    v_plans_deleted,
    v_workflows_deleted;

EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN QUERY SELECT
    false,
    'Error: ' || SQLERRM,
    0, 0, 0, 0, 0, 0, 0, 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_aco_demo() IS 'Reset all ACO demo data - only deletes records where is_demo = true';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
--   1. Run Phase 2: Data seeding (seed_aco_demo_data.sql)
--   2. Build customer context APIs (Phase 3)
--   3. Integrate with workflows (Phase 4)
-- ============================================================================
