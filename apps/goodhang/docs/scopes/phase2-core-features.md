# Phase 2: Core Assessment Features
## Agent Scope Documentation

**Phase Goal**: Complete Lightning Round, Absurdist Questions, and Public Job Board

**Start Date**: 2025-11-16
**Agent Count**: 5
**Dependencies**: Phase 1 complete (database migration available)
**Estimated Duration**: 60 minutes

---

## Database Schema Available (from Agent 1)

**Tables Created**:
- `lightning_round_questions` (150+ questions seeded)
- `assessment_badges` (13 badges seeded)
- `public_profiles` (ready for job board)
- `assessment_leaderboard` (materialized view)

**New Columns on cs_assessment_sessions**:
- `lightning_round_score`, `lightning_round_difficulty`, `lightning_round_completed_at`
- `absurdist_questions_answered`
- `badges TEXT[]`
- `personality_type`, `personality_profile JSONB`
- `category_scores JSONB`, `ai_orchestration_scores JSONB`
- `is_published BOOLEAN`, `profile_slug TEXT`

---

## Agent 7: Lightning Round Backend

### Scope
Create APIs for 2-minute rapid-fire question challenge.

### Deliverables

**1. API Route: Start Lightning Round**
**File**: `app/api/assessment/lightning/start/route.ts`

```typescript
POST /api/assessment/lightning/start
Body: { session_id: string, difficulty?: string }
Response: {
  questions: LightningQuestion[] (10-15 random questions),
  duration_seconds: 120,
  started_at: string
}
```

**2. API Route: Submit Lightning Round**
**File**: `app/api/assessment/lightning/submit/route.ts`

```typescript
POST /api/assessment/lightning/submit
Body: {
  session_id: string,
  answers: { question_id: string, answer: string, time_taken_ms: number }[]
}
Response: {
  score: number,
  accuracy: number,
  percentile: number,
  difficulty_achieved: string
}
```

**3. Scoring Logic**
**File**: `lib/services/LightningRoundScoringService.ts`

Calculate score based on:
- Accuracy (correct answers)
- Speed bonus (faster = more points)
- Difficulty multiplier (harder questions worth more)
- Percentile ranking (compare to all users)

### Success Criteria
- ✅ Random question selection by difficulty
- ✅ Scoring algorithm implemented
- ✅ Percentile calculation working
- ✅ Session updated with lightning scores

---

## Agent 8: Lightning Round Frontend

### Scope
Build 2-minute rapid-fire UI experience.

### Deliverables

**1. Lightning Round Page**
**File**: `app/assessment/lightning/page.tsx`

Features:
- 2-minute countdown timer
- Rapid-fire question display
- Quick answer input (text field, auto-focus)
- Real-time score counter
- Question counter (e.g., "7/15")
- Skip button

**2. Timer Component**
**File**: `components/assessment/LightningTimer.tsx`

- Visual countdown (circular or linear)
- Warning at 30 seconds (color change)
- Auto-submit when time expires

**3. Results Screen**
**File**: `components/assessment/LightningResults.tsx`

Display:
- Final score
- Accuracy percentage
- Percentile ranking
- Difficulty level achieved
- "Continue to Absurdist Questions" button

### Success Criteria
- ✅ Timer counts down accurately
- ✅ Questions display quickly
- ✅ Mobile-optimized (large touch targets)
- ✅ Auto-submit on timer expiration
- ✅ Smooth transition to next phase

---

## Agent 9: Absurdist Questions (Full Stack)

### Scope
Creative finale after Lightning Round.

### Deliverables

**1. Question Bank**
**File**: `lib/assessment/absurdist-questions.json`

Create 10+ creative questions like:
- "If you were a kitchen appliance, which would you be and why?"
- "Describe your work style using only food metaphors"
- "What's the most useless superpower you'd want?"

**2. Backend API**
**File**: `app/api/assessment/absurdist/questions/route.ts`

```typescript
GET /api/assessment/absurdist/questions
Response: { questions: AbsurdistQuestion[] }
```

**File**: `app/api/assessment/absurdist/submit/route.ts`

```typescript
POST /api/assessment/absurdist/submit
Body: { session_id: string, answers: Record<question_id, answer> }
Response: { success: boolean, creativity_score?: number }
```

**3. Frontend Page**
**File**: `app/assessment/absurdist/page.tsx`

Features:
- Whimsical, playful design
- Text + voice input support
- One question at a time
- Fun transitions between questions
- "Complete Assessment" button at end

