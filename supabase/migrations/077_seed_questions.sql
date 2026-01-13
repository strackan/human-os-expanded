-- Seed Questions for Unified Question System
-- All questions across CORE, FOS, GH, and REN domains

-- ============================================================================
-- QUESTION SETS
-- ============================================================================

INSERT INTO question_sets (slug, name, domain, target, description) VALUES
  -- CORE
  ('core-story', 'CORE_STORY_Q', 'core', 'sculptor', 'Module A (McAdams) - Origin stories and pivotal moments'),
  ('core-self', 'CORE_SELF_Q', 'core', 'sculptor', 'Module B - Self understanding and identity'),
  ('core-connect', 'CORE_CONNECT_Q', 'core', 'sculptor', 'Module C - Connection and relationship patterns'),
  ('core-fingerprint', 'CORE_FINGERPRINT_Q', 'core', 'onboarding', 'D-Series dimensions (D01-D10) for work style fingerprint'),

  -- FOS
  ('fos-skeleton', 'FOS_SKELETON_Q', 'fos', 'sculptor', 'Module F - Founder skeleton/framework'),
  ('fos-sculptor', 'FOS_SCULPTOR_Q', 'fos', 'sculptor', 'Sculptor 15 core questions'),
  ('fos-crisis', 'FOS_CRISIS_Q', 'fos', 'sculptor', 'Crisis mode and overwhelm patterns'),
  ('fos-current', 'FOS_CURRENT_Q', 'fos', 'sculptor', 'Current state assessment'),
  ('fos-conditions', 'FOS_CONDITIONS_Q', 'fos', 'sculptor', 'Working conditions and neurodivergent patterns'),
  ('fos-question-e', 'FOS_QUESTION_E_Q', 'fos', 'thick-client', 'Scott GAP_ANALYSIS questions'),

  -- GH
  ('gh-cs-unified', 'GH_CS_UNIFIED_Q', 'gh', 'assessment', 'Unified CS skills assessment (deduplicated from v1+v2)'),
  ('gh-lightning', 'GH_LIGHTNING_Q', 'gh', 'assessment', 'Lightning round rapid-fire questions'),
  ('gh-absurdist', 'GH_ABSURDIST_Q', 'gh', 'assessment', 'Absurdist creative thinking questions'),

  -- REN
  ('ren-cs', 'REN_CS_Q', 'ren', 'onboarding', 'Module D - CS fundamentals'),
  ('ren-sales', 'REN_SALES_Q', 'ren', 'onboarding', 'Module E - Sales approach'),
  ('ren-gap', 'REN_GAP_Q', 'ren', 'thick-client', 'Work assessment gap analysis')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- CORE QUESTIONS - D-Series Fingerprint (D01-D10)
