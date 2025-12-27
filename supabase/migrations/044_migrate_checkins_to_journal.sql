-- ============================================
-- MIGRATE FOUNDER_OS.CHECK_INS TO JOURNAL_ENTRIES
-- Consolidates check-ins into the richer journal system
-- ============================================

-- =============================================================================
-- STEP 1: Ensure we have mood mappings for check-in moods
-- =============================================================================
-- The check_ins table uses: 'great', 'good', 'okay', 'stressed', 'overwhelmed'
-- Map these to existing Plutchik-based mood_definitions

-- Add 'Great' and 'Good' and 'Okay' moods if they don't exist
INSERT INTO mood_definitions (name, joy_rating, trust_rating, fear_rating, surprise_rating, sadness_rating, anticipation_rating, anger_rating, disgust_rating, intensity, arousal_level, valence, dominance, is_core, category, color_hex) VALUES
('Great', 9, 5, 0, 0, 0, 5, 0, 0, 7, 7, 9, 7, false, 'daily', '#22C55E'),
('Good', 6, 5, 0, 0, 0, 3, 0, 0, 5, 5, 7, 6, false, 'daily', '#84CC16'),
('Okay', 3, 4, 0, 0, 2, 0, 0, 0, 3, 3, 5, 5, false, 'daily', '#A3A3A3')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- STEP 2: Add legacy reference column to journal_entries
-- =============================================================================
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS legacy_check_in_id UUID;
CREATE INDEX IF NOT EXISTS idx_journal_entries_legacy_check_in ON journal_entries(legacy_check_in_id);

-- =============================================================================
-- STEP 3: Create migration function
-- =============================================================================
CREATE OR REPLACE FUNCTION migrate_check_in_to_journal(check_in_record founder_os.check_ins)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_entry_id UUID;
  mood_id UUID;
  mood_name TEXT;
  entry_content TEXT;
  layer_value TEXT;
BEGIN
  -- Map check_in mood to mood_definition name
  CASE check_in_record.mood
    WHEN 'great' THEN mood_name := 'Great';
    WHEN 'good' THEN mood_name := 'Good';
    WHEN 'okay' THEN mood_name := 'Okay';
    WHEN 'stressed' THEN mood_name := 'Stressed';
    WHEN 'overwhelmed' THEN mood_name := 'Overwhelmed';
    ELSE mood_name := NULL;
  END CASE;

  -- Get mood_id
  IF mood_name IS NOT NULL THEN
    SELECT id INTO mood_id FROM mood_definitions WHERE name = mood_name LIMIT 1;
  END IF;

  -- Build content from check-in fields
  entry_content := '';

  IF check_in_record.gratitude IS NOT NULL AND check_in_record.gratitude != '' THEN
    entry_content := entry_content || '## Gratitude' || E'\n' || check_in_record.gratitude || E'\n\n';
  END IF;

  IF check_in_record.wins IS NOT NULL AND check_in_record.wins != '' THEN
    entry_content := entry_content || '## Wins' || E'\n' || check_in_record.wins || E'\n\n';
  END IF;

  IF check_in_record.challenges IS NOT NULL AND check_in_record.challenges != '' THEN
    entry_content := entry_content || '## Challenges' || E'\n' || check_in_record.challenges || E'\n\n';
  END IF;

  -- Add energy level as metadata in content if present
  IF check_in_record.energy_level IS NOT NULL THEN
    entry_content := entry_content || '**Energy Level:** ' || check_in_record.energy_level || '/10' || E'\n';
  END IF;

  -- Add needs_support flag if true
  IF check_in_record.needs_support = true THEN
    entry_content := entry_content || E'\n' || '⚠️ *Flagged as needing support*';
  END IF;

  -- Default content if empty
  IF entry_content = '' THEN
    entry_content := 'Check-in: ' || COALESCE(check_in_record.mood, 'unspecified') || ' mood';
  END IF;

  -- Determine layer (founder:{user_id})
  layer_value := 'founder:' || check_in_record.user_id::text;

  -- Insert journal entry
  INSERT INTO journal_entries (
    owner_id,
    layer,
    title,
    content,
    entry_type,
    primary_mood_id,
    mood_intensity,
    valence,
    status,
    is_private,
    entry_date,
    created_at,
    legacy_check_in_id
  ) VALUES (
    check_in_record.user_id,
    layer_value,
    'Daily Check-in',
    entry_content,
    'mood_check',
    mood_id,
    CASE check_in_record.mood
      WHEN 'great' THEN 8
      WHEN 'good' THEN 6
      WHEN 'okay' THEN 5
      WHEN 'stressed' THEN 7
      WHEN 'overwhelmed' THEN 9
      ELSE 5
    END,
    CASE check_in_record.mood
      WHEN 'great' THEN 9
      WHEN 'good' THEN 7
      WHEN 'okay' THEN 5
      WHEN 'stressed' THEN 3
      WHEN 'overwhelmed' THEN 2
      ELSE 5
    END,
    'published',
    true,
    check_in_record.check_in_date::date,
    check_in_record.created_at,
    check_in_record.id
  ) RETURNING id INTO new_entry_id;

  -- Link mood to entry if we have one
  IF mood_id IS NOT NULL THEN
    INSERT INTO journal_entry_moods (entry_id, mood_id, intensity, is_primary)
    VALUES (new_entry_id, mood_id,
      CASE check_in_record.mood
        WHEN 'great' THEN 8
        WHEN 'good' THEN 6
        WHEN 'okay' THEN 5
        WHEN 'stressed' THEN 7
        WHEN 'overwhelmed' THEN 9
        ELSE 5
      END,
      true
    );
  END IF;

  RETURN new_entry_id;
