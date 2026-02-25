-- ============================================================================
-- Manual Contract Migration Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- PART 1: Add term_months column (auto-calculated from dates)
-- ============================================================================

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS term_months INTEGER
GENERATED ALWAYS AS (
  EXTRACT(YEAR FROM age(end_date, start_date)) * 12 +
  EXTRACT(MONTH FROM age(end_date, start_date))
) STORED;

COMMENT ON COLUMN public.contracts.term_months IS
'Auto-calculated contract term in months based on start_date and end_date. This is a generated column and cannot be manually set.';

ALTER TABLE public.contracts
ADD CONSTRAINT IF NOT EXISTS contracts_end_date_after_start_date
CHECK (end_date > start_date);

-- PART 2: Create contract_terms table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,

  -- Pricing Terms
  pricing_model TEXT,
  discount_percent DECIMAL(5,2),
  volume_discounts JSONB DEFAULT '{}'::jsonb,
  payment_terms TEXT DEFAULT 'net_30',
  invoicing_schedule TEXT,

  -- Renewal Terms
  auto_renewal BOOLEAN DEFAULT true,
  auto_renewal_notice_days INTEGER DEFAULT 60,
  renewal_price_cap_percent DECIMAL(5,2),
  non_renewal_penalty DECIMAL(12,2),

  -- Service Level Terms
  sla_uptime_percent DECIMAL(5,2),
  support_tier TEXT,
  response_time_hours INTEGER,
  support_hours TEXT,
  dedicated_csm BOOLEAN DEFAULT false,

  -- Legal/Liability Terms
  liability_cap TEXT DEFAULT '12_months_fees',
  liability_cap_amount DECIMAL(12,2),
  indemnification_terms TEXT,
  data_residency TEXT[],
  data_retention_days INTEGER DEFAULT 90,

  -- Entitlements/Features
  included_features TEXT[] DEFAULT ARRAY[]::TEXT[],
  excluded_features TEXT[] DEFAULT ARRAY[]::TEXT[],
  usage_limits JSONB DEFAULT '{}'::jsonb,
  overage_pricing JSONB DEFAULT '{}'::jsonb,

  -- Custom/Special Terms
  custom_terms JSONB DEFAULT '{}'::jsonb,
  master_service_agreement_url TEXT,
  data_processing_agreement_url TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_terms_contract
ON public.contract_terms(contract_id);

CREATE INDEX IF NOT EXISTS idx_contract_terms_auto_renewal
ON public.contract_terms(auto_renewal, auto_renewal_notice_days)
WHERE auto_renewal = true;

CREATE INDEX IF NOT EXISTS idx_contract_terms_pricing_model
ON public.contract_terms(pricing_model);

CREATE INDEX IF NOT EXISTS idx_contract_terms_support_tier
ON public.contract_terms(support_tier);

CREATE INDEX IF NOT EXISTS idx_contract_terms_liability
ON public.contract_terms(liability_cap);

CREATE INDEX IF NOT EXISTS idx_contract_terms_custom_terms
ON public.contract_terms USING gin(custom_terms);

CREATE INDEX IF NOT EXISTS idx_contract_terms_usage_limits
ON public.contract_terms USING gin(usage_limits);

-- Update trigger
CREATE OR REPLACE FUNCTION public.update_contract_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contract_terms_updated_at ON public.contract_terms;
CREATE TRIGGER trigger_update_contract_terms_updated_at
BEFORE UPDATE ON public.contract_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_contract_terms_updated_at();

-- PART 3: Create contract_matrix view
-- ============================================================================

CREATE OR REPLACE VIEW public.contract_matrix AS
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

-- Helper function
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

-- PART 4: Add Obsidian Black contract terms
-- ============================================================================

INSERT INTO public.contract_terms (
  contract_id,
  pricing_model,
  discount_percent,
  payment_terms,
  invoicing_schedule,
  auto_renewal,
  auto_renewal_notice_days,
  renewal_price_cap_percent,
  sla_uptime_percent,
  support_tier,
  response_time_hours,
  support_hours,
  dedicated_csm,
  liability_cap,
  data_residency,
  data_retention_days,
  included_features,
  usage_limits,
  custom_terms,
  notes
)
SELECT
  c.id,
  'per_seat',
  18,
  'net_30',
  'annual',
  true,
  90,
  20,
  99.9,
  'premium',
  4,
  '24x5',
  true,
  '12_months_fees',
  ARRAY['us'],
  90,
  ARRAY['api_access', 'sso', 'advanced_analytics', 'custom_integrations', 'priority_support'],
  '{"api_calls_per_month": 2000000, "storage_gb": 250, "concurrent_users": 100}'::jsonb,
  '{"quarterly_business_reviews": true, "annual_roadmap_session": false, "dedicated_slack_channel": false}'::jsonb,
  'At-risk account (7/10 churn risk) with relationship challenges but strong product fit (87% adoption, 28% YoY growth). Over-utilized (115%) and below-market pricing (32nd percentile).'
FROM public.contracts c
JOIN public.customers cu ON c.customer_id = cu.id
WHERE cu.name ILIKE '%obsidian%black%'
  AND c.status = 'active'
ON CONFLICT (contract_id) DO UPDATE SET
  pricing_model = EXCLUDED.pricing_model,
  discount_percent = EXCLUDED.discount_percent,
  auto_renewal_notice_days = EXCLUDED.auto_renewal_notice_days,
  updated_at = NOW();

-- PART 5: Verification queries
-- ============================================================================

-- Check term_months was calculated
SELECT
  '✅ Contract with term_months' as check,
  contract_number,
  start_date,
  end_date,
  term_months || ' months' as term
FROM public.contracts
WHERE contract_number = 'OBSBLK-CONTRACT-2024';

-- Check contract_terms was created
SELECT
  '✅ Contract Terms' as check,
  pricing_model,
  support_tier,
  auto_renewal_notice_days || ' days' as notice_period,
  liability_cap
FROM public.contract_terms ct
JOIN public.contracts c ON ct.contract_id = c.id
WHERE c.contract_number = 'OBSBLK-CONTRACT-2024';

-- Check contract_matrix view
SELECT
  '✅ Contract Matrix' as check,
  customer_name,
  arr,
  seats,
  term_months,
  pricing_model,
  support_tier,
  days_until_renewal,
  in_renewal_window
FROM public.contract_matrix
WHERE customer_name ILIKE '%obsidian%black%';
