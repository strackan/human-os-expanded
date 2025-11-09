# Architecture - Renubu System Design

**Last Updated:** 2025-11-08
**Version:** 1.5 (Talent Orchestration added)
**Audience:** Internal (Engineers, Technical Leads)

---

## Overview

This document describes the high-level architecture of the Renubu platform, including system design, service patterns, data flow, and key technical decisions.

---

## System Overview

### Technology Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase (PostgreSQL + Realtime + Auth)
- **AI:** Anthropic Claude (Sonnet, Opus, Haiku)
- **Deployment:** Vercel
- **Development:** Claude Code (agentification strategy)

---

## Architecture Layers

### 1. Frontend Layer (Next.js App Router)

```
app/
  ├── (auth)/          → Authentication flows
  ├── (dashboard)/     → Main application
  ├── api/             → API routes
  └── layout.tsx       → Root layout
```

**Key Patterns:**
- Server Components by default
- Client Components only when interactivity needed
- React Server Actions for mutations

### 2. Service Layer

```
src/lib/services/
  ├── WorkflowService.ts           → Workflow CRUD
  ├── WorkflowExecutionService.ts  → Runtime execution
  ├── WorkflowTaskService.ts       → Task management
  ├── CustomerService.ts           → Customer data
  ├── ProfileService.ts            → User profiles
  └── MCP Server/                  → Phase 0.1+
```

**Service Pattern:**
```typescript
export class MyService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async myMethod() {
    // RLS-enforced queries
    const { data, error } = await this.supabase
      .from('table')
      .select('*');

    if (error) throw error;
    return data;
  }
}
```

### 3. Data Layer (Supabase)

**Authentication:**
- Supabase Auth with Row Level Security (RLS)
- OAuth providers: Google
- Session management via cookies

**Database:**
- PostgreSQL with full-text search
- RLS policies enforce multi-tenancy
- Realtime subscriptions for live updates

**Storage:**
- Supabase Storage for file uploads (future)

---

## Key Architectural Decisions

### Decision 1: Service Layer Pattern (Nov 2025)
**Decision:** Centralized service classes instead of direct Supabase calls
**Rationale:**
- Testability (mock services)
- Reusability across API routes and Server Actions
- Type safety
- Business logic encapsulation

### Decision 2: Row Level Security (RLS) Enforcement
**Decision:** All data access through RLS, no bypass
**Rationale:**
- Security by default
- Multi-tenancy isolation
- Cannot accidentally leak data across users

### Decision 3: MCP Architecture (Phase 0.1)
**Decision:** Walled garden (marketplace-only MCP servers)
**Rationale:**
- Renubu is a hub platform with privileged access
- Different threat model than local-only tools
- Custom servers = high security risk
- See [MCP.md](./MCP.md) for details

### Decision 4: Agentification Strategy (Phase 0.2+)
**Decision:** Git worktrees + parallel agents + Queen Bee coordination
**Rationale:**
- 3x throughput (proven in Phase 0.2)
- Zero conflicts during execution
- Merge conflicts manageable (7.7% rate)
- See [LLM.md](./LLM.md) for details

---

## Data Flow

### Typical Request Flow

```
User Action
    ↓
Client Component (onClick handler)
    ↓
Server Action or API Route
    ↓
Service Layer (WorkflowService, etc.)
    ↓
Supabase (RLS-enforced query)
    ↓
Database (PostgreSQL)
    ↓
Response back up the chain
    ↓
Client Component (re-render)
```

### Workflow Execution Flow

```
User starts workflow
    ↓
WorkflowExecutionService.create()
    ↓
workflow_executions table (insert)
    ↓
Load first slide
    ↓
Render WorkflowExecutionClient
    ↓
User completes actions
    ↓
Transition to next slide
    ↓
...repeat until completion...
    ↓
Mark workflow as completed
    ↓
Optional: Check-in prompt (Phase 3)
```

---

## Scalability Considerations

### Current Scale
- Single-tenant demo mode
- ~10-100 users expected in Phase 1
- Small dataset (<10K records)

### Future Scaling (Post-Phase 1)
- Multi-tenant with RLS isolation
- Database indexing strategy
- Caching layer (React Query, SWR)
- Background jobs (workflow wake events)

---

## Security Architecture

### Authentication
- Supabase Auth (JWT-based)
- OAuth with Google
- Session cookies (httpOnly, secure)

