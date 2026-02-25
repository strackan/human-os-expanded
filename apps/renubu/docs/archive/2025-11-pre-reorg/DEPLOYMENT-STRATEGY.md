# Renubu Deployment Strategy

**Last Updated:** 2025-11-05
**Owner:** Engineering Team
**Status:** v0 - Sprint 0 Documentation

---

## Overview

Renubu uses a **6-environment deployment strategy** to support parallel development, customer testing, sales demos, and production stability. This strategy enables agentified development where multiple features can be built simultaneously without conflicts.

---

## 🌍 Environment Architecture

### 1. **Production**
- **Purpose:** Stable, customer-facing application for design partners and paying customers
- **URL:** https://renubu-iota.vercel.app (primary)
  - Additional aliases: https://renubu-justin-9239s-projects.vercel.app
- **Deployment Target:** Vercel (production)
- **Git Branch:** `main`
- **Database:** Supabase Production (TBD - currently using staging)
- **Deploy Trigger:** Push/merge to `main` branch
- **Stability:** HIGH - All features must be tested and approved
- **Feature Flags:** Enabled (for gradual rollouts)
- **Demo Mode:** FORCE DISABLED (security)

**Environment Variables (Vercel):**
```bash
NEXT_PUBLIC_SUPABASE_URL=<production_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production_anon_key>
NEXT_PUBLIC_DEMO_MODE=false  # Force disabled
NEXT_PUBLIC_SITE_URL=https://renubu-iota.vercel.app
```

**Promotion Path:** Staging → Production (after QA approval)

---

### 2. **Staging / QA**
- **Purpose:** Pre-production testing environment, mirrors production setup
- **URL:** TBD (Vercel preview deployment or dedicated staging URL)
- **Deployment Target:** Vercel (preview or dedicated project)
- **Git Branch:** `staging` (to be created) or tagged releases
- **Database:** Supabase Staging
  - URL: `https://amugmkrihnjsxlpwdzcy.supabase.co`
  - Isolated from production, sanitized customer data
- **Deploy Trigger:**
  - Automatic: Push to `staging` branch
  - Manual: Promote from `dev` after passing tests
- **Stability:** MEDIUM - Feature complete but may have minor bugs
- **Demo Mode:** Configurable via env var
- **Testing:** Final QA, design partner UAT, performance testing

**Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://amugmkrihnjsxlpwdzcy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging_anon_key>
NEXT_PUBLIC_DEMO_MODE=false  # Can be enabled for testing
NEXT_PUBLIC_SITE_URL=<staging_url>
```

**Promotion Path:** Dev → Staging → Production

---

### 3. **Dev**
- **Purpose:** Integration environment for testing new code with latest release
- **URL:** TBD (Vercel preview deployment)
- **Deployment Target:** Vercel (preview)
- **Git Branch:** `dev` (to be created)
- **Database:** Supabase QA Database (with mock data)
  - Separate from staging, designed for breaking changes
  - Reset-able, test data generated via seeds
- **Deploy Trigger:** Automatic on push to `dev`
- **Stability:** LOW - Expected to break occasionally
- **Demo Mode:** Enabled by default
- **Testing:** Integration testing, agent validation, feature testing

**Use Case:**
- Merge multiple feature branches here first
- Test integration between features
- Agent-driven development testing
- Break things safely

**Promotion Path:** Feature branches → Dev → (if stable) → Staging

---

### 4. **Demo (Local + Cloud DB)**
- **Purpose:** Sales demonstrations with simplified or augmented code
- **URL:** `http://localhost:3000` (or custom port)
- **Deployment Target:** Local development server
- **Git Branch:** `demo` (to be created) or feature branches with demo flag
- **Database:** Supabase Staging (read-only) or dedicated demo DB
- **Demo Mode:** FORCE ENABLED on localhost
- **Demo User:** `justin@renubu.com` (auto-authenticated)
- **Stability:** MEDIUM - Polished for demos but may skip features

**Configuration:**
```bash
NEXT_PUBLIC_DEMO_MODE=true  # Auto-enabled on localhost
NEXT_PUBLIC_DEMO_USER_ID=d152cc6c-8d71-4816-9b96-eccf249ed0ac
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # For bypassing RLS
```

