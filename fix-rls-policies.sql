-- Fix RLS policies by adding proper WITH CHECK clauses for INSERT operations

-- Drop existing INSERT policies that are missing WITH CHECK clauses
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can insert renewals" ON public.renewals;
DROP POLICY IF EXISTS "Authenticated users can insert customer_properties" ON public.customer_properties;
DROP POLICY IF EXISTS "Authenticated users can insert renewal_tasks" ON public.renewal_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert task_templates" ON public.task_templates;
DROP POLICY IF EXISTS "Authenticated users can insert renewal_workflow_outcomes" ON public.renewal_workflow_outcomes;
DROP POLICY IF EXISTS "Authenticated users can insert key_dates" ON public.key_dates;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can insert workflows" ON public.workflows;
DROP POLICY IF EXISTS "Authenticated users can insert date_monitoring_log" ON public.date_monitoring_log;

-- Recreate INSERT policies with proper WITH CHECK clauses
CREATE POLICY "Authenticated users can insert customers" ON public.customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert contracts" ON public.contracts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert renewals" ON public.renewals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customer_properties" ON public.customer_properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert renewal_tasks" ON public.renewal_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert task_templates" ON public.task_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert key_dates" ON public.key_dates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert events" ON public.events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert workflows" ON public.workflows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert date_monitoring_log" ON public.date_monitoring_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Verify the policies are now correct
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'INSERT' THEN 'WITH CHECK clause present'
        ELSE 'USING clause present'
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE '%insert%'
ORDER BY tablename; 