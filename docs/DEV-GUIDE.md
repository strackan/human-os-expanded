# Development Guide - Renubu

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** LLM Agents + Human Developers

---

## Table of Contents

### Part I: For LLM Agents
- Quick Start for Agents
- Codebase Navigation
- Common Development Tasks
- Code Patterns & Conventions
- Testing & Validation
- Commit & PR Guidelines

### Part II: For Human Developers
- Local Development Setup
- Architecture Overview
- Deployment Process
- Debugging & Tools
- Team Workflows

---

# PART I: FOR LLM AGENTS

**Purpose:** This section helps AI agents (Claude Code, future agents) work effectively in the Renubu codebase.

---

## 🚀 Quick Start for Agents

### Environment Check
```bash
# Verify you're in the right place
pwd  # Should be /path/to/renubu

# Check git status
git status  # Should be on main branch, clean working tree

# Verify dependencies
npm ls next react typescript  # Should show installed versions
```

### Before You Start Any Task

1. **Read the plan:**
   ```bash
   # Check current phase and priorities
   cat docs/PLAN.md | head -50
   ```

2. **Check existing state:**
   ```bash
   cat docs/STATE.md  # What's already built
   ```

3. **Review related docs:**
   - `docs/ARCHITECTURE.md` - System design
   - `docs/SCHEMA.md` - Database structure
   - `docs/API.md` - API reference
   - `docs/MCP.md` - MCP operations
   - `docs/LLM.md` - AI strategy

4. **Understand the feature scope** - Check `features` table or `docs/FEATURES.md`

---

## 📁 Codebase Navigation

### Key Directories

```
renubu/
├── src/
│   ├── app/                    # Next.js App Router (routes + pages)
│   │   ├── (dashboard)/       # Main app (requires auth)
│   │   ├── (auth)/            # Auth flows (signin, signup)
│   │   └── api/               # API routes
│   │
│   ├── components/             # React components
│   │   ├── artifacts/         # Workflow artifacts (UI outputs)
│   │   ├── workflows/         # Workflow UI components
│   │   ├── ui/                # Reusable UI components
│   │   └── auth/              # Auth-related components
│   │
│   ├── lib/                    # Business logic & utilities
│   │   ├── services/          # Service classes (database operations)
│   │   ├── workflows/         # Workflow definitions
│   │   ├── constants/         # Centralized constants
│   │   ├── supabase/          # Supabase clients
│   │   └── utils/             # Helper functions
│   │
│   └── types/                  # TypeScript type definitions
│
├── supabase/
│   └── migrations/             # Database migrations (SQL)
│
└── docs/                       # Documentation (living documents)
    ├── ARCHITECTURE.md         # System architecture
    ├── SCHEMA.md              # Database schema
    ├── API.md                 # API reference
    ├── MCP.md                 # MCP integration
    ├── WORKFLOWS.md           # Workflow catalog
    └── [others]
```

### Finding Specific Functionality

**Need to work with workflows?**
```
src/lib/workflows/              # Workflow definitions
src/lib/services/Workflow*.ts  # Workflow services
src/components/workflows/       # Workflow UI
```

**Need to work with database?**
```
supabase/migrations/            # Schema changes
src/lib/services/               # Data access layer
src/lib/constants/database.ts  # Table/column constants
```

**Need to create UI components?**
```
src/components/ui/              # Reusable components
src/components/artifacts/       # Workflow-specific UI
```

**Need to create API endpoints?**
```
src/app/api/                    # API routes
```

---

## 🛠️ Common Development Tasks

### Task 1: Add a New Database Table

**Steps:**
1. Create migration file:
   ```bash
   # Naming: YYYYMMDDHHMMSS_descriptive_name.sql
   touch supabase/migrations/20251107120000_my_new_table.sql
   ```

2. Write migration following pattern from `docs/SCHEMA.md`:
   ```sql
   CREATE TABLE my_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     -- columns...
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

   -- RLS policy
   CREATE POLICY "Users see own data"
     ON my_table FOR SELECT
     USING (user_id = auth.uid());

   -- Indexes
   CREATE INDEX idx_my_table_user_id ON my_table(user_id);

   -- Trigger
   CREATE TRIGGER my_table_updated_at
     BEFORE UPDATE ON my_table
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```

