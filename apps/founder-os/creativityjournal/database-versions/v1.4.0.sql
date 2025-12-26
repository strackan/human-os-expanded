-- Database Version 1.4.0: Dynamic Mood Creation System
-- Adds user custom moods and mood promotion workflow
-- Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS)

-- Create user_moods table for custom user-created moods
CREATE TABLE IF NOT EXISTS user_moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    mood_name TEXT NOT NULL,
    status TEXT DEFAULT 'private' CHECK (status IN ('private', 'pending_approval', 'approved')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    promoted_at DATETIME,
    approval_votes INTEGER DEFAULT 0,
    
    -- Plutchik emotion mappings (0-10 scale)
    joy_rating INTEGER CHECK (joy_rating >= 0 AND joy_rating <= 10),
    trust_rating INTEGER CHECK (trust_rating >= 0 AND trust_rating <= 10),
    fear_rating INTEGER CHECK (fear_rating >= 0 AND fear_rating <= 10),
    surprise_rating INTEGER CHECK (surprise_rating >= 0 AND surprise_rating <= 10),
    sadness_rating INTEGER CHECK (sadness_rating >= 0 AND sadness_rating <= 10),
    anticipation_rating INTEGER CHECK (anticipation_rating >= 0 AND anticipation_rating <= 10),
    anger_rating INTEGER CHECK (anger_rating >= 0 AND anger_rating <= 10),
    disgust_rating INTEGER CHECK (disgust_rating >= 0 AND disgust_rating <= 10),
    
    -- Enhanced emotional intelligence fields (1-10 scale)
    arousal_level INTEGER DEFAULT 5 CHECK (arousal_level >= 1 AND arousal_level <= 10),
    valence INTEGER DEFAULT 5 CHECK (valence >= 1 AND valence <= 10),
    dominance INTEGER DEFAULT 5 CHECK (dominance >= 1 AND dominance <= 10),
    intensity INTEGER DEFAULT 5 CHECK (intensity >= 1 AND intensity <= 10),
    
    -- Constraints
    UNIQUE(user_id, mood_name),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Create mood_promotions table for community mood approval workflow
CREATE TABLE IF NOT EXISTS mood_promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_mood_id INTEGER NOT NULL,
    promoted_by_user_id TEXT NOT NULL,
    global_mood_id INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    rejection_reason TEXT,
    admin_notes TEXT,
    
    -- Constraints
    FOREIGN KEY (user_mood_id) REFERENCES user_moods(id) ON DELETE CASCADE,
    FOREIGN KEY (promoted_by_user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (global_mood_id) REFERENCES mood(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_moods_user_id ON user_moods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moods_status ON user_moods(status);
CREATE INDEX IF NOT EXISTS idx_user_moods_created_at ON user_moods(created_at);
CREATE INDEX IF NOT EXISTS idx_mood_promotions_user_mood_id ON mood_promotions(user_mood_id);
CREATE INDEX IF NOT EXISTS idx_mood_promotions_status ON mood_promotions(status);
CREATE INDEX IF NOT EXISTS idx_mood_promotions_promoted_by ON mood_promotions(promoted_by_user_id);

-- Add version tracking comment
-- Version: 1.4.0
-- Purpose: Dynamic Mood Creation System
-- Features: Custom user moods, Plutchik mappings, community promotion workflow
-- Safe: Uses CREATE IF NOT EXISTS, no data deletion 