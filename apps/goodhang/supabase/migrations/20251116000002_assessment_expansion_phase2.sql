-- ============================================================================
-- Assessment Expansion Phase 2: Missing Tables & Features
-- Completes the implementation from PHASE1_BACKEND_ASSESSMENT_EXPANSION.md
-- ============================================================================
-- This migration adds:
-- 1. Missing columns to cs_assessment_sessions (career_level, years_experience, etc.)
-- 2. lightning_round_questions table (150+ question bank)
-- 3. public_profiles table (opt-in job board)
-- 4. assessment_leaderboard materialized view
-- 5. Performance-optimized indexes
-- 6. Concurrent refresh functions
-- ============================================================================

-- ============================================================================
-- 1. ALTER cs_assessment_sessions - Add Missing Columns
-- ============================================================================

ALTER TABLE public.cs_assessment_sessions
ADD COLUMN IF NOT EXISTS career_level TEXT CHECK (career_level IN ('entry', 'mid', 'senior_manager', 'director', 'executive', 'c_level')),
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS self_description TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS profile_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS lightning_round_score INTEGER,
ADD COLUMN IF NOT EXISTS lightning_round_difficulty TEXT CHECK (lightning_round_difficulty IN ('beginner', 'intermediate', 'advanced', 'insane')),
ADD COLUMN IF NOT EXISTS lightning_round_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS absurdist_questions_answered INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.cs_assessment_sessions.career_level IS
  'Career seniority level for experience-based badge evaluation';

COMMENT ON COLUMN public.cs_assessment_sessions.years_experience IS
  'Total years of professional experience for badge criteria';

COMMENT ON COLUMN public.cs_assessment_sessions.profile_slug IS
  'URL-safe slug for public profile (e.g., "john-smith-ai-prodigy")';

COMMENT ON COLUMN public.cs_assessment_sessions.lightning_round_score IS
  'Score from 2-minute lightning round (0-100)';

COMMENT ON COLUMN public.cs_assessment_sessions.absurdist_questions_answered IS
  'Count of absurdist finale questions answered (Phase 2)';

-- ============================================================================
-- 2. CREATE lightning_round_questions TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lightning_round_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('general_knowledge', 'brain_teaser', 'math', 'nursery_rhyme')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'intermediate', 'advanced', 'insane')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.lightning_round_questions IS
  'Question bank for 2-minute lightning round challenge. 150+ questions across difficulty levels and types.';

-- Performance indexes for random question selection
CREATE INDEX IF NOT EXISTS idx_lightning_questions_difficulty
  ON public.lightning_round_questions(difficulty);

CREATE INDEX IF NOT EXISTS idx_lightning_questions_type
  ON public.lightning_round_questions(question_type);

CREATE INDEX IF NOT EXISTS idx_lightning_questions_difficulty_type
  ON public.lightning_round_questions(difficulty, question_type);

-- RLS for lightning round questions (public read)
ALTER TABLE public.lightning_round_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lightning round questions are viewable by authenticated users"
  ON public.lightning_round_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 3. CREATE public_profiles TABLE (Opt-in Job Board)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.public_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.cs_assessment_sessions(id) ON DELETE SET NULL,
  profile_slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT, -- Optional - user choice
  career_level TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  self_description TEXT,
  personality_type TEXT,
  archetype TEXT,
  badges TEXT[],
  best_fit_roles TEXT[],
  public_summary TEXT,
  video_url TEXT,
  show_scores BOOLEAN DEFAULT false,
  overall_score INTEGER, -- Only populated if show_scores = true
  category_scores JSONB, -- Only populated if show_scores = true
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.public_profiles IS
  'Published profiles visible on public job board. Opt-in only. Users choose what to share.';

-- Performance indexes for job board searches
CREATE INDEX IF NOT EXISTS idx_public_profiles_slug
  ON public.public_profiles(profile_slug);

CREATE INDEX IF NOT EXISTS idx_public_profiles_career_level
  ON public.public_profiles(career_level);

CREATE INDEX IF NOT EXISTS idx_public_profiles_badges
  ON public.public_profiles USING GIN(badges);

CREATE INDEX IF NOT EXISTS idx_public_profiles_published_at
  ON public.public_profiles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_profiles_archetype
  ON public.public_profiles(archetype);

-- Updated at trigger for public_profiles
CREATE OR REPLACE FUNCTION update_public_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_public_profiles_updated_at
  BEFORE UPDATE ON public.public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_public_profiles_updated_at();

-- RLS for public_profiles
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view published profiles (public job board)
CREATE POLICY "Public profiles are viewable by anyone"
  ON public.public_profiles
  FOR SELECT
  USING (true);

