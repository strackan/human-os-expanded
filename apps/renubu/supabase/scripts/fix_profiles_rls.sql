-- ============================================================================
-- FIX PROFILES TABLE RLS (Infinite Recursion Issue)
-- ============================================================================
-- The profiles table has circular RLS that causes infinite recursion
-- when workflow_definitions queries check against it
-- ============================================================================

-- Drop all existing profiles policies to start fresh
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;

-- Simple, non-recursive policies for profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  is_demo_mode() OR
  id = auth.uid()
);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (
  is_demo_mode() OR
  id = auth.uid()
);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  is_demo_mode() OR
  id = auth.uid()
);

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE USING (
  is_demo_mode() OR
  id = auth.uid()
);

-- Verify
SELECT 'Profiles RLS fixed' as status;
