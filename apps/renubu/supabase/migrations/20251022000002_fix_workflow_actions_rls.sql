-- Fix RLS policy for workflow_actions to work in demo mode
-- The original policy required auth.uid() but demo uses unauthenticated client

-- Drop existing policy
DROP POLICY IF EXISTS "Users can create workflow actions" ON public.workflow_actions;

-- Create more permissive policy for demo/development
-- In production, you'd want to enforce auth.uid() = performed_by
CREATE POLICY "Users can create workflow actions" ON public.workflow_actions
FOR INSERT WITH CHECK (
  -- Allow insert if the user has access to the workflow execution
  EXISTS (
    SELECT 1 FROM workflow_executions we
    WHERE we.id = execution_id
    AND (
      we.assigned_csm_id = performed_by OR
      we.user_id = performed_by
    )
  )
);

-- Also make the update policy more permissive for workflow_executions
-- This ensures workflow status updates work in demo mode
DROP POLICY IF EXISTS "Users can update their workflows" ON public.workflow_executions;
CREATE POLICY "Users can update their workflows" ON public.workflow_executions
FOR UPDATE USING (
  assigned_csm_id IN (
    SELECT id FROM profiles
  ) OR user_id IN (
    SELECT id FROM profiles
  )
);
