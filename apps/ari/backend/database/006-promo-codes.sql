-- Promo codes: bypass the snapshot gate without per-domain rows.
-- e.g. INSERT INTO fancyrobot.promo_codes (code, note) VALUES ('STRACKAN', 'Internal — free reports');

CREATE TABLE fancyrobot.promo_codes (
  code        TEXT PRIMARY KEY,
  bypass_gate BOOLEAN DEFAULT TRUE,
  max_uses    INT,                  -- NULL = unlimited
  uses        INT DEFAULT 0,
  note        TEXT DEFAULT '',
  expires_at  TIMESTAMPTZ,          -- NULL = never expires
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fancyrobot.promo_codes ENABLE ROW LEVEL SECURITY;

-- Anon can read (needed for validation from backend service role, but safe since
-- codes are not secret — they're shared with users).
CREATE POLICY "anon_read" ON fancyrobot.promo_codes
  FOR SELECT USING (true);

-- Only service role can insert/update (increment uses)
CREATE POLICY "service_write" ON fancyrobot.promo_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Seed the initial code
INSERT INTO fancyrobot.promo_codes (code, bypass_gate, max_uses, uses, note, expires_at)
VALUES ('STRACKAN', TRUE, NULL, 0, 'Internal — free reports', NULL);
