-- Temporarily disable RLS on workflow_actions for demo purposes
-- This allows the demo to work without authentication
-- In production, you'd want strict RLS policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their workflow actions" ON public.workflow_actions;
DROP POLICY IF EXISTS "Users can create workflow actions" ON public.workflow_actions;

-- Disable RLS entirely on workflow_actions table for demo
ALTER TABLE public.workflow_actions DISABLE ROW LEVEL SECURITY;

-- Note: In production, re-enable RLS with proper policies:
-- ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
-- Then create policies based on authenticated users
