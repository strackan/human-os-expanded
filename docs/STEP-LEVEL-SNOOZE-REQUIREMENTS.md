# Step-Level Snooze Requirements

**Date:** 2025-10-22
**Status:** Requirements Gathering
**Related:** Phase 3E Workflow Actions

---

## 🎯 User Request

"There should be snooze actions on steps and potentially tasks within steps, as well. So, I should be able to just snooze sending the email. In this event the steps would show as complete, but the workflow would still show as open and so would the snoozed task. The workflow would show up at some point over the next few days, with just that task outstanding."

---

## 📋 Requirements Analysis

### Current State
- **Workflow-level actions only**: Snooze/Skip/Escalate operate at workflow execution level
- **No granularity**: Can't snooze individual steps or tasks within a workflow
- **All-or-nothing**: Snooz workflow = entire workflow disappears

### Desired State
- **Step-level snooze**: Ability to snooze a specific step (e.g., "Send Email")
- **Partial completion**: Workflow shows as in-progress with some steps complete
- **Task visibility**: Snoozed tasks remain visible with snooze indicator
- **Workflow reappearance**: Workflow resurfaces when snoozed task becomes due

---

## 🗂️ Data Model Changes Needed

### 1. New Table: `workflow_step_actions`
```sql
CREATE TABLE workflow_step_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id),
  step_id TEXT NOT NULL,  -- Identifier for the step (e.g., "send-email")
  step_index INTEGER NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,  -- 'snooze', 'unsnooze', 'skip', 'complete'
  previous_status TEXT,
  new_status TEXT,
  snooze_until TIMESTAMPTZ,
  snooze_days INTEGER,
  action_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. New Table: `workflow_step_states`
```sql
CREATE TABLE workflow_step_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id),
  step_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  status TEXT NOT NULL,  -- 'pending', 'in_progress', 'completed', 'snoozed', 'skipped'
  snooze_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  snoozed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(execution_id, step_id)
);
```

### 3. Update `workflow_executions`
```sql
-- Add column to track if workflow has any snoozed steps
ALTER TABLE workflow_executions
ADD COLUMN has_snoozed_steps BOOLEAN DEFAULT false;

-- Add computed column for next_due_step
ALTER TABLE workflow_executions
ADD COLUMN next_due_step_date TIMESTAMPTZ;
```

---

## 🎨 UI Changes Needed

### 1. Step Progress Bar
**Current:**
- Steps show as complete/in-progress/pending
- Click to navigate between steps

**Needed:**
- Add snooze indicator icon to snoozed steps
- Show "Snoozed until [date]" tooltip
- Visual differentiation (e.g., yellow/orange color)
- Action menu on each step with Snooze/Skip options

### 2. Workflow Header
**Current:**
- Shows workflow-level action buttons (Snooze, Skip, Escalate)

**Needed:**
- Show count of snoozed steps (e.g., "2 steps snoozed")
- Badge indicator when steps are snoozed
- Option to view all snoozed steps

### 3. Dashboard View
**Current:**
- Workflows show as "Active" or "Snoozed"

**Needed:**
- New filter: "Has Snoozed Steps"
- Workflow cards show step completion (e.g., "4/6 steps complete, 1 snoozed")
- Workflows with snoozed steps due appear in priority list

---

## 🔄 Business Logic

### Workflow Status Rules
1. **Workflow with snoozed steps:**
   - Overall status: `in_progress`
   - Flag: `has_snoozed_steps = true`
   - Appears in "Active Workflows" list
   - Shows step completion progress

2. **Step completion:**
   - Non-snoozed steps can be completed independently
   - Snoozed steps show as "pending" until due date
   - When snoozed step becomes due:
     - Notification sent to user
     - Step status changes to `pending`
     - User prompted to complete step

3. **Workflow completion:**
   - Cannot complete workflow if any steps are snoozed
   - Must either:
     - Wait for snooze to expire
     - Manually resume snoozed step
     - Skip the snoozed step

### Query Logic
```typescript
// Get workflows with steps due today
SELECT we.*
FROM workflow_executions we
WHERE we.has_snoozed_steps = true
AND EXISTS (
  SELECT 1 FROM workflow_step_states wss
  WHERE wss.execution_id = we.id
  AND wss.status = 'snoozed'
  AND wss.snooze_until <= NOW()
)