3. Add constants to `src/lib/constants/database.ts`:
   ```typescript
   export const DB_TABLES = {
     // ...existing
     MY_TABLE: 'my_table',
   };

   export const DB_COLUMNS = {
     // ...existing
     MY_COLUMN: 'my_column',
   };
   ```

4. Update `docs/SCHEMA.md` with table documentation

5. Test migration locally (if Docker available):
   ```bash
   npx supabase db reset
   ```

### Task 2: Create a New Service

**Steps:**
1. Create service file:
   ```bash
   touch src/lib/services/MyService.ts
   ```

2. Follow service pattern:
   ```typescript
   import { SupabaseClient } from '@supabase/supabase-js';
   import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';

   export class MyService {
     private supabase: SupabaseClient;

     constructor(supabase: SupabaseClient) {
       this.supabase = supabase;
     }

     async getMyData(userId: string) {
       const { data, error } = await this.supabase
         .from(DB_TABLES.MY_TABLE)
         .select('*')
         .eq(DB_COLUMNS.USER_ID, userId);

       if (error) throw error;
       return data;
     }
   }
   ```

3. Use RLS-enforced queries (never use service role client from API routes)

4. Add types in `src/types/` if needed

### Task 3: Create an API Route

**Steps:**
1. Create route file:
   ```bash
   # For GET /api/my-route
   touch src/app/api/my-route/route.ts
   ```

2. Follow API pattern from `docs/API.md`:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { createServerClient } from '@/lib/supabase/server';
   import { MyService } from '@/lib/services/MyService';

   export async function GET(request: NextRequest) {
     // 1. Auth check
     const supabase = createServerClient();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) {
       return NextResponse.json(
         { error: 'Unauthorized' },
         { status: 401 }
       );
     }

     // 2. Execute logic
     const service = new MyService(supabase);
     const data = await service.getMyData(user.id);

     // 3. Return response
     return NextResponse.json({ data });
   }
   ```

3. Add route to `docs/API.md`

### Task 4: Create a React Component

**Steps:**
1. Create component directory:
   ```bash
   mkdir -p src/components/my-component
   touch src/components/my-component/MyComponent.tsx
   touch src/components/my-component/index.ts
   ```

2. Follow component pattern:
   ```typescript
   'use client';  // If needs interactivity

   interface MyComponentProps {
     data: MyData;
     onUpdate?: (data: MyData) => void;
   }

   export function MyComponent({ data, onUpdate }: MyComponentProps) {
     // Component implementation
     return (
       <div className="...">
         {/* JSX */}
       </div>
     );
   }
   ```

3. Export from index:
   ```typescript
   export { MyComponent } from './MyComponent';
   ```

### Task 5: Add an MCP Operation (Phase 0.1+)

**Steps:**
1. Add operation to `servers/renubu/src/operations/`:
   ```typescript
   export async function myOperation(param: string): Promise<Result> {
     // Use Supabase client with RLS
     const { data, error } = await supabase
       .from(DB_TABLES.MY_TABLE)
       .select('*')
       .eq(DB_COLUMNS.ID, param);

     if (error) throw error;
     return data;
   }
   ```

2. Register in `servers/renubu/src/index.ts`:
   ```typescript
   server.tool('myOperation', myOperation, {
     description: 'Description of what this does',
     permissions: ['read']  // or 'write', 'delete'
   });
   ```

3. Update `docs/MCP.md` with operation documentation

---

## 📋 Code Patterns & Conventions

### TypeScript Patterns

**Always use strict types:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string | null;
}

// ❌ Bad
interface User {
  id: any;
  email: string;
  name?: string;
}
```

**Use const for immutable values:**
```typescript
// ✅ Good
const users = await getUsers();

// ❌ Bad
let users = await getUsers();
```

