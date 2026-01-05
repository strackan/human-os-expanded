# Hire Score Integration Plan

## Overview

Integrate a "Hire Score" calculation into the GoodHang assessment flow. The Hire Score evaluates how well a member matches potential job opportunities based on their LinkedIn profile data.

## Source

The algorithm was moved from `guyforthat/guyforthat-jobsearch-standalone` and is now located at:
- `src/lib/scoring/hire-score-algorithm.js`

## Concept

When a user completes a GoodHang assessment (authenticated via LinkedIn OAuth), we can optionally:
1. Scrape/fetch their LinkedIn profile data
2. Calculate a "Hire Score" based on user-defined preferences
3. Display this alongside their assessment archetype results

## Current Algorithm Capabilities

The `HireScoreCalculator` class calculates a 0-100 score based on:

### Persona Match (0-40 points)
- Job title matching (exact: 25pts, fuzzy: 18-20pts, partial: 8-15pts)
- Seniority level matching (exact: 10pts, adjacent: 4-7pts)
- Skills overlap (5pts max)

### Company Match (0-40 points)
- Industry match (exact: 15pts, partial: 10pts)
- Company size match (10pts)
- Company stage match (exact: 10pts, adjacent: 6pts)
- Location match (5pts)
- Deal-breaker detection (excluded companies/industries)

### Hiring Signal Bonus (0-20 points)
- Posted "#hiring" recently (20pts)
- Is recruiter/hiring manager (15pts)
- Company has open roles (4-10pts)
- Recent job change (5pts)

---

## Implementation Steps

### Phase 1: TypeScript Conversion

**Goal:** Convert JS algorithm to TypeScript with proper types

**Files to create:**
```
src/lib/scoring/
├── hire-score-algorithm.ts    # Converted algorithm
├── types.ts                   # Type definitions
├── index.ts                   # Exports
└── __tests__/
    └── hire-score.test.ts     # Unit tests
```

**Type definitions:**
```typescript
// src/lib/scoring/types.ts

export interface HireScorePreferences {
  ideal_job_titles: string[];
  ideal_seniority_levels: string[];
  ideal_skills: string[];
  target_industries: string[];
  target_company_sizes: string[];
  target_company_stages: string[];
  target_locations: string[];
  remote_preference: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  excluded_companies: string[];
  excluded_industries: string[];
}

export interface Contact {
  job_title: string;
  seniority_level: string;
  skills: string[];
  is_recruiter: boolean;
  is_hiring_manager: boolean;
  posted_hiring_recently: boolean;
  recent_job_change: boolean;
}

export interface Company {
  name: string;
  industry: string;
  company_size: string;
  company_stage: string;
  headquarters: string;
  locations: string[];
  open_roles_count: number;
}

export interface HireScoreResult {
  hire_score: number;
  persona_match_score: number;
  company_match_score: number;
  hiring_signal_bonus: number;
}
```

### Phase 2: Database Schema

**Add Prisma schema:**
```prisma
// Add to prisma/schema.prisma

model HireScorePreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])

  idealJobTitles        String[]
  idealSeniorityLevels  String[]
  idealSkills           String[]
  targetIndustries      String[]
  targetCompanySizes    String[]
  targetCompanyStages   String[]
  targetLocations       String[]
  remotePreference      String?
  excludedCompanies     String[]
  excludedIndustries    String[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model HireScoreResult {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])

  totalScore          Int
  personaMatchScore   Int
  companyMatchScore   Int
  hiringSignalBonus   Int

  calculatedAt        DateTime @default(now())
}
```

### Phase 3: API Routes

**Create API endpoints:**
```
app/api/hire-score/
├── preferences/
│   └── route.ts           # GET/POST preferences
├── calculate/
│   └── route.ts           # POST calculate score
└── history/
    └── route.ts           # GET score history
```

