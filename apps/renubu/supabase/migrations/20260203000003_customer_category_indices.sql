-- ============================================================================
-- Customer Category Indices Table
-- Created: 2025-11-29
-- Purpose: Calculated category indices and aggregate scores per customer
--          Updated whenever signals change or on scheduled recalculation
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_category_indices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Category Indices (0-100 scale)
  adoption_index DECIMAL(5,2) CHECK (adoption_index >= 0 AND adoption_index <= 100),
  engagement_index DECIMAL(5,2) CHECK (engagement_index >= 0 AND engagement_index <= 100),
  sentiment_index DECIMAL(5,2) CHECK (sentiment_index >= 0 AND sentiment_index <= 100),
  business_index DECIMAL(5,2) CHECK (business_index >= 0 AND business_index <= 100),
  external_index DECIMAL(5,2) CHECK (external_index >= 0 AND external_index <= 100),

  -- Aggregate Health Index (weighted combo of categories)
  health_index DECIMAL(5,2) CHECK (health_index >= 0 AND health_index <= 100),

  -- Calculated Scores
  risk_score DECIMAL(5,2) CHECK (risk_score >= 0 AND risk_score <= 100),
  opportunity_score DECIMAL(5,2) CHECK (opportunity_score >= 0 AND opportunity_score <= 100),

  -- Priority Score (integer for queue ordering)
  priority_score INTEGER CHECK (priority_score >= 0),

  -- Trend indicators
  health_trend TEXT CHECK (health_trend IN ('improving', 'stable', 'declining')),
  risk_trend TEXT CHECK (risk_trend IN ('improving', 'stable', 'worsening')),

  -- Calculation metadata
  calculated_at TIMESTAMPTZ NOT NULL,
  calculation_version TEXT DEFAULT 'v1',  -- For tracking algorithm changes
  factors JSONB DEFAULT '{}',  -- Detailed breakdown of how scores were calculated

  -- Each customer has one set of indices per calculation timestamp
  UNIQUE(customer_id, calculated_at)
);

-- Performance indexes
CREATE INDEX idx_indices_customer_latest ON public.customer_category_indices(customer_id, calculated_at DESC);
CREATE INDEX idx_indices_company ON public.customer_category_indices(company_id);
CREATE INDEX idx_indices_priority ON public.customer_category_indices(company_id, priority_score DESC)
  WHERE priority_score IS NOT NULL;
CREATE INDEX idx_indices_risk ON public.customer_category_indices(company_id, risk_score DESC)
  WHERE risk_score IS NOT NULL;

-- Comments
COMMENT ON TABLE public.customer_category_indices IS 'Calculated indices and scores per customer - the core scoring table';
COMMENT ON COLUMN public.customer_category_indices.adoption_index IS 'Product depth index (0-100) - how fully customer uses the product';
COMMENT ON COLUMN public.customer_category_indices.engagement_index IS 'Activity frequency index (0-100) - how often customer interacts';
COMMENT ON COLUMN public.customer_category_indices.sentiment_index IS 'Customer satisfaction index (0-100) - ratings, feedback, NPS';
COMMENT ON COLUMN public.customer_category_indices.business_index IS 'Commercial health index (0-100) - ARR, growth, payment';
COMMENT ON COLUMN public.customer_category_indices.external_index IS 'Market factors index (0-100) - industry trends, competitor activity';
COMMENT ON COLUMN public.customer_category_indices.health_index IS 'Overall health (weighted average of category indices)';
COMMENT ON COLUMN public.customer_category_indices.risk_score IS 'Churn risk (0-100, higher = more at risk)';
COMMENT ON COLUMN public.customer_category_indices.opportunity_score IS 'Expansion opportunity (0-100, higher = more opportunity)';
COMMENT ON COLUMN public.customer_category_indices.priority_score IS 'Queue priority (higher = work on first)';
COMMENT ON COLUMN public.customer_category_indices.factors IS 'JSONB breakdown of calculation: {weights, signals, multipliers}';
