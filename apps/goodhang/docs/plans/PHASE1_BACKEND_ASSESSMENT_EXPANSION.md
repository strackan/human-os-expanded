# Phase 1 Backend Implementation Plan
## CS Assessment Expansion - Foundation & Core Logic

**Agent**: Backend Agent
**Working Directory**: `C:\Users\strac\dev\goodhang\goodhang-backend-agent`
**Branch**: `backend-agent`
**Estimated Time**: 15-20 hours
**Dependencies**: None (foundational work)

---

## Overview

This phase establishes the database schema, types, core scoring logic, and essential APIs for the expanded assessment system. Focus is on:
1. Database schema for 14 dimensions, personality types, badges, AI orchestration scoring
2. TypeScript type safety across the entire assessment flow
3. Hard-grading scoring system with personality weighting
4. Badge evaluation and earning system
5. Core assessment APIs (start, answer, complete with new scoring)

**Phase 2** (frontend + advanced features) will build on this foundation.

---

## Task 1: Database Migration - Extended Schema (3-4 hours)

### 1.1 Create Migration File

**File**: `supabase/migrations/20251116000000_assessment_expansion_phase1.sql`

```sql
-- ============================================================================
-- Assessment Expansion Phase 1: Core Schema Updates
-- ============================================================================

-- Add new columns to cs_assessment_sessions
ALTER TABLE cs_assessment_sessions
ADD COLUMN personality_type TEXT,
ADD COLUMN personality_profile JSONB, -- {mbti: "ENFP", enneagram: "Type 7", traits: [...]}
ADD COLUMN public_summary TEXT,
ADD COLUMN detailed_summary TEXT,
ADD COLUMN career_level TEXT CHECK (career_level IN ('entry', 'mid', 'senior_manager', 'director', 'executive', 'c_level')),
ADD COLUMN years_experience INTEGER,
ADD COLUMN self_description TEXT,
ADD COLUMN video_url TEXT,
ADD COLUMN badges TEXT[] DEFAULT '{}',
ADD COLUMN profile_slug TEXT UNIQUE,
ADD COLUMN is_published BOOLEAN DEFAULT false,
ADD COLUMN lightning_round_score INTEGER,
ADD COLUMN lightning_round_difficulty TEXT CHECK (lightning_round_difficulty IN ('beginner', 'intermediate', 'advanced', 'insane')),
ADD COLUMN lightning_round_completed_at TIMESTAMPTZ,
ADD COLUMN absurdist_questions_answered INTEGER DEFAULT 0;

-- Update dimensions JSONB to support 14 dimensions
-- No schema change needed - JSONB is flexible
-- But add comment for documentation
COMMENT ON COLUMN cs_assessment_sessions.dimensions IS
  'JSONB object with 14 scoring dimensions (0-100 each): iq, eq, empathy, self_awareness, technical, ai_readiness, gtm, personality, motivation, work_history, passions, culture_fit, organization, executive_leadership';

-- Add category scores (calculated from dimensions)
ALTER TABLE cs_assessment_sessions
ADD COLUMN category_scores JSONB; -- {technical: {overall: 85, subscores: {...}}, emotional: {...}, creative: {...}}

COMMENT ON COLUMN cs_assessment_sessions.category_scores IS
  'Three-category hybrid scores: technical (technical+ai_readiness+organization+iq), emotional (eq+empathy+self_awareness+executive_leadership+gtm), creative (passions+culture_fit+personality+motivation)';

-- Add AI orchestration sub-scores
ALTER TABLE cs_assessment_sessions
ADD COLUMN ai_orchestration_scores JSONB; -- {technical_foundation: 85, practical_use: 90, conceptual: 80, systems_thinking: 95, judgment: 88}

COMMENT ON COLUMN cs_assessment_sessions.ai_orchestration_scores IS
  'AI Orchestration sub-scores (0-100): technical_foundation, practical_use, conceptual_understanding, systems_thinking, judgment';

-- ============================================================================
-- Assessment Badges Table
-- ============================================================================

CREATE TABLE assessment_badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon identifier
  criteria JSONB NOT NULL, -- Flexible criteria: {"dimension": "ai_readiness", "min_score": 90} or {"all_categories": 85}
  category TEXT NOT NULL CHECK (category IN ('dimension', 'category', 'combo', 'experience', 'lightning')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE assessment_badges IS
  'Badge definitions with earning criteria. Badges are awarded based on assessment performance.';

-- Index for badge queries
CREATE INDEX idx_assessment_badges_category ON assessment_badges(category);

-- ============================================================================
-- Lightning Round Questions Table
-- ============================================================================

CREATE TABLE lightning_round_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('general_knowledge', 'brain_teaser', 'math', 'nursery_rhyme')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'intermediate', 'advanced', 'insane')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE lightning_round_questions IS
  'Question bank for 2-minute lightning round challenge. 150+ questions across difficulty levels.';

-- Indexes for lightning round query performance
CREATE INDEX idx_lightning_questions_difficulty ON lightning_round_questions(difficulty);
CREATE INDEX idx_lightning_questions_type ON lightning_round_questions(question_type);

-- ============================================================================
-- Public Profiles Table (for job board)
-- ============================================================================

CREATE TABLE public_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES cs_assessment_sessions(id),
  profile_slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT, -- optional - user choice
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
  overall_score INTEGER, -- only if show_scores = true
  category_scores JSONB, -- only if show_scores = true
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public_profiles IS
  'Published profiles visible on public job board. Opt-in only.';

-- Indexes for public profile searches
CREATE INDEX idx_public_profiles_slug ON public_profiles(profile_slug);
CREATE INDEX idx_public_profiles_career_level ON public_profiles(career_level);
CREATE INDEX idx_public_profiles_badges ON public_profiles USING GIN(badges);
CREATE INDEX idx_public_profiles_published_at ON public_profiles(published_at DESC);

-- RLS for public profiles
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view published profiles (public job board)
CREATE POLICY "Public profiles are viewable by anyone"
  ON public_profiles
  FOR SELECT
  USING (true);

-- Users can create/update their own profile
CREATE POLICY "Users can manage own public profile"
  ON public_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Leaderboard View (Materialized for performance)
-- ============================================================================

CREATE MATERIALIZED VIEW assessment_leaderboard AS
SELECT
  user_id,
  archetype,
  overall_score,
  dimensions,
  category_scores,
  badges,
  lightning_round_score,
  completed_at,
  ROW_NUMBER() OVER (ORDER BY overall_score DESC) as overall_rank,
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'technical')::int DESC) as technical_rank,
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'emotional')::int DESC) as emotional_rank,
  ROW_NUMBER() OVER (ORDER BY (category_scores->>'creative')::int DESC) as creative_rank,
  ROW_NUMBER() OVER (ORDER BY lightning_round_score DESC) as lightning_rank
FROM cs_assessment_sessions
WHERE status = 'completed'
  AND completed_at IS NOT NULL;

-- Index for leaderboard queries
CREATE UNIQUE INDEX idx_leaderboard_user ON assessment_leaderboard(user_id);
CREATE INDEX idx_leaderboard_overall ON assessment_leaderboard(overall_rank);
CREATE INDEX idx_leaderboard_technical ON assessment_leaderboard(technical_rank);

-- Refresh function (call after assessment completion)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY assessment_leaderboard;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_leaderboard IS
  'Refresh leaderboard materialized view. Call after assessment completions.';
```

