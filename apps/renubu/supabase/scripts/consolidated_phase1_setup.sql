-- ============================================================================
-- CONSOLIDATED PHASE 1.0 SETUP
-- ============================================================================
-- This script applies all missing migrations and seeds test data
-- Safe to run multiple times (idempotent)
--
-- Steps:
-- 1. Phase 3: Add workflow_id, slide_sequence, slide_contexts columns
-- 2. Phase 1: Add trigger columns (wake_triggers, trigger_fired_at, etc.)
-- 3. Seed obsidian-black-renewal workflow definition
--
-- To apply: Copy this entire file and paste into Supabase SQL Editor
-- https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/sql/new
-- ============================================================================

-- ============================================================================
-- STEP 1: PHASE 3 - EXTEND WORKFLOW_DEFINITIONS
-- ============================================================================

-- Add workflow_id column
ALTER TABLE public.workflow_definitions
  ADD COLUMN IF NOT EXISTS workflow_id VARCHAR(100);

-- Populate workflow_id from name for existing rows (convert to kebab-case)
UPDATE public.workflow_definitions
SET workflow_id = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE workflow_id IS NULL;

-- Make workflow_id NOT NULL after populating
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_definitions'
    AND column_name = 'workflow_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.workflow_definitions ALTER COLUMN workflow_id SET NOT NULL;
  END IF;
END $$;

-- Add multi-tenant and slide columns
ALTER TABLE public.workflow_definitions
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS slide_sequence TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slide_contexts JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_stock_workflow BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cloned_from UUID REFERENCES public.workflow_definitions(id),
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Drop old unique constraint if exists
ALTER TABLE public.workflow_definitions
  DROP CONSTRAINT IF EXISTS workflow_definitions_name_key;

