-- ============================================================================
-- APPLY PHASE 1.1 (SKIP) AND PHASE 1.2 (ESCALATE) MIGRATIONS
-- ============================================================================
--
-- This script consolidates all necessary migrations to enable Skip and Escalate
-- functionality. Run this in Supabase SQL Editor.
--
-- Steps:
-- 1. Fix workflow_wake_triggers table schema (if needed)
-- 2. Apply Phase 1.0.1 (Trigger Logic)
-- 3. Apply Phase 1.1 (Skip Triggers)
-- 4. Apply Phase 1.2 (Escalate Triggers)
--
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX WORKFLOW_WAKE_TRIGGERS SCHEMA
-- ============================================================================

-- Add missing columns to workflow_wake_triggers table
ALTER TABLE public.workflow_wake_triggers
  ADD COLUMN IF NOT EXISTS evaluation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_fired BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments
COMMENT ON COLUMN public.workflow_wake_triggers.evaluation_count IS
'Number of times this trigger has been evaluated. Useful for debugging trigger evaluation frequency.';

COMMENT ON COLUMN public.workflow_wake_triggers.is_fired IS
'Whether this trigger has fired and woke the workflow.';

COMMENT ON COLUMN public.workflow_wake_triggers.fired_at IS
'Timestamp when this trigger fired.';

COMMENT ON COLUMN public.workflow_wake_triggers.updated_at IS
'Timestamp when this record was last updated.';

-- ============================================================================
-- STEP 2: PHASE 1.0.1 - TRIGGER LOGIC
-- ============================================================================

-- Add wake_trigger_logic column to workflow_executions table
ALTER TABLE workflow_executions
ADD COLUMN IF NOT EXISTS wake_trigger_logic TEXT DEFAULT 'OR';

-- Add comment to column
COMMENT ON COLUMN workflow_executions.wake_trigger_logic IS
'How to combine wake triggers: OR (any trigger fires) or AND (all triggers must fire). Defaults to OR for backward compatibility.';

-- Add check constraint to ensure valid values (drop first if exists)
ALTER TABLE workflow_executions DROP CONSTRAINT IF EXISTS wake_trigger_logic_valid_values;
ALTER TABLE workflow_executions
ADD CONSTRAINT wake_trigger_logic_valid_values
CHECK (wake_trigger_logic IN ('OR', 'AND'));

-- Create index for efficient querying by logic type
CREATE INDEX IF NOT EXISTS idx_workflow_executions_trigger_logic
ON workflow_executions(wake_trigger_logic)
WHERE status = 'snoozed';

-- ============================================================================
-- STEP 3: PHASE 1.1 - SKIP TRIGGERS
-- ============================================================================

-- Add skip trigger columns to workflow_executions
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS skip_triggers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skip_trigger_logic TEXT DEFAULT 'OR' CHECK (skip_trigger_logic IN ('OR', 'AND')),
  ADD COLUMN IF NOT EXISTS skip_last_evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS skip_trigger_fired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS skip_fired_trigger_type TEXT;

-- Add skipped_at column (for workflows in 'skipped' status)
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS skipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS skip_reason TEXT;

-- Add comments
COMMENT ON COLUMN public.workflow_executions.skip_triggers IS
'Array of trigger configurations that can reactivate this workflow from skipped state. Same structure as wake_triggers.';

COMMENT ON COLUMN public.workflow_executions.skip_trigger_logic IS
'How to combine skip triggers: OR (any trigger fires) or AND (all triggers must fire). Defaults to OR.';

COMMENT ON COLUMN public.workflow_executions.skipped_at IS
'Timestamp when workflow was skipped. Cleared when workflow is reactivated.';

COMMENT ON COLUMN public.workflow_executions.skip_reason IS
'Optional reason provided when workflow was skipped.';

-- Create workflow_skip_triggers history table
CREATE TABLE IF NOT EXISTS public.workflow_skip_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent workflow execution
  workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,

  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('date', 'event')),
  trigger_config JSONB NOT NULL,

  -- Evaluation state
  is_fired BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMPTZ,
  evaluation_count INTEGER DEFAULT 0,
  fired_at TIMESTAMPTZ,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.workflow_skip_triggers IS
'History and debugging log for skip trigger evaluations. Tracks when triggers are evaluated, if they fire, and any errors.';