-- ============================================================================

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, options, maps_to_dimension, maps_to_output, weight, priority) VALUES
  -- D01-D07 (existing)
  ('d01-energy-source', 'core', 'fingerprint', 'd-series', 'binary',
   'When you need to recharge after a hard day, do you seek out people or seek solitude?',
   'Measures energy source preference',
   '["Solo", "People"]'::jsonb, 'D01', 'fingerprint', 2, 1),

  ('d02-time-orientation', 'core', 'fingerprint', 'd-series', 'binary',
   'Do you prefer to plan your week in advance or let things flow based on energy and opportunity?',
   'Measures time management style',
   '["Vibes", "Calendar"]'::jsonb, 'D02', 'fingerprint', 2, 1),

  ('d03-processing-style', 'core', 'fingerprint', 'd-series', 'binary',
   'When someone asks you to explain something, do you give them the bullet points or tell them the story?',
   'Measures communication preference',
   '["Bullets", "Story"]'::jsonb, 'D03', 'fingerprint', 2, 1),

  ('d04-response-pattern', 'core', 'fingerprint', 'd-series', 'binary',
   'When a friend comes to you with a problem, is your first instinct to help fix it or to help them feel heard?',
   'Measures emotional response pattern',
   '["Fix", "Feel"]'::jsonb, 'D04', 'fingerprint', 2, 1),

  ('d05-collaboration', 'core', 'fingerprint', 'd-series', 'binary',
   'In a group project, do you naturally take the lead or prefer to support someone else''s vision?',
   'Measures collaboration style',
   '["Driver", "Copilot"]'::jsonb, 'D05', 'fingerprint', 2, 1),

  ('d06-risk-posture', 'core', 'fingerprint', 'd-series', 'binary',
   'When facing a big decision with incomplete information, do you move fast or move careful?',
   'Measures risk tolerance',
   '["Move fast", "Move careful"]'::jsonb, 'D06', 'fingerprint', 2, 1),

  ('d07-leadership-filter', 'core', 'fingerprint', 'd-series', 'binary',
   'As a leader, do you share everything with your team or filter information to protect focus?',
   'Measures leadership communication style',
   '["Transparent", "Filter"]'::jsonb, 'D07', 'fingerprint', 2, 1),

  -- D08-D10 (new)
  ('d08-pushback-style', 'core', 'fingerprint', 'd-series', 'binary',
   'When you disagree with someone''s approach, do you say it directly or guide them to see it themselves?',
   'Measures conflict/feedback delivery style',
   '["Diplomatic", "Direct"]'::jsonb, 'D08', 'fingerprint', 2, 1),

  ('d09-feedback-timing', 'core', 'fingerprint', 'd-series', 'binary',
   'When you have feedback for someone, do you batch it for the right moment or share it immediately?',
   'Measures feedback timing preference',
   '["Batched", "Immediate"]'::jsonb, 'D09', 'fingerprint', 2, 1),

  ('d10-completion', 'core', 'fingerprint', 'd-series', 'binary',
   'When shipping work, do you polish until it''s perfect or ship at 80% and iterate?',
   'Measures perfectionism vs shipping mentality',
   '["Perfect", "Ship"]'::jsonb, 'D10', 'fingerprint', 2, 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- CORE QUESTIONS - Story, Self, Connect
-- ============================================================================

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, maps_to_output, weight, priority) VALUES
  -- Story (McAdams)
  ('core-story-1', 'core', 'identity', 'story', 'open',
   'What''s a story from your past that shaped who you are today?',
   'Origin story - key formative experience', 'stories', 2, 1),

  ('core-story-2', 'core', 'identity', 'story', 'open',
   'Tell me about a turning point in your life - a moment when things changed direction.',
   'Pivotal moment identification', 'stories', 2, 1),

  ('core-story-3', 'core', 'identity', 'story', 'open',
   'What''s a challenge you overcame that you''re proud of?',
   'Resilience and growth narrative', 'stories', 2, 1),

  ('core-story-4', 'core', 'identity', 'story', 'open',
   'What''s a failure that taught you something important?',
   'Learning from adversity', 'stories', 2, 1),

  -- Self
  ('core-self-1', 'core', 'identity', 'self', 'open',
   'What are you really good at that most people don''t know about?',
   'Hidden strengths and capabilities', 'voice', 2, 1),

  ('core-self-2', 'core', 'identity', 'self', 'open',
   'What do you believe about work that not everyone agrees with?',
   'Core beliefs and values', 'guardrails', 2, 1),

  ('core-self-3', 'core', 'identity', 'self', 'open',
   'When are you at your best? Describe the conditions.',
   'Optimal performance conditions', 'fingerprint', 2, 1),

  -- Connect
  ('core-connect-1', 'core', 'identity', 'connect', 'open',
   'What kind of people do you work best with?',
   'Collaboration preferences', 'fingerprint', 2, 2),

  ('core-connect-2', 'core', 'identity', 'connect', 'open',
   'What makes a conversation feel energizing vs draining to you?',
   'Communication preferences', 'fingerprint', 2, 2),

  ('core-connect-3', 'core', 'identity', 'connect', 'open',
   'How do you prefer to receive feedback? What works, what doesn''t?',
   'Feedback reception style', 'guardrails', 2, 2)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- FOS QUESTIONS - Crisis, Current, Conditions
