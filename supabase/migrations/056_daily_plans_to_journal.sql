-- 056_daily_plans_to_journal.sql
-- Migrate daily_plans to journal entries with energy/stress tracking

-- =============================================================================
-- STEP 1: Add energy and stress columns to journal_entries
-- =============================================================================

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
ADD COLUMN IF NOT EXISTS stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10);

COMMENT ON COLUMN journal_entries.energy_level IS 'Physical energy level 1-10 (1=exhausted, 10=energized)';
COMMENT ON COLUMN journal_entries.stress_level IS 'Stress level 1-10 (1=calm, 10=highly stressed)';

-- Index for querying by vitals
CREATE INDEX IF NOT EXISTS idx_journal_entries_energy ON journal_entries(energy_level) WHERE energy_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_stress ON journal_entries(stress_level) WHERE stress_level IS NOT NULL;

-- =============================================================================
-- STEP 2: Update entry_type constraint to include 'daily_plan'
-- =============================================================================

-- Drop and recreate constraint with new type
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_entry_type_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_entry_type_check
  CHECK (entry_type IN ('freeform', 'gratitude', 'mood_check', 'mindfulness', 'reflection', 'daily_review', 'daily_plan'));

-- =============================================================================
-- STEP 3: Add legacy reference column
-- =============================================================================

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS legacy_daily_plan_id UUID;
CREATE INDEX IF NOT EXISTS idx_journal_entries_legacy_daily_plan ON journal_entries(legacy_daily_plan_id);

-- =============================================================================
-- STEP 4: Migrate morning intentions
-- =============================================================================

INSERT INTO journal_entries (
  owner_id,
  layer,
  title,
  content,
  entry_type,
  mode,
  energy_level,
  stress_level,
  status,
  is_private,
  entry_date,
  created_at,
  legacy_daily_plan_id
)
SELECT
  dp.user_id as owner_id,
  'founder:' || dp.user_id::text as layer,
  'Daily Plan: ' || to_char(dp.plan_date, 'Mon DD, YYYY') as title,
  COALESCE(dp.morning_intention, 'No intention recorded') as content,
  'daily_plan' as entry_type,
  'morning' as mode,
  dp.energy_level,
  dp.stress_level,
  'published' as status,
  true as is_private,
  dp.plan_date as entry_date,
  dp.created_at,
  dp.id as legacy_daily_plan_id
FROM founder_os.daily_plans dp
WHERE dp.morning_intention IS NOT NULL
  AND dp.morning_intention != ''
  AND NOT EXISTS (
    SELECT 1 FROM journal_entries j
    WHERE j.legacy_daily_plan_id = dp.id
      AND j.entry_type = 'daily_plan'
  );

-- =============================================================================
-- STEP 5: Migrate evening reflections
-- =============================================================================

INSERT INTO journal_entries (
  owner_id,
  layer,
  title,
  content,
  entry_type,
  mode,
  energy_level,
  stress_level,
  status,
  is_private,
  entry_date,
  created_at,
  legacy_daily_plan_id
)
SELECT
  dp.user_id as owner_id,
  'founder:' || dp.user_id::text as layer,
  'Evening Reflection: ' || to_char(dp.plan_date, 'Mon DD, YYYY') as title,
  dp.evening_reflection as content,
  'daily_review' as entry_type,
  'evening' as mode,
  dp.energy_level,
  dp.stress_level,
  'published' as status,
  true as is_private,
  dp.plan_date as entry_date,
  COALESCE(dp.updated_at, dp.created_at) as created_at,
  dp.id as legacy_daily_plan_id
FROM founder_os.daily_plans dp
WHERE dp.evening_reflection IS NOT NULL
  AND dp.evening_reflection != ''
  AND NOT EXISTS (
    SELECT 1 FROM journal_entries j
    WHERE j.legacy_daily_plan_id = dp.id
      AND j.entry_type = 'daily_review'
  );

-- =============================================================================
-- STEP 6: Add deprecation comment to daily_plans table
-- =============================================================================

COMMENT ON TABLE founder_os.daily_plans IS
  'DEPRECATED: Use journal_entries with entry_type=''daily_plan'' or ''daily_review'' instead.
   Morning intentions migrated to entry_type=daily_plan, mode=morning.
   Evening reflections migrated to entry_type=daily_review, mode=evening.
   Energy and stress levels are now columns on journal_entries.
   Time blocks should be moved to calendar integration.
   This table will be removed in a future release.';

-- =============================================================================
-- STEP 7: Create backwards-compatible view
-- =============================================================================

CREATE OR REPLACE VIEW founder_os.daily_plans_view AS
SELECT
  j_morning.legacy_daily_plan_id as id,
  j_morning.owner_id as user_id,
  j_morning.entry_date as plan_date,
  j_morning.content as morning_intention,
  NULL::jsonb as time_blocks,  -- Not migrated - should go to calendar
  j_evening.content as evening_reflection,
  COALESCE(j_morning.energy_level, j_evening.energy_level) as energy_level,
  COALESCE(j_morning.stress_level, j_evening.stress_level) as stress_level,
  j_morning.created_at,
  GREATEST(j_morning.updated_at, j_evening.updated_at) as updated_at
FROM journal_entries j_morning
LEFT JOIN journal_entries j_evening
  ON j_evening.legacy_daily_plan_id = j_morning.legacy_daily_plan_id
  AND j_evening.entry_type = 'daily_review'
WHERE j_morning.entry_type = 'daily_plan'
  AND j_morning.legacy_daily_plan_id IS NOT NULL;

COMMENT ON VIEW founder_os.daily_plans_view IS
  'Backwards-compatible view combining daily_plan and daily_review journal entries.
   For new code, query journal_entries directly with entry_type filters.';

GRANT SELECT ON founder_os.daily_plans_view TO service_role;

-- =============================================================================
-- STEP 8: Verify migration
-- =============================================================================

DO $$
DECLARE
  old_count INTEGER;
  morning_count INTEGER;
  evening_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM founder_os.daily_plans;
  SELECT COUNT(*) INTO morning_count FROM journal_entries WHERE entry_type = 'daily_plan' AND legacy_daily_plan_id IS NOT NULL;
  SELECT COUNT(*) INTO evening_count FROM journal_entries WHERE entry_type = 'daily_review' AND legacy_daily_plan_id IS NOT NULL;
  RAISE NOTICE 'Daily plans migration: % original records -> % morning intentions + % evening reflections',
    old_count, morning_count, evening_count;
END $$;