### Authorization
- Row Level Security (RLS) policies
- Role-based permissions (admin, member, viewer)
- Service-level permission checks

### Data Protection
- All data encrypted at rest (Supabase default)
- HTTPS only (TLS 1.3)
- API rate limiting (Vercel + Supabase)

### MCP Security (Phase 0.1+)
- Marketplace-only servers (no custom URLs)
- Admin approval for all new servers
- Deno sandbox for code execution
- Audit logging for all operations
- See [MCP.md](./MCP.md)

---

## Performance Optimization

### Frontend
- Server Components reduce client bundle
- Code splitting (dynamic imports)
- Image optimization (next/image)

### Backend
- Database indexes on high-query columns
- Supabase connection pooling
- Efficient RLS policies

### AI Operations
- Model selection by task complexity
  - Haiku: Simple tasks, fast responses
  - Sonnet: General-purpose, balanced
  - Opus: Complex reasoning (rare)

---

## Monitoring & Observability

### Current (Phase 0)
- Vercel Analytics
- Supabase Logs
- TypeScript compilation errors

### Planned (Phase 1+)
- Error tracking (Sentry or similar)
- Performance monitoring (Web Vitals)
- User analytics (PostHog or similar)
- MCP operation audit logs

---

## Strategic Guardrails & Decision Log

### Roadmap Management

**Principle:** Ruthless prioritization over feature accumulation

**Roadmap Freeze Policy:**
- Active freeze periods during major releases
- No scope changes without explicit discussion
- New features → backlog (evaluated after current phase)
- Prevents thrash, maintains momentum

**Decision Rule:**
> If you want to change the roadmap during a freeze period, we pause and have a bigger conversation about execution capability.

### Weekly Accountability

**Format (5-10 min):**
```
Week of [Date]
✅ Completed Last Week: [List]
🔄 In Progress This Week: [List]
🚧 Blockers: [List]
📊 On Track for Deadline? [Yes/No + explanation]
🚩 Red Flags: [Any concerns]
```

**Red Flags to Watch:**
- 🚩 New feature ideas during freeze
- 🚩 Deadlines slipping
- 🚩 Scope expanding beyond approved plan
- 🚩 Design partners not using shipped features
- 🚩 Phase taking significantly longer than estimated

**Circuit Breakers:**
> If you see 2+ red flags in same week → STOP and re-evaluate entire strategy

### Customer Validation Gates

**Phase Start Requirements:**
- Must have clear customer pain point validated
- Must have 2+ potential design partners interested
- Must have measurable success criteria

**Mid-Phase Checkpoints:**
- Review customer feedback at week 4 (for 8-week phases)
- If not getting positive signals, stop and pivot
- Complexity circuit breakers must be respected

**Phase Completion Requirements:**
- Customer using the feature
- Success criteria met
- Ready for next design partner cohort

### Scope Expansion Triggers

**When to STOP a phase:**
- Taking >2x original estimate
- Requiring infrastructure we don't have
- Expanding beyond original approved scope
- Customers not finding it useful
- Revenue trajectory falling behind

**Recovery Plan:**
- Cut features to ship something useful
- Defer advanced capabilities to next phase
- Focus on core value proposition
- Document learnings

### Historical Decisions

**Major Reprioritizations:**
1. **Nov 5, 2025:** Weekly Planner → Workflow Snoozing priority swap
   - Reason: Customer validation, clearer value prop
   - Impact: 40-60h effort reduction via shared infrastructure

2. **Nov 6, 2025:** Weekly Planner removed from Q1, Human OS Check-Ins added
   - Reason: Zero demand for Planner, high demand for learning loop
   - Impact: Focused Q1 on competitive moat features

**Architectural Decisions:**
See individual sections above for:
- Next.js 15 + React Server Components
- Supabase for data + auth
- MCP marketplace (walled garden)
- Database-first documentation

3. **Nov 8, 2025:** Talent Orchestration System (Release 1.5)
   - Strategy: Dogfood-first, productize-later
   - Purpose: Hire founding operator + validate workflow orchestration
   - Timeline: Q1 2026 (Jan 6 - Feb 28)
   - Impact: Pushes Parking Lot to Mar, Human OS to Apr-May

---

## Release 1.5: Talent Orchestration System

**Strategic Context:**
First comprehensive workflow template, built to hire Renubu's founding operator while proving the product works.

