# Step-Level Actions Guide

**Last Updated:** 2025-10-23
**Status:** 90% Complete
**Feature:** Snooze/skip individual workflow steps

> **Note:** For database schema, see [Database Reference](../technical/DATABASE.md#workflow-step-states).
> For architecture context, see [Architecture Guide](../technical/ARCHITECTURE.md#step-level-actions).

---

## Recent Changes
- **2025-10-23:** Consolidated from STEP-LEVEL-ACTIONS-INTEGRATION.md
- **2025-10-22:** Added database tables and service layer
- **2025-10-22:** Created step action modals

---

## Overview

Step-level actions allow users to snooze or skip individual steps within a workflow, instead of snoozingthe entire workflow.

**Example:** In a 6-step renewal workflow, user can snooze Step 3 (Pricing Analysis) until finance approves, while continuing with Steps 1, 2, 4, 5, and 6.

---

## What's Built

### 1. Database Tables ✅
- `workflow_step_states` - Tracks snoozed/skipped steps
- `workflow_step_actions` - Audit log

See [Database Reference](../technical/DATABASE.md#workflow-step-states) for schema.

### 2. Service Layer ✅
**File:** `src/lib/workflows/actions/WorkflowStepActionService.ts`

**Methods:**
- `snoozeStep()` - Snooze step until date
- `skipStep()` - Skip step with reason
- `resumeStep()` - Resume snoozed step
- `getStepStates()` - Get all states
- `getSnoozedStepsDue()` - Get due steps

### 3. UI Components ✅
**File:** `src/components/workflows/StepActionModals.tsx`

- `StepSnoozeModal` - Date picker, reason field
- `StepSkipModal` - Skip with reason

### 4. UI Integration 🔄
**Status:** 90% complete (pending final wiring)

---

## Usage

### Snoozing a Step

```typescript
const service = new WorkflowStepActionService();

await service.snoozeStep(
  executionId,
  stepIndex,
  stepId,
  stepLabel,
  userId,
  {
    snoozeUntil: '2025-10-25 10:00:00',
    duration: '2_days',
    reason: 'Waiting for finance approval'
  }
);
```

**Database Updates:**
1. UPSERT `workflow_step_states` (status='snoozed')
2. INSERT `workflow_step_actions` (audit log)
3. Trigger updates `workflow_executions.has_snoozed_steps`

---

### Skipping a Step

```typescript
await service.skipStep(
  executionId,
  stepIndex,
  stepId,
  stepLabel,
  userId,
  {
    reason: 'Quote not needed for this customer'
  }
);
```

---

### Getting Step States

```typescript
const result = await service.getStepStates(executionId);

if (result.success && result.states) {
  result.states.forEach(state => {
    console.log(`Step ${state.step_index}: ${state.status}`);
  });
}
```

---

## Final Integration (10% Remaining)

### Add to TaskModeFullscreen.tsx

**1. Import modals:**
```typescript
import { StepSnoozeModal, StepSkipModal } from '@/components/workflows/StepActionModals';
```

**2. Add state:**
```typescript
const [showStepSnoozeModal, setShowStepSnoozeModal] = useState<number | null>(null);
const [showStepSkipModal, setShowStepSkipModal] = useState<number | null>(null);
```

**3. Update callbacks:**
```typescript
<WorkflowStepProgress
  onSnoozeStep={(index) => {
    setShowStepSnoozeModal(index);
    state.setStepActionMenu(null);
  }}
  onSkipStep={(index) => {
    setShowStepSkipModal(index);
    state.setStepActionMenu(null);
  }}
/>
```

**4. Render modals:**
```typescript
{showStepSnoozeModal !== null && (
  <StepSnoozeModal
    executionId={executionId}
    userId={userId}
    stepIndex={showStepSnoozeModal}
    stepId={state.slides[showStepSnoozeModal]?.id}
    stepLabel={state.slides[showStepSnoozeModal]?.label}
    onClose={() => setShowStepSnoozeModal(null)}
    onSuccess={() => {
      setShowStepSnoozeModal(null);
      reloadStepStates();
    }}
  />
)}
```

---

## Testing

1. Launch workflow
2. Click step number → Menu appears
3. Click "Snooze" → Modal opens
4. Select date, add reason → Click "Snooze Step"
5. Check database: `workflow_step_states` has record
6. Check UI: Orange badge on step

---

## Related Documentation

- [Database Schema](../technical/DATABASE.md#workflow-step-states)
- [Architecture Guide](../technical/ARCHITECTURE.md#step-level-actions)
- [System Overview](../product/SYSTEM-OVERVIEW.md)

