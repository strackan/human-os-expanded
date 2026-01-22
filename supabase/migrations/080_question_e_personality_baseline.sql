-- Question E: Personality Baseline
-- Fills gaps in founder-os documentation for effective support (not just content generation)
-- Source: GAP_ANALYSIS.md

-- ============================================================================
-- INSERT QUESTIONS
-- ============================================================================

-- Section 1: Decision-Making Under Stress (E1-E4)
INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, options, maps_to_output, priority)
VALUES
  ('E01', 'fos', 'identity', 'decision-making', 'open',
   'When you''re facing a big decision and feeling overwhelmed, what does that look like for you? What are the signs?',
   'Identifies stress response patterns and self-awareness indicators',
   NULL, 'cognitive-profile', 1),

  ('E02', 'fos', 'identity', 'decision-making', 'choice',
   'When you have too many options, what''s your default response?',
   'Identifies decision-making style under cognitive load',
   '["Narrow down and decide quickly", "Seek input from others", "Delay and hope it clarifies", "Something else"]'::jsonb,
   'cognitive-profile', 1),

  ('E03', 'fos', 'identity', 'decision-making', 'choice',
   'Do you prefer someone to:',
   'Identifies preferred support/autonomy balance',
   '["Present options and let you decide", "Make a recommendation and let you override", "Just make the call unless it''s high-stakes"]'::jsonb,
   'conversation-protocols', 1),

  ('E04', 'fos', 'identity', 'decision-making', 'open',
   'What kinds of decisions drain you the most? What kinds energize you?',
   'Maps energy patterns to decision types for support optimization',
   NULL, 'cognitive-profile', 1),

-- Section 2: Energy & Cognitive Patterns (E5-E10)
  ('E05', 'fos', 'identity', 'energy-cognitive', 'open',
   'When are you at your best? Time of day, conditions, context?',
   'Maps optimal performance conditions',
   NULL, 'current-state', 1),

  ('E06', 'fos', 'identity', 'energy-cognitive', 'open',
   'What drains you faster than people might expect?',
   'Identifies hidden energy drains for proactive support',
   NULL, 'cognitive-profile', 1),

  ('E07', 'fos', 'identity', 'energy-cognitive', 'open',
   'How do you know when you''re avoiding something? What does that look like?',
   'Identifies avoidance patterns for gentle intervention',
   NULL, 'cognitive-profile', 2),

  ('E08', 'fos', 'identity', 'energy-cognitive', 'open',
   'What does your "overwhelm spiral" look like? How does it start, and how does it usually resolve?',
   'Maps crisis onset patterns for early detection',
   NULL, 'crisis-protocols', 1),

  ('E09', 'fos', 'identity', 'energy-cognitive', 'open',
   'Do you have any neurodivergent patterns (ADHD, etc.) that affect how you work? Or patterns you''ve noticed even without a label?',
   'Captures cognitive profile for appropriate support strategies',
   NULL, 'cognitive-profile', 2),

  ('E10', 'fos', 'identity', 'energy-cognitive', 'open',
   'What kind of structure helps you? What kind of structure feels constraining?',
   'Calibrates support style - structure vs flexibility',
   NULL, 'conversation-protocols', 1),

-- Section 3: Communication Preferences (E11-E14)
  ('E11', 'fos', 'identity', 'communication', 'choice',
   'When you''re working with someone, do you prefer:',
   'Identifies preferred interaction mode',
   '["Direct recommendations", "Facilitated thinking (questions to help you figure it out)", "Just execution with minimal check-ins"]'::jsonb,
   'conversation-protocols', 1),

  ('E12', 'fos', 'identity', 'communication', 'open',
   'What kind of input feels helpful vs. annoying?',
   'Calibrates input style and red flags',
   NULL, 'communication', 1),

  ('E13', 'fos', 'identity', 'communication', 'open',
   'How should someone push back on you if they think you''re wrong?',
   'Identifies override signals and challenge tolerance',
   NULL, 'communication', 1),

  ('E14', 'fos', 'identity', 'communication', 'open',
   'When you''re not feeling great (tired, pain day, stressed), how should that change how people interact with you?',
   'Defines low-energy mode adaptations',
   NULL, 'conversation-protocols', 1),

