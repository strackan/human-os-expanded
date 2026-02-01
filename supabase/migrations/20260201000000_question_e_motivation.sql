-- Question E Motivation: E29-E31
-- Fills motivation gap in Founder-OS documentation
-- Source: Ten Commandments structure plan

-- ============================================================================
-- INSERT QUESTIONS
-- ============================================================================

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, options, maps_to_output, priority)
VALUES
  -- E29: Motivation & Meaning
  ('E29', 'fos', 'identity', 'motivation', 'open',
   'What motivates you to do your best work? What creates meaning for you?',
   'Identifies intrinsic motivation patterns and meaning-making orientation',
   NULL, 'ENERGY_PATTERNS.md', 1),

  -- E30: Achievement Orientation
  ('E30', 'fos', 'identity', 'motivation', 'choice',
   'When do you feel most accomplished - finishing something, learning something, or helping someone?',
   'Identifies primary achievement driver (completion vs mastery vs contribution)',
   '["Finishing something (completion)", "Learning something new (mastery)", "Helping someone succeed (contribution)", "It depends on context"]'::jsonb,
   'WORK_STYLE.md', 1),

  -- E31: Quit Triggers
  ('E31', 'fos', 'identity', 'motivation', 'open',
   'What would make you quit something even if it was successful?',
   'Identifies values that override success metrics - critical for support calibration',
   NULL, 'SUPPORT_CALIBRATION.md', 1)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- LINK QUESTIONS TO EXISTING SET
-- ============================================================================

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT
  qs.id,
  q.id,
  CASE q.slug
    WHEN 'E29' THEN 29
    WHEN 'E30' THEN 30
    WHEN 'E31' THEN 31
    ELSE 99
  END
FROM question_sets qs
CROSS JOIN questions q
WHERE qs.slug = 'fos-question-e'
  AND q.slug IN ('E29', 'E30', 'E31')
  AND q.domain = 'fos'
ON CONFLICT (question_set_id, question_id) DO NOTHING;

-- ============================================================================
-- UPDATE QUESTION SET DESCRIPTION
-- ============================================================================

UPDATE question_sets
SET description = 'Fills gaps between "writing as you" and "helping you" - enables effective founder support. 31 questions across decision-making, energy patterns, communication, crisis/recovery, work style, interaction preferences, and motivation.'
WHERE slug = 'fos-question-e';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  question_count INT;
BEGIN
  SELECT COUNT(*) INTO question_count FROM questions WHERE slug IN ('E29', 'E30', 'E31');
  RAISE NOTICE 'Question E Motivation: % questions created', question_count;
END $$;