END;
$$;

-- =============================================================================
-- STEP 4: Migrate all existing check-ins
-- =============================================================================
DO $$
DECLARE
  check_in_row founder_os.check_ins%ROWTYPE;
  migrated_count INTEGER := 0;
BEGIN
  -- Loop through all check-ins that haven't been migrated yet
  FOR check_in_row IN
    SELECT c.* FROM founder_os.check_ins c
    LEFT JOIN journal_entries j ON j.legacy_check_in_id = c.id
    WHERE j.id IS NULL
  LOOP
    PERFORM migrate_check_in_to_journal(check_in_row);
    migrated_count := migrated_count + 1;
  END LOOP;

  RAISE NOTICE 'Migrated % check-ins to journal_entries', migrated_count;
END;
$$;

-- =============================================================================
-- STEP 5: Add deprecation comment to check_ins table
-- =============================================================================
COMMENT ON TABLE founder_os.check_ins IS
  'DEPRECATED: Use journal_entries with entry_type=''mood_check'' instead.
   Existing data has been migrated. This table will be removed in a future release.';

-- =============================================================================
-- STEP 6: Create view for backwards compatibility
-- =============================================================================
CREATE OR REPLACE VIEW founder_os.check_ins_view AS
SELECT
  j.id,
  j.owner_id as user_id,
  j.created_at as check_in_date,
  CASE
    WHEN m.name = 'Great' THEN 'great'
    WHEN m.name = 'Good' THEN 'good'
    WHEN m.name = 'Okay' THEN 'okay'
    WHEN m.name = 'Stressed' THEN 'stressed'
    WHEN m.name = 'Overwhelmed' THEN 'overwhelmed'
    ELSE 'okay'
  END as mood,
  j.mood_intensity as energy_level,
  j.content as gratitude,  -- Simplified: full content
  NULL::text as challenges,
  NULL::text as wins,
  CASE WHEN j.content LIKE '%needing support%' THEN true ELSE false END as needs_support,
  j.created_at
FROM journal_entries j
LEFT JOIN mood_definitions m ON m.id = j.primary_mood_id
WHERE j.entry_type = 'mood_check';

COMMENT ON VIEW founder_os.check_ins_view IS
  'Backwards-compatible view of journal entries with entry_type=''mood_check''.
   For new code, use journal_entries directly.';

-- Grant access to the view
GRANT SELECT ON founder_os.check_ins_view TO service_role;
