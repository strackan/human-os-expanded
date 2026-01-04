-- ============================================================================
-- Assessment Expansion Phase 1: Foundation Migration
-- ============================================================================
-- This migration establishes the complete Phase 2 assessment infrastructure:
-- 1. Extends cs_assessment_sessions with 15 new columns for enhanced assessment
-- 2. Creates assessment_badges table with badge definitions
-- 3. Creates lightning_round_questions table for rapid-fire challenge
-- 4. Creates public_profiles table for opt-in job board
-- 5. Creates assessment_leaderboard materialized view with rankings
-- 6. Adds 7+ performance-optimized indexes
-- 7. Implements RLS policies for data security
-- ============================================================================

-- ============================================================================
-- 1. EXTEND cs_assessment_sessions TABLE
-- ============================================================================

-- Add personality and profile fields
ALTER TABLE public.cs_assessment_sessions
ADD COLUMN IF NOT EXISTS personality_type TEXT,
ADD COLUMN IF NOT EXISTS personality_profile JSONB,
ADD COLUMN IF NOT EXISTS public_summary TEXT,
ADD COLUMN IF NOT EXISTS detailed_summary TEXT;

-- Add career and experience fields
ALTER TABLE public.cs_assessment_sessions
ADD COLUMN IF NOT EXISTS career_level TEXT CHECK (career_level IN ('entry', 'mid', 'senior_manager', 'director', 'executive', 'c_level')),
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Add badge and publishing fields
ALTER TABLE public.cs_assessment_sessions
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Add lightning round fields
ALTER TABLE public.cs_assessment_sessions
ADD COLUMN IF NOT EXISTS lightning_round_score INTEGER,
ADD COLUMN IF NOT EXISTS lightning_round_difficulty TEXT CHECK (lightning_round_difficulty IN ('beginner', 'intermediate', 'advanced', 'insane')),
ADD COLUMN IF NOT EXISTS lightning_round_completed_at TIMESTAMPTZ;

-- Add absurdist finale and category scoring fields
ALTER TABLE public.cs_assessment_sessions
ADD COLUMN IF NOT EXISTS absurdist_questions_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_scores JSONB,
ADD COLUMN IF NOT EXISTS ai_orchestration_scores JSONB;

-- Update column comments for documentation
COMMENT ON COLUMN public.cs_assessment_sessions.personality_type IS
  'MBTI personality type (e.g., "ENFP", "INTJ") determined from assessment responses';

COMMENT ON COLUMN public.cs_assessment_sessions.personality_profile IS
  'Complete personality analysis: {mbti: "ENFP", enneagram: "Type 7", traits: [...], weight_modifiers: {...}}';

COMMENT ON COLUMN public.cs_assessment_sessions.public_summary IS
  'Shareable positive summary (3-5 sentences) for public profile and job board';

COMMENT ON COLUMN public.cs_assessment_sessions.detailed_summary IS
  'Internal section-by-section analysis with full scoring rationale';

COMMENT ON COLUMN public.cs_assessment_sessions.career_level IS
  'Career seniority level for experience-based badge evaluation and job matching';

COMMENT ON COLUMN public.cs_assessment_sessions.years_experience IS
  'Total years of professional experience for badge criteria and career trajectory analysis';

COMMENT ON COLUMN public.cs_assessment_sessions.badges IS
  'Array of badge IDs earned (e.g., ["ai-prodigy", "triple-threat", "technical-maestro"])';

COMMENT ON COLUMN public.cs_assessment_sessions.profile_slug IS
  'URL-safe unique slug for public profile (e.g., "john-smith-ai-prodigy-2024")';

COMMENT ON COLUMN public.cs_assessment_sessions.is_published IS
  'Whether user has opted to publish their profile to the public job board';

COMMENT ON COLUMN public.cs_assessment_sessions.lightning_round_score IS
  'Score from 2-minute lightning round challenge (0-100, based on accuracy and speed)';

COMMENT ON COLUMN public.cs_assessment_sessions.lightning_round_difficulty IS
  'Difficulty level selected for lightning round (affects question pool and scoring)';

