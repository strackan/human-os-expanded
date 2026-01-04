-- ============================================================================
-- Customer Signals Table
-- Created: 2025-11-29
-- Purpose: Time-series storage of customer signals with normalized values
--          Supports historical tracking and trend analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Signal identification
  signal_key TEXT NOT NULL,

  -- Values
  raw_value DECIMAL(15,4) NOT NULL,
  normalized_value DECIMAL(5,2),  -- 0-100 scale after normalization

  -- Temporal
  recorded_at TIMESTAMPTZ NOT NULL,
  period_type TEXT DEFAULT 'monthly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),

  -- Provenance
  data_source TEXT,  -- e.g., 'inhersight_import', 'manual_entry', 'api_sync'
  import_batch_id TEXT,  -- For tracking which import created this signal

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each signal can only have one value per customer per timestamp
  UNIQUE(customer_id, signal_key, recorded_at)
);

-- Performance indexes
CREATE INDEX idx_signals_customer_recent ON public.customer_signals(customer_id, recorded_at DESC);
CREATE INDEX idx_signals_company ON public.customer_signals(company_id);
CREATE INDEX idx_signals_lookup ON public.customer_signals(customer_id, signal_key, recorded_at DESC);
CREATE INDEX idx_signals_batch ON public.customer_signals(import_batch_id) WHERE import_batch_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.customer_signals IS 'Time-series storage of customer signals for scoring calculations';
COMMENT ON COLUMN public.customer_signals.raw_value IS 'Original value from source system before normalization';
COMMENT ON COLUMN public.customer_signals.normalized_value IS 'Value normalized to 0-100 scale using signal_configurations rules';
COMMENT ON COLUMN public.customer_signals.recorded_at IS 'When this signal value was recorded (may be in past for historical data)';
