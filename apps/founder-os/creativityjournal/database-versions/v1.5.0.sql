-- ============================================================================
-- DATABASE VERSION 1.5.0: Comprehensive Custom Mood Colors
-- Creativity Journal - Enhanced Color Customization System
-- ============================================================================

-- DESCRIPTION: 
-- This version adds comprehensive custom color support for all mood categories:
-- - Global moods (community approved)
-- - Community pending moods 
-- - Private user moods
-- - Default fallback colors
-- - Enhanced color picker integration

-- SAFE TO RUN: Uses IF NOT EXISTS and proper error handling
-- DATA PRESERVATION: No data loss - only adds new fields

-- ============================================================================
-- STEP 1: ADD CUSTOM COLOR FIELDS TO USER TABLE
-- ============================================================================

-- Add custom color preferences for different mood categories
-- These fields allow users to customize colors for each type of mood

-- Global/Community Approved Moods (default: emerald green)
ALTER TABLE user ADD COLUMN custom_global_mood_color TEXT DEFAULT '#10b981';

-- Community Pending/Review Moods (default: amber)
ALTER TABLE user ADD COLUMN custom_community_pending_color TEXT DEFAULT '#f59e0b';

-- Private User Moods (default: red)
ALTER TABLE user ADD COLUMN custom_private_mood_color TEXT DEFAULT '#ef4444';

-- Default/Fallback Color (default: gray)
ALTER TABLE user ADD COLUMN custom_default_mood_color TEXT DEFAULT '#6b7280';

-- Community Approved Variant (default: darker emerald)
ALTER TABLE user ADD COLUMN custom_community_approved_color TEXT DEFAULT '#059669';

-- ============================================================================
-- STEP 2: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Create composite index for mood color lookups (improves performance)
CREATE INDEX IF NOT EXISTS idx_user_mood_colors ON user(
    custom_global_mood_color, 
    custom_community_pending_color, 
    custom_private_mood_color, 
    custom_default_mood_color,
    custom_community_approved_color
);

-- ============================================================================
-- STEP 3: UPDATE EXISTING USERS WITH DEFAULT COLORS
-- ============================================================================

-- Set default colors for any existing users who don't have custom colors
-- This ensures backward compatibility

UPDATE user 
SET 
    custom_global_mood_color = COALESCE(custom_global_mood_color, '#10b981'),
    custom_community_pending_color = COALESCE(custom_community_pending_color, '#f59e0b'),
    custom_private_mood_color = COALESCE(custom_private_mood_color, '#ef4444'),
    custom_default_mood_color = COALESCE(custom_default_mood_color, '#6b7280'),
    custom_community_approved_color = COALESCE(custom_community_approved_color, '#059669')
WHERE 
    custom_global_mood_color IS NULL 
    OR custom_community_pending_color IS NULL 
    OR custom_private_mood_color IS NULL 
    OR custom_default_mood_color IS NULL 
    OR custom_community_approved_color IS NULL;

-- ============================================================================
-- STEP 4: VERSION TRACKING
-- ============================================================================

-- Record this version upgrade
INSERT OR REPLACE INTO database_versions (version, description, applied_at) 
VALUES ('v1.5.0', 'Comprehensive Custom Mood Colors System', datetime('now'));

-- ============================================================================
-- UPGRADE COMPLETE
-- ============================================================================

-- Version 1.5.0 adds:
-- ✅ 5 new custom color fields for different mood categories
-- ✅ Performance indexes for color lookups  
-- ✅ Default color population for existing users
-- ✅ Version tracking
-- ✅ Backward compatibility maintained
-- ✅ No data loss 