### Success Criteria
- ✅ 10+ absurdist questions created
- ✅ Answers saved to session
- ✅ Playful UI design
- ✅ Integrates with overall assessment flow

---

## Agent 11: Public Job Board Backend

### Scope
APIs for browsing and searching published profiles.

### Deliverables

**1. Enhanced Publish API**
**File**: Update `app/api/profile/publish/route.ts` (already exists from Agent 2)

Ensure it:
- Creates entry in `public_profiles` table
- Copies relevant data from assessment session
- Generates profile slug
- Respects user privacy settings

**2. Browse Profiles API**
**File**: `app/api/profiles/route.ts`

```typescript
GET /api/profiles?career_level=mid&badges=ai-prodigy&limit=20
Response: {
  profiles: PublicProfile[],
  total: number,
  page: number
}
```

Features:
- Search by career level
- Filter by badges
- Filter by archetype
- Sort by score (if public), published date
- Pagination

**3. Individual Profile API**
**File**: `app/api/profiles/[slug]/route.ts`

```typescript
GET /api/profiles/[slug]
Response: PublicProfile
```

Returns full profile with:
- Personality type
- Badges
- Category scores (if show_scores=true)
- Best fit roles
- Public summary
- Video URL (if provided)

### Success Criteria
- ✅ Publish/unpublish working
- ✅ Search and filter functional
- ✅ Privacy controls respected
- ✅ Pagination implemented

---

## Agent 12: Public Job Board Frontend

### Scope
Build profile browsing and individual profile pages.

### Deliverables

**1. Browse Profiles Page**
**File**: `app/profiles/page.tsx`

Features:
- Grid layout of profile cards
- Search bar
- Filters (career level, badges, archetype)
- Sort options
- Pagination controls
- "Publish Your Profile" CTA if user hasn't

**2. Profile Card Component**
**File**: `components/profiles/ProfileCard.tsx`

Display:
- Name
- Career level
- Personality type (MBTI)
- Top badges (3-5)
- Archetype
- Brief summary (truncated)
- "View Profile" link

**3. Individual Profile Page**
**File**: `app/profiles/[slug]/page.tsx`

Full profile display:
- Header with name, career level, archetype
- Personality profile section
- Badge showcase
- Category scores (if public)
- Best fit roles
- Public summary
- Video player (if video_url exists)
- Contact button (if email visible)

**4. Publish Toggle Component**
**File**: `components/assessment/PublishProfileToggle.tsx`

For results page:
- Toggle switch to publish/unpublish
- Preview of what will be public
- Privacy settings (show scores, show email)

### Success Criteria
- ✅ Browse page displays published profiles
- ✅ Search and filters work
- ✅ Individual profiles display correctly
- ✅ Mobile responsive
- ✅ Publish toggle functional

---

## Integration Points

### Agent 7 → Agent 8
- API contracts must match (question format, response structure)
- Timing data structure agreed upon

### Agent 9 → Overall Flow
- Integrates after Lightning Round
- Triggers assessment completion

### Agent 11 → Agent 12
- API response shapes must match frontend expectations
- Profile slug format consistent

### All Agents → Phase 1 Database
- Use schema created by Agent 1
- Follow RLS policies
- Use existing badge definitions

---

## Quality Standards (from Phase 1)

**TypeScript**:
- Strict mode enabled
- Use Zod for API validation
- Proper error handling with typed errors

**API Routes**:
- Next.js 15: `params` is Promise, must await
- Authenticate with Supabase
- Return proper HTTP status codes

**Frontend**:
- Mobile-first responsive design
- Tailwind CSS with project conventions
- Touch-friendly targets (44px minimum)
- Loading states for all async operations

---

## Files to Create (Expected)

```
app/api/
├── assessment/
│   ├── lightning/
│   │   ├── start/route.ts
│   │   └── submit/route.ts
│   └── absurdist/
│       ├── questions/route.ts
│       └── submit/route.ts
└── profiles/
    ├── route.ts
    └── [slug]/route.ts

lib/
├── assessment/
│   └── absurdist-questions.json
└── services/
    └── LightningRoundScoringService.ts

app/
├── assessment/
│   ├── lightning/page.tsx
│   └── absurdist/page.tsx
└── profiles/
    ├── page.tsx
    └── [slug]/page.tsx

components/
├── assessment/
│   ├── LightningTimer.tsx
│   ├── LightningResults.tsx
│   └── PublishProfileToggle.tsx
└── profiles/
    └── ProfileCard.tsx
```

---

**Last Updated**: 2025-11-16
**Status**: Ready for execution