**Calculate endpoint:**
```typescript
// app/api/hire-score/calculate/route.ts
import { HireScoreCalculator } from '@/lib/scoring';
import { getLinkedInProfile } from '@/lib/linkedin';

export async function POST(req: Request) {
  const { preferences } = await req.json();

  // Get LinkedIn profile from OAuth session
  const profile = await getLinkedInProfile();

  // Map to Contact/Company objects
  const contact = mapProfileToContact(profile);
  const company = mapProfileToCompany(profile);

  // Calculate score
  const calculator = new HireScoreCalculator(preferences);
  const result = calculator.calculateScore(contact, company);

  // Store result
  await db.hireScoreResult.create({ data: { ...result, userId } });

  return Response.json(result);
}
```

### Phase 4: UI Components

**Files to create:**
```
app/assessment/
└── results/
    └── components/
        ├── HireScoreCard.tsx         # Display score with breakdown
        ├── HireScorePreferences.tsx  # Preferences form
        └── HireScoreHistory.tsx      # Historical scores
```

**Results page integration:**
```typescript
// app/assessment/results/page.tsx
import { HireScoreCard } from './components/HireScoreCard';

export default function ResultsPage() {
  return (
    <div>
      {/* Existing archetype results */}
      <ArchetypeResults />

      {/* New hire score section */}
      <HireScoreCard
        score={hireScore}
        breakdown={{
          persona: personaMatch,
          company: companyMatch,
          hiring: hiringBonus
        }}
      />
    </div>
  );
}
```

### Phase 5: LinkedIn Data Integration

**Options for getting LinkedIn profile data:**

1. **OAuth Profile (Limited)**
   - Use existing LinkedIn OAuth token
   - Only basic profile fields available
   - Best for MVP

2. **User Import**
   - Let user paste their LinkedIn profile URL
   - Fetch via proxy (or ask for data export)
   - More complete data

3. **GuyForThat Extension Sync**
   - If user has GuyForThat installed
   - Query Supabase for their enriched profile
   - Most complete data

---

## API Design

### Endpoints

```
POST /api/hire-score/preferences
  - Save user's ideal job/company preferences

GET /api/hire-score/preferences
  - Retrieve saved preferences

POST /api/hire-score/calculate
  - Calculate hire score for current user
  - Uses LinkedIn OAuth profile + preferences

GET /api/hire-score/history
  - Get historical hire scores for trend analysis
```

### Request/Response Examples

```typescript
// POST /api/hire-score/calculate
{
  "preferences": {
    "ideal_job_titles": ["Software Engineer", "Full Stack Developer"],
    "target_industries": ["SaaS", "Fintech"],
    "target_company_sizes": ["startup", "mid-market"]
  }
}

// Response
{
  "totalScore": 72,
  "breakdown": {
    "personaMatch": 32,
    "companyMatch": 28,
    "hiringBonus": 12
  },
  "recommendations": [
    "Your current company matches your target industries well",
    "Consider connecting with hiring managers at target companies"
  ]
}
```

---

## Testing Plan

1. **Unit tests** for HireScoreCalculator
   - Test each scoring component
   - Test edge cases (null values, empty arrays)
   - Test deal-breaker logic

2. **Integration tests** for API routes
   - Test preference CRUD
   - Test calculation with mock LinkedIn data

3. **E2E tests** for UI flow
   - Test preferences form submission
   - Test score display on results page

---

## Dependencies

- LinkedIn OAuth (already implemented for assessment)
- Prisma for database
- Next.js API routes
- React components for UI

---

## Notes

- The algorithm uses Dice coefficient for fuzzy string matching
- Seniority hierarchy is built-in (intern → entry → ... → C-level)
- Company size buckets map to employee count ranges
- Deal-breakers return -100 to disqualify entirely

---

## Files

**Existing:**
- `src/lib/scoring/hire-score-algorithm.js` - Original algorithm (to be converted to TS)

**To Create:**
- `src/lib/scoring/hire-score-algorithm.ts`
- `src/lib/scoring/types.ts`
- `src/lib/scoring/index.ts`
- `src/lib/scoring/__tests__/hire-score.test.ts`
- `app/api/hire-score/preferences/route.ts`
- `app/api/hire-score/calculate/route.ts`
- `app/assessment/results/components/HireScoreCard.tsx`
- `app/assessment/results/components/HireScorePreferences.tsx`
- Prisma schema additions
