# Architecture - Renubu System Design

**Last Updated:** 2025-11-07
**Version:** 0.1
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
