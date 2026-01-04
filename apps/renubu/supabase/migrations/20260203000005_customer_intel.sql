-- ============================================================================
-- Customer Intel Table
-- Created: 2025-11-29
-- Purpose: Store CSM insights, notes, and context captured during reviews
--          Links to account plans and workflow executions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),

  -- Intel classification
  intel_type TEXT NOT NULL CHECK (intel_type IN (
    'account_review',      -- From account review workflow
    'strategy_rationale',  -- Why CSM chose specific strategy
    'risk_observation',    -- Noted risk factor
    'opportunity_signal',  -- Noted opportunity
    'stakeholder_change',  -- Contact/champion changes
    'competitive_intel',   -- Competitor mentions
    'product_feedback',    -- Feature requests, issues
    'general_note'         -- Catch-all
  )),
  title TEXT,
  content TEXT NOT NULL,

  -- Structured data (for specific intel types)
  structured_data JSONB DEFAULT '{}',

  -- Score impact (manual adjustment to calculated scores)
  risk_impact INTEGER CHECK (risk_impact BETWEEN -50 AND 50),
  opportunity_impact INTEGER CHECK (opportunity_impact BETWEEN -50 AND 50),

  -- Linkage
  workflow_execution_id UUID REFERENCES public.workflow_executions(id),
  account_plan_id UUID,  -- Will reference strategic_account_plans after that table is created

  -- Display
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_intel_customer ON public.customer_intel(customer_id, created_at DESC);
CREATE INDEX idx_intel_company ON public.customer_intel(company_id);
CREATE INDEX idx_intel_type ON public.customer_intel(customer_id, intel_type);
CREATE INDEX idx_intel_pinned ON public.customer_intel(customer_id, is_pinned)
  WHERE is_pinned = true;
CREATE INDEX idx_intel_plan ON public.customer_intel(account_plan_id)
  WHERE account_plan_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.customer_intel IS 'CSM insights and notes captured during account reviews and workflows';
COMMENT ON COLUMN public.customer_intel.intel_type IS 'Classification of intel: account_review, strategy_rationale, risk_observation, etc.';
COMMENT ON COLUMN public.customer_intel.structured_data IS 'Type-specific structured data (e.g., AI assessment, phase info for account_review)';
COMMENT ON COLUMN public.customer_intel.risk_impact IS 'Manual adjustment to risk score (-50 to +50)';
COMMENT ON COLUMN public.customer_intel.opportunity_impact IS 'Manual adjustment to opportunity score (-50 to +50)';
COMMENT ON COLUMN public.customer_intel.is_pinned IS 'Pinned intel shows prominently on customer page';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_customer_intel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_intel_updated_at
  BEFORE UPDATE ON public.customer_intel
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_intel_updated_at();