COMMENT ON COLUMN public.cs_assessment_sessions.lightning_round_completed_at IS
  'Timestamp when lightning round was completed (used for time-based scoring)';

COMMENT ON COLUMN public.cs_assessment_sessions.absurdist_questions_answered IS
  'Count of absurdist finale questions answered (Phase 2 feature for creativity assessment)';

COMMENT ON COLUMN public.cs_assessment_sessions.category_scores IS
  'Three-category hybrid scores: {technical: {overall: 85, subscores: {...}}, emotional: {...}, creative: {...}}';

COMMENT ON COLUMN public.cs_assessment_sessions.ai_orchestration_scores IS
  'AI Orchestration sub-scores: {technical_foundation: 85, practical_use: 90, conceptual_understanding: 80, systems_thinking: 95, judgment: 88}';

-- Update dimensions comment to reflect 14 dimensions
COMMENT ON COLUMN public.cs_assessment_sessions.dimensions IS
  'JSONB object with 14 scoring dimensions (0-100 each): iq, eq, empathy, self_awareness, technical, ai_readiness, gtm, personality, motivation, work_history, passions, culture_fit, organization, executive_leadership';

-- ============================================================================
-- 2. CREATE assessment_badges TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assessment_badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  criteria JSONB NOT NULL, -- Badge earning criteria (flexible structure)
  category TEXT NOT NULL CHECK (category IN ('dimension', 'category', 'combo', 'experience', 'lightning')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.assessment_badges IS
  'Badge definitions with earning criteria. Badges are automatically awarded based on assessment performance across dimensions, categories, experience, and special challenges.';

COMMENT ON COLUMN public.assessment_badges.criteria IS
  'JSONB criteria for badge evaluation. Examples: {"dimension": "ai_readiness", "min_score": 90}, {"all_categories": 85}, {"dimensions": ["technical", "empathy"], "min_score": 85}';

-- Index for badge queries by category
CREATE INDEX IF NOT EXISTS idx_assessment_badges_category
  ON public.assessment_badges(category);

-- ============================================================================
-- 3. CREATE lightning_round_questions TABLE
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
  'Question bank for 2-minute lightning round challenge. 150+ questions across 4 types and 4 difficulty levels for rapid-fire assessment of quick thinking and general knowledge.';

-- Performance indexes for efficient random question selection
CREATE INDEX IF NOT EXISTS idx_lightning_questions_difficulty
  ON public.lightning_round_questions(difficulty);

CREATE INDEX IF NOT EXISTS idx_lightning_questions_type
  ON public.lightning_round_questions(question_type);

-- Composite index for difficulty + type filtering (common query pattern)
CREATE INDEX IF NOT EXISTS idx_lightning_questions_difficulty_type
  ON public.lightning_round_questions(difficulty, question_type);

-- ============================================================================
-- 4. CREATE public_profiles TABLE (Opt-in Job Board)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.public_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.cs_assessment_sessions(id) ON DELETE SET NULL,
  profile_slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT, -- Optional - user choice to display contact info
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
  'Published profiles visible on public job board. Opt-in only - users control what information to share. Used for talent discovery and job matching.';

-- Performance indexes for job board searches and filtering
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

-- ============================================================================
-- 5. CREATE assessment_leaderboard MATERIALIZED VIEW
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
  -- Overall ranking
  ROW_NUMBER() OVER (ORDER BY overall_score DESC NULLS LAST) as overall_rank,
  -- Category-specific rankings
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'technical')::numeric DESC NULLS LAST) as technical_rank,
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'emotional')::numeric DESC NULLS LAST) as emotional_rank,
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'creative')::numeric DESC NULLS LAST) as creative_rank,
  -- Lightning round ranking
  ROW_NUMBER() OVER (ORDER BY COALESCE(lightning_round_score, 0) DESC) as lightning_rank
FROM public.cs_assessment_sessions
WHERE status = 'completed'
  AND completed_at IS NOT NULL
  AND overall_score IS NOT NULL;

