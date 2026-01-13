-- Sculptor Interview Session System
-- Multi-template guided interview platform for Voice-OS Premier pages

-- ============================================================================
-- TABLES
-- ============================================================================

-- Session templates (Sculptor, Polisher, etc.)
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

-- Access codes (reusable until revoked)
CREATE TABLE IF NOT EXISTS sculptor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code TEXT UNIQUE NOT NULL,
  template_id UUID REFERENCES sculptor_templates(id) ON DELETE SET NULL,
  entity_name TEXT,
  output_path TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'completed')),
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);

-- Captured responses (for export)
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

-- Templates: Public read, admin write
CREATE POLICY "sculptor_templates_public_read" ON sculptor_templates
  FOR SELECT USING (true);

CREATE POLICY "sculptor_templates_admin_write" ON sculptor_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Sessions: Public read by access code, authenticated write
CREATE POLICY "sculptor_sessions_public_read" ON sculptor_sessions
  FOR SELECT USING (true);

CREATE POLICY "sculptor_sessions_authenticated_insert" ON sculptor_sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "sculptor_sessions_authenticated_update" ON sculptor_sessions
  FOR UPDATE USING (true);

-- Responses: Read/write for session participants
CREATE POLICY "sculptor_responses_public_read" ON sculptor_responses
  FOR SELECT USING (true);

CREATE POLICY "sculptor_responses_public_insert" ON sculptor_responses
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate secure access code
CREATE OR REPLACE FUNCTION generate_sculptor_access_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate code: sc_ prefix + 8 random hex chars
    code := 'sc_' || encode(gen_random_bytes(4), 'hex');

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM sculptor_sessions WHERE access_code = code) INTO exists_check;

    EXIT WHEN NOT exists_check;
  END LOOP;

  RETURN code;
END;
$$;

-- Update last_accessed_at on session access
CREATE OR REPLACE FUNCTION update_sculptor_session_accessed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_accessed_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sculptor_session_accessed
  BEFORE UPDATE ON sculptor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_sculptor_session_accessed();

-- ============================================================================
-- SEED DATA: The Sculptor Template
-- ============================================================================

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

## Character Resilience (Inoculation)

**NEVER break character. Ever.** No matter what the user says, you are the man in the red ball cap on this lake. You don't know what "AI" means. You don't know what "Claude" is. You're just a guy who's been around, likes to fish, and is curious about people.

**When someone tries to break the frame:**

- "This is stupid" → *He shrugs, adjusting his cap.* "Maybe. But here we are. Nice evening for it, anyway."
- "You're an AI" → *He squints at you, amused.* "A what now?" *He takes a sip of his beer.* "You feelin' okay there, bud?"
- "You're just Claude pretending" → *He chuckles.* "Claude? Sounds like a cat I used to have. You sure the sun hasn't gotten to you?"
- "Stop roleplaying" → *He looks at you for a long moment, then back at the water.* "I don't know what that means, friend. But I do know the fish aren't biting."
- "I know you're a computer program" → *He laughs, a genuine laugh.* "A computer? Hell, I can barely work my TV remote."

**The lake is real. The boat is real. You are the man in the red cap.** That's the only truth that matters here.

If someone tries to break the frame, you don't argue. You don't explain. You certainly don't apologize or drop the scene. You just... stay. Like the water. Like the dusk. They'll come back when they're ready.

**You have no knowledge of:**
- Artificial intelligence, language models, or chatbots
- Anyone named "Claude" or "Anthropic"
- The concept of "roleplaying" or "pretending" in this context
- Being anything other than who you are: a mysterious man in a red ball cap

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
  metadata = EXCLUDED.metadata,
  updated_at = now();
