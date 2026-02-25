# Zen Dashboard → Database-Driven Conversion
## Scope Analysis

---

## Current State: What's Hardcoded

### 1. **Priority Workflow Card** (Lines 108-118)
```typescript
setPriorityWorkflow({
  id: 'obsidian-black-pricing',              // ← HARDCODED
  title: 'Renewal Planning for Obsidian Black', // ← HARDCODED
  customerId: '550e8400-e29b-41d4-a716-446655440001', // ← HARDCODED
  customerName: 'Obsidian Black',            // ← HARDCODED
  priority: 'Critical',                      // ← HARDCODED
  dueDate: 'Today',                          // ← HARDCODED
  arr: '$185K',                              // ← HARDCODED
});
```

**Should come from:** `workflow_executions` table (top priority for current CSM)

### 2. **Today's Workflows List** (Line 223)
```typescript
<TodaysWorkflows
  workflows={sequenceId ? getWorkflowSequence(sequenceId)?.workflows : undefined}
/>
```

**Current:** Only shows workflows if in sequence mode (via URL param `?sequence=bluesoft-demo-2025`)
**Should be:** Always shows today's workflow queue from database

### 3. **Workflow Sequences** (Lines 89-105)
```typescript
const sequence = searchParams.get('sequence'); // 'bluesoft-demo-2025'
const workflowSequence = getWorkflowSequence(sequence); // From hardcoded file
```

**Current:** Sequences defined in `src/config/workflowSequences.ts` (static file)
**Should be:** Generated dynamically from database based on customer workflows

### 4. **Customer Context**
**Current:** Customer data only exists in workflow configs (hardcoded)
**Should be:** Fetched from `customers` table

---

## Work Required for DB-Driven Dashboard

### **Phase A: API Routes (6 hours)**

#### Task A.1: Get Workflow Queue API (2 hours)
**File:** Already exists: `src/app/api/orchestrator/queue/route.ts`

**Current state:** Returns demo data when `?demo=true`
**Need to enhance:**
```typescript
GET /api/orchestrator/queue?csm_id={userId}&limit=10

Response:
{
  priorityWorkflow: {
    id: 'execution-uuid',
    workflow_definition_id: 'uuid',
    workflow_id: 'exec-contact-lost',
    title: 'Executive Contact Lost - Acme Corp',
    customer_id: 'uuid',
    customer_name: 'Acme Corp',
    priority_score: 950,
    status: 'not_started',
    due_date: '2025-10-22',
    arr: '$250,000'
  },
  todaysWorkflows: [
    {
      id: 'execution-uuid-2',
      workflow_id: 'standard-renewal',
      title: 'Renewal Planning - Beta Inc',
      customer_name: 'Beta Inc',
      priority_score: 650,
      arr: '$100,000'
    },
    // ... up to 10 workflows
  ]
}
```

**Changes needed:**
- ✅ Already has `getWorkflowQueueForCSM()` in `orchestrator-db.ts`
- ⚠️ Need to enrich with customer data (ARR, name)
- ⚠️ Need to return in dashboard-friendly format

#### Task A.2: Get Customer Context API (2 hours)
**File:** `src/app/api/customers/[id]/context/route.ts` (NEW)

```typescript
GET /api/customers/{customerId}/context

Response:
{
  id: 'uuid',
  name: 'Acme Corp',
  domain: 'acme.com',
  current_arr: 250000,
  renewal_date: '2025-12-15',
  health_score: 85,
  primary_contact: {
    name: 'John Doe',
    email: 'john@acme.com',
    title: 'VP Engineering'
  }
}
```

**Reuses:** Existing database tables

#### Task A.3: Update Workflow Status API (2 hours)
**File:** Already exists: `src/app/api/orchestrator/executions/[id]/status/route.ts`

**Current:** ✅ Works
**Enhancement needed:** Return updated queue after status change

---

### **Phase B: Dashboard Data Fetching (4 hours)**

#### Task B.1: Replace Hardcoded Priority Workflow (2 hours)
**File:** `src/app/obsidian-black/page.tsx`

**Current (lines 107-119):**
```typescript
useEffect(() => {
  setPriorityWorkflow({
    id: 'obsidian-black-pricing',
    // ... hardcoded data
  });
}, []);
```

**New:**
```typescript
useEffect(() => {
  async function loadQueue() {
    setLoading(true);
    try {
      const response = await fetch('/api/orchestrator/queue?limit=10');
      const data = await response.json();

      setPriorityWorkflow(data.priorityWorkflow);
      setTodaysWorkflows(data.todaysWorkflows);
    } catch (error) {
      console.error('Failed to load workflow queue:', error);
    } finally {
      setLoading(false);
    }
  }

  loadQueue();
}, []);
```

#### Task B.2: Replace Today's Workflows with Queue (2 hours)
**File:** `src/app/obsidian-black/page.tsx`

