-- Fix the update_action_scores function to use correct PostgreSQL syntax

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
  FROM public.task_templates tt,
       public.renewals r
  LEFT JOIN public.customer_properties cp ON r.customer_id = cp.customer_id
  WHERE rt.task_template_id = tt.id
    AND r.id = rt.renewal_id
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