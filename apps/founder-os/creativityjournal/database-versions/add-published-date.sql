-- Safe SQL script to add publishedDate field to entry table
-- This script is designed to be run with the protection system
-- It preserves all existing data while adding the new field

-- Add publishedDate column to entry table if it doesn't exist
ALTER TABLE entry ADD COLUMN published_date DATETIME DEFAULT NULL;

-- Create an index for better performance on published date queries
CREATE INDEX IF NOT EXISTS idx_entry_published_date ON entry(published_date);

-- Create an index for queries filtering by status and published date
CREATE INDEX IF NOT EXISTS idx_entry_status_published ON entry(status_id, published_date);

-- Verify the column was added successfully
SELECT 
    COUNT(*) as total_entries,
    COUNT(published_date) as entries_with_published_date
FROM entry; 