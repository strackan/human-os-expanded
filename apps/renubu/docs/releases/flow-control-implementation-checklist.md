# Flow Control Implementation Checklist

**Version:** 1.0
**Last Updated:** 2025-11-13
**For:** Releases 1.1 (Skip Enhanced) and 1.2 (Escalate Enhanced)

---

## Overview

This checklist provides step-by-step instructions for implementing Skip (1.1) and Escalate (1.2) features by cloning and adapting Phase 1.0 (Snooze) code. Follow the **pattern-based approach** to ensure architectural consistency.

**Key Principle:** Don't start from scratch. Clone Phase 1.0 files and search-replace terminology.

---

## Phase 1: Database Schema

### Skip (1.1) - Database

#### 1.1.1: Create Migration File

**Clone:** `supabase/migrations/20251125000000_workflow_triggers_phase1.sql`
**New File:** `supabase/migrations/20260101000000_workflow_skip_triggers_phase1_1.sql`

**Search-Replace:**
- `wake_triggers` → `skip_triggers`
- `wake_trigger_logic` → `skip_trigger_logic`
- `last_evaluated_at` → `skip_last_evaluated_at`
- `trigger_fired_at` → `skip_trigger_fired_at`
- `fired_trigger_type` → `skip_fired_trigger_type`
- `workflow_wake_triggers` → `workflow_skip_triggers`
- `snoozed` → `skipped` (in WHERE clauses)

**Key Additions:**
```sql
-- Add skip trigger fields
ALTER TABLE workflow_executions
ADD COLUMN skip_triggers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN skip_trigger_logic TEXT DEFAULT 'OR' CHECK (skip_trigger_logic IN ('OR', 'AND')),
ADD COLUMN skip_last_evaluated_at TIMESTAMPTZ,
ADD COLUMN skip_trigger_fired_at TIMESTAMPTZ,
ADD COLUMN skip_fired_trigger_type TEXT;

-- GIN index for JSONB
CREATE INDEX idx_workflow_executions_skip_triggers
  ON workflow_executions USING GIN (skip_triggers);

-- Create history table
CREATE TABLE workflow_skip_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('date', 'event')),
  trigger_config JSONB NOT NULL,
  is_fired BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMPTZ,
  evaluation_count INTEGER DEFAULT 0,
  fired_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create helper function
CREATE FUNCTION get_skipped_workflows_for_evaluation(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
) RETURNS TABLE (...);
```

**Test:**
```bash
npx supabase db reset --local
```

---

### Escalate (1.2) - Database

#### 1.2.1: Create Migration File

**Clone:** Same as Skip (1.1)
**New File:** `supabase/migrations/20260106000000_workflow_escalate_triggers_phase1_2.sql`

**Search-Replace:**
- `skip_triggers` → `escalate_triggers`
- `skip_trigger_logic` → `escalate_trigger_logic`
- `skip_last_evaluated_at` → `escalate_last_evaluated_at`
- `workflow_skip_triggers` → `workflow_escalate_triggers`
- `skipped` → `escalated` (in WHERE clauses)

**Key Addition:**
```sql
-- Add escalate_to_user_id field
ADD COLUMN escalate_to_user_id UUID REFERENCES profiles(id);

CREATE INDEX idx_workflow_executions_escalate_to
  ON workflow_executions(escalate_to_user_id)
  WHERE escalate_to_user_id IS NOT NULL;
```

#### 1.2.2: Create Escalation Rules Table

```sql
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  conditions JSONB NOT NULL,
  escalate_to_user_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 2: TypeScript Types

### Skip (1.1) - Types

#### 2.1.1: Create Type Definitions

**Clone:** `src/types/wake-triggers.ts`
**New File:** `src/types/skip-triggers.ts`

**Search-Replace:**
- `WakeTrigger` → `SkipTrigger`
- `wake_triggers` → `skip_triggers`
- `TriggerEvaluationResult` → Keep same (shared)

**Content:**
```typescript
export interface SkipTrigger {
  id: string;
  type: 'date' | 'event';
  config: DateTriggerConfig | EventTriggerConfig;
  createdAt: string;
}