**Verification**:
```bash
npm run supabase:push
npm run supabase:test
```

---

## Task 2: TypeScript Type Updates (2 hours)

### 2.1 Update Core Assessment Types

**File**: `lib/assessment/types.ts`

**Changes needed**:

1. Add new dimensions to `ScoringDimension` type
2. Create new interfaces for personality, AI orchestration, badges
3. Update `AssessmentResults` interface

```typescript
// Add to ScoringDimension union
export type ScoringDimension =
  | 'iq'
  | 'eq'
  | 'empathy'
  | 'self_awareness'
  | 'technical'
  | 'ai_readiness'
  | 'gtm'
  | 'personality'
  | 'motivation'
  | 'work_history'
  | 'passions'
  | 'culture_fit'
  | 'organization'              // NEW
  | 'executive_leadership';     // NEW

// NEW: Personality Profile
export interface PersonalityProfile {
  mbti: string; // "ENFP", "INTJ", etc.
  enneagram: string; // "Type 3", "Type 7", etc.
  traits: string[];
  weight_modifiers: Record<ScoringDimension, number>; // dimension → multiplier (0.9-1.1)
}

// NEW: AI Orchestration Sub-Scores
export interface AIOrchestrationScores {
  technical_foundation: number; // 0-100
  practical_use: number;
  conceptual_understanding: number;
  systems_thinking: number;
  judgment: number;
}

// NEW: Category Scores
export interface CategoryScore {
  overall: number; // 0-100
  subscores: Record<string, number>; // e.g., {potential: 85, ability: 90, specificity: 80}
}

export interface CategoryScores {
  technical: CategoryScore;
  emotional: CategoryScore;
  creative: CategoryScore;
}

// NEW: Badge
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

// UPDATE: AssessmentDimensions (add new dimensions)
export interface AssessmentDimensions {
  iq: number;
  eq: number;
  empathy: number;
  self_awareness: number;
  technical: number;
  ai_readiness: number;
  gtm: number;
  personality: number;
  motivation: number;
  work_history: number;
  passions: number;
  culture_fit: number;
  organization: number;              // NEW
  executive_leadership: number;      // NEW
}

// UPDATE: AssessmentResults (add new fields)
export interface AssessmentResults {
  session_id: string;
  user_id: string;
  archetype: string;
  archetype_confidence: ArchetypeConfidence;
  overall_score: number;
  dimensions: AssessmentDimensions;
  category_scores: CategoryScores;          // NEW
  ai_orchestration_scores: AIOrchestrationScores; // NEW
  personality_profile: PersonalityProfile;  // NEW
  tier: AssessmentTier;
  flags: AssessmentFlags;
  recommendation: string;
  best_fit_roles: string[];
  badges: Badge[];                          // NEW
  analyzed_at: string;
}

// NEW: Public Profile
export interface PublicProfile {
  user_id: string;
  profile_slug: string;
  name: string;
  email?: string;
  career_level: string;
  years_experience: number;
  self_description?: string;
  personality_type: string;
  archetype: string;
  badges: Badge[];
  best_fit_roles: string[];
  public_summary: string;
  video_url?: string;
  show_scores: boolean;
  overall_score?: number;
  category_scores?: CategoryScores;
  published_at: string;
}
```

