-- Contact form submissions across the product portfolio.
-- Each product sets product_id to identify where the request came from.

CREATE TABLE IF NOT EXISTS crm.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,              -- e.g. 'fancy-robot', 'renubu', 'goodhang'
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT,                          -- free-form (product description, notes, etc.)
  snapshot_domain TEXT,                  -- optional: domain from a snapshot run
  metadata JSONB DEFAULT '{}',           -- extra context (referrer, IP, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for looking up submissions by product
CREATE INDEX idx_contact_submissions_product ON crm.contact_submissions (product_id);

-- Index for looking up by email
CREATE INDEX idx_contact_submissions_email ON crm.contact_submissions (email);

-- RLS
ALTER TABLE crm.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything; anon can insert (form submissions)
CREATE POLICY "service_full_access" ON crm.contact_submissions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert" ON crm.contact_submissions
  FOR INSERT WITH CHECK (true);
