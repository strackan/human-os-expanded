# Renubu Development Guide

**Last Updated:** 2025-11-05
**Purpose:** Technical architecture and development strategy
**Audience:** Developers and AI agents

---

## 🏗️ System Architecture

### Tech Stack

**Frontend:**
- Next.js 15.5.2 (App Router, React Server Components)
- React 19.0.0
- TypeScript 5.9.3
- Tailwind CSS for styling

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth + RLS)
- Handlebars for templating

**Infrastructure:**
- Vercel (hosting, edge functions)
- GitHub (version control, CI/CD)
- Docker (planned for MCP sandbox)

**Development:**
- pnpm package manager
- Git worktrees for parallel development
- Demo mode for local iteration

### Project Structure

```
renubu/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/         # Main dashboard
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── workflows/         # Workflow UI
│   │   └── artifacts/         # Artifact components
│   ├── lib/
│   │   ├── services/          # Business logic services
│   │   ├── workflows/         # Workflow definitions
│   │   ├── supabase/          # Database clients
│   │   └── auth-config.ts     # Auth configuration
│   └── config/                # Application config
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed*.sql              # Seed data
├── docs/                       # Documentation
│   ├── PLAN.md               # Current plan
│   ├── STATE.md              # Current state
│   ├── AGENT-GUIDE.md        # Agent guide
│   ├── DEV-GUIDE.md          # This file
│   └── snapshots/            # Historical docs
└── public/                    # Static assets
```

---

## 🚀 Agentification Strategy

### Philosophy

**Goal:** 50-80% velocity boost through AI-human collaboration

**Approach:** Three-tier orchestration model

```
┌─────────────────────┐
│   Human (Justin)    │  Business validation, staging→prod approval
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Queen Bee (Agent)  │  Task decomposition, code review, coordination
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Workers (Agents 1-10)│ Execute tasks in git worktrees (parallel)
└─────────────────────┘
```

### Three Tiers

**Tier 1: Human (Business Lead)**
- Validates product direction
- Makes final deployment decisions (staging → production)
- Resolves ambiguous requirements
- Design partner communication

**Tier 2: Queen Bee Agent (Technical Lead)**
- Reads master plan (GitHub Projects)
- Decomposes large tasks into agent-friendly units
- Assigns work to worker agents
- Reviews all code before human review
- Daily coordination and status updates
- Identifies blockers and escalates

**Tier 3: Worker Agents (Execution)**
- Execute well-defined tasks
- Work in isolated git worktrees (zero conflicts)
- Create PRs linking to GitHub issues
- Report completion to Queen Bee
- Can work up to 10 agents in parallel

### Single Source of Truth

**GitHub Issues/Projects = Master Task List**

Why not markdown?
- ✅ API for programmatic access
- ✅ Rich features (dependencies, labels, time tracking)
- ✅ No merge conflicts
- ✅ Visual boards for humans
- ✅ Notifications and webhooks

**Documents (4 living docs) = Strategy & Context**
- PLAN.md - What & why
- STATE.md - What exists
- AGENT-GUIDE.md - How to work
- DEV-GUIDE.md - Technical details

### Git Worktrees for True Parallelism

**Problem:** Multiple agents editing same files = merge conflicts

**Solution:** Git worktrees = isolated directories

```bash
# Main repo
/renubu               (main branch)

# Agent worktrees
/renubu-agent-1       (feature/snooze-dialog)
/renubu-agent-2       (feature/condition-evaluator)
/renubu-agent-3       (feature/api-routes)

# Each agent:
# - Has own directory
# - Works on own branch
# - Zero conflicts with others
# - Can run dev server on different ports
```

**Benefits:**
- ✅ True parallelism (10 agents simultaneously)
- ✅ Zero merge conflicts
- ✅ Independent testing per agent
- ✅ Clean context per task

### Review Separation

**Why:** Agent reviewing its own code misses issues

**Strategy:**
- Worker Agent 1 writes code
- Queen Bee Agent reviews code
- Human does final review if needed

**Result:** 90% better code quality vs self-review

### Expected Velocity Gains

**Phase 0 (Baseline):**
- Git worktrees + parallel agents = 22-36% boost
- Effective capacity: 272-302h from 220h investment

**Phase 0.1 (With MCP):**
- Code execution + token reduction = additional 30-50%
- Total boost: 50-80%
- Effective capacity: 333-408h from 220h investment

**Measurement:** See Velocity Tracking section below

---

## 📊 Velocity Tracking

### Core Metrics

**1. Velocity (How fast are we moving?)**
```
Velocity = (Work Completed) / (Calendar Time) × 100%

Target: 122-136% (22-36% boost baseline)
With MCP: 150-180% (50-80% boost)

Example:
- Calendar time: 40 hours (1 week)
- Work completed: 54 hours (with 35% boost)
- Velocity: 135%
```

**2. Accuracy (How good are our estimates?)**
```
Accuracy = 1 - |Actual - Estimated| / Estimated × 100%

Target: 80%+ average

Example:
- Estimated: 8h
- Actual: 10h
- Accuracy: 1 - |10-8|/8 × 100% = 75%
```

**3. Quality Score (How good is the code?)**
```
Quality Score = (Dimensions Passing) / 8 × 100%

8 Dimensions:
1. Correctness (works as intended)
2. Maintainability (clean, understandable)
3. Performance (fast enough)
4. Security (no vulnerabilities)
5. Test Coverage (60%+ critical paths)
6. Documentation (clear comments)
7. Style (follows conventions)
8. Integration (works with existing code)

Target: 85%+ (7/8 dimensions passing)
```