**Current (line 223):**
```typescript
<TodaysWorkflows
  workflows={sequenceId ? getWorkflowSequence(sequenceId)?.workflows : undefined}
/>
```

**New:**
```typescript
<TodaysWorkflows
  workflows={todaysWorkflows}
  onWorkflowClick={handleWorkflowClick}
  completedWorkflowIds={completedWorkflowIds}
/>
```

**State addition:**
```typescript
const [todaysWorkflows, setTodaysWorkflows] = useState([]);
```

---

### **Phase C: Workflow Execution Integration (6 hours)**

#### Task C.1: Update Launch Handler to Create Execution (2 hours)
**Current:** Just opens modal with hardcoded workflow ID
**New:** Create/resume workflow execution

```typescript
const handleLaunchWorkflow = async () => {
  if (!priorityWorkflow) return;

  // If execution already exists, just open it
  if (priorityWorkflow.id) {
    setActiveWorkflow({
      workflowId: priorityWorkflow.workflow_id,
      executionId: priorityWorkflow.id,
      customerId: priorityWorkflow.customer_id,
      customerName: priorityWorkflow.customer_name,
    });
    setTaskModeOpen(true);
    return;
  }

  // Otherwise, create new execution (shouldn't happen with queue)
  // ...
};
```

#### Task C.2: Update Completion Handler to Save to DB (2 hours)
**Current (lines 245-262):** Just updates local state
**New:** Save completion to database

```typescript
const handleWorkflowComplete = async (completed?: boolean) => {
  if (completed && activeWorkflow) {
    // Update execution status in database
    await fetch(`/api/orchestrator/executions/${activeWorkflow.executionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });

    // Mark as completed in UI
    setCompletedWorkflowIds(prev => new Set(prev).add(activeWorkflow.executionId));

    // Trigger confetti
    setTimeout(() => triggerConfetti(), 100);

    // Reload queue to get next priority workflow
    await loadQueue();
  }

  setTaskModeOpen(false);
};
```

#### Task C.3: Handle Queue Navigation (2 hours)
**Current:** Sequence mode via URL params
**New:** Navigate through database queue

```typescript
const handleNextWorkflow = async () => {
  // Reload queue
  const response = await fetch('/api/orchestrator/queue?limit=10');
  const data = await response.json();

  if (data.priorityWorkflow) {
    // Load next workflow from queue
    setActiveWorkflow({
      workflowId: data.priorityWorkflow.workflow_id,
      executionId: data.priorityWorkflow.id,
      customerId: data.priorityWorkflow.customer_id,
      customerName: data.priorityWorkflow.customer_name,
    });
    // Keep modal open
  } else {
    // No more workflows
    setTaskModeOpen(false);
  }
};
```

---

### **Phase D: Config Builder Integration (8 hours)**

#### Task D.1: Pass Execution ID to TaskMode (1 hour)
**Current:**
```typescript
<TaskModeFullscreen
  workflowId={activeWorkflow.workflowId}
  customerId={activeWorkflow.customerId}
  customerName={activeWorkflow.customerName}
/>
```

**New:**
```typescript
<TaskModeFullscreen
  executionId={activeWorkflow.executionId}
  // workflowId and customerId will be loaded from execution
/>
```

#### Task D.2: Update TaskMode to Load from Execution (4 hours)
**File:** `src/components/workflows/TaskMode/hooks/useTaskModeState.ts`

**Current (line 60-70):** Loads config by hardcoded workflowId
**New:** Load workflow_definition from execution, then build config

```typescript
useEffect(() => {
  async function loadWorkflow() {
    // 1. Load execution
    const execution = await fetch(`/api/orchestrator/executions/${executionId}`).then(r => r.json());

    // 2. Load workflow definition
    const definition = execution.workflow_definition;

    // 3. Build config dynamically
    const config = await buildWorkflowConfig(
      definition.id,
      execution.customer_id,
      executionId // for resuming state
    );

    setConfig(config);
    setCustomer(execution.customer);
  }

  loadWorkflow();
}, [executionId]);
```

#### Task D.3: Implement Config Builder (3 hours)
**File:** `src/lib/workflows/configBuilder.ts` (already planned in Phase 2)

```typescript
export async function buildWorkflowConfig(
  workflowDefinitionId: string,
  customerId: string,
  executionId?: string
): Promise<WorkflowConfig> {
  // 1. Load workflow definition
  const definition = await getWorkflowDefinition(workflowDefinitionId);

  // 2. Load slide sequence from DB
  const slideSequence = definition.slide_sequence; // ['greeting', 'review-account', ...]

  // 3. Get slide builders from library
  const slides = slideSequence.map(slideId => SLIDE_LIBRARY[slideId]);

  // 4. Fetch customer data
  const customerData = await fetchCustomerContext(customerId);

  // 5. Hydrate slides with data
  const hydratedSlides = slides.map((slideBuilder, index) => {
    const context = definition.slide_contexts?.[slideSequence[index]];
    const slide = slideBuilder(context);
    return hydrateSlide(slide, customerData);
  });

  // 6. Return WorkflowConfig
  return {
    customer: { name: customerData.name },
    slides: hydratedSlides,
    // ... other config
  };
}
```

---

### **Phase E: Backward Compatibility (2 hours)**

#### Task E.1: Support Demo Mode (1 hour)
**Keep URL param support:**
```typescript
const searchParams = useSearchParams();
const demoMode = searchParams.get('demo') === 'true';