**Verification**:
```bash
npm run type-check
```

---

## Task 3: Badge System Implementation (3-4 hours)

### 3.1 Badge Definitions

**File**: `lib/assessment/badges.ts` (NEW)

```typescript
import type { AssessmentResults, Badge } from './types';

export interface BadgeCriteria {
  // Dimension-based
  dimension?: string;
  min_score?: number;

  // Category-based
  category?: 'technical' | 'emotional' | 'creative';
  category_min_score?: number;

  // Combination criteria
  all_categories?: number; // All 3 categories must meet this min
  dimensions?: string[]; // Multiple dimensions must all meet min

  // Experience-based
  overall_min?: number;
  years_min?: number;
  years_max?: number;

  // Lightning round
  lightning_percentile?: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
  category: 'dimension' | 'category' | 'combo' | 'experience' | 'lightning';
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Dimension Badges
  {
    id: 'ai-prodigy',
    name: 'AI Prodigy',
    description: 'Top 10% in AI Readiness',
    icon: '🤖',
    criteria: { dimension: 'ai_readiness', min_score: 90 },
    category: 'dimension'
  },
  {
    id: 'perfect-empathy',
    name: 'Perfect Empathy',
    description: '95+ Empathy Score',
    icon: '🫶',
    criteria: { dimension: 'empathy', min_score: 95 },
    category: 'dimension'
  },
  {
    id: 'systems-architect',
    name: 'Systems Architect',
    description: '90+ in Organization & Technical',
    icon: '🏗️',
    criteria: {
      dimensions: ['organization', 'technical'],
      min_score: 90
    },
    category: 'combo'
  },

  // Category Badges
  {
    id: 'technical-maestro',
    name: 'Technical Maestro',
    description: '90+ in Technical Category',
    icon: '⚙️',
    criteria: { category: 'technical', category_min_score: 90 },
    category: 'category'
  },
  {
    id: 'people-champion',
    name: 'People Champion',
    description: '90+ in Emotional Category',
    icon: '❤️',
    criteria: { category: 'emotional', category_min_score: 90 },
    category: 'category'
  },
  {
    id: 'creative-genius',
    name: 'Creative Genius',
    description: '90+ in Creative Category',
    icon: '🎨',
    criteria: { category: 'creative', category_min_score: 90 },
    category: 'category'
  },

  // Combo Badges
  {
    id: 'triple-threat',
    name: 'Triple Threat',
    description: '85+ in all 3 categories',
    icon: '⭐',
    criteria: { all_categories: 85 },
    category: 'combo'
  },
  {
    id: 'ai-orchestrator',
    name: 'AI Orchestrator',
    description: '95+ AI Orchestration Score',
    icon: '🎭',
    criteria: { dimension: 'ai_readiness', min_score: 95 },
    category: 'dimension'
  },

  // Experience Badges
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: '80+ overall with <3 years experience',
    icon: '🌟',
    criteria: { overall_min: 80, years_max: 3 },
    category: 'experience'
  },
  {
    id: 'veteran-pro',
    name: 'Veteran Pro',
    description: '85+ overall with 10+ years',
    icon: '🏆',
    criteria: { overall_min: 85, years_min: 10 },
    category: 'experience'
  },

  // Lightning Round Badges
  {
    id: 'lightning-champion',
    name: 'Lightning Champion',
    description: 'Top 10% in Lightning Round',
    icon: '⚡',
    criteria: { lightning_percentile: 90 },
    category: 'lightning'
  },

  // Strategic Thinker
  {
    id: 'strategic-mind',
    name: 'Strategic Mind',
    description: '90+ in GTM + Executive Leadership',
    icon: '🧠',
    criteria: {
      dimensions: ['gtm', 'executive_leadership'],
      min_score: 90
    },
    category: 'combo'
  },

  // Technical Empath (rare combo)
  {
    id: 'technical-empath',
    name: 'Technical Empath',
    description: '85+ in Technical AND Empathy',
    icon: '🔬❤️',
    criteria: {
      dimensions: ['technical', 'empathy'],
      min_score: 85
    },
    category: 'combo'
  }
];

// Evaluate which badges a user has earned
export function evaluateBadges(
  analysis: AssessmentResults,
  yearsExperience: number,
  lightningPercentile?: number
): Badge[] {
  const earnedBadges: Badge[] = [];

  for (const badgeDef of BADGE_DEFINITIONS) {
    if (checkBadgeCriteria(badgeDef.criteria, analysis, yearsExperience, lightningPercentile)) {
      earnedBadges.push({
        id: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        earned_at: new Date().toISOString()
      });
    }
  }

  return earnedBadges;
}

function checkBadgeCriteria(
  criteria: BadgeCriteria,
  analysis: AssessmentResults,
  yearsExperience: number,
  lightningPercentile?: number
): boolean {
  // Check single dimension
  if (criteria.dimension && criteria.min_score) {
    const score = analysis.dimensions[criteria.dimension as keyof typeof analysis.dimensions];
    if (score < criteria.min_score) return false;
  }

  // Check multiple dimensions
  if (criteria.dimensions && criteria.min_score) {
    for (const dim of criteria.dimensions) {
      const score = analysis.dimensions[dim as keyof typeof analysis.dimensions];
      if (score < criteria.min_score) return false;
    }
  }

  // Check category
  if (criteria.category && criteria.category_min_score) {
    const categoryScore = analysis.category_scores[criteria.category].overall;
    if (categoryScore < criteria.category_min_score) return false;
  }

  // Check all categories
  if (criteria.all_categories) {
    const allMeet = Object.values(analysis.category_scores).every(
      cat => cat.overall >= criteria.all_categories!
    );
    if (!allMeet) return false;
  }

  // Check experience criteria
  if (criteria.overall_min && analysis.overall_score < criteria.overall_min) return false;
  if (criteria.years_min && yearsExperience < criteria.years_min) return false;
  if (criteria.years_max && yearsExperience > criteria.years_max) return false;

  // Check lightning percentile
  if (criteria.lightning_percentile && (!lightningPercentile || lightningPercentile < criteria.lightning_percentile)) {
    return false;
  }

  return true;
}

// Seed badges to database
export async function seedBadgesToDatabase(supabase: any) {
  const badgeRecords = BADGE_DEFINITIONS.map(badge => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    criteria: badge.criteria,
    category: badge.category
  }));

  const { error } = await supabase
    .from('assessment_badges')
    .upsert(badgeRecords, { onConflict: 'id' });

  if (error) throw error;

  console.log(`Seeded ${badgeRecords.length} badge definitions`);
}
```

