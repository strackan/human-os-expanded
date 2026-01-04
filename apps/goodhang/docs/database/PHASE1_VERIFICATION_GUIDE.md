# Phase 1 Database Migration - Verification Guide
## Testing and Validation Steps

**Migration File**: `supabase/migrations/20251116000000_assessment_expansion_phase1.sql`
**Seed Scripts**: `scripts/seed-badges.sql`, `scripts/seed-lightning-questions.sql`
**Date**: 2025-11-16

---

## Pre-Migration Checklist

Before applying the migration, ensure:

- [ ] Database backup created
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Database connection confirmed (`supabase db push --dry-run`)
- [ ] No active user sessions (recommended for safe migration)

---

## Migration Application Steps

### Step 1: Dry Run (Test SQL Validity)

```bash
# Validate SQL syntax without applying
cd C:\Users\strac\dev\goodhang\goodhang-web
supabase db push --dry-run
```

**Expected Output**: No syntax errors, migration plan displayed

### Step 2: Apply Migration

```bash
# Apply migration to database
supabase db push
```

**Expected Output**:
```
Applying migration 20251116000000_assessment_expansion_phase1.sql...
✓ Migration applied successfully
```

### Step 3: Verify Migration Applied

```sql
-- Check migration history
SELECT * FROM supabase_migrations.schema_migrations
WHERE version = '20251116000000'
ORDER BY version DESC;
```

**Expected Result**: 1 row with `version = '20251116000000'` and `inserted_at` timestamp

---

## Schema Verification

### Test 1: Verify New Columns on cs_assessment_sessions

```sql
-- Check all new columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cs_assessment_sessions'
  AND column_name IN (
    'personality_type',
    'personality_profile',
    'public_summary',
    'detailed_summary',
    'career_level',
    'years_experience',
    'badges',
    'profile_slug',
    'is_published',
    'lightning_round_score',
    'lightning_round_difficulty',
    'lightning_round_completed_at',
    'absurdist_questions_answered',
    'category_scores',
    'ai_orchestration_scores'
  )
ORDER BY column_name;
```

**Expected Result**: 15 rows (one for each new column)

**Validation**:
- [ ] `personality_type` - TEXT
- [ ] `personality_profile` - JSONB
- [ ] `public_summary` - TEXT
- [ ] `detailed_summary` - TEXT
- [ ] `career_level` - TEXT with CHECK constraint
- [ ] `years_experience` - INTEGER
- [ ] `badges` - TEXT[] with default '{}'
- [ ] `profile_slug` - TEXT with UNIQUE constraint
- [ ] `is_published` - BOOLEAN with default false
- [ ] `lightning_round_score` - INTEGER
- [ ] `lightning_round_difficulty` - TEXT with CHECK constraint
- [ ] `lightning_round_completed_at` - TIMESTAMPTZ
- [ ] `absurdist_questions_answered` - INTEGER with default 0
- [ ] `category_scores` - JSONB
- [ ] `ai_orchestration_scores` - JSONB

### Test 2: Verify New Tables Created

```sql
-- Check all new tables exist
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'assessment_badges',
    'lightning_round_questions',
    'public_profiles'
  )
ORDER BY table_name;
```

**Expected Result**: 3 rows

**Validation**:
- [ ] `assessment_badges` - BASE TABLE
- [ ] `lightning_round_questions` - BASE TABLE
- [ ] `public_profiles` - BASE TABLE

### Test 3: Verify Materialized View Created

```sql
-- Check materialized view exists
SELECT
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE matviewname = 'assessment_leaderboard';
```

**Expected Result**: 1 row with `matviewname = 'assessment_leaderboard'`

### Test 4: Verify Indexes Created

