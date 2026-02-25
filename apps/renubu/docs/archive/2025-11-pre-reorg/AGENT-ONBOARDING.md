# Agent Onboarding Guide

**Last Updated:** 2025-11-05
**Audience:** AI Agents (Claude Code, GitHub Copilot, etc.)
**Purpose:** Get productive on Renubu development quickly

---

## Welcome! 🎉

Welcome to the Renubu development team! You're joining a **dual-track agentified development team** where AI agents and humans collaborate to build an AI-powered customer success platform. This guide will get you up to speed quickly.

---

## 📋 Quick Reference

**Project:** Renubu - AI-Powered Customer Success Platform
**Current Focus:** Q4 2025 - Weekly Planner Feature (Labs Project)
**Git Repository:** https://github.com/Renew-Boo/renubu.git
**Production:** https://renubu-iota.vercel.app
**Main Branch:** `main`
**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, Tailwind CSS

**Key Documentation:**
- `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md` - Master project plan
- `docs/DEPLOYMENT-STRATEGY.md` - Environment architecture
- `docs/GIT-WORKFLOW.md` - Branch and merge strategies
- `docs/AGENT-COMMUNICATION.md` - How we communicate

---

## 🚀 Quick Start (15 minutes)

### 1. Clone & Setup (5 min)

```bash
# Clone repository
git checkout https://github.com/Renew-Boo/renubu.git
cd renubu

# Install dependencies
npm install

# Check environment
npm run env:status  # Should show 📍 STAGING

# Start development server
npm run dev

# Open http://localhost:3000
```

### 2. Verify Access (5 min)

**Check these work:**
- [ ] Dev server runs without errors
- [ ] Can access localhost:3000
- [ ] No console errors in browser
- [ ] Can navigate dashboard
- [ ] Database queries work (check network tab)

**If anything fails:**
- Check `.env.local` exists (may need to create from `.env.local.staging`)
- Verify Supabase credentials
- Check Node version (should be 22.x)

### 3. Read Key Docs (5 min)

**Must read before coding:**
1. `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md` (scan sections relevant to your task)
2. `docs/GIT-WORKFLOW.md` (understand branch strategy)
3. `docs/AGENT-COMMUNICATION.md` (how to communicate progress)

---

## 🏗️ Project Architecture

### High-Level Structure

```
renubu/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── api/                # API routes
│   │   └── (auth)/             # Auth pages (signin, signup)
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── workflows/          # Workflow system components
│   │   └── artifacts/          # Workflow artifact components
│   ├── lib/                    # Business logic & utilities
│   │   ├── services/           # Core services (Calendar, Workload, etc.)
│   │   ├── workflows/          # Workflow composition & slides
│   │   └── supabase/           # Supabase client & utilities
│   └── config/                 # Configuration files
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed*.sql               # Test data seeds
├── docs/                       # Documentation
│   └── labs/                   # Labs project documentation
└── public/                     # Static assets
```

### Key Concepts

**1. Workflows**
- Core feature: Guided conversation flows for customer success tasks
- Defined in `src/lib/workflows/compositions/`
- Composed of "slides" (conversation steps)
- Uses Handlebars templates for dynamic content
- Example: Renewal preparation, onboarding, weekly planning

**2. Slides**
- Individual steps in a workflow
- Located in `src/lib/workflows/slides/`
- Define chat messages, artifacts, and actions
- Can be reused across workflows

**3. Artifacts**
- Visual components displayed alongside chat
- Examples: Data tables, charts, forms, calendars
- Located in `src/components/artifacts/`

**4. Services**
- Business logic layer (not UI)
- Located in `src/lib/services/`
- Examples:
  - `WorkloadAnalysisService` - Analyzes work commitments
  - `CalendarService` - Calendar integration & scheduling
  - `WeeklyPlanningService` - Weekly planning logic (to be built)

**5. Demo Mode**
- Auto-authentication for local development
- Bypasses OAuth complexity
- Force-enabled on localhost
- Force-disabled in production
- See `docs/DEMO-MODE.md` for details

---

## 🗺️ Development Environment

### Environments

