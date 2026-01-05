-- Migration: Add assessment status tracking for membership flow
-- Date: 2025-11-18

-- Create assessment_status enum
CREATE TYPE assessment_status AS ENUM (
  'not_started',
  'in_progress',
  'pending_review',
  'trial',
  'approved',
  'waitlist',
  'rejected'
);

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS assessment_status assessment_status DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS invite_code_used TEXT,
ADD COLUMN IF NOT EXISTS assessment_completed_at TIMESTAMPTZ;

-- Create invite_codes table for tracking generated codes
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on invite_codes
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all invite codes
CREATE POLICY "Admins can view all invite codes"
  ON invite_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

-- Policy: Admins and ambassadors can create invite codes
CREATE POLICY "Admins and ambassadors can create invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role IN ('admin', 'ambassador')
    )
  );

-- Create index on assessment_status for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_assessment_status ON profiles(assessment_status);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON invite_codes(used_by);

-- Function to validate and use invite code
CREATE OR REPLACE FUNCTION use_invite_code(code_text TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_record invite_codes;
BEGIN
  -- Get the invite code
  SELECT * INTO code_record
  FROM invite_codes
  WHERE code = code_text
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND used_by IS NULL;

  -- Check if code exists and is valid
  IF code_record.id IS NULL THEN
    RETURN false;
  END IF;

  -- Mark code as used
  UPDATE invite_codes
  SET used_by = user_id,
      used_at = NOW(),
      is_active = false
  WHERE id = code_record.id;

  -- Update user profile
  UPDATE profiles
  SET invite_code_used = code_text,
      assessment_status = 'trial'
  WHERE id = user_id;

  RETURN true;
END;
$$;

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code(generated_by_user UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Check if user has permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = generated_by_user
    AND user_role IN ('admin', 'ambassador')
  ) THEN
    RAISE EXCEPTION 'User does not have permission to generate invite codes';
  END IF;

  -- Generate unique code
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM invite_codes WHERE code = new_code) INTO code_exists;

    EXIT WHEN NOT code_exists;
  END LOOP;

  -- Insert new invite code
  INSERT INTO invite_codes (code, generated_by)
  VALUES (new_code, generated_by_user);

  RETURN new_code;
END;
$$;

-- Comment on table and columns
COMMENT ON TABLE invite_codes IS 'Tracks invite codes for gated member onboarding';
COMMENT ON COLUMN profiles.assessment_status IS 'Current status in the membership assessment flow';
COMMENT ON COLUMN profiles.invite_code_used IS 'Invite code used during signup (if any)';
COMMENT ON COLUMN profiles.assessment_completed_at IS 'Timestamp when user completed the assessment';
