-- =============================================================================
-- Fix emotion trends: composite index + optimized query
-- =============================================================================
-- The get_emotion_trends function was timing out due to:
-- 1. Missing composite index on (layer, analyzed_date)
-- 2. NULL date filter applied after CTE scan
-- =============================================================================

-- Add composite index for the primary filter pattern
CREATE INDEX IF NOT EXISTS idx_emotion_analyses_layer_date
  ON human_os.emotion_analyses(layer, analyzed_date)
  WHERE analyzed_date IS NOT NULL;

-- Rewrite function with NULL filter in the CTE WHERE clause
CREATE OR REPLACE FUNCTION human_os.get_emotion_trends(
  p_group_by TEXT DEFAULT 'month',
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
  WITH grouped AS (
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
    FROM human_os.emotion_analyses
    WHERE analyzed_date IS NOT NULL
      AND (layer = 'public' OR layer = p_layer)
      AND (p_date_from IS NULL OR analyzed_date >= p_date_from)
      AND (p_date_to IS NULL OR analyzed_date <= p_date_to)
      AND (p_source_type IS NULL OR source_type = p_source_type)
      AND (p_participant IS NULL OR p_participant = ANY(participant_names))
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
