-- Human OS Identity Tables
-- Users and verification providers

CREATE SCHEMA IF NOT EXISTS human_os;

-- Core user/identity table
CREATE TABLE human_os.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification providers (Google, LinkedIn = verification, not identity)
CREATE TABLE human_os.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES human_os.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,               -- 'google', 'linkedin', 'email'
  provider_user_id TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  UNIQUE(provider, provider_user_id)
);

-- Entity claiming (scraped entities can be claimed by users)
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES human_os.users(id);
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Indexes
CREATE INDEX idx_users_slug ON human_os.users(slug);
CREATE INDEX idx_users_email ON human_os.users(email);
CREATE INDEX idx_verifications_user ON human_os.user_verifications(user_id);
CREATE INDEX idx_verifications_provider ON human_os.user_verifications(provider, provider_user_id);
CREATE INDEX idx_entities_claimed_by ON public.entities(claimed_by_user_id);
CREATE INDEX idx_entities_source_type ON public.entities(source);
