# Phase 1 Frontend Implementation Plan
## CS Assessment Expansion - Core UI & Results Display

**Agent**: Frontend Agent
**Working Directory**: `C:\Users\strac\dev\goodhang\goodhang-frontend-agent`
**Branch**: `frontend-agent`
**Estimated Time**: 15-20 hours
**Dependencies**: Backend Phase 1 completion (can work in parallel, just won't see live data until backend done)

---

## Overview

This phase builds the UI for the expanded core assessment (20 questions), displays the new scoring system (14 dimensions, 3 categories, AI orchestration, badges), and creates the smart assessment link in members area.

Focus:
1. Update interview flow to handle core questions (personality + AI orchestration + professional + culture)
2. Display enhanced results page with 14 dimensions, category scores, badges, personality profile
3. Smart assessment link in members area (3 states: start/resume/view)
4. Timeline/breadcrumb navigation for sections
5. Enhanced results visualization

**Phase 2** will add: Lightning Round UI, Absurdist Finale flow, Video Recording, Public Profiles/Job Board

---

## Task 1: Update Interview Page for Core Questions (3-4 hours)

### 1.1 Update useAssessment Hook

**File**: `lib/hooks/useAssessment.ts`

**Changes needed**:
- Load core questions from `lib/assessment/core-questions.json` instead of old questions
- Handle 4 sections: personality, ai_orchestration, professional_context, culture_fit
- Keep existing auto-save, navigation, completion logic

**Key change**:
```typescript
// Instead of loading from old questions.json
import coreQuestions from '@/lib/assessment/core-questions.json';

// In start() function
setAssessment(coreQuestions);
```

### 1.2 Verify Interview Page Works

**File**: `app/assessment/interview/page.tsx`

**No major changes needed** - existing interview page should work with new core questions since structure is the same (sections → questions).

**Test**:
- Navigate through all 20 core questions
- Verify personality questions display correctly
- Verify AI orchestration questions display
- Verify auto-save works
- Verify completion triggers

---

## Task 2: Section Timeline / Breadcrumb Navigation (2-3 hours)

### 2.1 Create Timeline Component

**File**: `components/assessment/SectionTimeline.tsx` (NEW)

```typescript
'use client';

import { cn } from '@/lib/utils';
import type { AssessmentSection } from '@/lib/assessment/types';
import type { AssessmentAnswer } from '@/lib/hooks/useAssessment';

interface SectionTimelineProps {
  sections: AssessmentSection[];
  currentSectionIndex: number;
  answers: AssessmentAnswer[];
  onNavigate: (sectionIndex: number) => void;
}

export function SectionTimeline({
  sections,
  currentSectionIndex,
  answers,
  onNavigate
}: SectionTimelineProps) {
  // Check if section is completed
  const isSectionCompleted = (section: AssessmentSection) => {
    const sectionQuestionIds = section.questions.map(q => q.id);
    return sectionQuestionIds.every(qid =>
      answers.some(a => a.question_id === qid)
    );
  };

  return (
    <div className="flex justify-center items-center gap-3 py-4 px-4 border-b border-purple-500/20 bg-gray-900/50">
      {sections.map((section, index) => {
        const isCompleted = isSectionCompleted(section);
        const isActive = index === currentSectionIndex;
        const isPast = index < currentSectionIndex;

        return (
          <button
            key={section.id}
            onClick={() => onNavigate(index)}
            disabled={!isPast && !isActive && !isCompleted}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              'disabled:cursor-not-allowed',
              isActive && 'bg-purple-600 text-white shadow-lg shadow-purple-500/30',
              !isActive && isCompleted && 'bg-green-600/20 text-green-400 hover:bg-green-600/30',
              !isActive && !isCompleted && isPast && 'bg-gray-700 text-gray-300 hover:bg-gray-600',
              !isActive && !isCompleted && !isPast && 'bg-gray-800 text-gray-500'
            )}
          >
            {isCompleted && !isActive && '✓ '}
            {section.title}
          </button>
        );
      })}
    </div>
  );
}
```

### 2.2 Integrate Timeline into Interview Page

**File**: `app/assessment/interview/page.tsx`

**Add above the progress bar** (around line 148):

```typescript
import { SectionTimeline } from '@/components/assessment/SectionTimeline';

// Inside return statement, before progress bar
<SectionTimeline
  sections={assessment.sections}
  currentSectionIndex={currentSectionIndex}
  answers={answers}
  onNavigate={(index) => {
    setCurrentSectionIndex(index);
    setCurrentQuestionIndex(0);
  }}
/>
```

**Verification**:
- Timeline shows all 4 sections
- Active section highlighted in purple
- Completed sections show checkmark and green
- Can click to navigate between sections

---

## Task 3: Enhanced Results Page (6-8 hours)

### 3.1 Update Results Page Structure

**File**: `app/assessment/results/[sessionId]/page.tsx`

**Major redesign needed** to show:
- Personality Profile (MBTI + Enneagram)
- 14 Individual Dimension Scores
- 3 Category Scores (Technical/Emotional/Creative) with visual breakdown
- AI Orchestration Sub-Scores
- Badge Showcase
- Best-Fit Roles
- Public Summary
- Detailed Summary (internal only - hidden from public)

**New component structure**:

```typescript
'use client';

export default function AssessmentResultsPage({ params }: { params: { sessionId: string } }) {
  const { data: results, isLoading } = useSWR(`/api/assessment/${params.sessionId}/results`);

  if (isLoading) return <LoadingSpinner />;
  if (!results) return <NotFound />;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Header */}
        <ResultsHeader
          archetype={results.archetype}
          overall_score={results.overall_score}
          tier={results.tier}
        />

        {/* Personality Profile */}
        <PersonalityProfileCard
          profile={results.personality_profile}
        />

        {/* Badge Showcase */}
        <BadgeShowcase badges={results.badges} />

        {/* Category Scores (Big 3) */}
        <CategoryScoresSection
          categoryScores={results.category_scores}
        />

        {/* AI Orchestration Deep Dive */}
        <AIOrchestrationCard
          scores={results.ai_orchestration_scores}
        />

        {/* 14 Dimension Breakdown */}
        <DimensionBreakdown
          dimensions={results.dimensions}
        />

        {/* Best Fit Roles */}
        <BestFitRolesCard
          roles={results.best_fit_roles}
        />

        {/* Public Summary */}
        <PublicSummaryCard
          summary={results.public_summary}
        />

        {/* Actions */}
        <ResultsActions
          sessionId={params.sessionId}
          isPublished={results.is_published}
        />
      </div>
    </div>
  );
}
```

### 3.2 Create Results Sub-Components

**File**: `components/assessment/results/PersonalityProfileCard.tsx` (NEW)

```typescript
'use client';

import type { PersonalityProfile } from '@/lib/assessment/types';

interface PersonalityProfileCardProps {
  profile: PersonalityProfile;
}

export function PersonalityProfileCard({ profile }: PersonalityProfileCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Your Personality Profile
      </h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* MBTI */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-purple-400 mb-2">Myers-Briggs Type</h3>
          <p className="text-4xl font-bold text-white mb-3">{profile.mbti}</p>
          <p className="text-gray-300 text-sm">
            {getMBTIDescription(profile.mbti)}
          </p>
        </div>

        {/* Enneagram */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-400 mb-2">Enneagram Type</h3>
          <p className="text-4xl font-bold text-white mb-3">{profile.enneagram}</p>
          <p className="text-gray-300 text-sm">
            {getEnneagramDescription(profile.enneagram)}
          </p>
        </div>
      </div>

      {/* Key Traits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">Key Traits</h3>
        <div className="flex flex-wrap gap-2">
          {profile.traits.map(trait => (
            <span
              key={trait}
              className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function getMBTIDescription(type: string): string {
  // Map MBTI types to descriptions
  const descriptions: Record<string, string> = {
    'ENFP': 'Enthusiastic, creative, and spontaneous. Excellent at connecting ideas and people.',
    'INTJ': 'Strategic, analytical, and independent. Natural problem-solvers with long-term vision.',
    // ... add all 16 types
  };
  return descriptions[type] || 'Unique personality with distinct strengths.';
}

function getEnneagramDescription(type: string): string {
  // Map Enneagram types
  const descriptions: Record<string, string> = {
    'Type 3': 'The Achiever - Success-oriented, adaptable, driven.',
    'Type 7': 'The Enthusiast - Spontaneous, versatile, optimistic.',
    // ... add all 9 types
  };
  return descriptions[type] || 'Distinct motivational pattern.';
}
```

**File**: `components/assessment/results/BadgeShowcase.tsx` (NEW)

```typescript
'use client';

import type { Badge } from '@/lib/assessment/types';

interface BadgeShowcaseProps {
  badges: Badge[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  if (badges.length === 0) {
    return (
      <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-8 mb-8 text-center">
        <p className="text-gray-400">No badges earned yet. Keep improving to unlock achievements!</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
        Badges Earned 🏆
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map(badge => (
          <div
            key={badge.id}
            className="bg-gray-900/50 border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500/40 transition-all"
          >
            <div className="text-5xl mb-3">{badge.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{badge.name}</h3>
            <p className="text-gray-300 text-sm mb-3">{badge.description}</p>
            <p className="text-xs text-gray-500">Earned {new Date(badge.earned_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**File**: `components/assessment/results/CategoryScoresSection.tsx` (NEW)

```typescript
'use client';

import type { CategoryScores } from '@/lib/assessment/types';

interface CategoryScoresSectionProps {
  categoryScores: CategoryScores;
}

export function CategoryScoresSection({ categoryScores }: CategoryScoresSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold mb-6 text-white">Category Scores</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Technical */}
        <CategoryCard
          title="Technical"
          score={categoryScores.technical.overall}
          subscores={categoryScores.technical.subscores}
          color="blue"
          icon="⚙️"
        />

        {/* Emotional */}
        <CategoryCard
          title="Emotional"
          score={categoryScores.emotional.overall}
          subscores={categoryScores.emotional.subscores}
          color="purple"
          icon="❤️"
        />

        {/* Creative */}
        <CategoryCard
          title="Creative"
          score={categoryScores.creative.overall}
          subscores={categoryScores.creative.subscores}
          color="pink"
          icon="🎨"
        />
      </div>
    </div>
  );
}

