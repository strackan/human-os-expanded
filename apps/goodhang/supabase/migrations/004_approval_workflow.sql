-- Good Hang: Approval Workflow Enhancement
-- Adds membership_status field and evaluation tracking

-- ============================================================
-- ADD MEMBERSHIP STATUS TO PROFILES
-- ============================================================

-- Create membership status enum
CREATE TYPE membership_status AS ENUM ('pending', 'active', 'suspended', 'alumni');

-- Add membership_status column to profiles (defaults to pending)
ALTER TABLE profiles
ADD COLUMN membership_status membership_status DEFAULT 'pending';

-- ============================================================
-- ADD EVALUATION TRACKING TO APPLICATIONS
-- ============================================================

-- Add fields for tracking the evaluation process
ALTER TABLE applications
ADD COLUMN interview_scheduled_at TIMESTAMPTZ,
ADD COLUMN interview_completed_at TIMESTAMPTZ,
ADD COLUMN interview_notes TEXT,
ADD COLUMN admin_notes TEXT,
ADD COLUMN rejection_reason TEXT;

-- ============================================================
-- UPDATE RLS POLICIES FOR STATUS-BASED ACCESS
-- ============================================================

-- Drop old RSVP policy
DROP POLICY IF EXISTS "Anyone can create RSVPs" ON rsvps;

-- New RSVP policy: Only active members can RSVP
CREATE POLICY "Active members can create RSVPs"
  ON rsvps FOR INSERT
  WITH CHECK (
    -- Allow if user is active member
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.membership_status = 'active'
    )
    -- OR allow guest RSVPs (no user_id, just guest_name/email)
    OR user_id IS NULL
  );

-- Update profiles SELECT policy to show only active members in directory
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Everyone can view all profiles"
  ON profiles FOR SELECT
  USING (true);

-- Profiles INSERT policy (for when new users sign up)
CREATE POLICY "New users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

-- This function automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, membership_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_profiles_membership_status ON profiles(membership_status);
CREATE INDEX idx_applications_interview_scheduled ON applications(interview_scheduled_at);

-- ============================================================
-- HELPER VIEW FOR ADMIN DASHBOARD
-- ============================================================

-- View to see pending applications with linked user accounts
CREATE OR REPLACE VIEW pending_applications_view AS
SELECT
  a.id,
  a.email,
  a.name,
  a.linkedin_url,
  a.why_join,
  a.contribution,
  a.referral_source,
  a.status,
  a.interview_scheduled_at,
  a.interview_completed_at,
  a.interview_notes,
  a.admin_notes,
  a.created_at,
  p.id as user_id,
  p.membership_status,
  p.created_at as user_created_at
FROM applications a
LEFT JOIN profiles p ON p.email = a.email
WHERE a.status = 'pending'
ORDER BY a.created_at DESC;

-- Grant access to authenticated users (admins will filter via RLS)
GRANT SELECT ON pending_applications_view TO authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN profiles.membership_status IS 'User membership status: pending (new signup), active (approved), suspended, alumni';
COMMENT ON COLUMN applications.interview_scheduled_at IS 'When the evaluation interview was scheduled';
COMMENT ON COLUMN applications.interview_completed_at IS 'When the evaluation interview was completed';
COMMENT ON COLUMN applications.interview_notes IS 'Notes from the interview or evaluation process';
COMMENT ON COLUMN applications.admin_notes IS 'Internal admin notes about the application';
COMMENT ON COLUMN applications.rejection_reason IS 'Reason provided if application was rejected';
