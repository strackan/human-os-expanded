# Master Roadmap: Phases 2A-2H
## From Clone to Production-Ready Orchestrator System

**Date:** 2025-10-15
**Branch:** demo/bluesoft-2025
**Demo Date:** Next week (est. 2025-10-22)
**Status:** Phase 2A Complete, 2B-2H Planned

---

## Executive Summary

**Vision:** Transform hardcoded zen-dashboard into modular, database-driven orchestrator system

**Approach:** Incremental migration via safe clone → extract data → modularize → merge back

**Timeline:** 7 phases over 5-6 days (allows 1-2 day buffer before demo)

---

## Phase Status Overview

| Phase | Status | Est. Time | Description |
|-------|--------|-----------|-------------|
| **2A** | ✅ **COMPLETE** | 2 hours | Clean clone architecture |
| **2B** | 📋 Ready | 1 day | Extract hardcoded data to database |
| **2C** | 📋 Designed | 1-2 days | Orchestrator architecture |
| **2D** | 📋 Planned | 2 hours | File size review & modularization plan |
| **2E** | 📋 Planned | 4 hours | Execute modularization |
| **2F** | 📋 Planned | 4 hours | Thorough testing of zen-dashboard-v2 |
| **2G** | 📋 Planned | 2 hours | Plan merge back to zen-dashboard |
| **2H** | 📋 Planned | Ongoing | Continue workflow creation with new system |

**Total Estimated Time:** 4-5 days (leaves 2-3 day buffer before demo)

---

## Phase 2A: Clean Clone Architecture ✅ COMPLETE

### Goal
Create isolated clone of zen-dashboard system for safe experimentation

### What Was Done
- ✅ Cloned TaskModeFullscreen.tsx → TaskModeFullscreen-v2.tsx (2024 lines)
- ✅ Updated zen-dashboard-v2 to use v2 component
- ✅ Removed wrong approach (TaskModeModal, WorkflowConfig factories)
- ✅ Verified zen-dashboard (original) completely untouched
- ✅ Documented architecture in CLEAN_CLONE_ARCHITECTURE.md

### Deliverables
- `src/components/workflows/TaskModeFullscreen-v2.tsx` (2024 lines)
- `src/app/zen-dashboard-v2/page.tsx` (simplified to use v2)
- `docs/CLEAN_CLONE_ARCHITECTURE.md`

### Result
Two identical systems: zen-dashboard (sacrosanct) and zen-dashboard-v2 (playground)

**Status:** ✅ Complete
**Time Taken:** 2 hours

---

## Phase 2B: Data Extraction 📋 READY

### Goal
Replace hardcoded data in TaskModeFullscreen-v2 with database providers

### Tasks

#### 2B.1: Database Schema Extensions (2 hours)
- [ ] Create migration for contacts table extensions (relationship metadata)
- [ ] Create migration for customer_properties market data
- [ ] Seed extended data for Obsidian Black
- [ ] Seed TechFlow Industries expansion data

**Files to Create:**
- `supabase/migrations/20251015000001_extend_contacts_relationships.sql`
- `supabase/migrations/20251015000002_add_market_pricing_data.sql`
- `supabase/scripts/seed_contacts_relationship_data.sql`
- `supabase/scripts/seed_techflow_expansion_data.sql`

#### 2B.2: Create Data Providers (4 hours)
- [ ] Create provider directory structure
- [ ] Implement contractProvider.ts (expansion data) (~150 lines)
- [ ] Implement stakeholderProvider.ts (contacts + relationships) (~100 lines)
- [ ] Implement workflowContextProvider.ts (master hook) (~200 lines)

**Files to Create:**
- `src/lib/data-providers/index.ts`
- `src/lib/data-providers/contractProvider.ts`
- `src/lib/data-providers/stakeholderProvider.ts`
- `src/lib/data-providers/workflowContextProvider.ts`

#### 2B.3: Integrate Providers (2 hours)
- [ ] Add useWorkflowContext hook to TaskModeFullscreen-v2
- [ ] Replace hardcoded techFlowData with context data
- [ ] Replace hardcoded obsidianBlackStakeholders with context data
- [ ] Add loading/error states