**Use Case:**
- Sales team runs demos locally
- No OAuth complexity (auto-authenticated)
- Can show "ideal state" vs production reality
- May include fake/enhanced data

**Safety:**
- Force disabled in production domains
- Visual "🎮 DEMO MODE" indicator always shown
- Service role key only works on localhost

---

### 5. **Labs Branches** (labs.{project}.renubu.local)
- **Purpose:** Experimental branches for major feature development (e.g., Weekly Planner)
- **URL:** `http://localhost:{port}` (dedicated port range: 3100-3199)
  - Example: `http://localhost:3101` for weekly planner
- **Deployment Target:** Local development server
- **Git Branch:** `labs/{project-name}` (e.g., `labs/weekly-planner`)
  - Current: `renubu.lab.weeklyplanner`
- **Database:** Supabase Staging or Dev (configurable)
- **Demo Mode:** Enabled
- **Stability:** EXPERIMENTAL - Major changes, complex merges expected

**Use Case:**
- Long-running feature development (multi-week)
- Major architecture changes
- New product capabilities
- Requires isolated environment to avoid conflicts with main development

**Examples:**
- `labs/weekly-planner` - AI-powered weekly planning workflow
- `labs/persona-generator` - Human persona generation system
- `labs/workflow-builder` - Visual workflow composition tool

**Port Assignment:**
```bash
labs/weekly-planner    → port 3101
labs/persona-generator → port 3102
labs/workflow-builder  → port 3103
```

**Merge Strategy:**
1. Develop in isolation on labs branch
2. Periodic syncs with main via rebase/merge
3. Feature complete → Create detailed merge plan
4. Merge to `dev` for integration testing
5. After validation → Merge to `staging` → `main`

---

### 6. **Feature Branches** (features.{feature}.renubu.local)
- **Purpose:** Independent feature development for smaller changes
- **URL:** `http://localhost:{port}` (dedicated port range: 3200-3299)
  - Example: `http://localhost:3201` for email integration
- **Deployment Target:** Local development server
- **Git Branch:** `feature/{feature-name}` (e.g., `feature/email-send`)
- **Database:** Supabase Dev/QA
- **Demo Mode:** Enabled
- **Stability:** VARIABLE - Active development

**Use Case:**
- Smaller features that can be completed in days/weeks
- Can work on multiple features in parallel
- Test in isolation before merging
- Avoid conflicts when working agentically (not serially)

**Examples:**
- `feature/email-send` → port 3201
- `feature/calendar-integration` → port 3202
- `feature/llm-interview` → port 3203
- `feature/artifact-export` → port 3204

**Workflow:**
1. Create feature branch from `main` or `dev`
2. Develop on dedicated local port
3. Test independently
4. When ready → Merge to `dev` for integration testing
5. After QA → Promote to `staging`
6. Final approval → Merge to `main`

---

## 🔄 Promotion Flow

```
┌─────────────────┐
│ Feature Branches│
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Labs Branches  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│      Dev        │ ← Integration testing, may break
└────────┬────────┘
         │
         v
┌─────────────────┐
│    Staging      │ ← QA testing, stable features
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Production    │ ← Customer-facing, highly stable
└─────────────────┘
```

---

## 🗂️ Branch Strategy

### Main Branches
- `main` - Production branch, protected
- `staging` - Pre-production, QA approved
- `dev` - Integration branch, latest development

### Supporting Branches
- `labs/{project-name}` - Experimental/major features
- `feature/{feature-name}` - Independent features
- `hotfix/{issue}` - Emergency production fixes
- `release/{version}` - Release preparation

### Branch Protection Rules

**`main` (Production):**
- ✅ Require pull request reviews (2 approvals)
- ✅ Require status checks to pass
- ✅ Require conversation resolution
- ✅ Require linear history
- ❌ No direct pushes

**`staging`:**
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ⚠️ Can force push if needed (with caution)

**`dev`:**
- ✅ Require status checks (CI/CD)
- ⚠️ Direct pushes allowed for rapid development
- 🔄 Auto-deploy to dev environment

---

## 🚀 Deployment Checklist