-- Create indexes for workflow_skip_triggers
CREATE INDEX IF NOT EXISTS idx_workflow_skip_triggers_execution
  ON public.workflow_skip_triggers(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_skip_triggers_fired
  ON public.workflow_skip_triggers(is_fired, trigger_type);

-- Enable RLS on workflow_skip_triggers
ALTER TABLE public.workflow_skip_triggers ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflow_skip_triggers
DROP POLICY IF EXISTS "Users can view their workflow skip triggers" ON public.workflow_skip_triggers;
CREATE POLICY "Users can view their workflow skip triggers"
  ON public.workflow_skip_triggers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_skip_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

DROP POLICY IF EXISTS "Users can create workflow skip triggers" ON public.workflow_skip_triggers;
CREATE POLICY "Users can create workflow skip triggers"
  ON public.workflow_skip_triggers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_skip_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

DROP POLICY IF EXISTS "Users can update workflow skip triggers" ON public.workflow_skip_triggers;
CREATE POLICY "Users can update workflow skip triggers"
  ON public.workflow_skip_triggers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_skip_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_workflow_skip_trigger_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflow_skip_triggers_updated_at ON public.workflow_skip_triggers;

CREATE TRIGGER workflow_skip_triggers_updated_at
    BEFORE UPDATE ON public.workflow_skip_triggers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_skip_trigger_timestamp();

-- Create helper function to get skipped workflows
CREATE OR REPLACE FUNCTION public.get_skipped_workflows_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  workflow_execution_id UUID,
  skip_triggers JSONB,
  skip_last_evaluated_at TIMESTAMPTZ,
  customer_id UUID,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.skip_triggers,
    we.skip_last_evaluated_at,
    we.customer_id,
    we.user_id
  FROM public.workflow_executions we
  WHERE we.status = 'skipped'
    AND we.skip_triggers IS NOT NULL
    AND jsonb_array_length(we.skip_triggers) > 0
    AND (
      we.skip_last_evaluated_at IS NULL
      OR we.skip_last_evaluated_at < NOW() - (p_evaluation_interval_minutes || ' minutes')::INTERVAL
    )
  ORDER BY we.skip_last_evaluated_at ASC NULLS FIRST
  LIMIT 100; -- Process 100 workflows per cron run
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_skipped_workflows_for_evaluation IS
'Returns skipped workflows with triggers that need evaluation. Called by cron job every 5 minutes.';

-- ============================================================================
-- STEP 4: PHASE 1.2 - ESCALATE TRIGGERS
-- ============================================================================

-- Add escalate trigger columns to workflow_executions
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS escalate_triggers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS escalate_trigger_logic TEXT DEFAULT 'OR' CHECK (escalate_trigger_logic IN ('OR', 'AND')),
  ADD COLUMN IF NOT EXISTS escalate_last_evaluated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalate_trigger_fired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalate_fired_trigger_type TEXT;

-- Add escalated_at column and escalate_to_user_id
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalate_reason TEXT,
  ADD COLUMN IF NOT EXISTS escalate_to_user_id UUID REFERENCES auth.users(id);

-- Add comments
COMMENT ON COLUMN public.workflow_executions.escalate_triggers IS
'Array of trigger configurations that notify when escalation conditions are met. Same structure as wake_triggers.';

COMMENT ON COLUMN public.workflow_executions.escalate_trigger_logic IS
'How to combine escalate triggers: OR (any trigger fires) or AND (all triggers must fire). Defaults to OR.';

COMMENT ON COLUMN public.workflow_executions.escalated_at IS
'Timestamp when workflow was escalated. Cleared when workflow is resolved.';

COMMENT ON COLUMN public.workflow_executions.escalate_reason IS
'Optional reason provided when workflow was escalated.';

COMMENT ON COLUMN public.workflow_executions.escalate_to_user_id IS
'User ID to which the workflow was escalated.';

-- Create workflow_escalate_triggers history table
CREATE TABLE IF NOT EXISTS public.workflow_escalate_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent workflow execution
  workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,

  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('date', 'event')),
  trigger_config JSONB NOT NULL,

  -- Evaluation state
  is_fired BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMPTZ,
  evaluation_count INTEGER DEFAULT 0,
  fired_at TIMESTAMPTZ,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.workflow_escalate_triggers IS
'History and debugging log for escalate trigger evaluations. Tracks when triggers are evaluated, if they fire, and any errors.';

-- Create indexes for workflow_escalate_triggers
CREATE INDEX IF NOT EXISTS idx_workflow_escalate_triggers_execution
  ON public.workflow_escalate_triggers(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_escalate_triggers_fired
  ON public.workflow_escalate_triggers(is_fired, trigger_type);

-- Enable RLS on workflow_escalate_triggers
ALTER TABLE public.workflow_escalate_triggers ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflow_escalate_triggers
DROP POLICY IF EXISTS "Users can view their workflow escalate triggers" ON public.workflow_escalate_triggers;
CREATE POLICY "Users can view their workflow escalate triggers"
  ON public.workflow_escalate_triggers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_escalate_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

DROP POLICY IF EXISTS "Users can create workflow escalate triggers" ON public.workflow_escalate_triggers;
CREATE POLICY "Users can create workflow escalate triggers"
  ON public.workflow_escalate_triggers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_escalate_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

DROP POLICY IF EXISTS "Users can update workflow escalate triggers" ON public.workflow_escalate_triggers;
CREATE POLICY "Users can update workflow escalate triggers"
  ON public.workflow_escalate_triggers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_executions we
      WHERE we.id = workflow_escalate_triggers.workflow_execution_id
      AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
    )
  );

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_workflow_escalate_trigger_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflow_escalate_triggers_updated_at ON public.workflow_escalate_triggers;

