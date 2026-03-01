-- Brand cache: store keyword → domain mappings from Brave Search
-- so repeated brand lookups don't burn API calls.

CREATE TABLE IF NOT EXISTS fancyrobot.brand_cache (
  keyword    TEXT PRIMARY KEY,
  domain     TEXT NOT NULL,
  title      TEXT DEFAULT '',
  resolved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_cache_domain
  ON fancyrobot.brand_cache(domain);

GRANT ALL ON fancyrobot.brand_cache TO anon, authenticated;
