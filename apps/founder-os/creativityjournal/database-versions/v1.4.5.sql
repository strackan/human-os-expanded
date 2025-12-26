-- Database Version 1.4.5: Remove Legacy Plutchik Fields from user_moods
-- Now that emotional data has been migrated to unified mood_props table,
-- we can remove the redundant fields from user_moods for cleaner schema

-- ============================================================================
-- STEP 1: Create new user_moods table without legacy Plutchik fields
-- ============================================================================

-- Create new user_moods table with only essential fields
CREATE TABLE user_moods_new (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "mood_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'private',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promoted_at" DATETIME,
    "approval_votes" INTEGER NOT NULL DEFAULT 0,
    
    -- New questionnaire fields
    "similar_word" TEXT,
    "related_mood_id" INTEGER,
    "questionnaire_complete" BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign key constraints
    CONSTRAINT "user_moods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_moods_related_mood_id_fkey" FOREIGN KEY ("related_mood_id") REFERENCES "mood" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================================
-- STEP 2: Copy data from old table (excluding legacy Plutchik fields)
-- ============================================================================

INSERT INTO user_moods_new (
    id, user_id, mood_name, status, description, created_at, promoted_at, approval_votes,
    similar_word, related_mood_id, questionnaire_complete
)
SELECT 
    id, user_id, mood_name, status, description, created_at, promoted_at, approval_votes,
    similar_word, related_mood_id, questionnaire_complete
FROM user_moods;

-- ============================================================================
-- STEP 3: Replace old table with new table
-- ============================================================================

-- Drop the old table
DROP TABLE user_moods;

-- Rename new table to original name
ALTER TABLE user_moods_new RENAME TO user_moods;

-- ============================================================================
-- STEP 4: Recreate indexes and constraints
-- ============================================================================

-- Unique constraint for user_id + mood_name
CREATE UNIQUE INDEX user_moods_user_id_mood_name_key ON user_moods(user_id, mood_name);

-- Performance indexes
CREATE INDEX idx_user_moods_similar_word ON user_moods(similar_word) WHERE similar_word IS NOT NULL;
CREATE INDEX idx_user_moods_related_mood ON user_moods(related_mood_id) WHERE related_mood_id IS NOT NULL;
CREATE INDEX idx_user_moods_questionnaire_complete ON user_moods(questionnaire_complete);
CREATE INDEX idx_user_moods_user_id_status ON user_moods(user_id, status);

-- ============================================================================
-- STEP 5: Update database version
-- ============================================================================

INSERT OR REPLACE INTO database_versions (version, applied_at, description) 
VALUES ('1.4.5', CURRENT_TIMESTAMP, 'Removed legacy Plutchik fields from user_moods table after migration to unified mood_props'); 