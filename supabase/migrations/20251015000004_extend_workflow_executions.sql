-- ============================================================================
-- Extend Workflow Executions for Orchestrator
-- ============================================================================
-- Purpose: Add orchestrator-specific columns to existing workflow_executions table
-- Phase: 2C (Orchestrator Architecture)
-- ============================================================================

-- Make workflow_name nullable (orchestrator uses workflow_definition.name instead)
ALTER TABLE public.workflow_executions
ALTER COLUMN workflow_name DROP NOT NULL;

-- Add missing columns to workflow_executions
ALTER TABLE public.workflow_executions
ADD COLUMN IF NOT EXISTS workflow_definition_id UUID REFERENCES public.workflow_definitions(id),
ADD COLUMN IF NOT EXISTS assigned_csm_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS escalation_user_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS snooze_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS snooze_days INTEGER,
ADD COLUMN IF NOT EXISTS snoozed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS skipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS execution_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS skip_reason TEXT,
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_assigned_csm ON public.workflow_executions(assigned_csm_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_priority ON public.workflow_executions(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_snooze ON public.workflow_executions(snooze_until) WHERE status = 'snoozed';
CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer ON public.workflow_executions(customer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_not_started ON public.workflow_executions(status) WHERE status = 'not_started';

-- Enable RLS if not already enabled
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Authenticated users can access workflow_executions" ON public.workflow_executions;
CREATE POLICY "Authenticated users can access workflow_executions" ON public.workflow_executions
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow public read access for demo workflows
DROP POLICY IF EXISTS "Allow public read for demo workflow_executions" ON public.workflow_executions;
CREATE POLICY "Allow public read for demo workflow_executions"
ON public.workflow_executions FOR SELECT
USING (is_demo = true);

DO $$
BEGIN
  RAISE NOTICE 'Workflow executions table extended for orchestrator';
END $$;