-- Users can create their own profile
CREATE POLICY "Users can create own public profile"
  ON public.public_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own public profile"
  ON public.public_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own public profile"
  ON public.public_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. CREATE assessment_leaderboard MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.assessment_leaderboard AS
SELECT
  user_id,
  archetype,
  overall_score,
  dimensions,
  category_scores,
  badges,
  lightning_round_score,
  completed_at,
  ROW_NUMBER() OVER (ORDER BY overall_score DESC NULLS LAST) as overall_rank,
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'technical')::numeric DESC NULLS LAST) as technical_rank,
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'emotional')::numeric DESC NULLS LAST) as emotional_rank,
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'creative')::numeric DESC NULLS LAST) as creative_rank,
  ROW_NUMBER() OVER (ORDER BY COALESCE(lightning_round_score, 0) DESC) as lightning_rank
FROM public.cs_assessment_sessions
WHERE status = 'completed'
  AND completed_at IS NOT NULL
  AND overall_score IS NOT NULL;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user
  ON public.assessment_leaderboard(user_id);

-- Performance indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_overall_rank
  ON public.assessment_leaderboard(overall_rank);

CREATE INDEX IF NOT EXISTS idx_leaderboard_technical_rank
  ON public.assessment_leaderboard(technical_rank);

CREATE INDEX IF NOT EXISTS idx_leaderboard_emotional_rank
  ON public.assessment_leaderboard(emotional_rank);

CREATE INDEX IF NOT EXISTS idx_leaderboard_creative_rank
  ON public.assessment_leaderboard(creative_rank);

CREATE INDEX IF NOT EXISTS idx_leaderboard_lightning_rank
  ON public.assessment_leaderboard(lightning_rank);

COMMENT ON MATERIALIZED VIEW public.assessment_leaderboard IS
  'Cached leaderboard rankings across all scoring dimensions. Refreshed after assessment completions.';

-- ============================================================================
-- 5. CONCURRENT REFRESH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_assessment_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.assessment_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.refresh_assessment_leaderboard IS
  'Refresh leaderboard materialized view with CONCURRENTLY to avoid locking. Call after assessment completions.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_assessment_leaderboard() TO authenticated;

-- ============================================================================
-- 6. ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for common query pattern: user + status + completion
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_user_status_completed
  ON public.cs_assessment_sessions(user_id, status, completed_at DESC);

-- GIN index for badges array filtering (e.g., "find users with AI Prodigy badge")
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_badges
  ON public.cs_assessment_sessions USING GIN(badges);

-- Index for career level filtering
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_career_level
  ON public.cs_assessment_sessions(career_level)
  WHERE career_level IS NOT NULL;

-- JSONB index for category_scores queries
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_category_scores
  ON public.cs_assessment_sessions USING GIN(category_scores);

-- Index for profile slug lookups
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_profile_slug
  ON public.cs_assessment_sessions(profile_slug)
  WHERE profile_slug IS NOT NULL;

-- Index for published profiles
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_published
  ON public.cs_assessment_sessions(is_published, completed_at DESC)
  WHERE is_published = true;

-- ============================================================================
-- 7. HELPER FUNCTIONS FOR LEADERBOARD PERCENTILE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_lightning_percentile(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  user_rank INTEGER;
  total_users INTEGER;
BEGIN
  SELECT lightning_rank INTO user_rank
  FROM public.assessment_leaderboard
  WHERE user_id = p_user_id;

  IF user_rank IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO total_users
  FROM public.assessment_leaderboard
  WHERE lightning_round_score IS NOT NULL;

  IF total_users = 0 THEN
    RETURN NULL;
  END IF;

  -- Return percentile (100 = top 1%, 90 = top 10%, etc.)
  RETURN 100 - (user_rank::NUMERIC / total_users::NUMERIC * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_lightning_percentile IS
  'Calculate lightning round percentile for badge evaluation (100 = top, 0 = bottom)';

-- ============================================================================
-- 8. AUTO-REFRESH TRIGGER (Optional - for real-time leaderboard)
-- ============================================================================
-- Note: This will refresh the leaderboard after EVERY assessment completion.
-- For high traffic, consider scheduled refreshes instead (e.g., every 5 minutes via cron)

-- CREATE OR REPLACE FUNCTION trigger_refresh_leaderboard()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.status = 'completed' AND NEW.overall_score IS NOT NULL THEN
--     PERFORM public.refresh_assessment_leaderboard();
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_assessment_completed_refresh_leaderboard
--   AFTER UPDATE ON public.cs_assessment_sessions
--   FOR EACH ROW
--   WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
--   EXECUTE FUNCTION trigger_refresh_leaderboard();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run seed-lightning-questions.sql to populate 150+ questions
-- 2. Update API routes to use new fields
-- 3. Test public profile creation flow
-- 4. Verify leaderboard refresh performance
-- ============================================================================
