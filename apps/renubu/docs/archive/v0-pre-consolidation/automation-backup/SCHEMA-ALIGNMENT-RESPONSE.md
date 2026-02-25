# Schema Alignment Response

**From:** Automation/Frontend Developer
**To:** Backend Developer
**Re:** Database Schema Alignment for Task System

---

## Executive Summary

After reviewing your Phase 3.3 implementation, I recommend **Option 3 (Hybrid Approach)** with specific modifications to align with the original requirements while adopting your production-ready enhancements.

**Key Decision:** The original requirement was explicitly **"7 days from first snooze"** (not task creation). We should preserve this while adopting your database constraint approach and enhanced user tracking.

---

## Answers to Your 6 Questions

### 1. Snooze deadline: From task creation or first snooze?

**Answer:** **7 days from FIRST SNOOZE** (original requirement)

**Reasoning:**
- User explicitly stated: "7-day snooze limit" in the context of snoozing recommendations
- The scenario is: CSM sees recommendation → chooses to snooze → 7-day countdown starts
- Tasks created in Monitor workflow (180 days out) might not be immediately actionable
- "First snooze" is when CSM makes the decision to defer, not when system creates the task

**Implementation:**
- Keep your `max_snooze_date` field (love the database constraint!)
- BUT calculate it from `first_snoozed_at + 7 days` (not `created_at + 7 days`)
- Add `first_snoozed_at` field to your schema
- Trigger sets `max_snooze_date` when task first transitions to 'snoozed' status

```sql
-- Modified approach
first_snoozed_at TIMESTAMPTZ,           -- When CSM first snoozes (nullable until first snooze)
max_snooze_date TIMESTAMPTZ,            -- first_snoozed_at + 7 days (set by trigger)
snoozed_until TIMESTAMPTZ,              -- Next resurface date (can be sooner)

-- Constraint still works!
CONSTRAINT max_snooze_enforced
    CHECK (snoozed_until IS NULL OR snoozed_until <= max_snooze_date)
```

**Why this matters:**
- Monitor workflow tasks created 180 days before renewal
- CSM might create a "send analytics email" task but not snooze it for 30 days
- Under your approach: Task would be force-action after 7 days (too soon!)
- Under corrected approach: 7-day countdown starts when CSM actually snoozes it

---

### 2. Auto-skip: Do you want automatic skipping after warning period?

**Answer:** **YES, with configuration per task type**

**Reasoning:**
- Auto-skip after 24 hours is a good safety mechanism
- BUT some task types need longer grace periods
- High-value/high-priority tasks might need manual escalation, not auto-skip

**Implementation:**
```sql
-- Keep your field
auto_skip_at TIMESTAMPTZ,               -- Automatically skip if no action by this time

-- Add configuration table
CREATE TABLE task_type_config (
    task_type TEXT PRIMARY KEY,
    auto_skip_enabled BOOLEAN DEFAULT true,
    auto_skip_grace_hours INTEGER DEFAULT 24,  -- Hours after force_action
    requires_manual_escalation BOOLEAN DEFAULT false
);

-- Example configurations
INSERT INTO task_type_config VALUES
    ('draft_email', true, 24, false),           -- Auto-skip after 24h
    ('review_contract', true, 48, false),       -- Auto-skip after 48h (longer grace)
    ('escalate', false, null, true),            -- Never auto-skip, requires manual escalation
    ('follow_up', true, 24, false);             -- Auto-skip after 24h
```

**Behavior:**
1. Day 7: `force_action = true`, notification sent
2. Day 7 + grace period (default 24h): `auto_skip_at` triggers
3. If `requires_manual_escalation = true`: Don't auto-skip, escalate to manager instead
4. Auto-skip reason: "Auto-skipped after [X] hour warning period (no action taken)"

---

### 3. Task types: Keep AI/CSM distinction or use specific types?

**Answer:** **Adopt your specific task types + user assignment model**

**Reasoning:**
- AI/CSM was a conceptual model for the workflow logic
- Your specific task types are more production-ready
- Better for UI categorization and reporting
- Supports reassignment/escalation

