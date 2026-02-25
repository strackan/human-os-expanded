# Phase 1.1 (Skip) and 1.2 (Escalate) - Status Report

## Current Status

### ✅ Completed
1. **Phase 1.1 (Skip Enhanced)** - All 6 components implemented
   - Database migration (`20260101000000_workflow_skip_triggers_phase1_1.sql`)
   - TypeScript types (`src/types/skip-triggers.ts`)
   - Services (`SkipTriggerEvaluator.ts`, `WorkflowSkipService.ts`)
   - API endpoints (`skip-with-triggers`, `skipped`, `reactivate-now`)
   - UI component (`EnhancedSkipModal.tsx`)
   - Cron job (`evaluate-skip-triggers`)

2. **Phase 1.2 (Escalate Enhanced)** - All 6 components implemented
   - Database migration (`20260102000000_workflow_escalate_triggers_phase1_2.sql`)
   - TypeScript types (`src/types/escalate-triggers.ts`)
   - Services (`EscalateTriggerEvaluator.ts`, `WorkflowEscalateService.ts`)
   - API endpoints (`escalate-with-triggers`, `escalated`, `resolve-now`)
   - UI component (`EnhancedEscalateModal.tsx`)
   - Cron job (`evaluate-escalate-triggers`)

3. **Test Infrastructure**
   - Test page for Skip: `/test-skip`
   - Test page for Escalate: `/test-escalate`
   - API helper functions in `src/lib/api/workflow-triggers.ts`

### ⚠️ Issues Identified

#### Issue 1: Database Migrations Not Applied

**Problem**: When testing `/test-skip`, got error:
```
Failed to get skipped workflows: column workflow_executions.skip_trigger_fired_at does not exist
```

**Root Cause**:
- Phase 1.0, 1.1, and 1.2 migrations haven't been applied to the remote database
- There's a schema conflict between `consolidated_phase1_setup.sql` (which was run manually) and the migration files
- The `workflow_wake_triggers` table exists but is missing columns that Phase 1.0 expects

**Solution**: Run the consolidated SQL script manually through Supabase SQL Editor

**File**: `supabase/scripts/apply_phase1_skip_escalate_migrations.sql`

This script:
- Fixes the `workflow_wake_triggers` schema conflicts
- Applies Phase 1.0.1 (Trigger Logic)
- Applies Phase 1.1 (Skip Triggers)
- Applies Phase 1.2 (Escalate Triggers)
- Includes verification queries to confirm success

**Steps to Apply**:
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql/new
2. Copy the contents of `supabase/scripts/apply_phase1_skip_escalate_migrations.sql`
3. Paste and execute
4. Verify the results show all required columns and tables

#### Issue 2: Button Text Incorrect When Steps Skipped

**Problem**: Button says "Draft Quote" when the Draft Quote step is skipped. Should say "Send Email".

**Root Cause**: The workflow slide definitions don't have the `previousButton` property set.

**How it Works**:
The `previousButton` property was added in Phase 1.0.1 to support dynamic button text. When a step is skipped/snoozed, the navigation automatically jumps to the next available step, and the button text should reflect what that next step is.

**Implementation** (already working in code):
```typescript
// In TaskModeFullscreen.tsx:352-355
const nextAvailable = state.getNextAvailableSlide();
if (nextAvailable?.slide?.previousButton) {
  return nextAvailable.slide.previousButton; // ✅ Uses previousButton if set
}
return originalLabel; // ❌ Falls back to generic label
```

**Solution**: Add `previousButton` to workflow slide definitions

**Example Fix** (for obsidian-black-renewal workflow):

```typescript
// In the workflow definition
{
  id: 'prepare-quote-v2',
  title: 'Draft Quote',
  label: 'Draft Quote',
  previousButton: "Let's draft the quote", // ← Button text from PREVIOUS step
  // ...
},
{
  id: 'draft-email-v2',
  title: 'Send Email',
  label: 'Send Email',
  previousButton: "Send Email", // ← Button text from PREVIOUS step (shows when Draft Quote is skipped)
  // ...
}
```

**Files to Update**:
1. Database workflow definitions in `workflow_definitions` table
2. The `slide_contexts` JSONB field for each workflow
3. Or update the TypeScript workflow configs if using code-based definitions

**Where to Add**:
- Check the test workflow being used (obsidian-black-renewal)
- Look at its definition in either:
  - Database: `SELECT * FROM workflow_definitions WHERE workflow_id = 'obsidian-black-renewal'`
  - Code: Search for where this workflow is defined/composed
- Add `previousButton` to each slide's configuration

## Next Steps

### Immediate Actions
1. ✅ Run `apply_phase1_skip_escalate_migrations.sql` in Supabase SQL Editor
2. ⏳ Add `previousButton` property to workflow slide definitions
3. ⏳ Test Skip functionality at http://localhost:3000/test-skip
4. ⏳ Test Escalate functionality at http://localhost:3000/test-escalate

