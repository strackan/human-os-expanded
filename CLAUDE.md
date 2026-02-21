# Renubu - Customer Renewal Management Platform

SaaS revenue optimization platform with AI-powered workflows for customer renewal management.

## Key Features
- Customer health scoring and renewal tracking
- Multi-tenant architecture with Row Level Security (RLS)
- AI-powered contract analysis and workflow automation
- Dynamic workflow generation via Phase 3 Slide Library

## Workflow System Standard

**CRITICAL**: All workflow creation MUST use the Phase 3 Modular Slide Library System.

```typescript
// CORRECT: Use composeFromDatabase()
import { composeFromDatabase } from '@/lib/workflows/db-composer';

const workflowConfig = await composeFromDatabase(
  'workflow-id',
  null,  // company_id
  { ...customerContext }
);
registerWorkflowConfig('workflow-id', workflowConfig);
```

| Use This | Never Use |
|----------|-----------|
| `composeFromDatabase()` | `/api/workflows/compile` |
| `@/lib/workflows/db-composer` | `WorkflowConfigTransformer` |
| Database `workflow_definitions` | Static WorkflowConfig files |

- **Reference**: `docs/workflows/WORKFLOW_SYSTEM_STANDARD.md`
- **Example**: `src/app/dashboard/DashboardClient.tsx:62-147`

## Project Structure

```
src/
  app/           - Next.js App Router pages
    api/         - API routes (30+ endpoints)
    customers/   - Customer management
    dashboard/   - Main dashboard
    workflows/   - Workflow execution
  lib/
    workflows/   - Phase 3 workflow system (CRITICAL)
      db-composer.ts   - Database workflow composer
      slides/          - Modular slide components
    supabase/    - Database client and schema
    services/    - Business logic services
    assessment/  - Scoring engine
  components/    - Reusable React components
docs/            - Extensive documentation (30+ files)
```

## Technology Stack
- Next.js 15, React 19, TypeScript 5
- Supabase (PostgreSQL) with RLS
- TailwindCSS 4, Radix UI
- Anthropic SDK (Claude AI integration)

## Common Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint
npm run check        # Full validation (type + lint + build)
```

### Environment Management
```bash
npm run env:staging  # Switch to staging
npm run env:prod     # Switch to production
npm run env:status   # Show current environment
```

### Database/Schema
```bash
npm run sync-schema      # Sync types from database
npm run validate-schema  # Validate schema consistency
npm run schema-diff      # Compare schema versions
```

## Environment Configuration

- `.env.local.staging` - Staging environment
- `.env.local.prod` - Production environment
- Use `env:staging` / `env:prod` scripts to switch

> **Warning**: Demo mode must be DISABLED in production. Service role key must never be exposed to client code.

## Forbidden Directories
Do not search unless explicitly requested:
- `node_modules/`, `.next/`, `.git/`, `.husky/`
- `coverage/`, `dist/`, `build/`, `out/`

## Forbidden Files
Skip during searches:
- `*.log`, `*.lock`, `package-lock.json`
- `.env.local`, `.env.vercel.*`, `.env.preview.*`, `.env.production.*`

## Coding Standards
- TypeScript strict mode
- Functional React components
- Follow existing patterns
- Respect environment separation (staging vs production)
- Use project npm scripts for builds

## Testing

### Jest Test Framework
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode (re-run on changes)
npm run test:coverage # Generate coverage report
```

### Test File Locations
- Unit tests: `src/**/__tests__/*.test.ts`
- Component tests: `src/**/__tests__/*.test.tsx`
- Test pattern: `*.test.ts` or `*.test.tsx`

### Testing Requirements for Releases

**Before any release, agents MUST:**
1. Run `npm test` and ensure all tests pass
2. Run `npm run type-check` with 0 errors (excluding `supabase/functions/`)
3. Run `npm run build` successfully

**When making code changes, agents SHOULD:**
1. Write unit tests for new service functions/utilities
2. Update existing tests if changing function signatures
3. Add regression tests for bug fixes

### Writing Tests

**Unit tests for services** (preferred - no Next.js context needed):
```typescript
// src/lib/services/__tests__/MyService.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { MyService } from '../MyService';

describe('MyService', () => {
  it('should do something', () => {
    const result = MyService.calculate(10);
    expect(result).toBe(20);
  });
});
```

**Mocking Supabase** (for database operations):
```typescript
const mockSupabase = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: mockData, error: null })
  })
} as unknown as SupabaseClient;
```

**What to test:**
- Pure functions and utilities (easiest)
- Service methods with mocked dependencies
- Data transformations and business logic
- Edge cases and error handling

**What NOT to test (requires complex mocking):**
- React components with Next.js context (cookies, headers)
- Full workflow execution (use manual QA)
- API routes (test via integration or E2E)

## Releases & Versioning

- **Versioning:** `docs/VERSIONING.md` — Pre-1.0 scheme: `0.MAJOR.MINOR`
- **Release Notes:** `RELEASE_NOTES.md` — All shipped + upcoming releases
- **Git Strategy:** `docs/archive/2025-11-pre-reorg/GIT-WORKFLOW.md` — Branching model, merge strategies, protection rules
- **Scope Docs:** `docs/scopes/releases/` — Per-release scope documents (template in `README.md`)
- **Tag Format:** `v0.X.Y` for releases, `v0.X.Y-rc.N` for release candidates
- **CI/CD:** `.github/workflows/deploy-staging.yml` — Auto-deploys on `v*.*.*` tags
- **Scripts:** `npm run snapshot -- <version> <date>` (release snapshot), `npm run commit` (tracked commit), `npm run roadmap` (regenerate from DB)

## Documentation
Extensive docs in `/docs`:
- `ARCHITECTURE.md` - System architecture
- `WORKFLOW_SYSTEM_STANDARD.md` - Critical workflow patterns
- `PRODUCTION_SECURITY_SUMMARY.md` - Security guidelines
- `DEV-GUIDE.md` - Development guide
