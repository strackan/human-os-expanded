# Step-Level Actions - Integration Guide

**Status:** 90% Complete - Ready for final integration
**Date:** 2025-10-22

---

## ✅ What's Built

### 1. Database Schema ✅
**Migration:** `20251022000007_step_level_actions.sql`

**Tables Created:**
- `workflow_step_states` - Tracks state of each step (snoozed, skipped, completed)
- `workflow_step_actions` - Audit log of all step actions

**Features:**
- Auto-updates `workflow_executions.has_snoozed_steps` flag
- Auto-updates `workflow_executions.next_due_step_date`
- View: `workflow_steps_due` for finding steps that are now due
- RLS policies with demo_mode support

### 2. Service Layer ✅
**File:** `src/lib/workflows/actions/WorkflowStepActionService.ts`

**Methods:**
- `snoozeStep(executionId, stepIndex, stepId, stepLabel, userId, options)`
- `skipStep(executionId, stepIndex, stepId, stepLabel, userId, options)`
- `resumeStep(executionId, stepIndex, userId)`
- `getStepStates(executionId)` - Get all step states for a workflow
- `getSnoozedStepsDue(userId)` - Get steps that are now due

### 3. UI Components ✅
**File:** `src/components/workflows/StepActionModals.tsx`

**Components:**
- `StepSnoozeModal` - Full-featured snooze modal with date picker
- `StepSkipModal` - Skip modal with required reason

**Features:**
- Same UX as workflow-level actions
- Close button, proper contrast, loading states
- Success/error handling

### 4. Existing UI Already Ready ✅
**File:** `src/components/workflows/sections/WorkflowStepProgress.tsx`

**Already Has:**
- Click handler on steps to show menu
- Snooze and Skip icon buttons
- Callbacks: `onSnoozeStep(index)` and `onSkipStep(index)`

---

## 🔧 Final Integration Steps

### Step 1: Import Modals in TaskModeFullscreen

Add to imports:
```typescript
import { StepSnoozeModal, StepSkipModal } from '@/components/workflows/StepActionModals';
```

### Step 2: Add State for Step Modal

Add to component state:
```typescript
const [showStepSnoozeModal, setShowStepSnoozeModal] = useState<number | null>(null);
const [showStepSkipModal, setShowStepSkipModal] = useState<number | null>(null);
```

### Step 3: Update WorkflowStepProgress Callbacks

Replace current onSnoozeStep and onSkipStep:
```typescript
<WorkflowStepProgress
  slides={state.slides}
  currentSlideIndex={state.currentSlideIndex}
  completedSlides={state.completedSlides}
  stepActionMenu={state.stepActionMenu}
  onStepClick={state.goToSlide}
  onToggleStepActionMenu={state.setStepActionMenu}
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

### Step 4: Render Modals

Add before closing tag of TaskModeFullscreen:
```typescript
{/* Step Snooze Modal */}
{showStepSnoozeModal !== null && executionId && userId && (
  <StepSnoozeModal
    executionId={executionId}
    userId={userId}
    stepIndex={showStepSnoozeModal}
    stepId={state.slides[showStepSnoozeModal]?.id || `step-${showStepSnoozeModal}`}
    stepLabel={state.slides[showStepSnoozeModal]?.label || `Step ${showStepSnoozeModal + 1}`}
    onClose={() => setShowStepSnoozeModal(null)}
    onSuccess={() => {
      setShowStepSnoozeModal(null);
      // Optionally refresh step states here
      alert('✅ Step snoozed! It will reappear when due.');
    }}
  />
)}

{/* Step Skip Modal */}
{showStepSkipModal !== null && executionId && userId && (
  <StepSkipModal
    executionId={executionId}
    userId={userId}
    stepIndex={showStepSkipModal}
    stepId={state.slides[showStepSkipModal]?.id || `step-${showStepSkipModal}`}
    stepLabel={state.slides[showStepSkipModal]?.label || `Step ${showStepSkipModal + 1}`}
    onClose={() => setShowStepSkipModal(null)}
    onSuccess={() => {
      setShowStepSkipModal(null);
      // Optionally mark step as skipped in UI
      alert('✅ Step skipped!');
    }}
  />
)}
```

### Step 5: Remove Old Confirmation Modal (Optional)

The existing confirmation modal at lines 427-462 can be removed or kept as a simple fallback.

---

## 🎨 Next: Update UI to Show Snoozed Steps

### Load Step States on Workflow Load

In TaskModeFullscreen or useTaskModeState, add:
```typescript
const [stepStates, setStepStates] = useState<Record<number, StepState>>({});

useEffect(() => {
  if (executionId) {
    const service = new WorkflowStepActionService();
    service.getStepStates(executionId).then(result => {
      if (result.success && result.states) {
        const statesMap: Record<number, StepState> = {};
        result.states.forEach(state => {
          statesMap[state.step_index] = state;
        });
        setStepStates(statesMap);
      }
    });
  }
}, [executionId]);
```

### Update WorkflowStepProgress to Show Indicators

Pass stepStates to WorkflowStepProgress:
```typescript
<WorkflowStepProgress
  stepStates={stepStates}  // Add this prop
  // ... other props
/>
```

Update WorkflowStepProgress component to show indicators:
```typescript
const stepState = stepStates[index];
const isSnoozed = stepState?.status === 'snoozed';
const isSkipped = stepState?.status === 'skipped';

// Add badge for snoozed steps
{isSnoozed && (
  <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1">
    <Clock className="w-3 h-3" />
  </div>
)}

// Change color for skipped steps
className={`
  ${isSkipped ? 'bg-gray-400 text-white line-through' : ''}
  ${isSnoozed ? 'bg-orange-500 text-white' : ''}
  // ... other classes
`}
```

---

## 📝 Files to Modify

1. **`src/components/workflows/TaskMode/TaskModeFullscreen.tsx`**
   - Add imports
   - Add state
   - Update callbacks
   - Render modals
   - Load step states

2. **`src/components/workflows/sections/WorkflowStepProgress.tsx`**
   - Add stepStates prop
   - Show snooze/skip indicators
   - Update styling for snoozed/skipped steps

---

## 🧪 Testing

1. Launch workflow in obsidian-black-v3
2. Click on a step number to show action menu
3. Click Snooze icon → Should show full modal with date picker
4. Click Skip icon → Should show modal with reason field
5. Complete action → Check database for records
6. Reload workflow → Should show snooze/skip indicators

---

## 📊 Database Queries for Testing

```sql
-- View all step states
SELECT * FROM workflow_step_states
WHERE execution_id = 'your-execution-id'
ORDER BY step_index;

-- View step actions
SELECT * FROM workflow_step_actions
WHERE execution_id = 'your-execution-id'
ORDER BY created_at DESC;

-- View snoozed steps due
SELECT * FROM workflow_steps_due;

-- Check workflow flags
SELECT has_snoozed_steps, next_due_step_date
FROM workflow_executions
WHERE id = 'your-execution-id';
```

---

## 🎯 Success Criteria

- [ ] User can snooze individual steps
- [ ] User can skip individual steps
- [ ] Step states persist in database
- [ ] Snoozed steps show indicator in progress bar
- [ ] Skipped steps show as crossed out
- [ ] Audit trail records all actions
- [ ] `has_snoozed_steps` flag updates automatically
- [ ] No workflow-level snooze when only step is snoozed