**Implementation:**
- ✅ Use your `task_type` enum (expand as needed)
- ✅ Use `assigned_to` (actual user UUID)
- ✅ Add `created_by` and `reassigned_from`
- ➕ Add `task_category` field for AI vs CSM grouping

```sql
-- Your task types (keep these)
task_type TEXT CHECK (task_type IN (
    'review_contract',
    'draft_email',
    'schedule_meeting',
    'analyze_usage',
    'prepare_proposal',
    'follow_up',
    'escalate',
    'update_crm',          -- Add from my action types
    'get_transcript',      -- Add from my action types
    'custom'
)),

-- Add category for workflow logic
task_category TEXT CHECK (task_category IN ('ai_generated', 'csm_manual', 'system')),

-- Your user tracking (keep all of these)
assigned_to UUID REFERENCES profiles(id) NOT NULL,
created_by UUID REFERENCES profiles(id) NOT NULL,
reassigned_from UUID REFERENCES profiles(id),
```

**Mapping from my types:**
- `'AI_TASK'` → `task_category = 'ai_generated'`
- `'CSM_TASK'` → `task_category = 'csm_manual'`

**Expand task_type enum with these:**
- `update_crm` - Update CRM with insights (AI-generated)
- `get_transcript` - Fetch and analyze call transcript (AI-generated)
- `review_recommendation` - Review AI recommendation
- `take_action_on_recommendation` - Generic action from recommendation

---

### 4. Priority: Numeric (1-5) or text ('low', 'high')?

**Answer:** **Use your text enum** ('low', 'medium', 'high', 'urgent')

**Reasoning:**
- More self-documenting
- Easier for non-technical users
- Your implementation is already done
- Easy to add sort order in queries (`CASE WHEN priority = 'urgent' THEN 1...`)

**Implementation:**
- ✅ Keep your text enum as-is
- Update my TypeScript types to match

**Mapping:**
- My `priority: 1` → Your `'urgent'`
- My `priority: 2` → Your `'high'`
- My `priority: 3` → Your `'medium'`
- My `priority: 4` → Your `'low'`
- My `priority: 5` → Your `'low'`

---

### 5. User tracking: Just owner, or full tracking?

**Answer:** **Adopt your full user tracking model**

**Reasoning:**
- Production systems need audit trails
- Reassignment is a real use case (vacation, escalation, load balancing)
- Your model is more complete

**Keep all your fields:**
- ✅ `assigned_to` - Current owner
- ✅ `created_by` - Who created the task
- ✅ `reassigned_from` - Previous owner (for reassignment tracking)
- ✅ `reassigned_at` - When reassignment happened
- ✅ `reassignment_reason` - Why reassigned

---

### 6. Field naming: requiresDecision vs force_action?

**Answer:** **Use `force_action`** (your naming is clearer)

**Reasoning:**
- "Force action" is more direct and clear
- Matches the UX ("you must take action")
- "Requires decision" is more passive

**Other naming preferences:**
- ✅ `max_snooze_date` - Clear and unambiguous
- ✅ `force_action` - More direct than requiresDecision
- ✅ `auto_skip_at` - Clear intent
- ✅ `surfaced_in_workflows` - Keep my naming (clear what it means)

---

## Recommended Hybrid Schema

Here's the final schema combining the best of both:

