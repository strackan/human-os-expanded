-- Database Migration: v1.6.1
-- Description: Add Pinning and Hiding Functionality to UserMood Model
-- Date: 2025-07-12
-- Requires: v1.6.0

-- Add pinning and hiding fields to user_moods table
ALTER TABLE user_moods ADD COLUMN is_pinned BOOLEAN DEFAULT false;
ALTER TABLE user_moods ADD COLUMN is_hidden BOOLEAN DEFAULT false;
ALTER TABLE user_moods ADD COLUMN pin_order INTEGER;
ALTER TABLE user_moods ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE user_moods ADD COLUMN last_used_at DATETIME;
ALTER TABLE user_moods ADD COLUMN first_used_at DATETIME;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_moods_pinned ON user_moods(user_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_user_moods_hidden ON user_moods(user_id, is_hidden);
CREATE INDEX IF NOT EXISTS idx_user_moods_pin_order ON user_moods(user_id, pin_order);
CREATE INDEX IF NOT EXISTS idx_user_moods_usage_count ON user_moods(user_id, usage_count);
CREATE INDEX IF NOT EXISTS idx_user_moods_last_used ON user_moods(user_id, last_used_at);

-- Update database version
UPDATE database_versions SET 
    version = 'v1.6.1',
    description = 'Add Pinning and Hiding Functionality to UserMood Model',
    applied_at = CURRENT_TIMESTAMP
WHERE version = 'v1.6.0';

-- If no version record exists, create one
INSERT OR IGNORE INTO database_versions (version, description, applied_at)
VALUES ('v1.6.1', 'Add Pinning and Hiding Functionality to UserMood Model', CURRENT_TIMESTAMP);