-- ============================================================================

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, maps_to_output, weight, priority) VALUES
  -- Crisis
  ('fos-crisis-1', 'fos', 'founder', 'crisis', 'open',
   'When you''re facing a big decision and feeling overwhelmed, what does that look like? What are the signs?',
   'Overwhelm identification patterns', 'guardrails', 3, 1),

  ('fos-crisis-2', 'fos', 'founder', 'crisis', 'open',
   'What does "stuck" look like for you? How do you know when you''re there?',
   'Stuck state recognition', 'guardrails', 3, 1),

  ('fos-crisis-3', 'fos', 'founder', 'crisis', 'open',
   'When you''re stuck, what actually helps you get unstuck?',
   'Recovery strategies', 'guardrails', 3, 1),

  ('fos-crisis-4', 'fos', 'founder', 'crisis', 'open',
   'What makes overwhelm worse? What should people avoid doing when you''re in that state?',
   'Anti-patterns during crisis', 'guardrails', 3, 1),

  ('fos-crisis-5', 'fos', 'founder', 'crisis', 'open',
   'Who do you reach out to when things get hard? What kind of support do you actually want?',
   'Support network and needs', 'guardrails', 2, 1),

  -- Current
  ('fos-current-1', 'fos', 'founder', 'current', 'open',
   'What''s currently on fire? What''s taking most of your energy right now?',
   'Current priorities and challenges', 'context', 2, 1),

  ('fos-current-2', 'fos', 'founder', 'current', 'open',
   'Where''s your energy level right now - high, medium, low?',
   'Current energy state', 'context', 2, 1),

  ('fos-current-3', 'fos', 'founder', 'current', 'open',
   'What''s working well right now? What are you proud of?',
   'Current wins and momentum', 'context', 2, 1),

  ('fos-current-4', 'fos', 'founder', 'current', 'open',
   'What bandwidth do you have for new things? Be honest.',
   'Available capacity assessment', 'context', 2, 1),

  -- Conditions
  ('fos-cond-1', 'fos', 'founder', 'conditions', 'open',
   'Do you have any neurodivergent patterns (ADHD, autism, etc.) that affect how you work?',
   'Neurodivergent work patterns', 'fingerprint', 3, 2),

  ('fos-cond-2', 'fos', 'founder', 'conditions', 'open',
   'Are there health conditions or physical factors that impact your energy or availability?',
   'Physical considerations', 'fingerprint', 3, 2),

  ('fos-cond-3', 'fos', 'founder', 'conditions', 'open',
   'What time of day are you at your best? When are you worst?',
   'Circadian patterns', 'fingerprint', 2, 1),

  ('fos-cond-4', 'fos', 'founder', 'conditions', 'open',
   'What does context-switching cost you? How long to get back into flow?',
   'Context-switching impact', 'fingerprint', 2, 1),

  ('fos-cond-5', 'fos', 'founder', 'conditions', 'open',
   'What environmental factors help or hurt your focus? (noise, people, etc.)',
   'Environmental preferences', 'fingerprint', 2, 2)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- GH QUESTIONS - CS Unified (48 questions, deduplicated from v1+v2)
-- ============================================================================