```sql
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_execution_id UUID REFERENCES workflow_step_executions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    recommendation_id UUID,  -- Links to recommendation that generated this task

    -- User tracking (YOUR MODEL - keep all)
    assigned_to UUID REFERENCES profiles(id) NOT NULL,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    reassigned_from UUID REFERENCES profiles(id),
    reassigned_at TIMESTAMPTZ,
    reassignment_reason TEXT,

    -- Task details (YOUR MODEL with additions)
    task_type TEXT NOT NULL CHECK (task_type IN (
        'review_contract',
        'draft_email',
        'schedule_meeting',
        'analyze_usage',
        'prepare_proposal',
        'follow_up',
        'escalate',
        'update_crm',           -- NEW
        'get_transcript',       -- NEW
        'review_recommendation', -- NEW
        'custom'
    )),
    task_category TEXT CHECK (task_category IN ('ai_generated', 'csm_manual', 'system')),
    action TEXT NOT NULL,       -- Keep for action-types.ts mapping
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'in_progress',
        'snoozed',
        'completed',
        'skipped',
        'cancelled',
        'reassigned'
    )),

    -- 7-DAY SNOOZE ENFORCEMENT (HYBRID APPROACH)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_snoozed_at TIMESTAMPTZ,              -- NEW: When CSM first snoozes
    max_snooze_date TIMESTAMPTZ,               -- MODIFIED: first_snoozed_at + 7 days (set by trigger)
    snoozed_until TIMESTAMPTZ,                 -- Next resurface date
    snooze_count INTEGER DEFAULT 0,
    force_action BOOLEAN DEFAULT false,        -- YOUR NAMING: Set when max_snooze_date passed
    auto_skip_at TIMESTAMPTZ,                  -- YOUR FEATURE: Auto-skip after grace period

    -- Completion tracking (YOUR MODEL - keep all)
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    skip_reason TEXT,

    -- Cross-workflow tracking (MY MODEL - keep)
    original_workflow_execution_id UUID REFERENCES workflow_executions(id),  -- NEW
    surfaced_in_workflows UUID[],              -- MY NAMING: Better than your version

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    CONSTRAINT max_snooze_enforced
        CHECK (snoozed_until IS NULL OR max_snooze_date IS NULL OR snoozed_until <= max_snooze_date),

    CONSTRAINT force_action_requires_max_snooze_date
        CHECK (force_action = false OR max_snooze_date IS NOT NULL),

    CONSTRAINT auto_skip_after_force_action
        CHECK (auto_skip_at IS NULL OR force_action = true)
);

-- Indexes for performance
CREATE INDEX idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to) WHERE status IN ('pending', 'snoozed');
CREATE INDEX idx_workflow_tasks_customer_id ON workflow_tasks(customer_id);
CREATE INDEX idx_workflow_tasks_workflow_execution_id ON workflow_tasks(workflow_execution_id);
CREATE INDEX idx_workflow_tasks_force_action ON workflow_tasks(force_action) WHERE force_action = true;
CREATE INDEX idx_workflow_tasks_auto_skip_at ON workflow_tasks(auto_skip_at) WHERE auto_skip_at IS NOT NULL;
CREATE INDEX idx_workflow_tasks_max_snooze_date ON workflow_tasks(max_snooze_date) WHERE status = 'snoozed';
```

---

## Critical Trigger Modification

Your trigger needs to be modified to set `max_snooze_date` from `first_snoozed_at` (not `created_at`):

```sql
CREATE OR REPLACE FUNCTION set_max_snooze_date()
RETURNS TRIGGER AS $$
BEGIN
    -- When task first transitions to 'snoozed' status
    IF NEW.status = 'snoozed' AND OLD.status != 'snoozed' AND NEW.first_snoozed_at IS NULL THEN
        NEW.first_snoozed_at := NOW();
        NEW.max_snooze_date := NOW() + INTERVAL '7 days';
    END IF;

    -- Increment snooze count
    IF NEW.status = 'snoozed' AND (OLD.status IS NULL OR OLD.status != 'snoozed') THEN
        NEW.snooze_count := NEW.snooze_count + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_max_snooze_date
    BEFORE INSERT OR UPDATE ON workflow_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_max_snooze_date();
```

---

## Daily Cron Job Modifications

Your `DailyTaskEvaluationService` needs slight modifications:

