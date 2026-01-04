-- Link GitHub Issues to Features
-- Phase 0.2: Add github_issue_number field and update features

-- Add github_issue_number column to features table
ALTER TABLE features
ADD COLUMN IF NOT EXISTS github_issue_number INTEGER;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_features_github_issue
ON features(github_issue_number);

-- Link Phase 0.2 features to their GitHub issues
UPDATE features
SET github_issue_number = 2
WHERE slug = 'mcp-registry-infrastructure';

UPDATE features
SET github_issue_number = 3
WHERE slug = 'google-calendar-integration';

UPDATE features
SET github_issue_number = 4
WHERE slug = 'slack-integration';

UPDATE features
SET github_issue_number = 5
WHERE slug = 'gmail-integration';

-- Add the GitHub Projects Evaluation feature
INSERT INTO features (
  slug, title, status_id, category_id, release_id,
  priority, effort_hrs, business_case, github_issue_number
) VALUES (
  'github-projects-evaluation',
  'GitHub Projects Evaluation',
  (SELECT id FROM feature_statuses WHERE slug = 'planned'),
  (SELECT id FROM feature_categories WHERE slug = 'infrastructure'),
  (SELECT id FROM releases WHERE version = '0.2'),
  5,
  2,
  'Evaluate GitHub Projects V2 effectiveness during Phase 0.2. Decision point: keep, deprecate, or hybrid approach with ROADMAP.md.',
  6
);

-- Ensure releases has updated_at column before updating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'releases' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE releases ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update release 0.2 status to in_progress
UPDATE releases
SET status_id = (SELECT id FROM release_statuses WHERE slug = 'in_progress')
WHERE version = '0.2';

-- Comment for tracking
COMMENT ON COLUMN features.github_issue_number IS 'GitHub issue number for two-way sync between database and GitHub Projects';
