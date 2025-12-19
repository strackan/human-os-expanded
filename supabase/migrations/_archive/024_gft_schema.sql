-- ============================================
-- GFT (GuyForThat) Schema
-- CRM layer for contacts, companies, and activities
-- ============================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS gft;

-- ============================================
-- CONTACTS TABLE (LinkedIn profiles + CRM data)
-- ============================================
CREATE TABLE gft.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Ownership (links to human_os.users)
  owner_id UUID NOT NULL,  -- Who owns this contact record
  linked_user_id UUID,     -- If this contact becomes a Human OS user

  -- Entity linkage (for context files and knowledge graph)
  entity_id UUID,          -- Links to public.entities for markdown context
  powerpak_expert_id TEXT, -- Links to PowerPak expert (e.g., 'justin-strackany')

  -- Core profile data
  name TEXT NOT NULL,
  linkedin_url TEXT UNIQUE,
  email TEXT,
  phone TEXT,

  -- Professional info
  company TEXT,
  company_id UUID,         -- FK to gft.companies
  linkedin_company_id TEXT,
  current_job_title TEXT,
  headline TEXT,
  location TEXT,

  -- LinkedIn metrics
  mutual_connections INTEGER,
  followers INTEGER,
  connection_degree TEXT,  -- '1st', '2nd', '3rd'

  -- Connection tracking
  connection_status TEXT DEFAULT 'none' CHECK (connection_status IN ('none', 'pending', 'connected', 'following')),
  connection_requested_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,

  -- Change tracking
  last_job_update TIMESTAMPTZ,
  last_company_update TIMESTAMPTZ,

  -- Organization
  labels JSONB DEFAULT '[]'::jsonb,
  notes TEXT,

  -- Metadata
  source TEXT DEFAULT 'linkedin_chrome_extension',
  extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_gft_contacts_owner ON gft.contacts(owner_id);
CREATE INDEX idx_gft_contacts_entity_id ON gft.contacts(entity_id);
CREATE INDEX idx_gft_contacts_powerpak_expert ON gft.contacts(powerpak_expert_id) WHERE powerpak_expert_id IS NOT NULL;
CREATE INDEX idx_gft_contacts_linkedin_url ON gft.contacts(linkedin_url);
CREATE INDEX idx_gft_contacts_company ON gft.contacts(company);
CREATE INDEX idx_gft_contacts_company_id ON gft.contacts(company_id);
CREATE INDEX idx_gft_contacts_linkedin_company_id ON gft.contacts(linkedin_company_id);
CREATE INDEX idx_gft_contacts_name ON gft.contacts(name);
CREATE INDEX idx_gft_contacts_connection_status ON gft.contacts(connection_status);
CREATE INDEX idx_gft_contacts_created_at ON gft.contacts(created_at DESC);
CREATE INDEX idx_gft_contacts_labels ON gft.contacts USING GIN (labels);

-- FK to public.entities (optional - allows orphan contacts)
ALTER TABLE gft.contacts
  ADD CONSTRAINT fk_contacts_entity
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE SET NULL;

-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE gft.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Ownership
  owner_id UUID NOT NULL,

  -- Entity linkage (for context files and knowledge graph)
  entity_id UUID,          -- Links to public.entities for markdown context

  -- LinkedIn identifiers
  linkedin_company_id TEXT UNIQUE,
  linkedin_url TEXT,

  -- Basic info
  name TEXT NOT NULL,
  website TEXT,
  company_type TEXT,       -- 'Public Company', 'Private', 'Nonprofit', etc.
  industry TEXT,
  description TEXT,

  -- Size and metrics
  employee_count INTEGER,
  headquarters TEXT,
  company_size TEXT,       -- '11-50 employees', '501-1000 employees', etc.
  revenue TEXT,

  -- Enrichment
  enrichment_status TEXT DEFAULT 'basic' CHECK (enrichment_status IN ('basic', 'enriched', 'failed')),
  extracted_from TEXT,
  profile_data JSONB,      -- Detailed company data

  -- Outreach tracking
  last_outreach_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_gft_companies_owner ON gft.companies(owner_id);
CREATE INDEX idx_gft_companies_entity_id ON gft.companies(entity_id);
CREATE INDEX idx_gft_companies_linkedin_company_id ON gft.companies(linkedin_company_id);
CREATE INDEX idx_gft_companies_linkedin_url ON gft.companies(linkedin_url);
CREATE INDEX idx_gft_companies_name ON gft.companies(name);
CREATE INDEX idx_gft_companies_industry ON gft.companies(industry);
CREATE INDEX idx_gft_companies_enrichment_status ON gft.companies(enrichment_status);
CREATE INDEX idx_gft_companies_last_outreach_date ON gft.companies(last_outreach_date DESC);

-- FK to public.entities
ALTER TABLE gft.companies
  ADD CONSTRAINT fk_companies_entity
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE SET NULL;

-- Add FK from contacts to companies
ALTER TABLE gft.contacts
  ADD CONSTRAINT fk_contacts_company
  FOREIGN KEY (company_id) REFERENCES gft.companies(id) ON DELETE SET NULL;

