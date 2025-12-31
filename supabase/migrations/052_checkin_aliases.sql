-- 052_checkin_aliases.sql
-- Add check-in aliases for mood check / emotional check-in workflows

INSERT INTO human_os.aliases (pattern, description, layer, tools_required, actions, priority)
VALUES
  -- Check-in patterns (load mood_check mode for guided conversation)
  (
    'check in',
    'Start a mood check-in session with guided prompts',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "mood_check"}}]'::jsonb,
    75
  ),
  (
    'let''s check in',
    'Start a mood check-in session',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "mood_check"}}]'::jsonb,
    76
  ),
  (
    'can we check in',
    'Start a mood check-in session',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "mood_check"}}]'::jsonb,
    77
  ),
  (
    'mood check',
    'Start a mood check-in session',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "mood_check"}}]'::jsonb,
    78
  ),
  (
    'how are you feeling',
    'Prompt for a check-in (mirrors back to user)',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "mood_check"}}]'::jsonb,
    79
  ),

  -- Other journal mode shortcuts
  (
    'gratitude',
    'Start a gratitude journaling session',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "gratitude"}}]'::jsonb,
    82
  ),
  (
    'reflect',
    'Start a reflection journaling session',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "reflection"}}]'::jsonb,
    83
  ),
  (
    'daily review',
    'Start a daily review session',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "daily_review"}}]'::jsonb,
    84
  ),
  (
    'mindfulness',
    'Start a mindfulness journaling session',
    'public',
    ARRAY['load_journal_mode'],
    '[{"tool": "load_journal_mode", "params": {"mode": "mindfulness"}}]'::jsonb,
    85
  )

ON CONFLICT (pattern, layer) DO UPDATE SET
  description = EXCLUDED.description,
  tools_required = EXCLUDED.tools_required,
  actions = EXCLUDED.actions,
  priority = EXCLUDED.priority,
  updated_at = NOW();

-- Verify
DO $$
DECLARE
  checkin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO checkin_count
  FROM human_os.aliases
  WHERE pattern IN ('check in', 'let''s check in', 'can we check in', 'mood check');
  RAISE NOTICE 'Added % check-in aliases', checkin_count;
END $$;
