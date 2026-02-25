-- ============================================================================
-- Phase 1.0 Schema Fix
-- Fixes workflow_wake_triggers table schema mismatch
-- ============================================================================

BEGIN;

-- Drop and recreate the table with correct schema
DROP TABLE IF EXISTS workflow_wake_triggers CASCADE;

CREATE TABLE workflow_wake_triggers (
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

-- Add comments
COMMENT ON TABLE workflow_wake_triggers IS 'History and debugging log for trigger evaluations';
COMMENT ON COLUMN workflow_wake_triggers.is_fired IS 'Whether this trigger has fired';
COMMENT ON COLUMN workflow_wake_triggers.evaluated_at IS 'When this trigger was last evaluated';
COMMENT ON COLUMN workflow_wake_triggers.fired_at IS 'When this trigger fired';

-- Create indexes
CREATE INDEX idx_workflow_wake_triggers_workflow_id
    ON workflow_wake_triggers(workflow_execution_id);

CREATE INDEX idx_workflow_wake_triggers_fired
    ON workflow_wake_triggers(is_fired, workflow_execution_id);

-- Enable RLS
ALTER TABLE workflow_wake_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

CREATE POLICY "System can manage workflow triggers"
    ON workflow_wake_triggers
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

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

COMMIT;

SELECT 'workflow_wake_triggers table fixed!' as message;
