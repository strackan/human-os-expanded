-- Enable RLS and set up security policies for all tables
-- Run this script to re-enable Row Level Security

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_workflow_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_monitoring_log ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can delete contracts" ON public.contracts;

DROP POLICY IF EXISTS "Authenticated users can view renewals" ON public.renewals;
DROP POLICY IF EXISTS "Authenticated users can insert renewals" ON public.renewals;
DROP POLICY IF EXISTS "Authenticated users can update renewals" ON public.renewals;
DROP POLICY IF EXISTS "Authenticated users can delete renewals" ON public.renewals;

DROP POLICY IF EXISTS "Authenticated users can view customer_properties" ON public.customer_properties;
DROP POLICY IF EXISTS "Authenticated users can insert customer_properties" ON public.customer_properties;
DROP POLICY IF EXISTS "Authenticated users can update customer_properties" ON public.customer_properties;
DROP POLICY IF EXISTS "Authenticated users can delete customer_properties" ON public.customer_properties;

DROP POLICY IF EXISTS "Authenticated users can view renewal_tasks" ON public.renewal_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert renewal_tasks" ON public.renewal_tasks;
DROP POLICY IF EXISTS "Authenticated users can update renewal_tasks" ON public.renewal_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete renewal_tasks" ON public.renewal_tasks;

DROP POLICY IF EXISTS "Authenticated users can view task_templates" ON public.task_templates;
DROP POLICY IF EXISTS "Authenticated users can insert task_templates" ON public.task_templates;
DROP POLICY IF EXISTS "Authenticated users can update task_templates" ON public.task_templates;
DROP POLICY IF EXISTS "Authenticated users can delete task_templates" ON public.task_templates;

DROP POLICY IF EXISTS "Authenticated users can view renewal_workflow_outcomes" ON public.renewal_workflow_outcomes;
DROP POLICY IF EXISTS "Authenticated users can insert renewal_workflow_outcomes" ON public.renewal_workflow_outcomes;
DROP POLICY IF EXISTS "Authenticated users can update renewal_workflow_outcomes" ON public.renewal_workflow_outcomes;
DROP POLICY IF EXISTS "Authenticated users can delete renewal_workflow_outcomes" ON public.renewal_workflow_outcomes;

DROP POLICY IF EXISTS "Authenticated users can view key_dates" ON public.key_dates;
DROP POLICY IF EXISTS "Authenticated users can insert key_dates" ON public.key_dates;
DROP POLICY IF EXISTS "Authenticated users can update key_dates" ON public.key_dates;
DROP POLICY IF EXISTS "Authenticated users can delete key_dates" ON public.key_dates;

DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;

DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can delete alerts" ON public.alerts;

DROP POLICY IF EXISTS "Authenticated users can view workflows" ON public.workflows;
DROP POLICY IF EXISTS "Authenticated users can insert workflows" ON public.workflows;
DROP POLICY IF EXISTS "Authenticated users can update workflows" ON public.workflows;
DROP POLICY IF EXISTS "Authenticated users can delete workflows" ON public.workflows;

DROP POLICY IF EXISTS "Authenticated users can view action_scores" ON public.action_scores;
DROP POLICY IF EXISTS "Authenticated users can insert action_scores" ON public.action_scores;
DROP POLICY IF EXISTS "Authenticated users can update action_scores" ON public.action_scores;
DROP POLICY IF EXISTS "Authenticated users can delete action_scores" ON public.action_scores;

DROP POLICY IF EXISTS "Authenticated users can view workflow_templates" ON public.workflow_templates;
DROP POLICY IF EXISTS "Authenticated users can insert workflow_templates" ON public.workflow_templates;
DROP POLICY IF EXISTS "Authenticated users can update workflow_templates" ON public.workflow_templates;
DROP POLICY IF EXISTS "Authenticated users can delete workflow_templates" ON public.workflow_templates;