export interface WorkflowExecutionWithSkipTriggers {
  skip_triggers: SkipTrigger[];
  skip_trigger_logic: 'OR' | 'AND';
  skip_last_evaluated_at?: string;
  skip_trigger_fired_at?: string;
  skip_fired_trigger_type?: string;
  // ... other workflow fields
}
```

---

### Escalate (1.2) - Types

#### 2.2.1: Create Type Definitions

**Clone:** `src/types/skip-triggers.ts`
**New File:** `src/types/escalate-triggers.ts`

**Search-Replace:**
- `SkipTrigger` → `EscalateTrigger`
- `skip_triggers` → `escalate_triggers`

**Key Addition:**
```typescript
export interface WorkflowExecutionWithEscalateTriggers {
  escalate_triggers: EscalateTrigger[];
  escalate_trigger_logic: 'OR' | 'AND';
  escalate_to_user_id: string;  // ← New field
  escalate_last_evaluated_at?: string;
  // ...
}
```

---

## Phase 3: Services

### Skip (1.1) - Services

#### 3.1.1: Create SkipTriggerEvaluator

**Clone:** `src/lib/services/TriggerEvaluator.ts`
**New File:** `src/lib/services/SkipTriggerEvaluator.ts`

**Search-Replace:**
- `class TriggerEvaluator` → `class SkipTriggerEvaluator`
- `WakeTrigger` → `SkipTrigger`
- `wake_triggers` → `skip_triggers`
- `shouldWake` → `shouldReactivate`
- `workflow_wake_triggers` → `workflow_skip_triggers`

**Methods (keep signatures):**
- `evaluateTrigger()`
- `evaluateDateTrigger()`
- `evaluateEventTrigger()`
- `evaluateAllTriggers()`
- `updateWorkflowWithEvaluationResults()`
- `logTriggerEvaluation()`

**No logic changes needed** - just terminology.

#### 3.1.2: Create WorkflowSkipService

**Clone:** `src/lib/services/WorkflowSnoozeService.ts`
**New File:** `src/lib/services/WorkflowSkipService.ts`

**Search-Replace:**
- `class WorkflowSnoozeService` → `class WorkflowSkipService`
- `evaluateAllSnoozedWorkflows` → `evaluateAllSkippedWorkflows`
- `get_snoozed_workflows_for_evaluation` → `get_skipped_workflows_for_evaluation`
- `TriggerEvaluator` → `SkipTriggerEvaluator`
- `surfaceWorkflow` → `reactivateWorkflow`

---

### Escalate (1.2) - Services

#### 3.2.1: Create EscalateTriggerEvaluator

**Clone:** `src/lib/services/SkipTriggerEvaluator.ts`
**New File:** `src/lib/services/EscalateTriggerEvaluator.ts`

**Search-Replace:**
- `SkipTriggerEvaluator` → `EscalateTriggerEvaluator`
- `SkipTrigger` → `EscalateTrigger`
- `skip_triggers` → `escalate_triggers`
- `shouldReactivate` → `shouldExecuteEscalation`
- `workflow_skip_triggers` → `workflow_escalate_triggers`

**Key Addition:**
```typescript
static async executeEscalation(
  workflowExecutionId: string,
  escalateToUserId: string,
  firedTrigger: EscalateTrigger,
  supabase: SupabaseClient
): Promise<void> {
  // Notify escalated user
  // Update workflow status
  // Log action
}
```

#### 3.2.2: Create WorkflowEscalateService

**Clone:** `src/lib/services/WorkflowSkipService.ts`
**New File:** `src/lib/services/WorkflowEscalateService.ts`

**Search-Replace:**
- `WorkflowSkipService` → `WorkflowEscalateService`
- `evaluateAllSkippedWorkflows` → `evaluateAllEscalatedWorkflows`
- `SkipTriggerEvaluator` → `EscalateTriggerEvaluator`

#### 3.2.3: Create EscalationRuleEngine

**New File:** `src/lib/services/EscalationRuleEngine.ts`

**From Scratch:**
```typescript
export class EscalationRuleEngine {
  static async evaluateRulesForWorkflow(
    workflowExecutionId: string,
    supabase: SupabaseClient
  ): Promise<{
    matchedRule?: EscalationRule;
    escalateToUserId?: string;
  }> {
    // Fetch workflow data
    // Fetch active rules (sorted by priority)
    // Evaluate conditions against workflow properties
    // Return first matching rule
  }