**File Modified:**
- `src/components/workflows/TaskModeFullscreen-v2.tsx` (remove ~125 lines)

#### 2B.4: Test Data-Driven Workflows (2 hours)
- [ ] Test Obsidian Black Strategic Planning
- [ ] Test TechFlow Expansion Opportunity
- [ ] Test Obsidian Black Executive Engagement
- [ ] Verify zen-dashboard (original) still works

### Deliverables
- Database migrations and seeds
- 3 data provider files (~450 lines total)
- TaskModeFullscreen-v2 using database data (~1900 lines, -125 from hardcoded removal)
- All 3 workflows functional with database

### Success Criteria
- ✅ All hardcoded business data removed from component
- ✅ Data loads from database successfully
- ✅ UI looks identical to hardcoded version
- ✅ zen-dashboard (original) still works

**Status:** 📋 Design complete, ready to implement
**Estimated Time:** 1 day (10 hours)
**Doc Reference:** `PHASE_2B_DATA_EXTRACTION_PLAN.md`

---

## Phase 2C: Orchestrator Architecture 📋 DESIGNED

### Goal
Create modular orchestrator pattern with "ONE HUGE" coordinator file

### Tasks

#### 2C.1: Create Orchestrator Shell (4 hours)
- [ ] Create WorkflowOrchestrator.tsx with basic structure (~300 lines)
- [ ] Integrate workflowContextProvider from Phase 2B
- [ ] Add global state management (step tracking, completion)
- [ ] Implement header + layout components
- [ ] Add sequence navigation integration

**Files to Create:**
- `src/components/workflows/WorkflowOrchestrator.tsx` (300 lines) ⭐
- `src/components/workflows/types.ts` (50 lines)
- `src/components/workflows/hooks/useWorkflowRouter.tsx` (50 lines)
- `src/components/workflows/components/WorkflowHeader.tsx` (80 lines)
- `src/components/workflows/components/StepSidebar.tsx` (100 lines)

#### 2C.2: Extract Strategic Planning Workflow (4 hours)
- [ ] Create StrategicPlanningWorkflow.tsx (~150 lines)
- [ ] Extract and create step components:
  - [ ] GreetingStep.tsx (~100 lines)
  - [ ] AssessmentStep.tsx (~150 lines)
  - [ ] OverviewStep.tsx (~150 lines)
  - [ ] RecommendationStep.tsx (~150 lines)
  - [ ] StrategicPlanStep.tsx (~150 lines)
  - [ ] ActionPlanStep.tsx (~150 lines)
- [ ] Wire workflow to orchestrator
- [ ] Test Strategic Planning end-to-end

**Files to Create:**
- `src/components/workflows/definitions/StrategicPlanningWorkflow.tsx`
- `src/components/workflows/steps/` (6 step components)

#### 2C.3: Extract Remaining Workflows (6 hours)
- [ ] Create ExpansionOpportunityWorkflow.tsx (~150 lines)
- [ ] Extract expansion-specific steps (4 steps, ~600 lines)
- [ ] Create ExecutiveEngagementWorkflow.tsx (~150 lines)
- [ ] Extract engagement-specific steps (4 steps, ~600 lines)
- [ ] Test all 3 workflows in orchestrator

**Files to Create:**
- `src/components/workflows/definitions/ExpansionOpportunityWorkflow.tsx`
- `src/components/workflows/definitions/ExecutiveEngagementWorkflow.tsx`
- `src/components/workflows/steps/` (8 more step components)

#### 2C.4: Update zen-dashboard-v2 (2 hours)
- [ ] Replace TaskModeFullscreen-v2 with WorkflowOrchestrator
- [ ] Keep TaskModeFullscreen-v2 as reference (commented/archived)
- [ ] Test all 3 workflows in zen-dashboard-v2
- [ ] Verify sequence navigation works

**File Modified:**
- `src/app/zen-dashboard-v2/page.tsx` (replace component import)

