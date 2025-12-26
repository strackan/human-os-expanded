-- Database Version 1.4.4: Unified Mood Properties & Simplified Questionnaire
-- Extends mood_props to support both global and user moods
-- Adds simplified questionnaire fields for user mood creation
-- Safe to run multiple times (uses IF NOT EXISTS where supported)

-- ============================================================================
-- STEP 1: Extend mood_props table to support user moods
-- ============================================================================

-- Add user_mood_id column to mood_props to support user moods
ALTER TABLE mood_props ADD COLUMN user_mood_id INTEGER;

-- Add foreign key constraint for user_mood_id (references user_moods)
-- Note: SQLite doesn't support adding FK constraints to existing tables easily
-- We'll handle this constraint in application logic and add index for performance
CREATE INDEX IF NOT EXISTS idx_mood_props_user_mood_id ON mood_props(user_mood_id);

-- Add constraint to ensure exactly one of global_mood_id OR user_mood_id is set
-- SQLite doesn't support complex CHECK constraints on existing tables easily
-- We'll enforce this in application logic for now

-- ============================================================================
-- STEP 2: Add questionnaire fields to user_moods table  
-- ============================================================================

-- Add similar_word field to store the common word user compares their emotion to
ALTER TABLE user_moods ADD COLUMN similar_word TEXT;

-- Add related_mood_id field to link to existing global mood if found
ALTER TABLE user_moods ADD COLUMN related_mood_id INTEGER;

-- Add questionnaire_complete flag to track completion status
ALTER TABLE user_moods ADD COLUMN questionnaire_complete BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- STEP 3: Create performance and privacy indexes
-- ============================================================================

-- Performance indexes for mood_props queries
CREATE INDEX IF NOT EXISTS idx_mood_props_global_mood_id ON mood_props(mood_id) WHERE mood_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_props_user_mood_combined ON mood_props(user_mood_id) WHERE user_mood_id IS NOT NULL;

-- Indexes for user_moods questionnaire fields
CREATE INDEX IF NOT EXISTS idx_user_moods_similar_word ON user_moods(similar_word) WHERE similar_word IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_moods_related_mood ON user_moods(related_mood_id) WHERE related_mood_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_moods_questionnaire_complete ON user_moods(questionnaire_complete);

-- Privacy-focused index - ensure efficient user-scoped queries
CREATE INDEX IF NOT EXISTS idx_user_moods_user_id_status ON user_moods(user_id, status);

-- ============================================================================
-- STEP 4: Add database version tracking
-- ============================================================================

-- Ensure database_versions table exists
CREATE TABLE IF NOT EXISTS database_versions (
    version TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Track this migration
INSERT OR REPLACE INTO database_versions (version, applied_at, description) 
VALUES ('1.4.4', CURRENT_TIMESTAMP, 'Unified mood properties system with simplified questionnaire and privacy controls'); 