**Core Architecture:**

### Interview System Design

**Philosophy:**
- Conversational AI (not rigid script)
- Adaptive questioning based on responses
- Coverage guarantees across 11 dimensions
- Real-time transcript storage

**11 Assessment Dimensions:**
1. IQ / Problem-solving
2. Personality type
3. Motivation style
4. Work history quality
5. Passions/dreams alignment
6. Culture fit (absurdity tolerance, vulnerability, chaos comfort)
7. Technical ability
8. GTM aptitude
9. Emotional intelligence
10. Empathy profile
11. Self-awareness

**AI Model Strategy:**
- Primary: Anthropic Claude Sonnet 4.5
- Interview conductor: Conversational, adaptive, time-aware (~20 min)
- Analysis engine: Multi-pass (dimension scoring → archetype → flags → recommendation)
- Streaming: Real-time chat interface with incremental responses

### Data Architecture

**New Tables:**
```sql
candidates (
  interview_transcript JSONB,  -- Full conversation [{role, content, timestamp}]
  analysis JSONB,               -- AI scores and insights
  archetype TEXT,               -- Primary classification
  overall_score INTEGER,        -- 0-100 weighted composite
  dimensions JSONB              -- Multi-dimensional scores
)

talent_bench (
  archetype_primary TEXT,
  archetype_confidence TEXT,    -- 'high', 'medium', 'low'
  best_fit_roles TEXT[]
)
```

**Integration with Existing:**
- Leverages `workflow_executions` for interview sessions
- Uses `workflow_tasks` for follow-up actions
- Extends `profiles` for interviewer/hiring manager roles
- RLS policies for multi-tenant candidate data

### Component Reuse Strategy

**What We're Reusing:**
- Form artifacts (application intake)
- Workflow orchestration patterns
- Auth & RLS infrastructure
- Service layer patterns

**What's Net New:**
- Transcription capability (real-time chat with AI)
- Multi-pass analysis engine
- Candidate assessment visualization
- Interview conversation management

**Decision Rationale:**
Don't force-fit workflows where they don't belong. Use form artifacts heavily, add transcription as new primitive. Build clean interview-specific services rather than contorting existing workflow engine.

### Routing Logic

```typescript
Scoring Weights (overall_score):
- IQ: 20%
- Culture Fit: 15%
- Execution Bias: 15%
- Technical OR GTM (higher): 15%
- Emotional Intelligence: 10%
- Work History: 10%
- Self-Awareness: 10%
- Remaining dimensions: 5%

Routing:
- Score ≥90 + Culture≥80 → Top 1% (immediate contact)
- Score ≥75 + no red flags → Top 10% (benched)
- Otherwise → Pass (polite rejection)
```

### Archetype Classification

**6 Primary Archetypes:**
1. Technical Builder
2. GTM Operator
3. Creative Strategist
4. Execution Machine
5. Generalist Orchestrator
6. Domain Expert

Classification informs role fit recommendations and bench organization.

### Privacy & Compliance

**Considerations:**
- GDPR/CCPA compliance for candidate data
- Data retention policies (transcripts, recordings)
- Bias detection in AI analysis
- Audit trail for all routing decisions
- Candidate data more sensitive than customer data

**Implementation:**
- Encrypt interview transcripts at rest
- Anonymize data in analytics
- Regular bias audits of AI scoring
- Clear data deletion process
- Candidate access to their own data

### Success Metrics

**MVP Complete When:**
- Candidates say "felt like real conversation"
- Top-scored candidates actually impressive
- No false negatives (missing great people)
- Dashboard usable without training
- Analysis completes in <30 seconds

**Phase 1-4 Deliverables (Q1 2026):**
- Database schema + services (16h)
- Landing page + interview experience (48h)
- AI analysis engine (16h)
- Dashboard (deferred to Phase 5)

**Phases 5-6 (Release 1.5 Future):**
- Dashboard (Phase 5): 8h
- Email automation (Phase 6): 8h

---

## Release 1.6: Return Visit System - Longitudinal Intelligence

**Strategic Context:**
Transforms Talent Orchestration from one-time screening into ongoing relationship intelligence.
Implements "Guy for That" for recruiting - track people over time, remember context, build relationships.

**Timeline:** Q1 2026 (Mar 2 - Mar 21, 2026)
**Effort:** 24 hours (Phase 7)

