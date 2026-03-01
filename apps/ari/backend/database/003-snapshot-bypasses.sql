-- Bypass table: insert a domain row to unlock its full snapshot report.
-- e.g. INSERT INTO fancyrobot.snapshot_bypasses (domain, note) VALUES ('newsusa.com', 'Rick demo');

CREATE TABLE fancyrobot.snapshot_bypasses (
  domain TEXT PRIMARY KEY,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fancyrobot.snapshot_bypasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read" ON fancyrobot.snapshot_bypasses
  FOR SELECT USING (true);