-- Section 4: Crisis & Recovery (E15-E19)
  ('E15', 'fos', 'identity', 'crisis-recovery', 'open',
   'What does "stuck" look like for you? How do you know when you''re there?',
   'Identifies crisis indicators for detection',
   NULL, 'crisis-protocols', 1),

  ('E16', 'fos', 'identity', 'crisis-recovery', 'open',
   'What helps you get unstuck? What''s worked in the past?',
   'Documents effective recovery patterns',
   NULL, 'crisis-protocols', 1),

  ('E17', 'fos', 'identity', 'crisis-recovery', 'open',
   'What makes things worse when you''re struggling? What should people NOT do?',
   'Documents anti-patterns to avoid during crisis',
   NULL, 'crisis-protocols', 1),

  ('E18', 'fos', 'identity', 'crisis-recovery', 'open',
   'How does chronic pain affect your availability and focus? Is there a pattern?',
   'Maps health impact on availability',
   NULL, 'current-state', 2),

  ('E19', 'fos', 'identity', 'crisis-recovery', 'choice',
   'When you''re in crisis mode, do you want:',
   'Identifies crisis support preference',
   '["Space to figure it out", "Someone to help carry the load", "Distraction and normality"]'::jsonb,
   'crisis-protocols', 1),

-- Section 5: Work Style & Support (E20-E24)
  ('E20', 'fos', 'identity', 'work-style', 'open',
   'How do you like to be helped? What does good support look like?',
   'Defines ideal support model',
   NULL, 'conversation-protocols', 1),

  ('E21', 'fos', 'identity', 'work-style', 'open',
   'How should priorities be presented to you? (List, single focus, deadlines, etc.)',
   'Calibrates priority presentation format',
   NULL, 'conversation-protocols', 1),

  ('E22', 'fos', 'identity', 'work-style', 'open',
   'What''s your relationship with time? Are deadlines helpful pressure or unhelpful stress?',
   'Maps time/deadline relationship',
   NULL, 'cognitive-profile', 1),

  ('E23', 'fos', 'identity', 'work-style', 'open',
   'What does "done enough" look like for you? Or do you struggle with that?',
   'Identifies completion patterns and perfectionism tendencies',
   NULL, 'cognitive-profile', 2),

  ('E24', 'fos', 'identity', 'work-style', 'open',
   'Is there anything else about how you work that would be helpful to know?',
   'Catch-all for uncategorized insights',
   NULL, 'cognitive-profile', 3)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- UPDATE EXISTING QUESTION SET (created in 077_seed_questions.sql)
-- ============================================================================

-- Update the description to be more specific
UPDATE question_sets
SET description = 'Fills gaps between "writing as you" and "helping you" - enables effective founder support. 24 questions across decision-making, energy patterns, communication, crisis/recovery, and work style.'
WHERE slug = 'fos-question-e';

-- ============================================================================
-- LINK QUESTIONS TO EXISTING SET
-- ============================================================================

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT
  qs.id,
  q.id,
  CASE q.slug
    WHEN 'E01' THEN 1
    WHEN 'E02' THEN 2
    WHEN 'E03' THEN 3
    WHEN 'E04' THEN 4
    WHEN 'E05' THEN 5
    WHEN 'E06' THEN 6
    WHEN 'E07' THEN 7
    WHEN 'E08' THEN 8
    WHEN 'E09' THEN 9
    WHEN 'E10' THEN 10
    WHEN 'E11' THEN 11
    WHEN 'E12' THEN 12
    WHEN 'E13' THEN 13
    WHEN 'E14' THEN 14
    WHEN 'E15' THEN 15
    WHEN 'E16' THEN 16
    WHEN 'E17' THEN 17
    WHEN 'E18' THEN 18
    WHEN 'E19' THEN 19
    WHEN 'E20' THEN 20
    WHEN 'E21' THEN 21
    WHEN 'E22' THEN 22
    WHEN 'E23' THEN 23
    WHEN 'E24' THEN 24
    ELSE 99
  END
FROM question_sets qs
CROSS JOIN questions q
WHERE qs.slug = 'fos-question-e'
  AND q.slug LIKE 'E%'
  AND q.domain = 'fos'
  AND q.category = 'identity'
ON CONFLICT (question_set_id, question_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE questions IS 'Normalized question repository - includes Question E personality baseline (E01-E24)';
