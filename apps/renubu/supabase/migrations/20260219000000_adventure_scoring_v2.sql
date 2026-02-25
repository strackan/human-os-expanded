-- Adventure Scoring V2: Add baseline-delta model columns
-- Supports verdicts, outcome deltas, bonuses, and enriched scoring

-- Add new columns to adventure_sessions
alter table public.adventure_sessions
  add column if not exists verdict text,
  add column if not exists outcome_delta text,
  add column if not exists bonuses jsonb,
  add column if not exists baseline_score int default 50;