### 3.2 Seed Badges Script

**File**: `scripts/seed-assessment-badges.ts` (NEW)

```typescript
import { createClient } from '@/lib/supabase/server';
import { seedBadgesToDatabase } from '@/lib/assessment/badges';

async function main() {
  const supabase = await createClient();
  await seedBadgesToDatabase(supabase);
  console.log('Badge seeding complete!');
}

main().catch(console.error);
```

**Verification**:
```bash
npx tsx scripts/seed-assessment-badges.ts
```

---

## Task 4: Scoring System Overhaul (4-5 hours)

### 4.1 Update Scoring Rubrics for 14 Dimensions

**File**: `lib/assessment/scoring-rubrics.ts`

**Add rubrics for**:
- `organization` dimension
- `executive_leadership` dimension

(I'll continue with the detailed scoring updates in the next section to stay within token limits)

### 4.2 Create Category Scoring Logic

**File**: `lib/assessment/category-scoring.ts` (NEW)

This file will calculate the 3-category hybrid scores from 14 dimensions.

### 4.3 Update Scoring Prompt for Hard Grading

**File**: `lib/assessment/scoring-prompt.ts`

Critical changes needed:
- Update weighted average for 14 dimensions
- Add personality weighting instructions
- Emphasize hard grading (50 = average)
- Add years of experience context
- Add AI orchestration sub-score evaluation

### 4.4 Personality-Based Weighting

**File**: `lib/assessment/personality-weights.ts` (NEW)

Logic for adjusting dimension scores based on personality type.

---

## Task 5: Core Assessment APIs (3-4 hours)

### 5.1 Update Start API

**File**: `app/api/assessment/start/route.ts`

Load core questions (not lightning/absurdist yet - that's Phase 2)

### 5.2 Update Answer API

**File**: `app/api/assessment/[sessionId]/answer/route.ts`

No changes needed - continues to append to transcript.

### 5.3 Update Complete API - NEW SCORING

**File**: `app/api/assessment/[sessionId]/complete/route.ts`

**Major changes**:
1. Call updated scoring service with 14 dimensions
2. Calculate category scores
3. Calculate AI orchestration sub-scores
4. Evaluate personality type (MBTI/Enneagram)
5. Evaluate badges
6. Generate public summary
7. Generate detailed summary
8. Save all new fields to database

---

## Testing Checklist

After all tasks complete:

- [ ] Migration applies successfully
- [ ] TypeScript compiles with no errors
- [ ] Badges seed to database
- [ ] Complete existing 26-question assessment
- [ ] Verify 14 dimensions scored (including organization, executive_leadership)
- [ ] Verify category scores calculated
- [ ] Verify AI orchestration sub-scores present
- [ ] Verify personality type assigned
- [ ] Verify badges awarded correctly
- [ ] Verify public + detailed summaries generated
- [ ] Check scores average ~50 (hard grading working)
- [ ] Top performers get 85-90+ scores

---

## Deliverables

1. Database migration applied
2. All TypeScript types updated and compiling
3. Badge system functional with 13+ badges
4. Scoring system produces 14-dimensional scores with hard grading
5. Category scores (Technical/Emotional/Creative) calculated
6. AI Orchestration sub-scores extracted
7. Personality type (MBTI + Enneagram) assigned
8. Badges automatically awarded
9. Public + detailed summaries generated
10. All APIs updated and tested

**Ready for Phase 2**: Frontend UI, Lightning Round, Absurdist Finale, Video Recording, Public Profiles

---

## Notes for Backend Agent

- Work in `C:\Users\strac\dev\goodhang\goodhang-backend-agent` directory
- Branch: `backend-agent`
- Test frequently: `npm run type-check` after each file change
- Use existing patterns from current codebase
- Reference existing files: `lib/assessment/scoring-prompt.ts`, `lib/services/AssessmentScoringService.ts`
- Commit after each completed task with clear messages
- If stuck, document the blocker and continue with other tasks

**Success Criteria**: Existing 20-question assessment runs end-to-end with new 14-dimensional scoring, personality typing, category scores, AI orchestration sub-scores, and badge awards.