  static async applyRule(
    workflowExecutionId: string,
    rule: EscalationRule,
    supabase: SupabaseClient
  ): Promise<void> {
    // Apply escalation rule
    // Log action
  }
}
```

---

## Phase 4: API Routes

### Skip (1.1) - API

#### 4.1.1: Create skip-with-triggers endpoint

**Clone:** `src/app/api/workflows/snooze-with-triggers/route.ts`
**New File:** `src/app/api/workflows/skip-with-triggers/route.ts`

**Search-Replace:**
- `snooze` → `skip`
- `WakeTrigger` → `SkipTrigger`
- `wake_triggers` → `skip_triggers`
- `wake_trigger_logic` → `skip_trigger_logic`
- `snoozed_at` → `skipped_at`
- Status: `'snoozed'` → `'skipped'`

#### 4.1.2: Create skipped endpoint

**Clone:** `src/app/api/workflows/snoozed/route.ts`
**New File:** `src/app/api/workflows/skipped/route.ts`

**Search-Replace:**
- `snoozed` → `skipped`
- Filter: `status = 'snoozed'` → `status = 'skipped'`

#### 4.1.3: Create reactivate-now endpoint

**Clone:** `src/app/api/workflows/wake-now/route.ts`
**New File:** `src/app/api/workflows/reactivate-now/route.ts`

**Search-Replace:**
- `wake` → `reactivate`
- Status change: `'snoozed'` → `'skipped'` → `'in_progress'`

---

### Escalate (1.2) - API

#### 4.2.1: Create escalate-with-triggers endpoint

**Clone:** `src/app/api/workflows/skip-with-triggers/route.ts`
**New File:** `src/app/api/workflows/escalate-with-triggers/route.ts`

**Search-Replace:**
- `skip` → `escalate`
- `SkipTrigger` → `EscalateTrigger`
- Status: `'skipped'` → `'escalated'`

**Key Addition:**
```typescript
// Validate escalateToUserId is required
if (!escalateToUserId) {
  return NextResponse.json(
    { error: 'escalateToUserId is required' },
    { status: 400 }
  );
}

// Update workflow with escalate_to_user_id
await supabase
  .from('workflow_executions')
  .update({
    escalate_triggers: triggers,
    escalate_trigger_logic: logic,
    escalate_to_user_id: escalateToUserId,
    status: 'escalated'
  })
  .eq('id', workflowId);
```

#### 4.2.2: Create escalated endpoint

**Clone:** `src/app/api/workflows/skipped/route.ts`
**New File:** `src/app/api/workflows/escalated/route.ts`

**Search-Replace:**
- `skipped` → `escalated`
- Add filter for `escalatedToMe` query param

#### 4.2.3: Create de-escalate-now endpoint

**Clone:** `src/app/api/workflows/reactivate-now/route.ts`
**New File:** `src/app/api/workflows/de-escalate-now/route.ts`

**Search-Replace:**
- `reactivate` → `de-escalate`
- Return workflow to original assignee

---

## Phase 5: UI Components

### Skip (1.1) - UI

#### 5.1.1: Create EnhancedSkipModal

**Clone:** `src/components/workflows/EnhancedSnoozeModal.tsx`
**New File:** `src/components/workflows/EnhancedSkipModal.tsx`

**Search-Replace:**
- `Snooze` → `Skip`
- `snooze` → `skip`
- `WakeTrigger` → `SkipTrigger`
- Button label: "Snooze Workflow" → "Skip Workflow"
- Preview text: "Will wake" → "Will reactivate"

**No logic changes** - just terminology.

#### 5.1.2: Create SkippedWorkflowCard

**Clone:** `src/components/workflows/SnoozedWorkflowCard.tsx`
**New File:** `src/components/workflows/SkippedWorkflowCard.tsx`

**Search-Replace:**
- `Snoozed` → `Skipped`
- `snoozed` → `skipped`
- Action button: "Wake Now" → "Reactivate Now"

#### 5.1.3: Reuse TriggerBuilder (Optional Wrapper)

**Option A:** Reuse `TriggerBuilder` directly (recommended)
**Option B:** Create thin wrapper with Skip-specific labels

---

### Escalate (1.2) - UI

#### 5.2.1: Create EnhancedEscalateModal

**Clone:** `src/components/workflows/EnhancedSkipModal.tsx`
**New File:** `src/components/workflows/EnhancedEscalateModal.tsx`

**Search-Replace:**
- `Skip` → `Escalate`
- `skip` → `escalate`
- `SkipTrigger` → `EscalateTrigger`

**Key Addition:**
```tsx
<UserSelector
  label="Escalate to"
  placeholder="Select user or team"
  value={escalateToUserId}
  onChange={setEscalateToUserId}
  required
