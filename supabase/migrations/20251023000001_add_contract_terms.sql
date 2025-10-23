-- Contract Terms Table
-- Stores business/legal terms that remain constant during contract lifecycle
-- Examples: auto-renewal periods, liability caps, SLA levels, pricing models

CREATE TABLE public.contract_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,

  -- Pricing Terms
  pricing_model TEXT, -- 'per_seat', 'usage_based', 'custom', 'flat_fee', 'tiered'
  discount_percent DECIMAL(5,2), -- Overall discount percentage
  volume_discounts JSONB DEFAULT '{}'::jsonb, -- { "50-100": 10, "100-200": 15, "200+": 20 }
  payment_terms TEXT DEFAULT 'net_30', -- 'net_30', 'net_60', 'prepaid_annual', 'quarterly'
  invoicing_schedule TEXT, -- 'monthly', 'quarterly', 'annual', 'custom'

  -- Renewal Terms
  auto_renewal BOOLEAN DEFAULT true,
  auto_renewal_notice_days INTEGER DEFAULT 60, -- 30, 60, 90, 120 days notice required
  renewal_price_cap_percent DECIMAL(5,2), -- Max % price increase allowed on renewal
  non_renewal_penalty DECIMAL(12,2), -- Early termination fee if applicable

  -- Service Level Terms
  sla_uptime_percent DECIMAL(5,2), -- 99.9%, 99.99%, 99.999%
  support_tier TEXT, -- 'standard', 'premium', 'enterprise', 'white_glove'
  response_time_hours INTEGER, -- Support response SLA in hours
  support_hours TEXT, -- 'business_hours', '24x5', '24x7'
  dedicated_csm BOOLEAN DEFAULT false,

  -- Legal/Liability Terms
  liability_cap TEXT DEFAULT '12_months_fees', -- 'unlimited', '12_months_fees', '6_months_fees', 'custom'
  liability_cap_amount DECIMAL(12,2), -- If liability_cap is 'custom'
  indemnification_terms TEXT, -- 'standard', 'mutual', 'custom'
  data_residency TEXT[], -- ['us', 'eu', 'apac', 'uk']
  data_retention_days INTEGER DEFAULT 90, -- Days data retained after contract end

  -- Entitlements/Features
  included_features TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['api_access', 'sso', 'custom_integrations']
  excluded_features TEXT[] DEFAULT ARRAY[]::TEXT[], -- Features explicitly excluded
  usage_limits JSONB DEFAULT '{}'::jsonb, -- { "api_calls": 1000000, "storage_gb": 500 }
  overage_pricing JSONB DEFAULT '{}'::jsonb, -- { "api_calls_per_1000": 0.10, "storage_gb": 5.00 }

  -- Custom/Special Terms
  custom_terms JSONB DEFAULT '{}'::jsonb, -- Any additional special terms
  master_service_agreement_url TEXT, -- Link to MSA
  data_processing_agreement_url TEXT, -- Link to DPA

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_contract_terms_contract
ON public.contract_terms(contract_id);

CREATE INDEX idx_contract_terms_auto_renewal
ON public.contract_terms(auto_renewal, auto_renewal_notice_days)
WHERE auto_renewal = true;

CREATE INDEX idx_contract_terms_pricing_model
ON public.contract_terms(pricing_model);

CREATE INDEX idx_contract_terms_support_tier
ON public.contract_terms(support_tier);

CREATE INDEX idx_contract_terms_liability
ON public.contract_terms(liability_cap);

-- GIN index for JSONB queries
CREATE INDEX idx_contract_terms_custom_terms
ON public.contract_terms USING gin(custom_terms);

CREATE INDEX idx_contract_terms_usage_limits
ON public.contract_terms USING gin(usage_limits);

-- Comments
COMMENT ON TABLE public.contract_terms IS
'Business and legal terms that remain constant during contract lifecycle. One record per contract.';

COMMENT ON COLUMN public.contract_terms.auto_renewal_notice_days IS
'Number of days notice required before auto-renewal. Common values: 30, 60, 90, 120';

COMMENT ON COLUMN public.contract_terms.liability_cap IS
'Liability limitation type. Common values: unlimited, 12_months_fees, 6_months_fees, custom';

COMMENT ON COLUMN public.contract_terms.volume_discounts IS
'JSON object mapping seat ranges to discount percentages. Example: {"50-100": 10, "100-200": 15}';

COMMENT ON COLUMN public.contract_terms.usage_limits IS
'JSON object defining usage limits. Example: {"api_calls_per_month": 1000000, "storage_gb": 500}';

COMMENT ON COLUMN public.contract_terms.custom_terms IS
'JSON object for special contract terms. Example: {"custom_branding": true, "qbrs_per_year": 4}';

-- Update trigger
CREATE OR REPLACE FUNCTION public.update_contract_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_terms_updated_at
BEFORE UPDATE ON public.contract_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_contract_terms_updated_at();

-- Contract Matrix View
-- Provides a comprehensive view of contracts with their terms
CREATE OR REPLACE VIEW public.contract_matrix AS
SELECT
  c.id as contract_id,
  c.contract_number,
  cu.id as customer_id,
  cu.name as customer_name,
  cu.tier as customer_tier,

  -- Contract basics
  c.start_date,
  c.end_date,
  c.term_months,
  c.arr,
  c.seats,
  c.status,

  -- Key terms
  ct.pricing_model,
  ct.discount_percent,
  ct.payment_terms,
  ct.auto_renewal,
  ct.auto_renewal_notice_days,
  ct.renewal_price_cap_percent,

  -- Service levels
  ct.sla_uptime_percent,
  ct.support_tier,
  ct.response_time_hours,
  ct.dedicated_csm,

  -- Legal
  ct.liability_cap,
  ct.data_residency,

  -- Features
  ct.included_features,
  ct.usage_limits,

  -- Calculated fields
  (c.arr / c.seats / 12) as price_per_seat_per_month,
  (c.end_date - CURRENT_DATE) as days_until_renewal,
  CASE
    WHEN c.end_date - CURRENT_DATE <= ct.auto_renewal_notice_days
    THEN true
    ELSE false
  END as in_renewal_window

FROM public.contracts c
JOIN public.customers cu ON c.customer_id = cu.id
LEFT JOIN public.contract_terms ct ON c.id = ct.contract_id
WHERE c.status = 'active'
ORDER BY c.end_date ASC;

COMMENT ON VIEW public.contract_matrix IS
'Comprehensive view of active contracts with their business terms. Useful for contract analysis and renewal planning.';

-- Helper function to check if contract is in auto-renewal window
CREATE OR REPLACE FUNCTION public.is_in_auto_renewal_window(contract_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  days_until_end INTEGER;
  notice_days INTEGER;
BEGIN
  SELECT
    (c.end_date - CURRENT_DATE),
    COALESCE(ct.auto_renewal_notice_days, 60)
  INTO days_until_end, notice_days
  FROM contracts c
  LEFT JOIN contract_terms ct ON c.id = ct.contract_id
  WHERE c.id = contract_id_param;

  RETURN days_until_end <= notice_days AND days_until_end >= 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.is_in_auto_renewal_window IS
'Returns true if contract is currently in its auto-renewal notice window';
