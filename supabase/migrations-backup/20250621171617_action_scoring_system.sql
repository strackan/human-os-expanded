   -- Action Scoring System Implementation
   -- This migration adds the task templates, renewal tasks, and workflow outcomes tables
   -- along with the necessary indexes and functions for the action scoring system

   -- 1. Create Task Templates (Workflow Blueprints)
   CREATE TABLE IF NOT EXISTS public.task_templates (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     description TEXT,
     phase TEXT NOT NULL CHECK (phase IN ('planning', 'preparation', 'outreach', 'negotiation', 'documentation', 'closure')),
     earliest_start_day INTEGER NOT NULL,
     latest_completion_day INTEGER NOT NULL,
     deadline_type TEXT DEFAULT 'soft' CHECK (deadline_type IN ('hard', 'soft')),
     grace_period_days INTEGER DEFAULT 0,
     complexity_score INTEGER DEFAULT 1 CHECK (complexity_score BETWEEN 1 AND 3),
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 2. Create Renewal Tasks (Task Instances)
   CREATE TABLE IF NOT EXISTS public.renewal_tasks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     renewal_id UUID REFERENCES public.renewals(id) ON DELETE CASCADE,
     task_template_id UUID REFERENCES public.task_templates(id),
     assigned_user_id UUID REFERENCES public.profiles(id),
     
     -- Action scoring fields
     action_score DECIMAL DEFAULT 0,
     deadline_urgency_score DECIMAL DEFAULT 0,
     days_to_deadline INTEGER,
     task_deadline_date DATE,
     
     -- Status tracking
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
     outcome_achieved BOOLEAN DEFAULT false,
     is_overdue BOOLEAN DEFAULT false,
     
     -- Execution tracking
     completed_at TIMESTAMP WITH TIME ZONE,
     notes TEXT,
     
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 3. Create Workflow Outcomes (Phase-Level Tracking)
   CREATE TABLE IF NOT EXISTS public.renewal_workflow_outcomes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     renewal_id UUID REFERENCES public.renewals(id),
     phase TEXT NOT NULL,
     phase_completed BOOLEAN DEFAULT false,
     outcome_quality TEXT CHECK (outcome_quality IN ('excellent', 'good', 'acceptable', 'poor')),
     key_deliverables_achieved TEXT[],
     renewal_probability_change INTEGER,
     customer_sentiment_change TEXT CHECK (customer_sentiment_change IN ('improved', 'unchanged', 'worsened')),
     completed_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 4. Augment Existing Tables

   -- Add new columns to customer_properties for action scoring
   ALTER TABLE public.customer_properties 
   ADD COLUMN IF NOT EXISTS revenue_impact_tier INTEGER DEFAULT 1 CHECK (revenue_impact_tier BETWEEN 1 AND 5),
   ADD COLUMN IF NOT EXISTS churn_risk_score INTEGER DEFAULT 1 CHECK (churn_risk_score BETWEEN 1 AND 5);

   -- Add new columns to renewals table
   ALTER TABLE public.renewals 
   ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'planning',
   ADD COLUMN IF NOT EXISTS tasks_generated_at TIMESTAMP WITH TIME ZONE,
   ADD COLUMN IF NOT EXISTS last_action_score_update TIMESTAMP WITH TIME ZONE;

   -- 5. Enable RLS on new tables
   ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.renewal_tasks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.renewal_workflow_outcomes ENABLE ROW LEVEL SECURITY;

   -- 6. RLS Policies for task_templates
   CREATE POLICY "Authenticated users can view task_templates" ON public.task_templates
       FOR SELECT USING (auth.role() = 'authenticated');
   CREATE POLICY "Authenticated users can insert task_templates" ON public.task_templates
       FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   CREATE POLICY "Authenticated users can update task_templates" ON public.task_templates
       FOR UPDATE USING (auth.role() = 'authenticated');

   -- 7. RLS Policies for renewal_tasks
   CREATE POLICY "Authenticated users can view renewal_tasks" ON public.renewal_tasks
       FOR SELECT USING (auth.role() = 'authenticated');
   CREATE POLICY "Authenticated users can insert renewal_tasks" ON public.renewal_tasks
       FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   CREATE POLICY "Authenticated users can update renewal_tasks" ON public.renewal_tasks
       FOR UPDATE USING (auth.role() = 'authenticated');

   -- 8. RLS Policies for renewal_workflow_outcomes
   CREATE POLICY "Authenticated users can view renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
       FOR SELECT USING (auth.role() = 'authenticated');
   CREATE POLICY "Authenticated users can insert renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
       FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   CREATE POLICY "Authenticated users can update renewal_workflow_outcomes" ON public.renewal_workflow_outcomes
       FOR UPDATE USING (auth.role() = 'authenticated');

   -- 9. Create Indexes for Performance
   CREATE INDEX IF NOT EXISTS idx_renewal_tasks_action_score ON public.renewal_tasks(action_score DESC);
   CREATE INDEX IF NOT EXISTS idx_renewal_tasks_status_pending ON public.renewal_tasks(status) WHERE status = 'pending';
   CREATE INDEX IF NOT EXISTS idx_renewal_tasks_overdue ON public.renewal_tasks(is_overdue) WHERE is_overdue = true;
   CREATE INDEX IF NOT EXISTS idx_task_templates_phase ON public.task_templates(phase);
   CREATE INDEX IF NOT EXISTS idx_renewal_tasks_deadline ON public.renewal_tasks(days_to_deadline);
   CREATE INDEX IF NOT EXISTS idx_renewal_tasks_renewal_id ON public.renewal_tasks(renewal_id);
   CREATE INDEX IF NOT EXISTS idx_renewal_tasks_template_id ON public.renewal_tasks(task_template_id);

   -- 10. Essential Functions

   -- Generate Tasks for New Renewals
   CREATE OR REPLACE FUNCTION public.generate_renewal_tasks(renewal_uuid UUID)
   RETURNS VOID AS $$
   BEGIN
     INSERT INTO public.renewal_tasks (
       renewal_id,
       task_template_id,
       task_deadline_date,
       days_to_deadline
     )
     SELECT 
       renewal_uuid,
       tt.id,
       r.renewal_date - INTERVAL '1 day' * tt.latest_completion_day,
       tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)
     FROM public.task_templates tt
     CROSS JOIN public.renewals r
     WHERE r.id = renewal_uuid AND tt.is_active = true;
       
     UPDATE public.renewals 
     SET tasks_generated_at = NOW()
     WHERE id = renewal_uuid;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Daily Action Score Recalculation
   CREATE OR REPLACE FUNCTION public.update_action_scores()
   RETURNS VOID AS $$
   BEGIN
     UPDATE public.renewal_tasks rt
     SET 
       days_to_deadline = tt.latest_completion_day - (r.renewal_date - CURRENT_DATE),
       is_overdue = (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) < 0,
       action_score = (
         COALESCE(cp.revenue_impact_tier, 1) *
         CASE 
           WHEN (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) < 0 THEN 10
           WHEN (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) <= 1 THEN 9
           WHEN (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) <= 3 THEN 7
           WHEN (tt.latest_completion_day - (r.renewal_date - CURRENT_DATE)) <= 7 THEN 5
           ELSE 1
         END *
         COALESCE(cp.churn_risk_score, 1) *
         tt.complexity_score
       ),
       updated_at = NOW()
     FROM public.task_templates tt
     JOIN public.renewals r ON rt.renewal_id = r.id
     LEFT JOIN public.customer_properties cp ON r.customer_id = cp.customer_id
     WHERE rt.task_template_id = tt.id
       AND rt.status = 'pending';
       
     UPDATE public.renewals 
     SET last_action_score_update = NOW()
     WHERE id IN (
       SELECT DISTINCT renewal_id 
       FROM public.renewal_tasks 
       WHERE status = 'pending'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- 11. Sample Task Templates Data
   INSERT INTO public.task_templates (name, description, phase, earliest_start_day, latest_completion_day, deadline_type, grace_period_days, complexity_score) VALUES
   ('Account Health Assessment', 'Review usage data, support tickets, stakeholder changes', 'planning', 120, 90, 'soft', 7, 2),
   ('Contract Analysis', 'Parse current contract terms, pricing, renewal clauses', 'planning', 120, 90, 'soft', 5, 1),
   ('Pricing Strategy Development', 'Analyze usage for price optimization, benchmark rates', 'preparation', 90, 65, 'hard', 3, 3),
   ('Renewal Notice Delivery', 'Send formal renewal notification with initial proposal', 'outreach', 60, 45, 'hard', 0, 1),
   ('Executive Business Review', 'Book strategic review meeting with key stakeholders', 'outreach', 55, 40, 'hard', 3, 3),
   ('Objection Response', 'Address pricing, feature, or contract term concerns', 'negotiation', 45, 30, 'hard', 2, 2),
   ('Final Quote Generation', 'Create definitive pricing and terms document', 'documentation', 30, 20, 'hard', 1, 1),
   ('Signature Management', 'Track DocuSign progress, send reminders', 'closure', 15, 5, 'hard', 1, 1)
   ON CONFLICT DO NOTHING;