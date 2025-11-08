# Renubu Agent Guide

**Last Updated:** 2025-11-05
**Purpose:** Complete guide for AI agents working on Renubu
**Reading Time:** 15 minutes

---

## 🚀 Quick Start (5 Minutes)

### 1. Read These 4 Files
- `PLAN.md` - Current phase and goals
- `STATE.md` - What's already built
- `AGENT-GUIDE.md` - This file (how to work here)
- `DEV-GUIDE.md` - Technical architecture

### 2. Check Your Assignment
```bash
# View GitHub Projects board
gh project view --owner Renew-Boo

# See your assigned tasks
# Filter by: assigned:@me status:Todo
```

### 3. Set Up Your Workspace
```bash
# Clone repository (if needed)
git clone https://github.com/Renew-Boo/renubu.git
cd renubu

# Create your worktree (for parallel work)
git worktree add ../renubu-agent-1 -b feature/your-task

# Work in your isolated directory
cd ../renubu-agent-1
pnpm install
```

### 4. Start Development
```bash
# Run in demo mode (auto-auth as justin@renubu.com)
pnpm dev

# Navigate to http://localhost:3000
# Demo mode auto-enabled on localhost
```

### 5. Communication
- **Daily updates:** Google Chat "Renubu Dev Sync"
- **Task status:** Update GitHub Projects
- **Code review:** Create PR, link to issue
- **Blockers:** Comment on GitHub issue + mention in chat

---

## 📡 Communication Protocol

### Daily Update Format
Post to Google Chat **at end of work session:**

```
🤖 Agent Update - 2025-11-05 - Agent 1

📝 Session Summary:
- Duration: 3h
- Branch: feature/snooze-dialog
- Focus: SnoozeDialog component implementation

✅ Completed:
- Issue #47: Implement SnoozeDialog.tsx (4h estimated, 3.5h actual)
- PR #3 created and tests passing

🔄 In Progress:
- None

🚧 Blockers:
- None

📊 Velocity:
- Estimated: 4h
- Actual: 3.5h
- Quality: All tests passing, no errors

🔗 Links:
- PR: #3
- Issues closed: #47

🎯 Next Session:
- Issue #48: Integrate SnoozeDialog with WorkflowDashboard
- Estimated: 3h
```

### Escalation Levels

**Level 1: Question (Non-Blocking)**
Response time: Within 2 hours during business hours

```
❓ Quick Question - SnoozeDialog API

Context: Implementing date picker for snooze
Question: Should we use native date picker or library like react-datepicker?
Impact: Non-blocking, can proceed with either

Options considered:
1. Native <input type="date"> - Simpler, less bundle size
2. react-datepicker - Better UX, more control

Preference: Native for MVP
```

**Level 2: Blocker (Work Stopped)**
Response time: Within 1 hour during business hours

```
🚧 BLOCKER - Database Migration Failing

What's blocked: Cannot test WorkflowConditionService
Root cause: Migration 20251125_workflows_table.sql failing on foreign key
Impact: 3h of work blocked
Workarounds considered: Tried dropping/recreating, no success
Need: Database schema review or migration fix

@Justin (or relevant person)
```

**Level 3: Critical (Production Down)**
Response time: Immediate

```
🔥 CRITICAL - Production Auth Broken

Severity: Production down - users cannot sign in
What's broken: AuthProvider returning null user
Customer impact: All users affected
Error details: "getSession timeout after 30 seconds"
Attempted fixes: Rolled back last 2 commits, still failing
Rollback possible: Yes - git revert abc123

@Justin + Phone call if no response in 5 minutes
```

### Code Review Protocol

**Requesting Review:**
1. Create PR with clear description
2. Self-review first (catch obvious issues)
3. Assign specific reviewers
4. Add labels (priority, estimated review time)
5. Link related issues
6. Post in Google Chat if urgent