**Core Concept:**
Candidates return for check-ins (3-6 months later). System:
- Remembers all previous interactions
- References specific details (projects, life context, personal updates)
- Updates intelligence file with new information
- Tracks relationship evolution over time
- Calculates relationship strength (cold/warm/hot)

**Makes candidates say:** "It actually remembered me. No one does that."

### Intelligence File Architecture

**Purpose:** Synthesized profile that evolves over time across all sessions

**Structure:**
```typescript
interface IntelligenceFile {
  // Identity
  name: string;
  email: string;
  linkedin_url?: string;

  // Professional Profile (evolving)
  current_role: string;
  company: string;
  career_trajectory: Array<{
    role: string;
    company: string;
    timeframe: string;
    learned_from_session: string; // which session revealed this
  }>;

  // Skills & Expertise (evolving)
  technical_skills: string[];
  domain_expertise: string[];
  skill_evolution: Array<{
    skill: string;
    added_date: string;
    proficiency: 'learning' | 'competent' | 'expert';
  }>;

  // Projects & Artifacts (accumulating)
  projects: Array<{
    name: string;
    url?: string;
    description: string;
    status: 'active' | 'completed' | 'abandoned';
    learned_from_session: string;
  }>;

  // Personal Context (for relationship building)
  life_context: {
    location?: string;
    family?: string[]; // ["Lucy (7)", "Marcus (4)"]
    hobbies?: string[];
    last_updated: string;
  };

  // Motivations & Goals (evolving)
  current_motivation: {
    seeking: string; // "founding role", "consulting", "exploring"
    ideal_role: string;
    deal_breakers: string[];
    must_haves: string[];
    updated: string;
  };

  // Relationship Metadata
  first_contact: string;
  last_contact: string;
  total_sessions: number;
  relationship_strength: 'cold' | 'warm' | 'hot';

  // Session Summaries
  session_timeline: Array<{
    session_id: string;
    date: string;
    type: 'initial' | 'check_in' | 'deep_dive';
    key_updates: string[];
    sentiment: 'excited' | 'exploring' | 'frustrated' | 'content';
  }>;

  // AI's Understanding (meta)
  archetype: string;
  archetype_confidence: 'high' | 'medium' | 'low';
  strengths: string[];
  growth_areas: string[];
  best_fit_at_renubu: string[];
}
```

### Session Types

**1. Initial Interview**
- Full 11-dimension assessment
- 20 minutes, ~15 exchanges
- Creates first intelligence file
- Sets baseline understanding
- Stores in `interview_sessions` table with type='initial'

**2. Check-In**
- 5-10 minutes, lighter conversation
- References previous sessions
- Updates intelligence file
- Tracks changes and evolution
- Strengthens relationship
- Stores in `interview_sessions` table with type='check_in'

**3. Deep Dive (Future)**
- Technical/role-specific assessment
- Project-based evaluation
- Final interview round
- Stores in `interview_sessions` table with type='deep_dive'

### Data Architecture

**New Tables:**
```sql
interview_sessions (
  id UUID,
  candidate_id UUID REFERENCES candidates(id),
  session_type TEXT, -- 'initial', 'check_in', 'deep_dive'
  transcript JSONB,
  analysis JSONB,
  updates JSONB, -- what changed since last session
  session_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  key_insights TEXT[],
  sentiment TEXT
)
```

**Enhanced Candidates Table:**
```sql
candidates (
  -- Existing columns...

  -- NEW: Longitudinal tracking
  intelligence_file JSONB, -- synthesized profile across all sessions
  last_check_in TIMESTAMPTZ,
  check_in_count INTEGER,
  relationship_strength TEXT -- 'cold', 'warm', 'hot'
)
```

### Relationship Strength Calculation

**Algorithm:**
```typescript
function calculateRelationshipStrength(candidate): 'cold' | 'warm' | 'hot' {
  const daysSinceContact = daysAgo(candidate.last_check_in);
  const sessionCount = candidate.check_in_count + 1; // +1 for initial
  const isActivelySeeking = candidate.intelligence_file.current_motivation.seeking !== 'just staying connected';

  if (daysSinceContact > 180 || sessionCount === 1) {
    return 'cold';
  }

  if (sessionCount >= 3 && daysSinceContact <= 90 && isActivelySeeking) {
    return 'hot';
  }

  if (sessionCount >= 2 || daysSinceContact <= 180) {
    return 'warm';
  }

  return 'cold';
}
```