### Deliverables
- WorkflowOrchestrator.tsx (300 lines) - THE ONE HUGE FILE ⭐
- 3 workflow definitions (~450 lines total)
- 14 step components (~2100 lines total, reusable)
- 5 shared components/hooks (~360 lines total)
- TaskModeFullscreen-v2 retired/archived

### Success Criteria
- ✅ WorkflowOrchestrator <300 lines
- ✅ All workflow definitions <150 lines each
- ✅ All step components <150 lines each
- ✅ All 3 workflows work in orchestrator
- ✅ zen-dashboard-v2 uses orchestrator
- ✅ zen-dashboard (original) still works

**Status:** 📋 Design complete, ready to implement after 2B
**Estimated Time:** 1-2 days (16 hours)
**Doc Reference:** `PHASE_2C_ORCHESTRATOR_DESIGN.md`

---

## Phase 2D: File Size Review 📋 PLANNED

### Goal
Review all files created in 2B/2C and create modularization plan for any oversized files

### Tasks

#### 2D.1: File Size Audit (1 hour)
- [ ] List all files >300 lines
- [ ] Identify files >200 lines (warning threshold)
- [ ] Document current file size distribution

#### 2D.2: Identify Modularization Opportunities (1 hour)
- [ ] Review oversized files for extract-able logic
- [ ] Identify duplicate code across files
- [ ] Find reusable utility functions
- [ ] Plan hook extractions (useStepNavigation, useArtifactVisibility, etc.)

### Deliverables
- `docs/FILE_SIZE_AUDIT.md` - Complete file inventory
- `docs/MODULARIZATION_PLAN.md` - Actionable extraction plan

### Success Criteria
- ✅ All files documented
- ✅ Files >300 lines have modularization plans
- ✅ Duplicate logic identified

**Status:** 📋 Planned for after 2C
**Estimated Time:** 2 hours

---

## Phase 2E: Execute Modularization 📋 PLANNED

### Goal
Execute modularization plan from 2D to bring all files under size targets

### Tasks

#### 2E.1: Extract Utility Functions (1 hour)
- [ ] Create `src/lib/utils/workflowUtils.ts` for common logic
- [ ] Extract date formatting, string manipulation, etc.
- [ ] Update files to use extracted utilities

#### 2E.2: Extract Custom Hooks (2 hours)
- [ ] Create hooks for common patterns:
  - [ ] `useStepNavigation.tsx` (step tracking logic)
  - [ ] `useArtifactVisibility.tsx` (show/hide artifacts)
  - [ ] `useWorkflowState.tsx` (persist workflow state)
- [ ] Update components to use extracted hooks

#### 2E.3: Consolidate Duplicate Logic (1 hour)
- [ ] Merge similar step components (if found)
- [ ] Extract shared UI patterns
- [ ] Create base components for common layouts

### Deliverables
- Extracted utility files (~100-200 lines each)
- Extracted hook files (~80-100 lines each)
- All files under size targets

### Success Criteria
- ✅ No files >300 lines
- ✅ Files >200 lines have justification
- ✅ Duplicate logic eliminated
- ✅ All tests still pass

**Status:** 📋 Planned for after 2D
**Estimated Time:** 4 hours

---

## Phase 2F: Test zen-dashboard-v2 📋 PLANNED

### Goal
Thoroughly test zen-dashboard-v2 with all changes before merging to zen-dashboard

### Tasks

#### 2F.1: Functional Testing (2 hours)
- [ ] Test all 3 workflows individually
- [ ] Test workflow sequence navigation
- [ ] Test data loading (various customers)
- [ ] Test error states (network failures, missing data)
- [ ] Test loading states

#### 2F.2: UI/UX Testing (1 hour)
- [ ] Visual comparison to zen-dashboard (screenshot diff)
- [ ] Test responsive design (different screen sizes)
- [ ] Test keyboard navigation
- [ ] Test accessibility (screen reader, tab order)

#### 2F.3: Performance Testing (1 hour)
- [ ] Measure initial load time
- [ ] Measure data fetch times
- [ ] Check for memory leaks (long workflow sequences)
- [ ] Verify smooth animations/transitions

### Deliverables
- `docs/ZEN_DASHBOARD_V2_TEST_REPORT.md` - Complete test results
- List of bugs found (if any)
- Performance metrics

