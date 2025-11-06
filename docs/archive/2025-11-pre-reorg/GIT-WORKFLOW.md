# Git Workflow & Branching Strategy

**Last Updated:** 2025-11-05
**Owner:** Engineering Team
**Related:** `docs/DEPLOYMENT-STRATEGY.md`

---

## Overview

Renubu uses a **trunk-based development model** with strategic long-lived branches for parallel feature development. This approach supports agentified development where multiple AI agents and developers can work simultaneously without blocking each other.

---

## 🌳 Branch Types

### Permanent Branches

#### 1. `main` (Production)
- **Purpose:** Production-ready code
- **Protection:** HIGH - Requires 2 PR approvals
- **Deploy Target:** Production (https://renubu-iota.vercel.app)
- **Stability:** Must be deployable at all times
- **Merge From:** `staging` only (after QA approval)

#### 2. `staging` (QA/Pre-Production)
- **Purpose:** QA testing and design partner UAT
- **Protection:** MEDIUM - Requires 1 PR approval
- **Deploy Target:** Staging environment
- **Stability:** Feature complete, minor bugs acceptable
- **Merge From:** `dev` (after integration tests pass)

#### 3. `dev` (Integration)
- **Purpose:** Integration of multiple features
- **Protection:** LOW - Status checks required
- **Deploy Target:** Dev environment
- **Stability:** Expected to break occasionally
- **Merge From:** `feature/*`, `labs/*` branches

### Temporary Branches

#### 4. `labs/{project-name}` (Experimental)
- **Purpose:** Major multi-week features with complex changes
- **Lifespan:** Weeks to months
- **Examples:**
  - `labs/weekly-planner` - AI-powered weekly planning
  - `labs/persona-generator` - Human persona generation
  - `labs/workflow-builder` - Visual workflow composition
- **Naming Convention:** `labs/{descriptive-name}`
- **Merge Target:** `dev` → `staging` → `main`

**Current Labs Branches:**
- `renubu.lab.weeklyplanner` - Weekly planner Q4 project

#### 5. `feature/{feature-name}` (Independent Features)
- **Purpose:** Smaller focused features (days to 2 weeks)
- **Lifespan:** Days to weeks
- **Examples:**
  - `feature/email-send` - Email sending capability
  - `feature/calendar-integration` - Google Calendar OAuth
  - `feature/llm-interview` - LLM-powered interview artifact
- **Naming Convention:** `feature/{descriptive-name}`
- **Merge Target:** `dev` → `staging` → `main`

#### 6. `hotfix/{issue}` (Emergency Fixes)
- **Purpose:** Critical production bugs
- **Lifespan:** Hours to days
- **Examples:**
  - `hotfix/auth-redirect-loop`
  - `hotfix/database-connection`
- **Naming Convention:** `hotfix/{issue-description}`
- **Merge Target:** Directly to `main`, then backport to `staging` and `dev`

#### 7. `release/{version}` (Release Preparation)
- **Purpose:** Finalize release, version bumps, changelog
- **Lifespan:** Days
- **Examples:**
  - `release/v1.2.0`
  - `release/q4-2025-sprint-3`
- **Naming Convention:** `release/{version}`
- **Merge Target:** `main` after final validation

---

## 🔄 Branching Workflows

### Creating a New Feature Branch

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/calendar-integration

# Push to remote
git push -u origin feature/calendar-integration
```

### Creating a Labs Branch

```bash
# Create from main for new project
git checkout main
git pull origin main
git checkout -b labs/weekly-planner

# Or from existing branch if continuing work
git checkout renubu.lab.weeklyplanner
git checkout -b labs/weekly-planner-phase2

# Push to remote
git push -u origin labs/weekly-planner
```

### Working on a Branch

```bash
# Make changes
git add .
git commit -m "feat: add calendar OAuth flow"

# Push changes
git push origin feature/calendar-integration

# Keep branch updated with main (rebase)
git fetch origin main
git rebase origin/main

# Or merge if rebase is risky
git merge origin/main
```

### Syncing Labs Branch with Main

Labs branches are long-lived and need periodic syncing:

```bash
# Fetch latest main
git checkout labs/weekly-planner
git fetch origin main

# Option 1: Merge (safer, preserves history)
git merge origin/main
# Resolve conflicts if any
git push origin labs/weekly-planner

# Option 2: Rebase (cleaner history, riskier)
git rebase origin/main
# Resolve conflicts if any
git push --force-with-lease origin labs/weekly-planner
```

**Recommendation:** Use merge for labs branches to preserve history and reduce risk.

---

## 🚀 Merge Strategies

### Feature → Dev

**Purpose:** Integration testing with other features

**Process:**
1. Ensure feature is complete and tested locally
2. Create PR from `feature/x` to `dev`
3. Run CI/CD checks (tests, linting, build)
4. Agent or developer review (1 approval)
5. Merge using **Squash and Merge** (clean history)
6. Delete feature branch after merge

**PR Template:**
```markdown
## Feature: [Feature Name]

### Description
Brief description of the feature and its purpose

### Changes
- List key changes
- Include file modifications
- Note any breaking changes

### Testing
- [ ] Unit tests passing
- [ ] Local testing complete
- [ ] Integration with other features validated

### Screenshots (if applicable)
[Add screenshots or videos]

### Related Issues
Closes #123, #456

### Deployment Notes
- Any environment variable changes?
- Database migrations needed?
- Feature flags required?
```

### Labs → Dev

**Purpose:** Integrate major feature after completion

**Process:**
1. Complete all labs branch features
2. Sync with latest `main` (merge or rebase)
3. Create detailed PR with migration plan
4. Extensive testing in dev environment
5. Code review (2 approvals required for large changes)
6. Merge using **Merge Commit** (preserve labs history)
7. Keep labs branch until deployed to production

**PR Template:**
```markdown
## Labs Project: [Project Name]

### Executive Summary
High-level overview of the project and its impact

### Architecture Changes
- Database schema changes
- New services or major refactors
- Integration points

### Migration Plan
1. Database migrations (order matters)
2. Environment variable updates
3. Feature flag rollout strategy
4. Rollback procedure

### Testing Checklist
- [ ] Unit tests (XX% coverage)
- [ ] Integration tests complete
- [ ] Manual QA scenarios tested
- [ ] Performance benchmarks met
- [ ] Security review completed

### Deployment Strategy
- [ ] Feature flags configured
- [ ] Monitoring/alerts set up
- [ ] Rollback plan documented
- [ ] Design partners notified

### Screenshots/Demos
[Add demos or recordings]

### Risks & Mitigation
List potential risks and how they're mitigated

### Related Documentation
- Link to project plan
- Link to architecture docs
- Link to user guides
```

### Dev → Staging

**Purpose:** QA testing and design partner UAT

**Process:**
1. Dev environment stable for 24+ hours
2. All integration tests passing
3. Create PR from `dev` to `staging`
4. QA team review and approval
5. Deploy to staging environment
6. Design partner testing (if applicable)
7. Merge using **Merge Commit**

**QA Checklist:**
- [ ] All critical user flows tested
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Database migrations applied
- [ ] Environment variables updated

### Staging → Main (Production)

**Purpose:** Production deployment

**Process:**
1. Staging stable for 48+ hours minimum
2. QA sign-off received
3. Product owner approval
4. Create PR from `staging` to `main`
5. Final code review (2 approvals)
6. Merge using **Merge Commit**
7. Tag release: `git tag v1.2.0`
8. Deploy to production (automatic on merge)
9. Monitor for issues (first 24 hours)

**Production Deployment Checklist:**
- [ ] QA approval received
- [ ] Performance metrics acceptable
- [ ] Database migrations tested and reversible
- [ ] Feature flags configured correctly
- [ ] Monitoring/alerts set up
- [ ] Rollback plan documented and tested
- [ ] Design partners notified
- [ ] Changelog updated
- [ ] Release notes published

---

## 🚨 Hotfix Workflow

**When:** Critical production bug affecting customers

**Process:**
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/auth-redirect-loop

# Make minimal fix
# Test thoroughly

# Create PR to main (expedited review)
# Requires 1 approval + product owner sign-off

# After merge to main:
git checkout main
git pull origin main

# Backport to staging
git checkout staging
git cherry-pick <commit-hash>
git push origin staging

# Backport to dev
git checkout dev
git cherry-pick <commit-hash>
git push origin dev
```

**Hotfix Rules:**
- ✅ Minimal changes only (fix the bug, nothing else)
- ✅ Expedited review process
- ✅ Immediate deployment
- ✅ Must backport to all active branches
- ❌ No feature additions
- ❌ No refactoring

---

## 📋 Commit Message Convention

We use **Conventional Commits** for clear history and automated changelog generation.

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Add or update tests
- `chore:` - Build process, dependencies, tooling
- `ci:` - CI/CD configuration
- `revert:` - Revert previous commit

### Scopes (optional)
- `auth` - Authentication
- `dashboard` - Dashboard features
- `workflows` - Workflow system
- `calendar` - Calendar integration
- `planner` - Weekly planner
- `db` - Database changes

### Examples

**Feature:**
```
feat(calendar): add Google Calendar OAuth integration

- Implement OAuth 2.0 flow
- Store tokens in user_calendar_integrations table
- Add token refresh mechanism

Closes #234
```

**Bug Fix:**
```
fix(auth): resolve redirect loop on signin

Users were getting stuck in infinite redirect when
session expired. Fixed by clearing stale session data.

Fixes #456
```

**Breaking Change:**
```
feat(workflows)!: migrate to new composition system

BREAKING CHANGE: Old workflow definitions no longer compatible.
Migrations provided in /migrations/20251105_workflow_v2.sql
```

---

## 🔐 Branch Protection Rules

### `main` Branch
```yaml
Protection Rules:
  - Require pull request before merging: ✅
  - Require approvals: 2
  - Dismiss stale reviews: ✅
  - Require review from code owners: ✅
  - Require status checks to pass: ✅
    - CI/CD Build
    - Unit Tests
    - Type Check
    - Lint
  - Require conversation resolution: ✅
  - Require linear history: ✅
  - Include administrators: ✅ (no exceptions)
  - Allow force pushes: ❌
  - Allow deletions: ❌
```

### `staging` Branch
```yaml
Protection Rules:
  - Require pull request before merging: ✅
  - Require approvals: 1
  - Require status checks to pass: ✅
    - CI/CD Build
    - Integration Tests
  - Allow force pushes: ⚠️ (with --force-with-lease only)
```

### `dev` Branch
```yaml
Protection Rules:
  - Require status checks to pass: ✅
    - CI/CD Build
  - Direct pushes: ✅ (for rapid development)
  - Allow force pushes: ⚠️ (use with caution)
```

---

## 🛠️ Git Best Practices

### Do's ✅
- **Commit often** - Small, logical commits
- **Write clear messages** - Follow conventional commits
- **Pull before push** - Avoid unnecessary conflicts
- **Test before committing** - Broken code blocks others
- **Use branches** - Never work directly on main
- **Delete merged branches** - Keep repository clean
- **Tag releases** - Mark production deployments

### Don'ts ❌
- **Don't commit secrets** - Use environment variables
- **Don't commit node_modules** - Use .gitignore
- **Don't force push to main/staging** - Ever
- **Don't merge without review** - Except in dev
- **Don't work on multiple features in one branch** - Keep focused
- **Don't let branches get stale** - Sync with main regularly

---

## 🔍 Code Review Guidelines

### For Reviewers

**Fast Track (15 min):**
- Small bug fixes (<50 lines)
- Documentation updates
- Config changes
- Dependency updates

**Standard Review (1-2 hours):**
- New features (<500 lines)
- Refactoring
- Test additions
- UI changes

**Deep Review (4+ hours):**
- Labs projects (>500 lines)
- Architecture changes
- Database migrations
- Security-sensitive code

**What to Check:**
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] No obvious bugs or edge cases
- [ ] Performance implications considered
- [ ] Security vulnerabilities checked
- [ ] Breaking changes documented
- [ ] Documentation updated