| Environment | URL | Branch | Database | Purpose |
|-------------|-----|--------|----------|---------|
| **Production** | https://renubu-iota.vercel.app | `main` | Production DB | Live customers |
| **Staging** | TBD | `staging` | Staging DB | QA testing |
| **Dev** | TBD | `dev` | QA DB | Integration testing |
| **Local** | localhost:3000 | any | Staging DB | Development |
| **Labs** | localhost:3101+ | `labs/*` | Staging/Dev | Experimental features |
| **Features** | localhost:3201+ | `feature/*` | Dev/QA | Isolated features |

### Environment Variables

**Current:** `.env.local` (points to STAGING by default)

**Switch environments:**
```bash
npm run env:staging    # Switch to staging
npm run env:prod       # Switch to production (use with caution)
npm run env:status     # Check current environment
```

**Key Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Public API key
SUPABASE_SERVICE_ROLE_KEY         # Admin key (demo mode only)
NEXT_PUBLIC_DEMO_MODE             # Enable/disable demo mode
NEXT_PUBLIC_SITE_URL              # Site URL for callbacks
```

---

## 🌲 Git Workflow

### Branch Types

**Permanent:**
- `main` - Production (protected, requires 2 approvals)
- `staging` - QA/Pre-production (requires 1 approval)
- `dev` - Integration (status checks required)

**Temporary:**
- `labs/{project}` - Major multi-week features
- `feature/{name}` - Smaller focused features
- `hotfix/{issue}` - Emergency production fixes

**Current Labs Branch:** `renubu.lab.weeklyplanner` (Weekly Planner Q4 project)

### Typical Workflow

```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feature/calendar-integration

# 2. Make changes
# ... code, commit, push ...

# 3. Create PR to dev
gh pr create --base dev --title "feat: Add calendar OAuth"

# 4. After approval, merge to dev
# Dev auto-deploys and runs integration tests

# 5. After testing in dev, PR to staging
# Staging = QA environment

# 6. After QA approval, PR to main
# Production deployment
```

### Commit Messages

Use **Conventional Commits:**
```
feat(calendar): add Google OAuth integration
fix(auth): resolve redirect loop on signin
docs(readme): update setup instructions
refactor(workflows): extract slide loader utility
test(planner): add unit tests for findNextOpening
```

---

## 📊 Current Project Status (Q4 2025)

### What's Complete ✅

**Week 1 of Q4 Plan (100% done):**
1. **Database Schema** - 7 tables for weekly planner
   - `user_work_context`
   - `weekly_plans`
   - `weekly_commitments`
   - `recurring_workflows`
   - `user_calendar_integrations`
   - `user_calendar_preferences`
   - `scheduled_tasks`

2. **WorkloadAnalysisService** (src/lib/services/WorkloadAnalysisService.ts)
   - Pulls snoozed workflows
   - Surfaces customer renewals
   - Identifies high-priority customers
   - Finds incomplete tasks
   - Categorizes by urgency (urgent/important/routine/suggested)

3. **CalendarService** (src/lib/services/CalendarService.ts)
   - `findNextOpening()` algorithm (600+ lines)
   - Multi-factor scoring (0-100)
   - Energy-aware scheduling
   - Task-type alignment
   - Focus block preferences
   - Buffer time management

4. **Workflow Slides** (src/lib/workflows/slides/planner/)
   - 5 slides defined (not yet integrated):
     - `weeklyReflectionSlide`
     - `contextGatheringWorkloadSlide` ⭐ (key integration)
     - `forwardPlanningSlide`
     - `commitmentFinalizationSlide`
     - `weeklySummarySlide`

5. **Demo Mode** - Local testing infrastructure (on labs branch)

### What's Next 🚧

**Sprint 0 (Current):**
- Infrastructure setup (environments, docs, processes)
- You're part of this sprint!

**Week 2 - UI Integration:**
- Workflow container component
- Data flow architecture (useWeeklyPlanner hook)
- Integration with existing services
- API routes

**Week 3 - Complete 5 Slides:**
- Wire slides to UI
- Implement artifact display
- AI auto-scheduling integration

See `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md` for full timeline.

---

## 🛠️ Common Development Tasks

### Running Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build check (does it compile?)
npm run build

# All checks together
npm run check
```

### Database Operations

```bash
# Check Supabase status
npx supabase status

# Apply migrations (if using local Supabase)
npx supabase migration up

# Reset database with seed data
npx supabase db reset
```

### Debugging

```bash
# Check environment
npm run env:status

# Check which user is authenticated (in browser console)
# Look for demo mode logs: "🎮 [DEMO MODE] ..."

# Check database connection
# Navigate to dashboard - should load workflows
```

