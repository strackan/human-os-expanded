-- ============================================================================
-- Quick Initialize Demo Executions
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
    demo_csm_id UUID;
    demo_customer_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Obsidian Black
BEGIN
    -- Get the first profile ID (your user)
    SELECT id INTO demo_csm_id FROM public.profiles LIMIT 1;

    -- Delete any existing demo executions (clean slate)
    DELETE FROM public.workflow_executions WHERE is_demo = true;

    -- Create execution for Strategic Planning (order 1)
    INSERT INTO public.workflow_executions (
        workflow_definition_id,
        customer_id,
        assigned_csm_id,
        status,
        priority_score,
        is_demo,
        execution_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000001', -- Strategic Planning
        demo_customer_id,
        demo_csm_id,
        'not_started',
        700,
        true,
        '{}'::jsonb
    );

    -- Create execution for Expansion Opportunity (order 2)
    INSERT INTO public.workflow_executions (
        workflow_definition_id,
        customer_id,
        assigned_csm_id,
        status,
        priority_score,
        is_demo,
        execution_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000002', -- Expansion Opportunity
        demo_customer_id,
        demo_csm_id,
        'not_started',
        800,
        true,
        '{}'::jsonb
    );

    -- Create execution for Executive Engagement (order 3)
    INSERT INTO public.workflow_executions (
        workflow_definition_id,
        customer_id,
        assigned_csm_id,
        status,
        priority_score,
        is_demo,
        execution_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000003', -- Executive Engagement
        demo_customer_id,
        demo_csm_id,
        'not_started',
        900,
        true,
        '{}'::jsonb
    );

    RAISE NOTICE 'Created 3 demo workflow executions for CSM: %', demo_csm_id;
END $$;

-- Verify
SELECT
    '✅ Demo Executions Created' as status,
    COUNT(*) as count
FROM public.workflow_executions
WHERE is_demo = true;

-- Show details
SELECT
    we.id,
    wd.name,
    we.status,
    we.priority_score,
    wd.trigger_conditions->>'order' as order
FROM public.workflow_executions we
JOIN public.workflow_definitions wd ON we.workflow_definition_id = wd.id
WHERE we.is_demo = true
ORDER BY (wd.trigger_conditions->>'order')::integer;
