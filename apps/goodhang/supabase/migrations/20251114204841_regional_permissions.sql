-- Regional Permissions for Ambassadors
-- Adds region-based access control for ambassadors to manage applications and invites

-- Add region_id to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_applications_region ON applications(region_id);

-- Drop existing application policies
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Admins can update applications" ON applications;

-- Create new policies with ambassador regional access

-- Admins can view all applications
-- Ambassadors can view applications from their region
CREATE POLICY "Admins and regional ambassadors can view applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        -- Admins see everything
        profiles.user_role = 'admin'
        OR
        -- Ambassadors see their region's applications
        (
          profiles.user_role = 'ambassador'
          AND profiles.region_id = applications.region_id
        )
      )
    )
  );

-- Admins can update all applications
-- Ambassadors can update applications from their region
CREATE POLICY "Admins and regional ambassadors can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        -- Admins can update everything
        profiles.user_role = 'admin'
        OR
        -- Ambassadors can update their region's applications
        (
          profiles.user_role = 'ambassador'
          AND profiles.region_id = applications.region_id
        )
      )
    )
  );

-- Add helpful comment
COMMENT ON COLUMN applications.region_id IS 'Region for application routing - determines which ambassadors can review';