**Example PR Description:**
```markdown
## Summary
Implements SnoozeDialog component for workflow snoozing

## Changes
- New component: SnoozeDialog.tsx (150 lines)
- Date picker with condition selector
- Form validation and error states
- Tests: SnoozeDialog.test.tsx

## Testing
- [x] Date picker works
- [x] Condition selector works
- [x] Validation prevents past dates
- [x] Mobile responsive
- [x] All tests passing

## Screenshots
[Attach screenshots for UI changes]

## Related Issues
Closes #47

## Review Time
Estimated: 15 minutes (small component)
```

**Providing Review:**
Use comment types:
- 🔴 `[blocker]` - Must fix before merging
- 🟡 `[suggestion]` - Nice to have, not required
- 🔵 `[question]` - Clarification needed
- 💡 `[idea]` - Consider for future

---

## 🔧 Git Workflow

### Branch Strategy

**Main Branches:**
- `main` - Production (protected, requires 2 approvals)
- `staging` - Pre-production testing (protected, 1 approval)
- `dev` - Integration testing (status checks required)

**Work Branches:**
- `feature/*` - New features (e.g., `feature/snooze-dialog`)
- `fix/*` - Bug fixes (e.g., `fix/auth-timeout`)
- `docs/*` - Documentation (e.g., `docs/update-readme`)

### Git Worktrees (For Parallel Work)

**Why:** Multiple agents can work simultaneously with zero merge conflicts

**Setup:**
```bash
# Agent 1 works on feature A
git worktree add ../renubu-agent-1 -b feature/snooze-dialog

# Agent 2 works on feature B
git worktree add ../renubu-agent-2 -b feature/condition-evaluator

# Each agent has isolated directory
# No conflicts, no context switching
```

**Commands:**
```bash
# List worktrees
git worktree list

# Remove worktree (after PR merged)
git worktree remove ../renubu-agent-1

# Prune stale worktrees
git worktree prune
```

### Commit Messages (Conventional Commits)

**Format:**
```
<type>(<scope>): <subject>

<body (optional)>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**
```bash
# Feature
feat(workflows): implement SnoozeDialog component

# Fix
fix(auth): prevent timeout on getSession()

# Documentation
docs(plan): update Phase 1 timeline

# Multiple scopes
feat(workflows, api): add snooze condition evaluator
```

### Pull Request Flow

1. **Create PR** (when work complete)
2. **Self-review** (catch obvious issues)
3. **Request review** (assign reviewers, add labels)
4. **Address feedback** (fix blockers, consider suggestions)
5. **Get approval** (at least 1 approval required)
6. **Merge** (squash merge to keep history clean)
7. **Delete branch** (cleanup after merge)

**PR Checklist:**
- [ ] Tests passing
- [ ] No console errors
- [ ] Mobile responsive (if UI change)
- [ ] Documentation updated
- [ ] Linked to GitHub issue
- [ ] Self-reviewed

---

## 🏗️ Development Environment

### Local Setup

**Prerequisites:**
- Node 20.x
- pnpm
- Git

**Environment Variables (.env.local):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Demo Mode (auto-enabled on localhost)
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_USER_ID=d152cc6c-8d71-4816-9b96-eccf249ed0ac
```

**Commands:**
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run type checking
pnpm type-check

# Run tests
pnpm test

