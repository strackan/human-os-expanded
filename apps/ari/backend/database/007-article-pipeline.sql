-- Article Generation Pipeline tables
-- Stores full pipeline runs and pre-parsed Gumshoe payloads

-- Article runs — lifecycle record for each pipeline execution
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

-- Gumshoe payloads — cached parsed CSV data per customer/persona
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

-- RLS — open policies matching existing fancyrobot tables
ALTER TABLE fancyrobot.article_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_article_runs" ON fancyrobot.article_runs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fancyrobot.gumshoe_payloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_gumshoe_payloads" ON fancyrobot.gumshoe_payloads FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON fancyrobot.article_runs TO anon, authenticated;
GRANT ALL ON fancyrobot.gumshoe_payloads TO anon, authenticated;