/>
```

**New Mode:**
```tsx
<Radio value="immediate">Immediate</Radio>
```
For instant escalation (no triggers).

#### 5.2.2: Create EscalatedWorkflowCard

**Clone:** `src/components/workflows/SkippedWorkflowCard.tsx`
**New File:** `src/components/workflows/EscalatedWorkflowCard.tsx`

**Search-Replace:**
- `Skipped` → `Escalated`
- `skipped` → `escalated`

**Key Addition:**
```tsx
<EscalationRecipientBadge user={escalateToUser} />
<Button onClick={deEscalate}>De-escalate</Button>
<Button onClick={takeOwnership}>Take Ownership</Button>
```

#### 5.2.3: Create EscalationRulesManager

**New File:** `src/components/admin/EscalationRulesManager.tsx`

**From Scratch:**
```tsx
export function EscalationRulesManager() {
  const [rules, setRules] = useState<EscalationRule[]>([]);

  return (
    <div>
      <RulesList rules={rules} />
      <CreateRuleModal />
    </div>
  );
}
```

---

## Phase 6: Cron Jobs

### Skip (1.1) - Cron

#### 6.1.1: Create daily-skip-evaluation function

**Clone:** `supabase/functions/daily-trigger-evaluation/`
**New Folder:** `supabase/functions/daily-skip-evaluation/`

**Files to Clone:**
- `index.ts`
- `deno.json`

**Search-Replace in index.ts:**
- `WorkflowSnoozeService` → `WorkflowSkipService`
- `evaluateAllSnoozedWorkflows` → `evaluateAllSkippedWorkflows`
- Function name: `daily-trigger-evaluation` → `daily-skip-evaluation`

**Deploy:**
```bash
npx supabase functions deploy daily-skip-evaluation
```

**Schedule (via pg_cron):**
```sql
SELECT cron.schedule(
  'daily-skip-evaluation',
  '5 8 * * *',  -- 8:05 AM UTC (5 min after snooze)
  $$SELECT net.http_post(
    url:='https://[project].supabase.co/functions/v1/daily-skip-evaluation',
    headers:='{"Authorization": "Bearer [key]"}'::jsonb
  )$$
);
```

---

### Escalate (1.2) - Cron

#### 6.2.1: Create daily-escalate-evaluation function

**Clone:** `supabase/functions/daily-skip-evaluation/`
**New Folder:** `supabase/functions/daily-escalate-evaluation/`

**Search-Replace:**
- `WorkflowSkipService` → `WorkflowEscalateService`
- `evaluateAllSkippedWorkflows` → `evaluateAllEscalatedWorkflows`
- Function name: `daily-skip-evaluation` → `daily-escalate-evaluation`

**Deploy:**
```bash
npx supabase functions deploy daily-escalate-evaluation
```

**Schedule:**
```sql
SELECT cron.schedule(
  'daily-escalate-evaluation',
  '10 8 * * *',  -- 8:10 AM UTC (5 min after skip)
  $$SELECT net.http_post(...)$$
);
```

---

## Phase 7: Testing

### Skip (1.1) - Tests

#### 7.1.1: Unit Tests

**Clone:** Tests from `TriggerEvaluator.test.ts`
**New File:** `SkipTriggerEvaluator.test.ts`

**Test Cases:**
- Skip with date trigger
- Skip with event trigger
- Skip with AND logic
- Skip with OR logic
- Edge cases (invalid triggers, missing data)

#### 7.1.2: Integration Tests

```typescript
describe('POST /api/workflows/skip-with-triggers', () => {
  it('should skip workflow with date trigger', async () => {
    // Test implementation
  });

  it('should skip workflow with event trigger', async () => {
    // Test implementation
  });
});
```

#### 7.1.3: E2E Tests

**Use Playwright:**
- Open EnhancedSkipModal
- Select date trigger
- Fill date picker
- Click "Skip Workflow"
- Verify workflow status = 'skipped'

---

### Escalate (1.2) - Tests

**Same pattern as Skip, adapted for escalation.**

---

## Phase 8: Documentation

### 8.1: Update API Docs

**File:** `docs/API.md`

**Add Sections:**
- POST /api/workflows/skip-with-triggers
- GET /api/workflows/skipped
- POST /api/workflows/reactivate-now
- POST /api/workflows/escalate-with-triggers
- GET /api/workflows/escalated
- POST /api/workflows/de-escalate-now

### 8.2: Update Workflow Docs

**File:** `docs/WORKFLOWS.md`

**Add Sections:**
- Skip Trigger Architecture
- Escalate Trigger Architecture
- Event Type Reference (link to trigger-event-types.md)

### 8.3: Create Tutorials

**New Files:**
- `docs/tutorials/skip-advanced-triggers.md`
- `docs/tutorials/escalate-advanced-triggers.md`

---

## Naming Conventions Checklist

Use this checklist to ensure consistent naming:

### Database
- [ ] Tables: `snake_case` (e.g., `workflow_skip_triggers`)
- [ ] Columns: `snake_case` (e.g., `skip_trigger_logic`)
- [ ] Functions: `snake_case` (e.g., `get_skipped_workflows_for_evaluation`)

### Services
- [ ] Classes: `PascalCase` (e.g., `SkipTriggerEvaluator`)
- [ ] Methods: `camelCase` (e.g., `evaluateAllTriggers`)
- [ ] Files: `PascalCase.ts` (e.g., `SkipTriggerEvaluator.ts`)

### API Routes
- [ ] Paths: `kebab-case` (e.g., `/skip-with-triggers`)
- [ ] Actions: Verb-first (e.g., `/reactivate-now`, `/de-escalate-now`)

### Types
- [ ] Interfaces: `PascalCase` (e.g., `SkipTrigger`)
- [ ] Type guards: `camelCase` with `is` prefix (e.g., `isSkipTrigger`)

### Components
- [ ] Components: `PascalCase` (e.g., `EnhancedSkipModal`)
- [ ] Files: `PascalCase.tsx` (e.g., `EnhancedSkipModal.tsx`)

---

## Common Pitfalls

### ❌ Don't: Start from scratch
**✅ Do:** Clone Phase 1.0 files and search-replace

### ❌ Don't: Change evaluation logic
**✅ Do:** Keep logic identical, only change terminology

### ❌ Don't: Skip migration backfills
**✅ Do:** Convert existing basic skip/escalate records to trigger format

### ❌ Don't: Forget to update indexes
**✅ Do:** Add GIN indexes on JSONB trigger fields

### ❌ Don't: Mix old and new architecture
**✅ Do:** Fully migrate to JSONB trigger arrays

---

## Progress Tracking

Use this checklist to track implementation progress:

### Release 1.1 - Skip Enhanced
- [ ] Database schema migration
- [ ] TypeScript types
- [ ] SkipTriggerEvaluator service
- [ ] WorkflowSkipService
- [ ] API: skip-with-triggers
- [ ] API: skipped
- [ ] API: reactivate-now
- [ ] UI: EnhancedSkipModal
- [ ] UI: SkippedWorkflowCard
- [ ] Cron: daily-skip-evaluation
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Documentation

### Release 1.2 - Escalate Enhanced
- [ ] Database schema migration
- [ ] Escalation rules table
- [ ] TypeScript types
- [ ] EscalateTriggerEvaluator service
- [ ] WorkflowEscalateService
- [ ] EscalationRuleEngine service
- [ ] API: escalate-with-triggers
- [ ] API: escalated
- [ ] API: de-escalate-now
- [ ] UI: EnhancedEscalateModal
- [ ] UI: EscalatedWorkflowCard
- [ ] UI: EscalationRulesManager
- [ ] Cron: daily-escalate-evaluation
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Documentation

---

## Quick Reference: File Cloning Matrix

| Phase 1.0 (Snooze) | Phase 1.1 (Skip) | Phase 1.2 (Escalate) |
|--------------------|------------------|---------------------|
| `TriggerEvaluator.ts` | `SkipTriggerEvaluator.ts` | `EscalateTriggerEvaluator.ts` |
| `WorkflowSnoozeService.ts` | `WorkflowSkipService.ts` | `WorkflowEscalateService.ts` |
| `wake-triggers.ts` | `skip-triggers.ts` | `escalate-triggers.ts` |
| `snooze-with-triggers/route.ts` | `skip-with-triggers/route.ts` | `escalate-with-triggers/route.ts` |
| `snoozed/route.ts` | `skipped/route.ts` | `escalated/route.ts` |
| `wake-now/route.ts` | `reactivate-now/route.ts` | `de-escalate-now/route.ts` |
| `EnhancedSnoozeModal.tsx` | `EnhancedSkipModal.tsx` | `EnhancedEscalateModal.tsx` |
| `SnoozedWorkflowCard.tsx` | `SkippedWorkflowCard.tsx` | `EscalatedWorkflowCard.tsx` |
| `daily-trigger-evaluation/` | `daily-skip-evaluation/` | `daily-escalate-evaluation/` |

---

## Related Documentation

- [Release 1.0 - Workflow Snoozing](./1.0-workflow-snoozing.md)
- [Release 1.1 - Skip Enhanced](./1.1-skip-enhanced.md)
- [Release 1.2 - Escalate Enhanced](./1.2-escalate-enhanced.md)
- [Trigger Event Types Reference](../technical/trigger-event-types.md)

---

**Document Status:** Active (use for implementation)
**Maintained By:** Engineering Team
**Next Review:** After Phase 1.1 ships