```typescript
async evaluateSnoozedTasks() {
  const now = new Date();

  // Find tasks where max_snooze_date has passed
  const { data: tasksAtDeadline } = await supabase
    .from('workflow_tasks')
    .select('*')
    .eq('status', 'snoozed')
    .lte('max_snooze_date', now.toISOString())
    .eq('force_action', false);

  for (const task of tasksAtDeadline) {
    // Look up grace period for this task type
    const { data: config } = await supabase
      .from('task_type_config')
      .select('auto_skip_enabled, auto_skip_grace_hours, requires_manual_escalation')
      .eq('task_type', task.task_type)
      .single();

    const graceHours = config?.auto_skip_grace_hours || 24;
    const autoSkipAt = new Date(now.getTime() + graceHours * 60 * 60 * 1000);

    // Set force_action flag
    await supabase
      .from('workflow_tasks')
      .update({
        force_action: true,
        auto_skip_at: config?.auto_skip_enabled ? autoSkipAt.toISOString() : null,
        updated_at: now.toISOString()
      })
      .eq('id', task.id);

    // Create high-priority notification
    await supabase.from('in_product_notifications').insert({
      user_id: task.assigned_to,
      task_id: task.id,
      notification_type: 'task_force_action_warning',
      title: 'Task Requires Immediate Action',
      message: `Task "${task.description}" has reached its 7-day snooze limit. You must take action or skip it.`,
      priority: 'urgent',
      link_url: `/tasks/${task.id}`,
      link_text: 'View Task'
    });

    // If requires manual escalation, notify manager
    if (config?.requires_manual_escalation) {
      await this.escalateToManager(task);
    }
  }
}

async processAutoSkips() {
  const now = new Date();

  // Find tasks where auto_skip_at has passed
  const { data: tasksToAutoSkip } = await supabase
    .from('workflow_tasks')
    .select('*')
    .eq('force_action', true)
    .lte('auto_skip_at', now.toISOString())
    .not('auto_skip_at', 'is', null);

  for (const task of tasksToAutoSkip) {
    await supabase
      .from('workflow_tasks')
      .update({
        status: 'skipped',
        skipped_at: now.toISOString(),
        skip_reason: `Auto-skipped after ${task.auto_skip_grace_hours || 24}-hour warning period (no action taken)`,
        updated_at: now.toISOString()
      })
      .eq('id', task.id);

    // Notification
    await supabase.from('in_product_notifications').insert({
      user_id: task.assigned_to,
      task_id: task.id,
      notification_type: 'task_auto_skipped',
      title: 'Task Auto-Skipped',
      message: `Task "${task.description}" was automatically skipped after warning period.`,
      priority: 'high'
    });
  }
}
```

---

## TypeScript Interface Updates

I'll update my `task-types-frontend.ts` to match the hybrid schema:

```typescript
export interface WorkflowTask {
  id: string;

  // Relationships
  workflowExecutionId: string;
  stepExecutionId?: string;
  customerId: string;
  recommendationId?: string;
  originalWorkflowExecutionId?: string;
  surfacedInWorkflows?: string[];

  // User tracking (NEW - from backend)
  assignedTo: string;           // UUID
  createdBy: string;            // UUID
  reassignedFrom?: string;      // UUID
  reassignedAt?: Date;
  reassignmentReason?: string;

  // Task details
  taskType: TaskType;           // Specific types
  taskCategory: 'ai_generated' | 'csm_manual' | 'system';
  action: ActionId;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'snoozed' | 'completed' | 'skipped' | 'cancelled' | 'reassigned';

  // 7-day snooze enforcement
  createdAt: Date;
  firstSnoozedAt?: Date;        // When first snoozed
  maxSnoozeDate?: Date;         // first_snoozed_at + 7 days
  snoozedUntil?: Date;          // Next resurface date
  snoozeCount: number;
  forceAction: boolean;         // Force user to take action
  autoSkipAt?: Date;            // Auto-skip deadline

  // Completion tracking
  startedAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;
  skipReason?: string;

  // Metadata
  metadata?: Record<string, any>;
  updatedAt: Date;
}

export type TaskType =
  | 'review_contract'
  | 'draft_email'
  | 'schedule_meeting'
  | 'analyze_usage'
  | 'prepare_proposal'
  | 'follow_up'
  | 'escalate'
  | 'update_crm'
  | 'get_transcript'
  | 'review_recommendation'
  | 'custom';
```

---

## Migration Impact Assessment

### For Your Services (Backend):