### Verification Commands

After running the migration script:

```sql
-- Verify workflow_executions columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workflow_executions'
  AND column_name LIKE '%skip%' OR column_name LIKE '%escalate%'
ORDER BY column_name;

-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('workflow_skip_triggers', 'workflow_escalate_triggers');
```

### Testing Checklist

**Skip Testing** (`/test-skip`):
- [ ] Launch test workflow successfully
- [ ] Skip a step with date trigger
- [ ] Skip a step with event triggers
- [ ] View skipped workflows in "Skipped Workflows" tab
- [ ] Manually reactivate a skipped workflow
- [ ] Verify button text shows correct next step

**Escalate Testing** (`/test-escalate`):
- [ ] Launch test workflow successfully
- [ ] Escalate to another user with date trigger
- [ ] Escalate with event triggers
- [ ] View escalated workflows in "Escalated Workflows" tab
- [ ] Manually resolve an escalated workflow
- [ ] Verify notifications are created for escalated user

## Architecture Summary

Both Skip and Escalate follow the unified trigger architecture from Phase 1.0:

### Data Structure
```typescript
{
  skip_triggers: [
    {
      id: "trigger-1",
      type: "date",
      config: { date: "2025-01-15T00:00:00Z", timezone: "UTC" },
      createdAt: "2025-01-01T12:00:00Z"
    },
    {
      id: "trigger-2",
      type: "event",
      config: { eventType: "customer_login" },
      createdAt: "2025-01-01T12:00:00Z"
    }
  ],
  skip_trigger_logic: "OR" // or "AND"
}
```

### Trigger Types
- **Date Triggers**: Reactivate/notify on specific date/time
- **Event Triggers**: Reactivate/notify when event occurs
  - `workflow_action_completed`
  - `customer_login`
  - `usage_threshold_crossed`
  - `manual_event`

### Trigger Logic
- **OR Logic**: Any trigger fires → reactivate/notify
- **AND Logic**: All triggers must fire → reactivate/notify

### API Endpoints

**Skip**:
- `POST /api/workflows/skip-with-triggers` - Skip with triggers
- `GET /api/workflows/skipped` - Get skipped workflows
- `POST /api/workflows/reactivate-now` - Manual reactivation
- `POST /api/cron/evaluate-skip-triggers` - Cron evaluation

**Escalate**:
- `POST /api/workflows/escalate-with-triggers` - Escalate with triggers
- `GET /api/workflows/escalated` - Get escalated workflows
- `POST /api/workflows/resolve-now` - Manual resolution
- `POST /api/cron/evaluate-escalate-triggers` - Cron evaluation

## Files Created/Modified

### Phase 1.1 (Skip)
**New Files**:
- `supabase/migrations/20260101000000_workflow_skip_triggers_phase1_1.sql`
- `src/types/skip-triggers.ts`
- `src/lib/services/SkipTriggerEvaluator.ts`
- `src/lib/services/WorkflowSkipService.ts`
- `src/app/api/workflows/skip-with-triggers/route.ts`
- `src/app/api/workflows/skipped/route.ts`
- `src/app/api/workflows/reactivate-now/route.ts`
- `src/app/api/cron/evaluate-skip-triggers/route.ts`
- `src/components/workflows/EnhancedSkipModal.tsx`
- `src/app/test-skip/page.tsx`

**Modified Files**:
- `src/lib/api/workflow-triggers.ts` (added Skip API functions)
- `src/lib/constants/database.ts` (added WORKFLOW_SKIP_TRIGGERS table constant)

### Phase 1.2 (Escalate)
**New Files**:
- `supabase/migrations/20260102000000_workflow_escalate_triggers_phase1_2.sql`
- `src/types/escalate-triggers.ts`
- `src/lib/services/EscalateTriggerEvaluator.ts`
- `src/lib/services/WorkflowEscalateService.ts`
- `src/app/api/workflows/escalate-with-triggers/route.ts`
- `src/app/api/workflows/escalated/route.ts`
- `src/app/api/workflows/resolve-now/route.ts`
- `src/app/api/cron/evaluate-escalate-triggers/route.ts`
- `src/components/workflows/EnhancedEscalateModal.tsx`
- `src/app/test-escalate/page.tsx`

**Modified Files**:
- `src/lib/api/workflow-triggers.ts` (added Escalate API functions)
- `src/lib/constants/database.ts` (added WORKFLOW_ESCALATE_TRIGGERS table constant)

### Fix Scripts
- `supabase/migrations/20251124000000_fix_workflow_wake_triggers_schema.sql` (schema alignment)
- `supabase/scripts/apply_phase1_skip_escalate_migrations.sql` (consolidated manual application)
- `docs/PHASE_1_1_1_2_STATUS.md` (this file)
