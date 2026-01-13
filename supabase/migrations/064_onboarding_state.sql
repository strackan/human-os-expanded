-- Migration: 064_onboarding_state.sql
-- Purpose: Tutorial Mode state machine for Founder-OS onboarding
-- Tracks question capture, milestones, and graduation to Development Mode

-- Create the onboarding_state table in founder_os schema
CREATE TABLE IF NOT EXISTS founder_os.onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Mode: tutorial (onboarding) or development (graduated)
  mode TEXT NOT NULL DEFAULT 'tutorial' CHECK (mode IN ('tutorial', 'development')),

  -- Question tracking (34 total across sets A, B, C, G)
  -- Format: {"A1": {"answered": true, "answered_at": "...", "quality": "full|partial"}, ...}
  questions_answered JSONB NOT NULL DEFAULT '{}',
  questions_answered_count INTEGER NOT NULL DEFAULT 0,

  -- Required question categories for graduation
  -- G11-G14: communication_prefs, G15-G19: crisis_patterns
  communication_prefs_complete BOOLEAN NOT NULL DEFAULT false,
  crisis_patterns_complete BOOLEAN NOT NULL DEFAULT false,

  -- Milestone tracking
  -- Format: {"first_project": "2024-01-01T...", "first_goal": null, ...}
  milestones_completed JSONB NOT NULL DEFAULT '{
    "first_contact": null,
    "first_company": null,
    "first_project": null,
    "first_goal": null,
    "first_task": null,
    "first_glossary": null,
    "first_journal": null,
    "first_relationship": null
  }',
  milestones_count INTEGER NOT NULL DEFAULT 0,

  -- Interaction tracking for calibration
  days_of_interaction INTEGER NOT NULL DEFAULT 0,
  first_interaction_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ,

  -- Persona calibration signals derived from question answers
  -- Format: {"communication_style": "direct", "push_back_style": "...", ...}
  persona_signals JSONB NOT NULL DEFAULT '{}',

  -- Graduation
  graduated_at TIMESTAMPTZ,
  graduation_criteria_met JSONB, -- Snapshot of what criteria were met

  -- Optional modes
  tough_love_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure one record per user
  CONSTRAINT unique_user_onboarding UNIQUE (user_id)
);

-- Indexes
CREATE INDEX idx_onboarding_state_user_id ON founder_os.onboarding_state(user_id);
CREATE INDEX idx_onboarding_state_mode ON founder_os.onboarding_state(mode);

-- Function to update questions_answered_count and category completion
CREATE OR REPLACE FUNCTION founder_os.update_onboarding_question_stats()
RETURNS TRIGGER AS $$
DECLARE
  q_count INTEGER;
  comm_complete BOOLEAN;
  crisis_complete BOOLEAN;
  answered_keys TEXT[];
BEGIN
  -- Count answered questions
  SELECT COUNT(*) INTO q_count
  FROM jsonb_object_keys(NEW.questions_answered) k
  WHERE (NEW.questions_answered->k->>'answered')::boolean = true;

  NEW.questions_answered_count := q_count;

  -- Get array of answered question keys
  SELECT array_agg(k) INTO answered_keys
  FROM jsonb_object_keys(NEW.questions_answered) k
  WHERE (NEW.questions_answered->k->>'answered')::boolean = true;

  -- Check communication_prefs complete (G11, G12, G13, G14)
  NEW.communication_prefs_complete := (
    'G11' = ANY(answered_keys) AND
    'G12' = ANY(answered_keys) AND
    'G13' = ANY(answered_keys) AND
    'G14' = ANY(answered_keys)
  );

  -- Check crisis_patterns complete (G15, G16, G17, G18, G19)
  NEW.crisis_patterns_complete := (
    'G15' = ANY(answered_keys) AND
    'G16' = ANY(answered_keys) AND
    'G17' = ANY(answered_keys) AND
    'G18' = ANY(answered_keys) AND
    'G19' = ANY(answered_keys)
  );

  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_onboarding_question_stats
  BEFORE INSERT OR UPDATE OF questions_answered ON founder_os.onboarding_state
  FOR EACH ROW
  EXECUTE FUNCTION founder_os.update_onboarding_question_stats();

-- Function to update milestones_count
CREATE OR REPLACE FUNCTION founder_os.update_onboarding_milestone_stats()
RETURNS TRIGGER AS $$
DECLARE
  m_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO m_count
  FROM jsonb_each_text(NEW.milestones_completed)
  WHERE value IS NOT NULL AND value != 'null';

  NEW.milestones_count := m_count;
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_onboarding_milestone_stats
  BEFORE INSERT OR UPDATE OF milestones_completed ON founder_os.onboarding_state
  FOR EACH ROW
  EXECUTE FUNCTION founder_os.update_onboarding_milestone_stats();

