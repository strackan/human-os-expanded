-- Mark Phase 0.2 integrations as complete
-- Phase 0.2 - MCP Registry & Integrations

-- Update feature statuses (using correct column names: status_id and release_id)
UPDATE features
SET status_id = (SELECT id FROM feature_statuses WHERE slug = 'complete'),
    updated_at = now()
WHERE slug IN ('slack-integration', 'google-calendar-integration', 'gmail-integration')
AND release_id = (SELECT id FROM releases WHERE version = '0.2');

-- Update release status (using correct column name: status_id)
UPDATE releases
SET status_id = (SELECT id FROM release_statuses WHERE slug = 'complete'),
    updated_at = now()
WHERE version = '0.2';

-- Verify changes
SELECT
  r.version,
  r.name as release_name,
  rs.slug as release_status,
  f.slug as feature_slug,
  f.title as feature_name,
  fs.slug as feature_status
FROM releases r
LEFT JOIN release_statuses rs ON rs.id = r.status_id
LEFT JOIN features f ON f.release_id = r.id
LEFT JOIN feature_statuses fs ON fs.id = f.status_id
WHERE r.version = '0.2'
ORDER BY f.created_at;
