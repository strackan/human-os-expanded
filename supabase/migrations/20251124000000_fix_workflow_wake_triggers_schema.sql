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

-- Only run if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'workflow_wake_triggers'
  ) THEN
    -- Add missing columns to workflow_wake_triggers table
    ALTER TABLE public.workflow_wake_triggers
      ADD COLUMN IF NOT EXISTS evaluation_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_fired BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS fired_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Backfill is_fired and fired_at only if result column exists
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

    RAISE NOTICE 'workflow_wake_triggers schema updated';
  ELSE
    RAISE NOTICE 'workflow_wake_triggers table does not exist, skipping migration';
  END IF;
END $$;

-- Only add comments and triggers if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'workflow_wake_triggers'
  ) THEN
    -- Create trigger function for automatic timestamp updates
    CREATE OR REPLACE FUNCTION public.update_workflow_wake_trigger_timestamp()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS workflow_wake_triggers_updated_at ON public.workflow_wake_triggers;

    CREATE TRIGGER workflow_wake_triggers_updated_at
        BEFORE UPDATE ON public.workflow_wake_triggers
        FOR EACH ROW
        EXECUTE FUNCTION public.update_workflow_wake_trigger_timestamp();
  END IF;
END $$;
