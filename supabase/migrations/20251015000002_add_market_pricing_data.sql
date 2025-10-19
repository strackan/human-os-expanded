-- ============================================================================
-- Add Market Pricing Data to Customer Properties
-- Purpose: Support expansion pricing scenarios with market data
-- Phase: 2B.1 (Data Extraction)
-- ============================================================================

-- Add market pricing columns to customer_properties table
ALTER TABLE public.customer_properties
ADD COLUMN IF NOT EXISTS market_price_average DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS market_percentile INTEGER CHECK (market_percentile >= 0 AND market_percentile <= 100),
ADD COLUMN IF NOT EXISTS price_gap DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS similar_customer_range TEXT,
ADD COLUMN IF NOT EXISTS opportunity_value TEXT;

-- Add usage metrics columns (for expansion calculations)
ALTER TABLE public.customer_properties
ADD COLUMN IF NOT EXISTS active_users INTEGER,
ADD COLUMN IF NOT EXISTS license_capacity INTEGER,
ADD COLUMN IF NOT EXISTS utilization_percent INTEGER,
ADD COLUMN IF NOT EXISTS yoy_growth INTEGER,
ADD COLUMN IF NOT EXISTS last_month_growth INTEGER,
ADD COLUMN IF NOT EXISTS peak_usage INTEGER,
ADD COLUMN IF NOT EXISTS adoption_rate INTEGER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_properties_market_data
ON public.customer_properties(customer_id, market_price_average)
WHERE market_price_average IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_properties_usage_metrics
ON public.customer_properties(customer_id, utilization_percent)
WHERE utilization_percent IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.customer_properties.market_price_average IS 'Average market price per seat for similar customers';
COMMENT ON COLUMN public.customer_properties.market_percentile IS 'Percentile position of customer pricing (0-100)';
COMMENT ON COLUMN public.customer_properties.price_gap IS 'Dollar difference between customer price and market average';
COMMENT ON COLUMN public.customer_properties.similar_customer_range IS 'Price range of similar customers (formatted string)';
COMMENT ON COLUMN public.customer_properties.opportunity_value IS 'Estimated expansion opportunity value (formatted string)';

COMMENT ON COLUMN public.customer_properties.active_users IS 'Number of active users in last 30 days';
COMMENT ON COLUMN public.customer_properties.license_capacity IS 'Total licensed seat capacity';
COMMENT ON COLUMN public.customer_properties.utilization_percent IS 'Utilization percentage (active_users / capacity * 100)';
COMMENT ON COLUMN public.customer_properties.yoy_growth IS 'Year-over-year user growth percentage';
COMMENT ON COLUMN public.customer_properties.last_month_growth IS 'Last month user growth percentage';
COMMENT ON COLUMN public.customer_properties.peak_usage IS 'Peak concurrent users (historical high)';
COMMENT ON COLUMN public.customer_properties.adoption_rate IS 'Percentage of provisioned users who are active';

DO $$
BEGIN
  RAISE NOTICE 'Customer properties extended with market pricing and usage data columns';
END $$;
