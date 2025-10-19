-- ============================================================================
-- Seed Demo Workflow Definitions
-- ============================================================================
-- Purpose: Create workflow definitions for Bluesoft demo (3 workflows)
-- Phase: 2C.2 (Seed demo workflow definitions)
-- ============================================================================

-- Delete existing demo workflow definitions
DELETE FROM public.workflow_executions WHERE is_demo = true;
DELETE FROM public.workflow_definitions WHERE is_demo = true;

-- Insert 3 demo workflow definitions for Obsidian Black
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
    700, -- Strategic base priority
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
    800, -- Opportunity base priority
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
    900, -- Risk base priority
    true,
    true
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '✅ Demo Workflow Definitions Seeded' as status;

-- Verify workflow definitions
SELECT
    '✅ Workflow Definitions' as check,
    name,
    workflow_type,
    priority_weight,
    trigger_conditions->>'order' as demo_order
FROM public.workflow_definitions
WHERE is_demo = true
ORDER BY (trigger_conditions->>'order')::integer;

-- ============================================================================
-- SEEDING COMPLETE
-- ============================================================================
-- ✅ 3 demo workflow definitions created
-- 1. Strategic Account Planning (order 1, priority 700)
-- 2. Expansion Opportunity (order 2, priority 800)
-- 3. Executive Engagement (order 3, priority 900)
-- ============================================================================
