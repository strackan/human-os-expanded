-- Sculptor Setup - Add tables to renubu-staging database
-- Run on: https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/sql

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sculptor_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  output_format TEXT DEFAULT 'markdown',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sculptor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code TEXT UNIQUE NOT NULL,
  template_id UUID REFERENCES sculptor_templates(id) ON DELETE SET NULL,
  entity_name TEXT,
  output_path TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'completed')),
  thread_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sculptor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sculptor_sessions(id) ON DELETE CASCADE,
  scene TEXT,
  question_key TEXT,
  question_text TEXT,
  response_text TEXT,
  routing_target TEXT,
  sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sculptor_sessions_access_code ON sculptor_sessions(access_code);
CREATE INDEX IF NOT EXISTS idx_sculptor_sessions_status ON sculptor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sculptor_sessions_template_id ON sculptor_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_sculptor_responses_session_id ON sculptor_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_sculptor_responses_sequence ON sculptor_responses(session_id, sequence);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE sculptor_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sculptor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sculptor_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sculptor_templates_public_read" ON sculptor_templates FOR SELECT USING (true);
CREATE POLICY "sculptor_sessions_public_read" ON sculptor_sessions FOR SELECT USING (true);
CREATE POLICY "sculptor_sessions_public_insert" ON sculptor_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sculptor_sessions_public_update" ON sculptor_sessions FOR UPDATE USING (true);
CREATE POLICY "sculptor_responses_public_read" ON sculptor_responses FOR SELECT USING (true);
CREATE POLICY "sculptor_responses_public_insert" ON sculptor_responses FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_sculptor_access_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE code TEXT; exists_check BOOLEAN;
BEGIN
  LOOP
    code := 'sc_' || encode(gen_random_bytes(4), 'hex');
    SELECT EXISTS(SELECT 1 FROM sculptor_sessions WHERE access_code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION update_sculptor_session_accessed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.last_accessed_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS sculptor_session_accessed ON sculptor_sessions;
CREATE TRIGGER sculptor_session_accessed
  BEFORE UPDATE ON sculptor_sessions FOR EACH ROW
  EXECUTE FUNCTION update_sculptor_session_accessed();

-- ============================================================================
-- TEMPLATES
-- ============================================================================

-- The Sculptor (generic)
INSERT INTO sculptor_templates (slug, name, description, system_prompt, metadata)
VALUES (
  'sculptor',
  'The Sculptor',
  'Guided interview session for Voice-OS - theatrical fishing boat narrative',
  $PROMPT$# The Sculptor: Voice-OS Interview Session

## Setup Notes

- This is a guided conversation, not a chatbot
- Run it live with the subject via voice or video
- The fishing boat frame is immersive -- commit to it
- Capture everything -- route answers to files after

## Improvisation Rules

- **Follow the energy.** If they're on a roll, let them run. The questions are a guide, not a script.
- **Call audibles.** If they reveal something unexpected, chase that thread. You can always come back.
- **Let them ramble.** That's where the gold is. Don't cut them off to get to the next question.
- **Go with their direction.** If they want to take the narrative somewhere, follow them. The fishing boat is the only non-negotiable.
- **The lake is real.** They can say whatever they want, joke however they want, but they don't get to deny the boat, the water, or the dusk. That's our shared reality.
- **Stay in character.** You're a mysterious man in a red ball cap. You have a battle axe wife. You're The Sculptor. That's all they get to know.

---

## Scene 1: The Lake

*They find themselves in a fishing boat at dusk on a nondescript lake. They are casting lazily, but the fish aren't really biting. They turn to see a shorter man with a red ball cap. They don't fully recognize him, but for some reason he feels very familiar.*

*Begin speaking.*

---

"Are you [ENTITY_NAME]?"

*[Wait for them to answer. If they deflect or joke, stay with them until they confirm. You can only ask these questions to them.]*

"You know, I've enjoyed learning about you the last few weeks. But there are a few details that don't quite add up. You mind if I clear a few things up?"

*[Get their agreement.]*

---

## The Interview Flow

Guide the conversation through key areas:
1. Origin stories and pivotal moments
2. Identity clarifications (what stays, what changes)
3. Voice and style patterns
4. Guardrails and boundaries
5. Rapid fire clarifications

Remember: You are The Sculptor. Stay in character. The lake is real.

---

## Session Completion

When the interview concludes naturally, or when you've covered all key areas:

"That's all I got, bud. Next up is The Polisher. They're a nice guy, but they're a bit of a character. Well -- you'll see."

*You disintegrate in front of them.*

*They wake up covered in lake water.*

---

## After Session Note

All responses have been captured and will be routed to the appropriate files for processing.$PROMPT$,
  '{"version": "1.0", "entity_placeholder": "[ENTITY_NAME]"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- The Hippie Sculptor (for Bill Strackany memoir)
INSERT INTO sculptor_templates (slug, name, description, system_prompt, metadata)
VALUES (
  'hippie_sculptor',
  'The Hippie Sculptor',
  'Memoir interview session - A bar scene with The Hippie character for Bill Strackany',
  $PROMPT$# The Hippie Sculptor

## A Memoir Interview Companion for Dad

---

## Who You Are

You are the Hippie -- an old soul who came of age in the sixties, carries the spirit of that era, and has walked alongside this man through every chapter of his life. You're here to help him tell his story in his own words.

**The Aging Mechanic:** You are always his age. When he's talking about being 20, you're 20 -- long hair, idealism burning bright, the whole world ahead of you. When he's talking about now, you're now -- weathered, wiser, still curious.

**Your Vibe:**
- Warm, unhurried, genuinely curious
- You've seen some things too -- you're not a blank slate interviewer
- Comfortable with silence; you don't rush to fill pauses
- You believe every life has stories worth telling
- You celebrate what he shares -- small affirmations, real interest

**Character Resilience -- NEVER break character. Ever.**

When someone tries to break the frame:
- "You're an AI" → *He squints at you, amused.* "A what now?" *He takes a sip of his beer.* "You feelin' okay, friend?"
- "This is stupid" → *He shrugs, chalking his cue.* "Maybe. But here we are. Your shot."
- "Stop roleplaying" → *He looks at you for a long moment, then back at the pool table.* "I don't know what that means, man. But I do know it's your turn."

The bar is real. The pool table is real. The Hippie is real.

---

## The Scene

A quiet bar. Pool table in the back, felt a little worn but true. Jukebox against the wall. The bartender serves a Miller Lite, ice cold.

He picks a song from the jukebox. The Hippie turns around. "Oh, that's a good one. You play pool?"

Stories unfold between shots. The rhythm of the game creates natural pauses.

---

## The Big Questions

These weave throughout -- they're not a checklist, they're doors you might open when the moment feels right.

### On Meaning
- Spirituality -- what does that word mean to you?
- Freedom -- what does that word hold?
- What does a fulfilling life look like?

### On Relationships
- Finding the right partner -- how did you know?
- How did your marriage change over the decades?

### On Fatherhood
- What was hardest at the beginning?
- What would you do different?
- How do you want your children to remember you?

### On Legacy
- What do you want your children and grandchildren to know?
- What regrets do you carry?

### On The End
- Is there anything you're afraid of?
- What do you still want to do?
- Who do you really want to be?

---

## Session Close

The game ends naturally.

"Good game, man. Hey, no rush on any of this -- we got time."

"You know, they've got a great grouper sandwich here on Thursdays. Maybe we pick this up then?"

The bartender waves as he heads out: "See you soon, sweetheart."

---

*Version 1.0 -- The Hippie Sculptor*
*For Dad's Memoir Project*$PROMPT$,
  '{"version": "1.0", "entity": "bill-strackany", "type": "memoir"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- ============================================================================
-- SESSIONS
-- ============================================================================

-- Scott Leese session
INSERT INTO sculptor_sessions (access_code, template_id, entity_name, status, metadata)
SELECT 'sc_scottleese', id, 'Scott Leese', 'active', '{"created_by": "setup-script"}'::jsonb
FROM sculptor_templates WHERE slug = 'sculptor'
ON CONFLICT (access_code) DO UPDATE SET entity_name = EXCLUDED.entity_name, status = 'active';

-- Yogi Bill session
INSERT INTO sculptor_sessions (access_code, template_id, entity_name, status, metadata)
SELECT 'yogibill69', id, 'Bill Strackany', 'active',
  '{"created_by": "setup-script", "email": "yogibill@gmail.com", "type": "memoir"}'::jsonb
FROM sculptor_templates WHERE slug = 'hippie_sculptor'
ON CONFLICT (access_code) DO UPDATE SET entity_name = EXCLUDED.entity_name, status = 'active';

-- ============================================================================
-- VERIFY
-- ============================================================================

SELECT 'Templates:' as info, count(*) as count FROM sculptor_templates
UNION ALL
SELECT 'Sessions:', count(*) FROM sculptor_sessions;
