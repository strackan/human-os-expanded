-- Unified Question System
-- Normalized database schema for questions, sets, and entity answers
-- Supports sculptor, onboarding, and thick-client workflows

-- ============================================================================
-- TABLES
-- ============================================================================

-- Questions (normalized, reusable across all products)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,                    -- 'core', 'gh', 'fos', 'ren'
  category TEXT NOT NULL,                  -- 'fingerprint', 'voice', 'founder', 'identity', 'cs-skills'
  subcategory TEXT,                        -- 'guardrails', 'beliefs', 'd-series', 'work-history', etc.
  question_type TEXT DEFAULT 'open',       -- 'open', 'binary', 'scale', 'choice'
  text TEXT NOT NULL,
  description TEXT,                        -- Scoring guidance, what we're looking for
  options JSONB,                           -- For binary/choice: ["Option A", "Option B"]
  maps_to_dimension TEXT,                  -- 'D01', 'D02', etc. for fingerprint questions
  maps_to_output TEXT,                     -- 'voice', 'stories', 'guardrails', 'profile'
  weight INT DEFAULT 1,                    -- Importance weighting for scorecard
  priority INT DEFAULT 2,                  -- 1=blocking, 2=important, 3=nice-to-have
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Question Sets (workflow templates - which questions to ask when)
CREATE TABLE IF NOT EXISTS question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,                    -- 'core', 'gh', 'fos', 'ren'
  target TEXT,                             -- 'sculptor', 'onboarding', 'thick-client', 'assessment'
  description TEXT,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table: which questions belong to which sets
CREATE TABLE IF NOT EXISTS question_set_questions (
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  PRIMARY KEY (question_set_id, question_id)
);

-- Entity Answers (what we've learned about each entity)
CREATE TABLE IF NOT EXISTS entity_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_slug TEXT NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answered BOOLEAN DEFAULT false,
  value_text TEXT,                         -- For open-ended responses
  value_choice TEXT,                       -- For binary/choice selections
  value_numeric NUMERIC,                   -- For scale responses
  source TEXT,                             -- 'sculptor', 'onboarding', 'manual', 'scraper'
  session_id UUID,                         -- Optional: links to sculptor_sessions if from sculptor
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_slug, question_id)
);

-- Computed Dimensions (D-series fingerprint values)
CREATE TABLE IF NOT EXISTS entity_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_slug TEXT NOT NULL,
  dimension_slug TEXT NOT NULL,            -- 'D01', 'D02', etc.
  value TEXT,                              -- The computed value (e.g., 'Solo', 'People')
  confidence TEXT,                         -- 'high', 'medium', 'low', 'inferred'
  source_question_id UUID REFERENCES questions(id),
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_slug, dimension_slug)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_slug ON questions(slug);
CREATE INDEX IF NOT EXISTS idx_questions_maps_to_dimension ON questions(maps_to_dimension);

CREATE INDEX IF NOT EXISTS idx_question_sets_domain ON question_sets(domain);
CREATE INDEX IF NOT EXISTS idx_question_sets_slug ON question_sets(slug);
CREATE INDEX IF NOT EXISTS idx_question_sets_target ON question_sets(target);

CREATE INDEX IF NOT EXISTS idx_question_set_questions_set_id ON question_set_questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_question_set_questions_question_id ON question_set_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_entity_answers_entity_slug ON entity_answers(entity_slug);
CREATE INDEX IF NOT EXISTS idx_entity_answers_question_id ON entity_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_entity_answers_answered ON entity_answers(answered);

CREATE INDEX IF NOT EXISTS idx_entity_dimensions_entity_slug ON entity_dimensions(entity_slug);
CREATE INDEX IF NOT EXISTS idx_entity_dimensions_dimension_slug ON entity_dimensions(dimension_slug);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Entity Scorecard: completion tracking by domain/category/subcategory
CREATE OR REPLACE VIEW entity_scorecard AS
SELECT
  ea.entity_slug,
  q.domain,
  q.category,
  q.subcategory,
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE ea.answered = true) as answered_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE ea.answered = true) / NULLIF(COUNT(*), 0), 1) as completion_pct,
  SUM(q.weight) as total_weight,
  SUM(q.weight) FILTER (WHERE ea.answered = true) as answered_weight,
  ROUND(100.0 * SUM(q.weight) FILTER (WHERE ea.answered = true) / NULLIF(SUM(q.weight), 0), 1) as weighted_completion_pct
FROM questions q
LEFT JOIN entity_answers ea ON ea.question_id = q.id
WHERE ea.entity_slug IS NOT NULL
GROUP BY ea.entity_slug, q.domain, q.category, q.subcategory;

-- Question Set Progress: track which sets are complete for an entity
CREATE OR REPLACE VIEW question_set_progress AS
SELECT
  ea.entity_slug,
  qs.slug as question_set_slug,
  qs.name as question_set_name,
  qs.domain,
  qs.target,
  COUNT(qsq.question_id) as total_questions,
  COUNT(*) FILTER (WHERE ea.answered = true) as answered_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE ea.answered = true) / NULLIF(COUNT(qsq.question_id), 0), 1) as completion_pct
