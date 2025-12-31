-- 057_emotion_analyses_to_human_os.sql
-- Move emotion_analyses from founder_os to human_os schema
-- This table stores automated emotion analysis for all source types (transcripts, journal, social, text)

-- =============================================================================
-- STEP 1: Create table in human_os schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_os.emotion_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source reference
  source_type TEXT NOT NULL CHECK (source_type IN ('transcript', 'journal', 'text', 'social')),
  source_id UUID,                    -- FK to transcript/journal if applicable
  source_text_hash TEXT,             -- Hash of analyzed text for deduplication

  -- Plutchik 8-dimension vector (0-1 normalized scores)
  joy NUMERIC(4,3) NOT NULL DEFAULT 0,
  trust NUMERIC(4,3) NOT NULL DEFAULT 0,
  fear NUMERIC(4,3) NOT NULL DEFAULT 0,
  surprise NUMERIC(4,3) NOT NULL DEFAULT 0,
  sadness NUMERIC(4,3) NOT NULL DEFAULT 0,
  anticipation NUMERIC(4,3) NOT NULL DEFAULT 0,
  anger NUMERIC(4,3) NOT NULL DEFAULT 0,
  disgust NUMERIC(4,3) NOT NULL DEFAULT 0,

  -- VAD (Valence-Arousal-Dominance) dimensions
  valence NUMERIC(4,3),              -- -1 (negative) to +1 (positive)
  arousal NUMERIC(4,3),              -- 0 (calm) to 1 (intense)
  dominance NUMERIC(4,3),            -- 0 (submissive) to 1 (dominant)

  -- Derived metrics
  dominant_emotion TEXT NOT NULL,    -- Primary Plutchik emotion
  emotion_confidence NUMERIC(4,3),   -- Confidence in dominant emotion
  emotion_density NUMERIC(4,3),      -- keywords/words ratio

  -- Context for grouping/trending
  analyzed_date DATE,                -- Date of source content (for trending)
  participant_names TEXT[],          -- People involved (from transcript)
  context_tags TEXT[],               -- Tags for filtering/grouping

  -- Analysis details
  word_count INT,
  keyword_count INT,
  detected_keywords JSONB,           -- [{word, emotion, confidence}]
  analysis_method TEXT DEFAULT 'keyword', -- 'keyword' or 'transformer'

  -- Layer scoping (consistent with other human_os tables)
  layer TEXT NOT NULL DEFAULT 'public',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE human_os.emotion_analyses IS
  'Stores automated emotion analysis results from text-to-Plutchik-vector analysis. Used for trend analysis and relationship tracking across all products.';

