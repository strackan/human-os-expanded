-- 002-entities-standardization.sql
-- Entity Standardization + Fancyrobot Pipeline Fix
--
-- Context: The fancyrobot pipeline writes to gft.companies, but RLS requires
-- gft.has_product_access() which fails for the anon key. This migration:
-- 1. Exposes fancyrobot schema to PostgREST
-- 2. Creates human_os.entities as the universal identity store
-- 3. Links existing users to entities, creates entity_products
-- 4. Redirects fancyrobot pipeline to write entities instead of GFT companies
-- 5. Adds entity_id FK to gft.companies and gft.contacts for CRM enrichment
--
-- Run in GFT Supabase SQL editor (zulowgscotdrqlccomht.supabase.co)

BEGIN;

-- ============================================================
-- Part 1: Expose fancyrobot schema to PostgREST
-- ============================================================

ALTER ROLE authenticator SET pgrst.db_schemas = 'public,human_os,founder_os,gft,crm,fancyrobot';

-- ============================================================
-- Part 2: Create human_os.entities in GFT Supabase
-- ============================================================

DO $$ BEGIN
  CREATE TYPE human_os.entity_type AS ENUM ('person', 'company', 'project');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS human_os.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type human_os.entity_type NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  canonical_name TEXT NOT NULL,
  domain TEXT,
  linkedin_url TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ho_entities_type ON human_os.entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_ho_entities_slug ON human_os.entities(slug);
CREATE INDEX IF NOT EXISTS idx_ho_entities_domain ON human_os.entities(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ho_entities_name ON human_os.entities(canonical_name);
CREATE INDEX IF NOT EXISTS idx_ho_entities_linkedin ON human_os.entities(linkedin_url) WHERE linkedin_url IS NOT NULL;

-- RLS: anon can SELECT + INSERT (pipeline use), authenticated gets full access
ALTER TABLE human_os.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entities_anon_select" ON human_os.entities FOR SELECT TO anon USING (true);
CREATE POLICY "entities_anon_insert" ON human_os.entities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "entities_authenticated_all" ON human_os.entities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "entities_service_all" ON human_os.entities FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA human_os TO anon;
GRANT SELECT, INSERT ON human_os.entities TO anon;
GRANT ALL ON human_os.entities TO authenticated;

-- ============================================================
-- Part 3: Add entity_id to human_os.users + backfill
-- ============================================================

ALTER TABLE human_os.users ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES human_os.entities(id);
CREATE INDEX IF NOT EXISTS idx_ho_users_entity ON human_os.users(entity_id);

-- Backfill: create person entity for each existing user
DO $$
DECLARE
  r RECORD;
  v_entity_id UUID;
BEGIN
  FOR r IN SELECT id, slug, display_name, email, linkedin_url FROM human_os.users WHERE entity_id IS NULL
  LOOP
    INSERT INTO human_os.entities (entity_type, slug, canonical_name, linkedin_url, metadata)
    VALUES ('person', 'user-' || r.slug, r.display_name, r.linkedin_url,
            jsonb_build_object('email', COALESCE(r.email, ''), 'source', 'user_backfill'))
    ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_entity_id;

    UPDATE human_os.users SET entity_id = v_entity_id WHERE id = r.id;
  END LOOP;
END $$;

-- ============================================================
-- Part 4: Add fancy_robot to product enum + entity_products table
-- ============================================================

ALTER TYPE human_os.product_type ADD VALUE IF NOT EXISTS 'fancy_robot';

CREATE TABLE IF NOT EXISTS human_os.entity_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES human_os.entities(id) ON DELETE CASCADE,
  product human_os.product_type NOT NULL,
  tier TEXT DEFAULT 'free',
  activation_key_id UUID,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, product)
);

CREATE INDEX IF NOT EXISTS idx_ho_entity_products_entity ON human_os.entity_products(entity_id);
CREATE INDEX IF NOT EXISTS idx_ho_entity_products_product ON human_os.entity_products(product);

ALTER TABLE human_os.entity_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_products_auth_select" ON human_os.entity_products
  FOR SELECT TO authenticated
  USING (entity_id IN (SELECT entity_id FROM human_os.users WHERE auth_id = auth.uid()));
CREATE POLICY "entity_products_service_all" ON human_os.entity_products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON human_os.entity_products TO authenticated;

-- Backfill from user_products
INSERT INTO human_os.entity_products (entity_id, product, tier, activation_key_id, activated_at, expires_at, metadata, created_at)
SELECT u.entity_id, up.product, up.tier, up.activation_key_id, up.activated_at, up.expires_at, up.metadata, up.created_at
FROM human_os.user_products up
JOIN human_os.users u ON u.id = up.user_id
WHERE u.entity_id IS NOT NULL
ON CONFLICT (entity_id, product) DO NOTHING;

-- ============================================================
-- Part 5: Update has_product_access() to use entity_products
-- ============================================================

CREATE OR REPLACE FUNCTION gft.has_product_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM human_os.users u
    JOIN human_os.entity_products ep ON ep.entity_id = u.entity_id
    WHERE u.auth_id = auth.uid()
      AND ep.product = 'guyforthat'
      AND (ep.expires_at IS NULL OR ep.expires_at > NOW())
  );
$$;

-- ============================================================
-- Part 6: Add entity_id to gft.companies and gft.contacts
-- ============================================================

ALTER TABLE gft.companies ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES human_os.entities(id);
ALTER TABLE gft.contacts ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES human_os.entities(id);
CREATE INDEX IF NOT EXISTS idx_gft_companies_entity ON gft.companies(entity_id);
CREATE INDEX IF NOT EXISTS idx_gft_contacts_entity ON gft.contacts(entity_id);

-- ============================================================
-- Part 7: Update fancyrobot FKs from gft.companies → human_os.entities
-- ============================================================

-- Drop old FK constraints pointing to gft.companies
ALTER TABLE fancyrobot.snapshot_runs DROP CONSTRAINT IF EXISTS snapshot_runs_company_id_fkey;
ALTER TABLE fancyrobot.audit_runs DROP CONSTRAINT IF EXISTS audit_runs_company_id_fkey;

-- Rename columns for clarity
ALTER TABLE fancyrobot.snapshot_runs RENAME COLUMN company_id TO entity_id;
ALTER TABLE fancyrobot.audit_runs RENAME COLUMN company_id TO entity_id;

-- Add new FK constraints to human_os.entities
ALTER TABLE fancyrobot.snapshot_runs
  ADD CONSTRAINT snapshot_runs_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES human_os.entities(id);
ALTER TABLE fancyrobot.audit_runs
  ADD CONSTRAINT audit_runs_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES human_os.entities(id);

-- Rebuild indexes
DROP INDEX IF EXISTS fancyrobot.idx_fr_snap_company;
DROP INDEX IF EXISTS fancyrobot.idx_fr_audit_company;
CREATE INDEX idx_fr_snap_entity ON fancyrobot.snapshot_runs(entity_id);
CREATE INDEX idx_fr_audit_entity ON fancyrobot.audit_runs(entity_id);

-- ============================================================
-- Part 8: Reload PostgREST
-- ============================================================

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

COMMIT;