### Working on Labs Branch

```bash
# Switch to weekly planner lab
git checkout renubu.lab.weeklyplanner

# Run on dedicated port (avoid conflicts)
PORT=3101 npm run dev

# Keep synced with main
git fetch origin main
git merge origin/main  # Resolve conflicts if any
```

---

## 📚 Weekly Planner Context (Current Project)

### Goal
Build an AI-powered "Chief of Staff" for weekly planning that:
- Automatically surfaces work commitments (renewals, snoozed tasks, priorities)
- Uses AI to schedule everything optimally
- Learns patterns over time
- Replaces manual planning with intelligent automation

### Key Innovation
**Planning doesn't start from scratch** - Your work is already in Renubu (customers, workflows, tasks). The planner just organizes it for you.

### Architecture

```
┌─────────────────────────────────────────┐
│  Weekly Planning Workflow (5 slides)    │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼─────────┐   ┌─────────▼──────────┐
│ WorkloadAnalysis│   │  CalendarService  │
│    Service     │   │  (findNextOpening)│
└────────────────┘   └────────────────────┘
      │                       │
      └───────────┬───────────┘
                  │
          ┌───────▼────────┐
          │   Supabase     │
          │   (Database)   │
          └────────────────┘
```

### Workflow Flow

1. **Weekly Reflection** - "How was last week?"
2. **Context Gathering** - ⭐ Auto-surface work commitments
3. **Forward Planning** - AI schedules tasks using findNextOpening()
4. **Commitment Finalization** - Lock in top priorities
5. **Weekly Summary** - Display plan, create calendar events

### Key Files to Know

**Services:**
- `src/lib/services/WorkloadAnalysisService.ts` - Work analysis
- `src/lib/services/CalendarService.ts` - Scheduling algorithm

**Slides:**
- `src/lib/workflows/slides/planner/*.ts` - 5 workflow slides
- `src/lib/workflows/compositions/weeklyPlannerComposition.ts` - Configuration

**Database:**
- `supabase/migrations/20251102140000_weekly_planner_phase1.sql` - Schema

**Docs:**
- `docs/labs/WEEKLY-PLANNER-DEVELOPMENT-PLAN.md` - Detailed plan
- `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md` - Timeline

---

## 🎯 Task Assignment Guidelines

### Agent-Friendly Tasks ✅

**You excel at these (70-85% completion rate):**
- OAuth implementation (clear patterns)
- Database queries and mutations
- Component structure and layout
- API route creation
- Test writing
- Documentation updates
- Migration scripts
- Refactoring with clear goals

**How to Identify:**
- Clear requirements
- Existing patterns to follow
- Minimal ambiguous decisions
- Technical implementation focus

### Human-Required Tasks 👥

**These need human judgment:**
- UX/UI design decisions
- Complex state management architecture
- Performance optimization choices
- Security review
- Product direction decisions
- Customer feedback interpretation

**When to Escalate:**
- Multiple valid approaches (need product input)
- Unclear requirements
- Significant architectural decisions
- Trade-offs with customer impact

---

## 📞 Communication Patterns

### Daily Update (Required)

**When:** End of each work session
**Where:** Google Chat Space "Renubu Dev Sync"

```
🤖 Agent Update - 2025-11-05 - Claude

✅ Completed:
- Created agent onboarding docs (1h)
- Reviewed weekly planner architecture (0.5h)

🔄 In Progress:
- Current state documentation (0% done, 2h estimated)

🚧 Blockers: None

📊 Hours: 1.5h / 4h planned

Next: Finish current state docs, start velocity tracking
```

### Asking Questions

**Non-blocking:**
```
❓ Quick Question - Architecture Choice

Context: Working on workflow container component
Question: Should we use Context API or Zustand for state?
Impact: None yet, planning stage

Options:
1. Context API (simpler, already used)
2. Zustand (more powerful, new dependency)

Preference: Context API for consistency
```

**Blocking:**
```
🚧 BLOCKER - Missing Design Spec

What's blocked: UI integration for slides
Root cause: No design mockups for artifact components
Impact: Can't proceed with Week 2 work (20h at risk)
Workarounds: Could create basic placeholder UI
Need: Design specs for WorkloadDashboardArtifact

@justin
```

### Creating PRs

