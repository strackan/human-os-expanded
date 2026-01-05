-- ============================================================================
-- ROLLBACK SCRIPT for Assessment Expansion Phase 2
-- ============================================================================
-- Run this script ONLY if you need to completely rollback the Phase 2 migration
-- WARNING: This will delete data in public_profiles and lightning_round_questions
-- ============================================================================

-- ============================================================================
-- 1. DROP NEW INDEXES
-- ============================================================================

-- cs_assessment_sessions new indexes
DROP INDEX IF EXISTS public.idx_cs_assessment_sessions_user_status_completed;
DROP INDEX IF EXISTS public.idx_cs_assessment_sessions_badges;
DROP INDEX IF EXISTS public.idx_cs_assessment_sessions_career_level;
DROP INDEX IF EXISTS public.idx_cs_assessment_sessions_category_scores;
DROP INDEX IF EXISTS public.idx_cs_assessment_sessions_profile_slug;
DROP INDEX IF EXISTS public.idx_cs_assessment_sessions_published;

-- public_profiles indexes
DROP INDEX IF EXISTS public.idx_public_profiles_slug;
DROP INDEX IF EXISTS public.idx_public_profiles_career_level;
DROP INDEX IF EXISTS public.idx_public_profiles_badges;
DROP INDEX IF EXISTS public.idx_public_profiles_published_at;
DROP INDEX IF EXISTS public.idx_public_profiles_archetype;

-- lightning_round_questions indexes
DROP INDEX IF EXISTS public.idx_lightning_questions_difficulty;
DROP INDEX IF EXISTS public.idx_lightning_questions_type;
DROP INDEX IF EXISTS public.idx_lightning_questions_difficulty_type;

-- leaderboard indexes
DROP INDEX IF EXISTS public.idx_leaderboard_user;
DROP INDEX IF EXISTS public.idx_leaderboard_overall_rank;
DROP INDEX IF EXISTS public.idx_leaderboard_technical_rank;
DROP INDEX IF EXISTS public.idx_leaderboard_emotional_rank;
DROP INDEX IF EXISTS public.idx_leaderboard_creative_rank;
DROP INDEX IF EXISTS public.idx_leaderboard_lightning_rank;

-- ============================================================================
-- 2. DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.refresh_assessment_leaderboard();
DROP FUNCTION IF EXISTS public.get_lightning_percentile(UUID);
DROP FUNCTION IF EXISTS public.update_public_profiles_updated_at();

-- ============================================================================
-- 3. DROP MATERIALIZED VIEW
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.assessment_leaderboard;

-- ============================================================================
-- 4. DROP TABLES
-- ============================================================================

DROP TABLE IF EXISTS public.public_profiles CASCADE;
DROP TABLE IF EXISTS public.lightning_round_questions CASCADE;

-- ============================================================================
-- 5. REMOVE NEW COLUMNS FROM cs_assessment_sessions
-- ============================================================================

-- WARNING: This will permanently delete data in these columns
-- Only uncomment if you want to fully revert the schema

-- ALTER TABLE public.cs_assessment_sessions
-- DROP COLUMN IF EXISTS career_level,
-- DROP COLUMN IF EXISTS years_experience,
-- DROP COLUMN IF EXISTS self_description,
-- DROP COLUMN IF EXISTS video_url,
-- DROP COLUMN IF EXISTS profile_slug,
-- DROP COLUMN IF EXISTS lightning_round_score,
-- DROP COLUMN IF EXISTS lightning_round_difficulty,
-- DROP COLUMN IF EXISTS lightning_round_completed_at,
-- DROP COLUMN IF EXISTS absurdist_questions_answered;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

-- To verify rollback success:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%lightning%';
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%public_profile%';
-- \d cs_assessment_sessions;