**Use enums from constants file:**
```typescript
import { WorkflowExecutionStatus } from '@/lib/constants/status-enums';

// ✅ Good
status: WorkflowExecutionStatus.SNOOZED

// ❌ Bad
status: 'snoozed'
```

### Database Access Patterns

**Always use constants:**
```typescript
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';

// ✅ Good
.from(DB_TABLES.WORKFLOW_EXECUTIONS)
.eq(DB_COLUMNS.STATUS, WorkflowExecutionStatus.SNOOZED)

// ❌ Bad
.from('workflow_executions')
.eq('status', 'snoozed')
```

**Always enforce RLS:**
```typescript
// ✅ Good - RLS automatically enforced
const supabase = createServerClient();  // User's session
const { data } = await supabase.from(DB_TABLES.WORKFLOWS).select('*');

// ❌ Bad - Bypasses RLS (NEVER do this in API routes)
const supabase = createServiceRoleClient();
```

### Component Patterns

**Server Components by default:**
```typescript
// ✅ Good - Server Component
export default async function MyPage() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Only use 'use client' when needed
'use client';  // For onClick, useState, etc.
```

**Props interface:**
```typescript
interface MyComponentProps {
  required: string;
  optional?: number;
  onEvent?: (data: Data) => void;
}

export function MyComponent({ required, optional, onEvent }: MyComponentProps) {
  // ...
}
```

---

## 🧪 Testing & Validation

### Before Committing

**1. TypeScript Compilation:**
```bash
npx tsc --noEmit
```
**Must show:** 0 errors (ignore pre-existing errors in weekly-planner files)

**2. Linting:**
```bash
npm run lint
```

**3. Build Check:**
```bash
npm run build
```
**Must complete:** Without errors

**4. Manual Testing:**
- Test the specific feature you built
- Check auth flows still work
- Verify database queries return expected data

### Testing Checklist

For any code change:
- [ ] TypeScript compiles with 0 new errors
- [ ] No console errors in browser
- [ ] RLS policies work (can't access other users' data)
- [ ] API returns correct HTTP status codes
- [ ] UI renders correctly
- [ ] Forms validate input

---

## 📝 Commit & PR Guidelines

### Commit Message Format

```
type(scope): description

Examples:
feat(workflows): add snooze workflow operation
fix(auth): resolve signin redirect loop
docs(schema): update workflow_executions table description
chore(deps): update next to 15.0.0
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Add or update tests
- `chore` - Maintenance (deps, config, etc.)

### Git Workflow

**When working in main repo:**
```bash
# 1. Make changes
# 2. Stage changes
git add .

# 3. Commit with descriptive message
git commit -m "feat(mcp): add listSnoozedWorkflows operation"

# 4. Push to origin
git push origin main
```

**When using git worktrees (parallel agent work):**
```bash
# 1. Create worktree
git worktree add ../renubu-agent-1 -b feature/my-feature

# 2. Work in worktree
cd ../renubu-agent-1
# make changes

# 3. Commit in worktree
git add .
git commit -m "feat: implement feature"

# 4. Return to main repo
cd ../renubu

# 5. Merge branch
git merge feature/my-feature

# 6. Remove worktree
git worktree remove ../renubu-agent-1
```

### Pull Request Template

When creating PRs:
```markdown
## Summary
Brief description of changes

## Changes Made
- Bullet list of specific changes

## Testing
- How this was tested
- Manual test steps
- Any new tests added

## Related
- Closes #123 (issue number)
- Related to docs/PLAN.md Phase 1
```

---

## 🔍 Common Pitfalls for Agents

### Pitfall 1: Not Using Constants
**Wrong:**
```typescript
.from('workflow_executions')
.eq('status', 'snoozed')
```
**Right:**
```typescript
import { DB_TABLES, DB_COLUMNS } from '@/lib/constants/database';
import { WorkflowExecutionStatus } from '@/lib/constants/status-enums';

