-- Good Hang Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zxzwlogjgawckfunhifb/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create membership tier enum
CREATE TYPE membership_tier AS ENUM ('free', 'core');

-- Create application status enum
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user role enum
CREATE TYPE user_role AS ENUM ('member', 'ambassador', 'admin');

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT,
  company TEXT,
  linkedin_url TEXT,
  interests TEXT[],
  membership_tier membership_tier DEFAULT 'free',
  user_role user_role DEFAULT 'member',
  region_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- APPLICATIONS TABLE
-- ============================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  linkedin_url TEXT,
  why_join TEXT NOT NULL,
  contribution TEXT,
  referral_source TEXT,
  status application_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Applications policies
CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert applications"
  ON applications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- EVENTS TABLE
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  event_datetime TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  region_id UUID,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins and ambassadors can create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role IN ('admin', 'ambassador')
    )
  );

CREATE POLICY "Creators can update own events"
  ON events FOR UPDATE
  USING (created_by = auth.uid());

-- ============================================================
-- RSVPS TABLE
-- ============================================================
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  -- For non-members or guests
  guest_name TEXT,
  guest_email TEXT,
  plus_ones INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- RSVPs policies
CREATE POLICY "Anyone can view RSVPs for public events"
  ON rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvps.event_id
      AND events.is_public = true
    )
  );

CREATE POLICY "Anyone can create RSVPs"
  ON rsvps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own RSVPs"
  ON rsvps FOR DELETE
  USING (user_id = auth.uid() OR guest_email = auth.email());

-- ============================================================
-- REGIONS TABLE
-- ============================================================
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  ambassador_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Regions policies
CREATE POLICY "Regions are viewable by everyone"
  ON regions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage regions"
  ON regions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_region ON profiles(region_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_events_datetime ON events(event_datetime);
CREATE INDEX idx_events_region ON events(region_id);
CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_user ON rsvps(user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA - Raleigh Region
-- ============================================================
INSERT INTO regions (name, slug, description)
VALUES ('Raleigh', 'raleigh', 'Tech capital of the Research Triangle');
