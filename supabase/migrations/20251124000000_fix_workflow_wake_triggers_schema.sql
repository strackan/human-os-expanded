-- ============================================================================
-- Fix workflow_wake_triggers Schema
-- ============================================================================
--
-- This migration aligns the workflow_wake_triggers table with Phase 1.0 spec
-- The table was created by consolidated_phase1_setup.sql with a different schema
-- We need to add missing columns that Phase 1.0 migration expects
--
-- Changes:
-- 1. Add evaluation_count column (Phase 1.0 expects this)
-- 2. Add is_fired column (Phase 1.0 expects this)
-- 3. Add fired_at column (Phase 1.0 expects this)
-- 4. Add updated_at column (Phase 1.0 expects this)
-- ============================================================================

-- Add missing columns to workflow_wake_triggers table
ALTER TABLE public.workflow_wake_triggers
  ADD COLUMN IF NOT EXISTS evaluation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_fired BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill is_fired and fired_at only if result column exists
DO $$
BEGIN
  -- Check if result column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workflow_wake_triggers'
    AND column_name = 'result'
  ) THEN
    -- Backfill is_fired based on result column
    UPDATE public.workflow_wake_triggers
    SET is_fired = (result = 'fired')
    WHERE is_fired IS NULL;

    -- Backfill fired_at based on evaluated_at for fired triggers
    UPDATE public.workflow_wake_triggers
    SET fired_at = evaluated_at
    WHERE result = 'fired' AND fired_at IS NULL;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.workflow_wake_triggers.evaluation_count IS
'Number of times this trigger has been evaluated. Useful for debugging trigger evaluation frequency.';

COMMENT ON COLUMN public.workflow_wake_triggers.is_fired IS
'Whether this trigger has fired and woke the workflow.';

COMMENT ON COLUMN public.workflow_wake_triggers.fired_at IS
'Timestamp when this trigger fired.';

COMMENT ON COLUMN public.workflow_wake_triggers.updated_at IS
'Timestamp when this record was last updated.';

-- Create trigger for automatic timestamp updates (if not exists)
CREATE OR REPLACE FUNCTION public.update_workflow_wake_trigger_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflow_wake_triggers_updated_at ON public.workflow_wake_triggers;

CREATE TRIGGER workflow_wake_triggers_updated_at
    BEFORE UPDATE ON public.workflow_wake_triggers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_wake_trigger_timestamp();

-- ============================================================================
-- Verification
-- ============================================================================

-- Check all required columns exist
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(c.column_name)
  INTO missing_columns
  FROM (
    VALUES ('evaluation_count'), ('is_fired'), ('fired_at'), ('updated_at')
  ) AS required(column_name)
  LEFT JOIN information_schema.columns c
    ON c.table_schema = 'public'
    AND c.table_name = 'workflow_wake_triggers'
    AND c.column_name = required.column_name
  WHERE c.column_name IS NULL;

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Missing columns in workflow_wake_triggers: %', array_to_string(missing_columns, ', ');
  END IF;

  RAISE NOTICE 'All required columns exist in workflow_wake_triggers table';
END $$;
