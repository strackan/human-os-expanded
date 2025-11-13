-- Mark Phase 0.2 integrations as complete
-- Phase 0.2 - MCP Registry & Integrations

UPDATE features
SET status = 'complete',
    updated_at = now()
WHERE slug IN ('slack-integration', 'google-calendar-integration', 'gmail-integration')
AND release_version = '0.2';

-- Update release status
UPDATE releases
SET status = 'complete',
    updated_at = now()
WHERE version = '0.2';

-- Verify changes
SELECT
  r.version,
  r.name as release_name,
  r.status as release_status,
  f.slug,
  f.name as feature_name,
  f.status as feature_status
FROM releases r
LEFT JOIN features f ON f.release_version = r.version
WHERE r.version = '0.2'
ORDER BY f.display_order;
