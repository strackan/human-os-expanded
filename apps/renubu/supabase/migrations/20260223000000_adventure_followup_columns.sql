-- Add followup materials columns to adventure_visitors
-- These store AI-generated personalized content from the LinkedIn extension

ALTER TABLE public.adventure_visitors
  ADD COLUMN IF NOT EXISTS welcome_letter TEXT,
  ADD COLUMN IF NOT EXISTS executive_summary TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT;
