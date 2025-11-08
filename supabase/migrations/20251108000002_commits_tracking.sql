-- Commits tracking table
-- Logs all git commits with metadata for auditability

CREATE TABLE commits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hash TEXT UNIQUE NOT NULL,
  message TEXT NOT NULL,
  type TEXT,  -- feat, fix, docs, refactor, etc.
  scope TEXT,
  breaking BOOLEAN DEFAULT false,

  -- Git stats
  files_changed INTEGER,
  insertions INTEGER,
  deletions INTEGER,
  branch TEXT,

  -- Feature associations
  feature_slugs TEXT[],

  committed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_commits_hash ON commits(hash);
CREATE INDEX idx_commits_type ON commits(type);
CREATE INDEX idx_commits_committed_at ON commits(committed_at DESC);
CREATE INDEX idx_commits_feature_slugs ON commits USING GIN(feature_slugs);

-- RLS
ALTER TABLE commits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commits are viewable by authenticated users"
  ON commits FOR SELECT
  TO authenticated
  USING (true);

-- Helper: Get commits for a feature
CREATE OR REPLACE FUNCTION get_feature_commits(feature_slug TEXT)
RETURNS TABLE (
  hash TEXT,
  message TEXT,
  type TEXT,
  committed_at TIMESTAMPTZ
) AS $$
  SELECT hash, message, type, committed_at
  FROM commits
  WHERE feature_slug = ANY(feature_slugs)
  ORDER BY committed_at DESC;
$$ LANGUAGE SQL STABLE;