// Get step states for a workflow
SELECT *
FROM workflow_step_states
WHERE execution_id = $1
ORDER BY step_index ASC
```

---

## 📱 User Experience Flow

### Snoozing a Step
1. User is on "Send Email" step
2. Clicks step action menu → "Snooze"
3. Modal appears: "Snooze this step until..."
4. Selects date (Tomorrow, 1 week, Custom)
5. Step is snoozed, user advances to next step
6. Progress bar shows "Send Email" with snooze indicator

### Workflow with Snoozed Steps
1. User opens workflow from dashboard
2. Sees progress: "4/6 steps complete, 1 snoozed"
3. Progress bar shows:
   - Green checkmarks on completed steps
   - Snooze icon on "Send Email" step
   - Current step highlighted
4. User can:
   - Continue with other steps
   - Resume snoozed step early
   - Wait for snooze to expire

### Step Becomes Due
1. Snooze time expires
2. Notification: "Step 'Send Email' is now due in Obsidian Black Renewal"
3. User opens workflow
4. "Send Email" step shows as pending
5. User completes the step

---

## 🚀 Implementation Plan

### Phase 1: Data Layer
- [ ] Create migration for `workflow_step_actions` table
- [ ] Create migration for `workflow_step_states` table
- [ ] Update `workflow_executions` with step snooze columns
- [ ] Add RLS policies
- [ ] Create database views for queries

### Phase 2: Service Layer
- [ ] Create `WorkflowStepActionService`
  - `snoozeStep(executionId, stepId, options)`
  - `resumeStep(executionId, stepId)`
  - `skipStep(executionId, stepId)`
  - `completeStep(executionId, stepId)`
- [ ] Create `WorkflowStepQueryService`
  - `getStepStates(executionId)`
  - `getSnoozedSteps(userId)`
  - `getStepsDueToday(userId)`
- [ ] Update `WorkflowQueryService`
  - Add `has_snoozed_steps` filter
  - Include step progress in workflow queries

### Phase 3: UI Components
- [ ] Update `WorkflowStepProgress` component
  - Add step action menu
  - Show snooze indicators
  - Display snooze date on hover
- [ ] Create `StepActionButtons` component
  - Mini version of workflow action buttons
  - Context menu for each step
- [ ] Update `WorkflowHeader`
  - Show snoozed step count badge
- [ ] Update Dashboard
  - Filter for workflows with snoozed steps
  - Show step progress in workflow cards

### Phase 4: Notifications
- [ ] Create scheduled job to check for due steps
- [ ] Send notifications when steps become due
- [ ] Email reminders for upcoming due steps

---

## 🤔 Open Questions

1. **Task-level snooze**: User mentioned "tasks within steps" - do we need even more granularity?
2. **Completion rules**: Should we allow marking workflow complete with snoozed steps?
3. **Cascade behavior**: If workflow is snoozed, should all steps be snoozed?
4. **Resume all**: Should there be a "Resume all snoozed steps" action?
5. **Maximum snooze**: Should there be a limit on how long a step can be snoozed?
6. **Snooze count**: Should we track how many times a step has been snoozed?

---

## 💡 Recommendations

1. **Start with step-level**: Implement step-level snooze before task-level
2. **Keep it simple**: Use same snooze UI/UX as workflow-level
3. **Visual clarity**: Make snoozed steps very obvious in progress bar
4. **Prevent abuse**: Add limits on snooze duration/frequency
5. **Analytics**: Track which steps get snoozed most often

---

## 📊 Estimated Effort

- **Phase 1 (Data):** 2-3 hours
- **Phase 2 (Services):** 3-4 hours
- **Phase 3 (UI):** 4-6 hours
- **Phase 4 (Notifications):** 2-3 hours

**Total:** 11-16 hours (1.5-2 days)

---

## 🔗 Related Files

- `src/components/workflows/sections/WorkflowStepProgress.tsx`
- `src/lib/workflows/actions/WorkflowActionService.ts`
- `src/lib/workflows/actions/WorkflowQueryService.ts`
- `supabase/migrations/20251022000001_phase3e_workflow_actions.sql`
