/**
 * Customer Feature Flags System
 *
 * Purpose: Enable per-customer feature toggles for design partner customization
 * Use Case: Different UX/functionality for different customers during beta
 *
 * Example Usage:
 * -- Enable beta pricing for Company A
 * INSERT INTO customer_features (company_id, feature_key, enabled, config)
 * VALUES ('[company-id]', 'workflow.renewal.advanced_pricing', true, '{"version": "v2"}');
 *
 * -- Check feature in application
 * SELECT enabled, config FROM customer_features
 * WHERE company_id = '[company-id]' AND feature_key = 'workflow.renewal.advanced_pricing';
 */

-- =====================================================
-- 1. Create customer_features table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customer_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to company
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Feature identifier (e.g. 'workflow.renewal.show_pricing_beta')
  feature_key TEXT NOT NULL,

  -- Feature state
  enabled BOOLEAN DEFAULT false,

  -- Optional JSON configuration for the feature
  -- Can store feature-specific settings like: {"version": "v2", "options": {...}}
  config JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),

  -- Ensure one feature setting per company
  UNIQUE(company_id, feature_key)
);

-- Index for fast feature lookups
CREATE INDEX IF NOT EXISTS idx_customer_features_lookup
ON public.customer_features(company_id, feature_key)
WHERE enabled = true;

-- Index for feature management queries
CREATE INDEX IF NOT EXISTS idx_customer_features_key
ON public.customer_features(feature_key);

COMMENT ON TABLE public.customer_features IS
'Per-customer feature flags for design partner customization and A/B testing';

COMMENT ON COLUMN public.customer_features.feature_key IS
'Feature identifier using dot notation: area.module.feature (e.g. workflow.renewal.advanced_pricing)';

COMMENT ON COLUMN public.customer_features.config IS
'Optional JSON configuration specific to the feature. Can store version, options, or other settings.';

-- =====================================================
-- 2. Row Level Security Policies
-- =====================================================

ALTER TABLE public.customer_features ENABLE ROW LEVEL SECURITY;

-- Users can only see features for their company (or in demo mode)
CREATE POLICY "customer_features_select_policy"
ON public.customer_features
FOR SELECT USING (
  is_demo_mode() OR
  company_id = get_user_company_id()
);

-- Users can only insert features for their company (or in demo mode)
CREATE POLICY "customer_features_insert_policy"
ON public.customer_features
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  company_id = get_user_company_id()
);

-- Users can only update features for their company (or in demo mode)
CREATE POLICY "customer_features_update_policy"
ON public.customer_features
FOR UPDATE USING (
  is_demo_mode() OR
  company_id = get_user_company_id()
);

-- Users can only delete features for their company (or in demo mode)
CREATE POLICY "customer_features_delete_policy"
ON public.customer_features
FOR DELETE USING (
  is_demo_mode() OR
  company_id = get_user_company_id()
);

-- =====================================================
-- 3. Helper Function: Get Customer Feature
-- =====================================================

CREATE OR REPLACE FUNCTION get_customer_feature(
  p_feature_key TEXT,
  p_company_id UUID DEFAULT NULL
)
RETURNS TABLE (
  enabled BOOLEAN,
  config JSONB
) AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Use provided company_id or get from current user
  v_company_id := COALESCE(p_company_id, get_user_company_id());

  -- Return feature status and config
  RETURN QUERY
  SELECT cf.enabled, cf.config
  FROM public.customer_features cf
  WHERE cf.company_id = v_company_id
    AND cf.feature_key = p_feature_key;

  -- If no row found, return default (disabled, empty config)
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '{}'::JSONB;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_customer_feature IS
'Check if a feature is enabled for a company and get its configuration';

-- =====================================================
-- 4. Updated Timestamp Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_customer_features_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_features_updated_at
BEFORE UPDATE ON public.customer_features
FOR EACH ROW
EXECUTE FUNCTION update_customer_features_timestamp();

-- =====================================================
-- 5. Sample Feature Keys (for documentation)
-- =====================================================

/*
Recommended Feature Key Naming Convention:
- Format: {area}.{module}.{feature}
- Examples:
  - workflow.renewal.advanced_pricing
  - workflow.renewal.contract_terms_v2
  - dashboard.metrics.beta_charts
  - dashboard.quick_actions.ai_suggestions
  - artifacts.quote.editable_inline
  - artifacts.contract.version_tracking
  - chat.ai.premium_models
  - reports.export.advanced_formats

Usage in Application:
  const { enabled, config } = await getCustomerFeature('workflow.renewal.advanced_pricing');
  if (enabled) {
    // Show beta pricing component
    const version = config.version; // Access config values
  }
*/

-- =====================================================
-- 6. Grant Permissions
-- =====================================================

-- Grant access to authenticated users (RLS will handle company isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_features TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_feature TO authenticated;

-- Service role has full access for admin operations
GRANT ALL ON public.customer_features TO service_role;