# Build for production
pnpm build
```

### Demo Mode

**What It Does:**
- Auto-authenticates as justin@renubu.com
- Bypasses RLS policies (uses service role key)
- Shows visual badge indicator
- Force-disabled on production domains

**How It Works:**
1. Detects `localhost` or `127.0.0.1`
2. Automatically enables (unless explicitly disabled)
3. Server-side uses service role key
4. Client-side skips auth checks

**Safety:**
- ✅ Only works on localhost
- ✅ Force-disabled on renubu.com, vercel.app
- ✅ Production environment variable check

**Files:**
- `src/lib/demo-mode-config.ts` - Configuration
- `src/components/auth/DemoModeBadge.tsx` - Visual indicator
- `src/lib/supabase/server.ts` - Server-side integration

---

## 🚀 Deployment

### Environments

**Production:**
- URL: renubu-iota.vercel.app
- Branch: `main`
- Deploy: Automatic on merge to main
- Demo mode: DISABLED

**Staging (Planned):**
- Branch: `staging`
- Deploy: Automatic on merge to staging
- Purpose: Pre-production testing

**Dev (Planned):**
- Branch: `dev`
- Deploy: Automatic on merge to dev
- Purpose: Integration testing

### Deployment Process

**Don't deploy manually** - Vercel handles automatic deploys

**Preview Deployments:**
- Every PR gets preview URL
- Check preview before merging
- Share preview URL for feedback

---

## 📋 Task Management

### GitHub Projects

**Board Structure:**
- **Backlog** - Not yet planned
- **Todo** - Ready to start
- **In Progress** - Currently working
- **Review** - PR created, awaiting review
- **Done** - Completed and merged
- **Blocked** - Waiting on something

**Task Fields:**
- **Assignee** - Who's working on it (Agent 1, Agent 2, Human)
- **Priority** - high, medium, low
- **Estimate** - Hours estimated
- **Agent-Friendly** - Yes/No (can agent do this alone?)
- **Labels** - Type (feature, fix, docs), area (auth, workflows, UI)

**Workflow:**
```bash
# 1. Pick task from Todo
# Move card to In Progress, assign yourself

# 2. Create branch and worktree
git worktree add ../renubu-agent-1 -b feature/task-name

# 3. Work on task
# Make commits, test changes

# 4. Create PR
gh pr create --title "..." --body "..." --issue 47

# 5. Move card to Review
# Wait for approval

# 6. Merge and move to Done
gh pr merge 3 --squash --delete-branch
```

### Task Types

**Agent-Friendly (70-85% success rate):**
- ✅ Implementing defined components
- ✅ Writing API routes with clear specs
- ✅ Adding database queries
- ✅ Writing tests
- ✅ Updating documentation

**Human-Required (review needed):**
- ⚠️ UX/UI design decisions
- ⚠️ Complex state management architecture
- ⚠️ Performance optimization choices
- ⚠️ Security review
- ⚠️ Product direction decisions

---

## 🎯 Best Practices

### Code Quality

**Always:**
- Write TypeScript (no `any` types unless absolutely necessary)
- Add JSDoc comments for complex functions
- Write tests for new features
- Handle error states
- Add loading states
- Make UI responsive (mobile-friendly)

**Never:**
- Commit console.logs (unless intentional debugging)
- Skip type checking
- Merge with failing tests
- Deploy without testing locally
- Create unprotected API routes

### Testing

**What to Test:**
- Component rendering
- User interactions
- API endpoint responses
- Service method logic
- Error handling

**Test Files:**
- Co-locate: `Component.tsx` → `Component.test.tsx`
- Use Jest + React Testing Library
- Aim for 60%+ coverage on critical paths

### Performance

**Watch Out For:**
- Unnecessary re-renders
- Large bundle sizes
- Slow database queries
- Memory leaks in useEffect
- Unoptimized images

---

## 🔗 Related Documentation

- `PLAN.md` - Current development plan
- `STATE.md` - What's currently built
- `DEV-GUIDE.md` - Technical architecture
- `snapshots/` - Historical documentation

---

## ❓ FAQ

**Q: What if I disagree with a code review comment?**
A: Respond with context and reasoning. Discuss asynchronously first, escalate to sync call if needed. Defer to tech lead if no consensus.

**Q: How do I know if a task is agent-friendly?**
A: Clear requirements, existing patterns to follow, no ambiguous decisions = agent-friendly. UI/UX choices, architecture decisions = human required.

**Q: What if I miss a daily update?**
A: Post a catch-up update when you can. If unavailable for multiple days, announce it in advance.

**Q: How detailed should commit messages be?**
A: Subject line = what changed. Body = why it changed (if not obvious). Use conventional commits format.

**Q: What if an agent makes a mistake?**
A: Review PR before merging, provide feedback in PR comments. Mistakes are expected and okay - that's what code review is for.

---

**Document Status:** Living document (updated when processes change)
**Next Update:** After Phase 0.1 (Nov 22) if MCP changes workflow
