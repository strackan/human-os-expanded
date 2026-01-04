# Assessment Flow Architecture

## Overview

The CS Skills Assessment system is a comprehensive evaluation platform that combines structured questionnaires with AI-powered scoring to assess candidates across 14 dimensions. This document outlines the complete flow from user initiation to results delivery.

---

## User Journey

### 1. Assessment Initiation
- User navigates to `/assessment` page
- System checks for existing incomplete sessions
- If incomplete session exists: Resume from last question
- If no session: Create new session and start from beginning

### 2. Question Flow
The assessment consists of **20 questions** across **4 sections**:

| Section | Questions | Focus Area |
|---------|-----------|------------|
| Personality & Work Style | 10 | MBTI typing, Enneagram detection, work preferences |
| AI & Systems Thinking | 5 | AI orchestration capability, technical foundation |
| Professional Background | 3 | Experience, goals, self-assessment |
| Culture & Self-Awareness | 2 | Cultural fit, humor, weakness awareness |

**Navigation:**
- User answers questions one at a time
- Auto-save after each answer (no "Submit" button)
- Can navigate back to previous questions
- Progress tracked visually with timeline component
- Current position stored in database for resume capability

### 3. Answer Submission
Each answer triggers:
1. Client-side validation (min/max length)
2. API call to `/api/assessment/[sessionId]/answer`
3. Database update with answer and timestamp
4. UI update to show saved state
5. Enable "Next" button

### 4. Completion Trigger
After answering all 20 questions:
1. User clicks "Complete Assessment" button
2. API call to `/api/assessment/[sessionId]/complete`
3. Server validates all required questions answered
4. Triggers Claude AI scoring (async process)
5. Results saved to database
6. User redirected to `/assessment/results/[sessionId]`

### 5. Results Display
- Overall score (0-100, hard graded)
- Archetype and tier classification
- 14 dimension scores with radar chart
- 3 category scores (Technical, Emotional, Creative)
- Personality profile (MBTI + Enneagram)
- AI orchestration sub-scores
- Earned badges
- Public summary (shareable)
- Recommended roles

---

## Data Flow Diagram

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Start Assessment
     ▼
┌─────────────────────┐
│  Next.js Frontend   │
│  /assessment page   │
└─────────┬───────────┘
          │
          │ 2. POST /api/assessment/start
          ▼
┌─────────────────────────────────┐
│  API Route: start/route.ts      │
│  - Auth check                   │
│  - Check for existing session   │
│  - Create or resume session     │
└─────────┬───────────────────────┘
          │
          │ 3. Insert/Select session
          ▼
┌─────────────────────────────────┐
│  Supabase Database              │
│  Table: cs_assessment_sessions  │
└─────────┬───────────────────────┘
          │
          │ 4. Return session + config
          ▼
┌─────────────────────┐
│  Frontend           │
│  - Display question │
│  - Collect answer   │
└─────────┬───────────┘
          │
          │ 5. POST /api/assessment/[sessionId]/answer (per question)
          ▼
┌─────────────────────────────────┐
│  API Route: answer/route.ts     │
│  - Validate answer              │
│  - Update session.answers       │
│  - Save progress                │
└─────────┬───────────────────────┘
          │
          │ 6. Update answers JSONB
          ▼
┌─────────────────────────────────┐
│  Database                       │
│  Session updated with answer    │
└─────────────────────────────────┘
          │
          │ (Repeat steps 5-6 for all 20 questions)
          │
          │ 7. POST /api/assessment/[sessionId]/complete
          ▼
┌─────────────────────────────────┐
│  API Route: complete/route.ts   │
│  - Validate all answers present │
│  - Call AssessmentScoringService│
└─────────┬───────────────────────┘
          │
          │ 8. Score assessment
          ▼
