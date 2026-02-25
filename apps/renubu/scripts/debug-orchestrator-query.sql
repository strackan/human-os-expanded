-- Debug orchestrator query to see what getWorkflowQueueForCSM would return

-- Step 1: Check what CSM ID the API would use
SELECT
    '1️⃣ Available CSM Users' as step,
    id as csm_id,
    email,
    full_name
FROM profiles
LIMIT 5;

-- Step 2: Check demo workflow executions
SELECT
    '2️⃣ Demo Workflow Executions' as step,
    we.id,
    we.assigned_csm_id,
    we.customer_id,
    we.status,
    we.priority_score,
    we.is_demo,
    wd.name as workflow_name,
    wd.trigger_conditions->>'order' as sequence_order
FROM workflow_executions we
JOIN workflow_definitions wd ON we.workflow_definition_id = wd.id
WHERE we.is_demo = true
ORDER BY (wd.trigger_conditions->>'order')::integer;

-- Step 3: Simulate the orchestrator query (demo mode)
SELECT
    '3️⃣ What Orchestrator Returns (Demo Mode)' as step,
    we.*,
    wd.name as workflow_name,
    wd.workflow_type,
    wd.trigger_conditions,
    c.domain as customer_domain
FROM workflow_executions we
JOIN workflow_definitions wd ON we.workflow_definition_id = wd.id
LEFT JOIN customers c ON we.customer_id = c.id
WHERE we.is_demo = true
  AND we.status IN ('not_started', 'underway', 'snoozed')
ORDER BY (wd.trigger_conditions->>'order')::integer
LIMIT 1;

-- Step 4: Check customer data
SELECT
    '4️⃣ Customer Data for Obsidian Black' as step,
    id,
    name,
    domain,
    current_arr,
    renewal_date
FROM customers
WHERE id = '550e8400-e29b-41d4-a716-446655440001';
