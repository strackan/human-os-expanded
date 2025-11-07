# Renubu Development Plan

**Last Updated:** 2025-11-06
**Current Phase:** Phase 0.2 (Constants Consolidation) - 100% Complete
**Next Phase:** Phase 0.1 (MCP Code Execution with Deno) - Starts Nov 13

---

## 🎯 Current Status

### Phase 0: Sprint 0 - Agentification Infrastructure ✅
**Dates:** Nov 5, 2025
**Status:** 100% Complete
**Completed:** 19.5h / 20h planned

**Delivered:**
- ✅ Documentation reorganized (4 living docs + snapshots + archive)
- ✅ Auth timeout detection and signin redirect fix
- ✅ Demo mode auto-enable system
- ✅ Merged to main (PR #1)
- ✅ GitHub Projects guide created
- ✅ Phase 0.1 plan finalized (MCP with Deno)

**Deferred to Later:**
- ⏸️ Environment validation (1-2h) - Can do during Phase 0.1 if needed
- ⏸️ GitHub Projects board setup - Deferred (not needed for Phase 0.2 test)

### Phase 0.2: Constants Consolidation + Agentification Test ✅
**Dates:** Nov 6, 2025
**Status:** 100% Complete
**Completed:** 0.75h (45 minutes)

**Delivered:**
- ✅ 3 Worker Agents executed in parallel
- ✅ 26 files migrated (8 + 11 + 7 by agents)
- ✅ 3 constants files created (database, status-enums, api-routes)
- ✅ Git worktrees strategy validated
- ✅ Merge conflict resolution tested (2 conflicts, 5 min to resolve)
- ✅ TypeScript compilation verified (zero new errors)
- ✅ Agentification strategy proven for Phase 1

---

## 📅 Q4 2025 Roadmap (Nov 5 - Dec 20)

### Phase 0.2: Constants Consolidation + Agentification Test ✅
**Dates:** Nov 6, 2025 (1 day)
**Hours:** 0.75h (45 minutes)
**Status:** COMPLETE
**Goal:** Test agentification strategy with real parallel work

**Strategic Purpose:**
- Proof-of-concept for Phase 1 agentification approach
- Consolidate database, status, and API route string literals
- Validate git worktrees + parallel agents + Queen Bee coordination

**Agentification Test Results:**
- ✅ **3 Worker Agents** executed in parallel (Agent 1: DB constants, Agent 2: Status enums, Agent 3: API routes)
- ✅ **26 files migrated** (8 by Agent 1, 11 by Agent 2, 7 by Agent 3)
- ✅ **3 constants files created** (database.ts, status-enums.ts, api-routes.ts)
- ✅ **Zero new TypeScript errors** (all agents verified compilation)
- ✅ **Git worktrees prevented conflicts** (perfect isolation during execution)
- ⚠️ **2 merge conflicts** (7.7% rate, resolved in 5 minutes)

**Files Created:**
- `src/lib/constants/database.ts` (218 lines) - 30+ tables, 150+ columns
- `src/lib/constants/status-enums.ts` (158 lines) - 11 enums (WorkflowExecutionStatus, TaskStatus, Priority, etc.)
- `src/lib/constants/api-routes.ts` (333 lines) - 50+ routes across all domains

**Key Learnings:**
1. **Git worktrees work perfectly** - Zero conflicts during agent work
2. **Parallel execution validated** - All 3 agents completed simultaneously
3. **Merge conflicts are manageable** - 7.7% rate, trivial to resolve
4. **Agents exceed expectations** - Agent 2 did 11 files vs 5 target (120% overachievement)
5. **Task decomposition is critical** - Clear boundaries = no coordination needed

**Velocity Analysis:**
- Traditional solo: 24-35 hours over 3-4 days
- Agentified: 45 minutes (32-47x faster with subagent execution)
- Expected Phase 1 multiplier: 2-3x (human-equivalent work)

**Documentation:**
- `docs/phase-0.2-task-decomposition.md` - Complete task breakdown
- `docs/phase-0.2-agentification-results.md` - Comprehensive learnings

**Readiness Assessment:** ✅ **VALIDATED FOR PHASE 1**
- Proven: git worktrees, parallel agents, Queen Bee coordination
- Tested: conflict resolution, TypeScript verification, communication protocol
- Ready: Full agentification strategy for 125-hour Phase 1 project

---

### Phase 0.1: MCP Code Execution with Deno
**Dates:** Nov 13-15, 2025 (3 days)
**Hours:** 12h
**Goal:** Implement MCP code execution for 50-80% velocity boost (3x more agents working)

**Why Now (Not Later):**
- 90%+ token reduction = 10 agents vs 3 agents in parallel
- Agents learn MCP patterns from day 1 (no rework later)
- Compounding velocity gains across all phases
- MCP is the future - build foundation now

**Key Deliverables:**

#### Day 1-2: MCP Server Structure (5h)
1. **Design Renubu MCP Server (2h)**
   - Filesystem-based API structure (`servers/renubu/`)
   - Workflow operations (query, create, snooze, wake, evaluate)
   - Database operations (customers, profiles, tasks)
   - Calendar operations (findOpening, getEvents)
   - TypeScript interfaces

2. **Implement Core Operations (3h)**
   - Workflow CRUD with Supabase
   - Database queries with RLS
   - TypeScript types for all operations
   - Error handling and validation

#### Day 3: Deno Sandbox (3h)
1. **Deno Execution Wrapper (2h)**
   - Permission-restricted execution (--allow-net, --allow-env only)
   - No filesystem access (--no-allow-read, --no-allow-write)
   - No subprocess execution (--no-allow-run)
   - Temp file cleanup

2. **Audit Logging (1h)**
   - Log all code executions
   - Track token usage
   - Alert on errors

#### Day 4: Integration & Testing (4h)
1. **Claude Code Integration (2h)**
   - Configure MCP client
   - Test progressive disclosure
   - Benchmark token usage (target: 90%+ reduction)

2. **Safety Validation (2h)**
   - Test permission denials (filesystem, network, subprocess)
   - Verify audit logs
   - Test resource limits
   - Validate error handling

**Success Criteria:**
- [ ] Agents write TypeScript code calling Renubu operations
- [ ] 90%+ token reduction measured (150K → 15K tokens)
- [ ] 10 agents can work simultaneously (vs 3 before)
- [ ] Deno permissions block unauthorized access
- [ ] Audit logs capture all operations
- [ ] Ready for Phase 1 with 3x agent capacity

**Security Model:**
- **Threat Model:** Accidental mistakes, not malicious attacks
- **Mitigation:** Deno permissions (explicit allow-list)
- **Escape Risk:** Low (production-grade Deno used by Netlify, Supabase, Slack)
- **Real Protection:** Queen Bee code review + dry-run mode + audit logs

**CS Product:** 20h continues in parallel

---

### Phase 1: Workflow Snoozing - "I Won't Let You Forget"
**Dates:** Nov 25 - Dec 20, 2025 (4 weeks)
**Hours:** 125h with MCP velocity boost
**Goal:** Ship core product promise by Dec 20

**Strategic Context:**
- Core product promise: "I won't let you forget"
- Builds on existing task snooze infrastructure
- Weekly Planner becomes a workflow type on this foundation
- Enables universal work management across domains

#### Week 1 (Nov 25-29): Foundation - 25h

**Database & Schema (6h)**
- `workflows` table with condition-based snooze fields
- `workflow_conditions` table for condition evaluator
- Migration from task-level to workflow-level snooze
- Seed test data

**Condition Evaluator Service (8h)**
- `WorkflowConditionService.ts` - Evaluate business conditions
- `WorkflowSurfaceService.ts` - Smart wake logic
- Integration with existing `DailyTaskEvaluationService`

**API Routes (4h)**
- POST `/api/workflows/snooze` - Snooze workflow
- POST `/api/workflows/wake` - Wake workflow manually
- GET `/api/workflows/evaluate` - Check which should surface

**Testing (2h) + CS Product (12h) + Lane 2 (3h)**

**Success Criteria:**
- Database schema deployed
- Can snooze workflows with date + condition
- Condition evaluator detects when to wake
- API routes functional

#### Week 2 (Dec 2-6): UI Implementation - 20h

**Snooze UI Components (10h)**
- `SnoozeDialog.tsx` - Date picker + condition selector (4h)
- `WorkflowDashboard.tsx` - Active/snoozed/completed views (6h)
- "I won't let you forget" messaging throughout

**Integration Layer (8h)**
- Bridge to `workflow_executions` table (3h)
- Dashboard data hooks (`useWorkflows`, `useSnoozeWorkflow`) (3h)
- Update `DashboardClient.tsx` with snoozed items (2h)

**Testing (2h) + CS Product (20h) + Lane 2 (3h)**

**Success Criteria:**
- User can snooze workflows with conditions
- Dashboard shows active vs snoozed clearly
- "I won't let you forget" promise feels tangible
- Mobile experience functional

#### Week 3 (Dec 9-13): Intelligence & Polish - 20h

**Intel Files Integration (8h)**
- Fast/slow/identity context storage in JSONB (3h)
- Surface decision logic respecting user capacity (3h)
- Condition metadata enrichment (2h)

**Smart Wake Logic Enhancement (6h)**
- Capacity checking (don't surface if overwhelmed) (2h)
- Dependency validation (check prerequisites) (2h)
- Priority scoring algorithm (urgency + user state + conditions) (2h)

**Dogfooding & Refinement (4h)**
- Justin uses system for idea management
- Test "after-3-design-partners" condition
- Refine UX based on real usage

**Documentation (2h)**

**CS Product (20h) + Lane 2 (3h)**

**Success Criteria:**
- Intel files inform surface decisions
- System respects user capacity
- Justin successfully parks 10+ ideas
- Conditions evaluate correctly

#### Week 4 (Dec 16-20): Advanced Conditions & Launch - 20h

**Business Condition Types (10h)**
- Customer lifecycle conditions (implementation_complete, renewal_90_days_out) (3h)
- Business milestone conditions (after-N-design-partners, post-launch) (3h)
- Date/quarter conditions (q2-2026, next-budget-cycle) (2h)
- Combination logic (AND/OR conditions) (2h)

**Condition Evaluator Enhancement (6h)**
- Event-driven evaluation (on customer/milestone changes) (3h)
- Scheduled evaluation (daily cron for date checks) (2h)
- Performance optimization (1000+ snoozed workflows) (1h)

**Polish & Launch Prep (4h)**
- Design partner demo prep (2h)
- Analytics & monitoring (1h)
- Production deployment (1h)

**CS Product (17h) + Lane 2 (6h)**

**Success Criteria:**
- All condition types working
- Event-driven wake logic functional
- System handles 1000+ snoozed items
- CSM demo-ready
- "I won't let you forget" ships Dec 20

---

## 📊 Resource Allocation Summary

| Phase | Dates | Hours | Purpose |
|-------|-------|-------|---------|
| Phase 0 | Nov 5-6 | 20h | Agentification infrastructure ✅ |
| Phase 0.1 | Nov 13-15 | 12h | MCP code execution with Deno |
| Phase 1 Week 1 | Nov 25-29 | 25h | Workflow snoozing foundation |
| Phase 1 Week 2 | Dec 2-6 | 20h | UI implementation |
| Phase 1 Week 3 | Dec 9-13 | 20h | Intelligence & polish |
| Phase 1 Week 4 | Dec 16-20 | 20h | Advanced conditions & launch |
| CS Product | Ongoing | 89h | Priority 1 customer work |
| Lane 2 Buffer | Ongoing | 18h | Flex capacity |
| **TOTAL** | | **224h** | |

**Expected Velocity:**
- Baseline (git worktrees + parallel agents): 22-36% boost
- With MCP (token reduction + 10 agents): 50-80% total boost
- **Effective capacity: 336-403h from 224h investment**
- **Result: 3x more agents working = 3.3x throughput**

---

## 🚫 Deferred to Q1 2026

### Weekly Planner
**Original Plan:** 109h over 5 weeks
**Deferral Reason:** Build on workflow snoozing foundation first
**New Timeline:** Q1 2026 (Jan-Mar)
**Expected Hours:** 40-60h (faster with snooze infrastructure)

Weekly Planner becomes a recurring workflow type that benefits from:
- Condition-based snoozing
- Smart wake logic
- Intel files integration
- Universal workflow abstraction

---

## 🎯 Success Metrics

### Phase 0.1 (Nov 22)
- [ ] 90%+ token reduction measured
- [ ] Sandbox security validated
- [ ] Agents writing TypeScript code successfully

### Phase 1 (Dec 20)
- [ ] User can snooze workflows with date + condition
- [ ] Condition evaluator detects when to wake
- [ ] "I won't let you forget" promise tangible
- [ ] Justin parks 10+ ideas successfully
- [ ] CSM demo-ready
- [ ] All condition types working
- [ ] System handles 1000+ snoozed workflows

### Velocity Targets
- Phase 0 baseline: 22-36% boost achieved
- Phase 0.1: 50-80% total boost achieved
- Phase 1 completion: 70%+ task completion rate

---

## 🔗 Related Documentation

- `STATE.md` - What's currently built
- `AGENT-GUIDE.md` - How to work here
- `DEV-GUIDE.md` - Technical reference
- `snapshots/` - Historical plans

---

**Document Status:** Living document (updated continuously)
**Next Update:** After Phase 0.1 completion (Nov 22)