┌──────────────────────────────────────┐
│  AssessmentScoringService            │
│  - Build scoring prompt              │
│  - Call Claude API                   │
│  - Parse response                    │
│  - Calculate category scores         │
│  - Evaluate badges                   │
└─────────┬────────────────────────────┘
          │
          │ 9. Claude API call
          ▼
┌─────────────────────────────────┐
│  Claude Sonnet 4 API            │
│  - Analyze all 20 answers       │
│  - Score 14 dimensions          │
│  - Type personality             │
│  - Generate summaries           │
└─────────┬───────────────────────┘
          │
          │ 10. Return scoring JSON
          ▼
┌──────────────────────────────────────┐
│  BadgeEvaluatorService               │
│  - Evaluate badge criteria           │
│  - Award earned badges               │
└─────────┬────────────────────────────┘
          │
          │ 11. Save complete results
          ▼
┌─────────────────────────────────┐
│  Database                       │
│  - Update session status        │
│  - Save dimensions, scores      │
│  - Save personality profile     │
│  - Save badges                  │
└─────────┬───────────────────────┘
          │
          │ 12. Return redirect URL
          ▼
┌─────────────────────┐
│  Frontend           │
│  Redirect to results│
└─────────┬───────────┘
          │
          │ 13. GET /api/assessment/[sessionId]/results
          ▼
┌─────────────────────────────────┐
│  API Route: results/route.ts    │
│  - Fetch completed session      │
│  - Return full results          │
└─────────┬───────────────────────┘
          │
          │ 14. Display results
          ▼
┌─────────────────────┐
│  Results Page       │
│  - Scores & charts  │
│  - Personality      │
│  - Badges           │
│  - Recommendations  │
└─────────────────────┘
```

---

## Database Schema

### cs_assessment_sessions

Primary table for storing all assessment data.

```sql
CREATE TABLE cs_assessment_sessions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Session state
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  current_section TEXT,
  current_question INTEGER,

  -- Answers (JSONB key-value store)
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Scoring results (populated on completion)
  dimensions JSONB,
  overall_score INTEGER,
  personality_type TEXT,
  personality_profile JSONB,
  category_scores JSONB,
  ai_orchestration_scores JSONB,
  archetype TEXT,
  archetype_confidence TEXT,
  tier TEXT,
  flags JSONB,
  recommendation TEXT,
  best_fit_roles TEXT[],
  badges TEXT[],
  public_summary TEXT,
  detailed_summary TEXT,
  is_published BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_status ON cs_assessment_sessions(user_id, status);
CREATE INDEX idx_sessions_created ON cs_assessment_sessions(created_at DESC);
```

---

## State Management

### Session States

1. **not_started**: Session created but no questions answered yet
2. **in_progress**: User has answered at least one question
3. **completed**: All questions answered and scoring complete

### State Transitions

```
not_started
    │
    │ User answers first question
    ▼
in_progress
    │
    │ User answers all 20 questions + clicks "Complete"
    ▼
