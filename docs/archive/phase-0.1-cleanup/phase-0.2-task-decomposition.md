# Phase 0.2: Constants Consolidation - Task Decomposition

**Date:** 2025-11-06
**Queen Bee:** Claude (Main Agent)
**Worker Agents:** 3 parallel agents
**Approach:** Git worktrees for zero-conflict parallel execution

---

## Agentification Test Objectives

This is a **proof-of-concept test** of our agentification strategy before Phase 1. We're testing:

1. ✅ Queen Bee decomposition and coordination
2. ✅ Parallel Worker Agent execution
3. ✅ Git worktrees strategy (zero conflicts)
4. ✅ Communication protocol effectiveness
5. ✅ Velocity multiplier measurement

---

## Work Breakdown

### Agent 1: Database Constants Migration (8-12h)

**Git worktree:** `renubu-agent-1-database`
**Branch:** `phase-0.2/agent-1-database-constants`

**Tasks:**
1. Create `src/lib/constants/database.ts`
   - Define all table name constants (30+ tables)
   - Define common column constants (50+ columns)
   - Export TypeScript types

2. Migrate 5 service files:
   - `src/lib/services/WorkflowTaskService.ts`
   - `src/lib/services/WorkflowExecutionService.ts`
   - `src/lib/services/CustomerService.ts`
   - `src/lib/services/AlertService.ts`
   - `src/lib/services/NotificationService.ts`

3. Migrate 3 data provider files:
   - `src/lib/data-providers/workflowContextProvider.ts`
   - `src/lib/data-providers/contractProvider.ts`
   - `src/lib/data-providers/stakeholderProvider.ts`

**Success criteria:**
- TypeScript compiles with no errors
- All table names use constants from `database.ts`
- No string literals for database operations

---

### Agent 2: Status Enums Migration (6-8h)

**Git worktree:** `renubu-agent-2-status`
**Branch:** `phase-0.2/agent-2-status-enums`

**Tasks:**
1. Create `src/lib/constants/status-enums.ts`
   - Define all status enumerations (8+ enums)
   - Define priority, severity, risk enums
   - Export TypeScript types

2. Migrate 5 service files:
   - `src/lib/services/WorkflowActionService.ts`
   - `src/lib/services/WorkflowStepActionService.ts`
   - `src/lib/services/EventService.ts`
   - `src/lib/services/DailyTaskEvaluationService.ts`
   - `src/lib/workflows/orchestrator-db.ts`

3. Update type definitions:
   - Replace string literals with enum types
   - Update function signatures
   - Ensure type safety

**Success criteria:**
- TypeScript compiles with no errors
- All status values use enums from `status-enums.ts`
- Type definitions use enum types

---

### Agent 3: API Routes Migration (10-15h)

**Git worktree:** `renubu-agent-3-api-routes`
**Branch:** `phase-0.2/agent-3-api-routes`

**Tasks:**
1. Create `src/lib/constants/api-routes.ts`
   - Define all API route constants (50+ routes)
   - Group by domain (auth, workflows, customers, etc.)
   - Support parameterized routes

2. Migrate 5 hook files:
   - `src/hooks/useWorkflows.ts`
   - `src/hooks/useCustomers.ts`
   - `src/hooks/useRenewals.ts`
   - `src/hooks/useTasks.ts`
   - `src/hooks/useAuth.ts`

3. Migrate 5 component files:
   - `src/components/workflows/WorkflowExecutor.tsx`
   - `src/components/workflows/TaskPanel.tsx`
   - `src/components/workflows/WorkflowQueueDashboard.tsx`
   - `src/services/ChatService.ts`
   - `src/contexts/WorkflowContext.tsx`

**Success criteria:**
- TypeScript compiles with no errors
- All API calls use constants from `api-routes.ts`
- No hardcoded `/api/*` strings

---

## Git Worktrees Strategy

Each agent works in **complete isolation**:

```bash
# Agent 1
git worktree add ../renubu-agent-1-database -b phase-0.2/agent-1-database-constants

# Agent 2
git worktree add ../renubu-agent-2-status -b phase-0.2/agent-2-status-enums

# Agent 3
git worktree add ../renubu-agent-3-api-routes -b phase-0.2/agent-3-api-routes
```

**Zero conflicts guaranteed because:**
- Each agent touches completely different files
- No overlap in migration scope
- Queen Bee ensures task isolation

---

## Communication Protocol

**Daily Updates (or after each major task):**

```
🤖 Agent [1/2/3] Update - [Time]
✅ Completed: [Tasks completed]
🔄 In Progress: [Current work]
🚧 Blockers: [Any issues]
📊 Progress: [X/Y tasks complete]
```

**Code Review Checkpoints:**
- After constants file creation
- After each service migration batch
- Before branch merge

---

## Queen Bee Coordination

**Responsibilities:**
1. Launch 3 Worker Agents in parallel
2. Monitor progress via updates
3. Resolve blockers and conflicts
4. Coordinate code reviews
5. Merge branches in sequence
6. Measure velocity and effectiveness

**Success Metrics:**
- Zero merge conflicts
- All 3 agents complete in parallel
- Velocity multiplier vs solo work
- Communication overhead measurement

---

## Timeline

**Day 1 (Nov 6):**
- Queen Bee decomposition ✓
- Create 3 git worktrees
- Launch 3 Worker Agents in parallel
- Agents: Create constants files + migrate 2-3 files each

**Day 2 (Nov 7):**
- Agents: Complete remaining migrations
- Code reviews between agents and Queen Bee
- Fix any TypeScript errors

**Day 3 (Nov 8):**
- Final verification
- Merge all branches
- Measure results
- Document learnings

---

## Learnings to Capture

1. What was the actual velocity multiplier?
2. Where was coordination overhead?
3. Did git worktrees work perfectly?
4. What would we do differently in Phase 1?
5. Was the task decomposition effective?

---

**Next Step:** Queen Bee creates 3 git worktrees and launches 3 Worker Agents in parallel.