-- =============================================================================
-- STEP 2: Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_emotion_analyses_source ON human_os.emotion_analyses(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_emotion_analyses_hash ON human_os.emotion_analyses(source_text_hash);
CREATE INDEX IF NOT EXISTS idx_emotion_analyses_date ON human_os.emotion_analyses(analyzed_date);
CREATE INDEX IF NOT EXISTS idx_emotion_analyses_participants ON human_os.emotion_analyses USING GIN(participant_names);
CREATE INDEX IF NOT EXISTS idx_emotion_analyses_tags ON human_os.emotion_analyses USING GIN(context_tags);
CREATE INDEX IF NOT EXISTS idx_emotion_analyses_dominant ON human_os.emotion_analyses(dominant_emotion);
CREATE INDEX IF NOT EXISTS idx_emotion_analyses_valence ON human_os.emotion_analyses(analyzed_date, valence);
CREATE INDEX IF NOT EXISTS idx_emotion_analyses_layer ON human_os.emotion_analyses(layer);

-- =============================================================================
-- STEP 3: Triggers
-- =============================================================================

CREATE TRIGGER emotion_analyses_updated_at
  BEFORE UPDATE ON human_os.emotion_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- STEP 4: RLS Policies
-- =============================================================================

ALTER TABLE human_os.emotion_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emotion_analyses_service_all" ON human_os.emotion_analyses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "emotion_analyses_read_policy" ON human_os.emotion_analyses
  FOR SELECT TO authenticated
  USING (layer = 'public' OR layer LIKE 'founder:%');

CREATE POLICY "emotion_analyses_write_policy" ON human_os.emotion_analyses
  FOR INSERT TO authenticated
  WITH CHECK (layer = 'public' OR layer LIKE 'founder:%');

-- =============================================================================
-- STEP 5: Helper Functions in human_os
-- =============================================================================

-- Get emotion trends by time period
CREATE OR REPLACE FUNCTION human_os.get_emotion_trends(
  p_group_by TEXT DEFAULT 'month',        -- 'day', 'week', 'month'
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_participant TEXT DEFAULT NULL,
  p_source_type TEXT DEFAULT NULL,
  p_layer TEXT DEFAULT 'public'
)
RETURNS TABLE (
  period TEXT,
  avg_joy NUMERIC,
  avg_trust NUMERIC,
  avg_fear NUMERIC,
  avg_surprise NUMERIC,
  avg_sadness NUMERIC,
  avg_anticipation NUMERIC,
  avg_anger NUMERIC,
  avg_disgust NUMERIC,
  avg_valence NUMERIC,
  avg_arousal NUMERIC,
  dominant_emotion TEXT,
  entry_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH filtered AS (
    SELECT *
    FROM human_os.emotion_analyses
    WHERE
      (layer = 'public' OR layer = p_layer)
      AND (p_date_from IS NULL OR analyzed_date >= p_date_from)
      AND (p_date_to IS NULL OR analyzed_date <= p_date_to)
      AND (p_source_type IS NULL OR source_type = p_source_type)
      AND (p_participant IS NULL OR p_participant = ANY(participant_names))
  ),
  grouped AS (
    SELECT
      CASE p_group_by
        WHEN 'day' THEN to_char(analyzed_date, 'YYYY-MM-DD')
        WHEN 'week' THEN to_char(analyzed_date, 'IYYY-IW')
        WHEN 'month' THEN to_char(analyzed_date, 'YYYY-MM')
        ELSE to_char(analyzed_date, 'YYYY-MM')
      END AS period,
      avg(joy) AS avg_joy,
      avg(trust) AS avg_trust,
      avg(fear) AS avg_fear,
      avg(surprise) AS avg_surprise,
      avg(sadness) AS avg_sadness,
      avg(anticipation) AS avg_anticipation,
      avg(anger) AS avg_anger,
      avg(disgust) AS avg_disgust,
      avg(valence) AS avg_valence,
      avg(arousal) AS avg_arousal,
      count(*) AS entry_count,
      mode() WITHIN GROUP (ORDER BY dominant_emotion) AS dominant_emotion
    FROM filtered
    WHERE analyzed_date IS NOT NULL
    GROUP BY 1
  )
  SELECT
    period,
    round(avg_joy, 3),
    round(avg_trust, 3),
    round(avg_fear, 3),
    round(avg_surprise, 3),
    round(avg_sadness, 3),
    round(avg_anticipation, 3),
    round(avg_anger, 3),
    round(avg_disgust, 3),
    round(avg_valence, 3),
    round(avg_arousal, 3),
    dominant_emotion,
    entry_count
  FROM grouped
  ORDER BY period;
$$;

COMMENT ON FUNCTION human_os.get_emotion_trends IS
  'Returns emotion trends aggregated by time period. Supports filtering by participant, source type, layer, and date range.';

-- Compare emotions between two participants
CREATE OR REPLACE FUNCTION human_os.compare_participant_emotions(
  p_participant1 TEXT,
  p_participant2 TEXT,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_layer TEXT DEFAULT 'public'
)
RETURNS TABLE (
  participant TEXT,
  avg_joy NUMERIC,
  avg_trust NUMERIC,
  avg_fear NUMERIC,
  avg_surprise NUMERIC,
  avg_sadness NUMERIC,
  avg_anticipation NUMERIC,
  avg_anger NUMERIC,
  avg_disgust NUMERIC,
  avg_valence NUMERIC,
  avg_arousal NUMERIC,
  entry_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH expanded AS (
    SELECT
      p.participant,
      ea.joy, ea.trust, ea.fear, ea.surprise,
      ea.sadness, ea.anticipation, ea.anger, ea.disgust,
      ea.valence, ea.arousal
    FROM human_os.emotion_analyses ea,
         LATERAL unnest(ea.participant_names) AS p(participant)
    WHERE
      (ea.layer = 'public' OR ea.layer = p_layer)
      AND (p_participant1 = ANY(ea.participant_names) OR p_participant2 = ANY(ea.participant_names))
      AND (p_date_from IS NULL OR ea.analyzed_date >= p_date_from)
      AND (p_date_to IS NULL OR ea.analyzed_date <= p_date_to)
  )
  SELECT
    participant,
    round(avg(joy), 3),
    round(avg(trust), 3),
    round(avg(fear), 3),
    round(avg(surprise), 3),
    round(avg(sadness), 3),
    round(avg(anticipation), 3),
    round(avg(anger), 3),
    round(avg(disgust), 3),
    round(avg(valence), 3),
    round(avg(arousal), 3),
    count(*)
  FROM expanded
  WHERE participant IN (p_participant1, p_participant2)
  GROUP BY participant;
$$;

COMMENT ON FUNCTION human_os.compare_participant_emotions IS
  'Compares average emotional profiles between two participants.';

-- =============================================================================
-- STEP 6: Migrate existing data (if any)
-- =============================================================================

INSERT INTO human_os.emotion_analyses (
  id, source_type, source_id, source_text_hash,
  joy, trust, fear, surprise, sadness, anticipation, anger, disgust,
  valence, arousal, dominance,
  dominant_emotion, emotion_confidence, emotion_density,
  analyzed_date, participant_names, context_tags,
  word_count, keyword_count, detected_keywords, analysis_method,
  layer, created_at, updated_at
)
SELECT
  id, source_type, source_id, source_text_hash,
  joy, trust, fear, surprise, sadness, anticipation, anger, disgust,
  valence, arousal, dominance,
  dominant_emotion, emotion_confidence, emotion_density,
  analyzed_date, participant_names, context_tags,
  word_count, keyword_count, detected_keywords, analysis_method,
  'founder:justin', created_at, updated_at
FROM founder_os.emotion_analyses
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 7: Grants
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON human_os.emotion_analyses TO authenticated;
GRANT ALL ON human_os.emotion_analyses TO service_role;

GRANT EXECUTE ON FUNCTION human_os.get_emotion_trends TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION human_os.compare_participant_emotions TO authenticated, service_role;

-- =============================================================================
-- STEP 8: Mark old table as deprecated
-- =============================================================================

COMMENT ON TABLE founder_os.emotion_analyses IS
  'DEPRECATED: Use human_os.emotion_analyses instead.
   Data has been migrated. This table will be removed in a future release.';

-- =============================================================================
-- STEP 9: Verify migration
-- =============================================================================

DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM founder_os.emotion_analyses;
  SELECT COUNT(*) INTO new_count FROM human_os.emotion_analyses;
  RAISE NOTICE 'Emotion analyses migration: % rows in founder_os, % rows in human_os', old_count, new_count;
END $$;
