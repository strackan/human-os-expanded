# Renubu Development Plan

**Last Updated:** 2025-11-05
**Current Phase:** Phase 0 (Sprint 0) - 95% Complete
**Next Phase:** Phase 0.1 (MCP Code Execution) - Starts Nov 13

---

## 🎯 Current Status

### Phase 0: Sprint 0 - Agentification Infrastructure ✅
**Dates:** Nov 5-6, 2025
**Status:** 95% Complete
**Completed:** 18h / 20h planned

**Delivered:**
- ✅ 7 comprehensive documentation files (~28,000 lines)
- ✅ Auth timeout detection and signin redirect fix
- ✅ Demo mode auto-enable system
- ✅ Merged to main (PR #1)
- ✅ 4 living docs + snapshot system
- ✅ GitHub Projects setup (in progress)

**Remaining:**
- ⏸️ Environment validation (3h)
- ⏸️ Final Phase 0 snapshot (15 min)

---

## 📅 Q4 2025 Roadmap (Nov 5 - Dec 20)

### Phase 0.1: MCP Code Execution + Enhanced Agentification
**Dates:** Nov 13-22, 2025 (Week 1)
**Hours:** 10-15h
**Goal:** Implement MCP code execution for 50-80% velocity boost

**Key Deliverables:**
1. Renubu MCP server exposing database/workflows/calendar as code APIs (4h)
2. Secure Docker sandbox with resource limits (4h)
3. Integration with Claude Code Task tool (3h)
4. Token usage benchmarking (target: 90%+ reduction) (2-4h)

**Success Criteria:**
- Agents write TypeScript code calling Renubu operations
- 90%+ token reduction vs direct tool calls measured
- Sandbox security validated
- Ready for Phase 1 agentified development

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
| Phase 0.1 | Nov 13-22 | 10-15h | MCP code execution |
| Phase 1 Week 1 | Nov 25-29 | 25h | Workflow snoozing foundation |
| Phase 1 Week 2 | Dec 2-6 | 20h | UI implementation |
| Phase 1 Week 3 | Dec 9-13 | 20h | Intelligence & polish |
| Phase 1 Week 4 | Dec 16-20 | 20h | Advanced conditions & launch |
| CS Product | Ongoing | 89h | Priority 1 customer work |
| Lane 2 Buffer | Ongoing | 18h | Flex capacity |
| **TOTAL** | | **222-227h** | |

**Expected Velocity:**
- Without MCP: 22-36% boost = effective 272-302h capacity
- With MCP: 50-80% boost = **effective 333-408h capacity**

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