-- ============================================
-- ACTIVITIES TABLE (Outreach tracking)
-- ============================================
CREATE TABLE gft.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Ownership
  owner_id UUID NOT NULL,

  -- Relationships
  contact_id UUID NOT NULL REFERENCES gft.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES gft.companies(id) ON DELETE SET NULL,

  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'connection_request', 'message', 'comment', 'like',
    'email', 'call', 'meeting', 'note', 'other'
  )),
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  result TEXT DEFAULT 'pending' CHECK (result IN (
    'pending', 'accepted', 'declined', 'no_response',
    'replied', 'bounced', 'completed', 'cancelled'
  )),

  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_gft_activities_owner ON gft.activities(owner_id);
CREATE INDEX idx_gft_activities_contact_id ON gft.activities(contact_id);
CREATE INDEX idx_gft_activities_company_id ON gft.activities(company_id);
CREATE INDEX idx_gft_activities_activity_type ON gft.activities(activity_type);
CREATE INDEX idx_gft_activities_result ON gft.activities(result);
CREATE INDEX idx_gft_activities_activity_date ON gft.activities(activity_date DESC);
CREATE INDEX idx_gft_activities_contact_type_date ON gft.activities(contact_id, activity_type, activity_date DESC);

-- ============================================
-- LI_POSTS TABLE (Your LinkedIn posts)
-- ============================================
CREATE TABLE gft.li_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Ownership
  owner_id UUID NOT NULL,

  -- Post identifiers
  post_id TEXT NOT NULL,   -- LinkedIn post ID from URL
  li_url TEXT NOT NULL,    -- Full LinkedIn post URL

  -- Content
  post_content TEXT,
  post_type TEXT,

  -- Timing
  date_posted TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(owner_id, post_id)
);

-- Indexes
CREATE INDEX idx_gft_li_posts_owner ON gft.li_posts(owner_id);
CREATE INDEX idx_gft_li_posts_post_id ON gft.li_posts(post_id);
CREATE INDEX idx_gft_li_posts_date_posted ON gft.li_posts(date_posted DESC);

-- ============================================
-- LI_POST_ENGAGEMENTS TABLE
-- ============================================
CREATE TABLE gft.li_post_engagements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships
  post_id UUID NOT NULL REFERENCES gft.li_posts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES gft.contacts(id) ON DELETE CASCADE,

  -- Engagement details
  engagement_type TEXT NOT NULL CHECK (engagement_type IN (
    'like', 'comment', 'share', 'i_commented', 'i_reacted'
  )),
  comment_text TEXT,
  engagement_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(post_id, contact_id, engagement_type)
);

-- Indexes
CREATE INDEX idx_gft_engagements_post_id ON gft.li_post_engagements(post_id);
CREATE INDEX idx_gft_engagements_contact_id ON gft.li_post_engagements(contact_id);
CREATE INDEX idx_gft_engagements_engagement_date ON gft.li_post_engagements(engagement_date DESC);
CREATE INDEX idx_gft_engagements_type ON gft.li_post_engagements(engagement_type);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_gft_contacts_updated_at
  BEFORE UPDATE ON gft.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gft_companies_updated_at
  BEFORE UPDATE ON gft.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE gft.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.li_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gft.li_post_engagements ENABLE ROW LEVEL SECURITY;

-- Owner-based policies
CREATE POLICY "gft_contacts_owner" ON gft.contacts
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "gft_companies_owner" ON gft.companies
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "gft_activities_owner" ON gft.activities
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "gft_li_posts_owner" ON gft.li_posts
  FOR ALL USING (owner_id = auth.uid());

-- Engagements policy (via post ownership)
CREATE POLICY "gft_engagements_via_post" ON gft.li_post_engagements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM gft.li_posts WHERE id = post_id AND owner_id = auth.uid())
  );

-- Service role bypass
CREATE POLICY "gft_contacts_service" ON gft.contacts FOR ALL TO service_role USING (true);
CREATE POLICY "gft_companies_service" ON gft.companies FOR ALL TO service_role USING (true);
CREATE POLICY "gft_activities_service" ON gft.activities FOR ALL TO service_role USING (true);
CREATE POLICY "gft_li_posts_service" ON gft.li_posts FOR ALL TO service_role USING (true);
CREATE POLICY "gft_engagements_service" ON gft.li_post_engagements FOR ALL TO service_role USING (true);

-- ============================================
-- EXPOSE SCHEMA TO POSTGREST
-- ============================================
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,human_os,founder_os,gft';
NOTIFY pgrst, 'reload config';

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA gft IS 'GuyForThat CRM layer - contacts, companies, activities';
COMMENT ON TABLE gft.contacts IS 'LinkedIn profiles and contact information. Links to public.entities for context files and optionally to PowerPak experts.';
COMMENT ON TABLE gft.companies IS 'Company data linked to contacts. Links to public.entities for context files.';
COMMENT ON TABLE gft.activities IS 'Outreach activities (connection requests, messages, etc.)';
COMMENT ON TABLE gft.li_posts IS 'Your LinkedIn posts for engagement tracking';
COMMENT ON TABLE gft.li_post_engagements IS 'Who engaged with your posts';
COMMENT ON COLUMN gft.contacts.entity_id IS 'Links to public.entities for markdown context files in Supabase Storage';
COMMENT ON COLUMN gft.contacts.powerpak_expert_id IS 'Links to PowerPak expert ID (e.g., justin-strackany) for SKILL.md files';
COMMENT ON COLUMN gft.companies.entity_id IS 'Links to public.entities for markdown context files in Supabase Storage';
