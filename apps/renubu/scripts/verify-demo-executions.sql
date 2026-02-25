-- ============================================================================
-- Verify Demo Workflow Executions
-- ============================================================================

-- Check workflow definitions
SELECT
    '✅ Workflow Definitions' as check,
    id,
    name,
    workflow_type,
    priority_weight,
    trigger_conditions->>'order' as demo_order
FROM public.workflow_definitions
WHERE is_demo = true
ORDER BY (trigger_conditions->>'order')::integer;

-- Check workflow executions
SELECT
    '✅ Workflow Executions' as check,
    we.id as execution_id,
    wd.name as workflow_name,
    wd.workflow_type,
    we.status,
    we.priority_score,
    we.assigned_csm_id,
    c.domain as customer_name,
    wd.trigger_conditions->>'order' as sequence_order
FROM public.workflow_executions we
JOIN public.workflow_definitions wd ON we.workflow_definition_id = wd.id
LEFT JOIN public.customers c ON we.customer_id = c.id
WHERE we.is_demo = true
ORDER BY (wd.trigger_conditions->>'order')::integer;

-- Summary
SELECT
    '📊 Summary' as section,
    (SELECT COUNT(*) FROM workflow_definitions WHERE is_demo = true) as definition_count,
    (SELECT COUNT(*) FROM workflow_executions WHERE is_demo = true) as execution_count;
