-- CS Assessment Enhanced Schema (Phase 1)
-- Adds support for 14 dimensions, personality typing, badges, and enhanced scoring

-- =====================================================
-- 1. CREATE cs_assessment_sessions TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cs_assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Session State
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  current_section TEXT,
  current_question INTEGER,

  -- Answers stored as JSONB
  answers JSONB DEFAULT '{}'::jsonb,

  -- Scoring Results (14 dimensions)
  dimensions JSONB, -- All 14 dimension scores (0-100)
  overall_score INTEGER,

  -- Personality Analysis
  personality_type TEXT, -- MBTI like "INTJ"
  personality_profile JSONB, -- {mbti, enneagram, traits[]}

  -- Category Scores
  category_scores JSONB, -- {technical, emotional, creative with subscores}

  -- AI Orchestration Sub-scores
  ai_orchestration_scores JSONB, -- {technical_foundation, practical_use, etc.}

  -- Archetype & Tier
  archetype TEXT,
  archetype_confidence TEXT CHECK (archetype_confidence IN ('high', 'medium', 'low')),
  tier TEXT CHECK (tier IN ('top_1', 'benched', 'passed')),

  -- Flags & Recommendations
  flags JSONB, -- {red_flags[], green_flags[]}
  recommendation TEXT,
  best_fit_roles JSONB, -- Array of role recommendations

  -- Summaries
  public_summary TEXT, -- Shareable positive summary
  detailed_summary TEXT, -- Internal full analysis

  -- Badges
  badges TEXT[], -- Array of badge IDs earned

  -- Publishing
  is_published BOOLEAN DEFAULT false,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_user_id ON public.cs_assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_company_id ON public.cs_assessment_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_status ON public.cs_assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_tier ON public.cs_assessment_sessions(tier);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_cs_assessment_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cs_assessment_sessions_updated_at
  BEFORE UPDATE ON public.cs_assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cs_assessment_sessions_updated_at();

-- =====================================================
-- 2. CREATE assessment_badges TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.assessment_badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  category TEXT NOT NULL CHECK (category IN ('dimension', 'category', 'combo', 'achievement')),
  criteria JSONB NOT NULL, -- Badge criteria for evaluation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed badge definitions
INSERT INTO public.assessment_badges (id, name, description, icon, category, criteria) VALUES
  (
    'ai_prodigy',
    'AI Prodigy',
    'Exceptional AI readiness and orchestration capability (90+ AI Readiness)',
    '🤖',
    'dimension',
    '{"type": "single_dimension", "conditions": [{"dimension": "ai_readiness", "min_score": 90}]}'::jsonb
  ),
  (
    'technical_maestro',
    'Technical Maestro',
    'Outstanding technical prowess across all domains (90+ Technical category)',
    '⚡',
    'category',
    '{"type": "category", "conditions": [{"category": "technical", "min_score": 90}]}'::jsonb
  ),
  (
    'people_champion',
    'People Champion',
    'Exceptional emotional intelligence and empathy (90+ Emotional category)',
    '❤️',
    'category',
    '{"type": "category", "conditions": [{"category": "emotional", "min_score": 90}]}'::jsonb
  ),
  (
    'creative_genius',
    'Creative Genius',
    'Remarkable creativity and innovative thinking (90+ Creative category)',
    '🎨',
    'category',
    '{"type": "category", "conditions": [{"category": "creative", "min_score": 90}]}'::jsonb
  ),
  (
    'triple_threat',
    'Triple Threat',
    'Excellence across all three major categories (85+ in Technical, Emotional, and Creative)',
    '🌟',
    'combo',
    '{"type": "combo", "conditions": [{"category": "technical", "min_score": 85}, {"category": "emotional", "min_score": 85}, {"category": "creative", "min_score": 85}], "requires_all": true}'::jsonb
  ),
  (
    'rising_star',
    'Rising Star',
    'Exceptional performance with limited experience (80+ overall, <3 years)',
    '⭐',
    'achievement',
    '{"type": "achievement", "conditions": [{"min_score": 80}, {"experience_years": {"max": 3}}], "requires_all": true}'::jsonb
  ),
  (
    'veteran_pro',
    'Veteran Pro',
    'Sustained excellence over long career (85+ overall, 10+ years)',
    '🏆',
    'achievement',
    '{"type": "achievement", "conditions": [{"min_score": 85}, {"experience_years": {"min": 10}}], "requires_all": true}'::jsonb
  ),
  (
    'strategic_mind',
    'Strategic Mind',
    'Outstanding go-to-market strategy and leadership (90+ GTM and Executive Leadership)',
    '🧠',
    'combo',
    '{"type": "multiple_dimensions", "conditions": [{"dimension": "gtm", "min_score": 90}, {"dimension": "executive_leadership", "min_score": 90}], "requires_all": true}'::jsonb
  ),
  (
    'technical_empath',
    'Technical Empath',
    'Rare combination of technical excellence and deep empathy (85+ Technical and Empathy)',
    '💡',
    'combo',
    '{"type": "multiple_dimensions", "conditions": [{"dimension": "technical", "min_score": 85}, {"dimension": "empathy", "min_score": 85}], "requires_all": true}'::jsonb
  ),
  (
    'organized_mind',
    'Organized Mind',
    'Exceptional organizational and systems thinking (90+ Organization)',
    '📋',
    'dimension',
    '{"type": "single_dimension", "conditions": [{"dimension": "organization", "min_score": 90}]}'::jsonb
  ),
  (
    'self_aware_leader',
    'Self-Aware Leader',
    'Deep self-awareness combined with leadership capability (90+ Self-Awareness and Executive Leadership)',
    '🌱',
    'combo',
    '{"type": "multiple_dimensions", "conditions": [{"dimension": "self_awareness", "min_score": 90}, {"dimension": "executive_leadership", "min_score": 90}], "requires_all": true}'::jsonb
  ),
  (
    'cultural_fit_star',
    'Cultural Fit Star',
    'Outstanding cultural alignment and team fit (95+ Culture Fit)',
    '✨',
    'dimension',
    '{"type": "single_dimension", "conditions": [{"dimension": "culture_fit", "min_score": 95}]}'::jsonb
  ),
  (
    'motivation_master',
    'Motivation Master',
    'Exceptional drive and internal motivation (95+ Motivation)',
    '🔥',
    'dimension',
    '{"type": "single_dimension", "conditions": [{"dimension": "motivation", "min_score": 95}]}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. CREATE lightning_round_sessions TABLE (Phase 2 prep)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.lightning_round_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,

  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'insane')),
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  time_seconds INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lightning_round_sessions_user_id ON public.lightning_round_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_lightning_round_sessions_difficulty ON public.lightning_round_sessions(difficulty);

