-- Add secret_message column to adventure_visitors
-- Stores a generated Cold War spy code phrase for the book's back page

ALTER TABLE adventure_visitors
  ADD COLUMN IF NOT EXISTS secret_message TEXT;
