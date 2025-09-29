-- Add get_next_priority_task function
-- This function returns the highest priority pending renewal task

CREATE OR REPLACE FUNCTION public.get_next_priority_task()
RETURNS TABLE (
  id UUID,
  renewal_id UUID,
  task_template_id UUID,
  assigned_user_id UUID,
  action_score DECIMAL,
  deadline_urgency_score DECIMAL,
  days_to_deadline INTEGER,
  task_deadline_date DATE,
  status TEXT,
  outcome_achieved BOOLEAN,
  is_overdue BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  task_name TEXT,
  task_description TEXT,
  phase TEXT,
  complexity_score INTEGER,
  customer_id UUID,
  customer_name TEXT,
  renewal_date DATE,
  current_arr DECIMAL
) AS $$
BEGIN
  -- Return the highest priority pending task with related data
  RETURN QUERY
  SELECT 
    rt.id,
    rt.renewal_id,
    rt.task_template_id,
    rt.assigned_user_id,
    rt.action_score,
    rt.deadline_urgency_score,
    rt.days_to_deadline,
    rt.task_deadline_date,
    rt.status,
    rt.outcome_achieved,
    rt.is_overdue,
    rt.completed_at,
    rt.notes,
    rt.created_at,
    rt.updated_at,
    tt.name as task_name,
    tt.description as task_description,
    tt.phase,
    tt.complexity_score,
    r.customer_id,
    c.name as customer_name,
    r.renewal_date,
    cp.current_arr
  FROM public.renewal_tasks rt
  JOIN public.task_templates tt ON rt.task_template_id = tt.id
  JOIN public.renewals r ON rt.renewal_id = r.id
  JOIN public.customers c ON r.customer_id = c.id
  LEFT JOIN public.customer_properties cp ON r.customer_id = cp.customer_id
  WHERE rt.status = 'pending'
    AND tt.is_active = true
  ORDER BY rt.action_score DESC, rt.days_to_deadline ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 