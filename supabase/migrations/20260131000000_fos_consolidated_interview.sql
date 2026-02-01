-- FOS Consolidated Interview Question Set
-- 12 deep questions across 3 sections for Founder OS onboarding
-- Replaces separate D&D assessment and work style assessment flows

-- ============================================================================
-- QUESTION SET
-- ============================================================================

INSERT INTO question_sets (slug, name, domain, target, description) VALUES
  ('fos-consolidated-interview', 'FOS Consolidated Interview', 'fos', 'onboarding',
   '12-question deep interview covering personal story, identity, and work/AI preferences. Consolidates D&D assessment and work style questions into single streamlined flow.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- QUESTIONS - Section 1: Your Story (4 questions)
-- ============================================================================

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, maps_to_output, weight, priority) VALUES
  ('fos-interview-a1-turning-point', 'fos', 'identity', 'story', 'open',
   'Describe a moment or experience that fundamentally changed who you are or how you see the world.',
   'Be specific about what happened and how it changed you. Reveals growth capacity, meaning-making, insight depth.',
   'profile', 3, 1),

  ('fos-interview-a2-happiest-memory', 'fos', 'identity', 'story', 'open',
   'Tell me about your single happiest memory.',
   'What made this moment so special? Reveals values (achievement vs connection vs freedom), emotional access.',
   'profile', 2, 1),

  ('fos-interview-a3-difficult-time', 'fos', 'identity', 'story', 'open',
   'Tell me about a difficult time in your life and how you got through it.',
   'What did you learn about yourself? Reveals resilience style, coping mechanisms, honesty about struggle.',
   'profile', 3, 1),

  ('fos-interview-a4-redemption', 'fos', 'identity', 'story', 'open',
   'Tell me about something bad that happened to you that ultimately led to something good.',
   'How did the transformation happen? Reveals optimism/pessimism lens, meaning-making, adaptability.',
   'profile', 2, 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- QUESTIONS - Section 2: Who You Are (3 questions)
-- ============================================================================

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, maps_to_output, weight, priority) VALUES
  ('fos-interview-b1-core-identity', 'fos', 'identity', 'self', 'open',
   'If you stripped away your job, relationships, and achievements - what would remain? What''s the core ''you''?',
   'What defines you beyond external factors? Reveals self-knowledge depth, what they hold onto.',
   'profile', 3, 1),

  ('fos-interview-b2-simple-thing', 'fos', 'identity', 'self', 'open',
   'What''s a simple thing that matters a lot to you?',
   'Why does this resonate so deeply? Reveals values through specifics, what they notice/cherish.',
   'profile', 2, 1),

  ('fos-interview-b3-relationship-need', 'fos', 'identity', 'connect', 'open',
   'What do you need from close relationships that you rarely ask for directly?',
   'What makes it hard to ask? Reveals attachment style, emotional honesty, vulnerability.',
   'profile', 3, 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- QUESTIONS - Section 3: Work & AI (5 questions)
-- ============================================================================

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, maps_to_output, weight, priority) VALUES
  ('fos-interview-c1-peak-performance', 'fos', 'founder', 'performance', 'open',
   'Tell me about when you''re at your best vs your worst. Time of day, environment, conditions - what helps and what hurts your performance?',
   'Be specific about the conditions that affect you. Reveals work patterns, self-awareness about energy/productivity.',
   'fingerprint', 3, 1),

  ('fos-interview-c2-struggle-recovery', 'fos', 'founder', 'support', 'open',
   'When things get hard, what actually helps you recover? What makes it worse? What kind of support do you want from those around you?',
   'Think about specific examples of helpful vs unhelpful support. Reveals coping mechanisms, support preferences, vulnerability.',
   'guardrails', 3, 1),

  ('fos-interview-c3-feedback-challenge', 'fos', 'founder', 'collaboration', 'open',
   'How do you prefer to receive feedback and to be challenged? When does pushback land well vs feel confrontational?',
   'Think about examples of feedback that worked well vs poorly. Reveals conflict style, receptivity to growth, communication preferences.',
   'guardrails', 2, 1),

  ('fos-interview-c4-social-rapport', 'fos', 'founder', 'collaboration', 'open',
   'What makes you want to hang out with someone socially vs just working with them? Any particular senses of humor or personality types work better than others?',
   'This helps calibrate tone and rapport. Reveals social compatibility, relationship building style.',
   'voice', 2, 1),

  ('fos-interview-c5-ideal-ai', 'fos', 'founder', 'ai-preferences', 'open',
   'If you could build an ideal AI assistant, what would be the 3-4 most important considerations? Is there anything else you''d like me to know?',
   'Think about what would make it actually useful vs annoying. Reveals self-awareness about needs, ability to articulate preferences.',
   'guardrails', 3, 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- QUESTION SET JUNCTION - Link questions to set with ordering
-- ============================================================================

-- Section 1: Your Story
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 1 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-a1-turning-point'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 2 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-a2-happiest-memory'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 3 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-a3-difficult-time'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 4 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-a4-redemption'
ON CONFLICT DO NOTHING;

-- Section 2: Who You Are
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 5 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-b1-core-identity'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 6 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-b2-simple-thing'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 7 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-b3-relationship-need'
ON CONFLICT DO NOTHING;

-- Section 3: Work & AI
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 8 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-c1-peak-performance'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 9 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-c2-struggle-recovery'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 10 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-c3-feedback-challenge'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 11 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-c4-social-rapport'
ON CONFLICT DO NOTHING;

INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, 12 FROM question_sets qs, questions q
WHERE qs.slug = 'fos-consolidated-interview' AND q.slug = 'fos-interview-c5-ideal-ai'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  question_count INT;
  set_count INT;
BEGIN
  SELECT COUNT(*) INTO question_count FROM questions WHERE slug LIKE 'fos-interview-%';
  SELECT COUNT(*) INTO set_count FROM question_set_questions qsq
    JOIN question_sets qs ON qsq.question_set_id = qs.id
    WHERE qs.slug = 'fos-consolidated-interview';

  RAISE NOTICE 'FOS Consolidated Interview: % questions created, % linked to set', question_count, set_count;
END $$;