```sql
-- Check all indexes created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename IN ('cs_assessment_sessions', 'lightning_round_questions', 'public_profiles', 'assessment_leaderboard')
  )
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected Result**: 13+ indexes

**Validation Checklist**:
- [ ] `idx_cs_assessment_sessions_user_status_completed` - Composite index
- [ ] `idx_cs_assessment_sessions_badges` - GIN index
- [ ] `idx_cs_assessment_sessions_career_level` - Partial index
- [ ] `idx_cs_assessment_sessions_category_scores` - GIN index
- [ ] `idx_cs_assessment_sessions_profile_slug` - Partial index
- [ ] `idx_cs_assessment_sessions_published` - Partial index
- [ ] `idx_lightning_questions_difficulty` - B-tree index
- [ ] `idx_lightning_questions_type` - B-tree index
- [ ] `idx_lightning_questions_difficulty_type` - Composite index
- [ ] `idx_public_profiles_slug` - B-tree index
- [ ] `idx_public_profiles_career_level` - B-tree index
- [ ] `idx_public_profiles_badges` - GIN index
- [ ] `idx_public_profiles_published_at` - B-tree index (DESC)
- [ ] `idx_public_profiles_archetype` - B-tree index
- [ ] `idx_leaderboard_user` - UNIQUE index
- [ ] `idx_leaderboard_overall_rank` - B-tree index
- [ ] `idx_leaderboard_technical_rank` - B-tree index
- [ ] `idx_leaderboard_emotional_rank` - B-tree index
- [ ] `idx_leaderboard_creative_rank` - B-tree index
- [ ] `idx_leaderboard_lightning_rank` - B-tree index

### Test 5: Verify RLS Policies Created

```sql
-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('assessment_badges', 'lightning_round_questions', 'public_profiles')
ORDER BY tablename, policyname;
```

**Expected Result**: 7 policies

**Validation**:
- [ ] `assessment_badges` - 1 policy (read-only for authenticated)
- [ ] `lightning_round_questions` - 1 policy (read for authenticated)
- [ ] `public_profiles` - 4 policies (SELECT for all, INSERT/UPDATE/DELETE for owner)

### Test 6: Verify Functions Created

```sql
-- Check functions created
SELECT
  proname AS function_name,
  pg_get_function_result(oid) AS return_type,
  prosrc AS source_code
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'refresh_assessment_leaderboard',
    'get_lightning_percentile',
    'update_public_profiles_updated_at'
  )
ORDER BY proname;
```

**Expected Result**: 3 functions

**Validation**:
- [ ] `refresh_assessment_leaderboard()` - Returns void
- [ ] `get_lightning_percentile(UUID)` - Returns numeric
- [ ] `update_public_profiles_updated_at()` - Returns trigger

---

## Seed Data Verification

### Step 4: Seed Badge Definitions

```bash
# Run badge seed script
psql <your-connection-string> < scripts/seed-badges.sql

# OR via Supabase SQL Editor:
# Copy contents of scripts/seed-badges.sql and execute
```

**Verification Query**:
```sql
-- Check all 13 badges seeded
SELECT
  id,
  name,
  icon,
  category,
  criteria
FROM public.assessment_badges
ORDER BY category, id;
```

**Expected Result**: 13 badges

**Badge Count by Category**:
```sql
SELECT
  category,
  COUNT(*) as badge_count
FROM public.assessment_badges
GROUP BY category
ORDER BY category;
```

**Expected Output**:
| category | badge_count |
|----------|-------------|
| category | 3 |
| combo | 4 |
| dimension | 3 |
| experience | 2 |
| lightning | 1 |

**Validation Checklist**:
- [ ] `ai-prodigy` - Dimension badge
- [ ] `perfect-empathy` - Dimension badge
- [ ] `organization-master` - Dimension badge
- [ ] `technical-maestro` - Category badge
- [ ] `people-champion` - Category badge
- [ ] `creative-genius` - Category badge
- [ ] `triple-threat` - Combo badge
- [ ] `systems-architect` - Combo badge
- [ ] `strategic-mind` - Combo badge
- [ ] `technical-empath` - Combo badge
- [ ] `rising-star` - Experience badge
- [ ] `veteran-pro` - Experience badge
- [ ] `lightning-champion` - Lightning badge

### Step 5: Seed Lightning Round Questions

```bash
# Run lightning questions seed script
psql <your-connection-string> < scripts/seed-lightning-questions.sql

# OR via Supabase SQL Editor:
# Copy contents of scripts/seed-lightning-questions.sql and execute
```

**Verification Query**:
```sql
-- Check total question count
SELECT COUNT(*) as total_questions
FROM public.lightning_round_questions;
```

**Expected Result**: 150 questions

**Question Count by Type and Difficulty**:
```sql
SELECT
  question_type,
  difficulty,
  COUNT(*) as question_count