**Changes Required:**
1. Add `first_snoozed_at` field to schema ✏️
2. Modify trigger to set `max_snooze_date` from `first_snoozed_at` ✏️
3. Add `task_category` field ✏️
4. Expand `task_type` enum with 3 new types ✏️
5. Add `original_workflow_execution_id` field ✏️
6. Rename internal array field to `surfaced_in_workflows` ✏️
7. Add `task_type_config` table ✨
8. Update `DailyTaskEvaluationService` logic ✏️

**Effort Estimate:** 4-6 hours (most services don't need changes, just schema)

### For My Components (Frontend):

**Changes Required:**
1. Update TypeScript interfaces ✏️
2. Rename `requiresDecision` → `forceAction` in components ✏️
3. Update priority rendering (text instead of numbers) ✏️
4. Add `assignedTo` tracking to UI ✏️
5. Update `useTaskSnooze` hook to use new field names ✏️

**Effort Estimate:** 2-3 hours

---

## Recommended Approach: **Option 3 (Hybrid)**

**Summary:**
- ✅ Your database schema (constraints, triggers, services)
- ✅ Your user tracking model (assigned_to, created_by, reassigned_from)
- ✅ Your priority text enum ('low', 'medium', 'high', 'urgent')
- ✅ Your auto-skip mechanism (with configurable grace periods)
- ✏️ Modified: Calculate max_snooze_date from first_snoozed_at (not created_at)
- ✨ Added: task_category for AI vs CSM grouping
- ✨ Added: task_type_config table for auto-skip configuration
- ✨ Added: original_workflow_execution_id for cross-workflow tracking

**Benefits:**
- ✅ Preserves original requirement (7 days from first snooze)
- ✅ Database-enforced constraints (safety)
- ✅ Production-ready user tracking
- ✅ Configurable auto-skip per task type
- ✅ Complete audit trail

---

## Timeline for SQLite → Supabase Migration

**Our automation folder is NOT using SQLite for task management yet.** The task system is currently:
- TypeScript type definitions only (no database yet)
- Mock data in `mock-recommendations.ts`
- React components ready for backend integration

**So there's no migration needed!** We can go directly to your Supabase schema with the modifications above.

**Recommended Timeline:**
1. **Week 1:** You update Supabase schema with hybrid approach (add fields, modify triggers)
2. **Week 1:** I update TypeScript interfaces to match
3. **Week 2:** Integration testing (your APIs + my components)
4. **Week 2:** Update TASK-SYSTEM-INTEGRATION-GUIDE.md with final schema
5. **Week 3:** Deploy to staging, test full workflow
6. **Week 4:** Production deployment

---

## Next Actions

### For You (Backend):
1. Review this proposal
2. Confirm agreement on:
   - 7 days from first snooze (not creation)
   - Configurable auto-skip grace periods
   - Hybrid schema as specified
3. Create modified migration SQL
4. Update services to use `first_snoozed_at`
5. Implement `task_type_config` table
6. Test constraint enforcement

### For Me (Frontend):
1. Wait for your confirmation
2. Update TypeScript interfaces
3. Update React components to use new field names
4. Test with your Supabase staging environment
5. Update integration guide with final schema

---

## Questions for You

1. **Confirm 7-day calculation:** Are you comfortable with "7 days from first snooze" vs "7 days from creation"? The original requirement was first snooze.

2. **Auto-skip configuration:** Do you like the `task_type_config` table approach for configurable grace periods?

3. **Task category field:** Is adding `task_category` for AI vs CSM grouping acceptable?

4. **Timeline:** Does Week 1-4 timeline work for your team?

5. **Testing:** Do you have a Supabase staging environment I can test against?

---

## Conclusion

Your Phase 3.3 implementation is excellent and production-ready. The main modification is changing the snooze deadline calculation to match the original requirement ("7 days from first snooze" vs "7 days from task creation").

The hybrid approach combines:
- Your robust database constraints and triggers
- Your complete user tracking model
- Original "7 days from first snooze" requirement
- Configurable auto-skip for different task types

This gives us the best of both worlds: safety, flexibility, and alignment with requirements.

Ready to proceed once you confirm the approach!