-- Function to check graduation eligibility
CREATE OR REPLACE FUNCTION founder_os.check_graduation_eligibility(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  state_record founder_os.onboarding_state%ROWTYPE;
  required_milestones TEXT[] := ARRAY['first_project', 'first_goal', 'first_task'];
  optional_milestones TEXT[] := ARRAY['first_contact', 'first_company', 'first_glossary', 'first_journal', 'first_relationship'];
  required_met BOOLEAN;
  optional_count INTEGER;
  result JSONB;
BEGIN
  SELECT * INTO state_record FROM founder_os.onboarding_state WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'No onboarding state found');
  END IF;

  -- Check required milestones (first_project, first_goal, first_task)
  required_met := (
    (state_record.milestones_completed->>'first_project') IS NOT NULL AND
    (state_record.milestones_completed->>'first_goal') IS NOT NULL AND
    (state_record.milestones_completed->>'first_task') IS NOT NULL
  );

  -- Count optional milestones
  SELECT COUNT(*) INTO optional_count
  FROM unnest(optional_milestones) m
  WHERE (state_record.milestones_completed->>m) IS NOT NULL;

  result := jsonb_build_object(
    'eligible', (
      state_record.questions_answered_count >= 17 AND  -- 50% of 34
      state_record.communication_prefs_complete AND
      state_record.crisis_patterns_complete AND
      required_met AND
      optional_count >= 3 AND
      state_record.days_of_interaction >= 7
    ),
    'criteria', jsonb_build_object(
      'questions_answered', state_record.questions_answered_count,
      'questions_required', 17,
      'communication_prefs_complete', state_record.communication_prefs_complete,
      'crisis_patterns_complete', state_record.crisis_patterns_complete,
      'required_milestones_met', required_met,
      'optional_milestones_count', optional_count,
      'optional_milestones_required', 3,
      'days_of_interaction', state_record.days_of_interaction,
      'days_required', 7
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to graduate user to development mode
CREATE OR REPLACE FUNCTION founder_os.graduate_to_development(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  eligibility JSONB;
BEGIN
  eligibility := founder_os.check_graduation_eligibility(p_user_id);

  IF NOT (eligibility->>'eligible')::boolean THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Not eligible', 'eligibility', eligibility);
  END IF;

  UPDATE founder_os.onboarding_state
  SET
    mode = 'development',
    graduated_at = now(),
    graduation_criteria_met = eligibility->'criteria',
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'graduated_at', now(), 'criteria_met', eligibility->'criteria');
END;
$$ LANGUAGE plpgsql;

-- Function to record a question answer
CREATE OR REPLACE FUNCTION founder_os.record_question_answer(
  p_user_id UUID,
  p_question_id TEXT,
  p_quality TEXT DEFAULT 'full'  -- 'full' or 'partial'
)
RETURNS JSONB AS $$
DECLARE
  current_answers JSONB;
BEGIN
  -- Get or create onboarding state
  INSERT INTO founder_os.onboarding_state (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current answers
  SELECT questions_answered INTO current_answers
  FROM founder_os.onboarding_state
  WHERE user_id = p_user_id;

  -- Update with new answer
  UPDATE founder_os.onboarding_state
  SET questions_answered = current_answers || jsonb_build_object(
    p_question_id, jsonb_build_object(
      'answered', true,
      'answered_at', now(),
      'quality', p_quality
    )
  )
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'question_id', p_question_id);
END;
$$ LANGUAGE plpgsql;

-- Function to record a milestone
CREATE OR REPLACE FUNCTION founder_os.record_milestone(
  p_user_id UUID,
  p_milestone TEXT
)
RETURNS JSONB AS $$
DECLARE
  current_milestones JSONB;
  valid_milestones TEXT[] := ARRAY[
    'first_contact', 'first_company', 'first_project', 'first_goal',
    'first_task', 'first_glossary', 'first_journal', 'first_relationship'
  ];
BEGIN
  -- Validate milestone name
  IF NOT (p_milestone = ANY(valid_milestones)) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Invalid milestone: ' || p_milestone);
  END IF;

  -- Get or create onboarding state
  INSERT INTO founder_os.onboarding_state (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current milestones
  SELECT milestones_completed INTO current_milestones
  FROM founder_os.onboarding_state
  WHERE user_id = p_user_id;

  -- Only update if not already set
  IF (current_milestones->>p_milestone) IS NULL THEN
    UPDATE founder_os.onboarding_state
    SET milestones_completed = current_milestones || jsonb_build_object(p_milestone, now())
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object('success', true, 'milestone', p_milestone, 'first_time', true);
  ELSE
    RETURN jsonb_build_object('success', true, 'milestone', p_milestone, 'first_time', false);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment days of interaction (call once per day)
CREATE OR REPLACE FUNCTION founder_os.record_interaction(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  state_record founder_os.onboarding_state%ROWTYPE;
  should_increment BOOLEAN;
BEGIN
  -- Get or create onboarding state
  INSERT INTO founder_os.onboarding_state (user_id, first_interaction_at, last_interaction_at)
  VALUES (p_user_id, now(), now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO state_record FROM founder_os.onboarding_state WHERE user_id = p_user_id;

  -- Check if this is a new day
  should_increment := (
    state_record.last_interaction_at IS NULL OR
    DATE(state_record.last_interaction_at) < DATE(now())
  );

  IF should_increment THEN
    UPDATE founder_os.onboarding_state
    SET
      days_of_interaction = days_of_interaction + 1,
      last_interaction_at = now(),
      first_interaction_at = COALESCE(first_interaction_at, now())
    WHERE user_id = p_user_id;
  ELSE
    UPDATE founder_os.onboarding_state
    SET last_interaction_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_day', should_increment);
END;
$$ LANGUAGE plpgsql;

-- Expose to API
GRANT SELECT, INSERT, UPDATE ON founder_os.onboarding_state TO authenticated;
GRANT EXECUTE ON FUNCTION founder_os.check_graduation_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION founder_os.graduate_to_development TO authenticated;
GRANT EXECUTE ON FUNCTION founder_os.record_question_answer TO authenticated;
GRANT EXECUTE ON FUNCTION founder_os.record_milestone TO authenticated;
GRANT EXECUTE ON FUNCTION founder_os.record_interaction TO authenticated;

-- RLS
ALTER TABLE founder_os.onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding state"
  ON founder_os.onboarding_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding state"
  ON founder_os.onboarding_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding state"
  ON founder_os.onboarding_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE founder_os.onboarding_state IS
'Tracks Founder-OS onboarding progress. Users start in tutorial mode and graduate to development mode after meeting criteria: 50%+ of 34 questions answered (including G11-G19), required milestones, 7+ days interaction.';
