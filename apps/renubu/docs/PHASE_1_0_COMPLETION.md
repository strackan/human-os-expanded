# Phase 1.0: Workflow Snoozing - COMPLETE ✓

**Completion Date:** November 13, 2025
**Status:** Production Ready

## Executive Summary

Phase 1.0 successfully implements trigger-based workflow snoozing with date-based wake triggers, allowing users to defer workflows until specific dates or events occur. The system includes comprehensive UI for configuring triggers, visual feedback, and automatic workflow surfacing.

---

## Features Implemented

### 1. Workflow-Level Snoozing
- **Trigger Configuration Modal**: Enhanced modal allowing users to set date-based triggers
- **Date Picker**: User-friendly date selection with validation
- **Success Feedback**: Toast notifications with formatted wake date display
- **Snoozed Workflows List**: Dedicated view showing all snoozed workflows with trigger details
- **Manual Wake**: Ability to wake workflows immediately via "Wake Now" button
- **Visual Indicators**: Badge showing workflows are snoozed with wake conditions

### 2. Step-Level Snoozing
- **Per-Step Snooze**: Users can snooze individual workflow steps
- **Visual State**: Greyed-out snoozed steps with 💤 badge in progress bar
- **Navigation Skip**: Automatic navigation bypass for snoozed steps
- **Overlay Display**: "Task Snoozed. Check back later." overlay when viewing snoozed steps
- **Snooze Until Display**: Shows formatted date when step will be available

### 3. Smart Navigation
- **Automatic Skip Logic**: Navigation automatically skips snoozed/skipped steps
- **Next Available Detection**: Finds the next non-snoozed step for navigation
- **Dynamic Button Text**: Button labels reflect actual next step (via `previousButton` property)
- **Workflow Completion**: Auto-completes workflow when all remaining steps are snoozed/skipped

### 4. Database Integration
- **Trigger Storage**: Wake triggers stored as JSONB in `workflow_executions.wake_triggers`
- **Step States**: Per-step snooze states in `workflow_step_states` table
- **Trigger Evaluation Log**: History table `workflow_wake_triggers` for debugging
- **RLS Policies**: Row-level security with demo mode support

---

## Architecture

### Database Schema

```sql
-- workflow_executions table additions
ALTER TABLE workflow_executions ADD COLUMN wake_triggers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE workflow_executions ADD COLUMN last_evaluated_at TIMESTAMPTZ;
ALTER TABLE workflow_executions ADD COLUMN trigger_fired_at TIMESTAMPTZ;
ALTER TABLE workflow_executions ADD COLUMN fired_trigger_type TEXT;

-- workflow_wake_triggers table (evaluation history)
CREATE TABLE workflow_wake_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('date', 'event')),
    trigger_config JSONB NOT NULL,
    is_fired BOOLEAN DEFAULT false,
    evaluated_at TIMESTAMPTZ,
    fired_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Service Layer

**WorkflowSnoozeService** (`src/lib/services/WorkflowSnoozeService.ts`)
- `snoozeWithTriggers()`: Snooze workflow with triggers
- `getSnoozedWorkflows()`: Fetch snoozed workflows for user
- `surfaceWorkflow()`: Wake workflow (change status to in_progress)
- `evaluateAllSnoozedWorkflows()`: Batch evaluate triggers (for cron job)

**TriggerEvaluator** (`src/lib/services/TriggerEvaluator.ts`)
- `evaluateAllTriggers()`: Evaluate all triggers for a workflow
- `evaluateDateTrigger()`: Check if date trigger has fired
- `logTriggerEvaluation()`: Log evaluation to history table
- `updateWorkflowWithEvaluationResults()`: Update workflow with fired trigger

**WorkflowStepActionService** (`src/lib/workflows/actions/WorkflowStepActionService.ts`)
- `snoozeStep()`: Snooze individual workflow step
- `skipStep()`: Skip workflow step
- `getStepStates()`: Fetch step states for execution

### API Endpoints

- `POST /api/workflows/snooze-with-triggers`: Snooze workflow with triggers
- `GET /api/workflows/snoozed`: Get snoozed workflows for user
- `POST /api/workflows/wake-now`: Manually wake workflow
- `GET /api/workflows/debug`: Debug endpoint for workflow state
- `POST /api/workflows/executions/[id]/steps/[stepId]/snooze`: Snooze step
- `POST /api/workflows/executions/[id]/steps/[stepId]/skip`: Skip step

### UI Components

**EnhancedSnoozeModal** (`src/components/workflows/EnhancedSnoozeModal.tsx`)
- Date trigger configuration
- Visual calendar picker
- Trigger logic selection (OR only in Phase 1.0)
- Success/error feedback

**SnoozedWorkflowsList** (`src/components/workflows/SnoozedWorkflowCard.tsx`)
- Card-based display of snoozed workflows
- Wake triggers visualization
- Manual wake action
- View details action

**TaskModeFullscreen** (`src/components/workflows/TaskMode/TaskModeFullscreen.tsx`)
- Snooze modal integration
- Step state synchronization
- Snoozed step overlay rendering
- Navigation logic coordination

**WorkflowStepProgress** (`src/components/workflows/sections/WorkflowStepProgress.tsx`)
- Visual state for snoozed steps (grey + 💤 badge)
- Step action menu (snooze/skip options)
- Click handlers for step actions

---

## Key Implementation Details

### 1. Step State Synchronization

**Problem**: Database step states (`workflow_step_states`) and UI state (`snoozedSlides` Set) were out of sync, causing navigation to not skip snoozed steps.

**Solution**: Added effect in `TaskModeFullscreen.tsx:123-143` to sync database states to UI state:

```typescript
useEffect(() => {
  const snoozedIndices = new Set<number>();
  const skippedIndices = new Set<number>();

  Object.entries(stepStates).forEach(([indexStr, stepState]) => {
    const index = parseInt(indexStr, 10);
    if (stepState.status === 'snoozed') snoozedIndices.add(index);
    else if (stepState.status === 'skipped') skippedIndices.add(index);
  });

  state.setSnoozedSlides(snoozedIndices);
  state.setSkippedSlides(skippedIndices);
}, [stepStates]);
```

### 2. Dynamic Button Text

**Problem**: Button text was generic ("Next", "Proceed") and didn't reflect which step comes next when intermediate steps are snoozed.

**Solution**: Added `previousButton` property to `WorkflowSlide` interface allowing natural language button labels:

```typescript
// In slide definition
{
  id: 'pricing-strategy',
  previousButton: "Let's see the pricing analysis", // ← Shows on previous step
  // ...
}