### For Authors

**Before Requesting Review:**
- [ ] Code is complete and tested
- [ ] All tests passing locally
- [ ] Lint and type check passing
- [ ] PR description is clear
- [ ] Screenshots/videos included (if UI changes)
- [ ] Related issues linked
- [ ] Ready to merge (not a draft)

---

## 📊 Git Workflow Commands Cheat Sheet

```bash
# Check current branch and status
git status
git branch -a

# Create and switch to new branch
git checkout -b feature/my-feature

# Sync with main
git fetch origin main
git merge origin/main

# Commit changes
git add .
git commit -m "feat(scope): description"

# Push branch
git push -u origin feature/my-feature

# Create PR (via GitHub web UI or CLI)
gh pr create --base dev --title "Feature: My Feature"

# Update PR after review
git add .
git commit -m "fix: address review comments"
git push origin feature/my-feature

# Delete local branch after merge
git branch -d feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature

# Check for outdated branches
git fetch --prune
git branch -vv | grep ': gone]' | awk '{print $1}'
```

---

## 🎯 Current Branch Status (as of 2025-11-05)

### Active Branches:
- ✅ `main` - Production (https://renubu-iota.vercel.app)
- ❌ `staging` - Not created yet (TODO)
- ❌ `dev` - Not created yet (TODO)
- ✅ `renubu.lab.weeklyplanner` - Labs branch (Weekly Planner Q4)
- ✅ `test-staging-db` - Experimental branch

### Needs Setup:
1. Create `staging` branch from `main`
2. Create `dev` branch from `main`
3. Configure branch protection rules
4. Set up GitHub Actions for CI/CD
5. Configure automatic deployments
6. Rename `renubu.lab.weeklyplanner` to `labs/weekly-planner` (optional)

---

## 🔗 Related Documentation

- `docs/DEPLOYMENT-STRATEGY.md` - Environment architecture
- `docs/AGENT-COMMUNICATION.md` - Communication protocols
- `docs/AGENT-ONBOARDING.md` - Onboarding for agents
- `.github/pull_request_template.md` - PR templates (TODO)

---

## ❓ FAQ

**Q: When should I create a labs branch vs a feature branch?**
A: Labs = multi-week major changes (e.g., new product capability). Feature = days to 2 weeks focused change (e.g., add email sending).

**Q: Can I work directly on dev?**
A: Technically yes, but not recommended. Create a feature branch, test it, then merge to dev.

**Q: What if my feature branch conflicts with main?**
A: Merge or rebase main into your feature branch, resolve conflicts locally, then push.

**Q: How do I handle database migrations?**
A: Migrations go in `/supabase/migrations`, must be reversible, tested in dev first, then staging, then production.

**Q: Can I delete a labs branch after merging?**
A: Wait until the feature is deployed to production and stable for at least a week, then it's safe to delete.

**Q: What if I accidentally commit a secret?**
A: Immediately rotate the secret, remove it from git history using `git-filter-repo`, force push (if not on main), notify team.

---

**Document Status:** v0 Sprint 0
**Next Review:** After creating staging/dev branches