DROP POLICY IF EXISTS "Authenticated users can view date_monitoring_log" ON public.date_monitoring_log;
DROP POLICY IF EXISTS "Authenticated users can insert date_monitoring_log" ON public.date_monitoring_log;
DROP POLICY IF EXISTS "Authenticated users can update date_monitoring_log" ON public.date_monitoring_log;
DROP POLICY IF EXISTS "Authenticated users can delete date_monitoring_log" ON public.date_monitoring_log;

-- 3. Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Create RLS policies for customers (all authenticated users can access)
CREATE POLICY "Authenticated users can view customers" ON public.customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customers" ON public.customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" ON public.customers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customers" ON public.customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Create RLS policies for contracts
CREATE POLICY "Authenticated users can view contracts" ON public.contracts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert contracts" ON public.contracts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contracts" ON public.contracts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contracts" ON public.contracts
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Create RLS policies for renewals
CREATE POLICY "Authenticated users can view renewals" ON public.renewals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert renewals" ON public.renewals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update renewals" ON public.renewals
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete renewals" ON public.renewals
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Create RLS policies for customer_properties
CREATE POLICY "Authenticated users can view customer_properties" ON public.customer_properties
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customer_properties" ON public.customer_properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customer_properties" ON public.customer_properties
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customer_properties" ON public.customer_properties
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Create RLS policies for renewal_tasks
CREATE POLICY "Authenticated users can view renewal_tasks" ON public.renewal_tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert renewal_tasks" ON public.renewal_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update renewal_tasks" ON public.renewal_tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete renewal_tasks" ON public.renewal_tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- 9. Create RLS policies for task_templates
CREATE POLICY "Authenticated users can view task_templates" ON public.task_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert task_templates" ON public.task_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update task_templates" ON public.task_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete task_templates" ON public.task_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- 10. Create RLS policies for renewal_workflow_outcomes
CREATE POLICY "Authenticated users can view renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
    FOR DELETE USING (auth.role() = 'authenticated');

-- 11. Create RLS policies for key_dates
CREATE POLICY "Authenticated users can view key_dates" ON public.key_dates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert key_dates" ON public.key_dates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update key_dates" ON public.key_dates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete key_dates" ON public.key_dates
    FOR DELETE USING (auth.role() = 'authenticated');

-- 12. Create RLS policies for events
CREATE POLICY "Authenticated users can view events" ON public.events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert events" ON public.events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update events" ON public.events
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete events" ON public.events
    FOR DELETE USING (auth.role() = 'authenticated');

-- 13. Create RLS policies for alerts
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update alerts" ON public.alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete alerts" ON public.alerts
    FOR DELETE USING (auth.role() = 'authenticated');

-- 14. Create RLS policies for workflows
CREATE POLICY "Authenticated users can view workflows" ON public.workflows
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert workflows" ON public.workflows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update workflows" ON public.workflows
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete workflows" ON public.workflows
    FOR DELETE USING (auth.role() = 'authenticated');

-- 15. Create RLS policies for action_scores
CREATE POLICY "Authenticated users can view action_scores" ON public.action_scores
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert action_scores" ON public.action_scores
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update action_scores" ON public.action_scores
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete action_scores" ON public.action_scores
    FOR DELETE USING (auth.role() = 'authenticated');

-- 16. Create RLS policies for workflow_templates
CREATE POLICY "Authenticated users can view workflow_templates" ON public.workflow_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert workflow_templates" ON public.workflow_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update workflow_templates" ON public.workflow_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete workflow_templates" ON public.workflow_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- 17. Create RLS policies for date_monitoring_log
CREATE POLICY "Authenticated users can view date_monitoring_log" ON public.date_monitoring_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert date_monitoring_log" ON public.date_monitoring_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update date_monitoring_log" ON public.date_monitoring_log
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete date_monitoring_log" ON public.date_monitoring_log
    FOR DELETE USING (auth.role() = 'authenticated');

-- 18. Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'customers', 'contracts', 'renewals', 'customer_properties',
    'renewal_tasks', 'task_templates', 'renewal_workflow_outcomes', 'key_dates',
    'events', 'alerts', 'workflows', 'action_scores', 'workflow_templates',
    'date_monitoring_log'
)
ORDER BY tablename; 