.from(DB_TABLES.WORKFLOW_EXECUTIONS)
.eq(DB_COLUMNS.STATUS, WorkflowExecutionStatus.SNOOZED)
```

### Pitfall 2: Bypassing RLS
**Wrong:**
```typescript
// NEVER use service role in API routes
const supabase = createServiceRoleClient();
```
**Right:**
```typescript
// Always use user's session
const supabase = createServerClient();
```

### Pitfall 3: Client/Server Component Confusion
**Wrong:**
```typescript
// Server Component with onClick
export default async function Page() {
  return <button onClick={() => alert('hi')}>Click</button>;  // ERROR
}
```
**Right:**
```typescript
// Use client component for interactivity
'use client';

export default function Page() {
  return <button onClick={() => alert('hi')}>Click</button>;  // ✅
}
```

### Pitfall 4: Creating New Files Instead of Updating
**Wrong:**
- Create `docs/phase-1-new-feature.md`
- Create `docs/phase-1-api-reference.md`

**Right:**
- Update existing `docs/API.md` with new endpoints
- Update existing `docs/WORKFLOWS.md` with new workflows

### Pitfall 5: Not Reading Existing Docs
**Before implementing anything:**
1. Check `docs/ARCHITECTURE.md` - Is there already a pattern for this?
2. Check `docs/SCHEMA.md` - Does the table already exist?
3. Check `docs/API.md` - Is there already an endpoint?
4. Check `docs/MCP.md` - Is there already an MCP operation?

---

## 📚 Documentation Guidelines

### When to Update Living Documents

**After implementing a feature:**
- Update `docs/PLAN.md` if feature affects roadmap
- Update `docs/STATE.md` with what's now built
- Update `docs/SCHEMA.md` if database changed
- Update `docs/API.md` if endpoints added
- Update `docs/MCP.md` if operations added
- Update `docs/WORKFLOWS.md` if workflows added
- Update `docs/ARTIFACTS.md` if artifacts added

**DO NOT create new markdown files unless:**
- Completely new category (rare)
- Temporary task decomposition (will be deleted at phase end)

**Default action:** Update existing living documents, don't proliferate files

---

# PART II: FOR HUMAN DEVELOPERS

**Purpose:** This section is for human engineers who need to set up local environment, understand architecture, and deploy.

---

## 💻 Local Development Setup

### Prerequisites

**Required:**
- Node.js 18+ (recommend using nvm)
- pnpm (package manager)
- Git
- Code editor (VS Code recommended)

**Optional but Recommended:**
- Docker Desktop (for local Supabase)
- GitHub CLI (gh)

### First-Time Setup

**1. Clone Repository:**
```bash
git clone https://github.com/Renew-Boo/renubu.git
cd renubu
```

**2. Install Dependencies:**
```bash
pnpm install
```

**3. Environment Variables:**
```bash
# Copy template
cp .env.local.template .env.local

# Edit with your values
# Get Supabase credentials from Supabase dashboard
```

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for migrations only)

**4. Database Setup (Optional - Local Supabase):**
```bash
# Start local Supabase (requires Docker)
npx supabase start

# Run migrations
npx supabase db reset

# Seed data
npx supabase db seed
```

**5. Start Development Server:**
```bash
pnpm dev
```

Open http://localhost:3000

### Development Workflow

**Typical workflow:**
```bash
# 1. Pull latest
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes

# 4. Test locally
pnpm build  # Ensure builds
pnpm lint   # Check linting

# 5. Commit and push
git add .
git commit -m "feat: description"
git push origin feature/my-feature

# 6. Create PR on GitHub

