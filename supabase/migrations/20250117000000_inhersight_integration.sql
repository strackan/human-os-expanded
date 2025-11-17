-- ============================================================================
-- INHERSIGHT INTEGRATION - RELEASE 0.1.9
-- ============================================================================
-- Purpose: Extend schema to support InHerSight customer success data
-- Key Features:
--   1. Enhanced interaction tracking (sentiment, channel, outcome)
--   2. Package/product mix details for contracts
--   3. Contact enhancements (department, seniority)
--   4. User status field for password reset requirement
--   5. CSV import staging tables
-- ============================================================================

-- ============================================================================
-- PART 1: PROFILE ENHANCEMENTS
-- ============================================================================

-- Add status column to profiles (0=Disabled, 1=Active, 2=Pending/Reset Required)
-- This enables forced password reset on first login
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status INTEGER DEFAULT 1 CHECK (status IN (0, 1, 2));

COMMENT ON COLUMN public.profiles.status IS
  'User account status: 0=Disabled, 1=Active, 2=Pending (password reset required)';

-- Create index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ============================================================================
-- PART 2: ENHANCED INTERACTION TRACKING
-- ============================================================================

-- Extend events table with InHerSight-style interaction tracking
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS interaction_type TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT CHECK (channel IN ('outbound', 'inbound', 'automated')),
  ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated')),
  ADD COLUMN IF NOT EXISTS outcome TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE;

COMMENT ON COLUMN public.events.interaction_type IS
  'Type of interaction: email, call, meeting, support_ticket, demo, article_inclusion, social_mention, etc.';
COMMENT ON COLUMN public.events.channel IS
  'Communication channel: outbound (CSM-initiated), inbound (customer-initiated), automated (system-generated)';
COMMENT ON COLUMN public.events.sentiment IS
  'Customer sentiment during interaction: positive, neutral, negative, frustrated';
COMMENT ON COLUMN public.events.outcome IS
  'Interaction result: resolved, pending, escalated, opportunity_identified, concern_raised, etc.';
COMMENT ON COLUMN public.events.follow_up_required IS
  'Whether this interaction requires follow-up action';
COMMENT ON COLUMN public.events.follow_up_date IS
  'Target date for follow-up (if required)';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_interaction_type ON public.events(interaction_type);
CREATE INDEX IF NOT EXISTS idx_events_sentiment ON public.events(sentiment);
CREATE INDEX IF NOT EXISTS idx_events_follow_up ON public.events(follow_up_required, follow_up_date)
  WHERE follow_up_required = true;

-- ============================================================================
-- PART 3: CONTRACT/PACKAGE ENHANCEMENTS
-- ============================================================================

-- Add InHerSight package/product details to contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS product_mix JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS add_ons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT;

COMMENT ON COLUMN public.contracts.product_mix IS
  'Array of products included in package: [{"name": "Profile Enhancement", "quantity": 1, "cost": 5000}, ...]';
COMMENT ON COLUMN public.contracts.add_ons IS
  'Additional purchased items: [{"name": "Featured Article", "quantity": 2, "cost": 1500}, ...]';
COMMENT ON COLUMN public.contracts.payment_terms IS
  'Payment schedule: annual, monthly, quarterly, custom';

-- Create index for product mix queries
CREATE INDEX IF NOT EXISTS idx_contracts_product_mix ON public.contracts USING GIN (product_mix);

-- ============================================================================
-- PART 4: CONTACT ENHANCEMENTS
-- ============================================================================

-- Add InHerSight-specific contact fields
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS seniority_level TEXT,
  ADD COLUMN IF NOT EXISTS decision_making_power TEXT CHECK (decision_making_power IN ('high', 'medium', 'low'));

COMMENT ON COLUMN public.contacts.department IS
  'Department: HR, Marketing, Talent Acquisition, Operations, Executive, etc.';
COMMENT ON COLUMN public.contacts.seniority_level IS
  'Seniority: C-level, VP, Director, Manager, Individual Contributor';
COMMENT ON COLUMN public.contacts.decision_making_power IS
  'Influence level on renewal/expansion decisions: high, medium, low';

-- Create index for decision-maker queries
CREATE INDEX IF NOT EXISTS idx_contacts_decision_power ON public.contacts(decision_making_power)
  WHERE decision_making_power = 'high';

-- ============================================================================
-- PART 5: INHERSIGHT-SPECIFIC METRICS TRACKING
-- ============================================================================

-- Create table for InHerSight-specific engagement metrics
CREATE TABLE IF NOT EXISTS public.customer_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Time period for metrics
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- InHerSight brand exposure metrics
  brand_impressions INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  profile_completion_pct DECIMAL(5,2) DEFAULT 0,

  -- Job posting metrics
  job_matches INTEGER DEFAULT 0,
  apply_clicks INTEGER DEFAULT 0,
  job_conversion_rate DECIMAL(5,2) DEFAULT 0,

  -- Content metrics
  article_inclusions INTEGER DEFAULT 0,
  social_mentions INTEGER DEFAULT 0,

  -- Ratings & feedback
  new_ratings INTEGER DEFAULT 0,
  new_submissions INTEGER DEFAULT 0,
  ihs_score_change DECIMAL(5,2) DEFAULT 0,

  -- Engagement indicators
  follower_growth INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,

  -- Metadata
  is_demo BOOLEAN DEFAULT false,
  data_source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(customer_id, period_start, period_end)
);

COMMENT ON TABLE public.customer_engagement_metrics IS
  'InHerSight-specific customer engagement metrics tracked over time periods';