FROM public.lightning_round_questions
GROUP BY question_type, difficulty
ORDER BY question_type, difficulty;
```

**Expected Distribution**:
| question_type | difficulty | question_count |
|---------------|------------|----------------|
| brain_teaser | easy | 10 |
| brain_teaser | intermediate | 10 |
| brain_teaser | advanced | 10 |
| brain_teaser | insane | 10 |
| general_knowledge | easy | 10 |
| general_knowledge | intermediate | 10 |
| general_knowledge | advanced | 10 |
| general_knowledge | insane | 10 |
| math | easy | 10 |
| math | intermediate | 10 |
| math | advanced | 10 |
| math | insane | 10 |
| nursery_rhyme | easy | 10 |
| nursery_rhyme | intermediate | 10 |
| nursery_rhyme | advanced | 10 |

**Sample Question Verification**:
```sql
-- Verify a few questions have correct structure
SELECT
  id,
  question,
  correct_answer,
  explanation,
  question_type,
  difficulty
FROM public.lightning_round_questions
WHERE id IN ('gk_easy_1', 'bt_int_5', 'math_adv_3', 'nr_ins_1')
ORDER BY id;
```

**Expected Result**: 4 rows with complete data (no nulls except explanation)

---

## Functional Testing

### Test 7: Insert Test Assessment Session

```sql
-- Insert a test session with new fields
INSERT INTO public.cs_assessment_sessions (
  user_id,
  personality_type,
  personality_profile,
  career_level,
  years_experience,
  badges,
  profile_slug,
  lightning_round_score,
  lightning_round_difficulty,
  category_scores,
  ai_orchestration_scores,
  status
) VALUES (
  auth.uid(), -- Replace with actual user ID for testing
  'ENFP',
  '{"mbti": "ENFP", "enneagram": "Type 7", "traits": ["creative", "empathetic"]}'::jsonb,
  'senior_manager',
  8,
  ARRAY['ai-prodigy', 'triple-threat'],
  'test-user-2024',
  85,
  'intermediate',
  '{"technical": {"overall": 88}, "emotional": {"overall": 92}, "creative": {"overall": 86}}'::jsonb,
  '{"technical_foundation": 85, "practical_use": 90, "conceptual_understanding": 88, "systems_thinking": 92, "judgment": 87}'::jsonb,
  'in_progress'
) RETURNING id;
```

**Expected Result**: 1 row inserted, returns session ID

**Validation**:
- [ ] Insert succeeds without errors
- [ ] Default values applied correctly (`badges = '{}'`, `is_published = false`, `absurdist_questions_answered = 0`)
- [ ] JSONB fields parse correctly
- [ ] CHECK constraints validated (career_level, lightning_round_difficulty)
- [ ] UNIQUE constraint on profile_slug enforced

### Test 8: Test Public Profile Creation

```sql
-- Create a test public profile
INSERT INTO public.public_profiles (
  user_id,
  profile_slug,
  name,
  career_level,
  years_experience,
  archetype,
  badges,
  best_fit_roles,
  public_summary,
  show_scores,
  overall_score,
  category_scores
) VALUES (
  auth.uid(), -- Replace with actual user ID
  'test-profile-2024',
  'Test User',
  'senior_manager',
  8,
  'AI Orchestrator',
  ARRAY['ai-prodigy', 'triple-threat'],
  ARRAY['AI Product Manager', 'ML Engineer'],
  'Exceptional AI readiness with strong emotional intelligence and creative thinking.',
  true,
  88,
  '{"technical": {"overall": 88}, "emotional": {"overall": 92}, "creative": {"overall": 86}}'::jsonb
) RETURNING user_id, profile_slug;
```

**Expected Result**: 1 row inserted, returns user_id and profile_slug

**Validation**:
- [ ] Insert succeeds
- [ ] `published_at` timestamp auto-populated
- [ ] `updated_at` timestamp auto-populated
- [ ] RLS policy allows user to create own profile
- [ ] UNIQUE constraint on profile_slug enforced

### Test 9: Test Leaderboard View

```sql
-- Refresh materialized view
SELECT public.refresh_assessment_leaderboard();