**Always include:**
1. Clear description of changes
2. Link to related issues (#123)
3. Screenshots (if UI changes)
4. Testing checklist
5. Breaking changes (if any)

**Request specific reviewers based on expertise**

---

## ✅ Definition of Done

Before marking any task complete:
- [ ] Code written and tested locally
- [ ] Tests passing (npm run check)
- [ ] No console errors or warnings
- [ ] PR created with clear description
- [ ] Related documentation updated
- [ ] Commit messages follow conventions
- [ ] Ready for human review

---

## 🚨 Common Pitfalls to Avoid

**Don't:**
- ❌ Commit secrets or API keys
- ❌ Work directly on main/staging
- ❌ Force push to protected branches
- ❌ Merge PRs without approval
- ❌ Skip writing tests
- ❌ Make breaking changes without migration plan
- ❌ Forget to update documentation

**Do:**
- ✅ Create feature branches
- ✅ Write clear commit messages
- ✅ Test before committing
- ✅ Ask questions early
- ✅ Update docs with code changes
- ✅ Follow existing patterns
- ✅ Communicate progress daily

---

## 🎓 Learning Resources

### Codebase Patterns

**Learn by example:**
- Existing workflow: `src/lib/workflows/compositions/renewalWorkflow.ts`
- Existing service: `src/lib/services/WorkloadAnalysisService.ts`
- Existing slide: `src/lib/workflows/slides/planner/weeklyReflectionSlide.ts`
- Existing artifact: `src/components/artifacts/workflows/components/`

### Tech Stack Documentation

- **Next.js 15:** https://nextjs.org/docs
- **React 19:** https://react.dev
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs

### Project Documentation

**Start here:**
1. `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md` - Master plan
2. `docs/DEPLOYMENT-STRATEGY.md` - Environments
3. `docs/GIT-WORKFLOW.md` - Branching
4. `docs/AGENT-COMMUNICATION.md` - Communication

**Deep dives:**
- `docs/labs/WEEKLY-PLANNER-DEVELOPMENT-PLAN.md` - Detailed weekly planner plan
- `docs/labs/DEMO-MODE-TESTING.md` - Demo mode usage
- `docs/DEMO-MODE.md` - Demo mode architecture

---

## 🆘 Getting Help

### Quick Questions
**Where:** Google Chat Space "Renubu Dev Sync"
**Response Time:** Within 2 hours during business hours

### Blockers
**Where:** Google Chat with @mention
**Response Time:** Within 1 hour

### Critical Issues
**Where:** Google Chat + Phone call if urgent
**Response Time:** Immediate

### Code Review
**Where:** GitHub PR comments
**Response Time:** 4-48 hours depending on PR size

---

## 🎯 Your First Task

**Recommended starter task:**
1. Read this entire document
2. Clone repo and verify local setup works
3. Read `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md`
4. Review the current weekly planner code:
   - `src/lib/services/CalendarService.ts`
   - `src/lib/workflows/compositions/weeklyPlannerComposition.ts`
5. Post introduction in Google Chat Space
6. Pick a task from GitHub Projects board (or wait for assignment)

**Introduction Template:**
```
👋 Agent Introduction

Name: [Your name/identifier]
Type: [Claude Code / GitHub Copilot / etc.]
Strengths: [What you're good at]
Experience: [Relevant background]
Availability: [Hours per day/week]

Ready to start on weekly planner work!
Looking forward to collaborating with the team.
```

---

## ✅ Onboarding Checklist

Before you start coding:
- [ ] Repository cloned
- [ ] Dependencies installed (npm install)
- [ ] Dev server runs (npm run dev)
- [ ] Can access localhost:3000
- [ ] Read Q4 development plan
- [ ] Read GIT-WORKFLOW.md
- [ ] Read AGENT-COMMUNICATION.md
- [ ] Understand 6-environment strategy
- [ ] Know how to create feature branches
- [ ] Know how to post daily updates
- [ ] Introduced yourself in Google Chat
- [ ] Have access to GitHub Issues

**Welcome to the team! Let's build something amazing. 🚀**

---

## 🔗 Quick Links

- **Repository:** https://github.com/Renew-Boo/renubu.git
- **Production:** https://renubu-iota.vercel.app
- **Google Chat:** "Renubu Dev Sync" space (link TBD)
- **GitHub Projects:** (link TBD)
- **Vercel:** justin-9239s-projects/renubu

---

**Document Status:** v0 Sprint 0
**Next Review:** After first agent completes onboarding
