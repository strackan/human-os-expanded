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
- Framework: Jest
- Key test file: `tests/e2e/pricing-optimization-complete.test.tsx`
- Multi-layer validation pattern

## Documentation
Extensive docs in `/docs`:
- `ARCHITECTURE.md` - System architecture
- `WORKFLOW_SYSTEM_STANDARD.md` - Critical workflow patterns
- `PRODUCTION_SECURITY_SUMMARY.md` - Security guidelines
- `DEV-GUIDE.md` - Development guide
