-- Database Version 1.4.4 Fix: Make mood_id nullable in mood_props
-- This allows mood_props to reference either global moods OR user moods
-- SQLite requires recreating the table to modify NOT NULL constraints

-- ============================================================================
-- STEP 1: Create new mood_props table with correct constraints
-- ============================================================================

-- Create new mood_props table with nullable mood_id
CREATE TABLE mood_props_new (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mood_id" INTEGER,  -- Made nullable for user moods
    "user_mood_id" INTEGER,
    "joy_rating" INTEGER,
    "trust_rating" INTEGER,
    "fear_rating" INTEGER,
    "surprise_rating" INTEGER,
    "sadness_rating" INTEGER,
    "anticipation_rating" INTEGER,
    "anger_rating" INTEGER,
    "disgust_rating" INTEGER,
    "core" BOOLEAN NOT NULL DEFAULT false,
    "arousal_level" INTEGER NOT NULL DEFAULT 5,
    "valence" INTEGER NOT NULL DEFAULT 5,
    "dominance" INTEGER NOT NULL DEFAULT 5,
    "intensity" INTEGER NOT NULL DEFAULT 5,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "mood_props_mood_id_fkey" FOREIGN KEY ("mood_id") REFERENCES "mood" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mood_props_user_mood_id_fkey" FOREIGN KEY ("user_mood_id") REFERENCES "user_moods" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Check constraint to ensure exactly one of mood_id OR user_mood_id is set
    CHECK ((mood_id IS NOT NULL AND user_mood_id IS NULL) OR (mood_id IS NULL AND user_mood_id IS NOT NULL))
);

-- ============================================================================
-- STEP 2: Copy existing data to new table
-- ============================================================================

INSERT INTO mood_props_new (
    id, mood_id, joy_rating, trust_rating, fear_rating, surprise_rating,
    sadness_rating, anticipation_rating, anger_rating, disgust_rating,
    core, arousal_level, valence, dominance, intensity, created_at, updated_at
)
SELECT 
    id, mood_id, joy_rating, trust_rating, fear_rating, surprise_rating,
    sadness_rating, anticipation_rating, anger_rating, disgust_rating,
    core, arousal_level, valence, dominance, intensity, created_at, updated_at
FROM mood_props;

-- ============================================================================
-- STEP 3: Replace old table with new table
-- ============================================================================

-- Drop the old table
DROP TABLE mood_props;

-- Rename new table to original name
ALTER TABLE mood_props_new RENAME TO mood_props;

-- ============================================================================
-- STEP 4: Recreate indexes for performance
-- ============================================================================

CREATE INDEX idx_mood_props_user_mood_id ON mood_props(user_mood_id);
CREATE INDEX idx_mood_props_global_mood_id ON mood_props(mood_id) WHERE mood_id IS NOT NULL;
CREATE INDEX idx_mood_props_user_mood_combined ON mood_props(user_mood_id) WHERE user_mood_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Update database version
-- ============================================================================

INSERT OR REPLACE INTO database_versions (version, applied_at, description) 
VALUES ('1.4.4-fix', CURRENT_TIMESTAMP, 'Fixed mood_id nullable constraint in mood_props to support user moods'); 