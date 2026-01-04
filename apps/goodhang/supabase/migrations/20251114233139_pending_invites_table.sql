-- Pending Invites table for GoodHang
-- Stores invite codes that haven't been redeemed yet
-- Once redeemed, a member record is created

CREATE TABLE IF NOT EXISTS public.pending_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM pending_invites WHERE invite_code = code) INTO code_exists;

    IF NOT code_exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Function to auto-generate invite codes on insert
CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate invite codes
DROP TRIGGER IF EXISTS pending_invites_auto_code ON public.pending_invites;
CREATE TRIGGER pending_invites_auto_code
BEFORE INSERT ON public.pending_invites
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invite_code();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pending_invites_invite_code ON public.pending_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_pending_invites_email ON public.pending_invites(email);
CREATE INDEX IF NOT EXISTS idx_pending_invites_created_by ON public.pending_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_pending_invites_user_id ON public.pending_invites(user_id);

-- RLS Policies
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all pending invites" ON public.pending_invites;
CREATE POLICY "Admins can manage all pending invites"
  ON public.pending_invites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

-- Ambassadors can manage their invites
DROP POLICY IF EXISTS "Ambassadors can manage their pending invites" ON public.pending_invites;
CREATE POLICY "Ambassadors can manage their pending invites"
  ON public.pending_invites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'ambassador'
    )
  );

COMMENT ON TABLE public.pending_invites IS 'Stores pending invite codes for GoodHang member signup';
COMMENT ON COLUMN public.pending_invites.invite_code IS 'Auto-generated unique code for signup';
COMMENT ON COLUMN public.pending_invites.used_at IS 'When the user signed up with this code';
COMMENT ON COLUMN public.pending_invites.user_id IS 'Links to auth.users and members after signup';