**Criteria:**
- **Cold:** >6 months since contact OR only 1 session
- **Warm:** 2-3 sessions OR contacted within 6 months
- **Hot:** 3+ sessions AND contacted within 3 months AND actively seeking

### Return Visit Flow

```
1. Candidate visits /join
2. Sees "Already interviewed?" → clicks "Continue your conversation"
3. Redirects to /join/returning
4. Enters email for lookup
5. System finds candidate + loads intelligence file
6. Creates new workflow_execution (type: 'talent_check_in')
7. Creates new interview_session (type: 'check_in')
8. AI greets warmly with specific personal details:
   "Hey Giselle! Great to see you again. How are Lucy and Marcus doing?
    Last time we talked in June, you were building that SaaS analytics tool..."
9. 5-10 minute check-in conversation
10. Extracts updates from conversation
11. Updates intelligence_file with changes
12. Calculates new relationship_strength
13. Creates interview_session record
14. Reassesses fit, notifies if opportunity exists
```

### New Services

**IntelligenceFileService:**
```typescript
class IntelligenceFileService {
  // Synthesize intelligence file from all sessions
  async synthesizeIntelligenceFile(candidateId: string): Promise<IntelligenceFile>;

  // Load context for check-in conversation prompt
  async getCheckInContext(candidateId: string): Promise<string>;

  // Update file after check-in session
  async updateFromSession(candidateId: string, sessionId: string): Promise<void>;

  // Calculate relationship strength
  async calculateRelationshipStrength(candidateId: string): Promise<'cold' | 'warm' | 'hot'>;
}
```

**InterviewSessionService:**
```typescript
class InterviewSessionService {
  // Create new session
  async createSession(candidateId: string, type: SessionType): Promise<InterviewSession>;

  // Get all sessions for candidate
  async getSessionsForCandidate(candidateId: string): Promise<InterviewSession[]>;

  // Get latest session
  async getLatestSession(candidateId: string): Promise<InterviewSession | null>;

  // Extract key insights from session
  async extractInsights(sessionId: string): Promise<string[]>;
}
```

### New Components

**Pages:**
- `/join/returning/page.tsx` - Email lookup for return visits
- Enhanced `/join/page.tsx` - Adds "Already interviewed?" section

**Components:**
- `IntelligenceTimeline.tsx` - Session history visualization
- `EmailLookup.tsx` - Return visit email lookup form
- `CheckInSlide.tsx` - Check-in conversation workflow slide

**Prompts:**
- `check-in-prompts.ts` - Return visit conversation logic

### Success Metrics

**Return Visit Indicators:**
- % of candidates who return for check-ins
- Average time between check-ins
- Relationship strength distribution (target: 40% warm, 10% hot)
- Quality of intelligence file synthesis
- Hiring rate from returning candidates vs. new

**Quality Indicators:**
- Returning candidates say "it actually remembered me"
- Check-ins feel natural, not robotic
- Intelligence files capture meaningful evolution
- Candidates want to come back in 3-6 months
- Dashboard shows rich relationship history

**MVP Complete When:**
- Email lookup finds existing candidates
- Intelligence file loads with all session history
- Check-in conversation references specific previous details
- Session creates new interview_session record
- Intelligence file updates after check-in
- Relationship strength calculates correctly
- Timeline view shows all sessions
- Dashboard shows "last check-in" date

### Privacy & Compliance

**Additional Considerations for Longitudinal Data:**
- Clear data retention policy (how long do we keep old sessions?)
- Candidate ability to view/export their intelligence file
- Candidate ability to request deletion (GDPR right to be forgotten)
- Transparency about what we remember and why
- Regular audits of intelligence file accuracy

**Implementation:**
- Provide `/api/me/intelligence-file` endpoint for candidates to view their data
- Implement data export in JSON format
- Implement deletion with cascade to interview_sessions
- Add "last reviewed" timestamp to intelligence file

---

## Related Documentation

- [SCHEMA.md](./SCHEMA.md) - Database schema details
- [API.md](./API.md) - API reference
- [MCP.md](./MCP.md) - MCP architecture
- [LLM.md](./LLM.md) - AI strategy
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment architecture
- [ROADMAP.md](./ROADMAP.md) - Product roadmap (auto-generated)

---

**Note:** This is a living document. Update as architecture evolves.
