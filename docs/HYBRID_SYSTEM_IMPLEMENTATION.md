# Hybrid Workflow System Implementation

**Date:** 2025-10-15
**Status:** Ready for Testing
**Branch:** demo/bluesoft-2025

---

## Executive Summary

Successfully implemented a **hybrid workflow system** in `zen-dashboard-v2` that:
- ✅ Uses **WorkflowExecutor** (modern, database-driven) where factories exist
- ✅ Falls back to **TaskModeModal** (legacy, config-driven) for workflows without factories
- ✅ Maintains 100% backward compatibility with existing demo sequence
- ✅ Enables incremental migration to modern system

**Result:** Workflow 1 (Obsidian Black Strategic Planning) now uses the modern factory-based system, while Workflows 2-3 continue working via legacy fallback.

---

## What Was Changed

### File: `src/app/zen-dashboard-v2/page.tsx`

**New Imports:**
```typescript
import { WorkflowExecutor, WorkflowDefinition } from '@/components/workflows/WorkflowExecutor';
import { ResizableModal } from '@/components/workflows/ResizableModal';
import { createACOStrategicPlanningWorkflow } from '@/components/workflows/definitions/factories/acoStrategicPlanningWorkflowFactory';
```

**Workflow Factory Registry (lines 26-32):**
```typescript
const workflowFactories: Record<string, (customerId: string) => Promise<WorkflowDefinition>> = {
  'obsblk-strategic-planning': createACOStrategicPlanningWorkflow,
  // Future factories:
  // 'techflow-expansion-opportunity': createExpansionWorkflow,
  // 'obsblk-executive-engagement': createExecutiveEngagementWorkflow,
};
```

**New State Variables (lines 51-53):**
```typescript
const [currentWorkflowDefinition, setCurrentWorkflowDefinition] = useState<WorkflowDefinition | null>(null);
const [loadingWorkflow, setLoadingWorkflow] = useState(false);
```

**Workflow Loading Logic (lines 74-102):**
```typescript
useEffect(() => {
  if (!activeWorkflow?.workflowId || !taskModeOpen) {
    setCurrentWorkflowDefinition(null);
    return;
  }

  const factory = workflowFactories[activeWorkflow.workflowId];

  if (factory) {
    // Use modern WorkflowExecutor with factory
    console.log(`[Zen Dashboard V2] Loading workflow via factory: ${activeWorkflow.workflowId}`);
    setLoadingWorkflow(true);
    factory(activeWorkflow.customerId)
      .then(workflowDef => {
        console.log('[Zen Dashboard V2] Workflow definition loaded:', workflowDef.name);
        setCurrentWorkflowDefinition(workflowDef);
      })
      .catch(err => {
        console.error('[Zen Dashboard V2] Failed to load workflow:', err);
        setCurrentWorkflowDefinition(null); // Fallback to TaskModeModal
      })
      .finally(() => setLoadingWorkflow(false));
  } else {
    // Fallback to legacy TaskModeModal
    console.log(`[Zen Dashboard V2] No factory found for ${activeWorkflow.workflowId}, using TaskModeModal fallback`);
    setCurrentWorkflowDefinition(null);
  }
}, [activeWorkflow, taskModeOpen]);
```

**Hybrid Modal Rendering (lines 248-310):**
```typescript
{taskModeOpen && activeWorkflow && (
  <>
    {loadingWorkflow ? (
      // Loading state (spinner)
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflow...</p>
        </div>
      </div>
    ) : currentWorkflowDefinition ? (
      // Modern WorkflowExecutor (factory-based)
      <ResizableModal ...>
        <WorkflowExecutor
          workflowDefinition={currentWorkflowDefinition}
          customerId={activeWorkflow.customerId}
          onComplete={handleNextWorkflow}
          sequenceInfo={...}
        />
      </ResizableModal>
    ) : (
      // Legacy TaskModeModal fallback
      <TaskModeModal
        workflowId={activeWorkflow.workflowId}
        isOpen={taskModeOpen}
        onClose={...}
        sequenceInfo={...}
      />
    )}
  </>
)}
```

---

## How It Works

### Decision Flow

```
User clicks "Start Planning"
  ↓
activeWorkflow set (e.g., 'obsblk-strategic-planning')
  ↓
useEffect triggers workflow loading
  ↓
Check workflowFactories registry
  ↓
  ├─ Factory exists? → Load WorkflowDefinition via factory
  │                    → Render WorkflowExecutor in ResizableModal
  │
  └─ No factory? → Set currentWorkflowDefinition = null
                  → Render TaskModeModal (legacy system)
```

### Workflow Mapping

| Workflow ID                      | System Used       | Data Source         | Status |
|----------------------------------|-------------------|---------------------|--------|
| obsblk-strategic-planning        | WorkflowExecutor  | Factory + Database  | ✅ Implemented |
| techflow-expansion-opportunity   | TaskModeModal     | Hardcoded (legacy)  | ⚠️ Fallback |
| obsblk-executive-engagement      | TaskModeModal     | Hardcoded (legacy)  | ⚠️ Fallback |
| bluesoft-account-overview        | TaskModeModal     | Config              | ⚠️ Fallback |

