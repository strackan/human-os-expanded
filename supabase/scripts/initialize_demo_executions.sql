-- ============================================================================
-- Initialize Demo Workflow Executions
-- ============================================================================
-- Purpose: Create workflow_executions for the 3 demo workflow definitions
-- This should be run after seeding demo workflow definitions
-- ============================================================================

-- Configuration
-- Update these values for your demo CSM and customer
DO $$
DECLARE
    demo_csm_id UUID := '00000000-0000-0000-0000-000000000000'; -- REPLACE with actual CSM ID
    demo_customer_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Obsidian Black ID
BEGIN
    -- Delete any existing demo executions
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
        '00000000-0000-0000-0000-000000000001', -- Strategic Planning definition
        demo_customer_id,
        demo_csm_id,
        'not_started',
        700, -- Strategic base priority
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
        '00000000-0000-0000-0000-000000000002', -- Expansion Opportunity definition
        demo_customer_id,
        demo_csm_id,
        'not_started',
        800, -- Opportunity base priority
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
        '00000000-0000-0000-0000-000000000003', -- Executive Engagement definition
        demo_customer_id,
        demo_csm_id,
        'not_started',
        900, -- Risk base priority
        true,
        '{}'::jsonb
    );

    RAISE NOTICE 'Demo workflow executions created successfully';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '✅ Demo Workflow Executions Created' as status;

-- Verify executions with workflow details
SELECT
    we.id as execution_id,
    wd.name as workflow_name,
    wd.workflow_type,
    we.status,
    we.priority_score,
    wd.trigger_conditions->>'order' as sequence_order,
    c.domain as customer_name
FROM public.workflow_executions we
JOIN public.workflow_definitions wd ON we.workflow_definition_id = wd.id
LEFT JOIN public.customers c ON we.customer_id = c.id
WHERE we.is_demo = true
ORDER BY (wd.trigger_conditions->>'order')::integer;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- Before running this script:
-- 1. Find your demo CSM user ID from the profiles table
-- 2. Update the demo_csm_id variable above with the actual UUID
-- 3. Verify the demo_customer_id matches your Obsidian Black customer
-- 4. Run this script in Supabase SQL Editor
-- ============================================================================
