/**
 * Fix Infinite Recursion in Profiles RLS Policy
 *
 * Issue: The simple "authenticated" policy was causing infinite recursion
 * when querying profiles table, likely due to auth.uid() lookups needing
 * to check profiles itself.
 *
 * Solution: Use service role bypass pattern similar to customers/contracts
 */

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can access profiles" ON public.profiles;

-- Recreate with service role bypass to prevent recursion
CREATE POLICY "Authenticated users can access profiles" ON public.profiles
    FOR ALL
    USING (
        -- Service role has full access (bypasses RLS)
        auth.jwt()->>'role' = 'service_role'
        OR
        -- Authenticated users can access all profiles in demo mode
        (auth.role() = 'authenticated')
    );

-- Add helpful comment
COMMENT ON POLICY "Authenticated users can access profiles" ON public.profiles IS
'Allows authenticated users to access profiles. Service role bypasses RLS to prevent infinite recursion during auth lookups.';
