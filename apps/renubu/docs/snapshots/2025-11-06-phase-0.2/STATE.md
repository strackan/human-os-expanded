# Renubu Current State

**Last Updated:** 2025-11-05
**Phase:** Phase 0 (Sprint 0) Complete
**Production:** renubu-iota.vercel.app

---

## 🏗️ Architecture Overview

**Stack:**
- Next.js 15.5.2 (App Router)
- React 19.0.0
- TypeScript 5.9.3
- Supabase (PostgreSQL + Auth)
- Vercel (Hosting)
- Handlebars (Template engine)

**Development:**
- Node 20.x
- pnpm package manager
- Demo mode for local development

---

## ✅ What's Built & Working

### Authentication
**Status:** ✅ Working with recent improvements

**Features:**
- Email/password authentication
- OAuth setup (placeholders for Google Calendar)
- Profile management with company_id
- Demo mode auto-enable on localhost

**Recent Improvements (Phase 0):**
- 30-second timeout protection (prevents hanging)
- Signin redirect fix (no more stuck on /signin)
- Enhanced performance logging (flags queries >1000ms)
- `/api/auth/test-session` diagnostic endpoint

**Files:**
- `src/components/auth/AuthProvider.tsx` - Auth context with timeout detection
- `src/components/auth/RouteGuard.tsx` - Protected route wrapper
- `src/components/auth/AuthButton.tsx` - Sign in/out UI
- `src/lib/demo-mode-config.ts` - Demo mode configuration
- `src/lib/auth-config.ts` - Auth routes and redirects

### Database Schema

**Core Tables:**
- `profiles` - User profiles with company_id
- `companies` - Workspace/company data
- `customers` - Customer records
- `workflow_definitions` - Workflow templates
- `workflow_executions` - Active workflow instances
- `workflow_step_executions` - Step tracking
- `workflow_tasks` - Task management with 7-day snooze

**Workflow Snoozing Infrastructure:**
- `workflow_tasks.first_snoozed_at` - When first snoozed
- `workflow_tasks.snoozed_until` - When to resurface
- `workflow_tasks.max_snooze_date` - 7-day enforcement
- `workflow_tasks.snooze_count` - Number of snoozes

**Weekly Planner Schema (Deployed, Not Active):**
- `user_work_context` - Goals, projects, focus areas
- `weekly_plans` - Planning session tracking
- `weekly_commitments` - Individual commitments
- `recurring_workflows` - Schedule recurring planning
- `user_calendar_integrations` - OAuth tokens (encrypted)
- `user_calendar_preferences` - Work hours, focus blocks
- `scheduled_tasks` - Tasks via findNextOpening()

**Migration Status:**
- ✅ All core migrations applied
- ✅ Weekly planner Phase 1 schema deployed
- ⏸️ Weekly planner UI not activated (deferred to Q1)

### Services

#### WorkloadAnalysisService ✅ Complete
**File:** `src/lib/services/WorkloadAnalysisService.ts` (582 lines)

**Purpose:** Analyzes existing Renubu data to surface work commitments

**Methods:**
- `getUpcomingWorkload(userId, weekStart)` - Fetches snoozed workflows, renewals, priorities
- Returns categorized items (urgent/important/routine/suggested)
- Provides summary with total_items, estimated_hours, customer_count

**Status:** Fully implemented, tested, ready for use

#### CalendarService ✅ 90% Complete
**File:** `src/lib/services/CalendarService.ts` (698 lines)

**Purpose:** Intelligent scheduling with multi-factor scoring

**Key Method:**
```typescript
findNextOpening(options: FindOpeningOptions): Promise<TimeSlot | null>
```

**Scoring Algorithm (0-100):**
- Task type alignment (+30): Deep work → mornings
- Energy levels (+20): 9-11am peak
- Focus blocks (+20): User preferences
- Context switching (-15): Meetings nearby
- Preferred hours (+15)

**OAuth Methods (Placeholders):**
- `initiateOAuth()` - TODO: Implement Google OAuth flow
- `handleOAuthCallback()` - TODO: Token exchange
- `refreshAccessToken()` - TODO: Auto-refresh

**Status:** Core logic complete, OAuth deferred to Phase 1 (or when needed)

#### WorkflowTaskService ✅ Complete
**File:** `src/lib/services/WorkflowTaskService.ts`

**Purpose:** Task-level snooze management

**Features:**
- 7-day maximum snooze from first snooze
- Validation and enforcement
- Status tracking (pending, snoozed, completed, skipped)
- Cross-workflow task continuity

**API:**
- POST `/api/workflows/tasks/[id]/snooze`
- Enforces max_snooze_date

**Status:** Fully working, used in existing workflows

#### DailyTaskEvaluationService ✅ Complete
**File:** `src/lib/services/DailyTaskEvaluationService.ts`

**Purpose:** Evaluates when snoozed items should resurface