completed
```

**No backward transitions** - A completed assessment cannot return to in_progress.

---

## API Endpoints

### POST /api/assessment/start

**Purpose:** Creates new session or resumes existing incomplete session

**Authentication:** Required (Supabase Auth)

**Request Body:** None

**Response:**
```typescript
{
  session_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: {
    current_section: string;
    current_question: number;
    total_questions: number;
    percentage: number;
  };
  config: AssessmentConfig; // Full question set
}
```

**Error Codes:**
- 401: Unauthorized (no valid session)
- 500: Database error

---

### POST /api/assessment/[sessionId]/answer

**Purpose:** Saves a single answer (auto-save on each question)

**Authentication:** Required

**Request Body:**
```typescript
{
  question_id: string;
  answer: string;
  question_text?: string;
  current_section?: string;
  current_question?: number;
  section_index?: number;
  question_index?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  session_id: string;
  saved_at: string; // ISO timestamp
}
```

**Error Codes:**
- 400: Missing question_id or answer
- 401: Unauthorized
- 404: Session not found
- 400: Cannot modify completed assessment
- 500: Database error

---

### POST /api/assessment/[sessionId]/complete

**Purpose:** Triggers Claude AI scoring and marks assessment complete

**Authentication:** Required

**Request Body:** None

**Response:**
```typescript
{
  session_id: string;
  status: 'completed';
  redirect_url: string; // '/assessment/results/[sessionId]'
}
```

**Process:**
1. Validates all 20 questions answered
2. Calls `AssessmentScoringService.scoreAssessment()`
3. Waits for Claude API response (5-15 seconds)
4. Saves results to database
5. Returns redirect URL

**Error Codes:**
- 400: Not all required questions answered
- 401: Unauthorized
- 404: Session not found
- 500: Scoring failed (Claude API error)
- 500: Database error

---

### GET /api/assessment/[sessionId]/results

**Purpose:** Retrieves complete assessment results

**Authentication:** Required

**Request Body:** None

**Response:**
```typescript
{
  session_id: string;
  user_id: string;
  archetype: string;
  archetype_confidence: 'high' | 'medium' | 'low';
  overall_score: number; // 0-100
  dimensions: AssessmentDimensions; // All 14 scores
  tier: 'top_1' | 'benched' | 'passed';
  flags: { red_flags: string[]; green_flags: string[] };
  recommendation: string;
  best_fit_roles: string[];
  analyzed_at: string;
  personality_profile: PersonalityProfile;
  ai_orchestration_scores: AIOrchestrationScores;
  category_scores: CategoryScores;
  badges: Badge[];
  public_summary: string;
  detailed_summary: string;
  is_published: boolean;
}
```

**Error Codes:**
- 400: Assessment not completed yet
- 401: Unauthorized
- 404: Session not found
- 500: Database error

---

## Error Handling

### Client-Side Errors
- Form validation (min/max length)
- Network errors (retry with exponential backoff)
- Session expired (redirect to login)

### Server-Side Errors
- Authentication failures (401 response)
- Validation errors (400 response)
- Database errors (500 response, logged to console)
- Claude API errors (500 response, logged with details)

### Error Recovery
- **Answer save failure**: Retry up to 3 times
- **Scoring failure**: Show error, allow manual retry
- **Session not found**: Redirect to assessment start
- **Partial completion**: Resume from last saved question

---

## Performance Considerations

### Optimization Strategies

1. **Answer Auto-Save**: Debounced to avoid excessive DB writes
2. **Database Indexes**: On user_id, status, created_at
3. **JSONB Storage**: Efficient storage for flexible answer schema
4. **Claude API Caching**: Consider caching identical answer sets (future)
5. **Results Caching**: Results never change after completion (immutable)

### Expected Latency

- **Answer save**: < 200ms
- **Session create**: < 300ms
- **Claude scoring**: 5-15 seconds (varies by API load)
- **Results fetch**: < 200ms

---

## Security & Privacy

### Authentication
- All endpoints require valid Supabase session
- RLS (Row Level Security) enforces user can only access own sessions

### Data Access
- Users can only read/write their own assessment sessions
- Admin access via separate RLS policies (regional_coordinators table)

### Data Retention
- Sessions stored indefinitely (user can delete via profile)
- Detailed summaries marked as internal (not shown to user unless admin)
- Public summaries shareable via opt-in

---

## Future Enhancements

### Phase 2 Features
- **Lightning Round**: Timed quick-answer questions
- **Absurdist Questions**: Personality edge cases
- **Team Comparison**: Benchmark against team averages
- **Badge Showcase**: Public badge display on member profiles
- **Retake Logic**: Allow retakes after 90 days

### Scalability
- **Async Scoring**: Queue-based scoring for high volume
- **Batch Processing**: Score multiple assessments in parallel
- **CDN Caching**: Cache static question sets
- **Read Replicas**: Separate read DB for results queries
