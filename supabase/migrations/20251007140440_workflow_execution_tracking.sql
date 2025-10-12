-- ============================================================================
-- Workflow Execution Tracking System
-- Phase 3.2: Backend Workflow Execution & State Tracking
-- ============================================================================
--
-- This migration creates tables to track workflow execution state:
-- - workflow_executions: Overall workflow progress and status
-- - workflow_step_executions: Individual step states and branch paths
--
-- Enables:
-- - Resume workflows from saved state
-- - Track which branches users take
-- - Validate workflow transitions server-side
-- - Analytics and quality scoring
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE WORKFLOW EXECUTION TABLES
-- ============================================================================

-- Main workflow execution tracking table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Workflow identification
    workflow_config_id TEXT NOT NULL, -- e.g., 'simple-renewal', 'strategic-qbr'
    workflow_name TEXT NOT NULL,      -- e.g., 'Simple Renewal Planning'
    workflow_type TEXT,                -- e.g., 'renewal', 'strategic', 'opportunity'

    -- Relationships
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),

    -- Execution state
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'snoozed', 'abandoned')),

    -- Current position
    current_step_id TEXT,              -- e.g., 'analyze-contract'
    current_step_index INTEGER DEFAULT 0,  -- 0-based index
    total_steps INTEGER NOT NULL,      -- Total number of steps in workflow

    -- Progress tracking
    completed_steps_count INTEGER DEFAULT 0,
    skipped_steps_count INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step-level execution tracking table
CREATE TABLE IF NOT EXISTS public.workflow_step_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent workflow
    workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,

    -- Step identification
    step_id TEXT NOT NULL,             -- e.g., 'start-planning'
    step_index INTEGER NOT NULL,       -- 0-based index
    step_title TEXT NOT NULL,          -- e.g., 'Start Planning'
    step_type TEXT,                    -- e.g., 'planning', 'analysis', 'communication'

    -- Execution state
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped', 'snoozed')),

    -- Branch path tracking
    branch_path TEXT[] DEFAULT ARRAY[]::TEXT[],  -- e.g., ['confirm', 'review', 'next']

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB,  -- Additional context, scores, etc.

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one record per step per execution
    UNIQUE(workflow_execution_id, step_id)
);

-- ============================================================================
-- SECTION 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Workflow executions indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer_id
    ON public.workflow_executions(customer_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id
    ON public.workflow_executions(user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
    ON public.workflow_executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_config_id
    ON public.workflow_executions(workflow_config_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_last_activity
    ON public.workflow_executions(last_activity_at DESC);

-- Composite index for finding incomplete workflows for a customer
CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer_incomplete
    ON public.workflow_executions(customer_id, status)
    WHERE status IN ('not_started', 'in_progress', 'snoozed');

-- Step executions indexes
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_workflow_id
    ON public.workflow_step_executions(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_status
    ON public.workflow_step_executions(status);

-- ============================================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_executions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 4: CREATE RLS POLICIES
-- ============================================================================

-- Workflow executions policies
CREATE POLICY "Users can view their own workflow executions"
    ON public.workflow_executions
    FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can create workflow executions"
    ON public.workflow_executions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can update their own workflow executions"
    ON public.workflow_executions
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own workflow executions"
    ON public.workflow_executions
    FOR DELETE
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Step executions policies (inherit from parent workflow execution)
CREATE POLICY "Users can view workflow step executions"
    ON public.workflow_step_executions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workflow_executions we
            WHERE we.id = workflow_step_executions.workflow_execution_id
            AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
        )
    );

CREATE POLICY "Users can create workflow step executions"
    ON public.workflow_step_executions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workflow_executions we
            WHERE we.id = workflow_step_executions.workflow_execution_id
            AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
        )
    );

CREATE POLICY "Users can update workflow step executions"
    ON public.workflow_step_executions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workflow_executions we
            WHERE we.id = workflow_step_executions.workflow_execution_id
            AND (we.user_id = auth.uid() OR auth.role() = 'authenticated')
        )
    );

-- ============================================================================
-- SECTION 5: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_workflow_execution_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_workflow_step_execution_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER workflow_executions_updated_at
    BEFORE UPDATE ON public.workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_execution_timestamp();

CREATE TRIGGER workflow_step_executions_updated_at
    BEFORE UPDATE ON public.workflow_step_executions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workflow_step_execution_timestamp();

-- ============================================================================
-- SECTION 6: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.workflow_executions IS
'Tracks overall workflow execution state and progress. One record per workflow instance.';

COMMENT ON TABLE public.workflow_step_executions IS
'Tracks individual step execution within a workflow. One record per step per workflow execution.';

COMMENT ON COLUMN public.workflow_executions.workflow_config_id IS
'References the workflow configuration ID (e.g., simple-renewal, strategic-qbr)';

COMMENT ON COLUMN public.workflow_step_executions.branch_path IS
'Array of branch values taken in this step, in order (e.g., [confirm, review, next])';

COMMENT ON COLUMN public.workflow_step_executions.metadata IS
'JSONB field for storing additional context like scores, user inputs, or AI suggestions';