### Success Criteria
- ✅ All workflows functional
- ✅ No visual regressions vs zen-dashboard
- ✅ No console errors
- ✅ Performance acceptable (<2s initial load)
- ✅ No memory leaks

**Status:** 📋 Planned for after 2E
**Estimated Time:** 4 hours

---

## Phase 2G: Plan Merge Back 📋 PLANNED

### Goal
Create detailed plan to merge zen-dashboard-v2 changes back to zen-dashboard

### Tasks

#### 2G.1: Merge Strategy (1 hour)
- [ ] Document files to be replaced
- [ ] Document files to be deleted (TaskModeFullscreen.tsx)
- [ ] Document new files to be added
- [ ] Create rollback plan (git tags, backup branches)

#### 2G.2: Compatibility Review (30 min)
- [ ] Verify API compatibility (same props interface)
- [ ] Check for breaking changes
- [ ] Review database dependencies

#### 2G.3: Migration Plan (30 min)
- [ ] Document step-by-step merge process
- [ ] Identify manual testing checkpoints
- [ ] Create verification checklist

### Deliverables
- `docs/ZEN_DASHBOARD_MERGE_PLAN.md` - Complete merge strategy
- Git branch strategy diagram
- Rollback procedures

### Success Criteria
- ✅ Clear merge steps documented
- ✅ Rollback plan in place
- ✅ Breaking changes identified (if any)

**Status:** 📋 Planned for after 2F
**Estimated Time:** 2 hours

---

## Phase 2H: Continue Workflow Creation 📋 PLANNED

### Goal
Use new orchestrator system to build additional workflows for demo

### Tasks

#### 2H.1: Identify New Workflows (30 min)
- [ ] Review demo storyline
- [ ] Identify missing workflow needs
- [ ] Prioritize by demo impact

#### 2H.2: Create New Workflows (Ongoing)
- [ ] Use orchestrator pattern (DefinitionComponent + Steps)
- [ ] Reuse existing steps where possible
- [ ] Create new steps only when needed
- [ ] Leverage data providers from 2B

#### 2H.3: Test New Workflows (Per workflow)
- [ ] Functional testing
- [ ] Integration with sequence navigation
- [ ] Data provider integration

### Deliverables
- New workflow definition files (~150 lines each)
- New step components (if needed, ~150 lines each)
- Updated workflow registry/router

### Success Criteria
- ✅ New workflows follow orchestrator pattern
- ✅ All files under size targets
- ✅ Data-driven (no hardcoded business data)
- ✅ Demo-ready

**Status:** 📋 Planned for after merge complete
**Estimated Time:** Ongoing (per workflow: ~4 hours)

---

## Timeline Overview

### Day 1 (Today)
- ✅ Phase 2A Complete (2 hours)
- 📋 Start Phase 2B (Database schema + providers) (8 hours)

### Day 2
- 📋 Finish Phase 2B (2 hours)
- 📋 Start Phase 2C (Orchestrator shell + Strategic Planning) (6 hours)

### Day 3
- 📋 Finish Phase 2C (Remaining workflows + integration) (8 hours)

### Day 4
- 📋 Phase 2D (File size review) (2 hours)
- 📋 Phase 2E (Execute modularization) (4 hours)
- 📋 Phase 2F (Testing) (2 hours)

### Day 5
- 📋 Finish Phase 2F (Testing) (2 hours)
- 📋 Phase 2G (Merge planning) (2 hours)
- 📋 Execute merge to zen-dashboard (2 hours)
- 📋 Start Phase 2H (New workflows) (2 hours)

### Days 6-7 (Buffer)
- 📋 Phase 2H (Continue new workflows)
- 📋 Final testing and polish
- 📋 Demo preparation

**Demo Date:** Day 7-8 (Next week)

---

## Risk Assessment

### Low Risk ✅
- Phase 2A (complete, zen-dashboard protected)
- Phase 2B (isolated providers, fallback available)
- Phase 2D/2E (refactoring, no behavior changes)

