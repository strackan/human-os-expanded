-- Fix infinite recursion in profiles RLS policy
-- The issue: RLS policy calls get_current_user_company() which reads from profiles,
-- triggering the RLS policy again -> infinite recursion

-- Solution: Make get_current_user_company() use SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_current_user_company()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verify the policy still exists
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public';
