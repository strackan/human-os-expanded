-- Database Version 1.4.6: Custom User Mood Colors
-- Adds custom_mood_hex_code field to user table for personalized mood colors
-- Safe to run multiple times

-- ============================================================================
-- STEP 1: Add custom_mood_hex_code to user table
-- ============================================================================

-- Add custom mood color field to user table
-- Default to a nice emerald green (#10b981)
ALTER TABLE user ADD COLUMN custom_mood_hex_code TEXT DEFAULT '#10b981';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the column was added successfully
-- This will show the updated schema
-- SELECT sql FROM sqlite_master WHERE name='user'; 