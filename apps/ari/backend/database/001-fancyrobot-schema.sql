-- Migration: Create fancyrobot schema for ARI data in GFT Supabase
-- Run in: zulowgscotdrqlccomht.supabase.co SQL editor

-- Create schema
CREATE SCHEMA IF NOT EXISTS fancyrobot;
GRANT USAGE ON SCHEMA fancyrobot TO anon, authenticated;

-- Snapshot runs (lite reports)
CREATE TABLE fancyrobot.snapshot_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    company_name TEXT,
    company_id UUID REFERENCES gft.companies(id),
    discovery JSONB,
    analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit runs (full audits)
CREATE TABLE fancyrobot.audit_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    company_name TEXT,
    company_id UUID REFERENCES gft.companies(id),
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

-- Audit prompt results (normalized)
CREATE TABLE fancyrobot.audit_prompt_results (
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

-- Indexes
CREATE INDEX idx_fr_snap_domain ON fancyrobot.snapshot_runs(domain);
CREATE INDEX idx_fr_snap_company ON fancyrobot.snapshot_runs(company_id);
CREATE INDEX idx_fr_snap_created ON fancyrobot.snapshot_runs(created_at DESC);
CREATE INDEX idx_fr_audit_domain ON fancyrobot.audit_runs(domain);
CREATE INDEX idx_fr_audit_status ON fancyrobot.audit_runs(status);
CREATE INDEX idx_fr_audit_created ON fancyrobot.audit_runs(created_at DESC);
CREATE INDEX idx_fr_audit_company ON fancyrobot.audit_runs(company_id);
CREATE INDEX idx_fr_prompt_run ON fancyrobot.audit_prompt_results(audit_run_id);

-- RLS (match GFT's open pattern for anon key access)
ALTER TABLE fancyrobot.snapshot_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fancyrobot.audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fancyrobot.audit_prompt_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON fancyrobot.snapshot_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON fancyrobot.audit_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON fancyrobot.audit_prompt_results FOR ALL USING (true) WITH CHECK (true);

-- Grant table access
GRANT ALL ON ALL TABLES IN SCHEMA fancyrobot TO anon, authenticated;
