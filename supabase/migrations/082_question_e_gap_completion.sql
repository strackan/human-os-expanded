-- Question E Gap Completion: E25-E28
-- Fills remaining gaps for Founder OS template coverage
-- Covers: humor/rapport, challenge reception, AI preferences

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, options, maps_to_output, priority)
VALUES
  -- E25: Social/Rapport
  ('E25', 'fos', 'identity', 'rapport', 'open',
   'What makes you want to hang out with someone socially vs just working with them? Any particular senses of humor or personality types work better than others?',
   'Maps social preferences, humor style, rapport markers',
   NULL, 'communication', 2),

  -- E26: Challenge & Disagreement
  ('E26', 'fos', 'identity', 'challenge', 'open',
   'How do you prefer to be disagreed with or challenged? When do you appreciate someone standing their ground vs it feeling confrontational?',
   'Maps correction reception, pushback tolerance, conflict style',
   NULL, 'conversation-protocols', 1),

  -- E27: Ideal AI (Open)
  ('E27', 'fos', 'identity', 'ai-preferences', 'open',
   'If you could build an ideal AI assistant - what would be the 3-4 most important considerations?',
   'Surfaces implicit preferences and frustrations through positive framing',
   NULL, 'conversation-protocols', 2),

  -- E28: AI Role Ranking
  ('E28', 'fos', 'identity', 'ai-preferences', 'choice',
   'Rank these AI assistant roles in order of most desirable to you:',
   'Quick signal on preferred interaction mode',
   '["Strategic Thought Partner", "Deferential Assistant", "Coach & Accountability Partner", "Friend & Confidante"]'::jsonb,
   'conversation-protocols', 1)

ON CONFLICT (slug) DO NOTHING;

-- Link to existing question set
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT
  qs.id,
  q.id,
  CASE q.slug
    WHEN 'E25' THEN 25
    WHEN 'E26' THEN 26
    WHEN 'E27' THEN 27
    WHEN 'E28' THEN 28
    ELSE 99
  END
FROM question_sets qs
CROSS JOIN questions q
WHERE qs.slug = 'fos-question-e'
  AND q.slug IN ('E25', 'E26', 'E27', 'E28')
  AND q.domain = 'fos'
ON CONFLICT (question_set_id, question_id) DO NOTHING;

-- Update question set description
UPDATE question_sets
SET description = 'Fills gaps between "writing as you" and "helping you" - enables effective founder support. 28 questions across decision-making, energy patterns, communication, crisis/recovery, work style, and interaction preferences.'
WHERE slug = 'fos-question-e';