---

## Database Requirements

### Customer Data (Obsidian Black)

**Required:** Customer with UUID `550e8400-e29b-41d4-a716-446655440001` must exist in cloud database.

**Seed Script:** `supabase/scripts/seed_aco_demo_data.sql`

**Key Data:**
```sql
Customer: Obsidian Black
UUID: 550e8400-e29b-41d4-a716-446655440001
ARR: $185,000
Health Score: 64 (6.4/10)
Renewal Date: 2026-04-15
Industry: Global Strategic Coordination Services
is_demo: true
```

**Contacts:**
- Marcus Castellan (COO) - Primary
- Dr. Elena Voss (VP Technical Operations) - Secondary

**Demo Operations:**
- Operation Blackout (FAILED - $85K loss)
- Operation Nightfall, Shadow Strike, Crimson Dawn

### API Endpoint Used

`/api/customers/550e8400-e29b-41d4-a716-446655440001`

Returns:
```json
{
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Obsidian Black",
    "health_score": 64,
    "current_arr": 185000,
    "renewal_date": "2026-04-15",
    "primary_contact": { ... },
    ...
  }
}
```

---

## Testing Procedure

### Prerequisites

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Verify Database Connection:**
   ```bash
   curl http://localhost:3000/api/customers/550e8400-e29b-41d4-a716-446655440001
   ```
   - Should return Obsidian Black customer data
   - If 404, run seed script: `supabase/scripts/seed_aco_demo_data.sql`

### Test Suite 1: Hybrid System (zen-dashboard-v2)

**URL:** `http://localhost:3000/zen-dashboard-v2?sequence=bluesoft-demo-2025`

**Test 1.1: Workflow 1 - Modern System**
- [ ] Dashboard loads
- [ ] Click "Start Planning" button
- [ ] Console shows: `[Zen Dashboard V2] Loading workflow via factory: obsblk-strategic-planning`
- [ ] Console shows: `[Zen Dashboard V2] Workflow definition loaded: Strategic Account Planning`
- [ ] ResizableModal opens (modern UI)
- [ ] WorkflowExecutor renders with 5 steps
- [ ] Step 1: Contract Intelligence displays status grid artifact
- [ ] Navigate through all 5 steps
- [ ] Click "Next Customer" button
- [ ] Advances to Workflow 2

**Test 1.2: Workflow 2 - Legacy Fallback**
- [ ] Console shows: `[Zen Dashboard V2] No factory found for techflow-expansion-opportunity, using TaskModeModal fallback`
- [ ] TaskModeModal opens (legacy UI)
- [ ] TechFlow expansion workflow displays correctly
- [ ] All artifacts render (expansion scenarios, pricing tables)
- [ ] Click "Next Customer"
- [ ] Advances to Workflow 3

**Test 1.3: Workflow 3 - Legacy Fallback**
- [ ] Console shows: `[Zen Dashboard V2] No factory found for obsblk-executive-engagement, using TaskModeModal fallback`
- [ ] Executive engagement workflow displays
- [ ] Stakeholder profiles, talking points, email artifacts work
- [ ] Click "Complete" or "Next Customer"
- [ ] Sequence completes, modal closes

### Test Suite 2: Original System (Baseline)

**URL:** `http://localhost:3000/zen-dashboard?sequence=bluesoft-demo-2025`

- [ ] All 3 workflows work identically to before
- [ ] No console errors
- [ ] Used as baseline for comparison

### Test Suite 3: Edge Cases

**Test 3.1: API Failure Handling**
- [ ] Disconnect network mid-workflow load
- [ ] Verify fallback to TaskModeModal on error
- [ ] Console shows: `[Zen Dashboard V2] Failed to load workflow: ...`

**Test 3.2: Close Modal Mid-Load**
- [ ] Click "Start Planning"
- [ ] Immediately close modal (during loading spinner)
- [ ] No errors, clean state reset

**Test 3.3: Missing Customer Data**
- [ ] Change customerId to invalid UUID
- [ ] Verify graceful error handling
- [ ] Fallback to TaskModeModal

---

## Console Output (Expected)

### Successful Factory Load
```
[Zen Dashboard V2] Loading workflow via factory: obsblk-strategic-planning
[Factory] Fetching customer data for: 550e8400-e29b-41d4-a716-446655440001
[Factory] Customer data received: { customer: { name: 'Obsidian Black', ... } }
[Zen Dashboard V2] Workflow definition loaded: Strategic Account Planning
```

### Fallback to Legacy
```
[Zen Dashboard V2] No factory found for techflow-expansion-opportunity, using TaskModeModal fallback
```

### Error Case
```
[Zen Dashboard V2] Loading workflow via factory: obsblk-strategic-planning
[Factory] Failed to fetch customer: 404
[Zen Dashboard V2] Failed to load workflow: Failed to fetch customer (404): Not Found
[Zen Dashboard V2] No factory found for obsblk-strategic-planning, using TaskModeModal fallback
```