-- From v2 (core-questions.json) - keeping these as primary
INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, maps_to_output, weight, priority) VALUES
  -- Personality Warmup (v2)
  ('gh-cs-pers-0', 'gh', 'cs-skills', 'personality', 'open',
   'Hey! Tell us a bit about yourself - who you are, what you''re working on, and anything else you''d like us to know.',
   'Look for: authenticity, warmth, communication style, what they choose to highlight',
   'profile', 1, 1),

  ('gh-cs-pers-1', 'gh', 'cs-skills', 'personality', 'open',
   'When you''re under significant stress at work, what does your behavior look like? Be honest - we all have patterns.',
   'Look for: genuine self-awareness, specific behavioral patterns, evidence of growth. Maps to Enneagram stress patterns.',
   'profile', 2, 1),

  ('gh-cs-pers-2', 'gh', 'cs-skills', 'personality', 'open',
   'What kind of humor do you enjoy most? Describe how you like to spend time with friends - what makes for a great hangout?',
   'Look for: specificity, authenticity, social preferences, warmth',
   'profile', 1, 2),

  ('gh-cs-pers-3', 'gh', 'cs-skills', 'personality', 'open',
   'What''s a belief you held strongly 5 years ago that you''ve since changed your mind about? What changed it?',
   'Look for: intellectual humility, specific example, clear reasoning',
   'profile', 2, 1),

  -- Strategic Accounts (v2)
  ('gh-cs-strat-1', 'gh', 'cs-skills', 'strategic', 'open',
   'Your executive sponsor just resigned with no notice. Walk me through exactly what you do in the first 72 hours.',
   'Look for: immediate outreach, research on successor, internal escalation, risk assessment, multi-threading awareness',
   'profile', 3, 1),

  ('gh-cs-strat-2', 'gh', 'cs-skills', 'strategic', 'open',
   'You have 50 accounts. You can only give white-glove attention to 10. What''s your framework for deciding which 10?',
   'Look for: multi-factor framework (ARR, expansion potential, risk, strategic value, logo value)',
   'profile', 3, 1),

  ('gh-cs-strat-3', 'gh', 'cs-skills', 'strategic', 'open',
   'Your customer''s IT team wants one thing, their business team wants another, and they''re both your stakeholders. The requests are mutually exclusive. How do you navigate this?',
   'Look for: stakeholder mapping, understanding underlying needs, facilitation skills, escalation path awareness',
   'profile', 3, 1),

  ('gh-cs-strat-4', 'gh', 'cs-skills', 'strategic', 'open',
   'Describe a QBR you ran that actually changed the trajectory of an account. What made it different from a checkbox QBR?',
   'Look for: specific outcomes, executive engagement, data-driven insights, strategic recommendations',
   'profile', 3, 1),

  -- Churn & Retention (v2)
  ('gh-cs-churn-1', 'gh', 'cs-skills', 'retention', 'open',
   'Tell me about a customer you lost that you initially classified as "unavoidable churn" - acquisition, went out of business, etc. Looking back now, what would you do differently?',
   'Key insight: unavoidable churn mindset is toxic. Look for: root cause analysis, earlier intervention opportunities',
   'profile', 3, 1),

  ('gh-cs-churn-2', 'gh', 'cs-skills', 'retention', 'open',
   'You need to communicate a 15% price increase to a strategic account that''s already frustrated with your product. Walk me through your approach.',
   'Look for: direct language, value-first framing, acknowledgment of frustration, creative options',
   'profile', 3, 1),

  ('gh-cs-churn-3', 'gh', 'cs-skills', 'retention', 'open',
   'A customer is churning and there''s genuinely nothing you can do to save them - the decision is made. How do you handle the offboarding? What do you try to accomplish?',
   'Look for: graceful exit, learning extraction, door-left-open mentality, reference/referral ask',
   'profile', 2, 1),

  -- Expansion & Growth (v2)
  ('gh-cs-exp-1', 'gh', 'cs-skills', 'expansion', 'open',
   'Describe 3 implicit signals that a customer is ready for expansion - signals they wouldn''t directly tell you.',
   'Look for: usage patterns, org changes, questions about features outside current scope',
   'profile', 3, 1),

  ('gh-cs-exp-2', 'gh', 'cs-skills', 'expansion', 'open',
   'What''s the difference between a CSM who "supports" expansion and one who "drives" it? Which are you, and why?',
   'Look for: understanding of spectrum, honest self-assessment, specific examples',
   'profile', 2, 1),

  ('gh-cs-exp-3', 'gh', 'cs-skills', 'expansion', 'open',
   'You''ve identified a significant expansion opportunity but your sales counterpart isn''t prioritizing it. How do you handle this?',
   'Look for: collaboration skills, data-driven persuasion, escalation judgment',
   'profile', 2, 1),

  -- Onboarding & TTV (v2)
  ('gh-cs-onb-1', 'gh', 'cs-skills', 'onboarding', 'open',
   'You''re designing onboarding for a new enterprise customer segment you''ve never served before. How do you identify their "aha moment" and what''s your approach to setting a time-to-value target?',
   'Look for: customer research methodology, segment-specific thinking, measurable TTV targets',
   'profile', 2, 1),

  ('gh-cs-onb-2', 'gh', 'cs-skills', 'onboarding', 'open',
   'An enterprise customer''s onboarding is stalling because their internal champion doesn''t have bandwidth to drive adoption. What do you do?',
   'Look for: finding alternative champions, escalation to exec sponsor, reducing champion burden',
   'profile', 2, 1),

  -- Internal Influence (v2)
  ('gh-cs-int-1', 'gh', 'cs-skills', 'influence', 'open',
   'Give me an example where you successfully got a product feature prioritized. What data did you bring? What approaches didn''t work before that?',
   'Look for: data-driven approach, understanding of product priorities, persistence with iteration',
   'profile', 2, 1),

  ('gh-cs-int-2', 'gh', 'cs-skills', 'influence', 'open',
   'A customer escalates an issue that''s actually caused by a limitation in your product that won''t be fixed soon. How do you handle both the customer and internal stakeholders?',
   'Look for: transparent communication, workaround creativity, internal escalation without blame',
   'profile', 2, 1),

  -- AI & Systems (v2)
  ('gh-cs-ai-0', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'How does the Internet work?',
   'Look for: clarity of explanation, appropriate depth, ability to simplify complex concepts',
   'profile', 2, 1),

  ('gh-cs-ai-1', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'How are you currently using AI tools in your CS work? Give me 2-3 specific examples with the actual prompts or workflows you use.',
   'Look for: specific, practical applications; prompt sophistication; workflow integration',
   'profile', 3, 1),

  ('gh-cs-ai-2', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'Scenario: You need to analyze 50 customer support tickets to identify common themes and prioritize which issues to address first. Write the EXACT prompt you would give to an AI tool.',
   'Look for: clear instructions, structured output request, categorization framework, priority criteria',
   'profile', 3, 1),

  ('gh-cs-ai-3', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'Scenario: You''re designing a customer health scoring algorithm. You have: product usage, support tickets, NPS score, contract value, days since last engagement, and exec sponsor engagement. Write the EXACT prompt to help design this scoring system.',
   'Look for: understanding of weighted factors, awareness of edge cases, request for reasoning',
   'profile', 3, 1),

  ('gh-cs-ai-4', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'When should you NOT use AI? Give me 3 specific CS scenarios where AI would be the wrong choice.',
   'Look for: emotional conversations, legal/compliance sensitivity, creative strategy, relationship moments',
   'profile', 2, 1),

  -- Self-Awareness Closing (v2)
  ('gh-cs-self-1', 'gh', 'cs-skills', 'self-awareness', 'open',
   'What''s the biggest gap in your CS skillset right now? What are you doing about it?',
   'Look for: genuine self-awareness, specific gap identification, concrete improvement plan',
   'profile', 2, 1),

  ('gh-cs-self-2', 'gh', 'cs-skills', 'self-awareness', 'open',
   'Describe a time you received feedback that was hard to hear. How did you respond in the moment vs. after you had time to process?',
   'Look for: honest initial reaction, processing journey, behavioral change. Maps to Enneagram patterns.',
   'profile', 2, 1),

  ('gh-cs-self-3', 'gh', 'cs-skills', 'self-awareness', 'open',
   'What energizes you at work? What drains you? Be specific.',
   'Look for: specific examples, self-knowledge, honesty about limitations',
   'profile', 2, 1),

  -- From v1 (questions.json) - non-duplicates only
  ('gh-cs-bg-1', 'gh', 'cs-skills', 'background', 'open',
   'Tell me about your current role. What does a typical day look like for you?',
   'Work history and daily rhythm', 'profile', 1, 1),

  ('gh-cs-bg-2', 'gh', 'cs-skills', 'background', 'open',
   'What drew you to Customer Success as a career? What keeps you in it?',
   'Motivation and passion for CS', 'profile', 2, 1),

  ('gh-cs-bg-3', 'gh', 'cs-skills', 'background', 'open',
   'Walk me through a customer success story you''re particularly proud of. What made it successful?',
   'Work history and EQ demonstration', 'profile', 2, 1),

  ('gh-cs-eq-1', 'gh', 'cs-skills', 'eq', 'open',
   'Describe a time when you had to deliver bad news to a customer (e.g., product limitation, delayed feature, price increase). How did you approach it?',
   'EQ and empathy in difficult situations', 'profile', 2, 1),

  ('gh-cs-eq-2', 'gh', 'cs-skills', 'eq', 'open',
   'Tell me about a customer who was frustrated or angry. What was happening beneath the surface? How did you address their underlying concern?',
   'Empathy and self-awareness', 'profile', 2, 1),

  ('gh-cs-eq-4', 'gh', 'cs-skills', 'eq', 'open',
   'On a scale of 1-10, how well do you typically understand what a customer is really asking for (vs. what they say they want)? Give an example.',
   'Empathy and EQ self-assessment', 'profile', 2, 1),

  ('gh-cs-tech-1', 'gh', 'cs-skills', 'technical', 'open',
   'What technical tools or systems do you use daily in your CS work? Which one has had the biggest impact on your effectiveness?',
   'Technical tool proficiency', 'profile', 1, 1),

  ('gh-cs-tech-2', 'gh', 'cs-skills', 'technical', 'open',
   'A customer reports a bug that you''ve never seen before. Walk me through your troubleshooting process step-by-step.',
   'Technical problem-solving process', 'profile', 2, 1),

  ('gh-cs-tech-4', 'gh', 'cs-skills', 'technical', 'open',
   'If you could build or improve one tool/system to make CS work more effective, what would it be and why?',
   'Technical vision and IQ', 'profile', 2, 2),

  ('gh-cs-ai-vocab-1', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'In your own words, what''s the difference between a "prompt" and a "system message" when working with AI tools like ChatGPT or Claude?',
   'AI vocabulary and understanding', 'profile', 2, 1),

  ('gh-cs-ai-vocab-2', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'You hear someone say "I got hallucinations from ChatGPT." What does that mean? Have you experienced this? How did you handle it?',
   'AI limitations awareness', 'profile', 2, 1),

  ('gh-cs-ai-vocab-3', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'What''s the difference between GPT-4, Claude, and Gemini? When would you choose one over another?',
   'AI model differentiation', 'profile', 2, 2),

  ('gh-cs-ai-prompt-1', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'Scenario: You need to draft a renewal email to a customer whose contract expires in 30 days. The customer is an IT Director at a 500-person company, they''ve been using your product for 2 years with 80% adoption, but they haven''t responded to your last 2 emails. Write the EXACT prompt you would give to an AI tool.',
   'Practical prompt engineering for renewal', 'profile', 3, 1),

  ('gh-cs-ai-prompt-2', 'gh', 'cs-skills', 'ai-readiness', 'open',
   'Scenario: A customer asks: "Can your product integrate with our CRM?" You don''t know the answer. Write the EXACT prompt you would give to an AI tool to help craft a good response.',
   'Practical prompt engineering for research', 'profile', 2, 1),

  ('gh-cs-strat-v1-1', 'gh', 'cs-skills', 'strategic', 'open',
   'How do you determine which customers to prioritize when everyone seems urgent? What''s your framework?',
   'GTM and IQ in prioritization', 'profile', 2, 1),

  ('gh-cs-strat-v1-2', 'gh', 'cs-skills', 'strategic', 'open',
   'Tell me about a time you identified an expansion opportunity that wasn''t obvious. What signals did you notice?',
   'GTM and pattern recognition', 'profile', 2, 1),

  ('gh-cs-strat-v1-3', 'gh', 'cs-skills', 'strategic', 'open',
   'How do you measure your own success as a CS professional? What metrics matter most to you (beyond retention/NRR)?',
   'Self-awareness and GTM metrics', 'profile', 2, 1),

  ('gh-cs-strat-v1-4', 'gh', 'cs-skills', 'strategic', 'open',
   'If you were advising a startup on building their CS function from scratch, what''s the first thing you''d tell them to get right?',
   'Strategic thinking and IQ', 'profile', 2, 2),

  ('gh-cs-comm-1', 'gh', 'cs-skills', 'communication', 'open',
   'Describe your communication style. How do you adapt when talking to a technical buyer vs. an executive?',
   'Personality and EQ in communication', 'profile', 2, 1),

  ('gh-cs-comm-2', 'gh', 'cs-skills', 'communication', 'open',
   'What kind of work environment brings out your best? (Team structure, culture, pace, etc.)',
   'Culture fit and self-awareness', 'profile', 2, 1),

  ('gh-cs-comm-3', 'gh', 'cs-skills', 'communication', 'open',
   'Tell me about a time you disagreed with a teammate or leader. How did you handle it?',
   'EQ and personality in conflict', 'profile', 2, 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- GH QUESTIONS - Absurdist (15 questions)
-- ============================================================================

INSERT INTO questions (slug, domain, category, subcategory, question_type, text, description, maps_to_output, weight, priority) VALUES
  ('gh-abs-1', 'gh', 'absurdist', 'creative', 'open',
   'You''ve been appointed Supreme Commander of the Vegetable Forces in the Great Produce War against the tyrannical Fruit Empire. The fruits have air superiority and superior numbers, but vegetables have the element of surprise. What''s your strategy, and which vegetables get which roles?',
   'Look for: creative problem-solving, tactical thinking with absurd constraints, humor, internal logic',
   'profile', 1, 3),

  ('gh-abs-2', 'gh', 'absurdist', 'systems', 'open',
   'You wake up tomorrow and discover that semicolons have been removed from all programming languages -- retroactively from all code ever written. Society is collapsing. You find the developer''s manifesto explaining their failed ambition. What was their grand vision? What''s your one-week plan to save civilization?',
   'Look for: systems thinking, empathy for failed vision, practical crisis management, dark humor',
   'profile', 1, 3),

  ('gh-abs-3', 'gh', 'absurdist', 'social', 'open',
   'You have a date coming over tonight. You can either cook them dinner OR order out and pretend you made it. What''s your full strategy to ensure the evening is a success? Walk me through your decision-making.',
   'Look for: honest self-assessment, strategic thinking, awareness of trade-offs, values clarity',
   'profile', 1, 3),

  ('gh-abs-4', 'gh', 'absurdist', 'systems', 'open',
   'You''re in customer support hell: the same customer calls every day at 2:47 PM with the exact same problem. You''ve solved it 47 times. They never remember. You have ONE chance to break the cycle by doing something so memorable tomorrow''s call. What do you do?',
   'Look for: creative pattern-breaking, empathy mixed with frustration, memorable solutions',
   'profile', 1, 3),

  ('gh-abs-5', 'gh', 'absurdist', 'creative', 'open',
   'You''re abducted by aliens who have ONE question: "Explain why you people invented bread, then invented sliced bread, then acted like sliced bread was a major innovation." You have 60 seconds to explain human innovation. What do you say?',
   'Look for: concise communication, cultural self-awareness, humor about human absurdity',
   'profile', 1, 3),

  ('gh-abs-6', 'gh', 'absurdist', 'creative', 'open',
   'You''re planning the perfect crime, except it''s not a crime at all -- it''s something completely legal that you want to execute with heist movie precision. What''s the "heist," who''s on your crew, and what''s the twist that almost ruins everything?',
   'Look for: creative premise, team dynamics, narrative structure, enjoys the game',
   'profile', 1, 3),

  ('gh-abs-7', 'gh', 'absurdist', 'social', 'open',
   'You''ve been hired as a "Synergy Optimization Consultant" at a company that speaks entirely in corporate jargon. You realize this language is actually a code. What are they REALLY saying, and what conspiracy have you uncovered?',
   'Look for: pattern recognition, satire, creativity, office culture awareness',
   'profile', 1, 3),

  ('gh-abs-8', 'gh', 'absurdist', 'systems', 'open',
   'Your company accidentally launched a product that doesn''t exist yet. Marketing went live, customers are ordering, money is coming in. The CEO is unreachable for 10 days. You have 72 hours before first orders ship. What do you do?',
   'Look for: crisis thinking, ethical awareness, practical creativity, honesty about trade-offs',
   'profile', 1, 3),

  ('gh-abs-9', 'gh', 'absurdist', 'creative', 'open',
   'You''ve discovered a glitch: one meeting keeps recurring infinitely. The meeting is titled "Quick Sync" with no agenda, no attendees. Every time you attend, something weird happens in your day. What''s causing these meetings, and do you keep attending or break the loop?',
   'Look for: creative storytelling, embraces the weird, pattern thinking, humor',
   'profile', 1, 3),

  ('gh-abs-10', 'gh', 'absurdist', 'creative', 'open',
   'You''re at a startup that''s failed. You have one shot to pitch a pivot that''s so weird but so perfectly aligned with the team''s accidental expertise. Describe: the original failed product, the accidental expertise, and the perfect weird pivot.',
   'Look for: pattern recognition, startup culture awareness, creative pivots',
   'profile', 1, 3),

  ('gh-abs-11', 'gh', 'absurdist', 'systems', 'open',
   'In 2047, historians trace the prevention of global catastrophe to a single email you sent in 2025. The email was 3 sentences long and seemed innocuous. What was the catastrophe, what did your email say, and what was the chain of events?',
   'Look for: systems thinking, butterfly effect understanding, creative storytelling, humility',
   'profile', 1, 3),

  ('gh-abs-12', 'gh', 'absurdist', 'creative', 'open',
   'You''ve been hired as curator of the Museum of Cancelled Projects. Your first exhibition: "Products That Were Definitely Going to Change the World (But Didn''t)." Pick 3 exhibits and write their museum placard text. At least one from your own experience.',
   'Look for: humor about failure, learning from mistakes, storytelling, self-awareness',
   'profile', 1, 3),

  ('gh-abs-13', 'gh', 'absurdist', 'social', 'open',
   'You''re interviewing for a job, but halfway through you realize the interviewer is describing a nightmare scenario. The twist: they''re testing whether you''ll call it out. How do you respond while staying professional and funny?',
   'Look for: social awareness, confidence, humor under pressure, directness',
   'profile', 1, 3),

  ('gh-abs-14', 'gh', 'absurdist', 'creative', 'open',
   'You''ve confirmed no one reads your documentation. You''ve been hiding easter eggs for 6 months. Nothing. What''s your final, most outrageous easter egg that will FORCE someone to acknowledge they found it? What''s your endgame?',
   'Look for: creative mischief, understands documentation pain, humor, knows when to stop',
   'profile', 1, 3),

  ('gh-abs-15', 'gh', 'absurdist', 'creative', 'open',
   'One day, all your app notifications start collaborating. They form a coalition (your food delivery app becomes president) and present you with demands. What are their 3 demands, how do you negotiate, and which app betrays the coalition first?',
   'Look for: understands notification fatigue, creative personification, humor, satire',
   'profile', 1, 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- QUESTION SET JUNCTION ENTRIES
-- ============================================================================

-- Core Fingerprint
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id,
  CASE q.slug
    WHEN 'd01-energy-source' THEN 1
    WHEN 'd02-time-orientation' THEN 2
    WHEN 'd03-processing-style' THEN 3
    WHEN 'd04-response-pattern' THEN 4
    WHEN 'd05-collaboration' THEN 5
    WHEN 'd06-risk-posture' THEN 6
    WHEN 'd07-leadership-filter' THEN 7
    WHEN 'd08-pushback-style' THEN 8
    WHEN 'd09-feedback-timing' THEN 9
    WHEN 'd10-completion' THEN 10
  END
FROM question_sets qs, questions q
WHERE qs.slug = 'core-fingerprint' AND q.slug LIKE 'd%-%'
ON CONFLICT DO NOTHING;

-- Core Story
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id,
  CASE q.slug
    WHEN 'core-story-1' THEN 1
    WHEN 'core-story-2' THEN 2
    WHEN 'core-story-3' THEN 3
    WHEN 'core-story-4' THEN 4
  END
FROM question_sets qs, questions q
WHERE qs.slug = 'core-story' AND q.slug LIKE 'core-story-%'
ON CONFLICT DO NOTHING;

-- Core Self
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id,
  CASE q.slug
    WHEN 'core-self-1' THEN 1
    WHEN 'core-self-2' THEN 2
    WHEN 'core-self-3' THEN 3
  END
FROM question_sets qs, questions q
WHERE qs.slug = 'core-self' AND q.slug LIKE 'core-self-%'
ON CONFLICT DO NOTHING;

-- Core Connect
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id,
  CASE q.slug
    WHEN 'core-connect-1' THEN 1
    WHEN 'core-connect-2' THEN 2
    WHEN 'core-connect-3' THEN 3
  END
FROM question_sets qs, questions q
WHERE qs.slug = 'core-connect' AND q.slug LIKE 'core-connect-%'
ON CONFLICT DO NOTHING;

-- FOS Crisis
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id,
  CASE q.slug
    WHEN 'fos-crisis-1' THEN 1
    WHEN 'fos-crisis-2' THEN 2
    WHEN 'fos-crisis-3' THEN 3
    WHEN 'fos-crisis-4' THEN 4
    WHEN 'fos-crisis-5' THEN 5
  END
FROM question_sets qs, questions q
WHERE qs.slug = 'fos-crisis' AND q.slug LIKE 'fos-crisis-%'
ON CONFLICT DO NOTHING;

-- FOS Current
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id,
  CASE q.slug
    WHEN 'fos-current-1' THEN 1
    WHEN 'fos-current-2' THEN 2
    WHEN 'fos-current-3' THEN 3
    WHEN 'fos-current-4' THEN 4
  END
FROM question_sets qs, questions q
WHERE qs.slug = 'fos-current' AND q.slug LIKE 'fos-current-%'
ON CONFLICT DO NOTHING;

-- FOS Conditions
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id,
  CASE q.slug
    WHEN 'fos-cond-1' THEN 1
    WHEN 'fos-cond-2' THEN 2
    WHEN 'fos-cond-3' THEN 3
    WHEN 'fos-cond-4' THEN 4
    WHEN 'fos-cond-5' THEN 5
  END
FROM question_sets qs, questions q
WHERE qs.slug = 'fos-conditions' AND q.slug LIKE 'fos-cond-%'
ON CONFLICT DO NOTHING;

-- GH CS Unified (all gh-cs-* questions)
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id, ROW_NUMBER() OVER (ORDER BY q.slug)::int
FROM question_sets qs, questions q
WHERE qs.slug = 'gh-cs-unified' AND q.slug LIKE 'gh-cs-%'
ON CONFLICT DO NOTHING;

-- GH Absurdist
INSERT INTO question_set_questions (question_set_id, question_id, display_order)
SELECT qs.id, q.id,
  SUBSTRING(q.slug FROM 'gh-abs-(\d+)')::int
FROM question_sets qs, questions q
WHERE qs.slug = 'gh-absurdist' AND q.slug LIKE 'gh-abs-%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count questions by domain
DO $$
DECLARE
  core_count INT;
  fos_count INT;
  gh_count INT;
BEGIN
  SELECT COUNT(*) INTO core_count FROM questions WHERE domain = 'core';
  SELECT COUNT(*) INTO fos_count FROM questions WHERE domain = 'fos';
  SELECT COUNT(*) INTO gh_count FROM questions WHERE domain = 'gh';

  RAISE NOTICE 'Questions seeded: CORE=%, FOS=%, GH=%', core_count, fos_count, gh_count;
END $$;
