-- Consolidated fancyrobot schema — ARI core tables
-- Merged from apps/ari/backend/database/ migrations 001–007
-- All IF NOT EXISTS for idempotency (tables already exist in cloud)

-- ============================================================
-- Schema + grants
-- ============================================================

CREATE SCHEMA IF NOT EXISTS fancyrobot;
GRANT USAGE ON SCHEMA fancyrobot TO anon, authenticated;

-- ============================================================
-- Snapshot runs (lite reports)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.snapshot_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    company_name TEXT,
    entity_id UUID,  -- references human_os.entities(id), FK applied at app level
    discovery JSONB,
    analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_snap_domain ON fancyrobot.snapshot_runs(domain);
CREATE INDEX IF NOT EXISTS idx_fr_snap_entity ON fancyrobot.snapshot_runs(entity_id);
CREATE INDEX IF NOT EXISTS idx_fr_snap_created ON fancyrobot.snapshot_runs(created_at DESC);

ALTER TABLE fancyrobot.snapshot_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon_all_snapshot_runs" ON fancyrobot.snapshot_runs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Audit runs (full audits)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.audit_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    company_name TEXT,
    entity_id UUID,  -- references human_os.entities(id), FK applied at app level
    status TEXT DEFAULT 'pending',
    report_type TEXT DEFAULT 'full_audit',
    brand_profile JSONB,
    analysis_result JSONB,
    anti_patterns JSONB DEFAULT '[]',
    gap_analysis JSONB DEFAULT '[]',
    report_sections JSONB,
    pdf_url TEXT,
    overall_score FLOAT DEFAULT 0,
    severity_band TEXT,
    cost_usd FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fr_audit_domain ON fancyrobot.audit_runs(domain);
CREATE INDEX IF NOT EXISTS idx_fr_audit_status ON fancyrobot.audit_runs(status);
CREATE INDEX IF NOT EXISTS idx_fr_audit_created ON fancyrobot.audit_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fr_audit_entity ON fancyrobot.audit_runs(entity_id);

ALTER TABLE fancyrobot.audit_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon_all_audit_runs" ON fancyrobot.audit_runs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Audit prompt results (normalized per-prompt data)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.audit_prompt_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_run_id UUID REFERENCES fancyrobot.audit_runs(id) ON DELETE CASCADE,
    prompt_text TEXT,
    dimension TEXT,
    persona TEXT,
    topic TEXT,
    provider TEXT,
    model_version TEXT,
    raw_response TEXT,
    brand_mentioned BOOLEAN DEFAULT FALSE,
    position INT,
    recommendation_type TEXT,
    sentiment TEXT,
    confidence FLOAT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    tokens_used INT
);

CREATE INDEX IF NOT EXISTS idx_fr_prompt_run ON fancyrobot.audit_prompt_results(audit_run_id);

ALTER TABLE fancyrobot.audit_prompt_results ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon_all_audit_prompt_results" ON fancyrobot.audit_prompt_results FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Snapshot bypasses (domain-level gate unlock)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.snapshot_bypasses (
    domain TEXT PRIMARY KEY,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fancyrobot.snapshot_bypasses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon_read_bypasses" ON fancyrobot.snapshot_bypasses FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Brand cache (Brave Search keyword → domain mappings)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.brand_cache (
    keyword TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    title TEXT DEFAULT '',
    resolved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_cache_domain ON fancyrobot.brand_cache(domain);

GRANT ALL ON fancyrobot.brand_cache TO anon, authenticated;

-- ============================================================
-- Snapshot competitors cache (Brave Answers enrichment)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.snapshot_competitors (
    domain TEXT PRIMARY KEY,
    company_name TEXT DEFAULT '',
    industry TEXT DEFAULT '',
    competitors JSONB NOT NULL DEFAULT '[]',
    enriched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshot_competitors_enriched ON fancyrobot.snapshot_competitors(enriched_at DESC);

ALTER TABLE fancyrobot.snapshot_competitors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon_all_snapshot_competitors" ON fancyrobot.snapshot_competitors FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT ALL ON fancyrobot.snapshot_competitors TO anon, authenticated;

-- ============================================================
-- Promo codes (snapshot gate bypass)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.promo_codes (
    code TEXT PRIMARY KEY,
    bypass_gate BOOLEAN DEFAULT TRUE,
    max_uses INT,
    uses INT DEFAULT 0,
    note TEXT DEFAULT '',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fancyrobot.promo_codes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon_read_promo_codes" ON fancyrobot.promo_codes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "service_write_promo_codes" ON fancyrobot.promo_codes FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed the internal code
INSERT INTO fancyrobot.promo_codes (code, bypass_gate, max_uses, uses, note, expires_at)
VALUES ('STRACKAN', TRUE, NULL, 0, 'Internal — free reports', NULL)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Article runs (pipeline lifecycle)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.article_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_slug TEXT NOT NULL,
    domain TEXT NOT NULL,
    article_topic TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    input_data JSONB,
    writer_output JSONB,
    editor_output JSONB,
    optimizer_output JSONB,
    cost_usd FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fr_article_customer ON fancyrobot.article_runs(customer_slug);
CREATE INDEX IF NOT EXISTS idx_fr_article_domain ON fancyrobot.article_runs(domain);
CREATE INDEX IF NOT EXISTS idx_fr_article_status ON fancyrobot.article_runs(status);
CREATE INDEX IF NOT EXISTS idx_fr_article_created ON fancyrobot.article_runs(created_at DESC);

ALTER TABLE fancyrobot.article_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon_all_article_runs" ON fancyrobot.article_runs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Gumshoe payloads (cached parsed CSV data per customer)
-- ============================================================

CREATE TABLE IF NOT EXISTS fancyrobot.gumshoe_payloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_slug TEXT NOT NULL,
    brand_domain TEXT NOT NULL,
    persona_filter TEXT DEFAULT '',
    payload JSONB NOT NULL,
    source_files TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_gumshoe_customer ON fancyrobot.gumshoe_payloads(customer_slug);
CREATE INDEX IF NOT EXISTS idx_fr_gumshoe_domain ON fancyrobot.gumshoe_payloads(brand_domain);

ALTER TABLE fancyrobot.gumshoe_payloads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "anon_all_gumshoe_payloads" ON fancyrobot.gumshoe_payloads FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Grant all tables to anon + authenticated
-- ============================================================

GRANT ALL ON ALL TABLES IN SCHEMA fancyrobot TO anon, authenticated;
