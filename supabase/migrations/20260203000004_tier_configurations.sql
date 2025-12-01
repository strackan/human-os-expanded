-- ============================================================================
-- Tier Configurations Table
-- Created: 2025-11-29
-- Purpose: Define customer tiers based on ARR with priority multipliers
--          Supports multi-tenant tier definitions per company
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tier_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Tier identification
  tier_key TEXT NOT NULL,
  tier_name TEXT NOT NULL,
  tier_order INTEGER NOT NULL,  -- For sorting (1 = highest tier)

  -- ARR thresholds (min inclusive, max exclusive)
  min_arr DECIMAL(12,2),
  max_arr DECIMAL(12,2),

  -- Priority multiplier (applied to base priority score)
  priority_multiplier DECIMAL(4,2) DEFAULT 1.0 CHECK (priority_multiplier >= 0.1 AND priority_multiplier <= 10.0),

  -- SLA expectations
  response_time_hours INTEGER,  -- Expected response time for this tier
  touches_per_quarter INTEGER,  -- Expected CSM touches per quarter

  -- Metadata
  color_hex TEXT,  -- For UI display (e.g., '#FFD700' for gold)
  icon_name TEXT,  -- Icon identifier for UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, tier_key)
);

-- Index
CREATE INDEX idx_tier_configs_company ON public.tier_configurations(company_id, tier_order);

-- Comments
COMMENT ON TABLE public.tier_configurations IS 'Customer tier definitions with ARR thresholds and priority multipliers';
COMMENT ON COLUMN public.tier_configurations.tier_order IS 'Sort order (1 = highest/most important tier)';
COMMENT ON COLUMN public.tier_configurations.priority_multiplier IS 'Multiplier applied to base priority score (e.g., 5.0 = 5x priority)';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tier_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tier_configurations_updated_at
  BEFORE UPDATE ON public.tier_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_tier_configurations_updated_at();

-- ============================================================================
-- Insert Default InHerSight Tier Configuration
-- ============================================================================
-- Note: This inserts for company_id that must exist. In practice, this would
-- be done via seed data or application code when company is created.
-- Showing the pattern here for reference.
--
-- INSERT INTO public.tier_configurations (company_id, tier_key, tier_name, tier_order, min_arr, max_arr, priority_multiplier, color_hex)
-- VALUES
--   ('[company_id]', 'enterprise', 'Enterprise', 1, 100000, NULL, 5.0, '#FFD700'),
--   ('[company_id]', 'mid_market', 'Mid-Market', 2, 25000, 100000, 2.5, '#C0C0C0'),
--   ('[company_id]', 'smb', 'SMB', 3, 5000, 25000, 1.0, '#CD7F32'),
--   ('[company_id]', 'digital', 'Digital', 4, NULL, 5000, 0.5, '#808080');