COMMENT ON COLUMN public.customer_engagement_metrics.brand_impressions IS
  'Number of times brand was shown to users on InHerSight platform';
COMMENT ON COLUMN public.customer_engagement_metrics.profile_completion_pct IS
  'Percentage of profile fields completed (0-100)';
COMMENT ON COLUMN public.customer_engagement_metrics.data_source IS
  'Source of data: manual, csv_import, api, calculated';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_engagement_customer ON public.customer_engagement_metrics(customer_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_company ON public.customer_engagement_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_engagement_period ON public.customer_engagement_metrics(period_start, period_end);

-- ============================================================================
-- PART 6: CSV IMPORT STAGING TABLES
-- ============================================================================

-- Create staging table for InHerSight CSV imports
CREATE TABLE IF NOT EXISTS public.inhersight_import_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Import metadata
  import_batch_id UUID NOT NULL,
  import_date TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID REFERENCES auth.users(id),
  file_name TEXT,
  row_number INTEGER,

  -- Import status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'imported', 'failed', 'skipped')),
  error_message TEXT,

  -- Raw CSV data (flexible JSONB to handle any CSV structure)
  raw_data JSONB NOT NULL,

  -- Mapped data (after transformation)
  mapped_customer_data JSONB,
  mapped_contact_data JSONB,
  mapped_contract_data JSONB,
  mapped_metrics_data JSONB,

  -- Deduplication key
  dedup_key TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.inhersight_import_staging IS
  'Staging table for CSV imports from InHerSight - validates and transforms before inserting into main tables';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_import_batch ON public.inhersight_import_staging(import_batch_id, status);
CREATE INDEX IF NOT EXISTS idx_import_dedup ON public.inhersight_import_staging(dedup_key);
CREATE INDEX IF NOT EXISTS idx_import_company ON public.inhersight_import_staging(company_id);

-- Create import batches tracking table
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Batch info
  batch_name TEXT,
  file_name TEXT,
  total_rows INTEGER DEFAULT 0,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partially_completed')),
  rows_imported INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,

  -- User info
  imported_by UUID REFERENCES auth.users(id),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Results
  import_summary JSONB,
  error_log JSONB
);

COMMENT ON TABLE public.import_batches IS
  'Tracks CSV import batches and their overall status';

CREATE INDEX IF NOT EXISTS idx_batches_company ON public.import_batches(company_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.import_batches(status);

-- ============================================================================
-- PART 7: HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate engagement score from metrics
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_brand_impressions INTEGER,
  p_profile_views INTEGER,
  p_apply_clicks INTEGER,
  p_article_inclusions INTEGER,
  p_new_ratings INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0;
BEGIN
  -- Weighted scoring algorithm
  -- Brand impressions: 0.2 weight (max 10 points)
  v_score := v_score + LEAST((p_brand_impressions / 1000.0) * 0.2, 10);

  -- Profile views: 0.3 weight (max 15 points)
  v_score := v_score + LEAST((p_profile_views / 500.0) * 0.3, 15);

  -- Apply clicks: 0.3 weight (max 15 points)
  v_score := v_score + LEAST((p_apply_clicks / 100.0) * 0.3, 15);

  -- Article inclusions: 0.15 weight (max 7.5 points)
  v_score := v_score + LEAST((p_article_inclusions / 5.0) * 0.15, 7.5);

  -- New ratings: 0.05 weight (max 2.5 points)
  v_score := v_score + LEAST((p_new_ratings / 10.0) * 0.05, 2.5);

  -- Return score out of 50 (normalized to 0-50 scale)
  RETURN LEAST(v_score, 50);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_engagement_score IS
  'Calculates weighted engagement score (0-50) from InHerSight metrics';

-- Function to auto-update engagement_score on insert/update
CREATE OR REPLACE FUNCTION auto_calculate_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.engagement_score := calculate_engagement_score(
    NEW.brand_impressions,
    NEW.profile_views,
    NEW.apply_clicks,
    NEW.article_inclusions,
    NEW.new_ratings
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_engagement_score ON public.customer_engagement_metrics;
CREATE TRIGGER trigger_auto_engagement_score
  BEFORE INSERT OR UPDATE ON public.customer_engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_engagement_score();

-- ============================================================================
-- PART 8: RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.customer_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inhersight_import_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- Customer engagement metrics policies
CREATE POLICY "Users see only their company's engagement metrics"
  ON public.customer_engagement_metrics FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR is_demo_mode()
  );

CREATE POLICY "Users can insert engagement metrics for their company"
  ON public.customer_engagement_metrics FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their company's engagement metrics"
  ON public.customer_engagement_metrics FOR UPDATE
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Import staging policies
CREATE POLICY "Users see only their company's import staging"
  ON public.inhersight_import_staging FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert import staging for their company"
  ON public.inhersight_import_staging FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Import batches policies
CREATE POLICY "Users see only their company's import batches"
  ON public.import_batches FOR SELECT
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create import batches for their company"
  ON public.import_batches FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their company's import batches"
  ON public.import_batches FOR UPDATE
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- PART 9: SEED DATA
-- ============================================================================

-- Add InHerSight as a recognized company (for later use)
-- Only insert if it doesn't already exist
INSERT INTO public.companies (name, domain)
SELECT 'InHerSight', 'inhersight.com'
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies WHERE name = 'InHerSight' OR domain = 'inhersight.com'
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'InHerSight Integration Migration (0.1.9) completed successfully';
  RAISE NOTICE 'Added: user status, enhanced interactions, contract details, engagement metrics, CSV import staging';
END $$;
