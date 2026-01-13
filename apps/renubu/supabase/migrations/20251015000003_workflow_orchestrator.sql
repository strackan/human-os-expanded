-- ============================================================================
-- Workflow Orchestrator Schema
-- ============================================================================
-- Purpose: Add workflow orchestration system for intelligent task prioritization
-- Phase: 2C (Orchestrator Architecture)
-- ============================================================================

-- Create workflow_definitions table (workflow blueprints/templates)
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN ('opportunity', 'risk', 'strategic', 'renewal', 'custom')),
    description TEXT,

    -- Trigger conditions stored as JSONB for flexibility
    -- Example: {"opportunity_score_min": 7, "days_before_renewal": 60}
    trigger_conditions JSONB DEFAULT '{}'::jsonb,

    -- Base priority weight for this workflow type
    priority_weight INTEGER DEFAULT 500,

    is_active BOOLEAN DEFAULT true,
    is_demo BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: workflow_executions table already exists from previous migration
-- Extensions to workflow_executions are handled in 20251015000004_extend_workflow_executions.sql

-- Create indexes for workflow_definitions
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_type ON public.workflow_definitions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_active ON public.workflow_definitions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflow_definitions
DROP POLICY IF EXISTS "Authenticated users can access workflow_definitions" ON public.workflow_definitions;
CREATE POLICY "Authenticated users can access workflow_definitions" ON public.workflow_definitions
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow public read access for demo workflows
DROP POLICY IF EXISTS "Allow public read for demo workflow_definitions" ON public.workflow_definitions;
CREATE POLICY "Allow public read for demo workflow_definitions"
ON public.workflow_definitions FOR SELECT
USING (is_demo = true);

-- Create function to calculate priority score
CREATE OR REPLACE FUNCTION public.calculate_workflow_priority(execution_id UUID)
RETURNS INTEGER AS $$
DECLARE
    exec_record RECORD;
    days_overdue INTEGER;
    base_priority INTEGER;
    result INTEGER;
BEGIN
    -- Get execution record with related data
    SELECT
        we.*,
        wd.workflow_type,
        wd.priority_weight,
        cp.revenue_impact_tier,
        cp.churn_risk_score,
        cp.usage_score
    INTO exec_record
    FROM public.workflow_executions we
    JOIN public.workflow_definitions wd ON we.workflow_definition_id = wd.id
    LEFT JOIN public.customer_properties cp ON we.customer_id = cp.customer_id
    WHERE we.id = execution_id;

    -- Handle snoozed workflows
    IF exec_record.status = 'snoozed' AND exec_record.snooze_until IS NOT NULL THEN
        days_overdue := EXTRACT(DAY FROM (NOW() - exec_record.snooze_until));

        IF days_overdue >= -3 THEN
            -- Due in ≤3 days or already overdue: CRITICAL tier
            RETURN 1000 + days_overdue;
        ELSE
            -- Due in >3 days (future): LOW tier
            RETURN 400 - ABS(days_overdue);
        END IF;
    END IF;

    -- Active workflows: base priority by type
    base_priority := CASE exec_record.workflow_type
        WHEN 'risk' THEN 900
        WHEN 'opportunity' THEN 800
        WHEN 'strategic' THEN 700
        WHEN 'renewal' THEN 600
        WHEN 'custom' THEN 500
        ELSE 500
    END;

    -- Add signal boost (0-100)
    result := base_priority;

    -- Add revenue impact boost (0-25)
    IF exec_record.revenue_impact_tier IS NOT NULL THEN
        result := result + (exec_record.revenue_impact_tier * 5);
    END IF;

    -- Add churn risk boost for risk workflows (0-50)
    IF exec_record.workflow_type = 'risk' AND exec_record.churn_risk_score IS NOT NULL THEN
        result := result + (exec_record.churn_risk_score * 5);
    END IF;

    -- Add usage score boost for opportunity workflows (0-10)
    IF exec_record.workflow_type = 'opportunity' AND exec_record.usage_score IS NOT NULL THEN
        result := result + (exec_record.usage_score / 10);
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update all priority scores (to be run daily)
CREATE OR REPLACE FUNCTION public.update_all_workflow_priorities()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    exec_id UUID;
    new_priority INTEGER;
BEGIN
    -- Update priority for all active executions
    FOR exec_id IN
        SELECT id FROM public.workflow_executions
        WHERE status IN ('not_started', 'underway', 'snoozed')
    LOOP
        new_priority := public.calculate_workflow_priority(exec_id);

        UPDATE public.workflow_executions
        SET priority_score = new_priority, updated_at = NOW()
        WHERE id = exec_id;

        updated_count := updated_count + 1;
    END LOOP;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ Workflow orchestrator schema created' as status;
SELECT COUNT(*) || ' workflow_definitions' as count FROM public.workflow_definitions;
SELECT COUNT(*) || ' workflow_executions' as count FROM public.workflow_executions;
