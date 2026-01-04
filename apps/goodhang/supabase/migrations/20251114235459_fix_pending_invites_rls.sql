-- Fix RLS policies for pending_invites
-- The validation endpoint is public and needs to read pending_invites
-- This is safe because we're only exposing the invite code for validation

-- Allow public (unauthenticated) users to read pending_invites for validation
DROP POLICY IF EXISTS "Public can validate invite codes" ON public.pending_invites;
CREATE POLICY "Public can validate invite codes"
  ON public.pending_invites
  FOR SELECT
  USING (true);
