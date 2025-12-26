-- Database Migration: v1.6.0
-- Description: Remove Custom Color System - Simplify to Single Universal Color
-- Date: 2025-07-11

-- Remove custom color fields from User table
ALTER TABLE user DROP COLUMN custom_mood_hex_code;
ALTER TABLE user DROP COLUMN custom_global_mood_color;
ALTER TABLE user DROP COLUMN custom_community_pending_color;
ALTER TABLE user DROP COLUMN custom_private_mood_color;
ALTER TABLE user DROP COLUMN custom_default_mood_color;
ALTER TABLE user DROP COLUMN custom_community_approved_color;

-- Remove the custom color index
DROP INDEX IF EXISTS idx_user_mood_colors;

-- Update database version
UPDATE database_version SET 
    version = 'v1.6.0',
    description = 'Remove Custom Color System - Simplify to Single Universal Color',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- If no version record exists, create one
INSERT OR IGNORE INTO database_version (id, version, description, updated_at)
VALUES (1, 'v1.6.0', 'Remove Custom Color System - Simplify to Single Universal Color', CURRENT_TIMESTAMP); 