-- =====================================================
-- 4. RLS (Row Level Security) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.cs_assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lightning_round_sessions ENABLE ROW LEVEL SECURITY;

-- cs_assessment_sessions policies
CREATE POLICY "Users can view their own assessment sessions"
  ON public.cs_assessment_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessment sessions"
  ON public.cs_assessment_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessment sessions"
  ON public.cs_assessment_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessment sessions"
  ON public.cs_assessment_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- assessment_badges policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view badge definitions"
  ON public.assessment_badges
  FOR SELECT
  TO authenticated
  USING (true);

-- lightning_round_sessions policies
CREATE POLICY "Users can view their own lightning round sessions"
  ON public.lightning_round_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lightning round sessions"
  ON public.lightning_round_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get user's latest assessment session
CREATE OR REPLACE FUNCTION get_latest_assessment_session(p_user_id UUID)
RETURNS TABLE (
  session_id UUID,
  status TEXT,
  overall_score INTEGER,
  archetype TEXT,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    cs_assessment_sessions.status,
    cs_assessment_sessions.overall_score,
    cs_assessment_sessions.archetype,
    cs_assessment_sessions.completed_at
  FROM public.cs_assessment_sessions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate progress percentage
CREATE OR REPLACE FUNCTION calculate_assessment_progress(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_questions INTEGER := 20; -- From core-questions.json
  answered_count INTEGER;
BEGIN
  SELECT jsonb_object_keys(answers)::INTEGER
  INTO answered_count
  FROM public.cs_assessment_sessions
  WHERE id = p_session_id;

  RETURN COALESCE((answered_count * 100) / total_questions, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.cs_assessment_sessions IS 'Enhanced CS assessment sessions with 14 dimensions, personality typing, and badge support';
COMMENT ON TABLE public.assessment_badges IS 'Badge definitions with criteria for automatic awarding';
COMMENT ON TABLE public.lightning_round_sessions IS 'Lightning round quick assessment sessions (Phase 2)';

COMMENT ON COLUMN public.cs_assessment_sessions.dimensions IS 'JSONB containing all 14 dimension scores (iq, eq, empathy, self_awareness, technical, ai_readiness, gtm, personality, motivation, work_history, passions, culture_fit, organization, executive_leadership)';
COMMENT ON COLUMN public.cs_assessment_sessions.personality_profile IS 'JSONB with {mbti, enneagram, traits[]}';
COMMENT ON COLUMN public.cs_assessment_sessions.category_scores IS 'JSONB with technical, emotional, creative categories and subscores';
COMMENT ON COLUMN public.cs_assessment_sessions.ai_orchestration_scores IS 'JSONB with 5 AI orchestration sub-scores';
COMMENT ON COLUMN public.cs_assessment_sessions.public_summary IS 'Shareable positive summary (3-5 sentences)';
COMMENT ON COLUMN public.cs_assessment_sessions.detailed_summary IS 'Internal section-by-section analysis';