CREATE TRIGGER workflow_escalate_triggers_updated_at
    BEFORE UPDATE ON public.workflow_escalate_triggers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_escalate_trigger_timestamp();

-- Create helper function to get escalated workflows
CREATE OR REPLACE FUNCTION public.get_escalated_workflows_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  workflow_execution_id UUID,
  escalate_triggers JSONB,
  escalate_last_evaluated_at TIMESTAMPTZ,
  customer_id UUID,
  user_id UUID,
  escalate_to_user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.escalate_triggers,
    we.escalate_last_evaluated_at,
    we.customer_id,
    we.user_id,
    we.escalate_to_user_id
  FROM public.workflow_executions we
  WHERE we.status = 'escalated'
    AND we.escalate_triggers IS NOT NULL
    AND jsonb_array_length(we.escalate_triggers) > 0
    AND (
      we.escalate_last_evaluated_at IS NULL
      OR we.escalate_last_evaluated_at < NOW() - (p_evaluation_interval_minutes || ' minutes')::INTERVAL
    )
  ORDER BY we.escalate_last_evaluated_at ASC NULLS FIRST
  LIMIT 100; -- Process 100 workflows per cron run
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_escalated_workflows_for_evaluation IS
'Returns escalated workflows with triggers that need evaluation. Called by cron job every 5 minutes.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check workflow_executions columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_executions'
  AND column_name IN (
    'wake_trigger_logic',
    'skip_triggers', 'skip_trigger_logic', 'skip_last_evaluated_at', 'skip_trigger_fired_at', 'skip_fired_trigger_type', 'skipped_at', 'skip_reason',
    'escalate_triggers', 'escalate_trigger_logic', 'escalate_last_evaluated_at', 'escalate_trigger_fired_at', 'escalate_fired_trigger_type', 'escalated_at', 'escalate_reason', 'escalate_to_user_id'
  )
ORDER BY column_name;

-- Check new tables exist
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('workflow_skip_triggers', 'workflow_escalate_triggers')
ORDER BY table_name;

-- ============================================================================
-- STEP 5: PHASE 1.2B - CONVERT ESCALATE TO REVIEW-ONLY MODE
-- ============================================================================

-- Rename escalate columns to review columns (using DO blocks for IF EXISTS logic)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflow_executions' AND column_name = 'escalate_triggers'
  ) THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_triggers TO review_triggers;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflow_executions' AND column_name = 'escalate_trigger_logic'
  ) THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_trigger_logic TO review_trigger_logic;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflow_executions' AND column_name = 'escalate_last_evaluated_at'
  ) THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_last_evaluated_at TO review_last_evaluated_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflow_executions' AND column_name = 'escalate_trigger_fired_at'
  ) THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_trigger_fired_at TO review_trigger_fired_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflow_executions' AND column_name = 'escalate_fired_trigger_type'
  ) THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_fired_trigger_type TO review_fired_trigger_type;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflow_executions' AND column_name = 'escalate_to_user_id'
  ) THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_to_user_id TO reviewer_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflow_executions' AND column_name = 'escalated_at'
  ) THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalated_at TO review_requested_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workflow_executions' AND column_name = 'escalate_reason'
  ) THEN
    ALTER TABLE public.workflow_executions RENAME COLUMN escalate_reason TO review_reason;
  END IF;
END $$;

-- Add review-specific columns
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending', 'approved', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_comments TEXT;

-- Add step-level review columns
ALTER TABLE public.workflow_step_executions
  ADD COLUMN IF NOT EXISTS review_required_from UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending', 'approved', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_comments TEXT;

-- Rename workflow_escalate_triggers → workflow_review_triggers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'workflow_escalate_triggers'
  ) THEN
    ALTER TABLE public.workflow_escalate_triggers RENAME TO workflow_review_triggers;
  END IF;
END $$;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Check workflow_executions columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_executions'
  AND (column_name LIKE '%review%' OR column_name LIKE '%skip%')
ORDER BY column_name;

-- Check new tables exist
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('workflow_skip_triggers', 'workflow_review_triggers')
ORDER BY table_name;

-- Check step-level review columns
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_step_executions'
  AND column_name LIKE '%review%'
ORDER BY column_name;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Phase 1.1 (Skip) and Phase 1.2B (Review) are ready for testing!
--
-- Next steps:
--   1. Test Skip at: http://localhost:3000/test-skip
--   2. Test Review at: http://localhost:3000/test-escalate (will be renamed to test-review)
-- ============================================================================
