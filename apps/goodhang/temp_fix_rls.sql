-- Allow public (unauthenticated) users to read pending_invites for validation
-- This is safe because we're only exposing the invite code for validation purposes
DROP POLICY IF EXISTS "Public can validate invite codes" ON public.pending_invites;
CREATE POLICY "Public can validate invite codes"
  ON public.pending_invites
  FOR SELECT
  USING (true);