interface CategoryCardProps {
  title: string;
  score: number;
  subscores: Record<string, number>;
  color: 'blue' | 'purple' | 'pink';
  icon: string;
}

function CategoryCard({ title, score, subscores, color, icon }: CategoryCardProps) {
  const colorClasses = {
    blue: 'from-blue-900/20 to-cyan-900/20 border-blue-500/30',
    purple: 'from-purple-900/20 to-pink-900/20 border-purple-500/30',
    pink: 'from-pink-900/20 to-red-900/20 border-pink-500/30'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <div className="text-5xl font-bold text-white mb-4">{score}</div>

      {/* Subscores */}
      <div className="space-y-2">
        {Object.entries(subscores).map(([name, value]) => (
          <div key={name} className="flex justify-between items-center text-sm">
            <span className="text-gray-300 capitalize">{name.replace('_', ' ')}</span>
            <span className="text-white font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**File**: `components/assessment/results/AIOrchestrationCard.tsx` (NEW)

```typescript
'use client';

import type { AIOrchestrationScores } from '@/lib/assessment/types';

interface AIOrchestrationCardProps {
  scores: AIOrchestrationScores;
}

export function AIOrchestrationCard({ scores }: AIOrchestrationCardProps) {
  const overallScore = Math.round(
    Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length
  );

  return (
    <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        AI Orchestration Mastery
      </h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Overall Score */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Overall AI Orchestration</h3>
          <div className="text-6xl font-bold text-white">{overallScore}</div>
        </div>

        {/* Breakdown */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Breakdown</h3>
          <div className="space-y-2">
            <ScoreLine label="Technical Foundation" score={scores.technical_foundation} />
            <ScoreLine label="Practical Use" score={scores.practical_use} />
            <ScoreLine label="Conceptual Understanding" score={scores.conceptual_understanding} />
            <ScoreLine label="Systems Thinking" score={scores.systems_thinking} />
            <ScoreLine label="Judgment" score={scores.judgment} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreLine({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300 text-sm">{label}</span>
      <span className="text-white font-semibold">{score}</span>
    </div>
  );
}
```

**File**: `components/assessment/results/DimensionBreakdown.tsx` (NEW)

Visual breakdown of all 14 dimensions with bar charts.

**File**: `components/assessment/results/BestFitRolesCard.tsx` (NEW)

Display career path recommendations.

**File**: `components/assessment/results/PublicSummaryCard.tsx` (NEW)

Display the public-facing summary (positive highlights).

---

## Task 4: Smart Assessment Link in Members Area (2-3 hours)

### 4.1 Create Assessment Status API

**File**: `app/api/assessment/status/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get most recent session
  const { data: session, error } = await supabase
    .from('cs_assessment_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // No assessment yet
  if (!session) {
    return NextResponse.json({ status: 'not_started' });
  }

  // Completed
  if (session.status === 'completed') {
    return NextResponse.json({
      status: 'completed',
      session_id: session.id,
      overall_score: session.overall_score,
      archetype: session.archetype
    });
  }

  // In progress
  const totalQuestions = 20; // Core assessment questions
  const answeredCount = (session.interview_transcript as any[]).filter(
    msg => msg.role === 'user'
  ).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  return NextResponse.json({
    status: 'in_progress',
    session_id: session.id,
    progress
  });
}
```

### 4.2 Create Assessment Status Card Component

**File**: `components/members/AssessmentStatusCard.tsx` (NEW)

```typescript
'use client';

import Link from 'next/link';
import useSWR from 'swr';

export function AssessmentStatusCard() {
  const { data, isLoading } = useSWR('/api/assessment/status');

  if (isLoading) {
    return (
      <div className="border-2 border-neon-purple/30 bg-background-lighter p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  // Not started
  if (data?.status === 'not_started') {
    return (
      <Link
        href="/assessment/start"
        className="block border-2 border-neon-purple/30 hover:border-neon-purple bg-background-lighter p-6 transition-all duration-300 hover:scale-105"
      >
        <h3 className="text-xl font-bold font-mono neon-purple mb-2">
          CS Assessment
        </h3>
        <p className="text-foreground-dim font-mono text-sm">
          Take our comprehensive skills assessment and join the talent bench
        </p>
      </Link>
    );
  }

  // In progress
  if (data?.status === 'in_progress') {
    return (
      <Link
        href="/assessment/interview"
        className="block border-2 border-neon-cyan/30 hover:border-neon-cyan bg-background-lighter p-6 transition-all duration-300 hover:scale-105"
      >
        <h3 className="text-xl font-bold font-mono neon-cyan mb-2">
          Resume Assessment
        </h3>
        <div className="mb-3">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${data.progress}%` }}
            />
          </div>
        </div>
        <p className="text-foreground-dim font-mono text-sm">
          Continue where you left off ({data.progress}% complete)
        </p>
      </Link>
    );
  }

  // Completed
  if (data?.status === 'completed') {
    return (
      <Link
        href={`/assessment/results/${data.session_id}`}
        className="block border-2 border-neon-magenta/30 hover:border-neon-magenta bg-background-lighter p-6 transition-all duration-300 hover:scale-105"
      >
        <h3 className="text-xl font-bold font-mono neon-magenta mb-2">
          View Your Results
        </h3>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-2xl font-bold text-white">{data.overall_score}/100</span>
          <span className="text-gray-300">{data.archetype}</span>
        </div>
        <p className="text-foreground-dim font-mono text-sm">
          Review scores, edit answers, or publish your profile
        </p>
      </Link>
    );
  }

  return null;
}
```

### 4.3 Update Members Page

**File**: `app/members/page.tsx`

Replace the static CS Assessment link (around line 130-140) with:

```typescript
import { AssessmentStatusCard } from '@/components/members/AssessmentStatusCard';

