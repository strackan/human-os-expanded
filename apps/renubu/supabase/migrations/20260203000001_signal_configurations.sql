-- ============================================================================
-- Signal Configurations Table
-- Created: 2025-11-29
-- Purpose: Define how customer signals are normalized and categorized
--          Supports multi-tenant configuration per company
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.signal_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Signal identification
  signal_key TEXT NOT NULL,
  signal_name TEXT NOT NULL,
  description TEXT,

  -- Categorization (5 categories)
  category TEXT NOT NULL CHECK (category IN ('adoption', 'engagement', 'sentiment', 'business', 'external')),

  -- Normalization configuration
  normalization_type TEXT DEFAULT 'linear' CHECK (normalization_type IN ('linear', 'log', 'percentile', 'inverse')),
  min_value DECIMAL(15,4),
  max_value DECIMAL(15,4),

  -- Weighting for category index calculation
  weight DECIMAL(5,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 10),

  -- Signal impact flags
  is_risk_signal BOOLEAN DEFAULT false,
  is_opportunity_signal BOOLEAN DEFAULT false,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  source_field TEXT,  -- Original field name in source system (e.g., 'brand_impressions')
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, signal_key)
);

-- Indexes
CREATE INDEX idx_signal_configs_company ON public.signal_configurations(company_id);
CREATE INDEX idx_signal_configs_category ON public.signal_configurations(company_id, category);
CREATE INDEX idx_signal_configs_active ON public.signal_configurations(company_id, is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE public.signal_configurations IS 'Defines how customer signals are normalized into 0-100 scores and categorized for index calculation';
COMMENT ON COLUMN public.signal_configurations.category IS 'Signal category: adoption (product depth), engagement (activity), sentiment (satisfaction), business (commercial), external (market)';
COMMENT ON COLUMN public.signal_configurations.normalization_type IS 'How to normalize: linear (min-max scaling), log (logarithmic), percentile (rank-based), inverse (100 - normalized)';
COMMENT ON COLUMN public.signal_configurations.weight IS 'Weight for category index calculation (higher = more impact on category score)';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_signal_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signal_configurations_updated_at
  BEFORE UPDATE ON public.signal_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_configurations_updated_at();