FROM question_sets qs
JOIN question_set_questions qsq ON qsq.question_set_id = qs.id
LEFT JOIN entity_answers ea ON ea.question_id = qsq.question_id
WHERE ea.entity_slug IS NOT NULL
GROUP BY ea.entity_slug, qs.id, qs.slug, qs.name, qs.domain, qs.target;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_set_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_dimensions ENABLE ROW LEVEL SECURITY;

-- Questions: Public read
CREATE POLICY "questions_public_read" ON questions
  FOR SELECT USING (true);

-- Question Sets: Public read
CREATE POLICY "question_sets_public_read" ON question_sets
  FOR SELECT USING (true);

-- Question Set Questions: Public read
CREATE POLICY "question_set_questions_public_read" ON question_set_questions
  FOR SELECT USING (true);

-- Entity Answers: Public read (for now - can restrict later)
CREATE POLICY "entity_answers_public_read" ON entity_answers
  FOR SELECT USING (true);

CREATE POLICY "entity_answers_public_insert" ON entity_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "entity_answers_public_update" ON entity_answers
  FOR UPDATE USING (true);

-- Entity Dimensions: Public read
CREATE POLICY "entity_dimensions_public_read" ON entity_dimensions
  FOR SELECT USING (true);

CREATE POLICY "entity_dimensions_public_insert" ON entity_dimensions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "entity_dimensions_public_update" ON entity_dimensions
  FOR UPDATE USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Upsert entity answer (update if exists, insert if not)
CREATE OR REPLACE FUNCTION upsert_entity_answer(
  p_entity_slug TEXT,
  p_question_slug TEXT,
  p_value_text TEXT DEFAULT NULL,
  p_value_choice TEXT DEFAULT NULL,
  p_value_numeric NUMERIC DEFAULT NULL,
  p_source TEXT DEFAULT 'manual'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question_id UUID;
  v_answer_id UUID;
BEGIN
  -- Get question ID from slug
  SELECT id INTO v_question_id FROM questions WHERE slug = p_question_slug;

  IF v_question_id IS NULL THEN
    RAISE EXCEPTION 'Question not found: %', p_question_slug;
  END IF;

  -- Upsert the answer
  INSERT INTO entity_answers (
    entity_slug, question_id, answered, value_text, value_choice, value_numeric, source, answered_at
  )
  VALUES (
    p_entity_slug, v_question_id, true, p_value_text, p_value_choice, p_value_numeric, p_source, now()
  )
  ON CONFLICT (entity_slug, question_id) DO UPDATE SET
    answered = true,
    value_text = COALESCE(EXCLUDED.value_text, entity_answers.value_text),
    value_choice = COALESCE(EXCLUDED.value_choice, entity_answers.value_choice),
    value_numeric = COALESCE(EXCLUDED.value_numeric, entity_answers.value_numeric),
    source = EXCLUDED.source,
    answered_at = now(),
    updated_at = now()
  RETURNING id INTO v_answer_id;

  RETURN v_answer_id;
END;
$$;

-- Get unanswered questions for an entity in a question set
CREATE OR REPLACE FUNCTION get_unanswered_questions(
  p_entity_slug TEXT,
  p_question_set_slug TEXT
)
RETURNS TABLE (
  question_id UUID,
  question_slug TEXT,
  question_text TEXT,
  question_type TEXT,
  category TEXT,
  subcategory TEXT,
  display_order INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id as question_id,
    q.slug as question_slug,
    q.text as question_text,
    q.question_type,
    q.category,
    q.subcategory,
    qsq.display_order
  FROM question_sets qs
  JOIN question_set_questions qsq ON qsq.question_set_id = qs.id
  JOIN questions q ON q.id = qsq.question_id
  LEFT JOIN entity_answers ea ON ea.question_id = q.id AND ea.entity_slug = p_entity_slug
  WHERE qs.slug = p_question_set_slug
    AND (ea.answered IS NULL OR ea.answered = false)
  ORDER BY qsq.display_order;
END;
$$;

-- Get entity scorecard summary
CREATE OR REPLACE FUNCTION get_entity_scorecard_summary(p_entity_slug TEXT)
RETURNS TABLE (
  domain TEXT,
  total_questions BIGINT,
  answered_count BIGINT,
  completion_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.domain,
    COUNT(*)::BIGINT as total_questions,
    COUNT(*) FILTER (WHERE ea.answered = true)::BIGINT as answered_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE ea.answered = true) / NULLIF(COUNT(*), 0), 1) as completion_pct
  FROM questions q
  LEFT JOIN entity_answers ea ON ea.question_id = q.id AND ea.entity_slug = p_entity_slug
  GROUP BY q.domain
  ORDER BY q.domain;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE questions IS 'Normalized question repository - all questions across all products/domains';
COMMENT ON TABLE question_sets IS 'Question groupings for specific workflows (sculptor, onboarding, etc.)';
COMMENT ON TABLE question_set_questions IS 'Junction table linking questions to sets with ordering';
COMMENT ON TABLE entity_answers IS 'Answers collected for each entity, linked to source (sculptor, scraper, etc.)';
COMMENT ON TABLE entity_dimensions IS 'Computed D-series fingerprint dimensions for entities';
COMMENT ON VIEW entity_scorecard IS 'Completion tracking by entity/domain/category';
COMMENT ON VIEW question_set_progress IS 'Progress tracking for question sets by entity';