// In ChatRenderer
const getNextButtonLabel = (originalLabel: string, buttonValue: string) => {
  const nextAvailable = state.getNextAvailableSlide();
  return nextAvailable?.slide?.previousButton || originalLabel;
};
```

### 3. Navigation Skip Logic

The core navigation logic in `useTaskModeState.ts:125-153`:

```typescript
const goToNextSlide = useCallback(() => {
  if (currentSlideIndex < slides.length - 1) {
    // Find next non-snoozed/non-skipped slide
    let nextIndex = currentSlideIndex + 1;
    while (nextIndex < slides.length &&
           (skippedSlides.has(nextIndex) || snoozedSlides.has(nextIndex))) {
      nextIndex++;
    }

    if (nextIndex < slides.length) {
      setCurrentSlideIndex(nextIndex);
    } else {
      // All remaining slides snoozed/skipped - complete workflow
      showToast({ message: 'Workflow complete!', type: 'success' });
      setTimeout(() => onClose(true), 100);
    }
  }
}, [currentSlideIndex, slides, skippedSlides, snoozedSlides]);
```

---

## Testing

### Test Page: `/test-snooze`

Comprehensive testing environment with:
- Two test scenarios: Date-Only and Date + Event Triggers
- Launch test workflows (Obsidian Black Renewal)
- View snoozed workflows list
- Test manual wake functionality
- Refresh button to see trigger evaluations

### Manual Testing Checklist

✅ Workflow-level snooze opens modal
✅ Date picker allows date selection
✅ Success toast shows formatted date
✅ Snoozed workflow appears in list
✅ Manual wake removes from list
✅ Step-level snooze shows action menu
✅ Snoozed steps are greyed out with badge
✅ Navigation skips snoozed steps
✅ Clicking snoozed step shows overlay
✅ Button text updates for next available step
✅ All remaining steps snoozed = workflow complete

---

## Database Migration

Migration script: `sql/phase_1_0_complete_setup.sql`

Run in Supabase SQL Editor to set up:
- Add trigger columns to `workflow_executions`
- Create `workflow_wake_triggers` table
- Create indexes for performance
- Set up RLS policies

---

## Configuration

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Workflow Slide Configuration

Add `previousButton` to any slide for natural button text:

```typescript
export const myWorkflowSlide = createSlideTemplate((context) => ({
  id: 'my-step',
  title: 'My Step',
  label: 'My Step',
  previousButton: "Let's review the analysis", // ← Natural language
  chat: {
    initialMessage: {
      text: "Here's the analysis...",
      buttons: [
        { label: 'Continue', value: 'continue' }
      ]
    }
  }
}));
```

---

## Known Limitations

1. **Phase 1.0 supports OR logic only** - All triggers use OR (any trigger fires = wake workflow)
2. **Date triggers only** - Event triggers defined but evaluation logic deferred to Phase 1.0.1
3. **Daily cron evaluation** - Triggers evaluated once per day via Supabase Edge Function
4. **No trigger editing** - Once snoozed, triggers cannot be modified (must wake and re-snooze)

---

## Future Enhancements (Phase 1.0.1)

1. **Event Triggers**
   - Gmail: New email from contact
   - Slack: Message in channel
   - Calendar: Event occurs
   - CRM: Field value changes

2. **AND/OR Logic**
   - Support complex trigger combinations
   - UI for building trigger logic trees

3. **Trigger Editing**
   - Modify triggers without waking workflow
   - Add/remove triggers on snoozed workflows

4. **Real-time Evaluation**
   - Webhook-based trigger evaluation
   - Sub-minute trigger response times

---

## Files Modified/Created

### Services
- `src/lib/services/WorkflowSnoozeService.ts` (created)
- `src/lib/services/TriggerEvaluator.ts` (created)
- `src/lib/workflows/actions/WorkflowStepActionService.ts` (modified)

### API Routes
- `src/app/api/workflows/snooze-with-triggers/route.ts` (created)
- `src/app/api/workflows/snoozed/route.ts` (created)
- `src/app/api/workflows/wake-now/route.ts` (created)
- `src/app/api/workflows/debug/route.ts` (created)

### Components
- `src/components/workflows/EnhancedSnoozeModal.tsx` (created)
- `src/components/workflows/SnoozedWorkflowCard.tsx` (created)
- `src/components/workflows/TaskMode/TaskModeFullscreen.tsx` (modified)
- `src/components/workflows/TaskMode/hooks/useTaskModeState.ts` (modified)
- `src/components/workflows/sections/WorkflowStepProgress.tsx` (modified)
- `src/components/workflows/sections/ChatRenderer.tsx` (modified)

### Types
- `src/types/wake-triggers.ts` (created)
- `src/components/artifacts/workflows/config/WorkflowConfig.ts` (modified)

### Test Page
- `src/app/test-snooze/page.tsx` (created)

### Database
- `sql/phase_1_0_complete_setup.sql` (created)
- `sql/phase_1_0_fix_schema.sql` (created)

### Documentation
- `docs/PHASE_1_0_COMPLETION.md` (this file)

---

## Deployment Checklist

- [x] Run database migration: `sql/phase_1_0_complete_setup.sql`
- [x] Verify RLS policies are active
- [x] Test workflow snooze in production
- [x] Test step snooze in production
- [x] Verify snoozed workflows list displays correctly
- [x] Confirm manual wake functionality works
- [x] Test navigation skip logic with snoozed steps
- [x] Verify dynamic button text updates correctly
- [x] Build passes without errors
- [x] Type checking passes

---

## Success Metrics

- ✅ Users can snooze workflows with date triggers
- ✅ Snoozed workflows appear in dedicated list view
- ✅ Users can manually wake workflows
- ✅ Users can snooze individual workflow steps
- ✅ Navigation automatically skips snoozed steps
- ✅ Visual feedback clearly indicates snoozed state
- ✅ Button text reflects actual next available step
- ✅ All database operations use service role client for proper permissions

---

## Credits

**Implementation Team:**
- Wes (Product Owner)
- Claude (AI Development Agent)

**Implementation Approach:**
- 3 parallel agents for initial setup
- Iterative refinement based on user testing
- Bug fixes for step navigation and user_id handling
- UX improvements for button text and visual feedback

---

## Conclusion

Phase 1.0 is **production-ready** and provides a solid foundation for workflow management. The system allows users to defer both entire workflows and individual steps, with smart navigation that skips snoozed content. The implementation is well-architected, thoroughly tested, and ready for user adoption.

**Next Phase:** Phase 1.0.1 will add event-based triggers and complex logic combinations (AND/OR).
