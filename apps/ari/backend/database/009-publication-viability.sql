-- Publication Viability Index (PVI) — schema additions
-- Adds outcome-tracking columns to publications and supporting indexes.

-- New columns on publications for PVI scoring
ALTER TABLE fancyrobot.publications ADD COLUMN IF NOT EXISTS viability_score FLOAT;
ALTER TABLE fancyrobot.publications ADD COLUMN IF NOT EXISTS validated_hits INT DEFAULT 0;
ALTER TABLE fancyrobot.publications ADD COLUMN IF NOT EXISTS total_attempts INT DEFAULT 0;
ALTER TABLE fancyrobot.publications ADD COLUMN IF NOT EXISTS success_rate FLOAT DEFAULT 0.0;

-- Indexes for viability-based sorting
CREATE INDEX IF NOT EXISTS idx_fr_publications_viability
  ON fancyrobot.publications(viability_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_fr_publications_tier_viability
  ON fancyrobot.publications(recommendation_tier, viability_score DESC NULLS LAST);

-- Composite index for placement lookups by publication + status
CREATE INDEX IF NOT EXISTS idx_fr_artpub_pub_status
  ON fancyrobot.article_publications(publication_id, status);

-- Track when placements are updated
ALTER TABLE fancyrobot.article_publications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
