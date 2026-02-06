-- ============================================
-- GFT Schema - NO RLS VERSION
-- Run this first, then add RLS policies separately
-- ============================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS gft;

-- CONTACTS TABLE
CREATE TABLE IF NOT EXISTS gft.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  linked_user_id UUID,
  entity_id UUID,
  powerpak_expert_id TEXT,
  name TEXT NOT NULL,
  linkedin_url TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  company TEXT,
  company_id UUID,
  linkedin_company_id TEXT,
  current_job_title TEXT,
  headline TEXT,
  location TEXT,
  mutual_connections INTEGER,
  followers INTEGER,
  connection_degree TEXT,
  connection_status TEXT DEFAULT 'none',
  connection_requested_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  last_job_update TIMESTAMPTZ,
  last_company_update TIMESTAMPTZ,
  labels JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  source TEXT DEFAULT 'linkedin_chrome_extension',
  extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COMPANIES TABLE
CREATE TABLE IF NOT EXISTS gft.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  entity_id UUID,
  linkedin_company_id TEXT UNIQUE,
  linkedin_url TEXT,
  name TEXT NOT NULL,
  website TEXT,
  company_type TEXT,
  industry TEXT,
  description TEXT,
  employee_count INTEGER,
  headquarters TEXT,
  company_size TEXT,
  revenue TEXT,
  enrichment_status TEXT DEFAULT 'basic',
  extracted_from TEXT,
  profile_data JSONB,
  last_outreach_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS gft.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  company_id UUID,
  activity_type TEXT NOT NULL,
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- LI_POSTS TABLE
CREATE TABLE IF NOT EXISTS gft.li_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  post_id TEXT NOT NULL,
  li_url TEXT NOT NULL,
  post_content TEXT,
  post_type TEXT,
  date_posted TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(owner_id, post_id)
);

-- LI_POST_ENGAGEMENTS TABLE
CREATE TABLE IF NOT EXISTS gft.li_post_engagements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  engagement_type TEXT NOT NULL,
  comment_text TEXT,
  engagement_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, contact_id, engagement_type)
);

-- Add missing columns if table already existed with different schema
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS linked_user_id UUID;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS powerpak_expert_id TEXT;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS linkedin_company_id TEXT;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS mutual_connections INTEGER;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS followers INTEGER;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS connection_degree TEXT;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'none';
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS connection_requested_at TIMESTAMPTZ;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS last_job_update TIMESTAMPTZ;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS last_company_update TIMESTAMPTZ;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'linkedin_chrome_extension';
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ;

ALTER TABLE gft.companies ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE gft.companies ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE gft.companies ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'basic';
ALTER TABLE gft.companies ADD COLUMN IF NOT EXISTS extracted_from TEXT;
ALTER TABLE gft.companies ADD COLUMN IF NOT EXISTS profile_data JSONB;
ALTER TABLE gft.companies ADD COLUMN IF NOT EXISTS last_outreach_date TIMESTAMPTZ;

ALTER TABLE gft.activities ADD COLUMN IF NOT EXISTS owner_id UUID;

ALTER TABLE gft.li_posts ADD COLUMN IF NOT EXISTS owner_id UUID;

-- INDEXES (only create if column exists)
CREATE INDEX IF NOT EXISTS idx_gft_contacts_owner ON gft.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_linkedin_url ON gft.contacts(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_name ON gft.contacts(name);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_created_at ON gft.contacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gft_companies_owner ON gft.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_gft_companies_linkedin_company_id ON gft.companies(linkedin_company_id);
CREATE INDEX IF NOT EXISTS idx_gft_companies_name ON gft.companies(name);

CREATE INDEX IF NOT EXISTS idx_gft_activities_owner ON gft.activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_gft_activities_contact_id ON gft.activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_gft_activities_activity_date ON gft.activities(activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_gft_li_posts_owner ON gft.li_posts(owner_id);
CREATE INDEX IF NOT EXISTS idx_gft_li_posts_date_posted ON gft.li_posts(date_posted DESC);

CREATE INDEX IF NOT EXISTS idx_gft_engagements_post_id ON gft.li_post_engagements(post_id);
CREATE INDEX IF NOT EXISTS idx_gft_engagements_contact_id ON gft.li_post_engagements(contact_id);

-- FOREIGN KEYS (within gft schema only - no cross-schema FKs yet)
DO $$ BEGIN
  ALTER TABLE gft.contacts ADD CONSTRAINT fk_gft_contacts_company
    FOREIGN KEY (company_id) REFERENCES gft.companies(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE gft.activities ADD CONSTRAINT fk_gft_activities_contact
    FOREIGN KEY (contact_id) REFERENCES gft.contacts(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE gft.activities ADD CONSTRAINT fk_gft_activities_company
    FOREIGN KEY (company_id) REFERENCES gft.companies(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE gft.li_post_engagements ADD CONSTRAINT fk_gft_engagements_post
    FOREIGN KEY (post_id) REFERENCES gft.li_posts(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE gft.li_post_engagements ADD CONSTRAINT fk_gft_engagements_contact
    FOREIGN KEY (contact_id) REFERENCES gft.contacts(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TRIGGERS
DROP TRIGGER IF EXISTS update_gft_contacts_updated_at ON gft.contacts;
CREATE TRIGGER update_gft_contacts_updated_at
  BEFORE UPDATE ON gft.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gft_companies_updated_at ON gft.companies;
CREATE TRIGGER update_gft_companies_updated_at
  BEFORE UPDATE ON gft.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- EXPOSE SCHEMA TO POSTGREST
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft';
NOTIFY pgrst, 'reload config';

-- COMMENTS
COMMENT ON SCHEMA gft IS 'GuyForThat CRM layer';
COMMENT ON TABLE gft.contacts IS 'LinkedIn profiles and contacts';
COMMENT ON TABLE gft.companies IS 'Company data';
COMMENT ON TABLE gft.activities IS 'Outreach activities';
COMMENT ON TABLE gft.li_posts IS 'LinkedIn posts';
COMMENT ON TABLE gft.li_post_engagements IS 'Post engagements';