**Features:**
- Checks snoozed_until timestamps
- Surfaces tasks when conditions met
- Daily cron job integration

**Status:** Working for task-level snooze

#### NotificationService ✅ Complete
**File:** `src/lib/services/NotificationService.ts`

**Purpose:** Handles snooze notifications

**Status:** Integrated with task snooze system

### Workflow System

**Current Architecture:**
```
workflow_definitions (templates)
    ↓
workflow_executions (active instances)
    ↓
workflow_step_executions (steps within workflows)
    ↓
workflow_tasks (tasks within steps)
```

**Workflow Types:**
- Renewal planning
- Expansion outreach
- Strategic planning
- Coffee check-ins
- Emergency workflows

**Snooze Support:**
- ✅ Task-level snooze (within workflows)
- ⏸️ Workflow-level snooze (Phase 1 goal)

**Files:**
- `src/lib/workflows/orchestrator-db.ts` - Workflow orchestration
- `src/lib/workflows/types.ts` - Type definitions
- `src/lib/workflows/actions/` - Workflow actions
- `src/components/workflows/` - UI components

### Weekly Planner Components ⏸️ Not Active

**Slides (Defined, Not Rendered):**
1. `weeklyReflectionSlide.ts` - Previous week reflection
2. `contextGatheringWorkloadSlide.ts` - Auto-surfaces work via WorkloadAnalysisService
3. `forwardPlanningSlide.ts` - Plan upcoming week
4. `commitmentFinalizationSlide.ts` - Finalize commitments
5. `weeklySummarySlide.ts` - Generate summary

**Composition:**
- `weeklyPlannerComposition.ts` - 5-slide workflow definition

**Status:** Complete but not integrated into UI (deferred to Q1 2026)

### Dashboard

**Main Dashboard:**
- `src/app/dashboard/DashboardClient.tsx`
- Shows active workflows
- Task panels
- Customer overviews

**Status:** Working for current workflows, will need updates for workflow snoozing

### API Routes

**Auth:**
- `/api/auth/callback` - OAuth callback
- `/api/auth/check-user` - User validation
- `/api/auth/create-user` - User creation
- `/api/auth/test-session` - Diagnostics

**Workflows:**
- `/api/workflows/tasks/[id]/snooze` - Snooze task
- `/api/orchestrator/executions/[id]/snooze` - Snooze execution
- `/api/dashboard/today-workflows` - Today's workflows
- `/api/cron/evaluate-tasks` - Daily task evaluation

**Test:**
- `/api/test/calendar` - Calendar service testing

---

## 🚧 What's Not Built Yet

### Phase 0.1 (Starts Nov 13)
- ❌ MCP server for Renubu operations
- ❌ Docker sandbox environment
- ❌ Code execution integration

### Phase 1 (Starts Nov 25)
- ❌ Universal `workflows` table (workflow-level abstraction)
- ❌ Condition-based snoozing (beyond dates)
- ❌ `WorkflowConditionService` for business conditions
- ❌ `WorkflowSurfaceService` with smart wake logic
- ❌ Intel files integration (fast/slow/identity context)
- ❌ Snooze UI components (SnoozeDialog, WorkflowDashboard)
- ❌ API routes for workflow-level snooze

### Deferred to Q1 2026
- ❌ Weekly Planner UI integration
- ❌ Google Calendar OAuth implementation
- ❌ 5-slide workflow rendering
- ❌ Recurring workflow scheduling

---

## 🔧 Development Environment

**Local Development:**
- Port: 3000 (localhost)
- Demo mode: Auto-enabled
- Database: Supabase cloud instance
- Auth: Demo mode bypasses for faster iteration

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for demo mode)
- `NEXT_PUBLIC_DEMO_MODE=true` (for localhost)

**Demo Mode Behavior:**
- Auto-authenticates as justin@renubu.com
- Bypasses RLS policies (service role key)
- Force-disabled on production domains
- Visual badge indicator

---

## 📦 Deployment

**Production:**
- URL: renubu-iota.vercel.app
- Branch: main
- Vercel project: Configured
- Environment: Production (demo mode disabled)

**Staging:**
- Status: To be configured
- Branch: staging (planned)
- Purpose: Pre-production testing

**Dev:**
- Status: To be configured
- Branch: dev (planned)
- Purpose: Integration testing

---

## 🐛 Known Issues

**None currently blocking development**

**Minor:**
- OAuth placeholders need implementation (when needed)
- Staging/Dev environments not yet configured

---

## 🔗 Related Documentation

- `PLAN.md` - Current development plan
- `AGENT-GUIDE.md` - How to work here
- `DEV-GUIDE.md` - Technical architecture details
- `snapshots/` - Historical state snapshots

---

**Document Status:** Living document (updated after major changes)
**Next Update:** After Phase 0.1 completion (Nov 22)