-- Query leaderboard
SELECT
  user_id,
  overall_score,
  overall_rank,
  technical_rank,
  emotional_rank,
  creative_rank,
  lightning_rank,
  badges
FROM public.assessment_leaderboard
ORDER BY overall_rank ASC
LIMIT 10;
```

**Expected Result**: Top 10 users by overall score (if data exists)

**Validation**:
- [ ] Refresh function executes without errors
- [ ] View contains data (if completed assessments exist)
- [ ] Rankings are sequential (1, 2, 3, ...)
- [ ] Category rankings calculated correctly from JSONB

### Test 10: Test Badge Filtering (GIN Index)

```sql
-- Find users with specific badge
SELECT
  user_id,
  badges,
  overall_score,
  completed_at
FROM public.cs_assessment_sessions
WHERE 'ai-prodigy' = ANY(badges)
  AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;
```

**Expected Result**: Users with 'ai-prodigy' badge (if data exists)

**Query Plan Verification**:
```sql
EXPLAIN ANALYZE
SELECT * FROM cs_assessment_sessions
WHERE 'ai-prodigy' = ANY(badges);
```

**Expected Plan**: Should use `idx_cs_assessment_sessions_badges` (GIN index scan)

### Test 11: Test Lightning Question Fetch

```sql
-- Fetch random questions for intermediate difficulty, brain teasers
SELECT
  id,
  question,
  question_type,
  difficulty
FROM public.lightning_round_questions
WHERE difficulty = 'intermediate'
  AND question_type = 'brain_teaser'
ORDER BY RANDOM()
LIMIT 10;
```

**Expected Result**: 10 random brain teaser questions

**Query Plan Verification**:
```sql
EXPLAIN ANALYZE
SELECT * FROM lightning_round_questions
WHERE difficulty = 'intermediate' AND question_type = 'brain_teaser';
```

**Expected Plan**: Should use `idx_lightning_questions_difficulty_type` (composite index)

### Test 12: Test RLS Policies

#### Test: Anonymous User Can View Public Profiles
```sql
-- Run as anonymous (no auth.uid())
SET ROLE anon;

SELECT
  profile_slug,
  name,
  archetype,
  public_summary
FROM public.public_profiles
LIMIT 5;

-- Reset role
RESET ROLE;
```

**Expected Result**: Can view public profiles (RLS allows SELECT for all)

#### Test: User Cannot View Other's Assessment Sessions
```sql
-- Run as authenticated user A
SET ROLE authenticated;
SET request.jwt.claims.sub = '<user_a_uuid>';

-- Try to view user B's session (should fail or return no rows)
SELECT * FROM cs_assessment_sessions
WHERE user_id = '<user_b_uuid>';

RESET ROLE;
```

**Expected Result**: No rows returned (RLS blocks access)

### Test 13: Test Percentile Function

```sql
-- Test get_lightning_percentile function
SELECT public.get_lightning_percentile('<user_id_uuid>') as percentile;
```

**Expected Result**: Numeric value (0-100) or NULL if user not in leaderboard

---

## Performance Testing

### Test 14: Index Usage Verification

```sql
-- Run queries and check if indexes are used
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM cs_assessment_sessions
WHERE user_id = '<uuid>'
  AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;
```

**Expected Plan**: Should use `idx_cs_assessment_sessions_user_status_completed`

### Test 15: Leaderboard Refresh Performance

```sql
-- Time the refresh
\timing on
SELECT public.refresh_assessment_leaderboard();
\timing off
```

**Expected Time**:
- < 1 second for <10K assessments
- < 5 seconds for <100K assessments

### Test 16: Query Response Times

```sql
-- Enable timing
\timing on

-- Test 1: User dashboard query
SELECT * FROM cs_assessment_sessions
WHERE user_id = auth.uid()
  AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;

-- Test 2: Job board query
SELECT * FROM public_profiles
WHERE career_level = 'senior_manager'
  AND 'ai-prodigy' = ANY(badges)
ORDER BY published_at DESC
LIMIT 20;

-- Test 3: Leaderboard query
SELECT * FROM assessment_leaderboard
WHERE overall_rank <= 100
ORDER BY overall_rank ASC;

