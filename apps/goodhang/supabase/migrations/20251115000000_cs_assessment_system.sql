-- CS Assessment System
-- Self-contained assessment with auto-save and AI scoring

-- ============================================================================
-- cs_assessment_sessions table
-- ============================================================================

CREATE TABLE cs_assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Progress tracking
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_section_index INTEGER NOT NULL DEFAULT 0,
  current_question_index INTEGER NOT NULL DEFAULT 0,

  -- Interview data (markdown-formatted JSONB transcript)
  -- Format: [{"role": "assistant|user", "content": "text", "timestamp": "ISO8601"}]
  interview_transcript JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scoring results (populated after completion via Claude API)
  archetype TEXT, -- e.g., "Technical Builder", "GTM Operator"
  archetype_confidence TEXT CHECK (archetype_confidence IN ('high', 'medium', 'low')),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- 12-dimension scores (0-100 each)
  dimensions JSONB, -- {iq, eq, empathy, self_awareness, technical, ai_readiness, gtm, personality, motivation, work_history, passions, culture_fit}

  -- Tier routing
  tier TEXT CHECK (tier IN ('top_1', 'benched', 'passed')),

  -- Flags and recommendations
  flags JSONB, -- {red_flags: [], green_flags: []}
  recommendation TEXT,
  best_fit_roles TEXT[],

  -- Analysis metadata
  analyzed_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Query sessions by user
CREATE INDEX idx_cs_assessment_sessions_user_id
  ON cs_assessment_sessions(user_id);

-- Query by status (e.g., find abandoned sessions)
CREATE INDEX idx_cs_assessment_sessions_status
  ON cs_assessment_sessions(status);

-- Query recent sessions
CREATE INDEX idx_cs_assessment_sessions_started_at
  ON cs_assessment_sessions(started_at DESC);

-- Find completed sessions for analytics
CREATE INDEX idx_cs_assessment_sessions_completed
  ON cs_assessment_sessions(completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE cs_assessment_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own assessment sessions"
  ON cs_assessment_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own assessment sessions"
  ON cs_assessment_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own assessment sessions"
  ON cs_assessment_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions (optional - for retakes)
CREATE POLICY "Users can delete own assessment sessions"
  ON cs_assessment_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cs_assessment_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cs_assessment_sessions_updated_at
  BEFORE UPDATE ON cs_assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cs_assessment_session_updated_at();

-- ============================================================================
-- Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE cs_assessment_sessions IS
  'CS Assessment sessions with auto-save progress and AI scoring results';

COMMENT ON COLUMN cs_assessment_sessions.interview_transcript IS
  'JSONB array of Q&A pairs in markdown format for LLM analysis';

COMMENT ON COLUMN cs_assessment_sessions.dimensions IS
  'JSONB object with 12 scoring dimensions (0-100): iq, eq, empathy, self_awareness, technical, ai_readiness, gtm, personality, motivation, work_history, passions, culture_fit';

COMMENT ON COLUMN cs_assessment_sessions.tier IS
  'Routing tier based on overall_score: top_1 (85+), benched (60-84), passed (<60)';