-- Add unique constraint per company (allows same workflow_id across companies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_workflow_per_company'
  ) THEN
    ALTER TABLE public.workflow_definitions
      ADD CONSTRAINT unique_workflow_per_company
      UNIQUE(company_id, workflow_id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_company
  ON public.workflow_definitions(company_id);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_stock
  ON public.workflow_definitions(is_stock_workflow)
  WHERE is_stock_workflow = true;

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_workflow_id
  ON public.workflow_definitions(workflow_id);

-- ============================================================================
-- STEP 2: PHASE 1 - ADD TRIGGER COLUMNS TO WORKFLOW_EXECUTIONS
-- ============================================================================

-- Add wake_triggers column (stores trigger configurations)
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS wake_triggers JSONB DEFAULT NULL;

-- Add trigger evaluation tracking columns
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS last_evaluated_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trigger_fired_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fired_trigger_type TEXT DEFAULT NULL;

-- Add GIN index on wake_triggers for efficient querying
CREATE INDEX IF NOT EXISTS idx_workflow_executions_wake_triggers
  ON public.workflow_executions USING GIN (wake_triggers)
  WHERE wake_triggers IS NOT NULL;

-- Add index for snoozed workflows evaluation
CREATE INDEX IF NOT EXISTS idx_workflow_executions_snoozed_evaluation
  ON public.workflow_executions(status, last_evaluated_at)
  WHERE status = 'snoozed' AND wake_triggers IS NOT NULL;

-- Add index for trigger fired lookups
CREATE INDEX IF NOT EXISTS idx_workflow_executions_trigger_fired
  ON public.workflow_executions(trigger_fired_at DESC)
  WHERE trigger_fired_at IS NOT NULL;

-- ============================================================================
-- STEP 3: CREATE TRIGGER HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_wake_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,

  -- Trigger details
  trigger_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,

  -- Evaluation result
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result TEXT NOT NULL CHECK (result IN ('pending', 'fired', 'error')),
  error_message TEXT,

  -- Context
  evaluated_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trigger history
CREATE INDEX IF NOT EXISTS idx_workflow_wake_triggers_execution
  ON public.workflow_wake_triggers(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_wake_triggers_evaluated_at
  ON public.workflow_wake_triggers(evaluated_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_wake_triggers_result
  ON public.workflow_wake_triggers(result, evaluated_at DESC);

-- RLS for trigger history
ALTER TABLE public.workflow_wake_triggers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view trigger history for their workflows
DROP POLICY IF EXISTS "Users can view trigger history for their workflows"
  ON public.workflow_wake_triggers;

CREATE POLICY "Users can view trigger history for their workflows"
  ON public.workflow_wake_triggers
  FOR SELECT
  TO authenticated
  USING (
    workflow_execution_id IN (
      SELECT id FROM public.workflow_executions
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: CREATE HELPER FUNCTION FOR BATCH EVALUATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_snoozed_workflows_for_evaluation(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  workflow_id TEXT,
  customer_id TEXT,
  wake_triggers JSONB,
  snoozed_at TIMESTAMPTZ,
  last_evaluated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.user_id,
    we.workflow_id,
    we.customer_id,
    we.wake_triggers,
    we.snoozed_at,
    we.last_evaluated_at
  FROM public.workflow_executions we
  WHERE we.status = 'snoozed'
    AND we.wake_triggers IS NOT NULL
    AND (
      we.last_evaluated_at IS NULL
      OR we.last_evaluated_at < NOW() - INTERVAL '1 day'
    )
  ORDER BY we.last_evaluated_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: SEED OBSIDIAN-BLACK-RENEWAL WORKFLOW
-- ============================================================================

INSERT INTO public.workflow_definitions (
  workflow_id,
  name,
  workflow_type,
  description,
  slide_sequence,
  slide_contexts,
  is_active,
  is_demo,
  priority_weight,
  company_id,
  created_at,
  updated_at
) VALUES (
  'obsidian-black-renewal',
  'Obsidian Black Renewal',
  'renewal',
  'Renewal workflow using V2 template-based architecture',

  -- slide_sequence: array of slide IDs
  ARRAY[
    'greeting',
    'review-account',
    'pricing-analysis-v2',
    'prepare-quote-v2',
    'draft-email-v2',
    'workflow-summary-v2'
  ],

  -- slide_contexts: JSONB with per-slide configuration
  '{
    "greeting": {
      "purpose": "renewal_preparation",
      "urgency": "critical",
      "variables": {
        "showPlanningChecklist": true,
        "checklistItems": [
          "Review account health and contract details",
          "Analyze current pricing vs. market benchmarks",
          "Generate optimized renewal quote",
          "Draft personalized outreach email",
          "Create action plan and next steps"
        ],
        "checklistTitle": "Here''s what we''ll accomplish together:",
        "greetingText": "Good afternoon, Justin. You''ve got one critical task for today:\n\n**Renewal Planning for {{customer.name}}.**\n\nWe need to review contract terms, make sure we''ve got the right contacts, and put our initial forecast in.\n\nThe full plan is on the right. Ready to get started?",
        "buttons": [
          {
            "label": "Review Later",
            "value": "snooze",
            "label-background": "bg-gray-500 hover:bg-gray-600",
            "label-text": "text-white"
          },
          {
            "label": "Let''s Begin!",
            "value": "start",
            "label-background": "bg-blue-600 hover:bg-blue-700",
            "label-text": "text-white"
          }
        ]
      }
    },
    "review-account": {
      "purpose": "renewal",
      "variables": {
        "ask_for_assessment": false,
        "focus_metrics": ["arr", "price_per_seat", "renewal_date", "health_score", "utilization", "yoy_growth"],
        "insightText": "Please review {{customer.name}}''s current status to the right:\n\n**Key Insights:**\n• 20% usage increase over prior month\n• 4 months to renewal - time to engage\n• Paying less per unit than 65% of customers - Room for expansion\n• Recent negative comments in support - May need to investigate\n• Key contract items - 5% limit on price increases. Consider amendment.\n\nMake sure you''ve reviewed the contract and stakeholder. When you''re ready, click to move onto pricing.",
        "buttonLabel": "Analyze Pricing Strategy"
      }
    }
  }'::jsonb,

  true,  -- is_active
  true,  -- is_demo
  500,   -- priority_weight
  NULL,  -- company_id (stock workflow)
  NOW(),
  NOW()
)
ON CONFLICT (company_id, workflow_id)
DO UPDATE SET
  name = EXCLUDED.name,
  workflow_type = EXCLUDED.workflow_type,
  description = EXCLUDED.description,
  slide_sequence = EXCLUDED.slide_sequence,
  slide_contexts = EXCLUDED.slide_contexts,
  is_active = EXCLUDED.is_active,
  is_demo = EXCLUDED.is_demo,
  priority_weight = EXCLUDED.priority_weight,
  updated_at = NOW();

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
  AND column_name IN ('wake_triggers', 'trigger_fired_at', 'fired_trigger_type', 'last_evaluated_at')
ORDER BY column_name;

-- Check workflow_definitions columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_definitions'
  AND column_name IN ('workflow_id', 'slide_sequence', 'slide_contexts', 'company_id')
ORDER BY column_name;

-- Verify workflow was inserted
SELECT
  workflow_id,
  name,
  workflow_type,
  array_length(slide_sequence, 1) as slide_count,
  is_demo,
  is_active
FROM public.workflow_definitions
WHERE workflow_id = 'obsidian-black-renewal';

-- Check trigger history table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'workflow_wake_triggers'
) as trigger_history_table_exists;

-- ============================================================================
-- DONE!
-- ============================================================================
-- If all verification queries return results, Phase 1.0 is ready for testing!
-- Next steps:
--   1. Run: npx tsx scripts/seed-obsidian-black.ts (to seed customer data)
--   2. Test at: http://localhost:3000/test-snooze
-- ============================================================================
