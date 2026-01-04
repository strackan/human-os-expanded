# Phase 1 Database Migration - Quick Start Guide

## TL;DR - Deploy in 5 Minutes

```bash
# 1. Apply migration
cd C:\Users\strac\dev\goodhang\goodhang-web
supabase db push

# 2. Seed badges (via SQL editor or psql)
# Copy contents of scripts/seed-badges.sql and execute

# 3. Seed lightning questions (via SQL editor or psql)
# Copy contents of scripts/seed-lightning-questions.sql and execute

# 4. Verify deployment
# Run: SELECT COUNT(*) FROM assessment_badges; -- Should return 13
# Run: SELECT COUNT(*) FROM lightning_round_questions; -- Should return 150
```

## What Was Deployed

### New Database Objects
- **15 new columns** on `cs_assessment_sessions` table
- **3 new tables**: `assessment_badges`, `lightning_round_questions`, `public_profiles`
- **1 materialized view**: `assessment_leaderboard`
- **13+ indexes** for performance
- **7 RLS policies** for security
- **3 helper functions** for operations

### Seed Data
- **13 badges** across 5 categories (dimension, category, combo, experience, lightning)
- **150 lightning questions** across 4 types and 4 difficulties

## Files Created

### Migration & Seeds
1. `supabase/migrations/20251116000000_assessment_expansion_phase1.sql` (424 lines)
2. `scripts/seed-badges.sql` (235 lines)
3. `scripts/seed-lightning-questions.sql` (234 lines) *(pre-existing, verified)*

### Documentation
4. `docs/database/PHASE1_PERFORMANCE_ANALYSIS.md` (584 lines)
5. `docs/database/PHASE1_VERIFICATION_GUIDE.md` (758 lines)
6. `docs/database/PHASE1_DELIVERABLES_REPORT.md` (728 lines)
7. `docs/database/QUICK_START.md` *(this file)*

## Quick Verification

```sql
-- Check columns added
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'cs_assessment_sessions'
  AND column_name IN (
    'personality_type', 'badges', 'category_scores',
    'lightning_round_score', 'profile_slug'
  );
-- Expected: 5 (sample check)

-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('assessment_badges', 'lightning_round_questions', 'public_profiles');
-- Expected: 3 rows

-- Check badges seeded
SELECT COUNT(*) FROM assessment_badges;
-- Expected: 13

-- Check questions seeded
SELECT COUNT(*) FROM lightning_round_questions;
-- Expected: 150
```

## Schema Summary

### cs_assessment_sessions (15 new columns)
```
personality_type          TEXT
personality_profile       JSONB
public_summary            TEXT
detailed_summary          TEXT
career_level             TEXT
years_experience         INTEGER
badges                   TEXT[]
profile_slug             TEXT UNIQUE
is_published             BOOLEAN
lightning_round_score    INTEGER
lightning_round_difficulty TEXT
lightning_round_completed_at TIMESTAMPTZ
absurdist_questions_answered INTEGER
category_scores          JSONB
ai_orchestration_scores  JSONB
```

### assessment_badges (13 badges)
```
🤖 ai-prodigy           📋 organization-master    ⚙️ technical-maestro
🫶 perfect-empathy      ❤️ people-champion        🎨 creative-genius
⭐ triple-threat        🏗️ systems-architect      🧠 strategic-mind
💡 technical-empath     🌟 rising-star            🏆 veteran-pro
⚡ lightning-champion
```

### lightning_round_questions (150 questions)
```
- General Knowledge: 40 (10 easy, 10 int, 10 adv, 10 insane)
- Brain Teasers: 40 (10 easy, 10 int, 10 adv, 10 insane)
- Math: 40 (10 easy, 10 int, 10 adv, 10 insane)
- Nursery Rhyme: 30 (10 easy, 10 int, 10 adv)
```

### public_profiles (opt-in job board)
```
- User-controlled visibility (RLS: anyone can view, only owner can edit)
- Optional email display
- Badge showcase
- Score visibility toggle
```

### assessment_leaderboard (materialized view)
```
- Overall ranking
- Category rankings (technical, emotional, creative)
- Lightning round ranking
- Refresh function: refresh_assessment_leaderboard()
```

## Performance Highlights

- **Storage**: ~57 MB per 10K assessments
- **Query Speed**: <10ms for most queries
- **Leaderboard**: <5ms via materialized view
- **Scalability**: Supports 1M+ assessments

## API Integration Points

### Assessment Completion
```typescript
// POST /api/assessment/[sessionId]/complete
// New fields to populate:
{
  personality_type: "ENFP",
  personality_profile: {...},
  category_scores: {...},
  ai_orchestration_scores: {...},
  badges: ["ai-prodigy", "triple-threat"],
  public_summary: "...",
  detailed_summary: "..."
}

// Then refresh leaderboard:
await supabase.rpc('refresh_assessment_leaderboard');
```

### Lightning Round
```typescript
// GET /api/lightning-round/questions
const { data } = await supabase
  .from('lightning_round_questions')
  .select('*')
  .eq('difficulty', 'intermediate')
  .order('random()') // PostgreSQL random
  .limit(10);
```

### Job Board
```typescript
// GET /api/profiles/public
const { data } = await supabase
  .from('public_profiles')
  .select('*')
  .eq('career_level', 'senior_manager')
  .contains('badges', ['ai-prodigy'])
  .order('published_at', { ascending: false })
  .limit(20);
```

### Leaderboard
```typescript
// GET /api/leaderboard
const { data } = await supabase
  .from('assessment_leaderboard')
  .select('*')
  .lte('overall_rank', 100)
  .order('overall_rank');
```

## Next Steps

1. **Deploy migration** (see TL;DR above)
2. **Verify schema** (run quick verification queries)
3. **Update API routes** to use new fields
4. **Build frontend components** for Lightning Round, Badges, Public Profiles
5. **Set up scheduled refresh** for leaderboard (optional: pg_cron every 10 min)

## Documentation Links

- **Full Migration**: `supabase/migrations/20251116000000_assessment_expansion_phase1.sql`
- **Performance Analysis**: `docs/database/PHASE1_PERFORMANCE_ANALYSIS.md`
- **Verification Guide**: `docs/database/PHASE1_VERIFICATION_GUIDE.md`
- **Complete Report**: `docs/database/PHASE1_DELIVERABLES_REPORT.md`

## Support

For issues or questions:
1. Check `PHASE1_VERIFICATION_GUIDE.md` for troubleshooting
2. Review `PHASE1_PERFORMANCE_ANALYSIS.md` for optimization
3. Read migration file comments for schema details

---

**Status**: ✅ Ready for deployment
**Date**: 2025-11-16
**Agent**: Database Architect (Agent 1)
