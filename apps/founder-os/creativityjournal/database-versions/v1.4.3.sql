-- Database Version: v1.4.3
-- Description: User Mood Entry Associations
-- Date: 2025-07-11
-- Purpose: Add proper support for associating user-created moods with journal entries

-- Add EntryUserMoods table to handle user mood associations
-- This table creates a many-to-many relationship between entries and user-created moods
-- Complements the existing EntryMoods table which handles global mood associations

CREATE TABLE IF NOT EXISTS entry_user_moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_mood_id INTEGER NOT NULL,
    entry_id INTEGER NOT NULL,
    FOREIGN KEY (user_mood_id) REFERENCES user_moods(id) ON DELETE CASCADE,
    FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_entry_user_moods_user_mood_id ON entry_user_moods(user_mood_id);
CREATE INDEX IF NOT EXISTS idx_entry_user_moods_entry_id ON entry_user_moods(entry_id);

-- Create unique constraint to prevent duplicate associations
CREATE UNIQUE INDEX IF NOT EXISTS idx_entry_user_moods_unique ON entry_user_moods(user_mood_id, entry_id);

-- Table creation completed successfully 