// In the grid of quick links:
<AssessmentStatusCard />
```

**Verification**:
- With no assessment: Shows "CS Assessment - Take our..."
- With in-progress: Shows "Resume Assessment" with progress bar
- With completed: Shows "View Your Results" with score/archetype

---

## Task 5: Results Actions & Navigation (1-2 hours)

### 5.1 Create Results Actions Component

**File**: `components/assessment/results/ResultsActions.tsx` (NEW)

```typescript
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ResultsActionsProps {
  sessionId: string;
  isPublished: boolean;
}

export function ResultsActions({ sessionId, isPublished }: ResultsActionsProps) {
  const router = useRouter();

  return (
    <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-8 mt-8">
      <h3 className="text-2xl font-bold text-white mb-6">What's Next?</h3>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Return to Members Area */}
        <Link
          href="/members"
          className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-center font-semibold"
        >
          ← Back to Members Area
        </Link>

        {/* Retake Assessment (future) */}
        <button
          disabled
          className="px-6 py-4 bg-gray-800/50 text-gray-500 rounded-lg cursor-not-allowed text-center font-semibold"
        >
          Retake Assessment (Coming Soon)
        </button>

        {/* Publish Profile (future - Phase 2) */}
        {!isPublished && (
          <button
            disabled
            className="px-6 py-4 bg-purple-800/50 text-purple-400 rounded-lg cursor-not-allowed text-center font-semibold"
          >
            Publish to Job Board (Phase 2)
          </button>
        )}

        {/* Download Results (future) */}
        <button
          disabled
          className="px-6 py-4 bg-gray-800/50 text-gray-500 rounded-lg cursor-not-allowed text-center font-semibold"
        >
          Download PDF (Coming Soon)
        </button>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

After all tasks complete:

- [ ] Core assessment loads with 20 questions across 4 sections
- [ ] Section timeline displays correctly
- [ ] Can navigate between sections via timeline
- [ ] Completed sections show checkmarks
- [ ] All 20 questions can be answered
- [ ] Assessment completes and redirects to results
- [ ] Results page shows:
  - [ ] Personality profile (MBTI + Enneagram)
  - [ ] Badge showcase
  - [ ] 3 category scores with subscores
  - [ ] AI orchestration breakdown
  - [ ] 14 dimension scores
  - [ ] Best-fit roles
  - [ ] Public summary
- [ ] Members page shows correct assessment status:
  - [ ] "Start Assessment" when not started
  - [ ] "Resume Assessment" with progress when in-progress
  - [ ] "View Results" with score when completed
- [ ] Navigation between pages works smoothly

---

## Deliverables

1. Interview page loads and displays core questions
2. Section timeline navigation functional
3. Enhanced results page with all new scoring displays
4. Smart assessment status card in members area
5. All components responsive and visually polished
6. TypeScript compiles with no errors
7. All navigation flows work correctly

**Ready for Phase 2**: Lightning Round UI, Absurdist Finale, Video Recording, Public Profiles

---

## Notes for Frontend Agent

- Work in `C:\Users\strac\dev\goodhang\goodhang-frontend-agent` directory
- Branch: `frontend-agent`
- Match existing design system (purple/blue gradients, neon colors, dark theme)
- Reference existing components for styling patterns
- Use existing hooks (`useSWR`, `useRouter`)
- Test in browser frequently during development
- Mobile-first responsive design
- Commit after each completed task
- If backend APIs not ready, mock the data structure

**Success Criteria**: Can complete 20-question core assessment and see enhanced results page with personality, categories, badges, AI orchestration, and 14 dimensions displayed beautifully.