# 7. After approval, merge to main
```

---

## 🏗️ Architecture Overview (Human Perspective)

### Tech Stack Rationale

**Why Next.js?**
- Server-side rendering for performance
- API routes for backend
- File-based routing (simple)
- Great developer experience

**Why Supabase?**
- PostgreSQL (battle-tested, powerful)
- Built-in auth (saves weeks of work)
- Row Level Security (security by default)
- Realtime (future feature)
- Good free tier

**Why Vercel?**
- Zero-config Next.js deployment
- Edge functions
- Automatic HTTPS
- Preview deployments

### System Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────────────────────┐
│   Vercel Edge Network           │
│  ┌───────────────────────────┐ │
│  │  Next.js App (SSR + API)  │ │
│  └───────────┬───────────────┘ │
└──────────────┼─────────────────┘
               │
               │ PostgreSQL Protocol
               ▼
       ┌───────────────┐
       │   Supabase    │
       │ ┌───────────┐ │
       │ │PostgreSQL │ │
       │ └───────────┘ │
       │ ┌───────────┐ │
       │ │   Auth    │ │
       │ └───────────┘ │
       └───────────────┘
```

### Key Architectural Decisions

**Decision 1: Monorepo vs Separate Repos**
- **Choice:** Monorepo
- **Why:** Simpler, faster iteration, shared types

**Decision 2: App Router vs Pages Router**
- **Choice:** App Router (Next.js 13+)
- **Why:** Server Components, better DX, future-proof

**Decision 3: Client-Side vs Server-Side Data Fetching**
- **Choice:** Server-side (Server Components)
- **Why:** Better performance, SEO, security

**Decision 4: REST vs GraphQL**
- **Choice:** REST (for now)
- **Why:** Simpler, Supabase supports it natively

---

## 🚀 Deployment Process

### Environments

**Local (localhost:3000)**
- For development
- Can use demo mode
- Local or cloud Supabase

**Preview (Vercel)**
- Auto-deployed on PR
- Uses production Supabase (separate project)
- For testing before merge

**Production (app.renubu.com)**
- Deployed on merge to main
- Production Supabase
- Monitored

### Deployment Steps

**Automated (Vercel):**
1. Push to main branch
2. Vercel detects change
3. Builds and deploys automatically
4. Live in ~2 minutes

**Manual (if needed):**
```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Environment Variables

**Set in Vercel Dashboard:**
- Production: Set once, applies to all production deploys
- Preview: Separate values for preview deploys

**Never commit:**
- API keys
- Database credentials
- Service role keys

### Database Migrations

**Production migration process:**
```bash
# 1. Test locally first
npx supabase db reset  # Applies all migrations

# 2. Deploy to Supabase production
npx supabase db push

# 3. Verify schema
npx supabase db diff
```

**⚠️ Always backup before production migration**

---

## 🐛 Debugging & Tools

### Browser DevTools

**React DevTools:**
- Install extension
- Inspect component tree
- Check props/state

**Network Tab:**
- See API calls
- Check request/response
- Verify auth headers

### Logging

**Client-side:**
```typescript
console.log('Debug:', data);
console.error('Error:', error);
```

**Server-side:**
```typescript
console.log('[API] Processing request:', { userId, data });
```

**Production:** Logs appear in Vercel dashboard

### Common Issues

**Issue: "Unauthenticated" errors**
- Check session cookie exists
- Verify Supabase URL/keys in env
- Check RLS policies

**Issue: Build fails**
- Check TypeScript errors: `npx tsc --noEmit`
- Check for unused imports
- Verify all dependencies installed

**Issue: Database query fails**
- Check RLS policies (might be blocking)
- Verify table/column names
- Check user has permission

---

## 👥 Team Workflows

### Code Review

**What to check:**
- [ ] Code follows conventions (see Part I)
- [ ] TypeScript compiles
- [ ] No security issues (RLS bypassed, etc.)
- [ ] Tests pass
- [ ] Documentation updated

### Communication

**Slack Channels:**
- #dev - Development discussion
- #product - Product feedback
- #bugs - Bug reports

**GitHub:**
- Issues for bugs/features
- PRs for code review
- Discussions for big decisions

---

## 📖 Further Reading

**Internal Docs:**
- `docs/ARCHITECTURE.md` - Deep dive on architecture
- `docs/SCHEMA.md` - Database schema reference
- `docs/API.md` - API documentation
- `docs/PLAN.md` - Current development plan

**External Resources:**
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Last Updated:** 2025-11-07
**Version:** 0.1
**Note:** This is a living document. Update as processes evolve.