**4. Agent Utilization (Are agents working efficiently?)**
```
Agent Utilization = (Agent Hours Working) / (Agent Hours Available) × 100%

Target: 70%+ (some downtime expected for reviews, coordination)
```

**5. Conflict Rate (Are worktrees working?)**
```
Conflict Rate = (PRs with Merge Conflicts) / (Total PRs) × 100%

Target: <5% (worktrees should prevent conflicts)
```

### Tracking Process

**Weekly Velocity Report (Every Friday):**

```markdown
📊 Weekly Velocity Report - Week of Nov 13

🎯 Planned Work:
- Task 1: SnoozeDialog (4h estimated)
- Task 2: ConditionEvaluator (8h estimated)
- Task 3: API routes (4h estimated)
Total planned: 16h

✅ Completed:
- Task 1: 3.5h actual (DONE) ✅
- Task 2: 9h actual (DONE) ✅
Total completed: 12.5h

🔄 In Progress:
- Task 3: 2h spent, 2h remaining (50% done)

📈 Metrics:
- Velocity: 78% (12.5h / 16h)
- Accuracy: 88% average
- Quality: 90% (7.2/8 dimensions)
- Agent Utilization: 75%
- Conflict Rate: 0%

💭 Insights:
- ConditionEvaluator took longer due to edge cases
- SnoozeDialog came in under estimate (reused components)
- Zero conflicts with git worktrees working great

🎯 Next Week Plan:
- Task A: WorkflowDashboard (6h)
- Task B: Intel integration (8h)
- Task C: Testing (2h)
Total: 16h
```

### Task Categorization

**Agent-Friendly Tasks (70-85% completion rate):**
- OAuth implementation
- Database queries
- Component structure
- API routes
- Test writing
- Documentation

**Human-Required Tasks (review and guidance needed):**
- UX/UI design decisions
- Complex state management
- Performance optimization
- Security review
- Product direction

### Hour Tracking Template

```markdown
| Task | Type | Estimate | Actual | Variance | Quality | Notes |
|------|------|----------|--------|----------|---------|-------|
| SnoozeDialog | Agent | 4h | 3.5h | -12.5% | 8/8 | Reused components |
| ConditionEval | Agent | 8h | 9h | +12.5% | 7/8 | Edge cases complex |
| API Routes | Agent | 4h | 4h | 0% | 8/8 | On target |
```

---

## 🔐 Security

### Authentication

**Supabase Auth:**
- Email/password
- OAuth providers (Google for calendar)
- JWT tokens
- Row Level Security (RLS)

**Demo Mode:**
- Only enabled on localhost
- Service role key bypasses RLS
- Force-disabled on production
- Visual badge indicator

**Best Practices:**
- Always use RLS policies
- Never expose service role key to client
- Validate all API inputs
- Use parameterized queries

### API Security

**All API routes should:**
1. Validate authentication
2. Check authorization (user owns resource)
3. Validate input (Zod schemas)
4. Sanitize output
5. Rate limit (if needed)

**Example:**
```typescript
export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Input validation
  const body = await request.json()
  const schema = z.object({ workflowId: z.string().uuid() })
  const validated = schema.parse(body)

  // 3. Authorization check
  const { data: workflow } = await supabase
    .from('workflows')
    .select('user_id')
    .eq('id', validated.workflowId)
    .single()

  if (workflow?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Execute logic
  // ...
}
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
        /\
       /  \  E2E Tests (Few)
      /----\
     /      \  Integration Tests (Some)
    /--------\
   /          \  Unit Tests (Many)
  /____________\
```

**Unit Tests (60% of tests):**
- Services, utilities, components
- Fast, isolated, deterministic
- Jest + React Testing Library

**Integration Tests (30% of tests):**
- API routes, database queries
- Test with real database (staging)
- Slower but high confidence

**E2E Tests (10% of tests):**
- Critical user flows
- Playwright or Cypress
- Slowest but catches UI issues

### Coverage Targets

**Critical Paths (60%+ coverage):**
- Authentication flows
- Workflow snooze logic
- Condition evaluation
- Payment/billing (when added)

**Nice to Have (40%+ coverage):**
- UI components
- Dashboard views
- Reporting

### Running Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

---

## 🎨 Code Style

### TypeScript

**Use strict types:**
```typescript
// ✅ Good
interface User {
  id: string
  email: string
  name: string | null
}

// ❌ Bad
interface User {
  id: any
  email: string
  name?: string
}
```

**Prefer const over let:**
```typescript
// ✅ Good
const users = await getUsers()

// ❌ Bad
let users = await getUsers()
```

### Components

**Use functional components:**
```typescript
// ✅ Good
export function SnoozeDialog({ workflowId }: Props) {
  // ...
}

// ❌ Bad
export class SnoozeDialog extends React.Component {
  // ...
}
```

**Co-locate files:**
```
components/
  SnoozeDialog/
    SnoozeDialog.tsx
    SnoozeDialog.test.tsx
    SnoozeDialog.module.css
    index.ts
```

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `types.ts` or `types/index.ts`

**Variables:**
- Constants: `SCREAMING_SNAKE_CASE`
- Variables: `camelCase`
- Components: `PascalCase`
- Types/Interfaces: `PascalCase`

---

## 🔗 Related Documentation

- `PLAN.md` - Current development plan
- `STATE.md` - What's currently built
- `AGENT-GUIDE.md` - How to work here
- `snapshots/` - Historical documentation

---

**Document Status:** Living document (updated when architecture changes)
**Next Update:** After Phase 0.1 (Nov 22) with MCP architecture details
