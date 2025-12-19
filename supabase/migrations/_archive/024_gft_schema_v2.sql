-- ============================================
-- GFT (GuyForThat) Schema - v2
-- CRM layer for contacts, companies, and activities
-- Run in Supabase SQL Editor
-- ============================================

-- PART 1: Create schema
CREATE SCHEMA IF NOT EXISTS gft;

-- PART 2: CONTACTS TABLE
CREATE TABLE gft.contacts (
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

-- PART 3: COMPANIES TABLE
CREATE TABLE gft.companies (
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

-- PART 4: ACTIVITIES TABLE
CREATE TABLE gft.activities (
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

-- PART 5: LI_POSTS TABLE
CREATE TABLE gft.li_posts (
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

-- PART 6: LI_POST_ENGAGEMENTS TABLE
CREATE TABLE gft.li_post_engagements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  engagement_type TEXT NOT NULL,
  comment_text TEXT,
  engagement_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, contact_id, engagement_type)
);

-- PART 7: INDEXES
CREATE INDEX idx_gft_contacts_owner ON gft.contacts(owner_id);
CREATE INDEX idx_gft_contacts_entity_id ON gft.contacts(entity_id);
CREATE INDEX idx_gft_contacts_linkedin_url ON gft.contacts(linkedin_url);
CREATE INDEX idx_gft_contacts_company ON gft.contacts(company);
CREATE INDEX idx_gft_contacts_name ON gft.contacts(name);
CREATE INDEX idx_gft_contacts_created_at ON gft.contacts(created_at DESC);
CREATE INDEX idx_gft_contacts_labels ON gft.contacts USING GIN (labels);

CREATE INDEX idx_gft_companies_owner ON gft.companies(owner_id);
CREATE INDEX idx_gft_companies_entity_id ON gft.companies(entity_id);
CREATE INDEX idx_gft_companies_linkedin_company_id ON gft.companies(linkedin_company_id);
CREATE INDEX idx_gft_companies_name ON gft.companies(name);
CREATE INDEX idx_gft_companies_industry ON gft.companies(industry);

CREATE INDEX idx_gft_activities_owner ON gft.activities(owner_id);
CREATE INDEX idx_gft_activities_contact_id ON gft.activities(contact_id);
CREATE INDEX idx_gft_activities_activity_type ON gft.activities(activity_type);
CREATE INDEX idx_gft_activities_activity_date ON gft.activities(activity_date DESC);

CREATE INDEX idx_gft_li_posts_owner ON gft.li_posts(owner_id);
CREATE INDEX idx_gft_li_posts_post_id ON gft.li_posts(post_id);
CREATE INDEX idx_gft_li_posts_date_posted ON gft.li_posts(date_posted DESC);

CREATE INDEX idx_gft_engagements_post_id ON gft.li_post_engagements(post_id);
CREATE INDEX idx_gft_engagements_contact_id ON gft.li_post_engagements(contact_id);

-- PART 8: FOREIGN KEYS
ALTER TABLE gft.contacts ADD CONSTRAINT fk_contacts_company
  FOREIGN KEY (company_id) REFERENCES gft.companies(id) ON DELETE SET NULL;

ALTER TABLE gft.contacts ADD CONSTRAINT fk_contacts_entity
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE SET NULL;

ALTER TABLE gft.companies ADD CONSTRAINT fk_companies_entity
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE SET NULL;

ALTER TABLE gft.activities ADD CONSTRAINT fk_activities_contact
  FOREIGN KEY (contact_id) REFERENCES gft.contacts(id) ON DELETE CASCADE;

ALTER TABLE gft.activities ADD CONSTRAINT fk_activities_company
  FOREIGN KEY (company_id) REFERENCES gft.companies(id) ON DELETE SET NULL;

ALTER TABLE gft.li_post_engagements ADD CONSTRAINT fk_engagements_post
  FOREIGN KEY (post_id) REFERENCES gft.li_posts(id) ON DELETE CASCADE;

ALTER TABLE gft.li_post_engagements ADD CONSTRAINT fk_engagements_contact
  FOREIGN KEY (contact_id) REFERENCES gft.contacts(id) ON DELETE CASCADE;

-- PART 9: TRIGGERS
CREATE TRIGGER update_gft_contacts_updated_at
  BEFORE UPDATE ON gft.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gft_companies_updated_at
  BEFORE UPDATE ON gft.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PART 10: ROW LEVEL SECURITY
ALTER TABLE gft.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.li_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.li_post_engagements ENABLE ROW LEVEL SECURITY;

-- PART 11: RLS POLICIES (using explicit UUID cast for safety)
CREATE POLICY "gft_contacts_owner" ON gft.contacts
  FOR ALL USING (owner_id = (SELECT auth.uid())::uuid);

CREATE POLICY "gft_companies_owner" ON gft.companies
  FOR ALL USING (owner_id = (SELECT auth.uid())::uuid);

CREATE POLICY "gft_activities_owner" ON gft.activities
  FOR ALL USING (owner_id = (SELECT auth.uid())::uuid);

CREATE POLICY "gft_li_posts_owner" ON gft.li_posts
  FOR ALL USING (owner_id = (SELECT auth.uid())::uuid);

CREATE POLICY "gft_engagements_via_post" ON gft.li_post_engagements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM gft.li_posts WHERE id = post_id AND owner_id = (SELECT auth.uid())::uuid)
  );

-- Service role bypass
CREATE POLICY "gft_contacts_service" ON gft.contacts FOR ALL TO service_role USING (true);
CREATE POLICY "gft_companies_service" ON gft.companies FOR ALL TO service_role USING (true);
CREATE POLICY "gft_activities_service" ON gft.activities FOR ALL TO service_role USING (true);
CREATE POLICY "gft_li_posts_service" ON gft.li_posts FOR ALL TO service_role USING (true);
CREATE POLICY "gft_engagements_service" ON gft.li_post_engagements FOR ALL TO service_role USING (true);

-- PART 12: EXPOSE SCHEMA TO POSTGREST
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft';
NOTIFY pgrst, 'reload config';

-- PART 13: COMMENTS
COMMENT ON SCHEMA gft IS 'GuyForThat CRM layer - contacts, companies, activities';
COMMENT ON TABLE gft.contacts IS 'LinkedIn profiles and contact information';
COMMENT ON TABLE gft.companies IS 'Company data linked to contacts';
COMMENT ON TABLE gft.activities IS 'Outreach activities';
COMMENT ON TABLE gft.li_posts IS 'Your LinkedIn posts';
COMMENT ON TABLE gft.li_post_engagements IS 'Post engagement tracking';
