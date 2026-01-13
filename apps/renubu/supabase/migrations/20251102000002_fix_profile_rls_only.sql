-- Fix RLS policy for profiles table to allow users to read their own profile
-- This prevents the circular dependency where get_current_user_company() needs
-- to read profiles, but the RLS policy prevents reading profiles

-- Drop the existing policies if they exist
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile and company profiles" ON public.profiles;

-- Create the correct policy that breaks the circular dependency
CREATE POLICY "Users can view their own profile and company profiles"
  ON public.profiles FOR SELECT
  USING (
    -- Always allow reading own profile first (breaks circular dependency)
    id = auth.uid()
    OR
    -- Then allow reading profiles in same company
    company_id = public.get_current_user_company()
  );