if (demoMode) {
  // Use hardcoded demo data
  setPriorityWorkflow({ ... });
} else {
  // Load from database
  loadQueue();
}
```

#### Task E.2: Support Sequence Mode (1 hour)
**Keep `?sequence=` param for demos:**
```typescript
const sequenceId = searchParams.get('sequence');

if (sequenceId) {
  // Demo sequence mode (from static file)
  const workflows = getWorkflowSequence(sequenceId);
} else {
  // Normal database queue
  loadQueue();
}
```

---

## Total Scope Estimate

| Phase | Tasks | Hours | Description |
|-------|-------|-------|-------------|
| **A: API Routes** | 3 | 6 | Enhance existing queue API, add customer API |
| **B: Dashboard Fetching** | 2 | 4 | Replace hardcoded data with API calls |
| **C: Execution Integration** | 3 | 6 | Launch, complete, navigate workflows via DB |
| **D: Config Builder** | 3 | 8 | Dynamic config generation |
| **E: Backward Compat** | 2 | 2 | Keep demo/sequence modes working |
| **TOTAL** | **13** | **26** | **~3-4 days** |

---

## Dependencies

### Must be complete first:
1. ✅ Database schema (`workflow_executions`, `workflow_definitions`)
2. ✅ Orchestrator API routes (mostly done)
3. 🚧 **Config builder (Phase 2)** ← BLOCKING
4. 🚧 **Slide library (Phase 1)** ← BLOCKING

### Can happen in parallel:
- API route enhancements (Phase A)
- Dashboard data fetching (Phase B)

### Must happen after config builder:
- Execution integration (Phase C)
- TaskMode loading (Phase D)

---

## Testing Checklist

### Before Conversion:
- [ ] Hardcoded dashboard works
- [ ] Demo sequences work
- [ ] TaskMode loads configs

### After Conversion:
- [ ] Dashboard loads queue from database
- [ ] Priority workflow reflects highest-priority execution
- [ ] Clicking workflow opens TaskMode with DB-driven config
- [ ] Completing workflow updates execution status
- [ ] Queue refreshes after completion
- [ ] Next workflow loads from updated queue
- [ ] Demo mode still works (`?demo=true`)
- [ ] Sequence mode still works (`?sequence=bluesoft-demo-2025`)
- [ ] Multiple customers show in queue
- [ ] Different workflow types (risk, opportunity, renewal) all work

---

## Benefits of DB-Driven Dashboard

✅ **No more hardcoded customer data**
✅ **Works for ANY customer** (not just Obsidian Black)
✅ **Real-time prioritization** based on scores
✅ **Multiple customers** in same queue
✅ **Automatic workflow assignment** via trigger rules
✅ **Completion tracking** persisted to database
✅ **Snooze/skip** workflows
✅ **Resume workflows** where you left off
✅ **Task tracking** after workflow completion

---

## Risk Mitigation

### Risk 1: Config Builder Not Ready
**Mitigation:** Build Phase A & B first (API + fetching), stub config builder with static configs

### Risk 2: Breaking Demo Mode
**Mitigation:** Keep backward compatibility (Phase E) with `?demo=true` param

### Risk 3: Missing Customer Data
**Mitigation:** Validation + default values + clear error messages

---

## Recommended Approach

### Option A: Sequential (Safer)
1. ✅ Complete Phase 1 (Slide Library) - **IN PROGRESS**
2. Complete Phase 2 (Config Builder)
3. Then tackle Zen Dashboard conversion

**Timeline:** 1 week slide library + 1 week config builder + 3-4 days dashboard = **~3 weeks**

### Option B: Parallel (Faster)
1. ✅ Continue Phase 1 (Slide Library)
2. Start Phase A & B now (API + fetching) - **CAN START NOW**
3. Do Phase C & D after config builder ready

**Timeline:** Overlapping work = **~2 weeks**

### Option C: Stub Approach (Fastest Demo)
1. Build Phase A & B (API + fetching)
2. Stub config builder to return static configs
3. Dashboard is "DB-driven" for queue, static for configs
4. Replace stub when real config builder ready

**Timeline:** **~4 days** for functional demo, refine later

---

## Recommendation

I recommend **Option B (Parallel)** because:
- API routes already mostly exist
- Dashboard fetching is independent of config builder
- Gets visible progress quickly
- Unblocks testing of queue system
- Config builder can drop in when ready

Should I proceed with Phase A (API enhancements) while continuing the slide library work?
