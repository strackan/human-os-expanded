-- Snapshot competitors cache: store enriched competitor lists per domain.
-- Brave Answers + domain resolution results cached here to avoid repeated API calls.
-- 30-day TTL enforced at application level (query filters on enriched_at).

CREATE TABLE IF NOT EXISTS fancyrobot.snapshot_competitors (
  domain        TEXT PRIMARY KEY,
  company_name  TEXT DEFAULT '',
  industry      TEXT DEFAULT '',
  competitors   JSONB NOT NULL DEFAULT '[]',
  enriched_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshot_competitors_enriched
  ON fancyrobot.snapshot_competitors(enriched_at DESC);

-- RLS: same open pattern as other fancyrobot tables (anon key pipeline access)
ALTER TABLE fancyrobot.snapshot_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON fancyrobot.snapshot_competitors
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON fancyrobot.snapshot_competitors TO anon, authenticated;