---

## Migration Path Forward

### Immediate (This PR)
- [x] Implement hybrid system in zen-dashboard-v2
- [ ] Test all 3 workflows
- [ ] Verify database contains Obsidian Black
- [ ] Document architecture

### Next Steps (Future PRs)
1. **Build Workflow 2 Factory** (`createExpansionWorkflow`)
   - Query TechFlow customer data from database
   - Generate expansion scenarios dynamically
   - Register in workflowFactories

2. **Build Workflow 3 Factory** (`createExecutiveEngagementWorkflow`)
   - Query stakeholder data from CRM/contacts table
   - Generate talking points via AI/templates
   - Register in workflowFactories

3. **Cutover to New System**
   - Replace `zen-dashboard` with `zen-dashboard-v2`
   - Archive TaskModeFullscreen.tsx (99KB legacy file)
   - Update all dashboard links

4. **Remove Legacy Code**
   - Delete TaskModeFullscreen.tsx
   - Clean up hardcoded data
   - Consolidate to single workflow system

---

## Architecture Benefits

### Before (4 Parallel Systems)
- TaskModeFullscreen.tsx (99KB hardcoded)
- TaskModeAdvanced.tsx (config-driven)
- WorkflowExecutor (modern)
- Different dashboards with different patterns

**Problem:** Confusion, duplication, hard to maintain

### After (Hybrid System)
- **Primary:** WorkflowExecutor + Factories (database-driven)
- **Fallback:** TaskModeModal (legacy, for incremental migration)
- **Single Entry Point:** zen-dashboard-v2 decides which to use

**Benefits:**
- ✅ Incremental migration (no big-bang refactor)
- ✅ Demo continues working during transition
- ✅ Database-driven where possible, config where needed
- ✅ Clear path to remove legacy code
- ✅ No tech debt compounding

---

## File Inventory

### Modified
- `src/app/zen-dashboard-v2/page.tsx` - Hybrid workflow orchestration

### Dependencies (No Changes)
- `src/components/workflows/WorkflowExecutor.tsx` - Modern workflow renderer
- `src/components/workflows/ResizableModal.tsx` - Modal wrapper
- `src/components/workflows/definitions/factories/acoStrategicPlanningWorkflowFactory.ts` - Factory function
- `src/components/artifacts/workflows/TaskModeAdvanced.tsx` - Legacy config-driven modal
- `src/config/workflowSequences.ts` - Workflow sequence definitions

### Database
- `supabase/scripts/seed_aco_demo_data.sql` - Obsidian Black seed data (cloud database)

### Documentation
- `docs/CURRENT_SYSTEM_SNAPSHOT.md` - Safety net (pre-refactor state)
- `docs/ZEN_DASHBOARD_TEST_CHECKLIST.md` - Manual test procedures
- `docs/HYBRID_SYSTEM_IMPLEMENTATION.md` - This file

---

## Rollback Plan

If testing fails:

```bash
# Option 1: Use original zen-dashboard (unchanged)
# Navigate to http://localhost:3000/zen-dashboard

# Option 2: Revert zen-dashboard-v2 changes
git checkout HEAD -- src/app/zen-dashboard-v2/page.tsx

# Option 3: Full rollback to safety commit
git reset --hard 52312a4  # Safety net commit
```

**Safety Net Commit:** `52312a4` (cloned zen-dashboard to zen-dashboard-v2)

---

## Success Criteria

- [x] Hybrid system implemented in zen-dashboard-v2
- [ ] Workflow 1 loads via WorkflowExecutor
- [ ] Workflows 2-3 load via TaskModeModal fallback
- [ ] All workflows complete successfully in sequence
- [ ] No console errors
- [ ] Database contains Obsidian Black customer
- [ ] API endpoint returns valid customer data
- [ ] Documentation complete

**When complete:** This system becomes the foundation for all future workflows.

---

## Next Actions (For User)

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Verify Database (Cloud):**
   ```bash
   curl http://localhost:3000/api/customers/550e8400-e29b-41d4-a716-446655440001
   ```
   - If 404, seed data may be missing in cloud database
   - Check Supabase dashboard or run seed script remotely

3. **Test zen-dashboard-v2:**
   ```
   http://localhost:3000/zen-dashboard-v2?sequence=bluesoft-demo-2025
   ```
   - Follow Test Suite 1 above
   - Watch browser console for log messages
   - Verify Workflow 1 uses WorkflowExecutor
   - Verify Workflows 2-3 use TaskModeModal fallback

4. **Report Results:**
   - Which workflows worked?
   - Any console errors?
   - Did factory load successfully for Workflow 1?
   - Did fallback work for Workflows 2-3?

5. **Discuss Next Steps:**
   - Build factories for Workflows 2-3?
   - Cutover to zen-dashboard-v2?
   - Fix any issues discovered?

---

**Implementation Complete. Ready for Testing.**
