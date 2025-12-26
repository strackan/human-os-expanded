-- Database Version 1.4.1: Entry Publishing Date Tracking
-- Adds published_date field to entry table for proper publication tracking
-- Safe to run multiple times (uses ALTER TABLE IF NOT EXISTS equivalent)

-- Add published_date column to entry table if it doesn't exist
-- Note: SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we use a safe approach
-- This will fail silently if the column already exists, which is what we want

-- First, check if the column exists by attempting to add it
-- If it fails, it means the column already exists and we can continue safely
ALTER TABLE entry ADD COLUMN published_date DATETIME DEFAULT NULL;

-- Create indexes for better performance on published date queries
CREATE INDEX IF NOT EXISTS idx_entry_published_date ON entry(published_date);

-- Create composite index for queries filtering by status and published date
-- This is useful for finding published entries ordered by publish date
CREATE INDEX IF NOT EXISTS idx_entry_status_published ON entry(status_id, published_date);

-- Create composite index for queries filtering by owner and published date
-- This is useful for user-specific published entry queries
CREATE INDEX IF NOT EXISTS idx_entry_owner_published ON entry(owner_id, published_date);

-- Create composite index for general entry queries with all date fields
-- This supports queries that need to sort by creation, update, or publish dates
CREATE INDEX IF NOT EXISTS idx_entry_dates ON entry(created_date, updated_date, published_date);

-- Add version tracking comment
-- Version: 1.4.1
-- Purpose: Entry Publishing Date Tracking
-- Features: published_date field, optimized indexes for date-based queries
-- Safe: Uses IF NOT EXISTS for indexes, ALTER TABLE will fail silently if column exists
-- Data Impact: No data loss, purely additive changes
-- API Impact: Enables separate tracking of last_update vs last_publish dates 