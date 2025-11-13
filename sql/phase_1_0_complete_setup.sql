-- ============================================================================
-- Workflow Trigger Framework - Phase 1.0 Complete Setup
-- Run this in Supabase SQL Editor to ensure Phase 1.0 is properly configured
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: workflow_executions columns
-- ============================================================================

-- Add trigger columns if they don't exist
DO $$
BEGIN
    -- wake_triggers
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'workflow_executions' AND column_name = 'wake_triggers'
    ) THEN
        ALTER TABLE workflow_executions ADD COLUMN wake_triggers JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added wake_triggers column';
    END IF;

    -- last_evaluated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'workflow_executions' AND column_name = 'last_evaluated_at'
    ) THEN
        ALTER TABLE workflow_executions ADD COLUMN last_evaluated_at TIMESTAMPTZ;
        RAISE NOTICE 'Added last_evaluated_at column';
    END IF;

    -- trigger_fired_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'workflow_executions' AND column_name = 'trigger_fired_at'
    ) THEN
        ALTER TABLE workflow_executions ADD COLUMN trigger_fired_at TIMESTAMPTZ;
        RAISE NOTICE 'Added trigger_fired_at column';
    END IF;

    -- fired_trigger_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'workflow_executions' AND column_name = 'fired_trigger_type'
    ) THEN
        ALTER TABLE workflow_executions ADD COLUMN fired_trigger_type TEXT;
        RAISE NOTICE 'Added fired_trigger_type column';
    END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN workflow_executions.wake_triggers IS 'Array of trigger configurations that can wake this workflow from snoozed state';
COMMENT ON COLUMN workflow_executions.last_evaluated_at IS 'Timestamp when triggers were last evaluated';
COMMENT ON COLUMN workflow_executions.trigger_fired_at IS 'Timestamp when a trigger fired and woke this workflow';
COMMENT ON COLUMN workflow_executions.fired_trigger_type IS 'Type of trigger that fired (date|event)';

-- ============================================================================
-- SECTION 2: workflow_wake_triggers table (simplified)
-- ============================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_wake_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('date', 'event')),
    trigger_config JSONB NOT NULL,
    is_fired BOOLEAN DEFAULT false,
    evaluated_at TIMESTAMPTZ,
    fired_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_workflow_wake_triggers_workflow_id
    ON workflow_wake_triggers(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_wake_triggers_fired
    ON workflow_wake_triggers(is_fired, workflow_execution_id);

-- ============================================================================
-- SECTION 3: Indexes for workflow_executions
-- ============================================================================

-- Index for finding snoozed workflows with triggers
CREATE INDEX IF NOT EXISTS idx_workflow_executions_snoozed_with_triggers
    ON workflow_executions(status, last_evaluated_at)
    WHERE status = 'snoozed' AND wake_triggers IS NOT NULL AND wake_triggers != '[]'::jsonb;

-- Index for trigger evaluation queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_trigger_fired
    ON workflow_executions(trigger_fired_at, fired_trigger_type)
    WHERE trigger_fired_at IS NOT NULL;

-- ============================================================================
-- SECTION 4: RLS Policies for workflow_wake_triggers
-- ============================================================================

-- Enable RLS
ALTER TABLE workflow_wake_triggers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own workflow triggers" ON workflow_wake_triggers;
DROP POLICY IF EXISTS "System can manage workflow triggers" ON workflow_wake_triggers;
DROP POLICY IF EXISTS "Demo mode: Anyone can view all triggers" ON workflow_wake_triggers;

-- Users can view their own workflow triggers
CREATE POLICY "Users can view their own workflow triggers"
    ON workflow_wake_triggers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workflow_executions we
            WHERE we.id = workflow_wake_triggers.workflow_execution_id
            AND we.user_id = auth.uid()
        )
    );

-- System/service role can manage all triggers
CREATE POLICY "System can manage workflow triggers"
    ON workflow_wake_triggers
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Demo mode bypass (matches existing demo_mode pattern)
CREATE POLICY "Demo mode: Anyone can view all triggers"
    ON workflow_wake_triggers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workflow_executions we
            WHERE we.id = workflow_wake_triggers.workflow_execution_id
            AND we.user_id IN (
                SELECT id FROM profiles
                WHERE email LIKE '%+demo%'
                   OR email = 'demo@renubu.ai'
                   OR email = ANY(ARRAY['wes@renubu.ai', 'support@renubu.ai'])
            )
        )
    );

-- ============================================================================
-- SECTION 5: Verification
-- ============================================================================

-- Check workflow_executions columns
SELECT
    'workflow_executions columns' as check_name,
    jsonb_build_object(
        'wake_triggers', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='workflow_executions' AND column_name='wake_triggers'),
        'last_evaluated_at', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='workflow_executions' AND column_name='last_evaluated_at'),
        'trigger_fired_at', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='workflow_executions' AND column_name='trigger_fired_at'),
        'fired_trigger_type', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='workflow_executions' AND column_name='fired_trigger_type')
    ) as status

UNION ALL

-- Check workflow_wake_triggers table
SELECT
    'workflow_wake_triggers table' as check_name,
    jsonb_build_object(
        'exists', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='workflow_wake_triggers'),
        'rls_enabled', (SELECT relrowsecurity FROM pg_class WHERE relname='workflow_wake_triggers')
    ) as status;

COMMIT;

-- Final message
SELECT 'Phase 1.0 setup complete! ✓' as message;
