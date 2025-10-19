-- ============================================================================
-- Complete Orchestrator Setup Script
-- ============================================================================
-- Run this in Supabase SQL Editor to set up the orchestrator system
-- ============================================================================

-- STEP 1: Create orchestrator schema
-- ============================================================================

-- Create workflow_definitions table (workflow blueprints/templates)
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN ('opportunity', 'risk', 'strategic', 'renewal', 'custom')),
    description TEXT,
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    priority_weight INTEGER DEFAULT 500,
    is_active BOOLEAN DEFAULT true,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workflow_executions table (actual workflow instances)
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_definition_id UUID REFERENCES public.workflow_definitions(id),
    customer_id UUID REFERENCES public.customers(id),
    assigned_csm_id UUID REFERENCES public.profiles(id),
    escalation_user_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'underway', 'completed', 'snoozed', 'skipped')),
    snooze_until TIMESTAMPTZ,
    snooze_days INTEGER,
    snoozed_at TIMESTAMPTZ,
    priority_score INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    execution_data JSONB DEFAULT '{}'::jsonb,
    skip_reason TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_type ON public.workflow_definitions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_active ON public.workflow_definitions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_executions_assigned_csm ON public.workflow_executions(assigned_csm_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer ON public.workflow_executions(customer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_priority ON public.workflow_executions(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_snooze ON public.workflow_executions(snooze_until) WHERE status = 'snoozed';
CREATE INDEX IF NOT EXISTS idx_workflow_executions_not_started ON public.workflow_executions(status) WHERE status = 'not_started';

-- Enable RLS
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Authenticated users can access workflow_definitions" ON public.workflow_definitions;
CREATE POLICY "Authenticated users can access workflow_definitions" ON public.workflow_definitions
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can access workflow_executions" ON public.workflow_executions;
CREATE POLICY "Authenticated users can access workflow_executions" ON public.workflow_executions
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow public read access for demo workflows
DROP POLICY IF EXISTS "Allow public read for demo workflow_definitions" ON public.workflow_definitions;
CREATE POLICY "Allow public read for demo workflow_definitions"
ON public.workflow_definitions FOR SELECT
USING (is_demo = true);

DROP POLICY IF EXISTS "Allow public read for demo workflow_executions" ON public.workflow_executions;
CREATE POLICY "Allow public read for demo workflow_executions"
ON public.workflow_executions FOR SELECT
USING (is_demo = true);

-- Create priority calculation function
CREATE OR REPLACE FUNCTION public.calculate_workflow_priority(execution_id UUID)
RETURNS INTEGER AS $$
DECLARE
    exec_record RECORD;
    days_overdue INTEGER;
    base_priority INTEGER;
    result INTEGER;
BEGIN
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

    IF exec_record.status = 'snoozed' AND exec_record.snooze_until IS NOT NULL THEN
        days_overdue := EXTRACT(DAY FROM (NOW() - exec_record.snooze_until));
        IF days_overdue >= -3 THEN
            RETURN 1000 + days_overdue;
        ELSE
            RETURN 400 - ABS(days_overdue);
        END IF;
    END IF;

    base_priority := CASE exec_record.workflow_type
        WHEN 'risk' THEN 900
        WHEN 'opportunity' THEN 800
        WHEN 'strategic' THEN 700
        WHEN 'renewal' THEN 600
        WHEN 'custom' THEN 500
        ELSE 500
    END;

    result := base_priority;

    IF exec_record.revenue_impact_tier IS NOT NULL THEN
        result := result + (exec_record.revenue_impact_tier * 5);
    END IF;

    IF exec_record.workflow_type = 'risk' AND exec_record.churn_risk_score IS NOT NULL THEN
        result := result + (exec_record.churn_risk_score * 5);
    END IF;

    IF exec_record.workflow_type = 'opportunity' AND exec_record.usage_score IS NOT NULL THEN
        result := result + (exec_record.usage_score / 10);
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Seed demo workflow definitions
-- ============================================================================

DELETE FROM public.workflow_executions WHERE is_demo = true;
DELETE FROM public.workflow_definitions WHERE is_demo = true;

INSERT INTO public.workflow_definitions (
    id,
    name,
    workflow_type,
    description,
    trigger_conditions,
    priority_weight,
    is_active,
    is_demo
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Complete Strategic Account Plan for Obsidian Black',
    'strategic',
    'At-risk account recovery planning - annual strategic account review',
    jsonb_build_object(
        'workflow_id', 'obsblk-strategic-planning',
        'trigger_type', 'demo_sequence',
        'order', 1
    ),
    700,
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'Expansion Opportunity for Obsidian Black',
    'opportunity',
    'Proactive multi-year expansion with underpriced, high-growth customer',
    jsonb_build_object(
        'workflow_id', 'obsblk-expansion-opportunity',
        'trigger_type', 'demo_sequence',
        'order', 2,
        'opportunity_score_min', 7,
        'utilization_percent_min', 100
    ),
    800,
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    'Executive Engagement with Obsidian Black',
    'risk',
    'Critical executive engagement following Marcus escalation email',
    jsonb_build_object(
        'workflow_id', 'obsblk-executive-engagement',
        'trigger_type', 'demo_sequence',
        'order', 3,
        'risk_score_min', 7,
        'relationship_strength', 'weak'
    ),
    900,
    true,
    true
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ Orchestrator Schema Created' as status;

SELECT
    '✅ Workflow Definitions' as check,
    name,
    workflow_type,
    priority_weight,
    trigger_conditions->>'order' as demo_order
FROM public.workflow_definitions
WHERE is_demo = true
ORDER BY (trigger_conditions->>'order')::integer;

SELECT '✅ Setup Complete!' as status;