### Medium Risk ⚠️
- Phase 2C (major architectural change)
  - **Mitigation:** Incremental migration, one workflow at a time
- Phase 2F (might find issues)
  - **Mitigation:** 2-day buffer before demo
- Phase 2G (merge risk)
  - **Mitigation:** Can defer merge, demo on v2

### High Risk 🔴
- Time constraint (5 days before demo)
  - **Mitigation:** Can skip 2E (modularization) if needed, works without it
  - **Mitigation:** Can demo on zen-dashboard-v2 without merging (Phase 2G optional)

---

## Rollback Strategy

### By Phase

**Phase 2B Rollback:**
```bash
git restore src/components/workflows/TaskModeFullscreen-v2.tsx
rm -rf src/lib/data-providers
```

**Phase 2C Rollback:**
```bash
# Revert to Phase 2B state (data-driven but monolithic)
git restore src/app/zen-dashboard-v2/page.tsx
rm -rf src/components/workflows/WorkflowOrchestrator.tsx
rm -rf src/components/workflows/definitions
rm -rf src/components/workflows/steps
```

**Full Rollback (Nuclear Option):**
```bash
# Use zen-dashboard (original) for demo
# zen-dashboard-v2 never modified original system
```

**Bottom Line:** zen-dashboard is ALWAYS available as safe fallback

---

## Success Metrics

### By Demo Date

**Must Have (P0):**
- ✅ Phase 2A complete
- ✅ Phase 2B complete (data-driven workflows)
- ✅ Phase 2C complete (orchestrator architecture)
- ✅ All 3 workflows functional

**Should Have (P1):**
- ✅ Phase 2E complete (file size targets met)
- ✅ Phase 2F complete (thorough testing)
- ✅ Phase 2G complete (merged to zen-dashboard)

**Nice to Have (P2):**
- ✅ Phase 2H started (new workflows created)
- ✅ Documentation complete
- ✅ Performance optimizations

**Decision Point (Day 4):**
If behind schedule, skip Phase 2E (modularization) and go straight to 2F (testing)

---

## Key Decisions

### Already Decided ✅
- Use TaskModeFullscreen clone (not TaskModeAdvanced or WorkflowExecutor)
- Database-driven approach (not config-only)
- Orchestrator pattern (not monolithic)
- Incremental migration (not big-bang rewrite)

### To Decide
- [ ] Pricing scenarios: Calculate vs. database table? → **Recommendation: Calculate**
- [ ] Market data source: Hardcoded by tier vs. external API? → **Recommendation: Hardcoded for MVP**
- [ ] Merge timing: Before demo vs. after demo? → **Recommendation: Before, with buffer**

---

## Documentation Reference

| Phase | Document | Status |
|-------|----------|--------|
| 2A | `CLEAN_CLONE_ARCHITECTURE.md` | ✅ Complete |
| 2B | `PHASE_2B_DATA_EXTRACTION_PLAN.md` | ✅ Complete |
| 2C | `PHASE_2C_ORCHESTRATOR_DESIGN.md` | ✅ Complete |
| 2D | `FILE_SIZE_AUDIT.md` | 📋 TBD |
| 2D | `MODULARIZATION_PLAN.md` | 📋 TBD |
| 2F | `ZEN_DASHBOARD_V2_TEST_REPORT.md` | 📋 TBD |
| 2G | `ZEN_DASHBOARD_MERGE_PLAN.md` | 📋 TBD |
| All | `MASTER_ROADMAP_PHASES_2A_TO_2H.md` | ✅ This document |

---

## Next Actions

**Immediate (Today):**
1. Review this roadmap
2. Confirm priorities and timeline
3. Start Phase 2B.1 (database schema extensions)

**Tomorrow:**
1. Complete Phase 2B (data extraction)
2. Start Phase 2C (orchestrator)

**By Week's End:**
1. Complete Phase 2C
2. Complete Phase 2F (testing)
3. Demo-ready system

---

**Roadmap Status:** Complete and Approved
**Current Phase:** 2A Complete, 2B Ready to Start
**Next Milestone:** Phase 2B Complete (1 day from now)
**Demo Readiness:** On track, 2-day buffer available