\timing off
```

**Expected Times**: All queries < 50ms

---

## Rollback Testing (Optional)

If you need to rollback the migration:

```sql
-- CAUTION: This will DROP all new tables and columns
-- Only run if you need to undo the migration

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS public.assessment_leaderboard CASCADE;

-- Drop new tables
DROP TABLE IF EXISTS public.public_profiles CASCADE;
DROP TABLE IF EXISTS public.lightning_round_questions CASCADE;
DROP TABLE IF EXISTS public.assessment_badges CASCADE;

-- Drop new columns
ALTER TABLE public.cs_assessment_sessions
DROP COLUMN IF EXISTS personality_type,
DROP COLUMN IF EXISTS personality_profile,
DROP COLUMN IF EXISTS public_summary,
DROP COLUMN IF EXISTS detailed_summary,
DROP COLUMN IF EXISTS career_level,
DROP COLUMN IF EXISTS years_experience,
DROP COLUMN IF EXISTS badges,
DROP COLUMN IF EXISTS profile_slug,
DROP COLUMN IF EXISTS is_published,
DROP COLUMN IF EXISTS lightning_round_score,
DROP COLUMN IF EXISTS lightning_round_difficulty,
DROP COLUMN IF EXISTS lightning_round_completed_at,
DROP COLUMN IF EXISTS absurdist_questions_answered,
DROP COLUMN IF EXISTS category_scores,
DROP COLUMN IF EXISTS ai_orchestration_scores;

-- Drop functions
DROP FUNCTION IF EXISTS public.refresh_assessment_leaderboard();
DROP FUNCTION IF EXISTS public.get_lightning_percentile(UUID);
DROP FUNCTION IF EXISTS update_public_profiles_updated_at();
```

---

## Final Validation Checklist

### Database Schema ✅
- [ ] 15 new columns added to `cs_assessment_sessions`
- [ ] 3 new tables created (`assessment_badges`, `lightning_round_questions`, `public_profiles`)
- [ ] 1 materialized view created (`assessment_leaderboard`)
- [ ] 13+ indexes created and verified
- [ ] All RLS policies active and tested
- [ ] 3 helper functions created

### Seed Data ✅
- [ ] 13 badges seeded successfully
- [ ] 150 lightning questions seeded successfully
- [ ] Sample data distribution verified (4 types × 4 difficulties)

### Performance ✅
- [ ] Index usage confirmed via EXPLAIN ANALYZE
- [ ] Query response times < 50ms
- [ ] Leaderboard refresh time < 5 seconds
- [ ] GIN indexes working for array/JSONB queries

### Security ✅
- [ ] RLS policies prevent unauthorized access
- [ ] Anonymous users can view public profiles
- [ ] Users can only modify own data
- [ ] Badge definitions are read-only for users

### Integration ✅
- [ ] API routes can insert new assessment data
- [ ] Frontend can query leaderboard view
- [ ] Lightning question fetching works
- [ ] Public profile publishing flow works

---

## Next Steps After Verification

1. **Update API Routes**: Modify assessment completion API to populate new fields
2. **Frontend Integration**: Build UI components for Lightning Round and Public Profiles
3. **Monitoring Setup**: Configure alerts for leaderboard refresh failures
4. **Scheduled Refresh**: Set up pg_cron job for leaderboard refresh (every 5-10 minutes)
5. **Analytics**: Track badge earning rates and lightning round scores
6. **Load Testing**: Test with 10K+ concurrent users (if production scale)

---

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Check if a previous migration already added these columns. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

### Issue: RLS policies block all access
**Solution**: Verify `auth.uid()` is returning correct user ID. Check RLS policies with `SELECT * FROM pg_policies`.

### Issue: Leaderboard view is empty
**Solution**: Ensure there are completed assessments with `overall_score IS NOT NULL`. Run `REFRESH MATERIALIZED VIEW`.

### Issue: Index not being used
**Solution**: Run `ANALYZE cs_assessment_sessions` to update table statistics. Check query plan with `EXPLAIN`.

### Issue: Seed scripts fail with "duplicate key"
**Solution**: Use `ON CONFLICT (id) DO NOTHING` or `TRUNCATE` table before re-seeding.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Prepared By**: Database Architect (Agent 1)