### Before Deploying to Production:
- [ ] All tests passing in `staging`
- [ ] QA approval received
- [ ] Performance metrics acceptable
- [ ] Database migrations tested and reversible
- [ ] Feature flags configured correctly
- [ ] Monitoring/alerts set up
- [ ] Rollback plan documented
- [ ] Design partners notified (if customer-facing changes)

### Before Deploying to Staging:
- [ ] All tests passing in `dev`
- [ ] Integration tests completed
- [ ] Database migrations applied to staging DB
- [ ] Environment variables updated
- [ ] QA team notified

### Before Deploying to Dev:
- [ ] Feature branches tested locally
- [ ] Unit tests passing
- [ ] Conflicts resolved with latest `main`
- [ ] Database migrations compatible

---

## 🛠️ Local Development Setup

### Quick Start

**1. Clone repository:**
```bash
git clone https://github.com/Renew-Boo/renubu.git
cd renubu
npm install
```

**2. Choose environment:**
```bash
# For staging database (default)
npm run dev

# For production database (use with caution)
npm run dev:prod

# Check current environment
npm run env:status
```

**3. Run on custom port (for labs/feature branches):**
```bash
# Weekly planner lab (port 3101)
PORT=3101 npm run dev

# Email integration feature (port 3201)
PORT=3201 npm run dev
```

### Environment Switching

```bash
# Switch to staging
npm run env:staging

# Switch to production (local testing only)
npm run env:prod

# Check which environment is active
npm run env:status
```

---

## 📊 Current State (as of 2025-11-05)

### ✅ What Exists:
- Production deployment on Vercel: https://renubu-iota.vercel.app
- Main branch deploys automatically
- Staging database: `amugmkrihnjsxlpwdzcy.supabase.co`
- Local environment switching scripts
- Demo mode implementation (on labs branch)

### 🚧 What Needs Setup:
- [ ] Dedicated `staging` branch and deployment
- [ ] Dedicated `dev` branch and deployment
- [ ] QA database setup (separate from staging)
- [ ] Production database (currently using staging)
- [ ] Feature flag system
- [ ] Port management for labs/feature branches
- [ ] Branch protection rules in GitHub
- [ ] CI/CD pipelines for each environment

### ⚠️ Current Issues:
- Production and staging both point to same database
- No dedicated dev environment
- No QA database with test data
- Branch protection not configured

---

## 🎯 Next Steps (Sprint 0)

1. **Create missing branches:**
   - Create `staging` branch from `main`
   - Create `dev` branch from `main`
   - Configure Vercel deployments for each

2. **Setup databases:**
   - Create production Supabase project (if separate)
   - Create QA/dev Supabase project with test data
   - Update environment variables accordingly

3. **Configure GitHub:**
   - Set up branch protection rules
   - Create GitHub Projects board
   - Configure CI/CD workflows

4. **Document processes:**
   - Git workflow guide
   - Deployment runbook
   - Rollback procedures

---

## 📚 Related Documentation

- `docs/GIT-WORKFLOW.md` - Detailed branching and merge strategies
- `docs/DEMO-MODE.md` - Demo mode configuration and safety
- `docs/labs/Q4-2025-DEVELOPMENT-PLAN.md` - Q4 project timeline
- `docs/AGENT-ONBOARDING.md` - Agent setup and collaboration guide

---

## ❓ Questions & Answers

**Q: Why 6 environments instead of the traditional 3?**
A: We're building multiple major features in parallel using AI agents. Labs and feature branches let us work on complex changes independently without blocking each other.

**Q: Why local deployments for labs/features?**
A: Cost and speed. Running multiple Vercel preview deployments gets expensive. Local development with cloud databases gives us the best of both worlds.

**Q: When should I use a labs branch vs feature branch?**
A: Labs = multi-week, major architectural changes (e.g., Weekly Planner). Features = days to 2 weeks, focused changes (e.g., email sending).

**Q: How do I test with real data locally?**
A: Use demo mode with staging database. Enable `NEXT_PUBLIC_DEMO_MODE=true` and you'll auto-authenticate as test user with access to real data.

**Q: What if staging and production need to diverge temporarily?**
A: That's expected! Staging is your testing ground. Production stays stable. Once staging is validated, promote via PR to main.

---

**Document Status:** Draft - Sprint 0
**Next Review:** After dev/staging environments are created
