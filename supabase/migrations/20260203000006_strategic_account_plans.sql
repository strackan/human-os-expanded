-- ============================================================================
-- Strategic Account Plans & Activities Tables
-- Created: 2025-11-29
-- Purpose: Annual strategic plans created during deep-dive account reviews
--          Activities drive scheduled workflows throughout the year
-- ============================================================================

-- Strategic Account Plan - created during Annual Deep Dive review
CREATE TABLE IF NOT EXISTS public.strategic_account_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),

  -- Plan period
  plan_year INTEGER NOT NULL,  -- e.g., 2025
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Strategy selection (CSM choice)
  strategy TEXT NOT NULL CHECK (strategy IN ('invest', 'expand', 'save', 'monitor', 'maintain')),

  -- Calculated quadrant (what system recommended)
  calculated_quadrant TEXT NOT NULL CHECK (calculated_quadrant IN ('invest', 'expand', 'rescue', 'maintain')),
  strategy_differs_from_quadrant BOOLEAN DEFAULT false,
  strategy_rationale TEXT,  -- Required when strategy differs

  -- Snapshot of scores at plan creation
  risk_score_at_creation DECIMAL(5,2),
  opportunity_score_at_creation DECIMAL(5,2),
  health_score_at_creation DECIMAL(5,2),
  tier_at_creation TEXT,
  arr_at_creation DECIMAL(12,2),

  -- Plan status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'superseded')),

  -- Certification (when CSM signs off)
  certified_at TIMESTAMPTZ,
  certified_by UUID REFERENCES public.profiles(id),

  -- Review tracking
  last_reviewed_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: One active plan per customer per year
CREATE UNIQUE INDEX idx_plans_customer_year_active
  ON public.strategic_account_plans(customer_id, plan_year)
  WHERE status = 'active';

-- Other indexes
CREATE INDEX idx_plans_customer ON public.strategic_account_plans(customer_id, plan_year DESC);
CREATE INDEX idx_plans_company ON public.strategic_account_plans(company_id);
CREATE INDEX idx_plans_active ON public.strategic_account_plans(company_id, status)
  WHERE status = 'active';
CREATE INDEX idx_plans_strategy ON public.strategic_account_plans(company_id, strategy, status)
  WHERE status = 'active';

-- Comments
COMMENT ON TABLE public.strategic_account_plans IS 'Annual strategic account plans created during deep-dive reviews';
COMMENT ON COLUMN public.strategic_account_plans.strategy IS 'CSM-chosen strategy: invest (high-touch), expand (growth), save (retention), monitor (watch), maintain (steady)';
COMMENT ON COLUMN public.strategic_account_plans.calculated_quadrant IS 'System-calculated quadrant from Risk×Opportunity matrix';
COMMENT ON COLUMN public.strategic_account_plans.strategy_differs_from_quadrant IS 'True when CSM overrides system recommendation';
COMMENT ON COLUMN public.strategic_account_plans.status IS 'Plan lifecycle: draft (in progress), active (certified), completed (year ended), superseded (replaced)';

-- ============================================================================
-- Account Plan Activities - Milestones within a plan
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_plan_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_plan_id UUID NOT NULL REFERENCES public.strategic_account_plans(id) ON DELETE CASCADE,

  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'qbr',                -- Quarterly Business Review
    'executive_meeting',  -- Executive sponsor meeting
    'training',           -- User training session
    'renewal_prep',       -- Renewal preparation
    'expansion_pitch',    -- Upsell/expansion discussion
    'health_check',       -- Account health review
    'success_planning',   -- Success plan session
    'onboarding',         -- New feature/user onboarding
    'risk_mitigation',    -- Risk intervention
    'custom'              -- Custom activity
  )),
  title TEXT NOT NULL,
  description TEXT,

  -- Scheduling
  target_date DATE,
  target_quarter INTEGER CHECK (target_quarter BETWEEN 1 AND 4),
  target_month INTEGER CHECK (target_month BETWEEN 1 AND 12),

  -- Ownership
  assigned_to UUID REFERENCES public.profiles(id),

  -- Completion tracking
  status TEXT DEFAULT 'planned' CHECK (status IN (
    'planned',    -- Initial state
    'scheduled',  -- Has confirmed date
    'in_progress',-- Currently being executed
    'completed',  -- Done successfully
    'skipped',    -- Intentionally skipped
    'overdue'     -- Past target date without completion
  )),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  completion_notes TEXT,

  -- Link to auto-generated workflow
  workflow_execution_id UUID REFERENCES public.workflow_executions(id),

  -- Metadata
  priority INTEGER DEFAULT 0,  -- Higher = more important
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_plan ON public.account_plan_activities(account_plan_id, target_date);
CREATE INDEX idx_activities_upcoming ON public.account_plan_activities(status, target_date)
  WHERE status IN ('planned', 'scheduled');
CREATE INDEX idx_activities_assigned ON public.account_plan_activities(assigned_to, status)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_activities_quarter ON public.account_plan_activities(account_plan_id, target_quarter);

-- Comments
COMMENT ON TABLE public.account_plan_activities IS 'Planned activities/milestones within a strategic account plan';
COMMENT ON COLUMN public.account_plan_activities.activity_type IS 'Type of activity: qbr, executive_meeting, training, renewal_prep, expansion_pitch, etc.';
COMMENT ON COLUMN public.account_plan_activities.target_quarter IS 'Target quarter (1-4) when activity should occur';
COMMENT ON COLUMN public.account_plan_activities.workflow_execution_id IS 'Link to auto-generated workflow for this activity';

-- ============================================================================
-- Add foreign key from customer_intel to strategic_account_plans
-- ============================================================================

ALTER TABLE public.customer_intel
  ADD CONSTRAINT fk_intel_account_plan
  FOREIGN KEY (account_plan_id)
  REFERENCES public.strategic_account_plans(id)
  ON DELETE SET NULL;

-- ============================================================================
-- Updated_at triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_strategic_account_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER strategic_account_plans_updated_at
  BEFORE UPDATE ON public.strategic_account_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_account_plans_updated_at();

CREATE OR REPLACE FUNCTION update_account_plan_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER account_plan_activities_updated_at
  BEFORE UPDATE ON public.account_plan_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_account_plan_activities_updated_at();
