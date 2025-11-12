-- Fix RLS policy for profiles table to allow users to read their own profile
-- This prevents the circular dependency where get_current_user_company() needs
-- to read profiles, but the RLS policy prevents reading profiles

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Drop and recreate policy to be idempotent
DROP POLICY IF EXISTS "Users can view their own profile and company profiles" ON public.profiles;

-- Create a more permissive policy that allows:
-- 1. Users to always view their own profile (needed for auth to work)
-- 2. Users to view other profiles in their company
CREATE POLICY "Users can view their own profile and company profiles"
  ON public.profiles FOR SELECT
  USING (
    -- Always allow reading own profile (breaks circular dependency)
    id = auth.uid()
    OR
    -- Allow reading profiles in same company
    company_id = public.get_current_user_company()
  );