COMMENT ON MATERIALIZED VIEW public.assessment_leaderboard IS
  'Cached leaderboard rankings across all scoring dimensions. Provides fast read access for competitive features. Refreshed via concurrent refresh function after assessment completions.';

-- Unique index required for CONCURRENTLY refresh (prevents locking)
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

-- ============================================================================
-- 6. LEADERBOARD REFRESH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_assessment_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.assessment_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.refresh_assessment_leaderboard IS
  'Refresh leaderboard materialized view with CONCURRENTLY to avoid locking. Call after assessment completions or on a scheduled basis (e.g., every 5 minutes via cron).';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_assessment_leaderboard() TO authenticated;

-- ============================================================================
-- 7. ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for common query pattern: user + status + completion
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_user_status_completed
  ON public.cs_assessment_sessions(user_id, status, completed_at DESC);

-- GIN index for badges array filtering (e.g., "find all users with AI Prodigy badge")
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_badges
  ON public.cs_assessment_sessions USING GIN(badges);

-- Index for career level filtering (partial index for performance)
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_career_level
  ON public.cs_assessment_sessions(career_level)
  WHERE career_level IS NOT NULL;

-- JSONB index for category_scores queries (GIN index for JSON operations)
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_category_scores
  ON public.cs_assessment_sessions USING GIN(category_scores);

-- Index for profile slug lookups (partial index for published profiles)
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_profile_slug
  ON public.cs_assessment_sessions(profile_slug)
  WHERE profile_slug IS NOT NULL;

-- Index for published profiles (common filter for job board queries)
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_published
  ON public.cs_assessment_sessions(is_published, completed_at DESC)
  WHERE is_published = true;

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.assessment_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lightning_round_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- assessment_badges policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view badge definitions"
  ON public.assessment_badges
  FOR SELECT
  TO authenticated
  USING (true);

-- lightning_round_questions policies (read access for authenticated users to fetch questions)
CREATE POLICY "Lightning round questions are viewable by authenticated users"
  ON public.lightning_round_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- public_profiles policies
-- Anyone (including anonymous) can view published profiles (public job board)
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

-- Users can delete their own profile (unpublish)
CREATE POLICY "Users can delete own public profile"
  ON public.public_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate lightning round percentile for badge evaluation
CREATE OR REPLACE FUNCTION public.get_lightning_percentile(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  user_rank INTEGER;
  total_users INTEGER;
BEGIN
  -- Get user's lightning rank from leaderboard
  SELECT lightning_rank INTO user_rank
  FROM public.assessment_leaderboard
  WHERE user_id = p_user_id;

  IF user_rank IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get total count of users with lightning scores
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
  'Calculate lightning round percentile for badge evaluation. Returns 100 for top performer, 0 for bottom. Used by "Lightning Champion" badge criteria.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_lightning_percentile(UUID) TO authenticated;

-- ============================================================================
-- 10. INITIAL DATA POPULATION
-- ============================================================================

-- Note: Badge definitions and lightning questions are seeded via separate scripts:
-- - scripts/seed-badges.sql (13 badge definitions)
-- - scripts/seed-lightning-questions.sql (150+ questions)
--
-- Run these scripts after migration:
--   psql <connection-string> < scripts/seed-badges.sql
--   psql <connection-string> < scripts/seed-lightning-questions.sql

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of Changes:
-- - Added 15 new columns to cs_assessment_sessions
-- - Created 3 new tables (assessment_badges, lightning_round_questions, public_profiles)
-- - Created 1 materialized view (assessment_leaderboard)
-- - Added 13+ performance indexes (including GIN, composite, partial)
-- - Implemented RLS policies for data security
-- - Created 2 helper functions (refresh_leaderboard, get_lightning_percentile)
--
-- Next Steps:
-- 1. Run seed scripts for badges and lightning questions
-- 2. Update API routes to use new schema fields
-- 3. Implement frontend components for Lightning Round and Public Profiles
-- 4. Set up scheduled refresh for leaderboard (optional: pg_cron every 5 minutes)
-- ============================================================================
