# Checkpoint 3: Task & Snooze System

## ✅ Completed So Far

### 1. Mock Recommendations System

**File:** `mock-recommendations.ts` (350 lines)

Provides hardcoded recommendations for UI development before LLM integration.

**Features:**
- Mock recommendations for 5 workflow stages (Monitor, Prepare, Engage, Negotiate)
- Real-world scenarios with data points and rationale
- Helper functions: `getMockRecommendations()`, `getMockRecommendation()`
- Covers all recommendation categories (Feature Adoption, Executive Engagement, Pricing Strategy, Procedural)

**Example:**
```typescript
const monitorRecs = getMockRecommendations('monitor');
// Returns 3 recommendations:
// 1. Highlight Advanced Analytics Module (feature adoption)
// 2. Congratulate CEO on Promotion (personal touchpoint)
// 3. Document 40% Usage Increase (pricing strategy)
```

---

### 2. Frontend Task Types

**File:** `task-types-frontend.ts` (450 lines)

TypeScript interfaces matching backend `workflow_tasks` schema.

**Core Types:**
```typescript
interface WorkflowTask {
  id: string;
  workflowExecutionId: string;
  stepExecutionId: string;
  customerId: string;

  taskType: 'AI_TASK' | 'CSM_TASK';
  owner: 'AI' | 'CSM';
  action: ActionId;
  status: TaskStatus;

  // NEW: 7-day snooze limit tracking
  firstSnoozedAt?: Date;
  snoozeDeadline?: Date;
  requiresDecision: boolean;

  priority: 1 | 2 | 3 | 4 | 5;
  metadata: Record<string, any>;
  // ... timestamps
}
```

**Helper Functions:**
- `calculateSnoozeEligibility()` - Check if task can be snoozed, days remaining
- `calculateSnoozeDeadline()` - 7 days from first snooze
- `calculateNextSnoozeDate()` - Always 1 week from now
- `groupTasksByWorkflow()` - Organize tasks for display
- `groupTasksByPriority()` - Sort by urgency
- `getTaskStatistics()` - Counts for dashboard
- `sortTasksByPriority()` - Sort with requiresDecision first

---

## 🔄 Coordination with Backend Engineer

### Confirmed Alignment

✅ **Q1: Separate tasks table** - Backend building `workflow_tasks`
✅ **Q2: Tasks outlive workflows** - `original_workflow_execution_id` + `surfaced_in_workflow_ids[]`
✅ **Q3: LLM integration deferred** - Using mocks for now
✅ **Q4: Hybrid snooze evaluation** - Daily cron + on-demand API calls
✅ **Q5: Completion states** - Added `completed_with_pending_tasks` status

### New Requirements Integrated

**7-Day Snooze Limit:**
```sql
-- Backend schema additions:
ALTER TABLE workflow_tasks
ADD COLUMN first_snoozed_at TIMESTAMPTZ,
ADD COLUMN snooze_deadline TIMESTAMPTZ,  -- first_snoozed_at + 7 days
ADD COLUMN requires_decision BOOLEAN DEFAULT false;
```

**Forced Decision Flow:**
1. Task snoozed → `first_snoozed_at = NOW()`, `snooze_deadline = NOW() + 7 days`
2. Daily cron checks: `snooze_deadline <= NOW()` → Set `requires_decision = true`
3. Frontend shows `ForcedDecisionModal` (cannot dismiss without choosing)
4. If user dismisses → API call: `{ action: 'dismiss_without_choice' }` → Auto-skip

**In-Product Notifications:**
```sql
-- Backend schema:
CREATE TABLE notifications (
  id UUID,
  user_id UUID,
  type TEXT, -- 'task_resurfaced' | 'task_requires_decision'
  priority TEXT, -- 'high' | 'normal' | 'low'
  title TEXT,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
);
```

---

## 📋 Remaining Work (In Progress)

### Frontend Components to Build

#### 1. RecommendationCard.tsx (~150 lines)
```tsx
<RecommendationCard
  recommendation={rec}
  onAction={(action: ActionId) => handleAction(action)}
  onSnooze={() => snoozeTask(rec.id)}
  onSkip={() => skipTask(rec.id)}
/>
```

**Features:**
- Display recommendation with category icon
- Show description, rationale, data points
- Dynamic action buttons from `suggestedActions`
- Snooze button (disabled if deadline reached)
- Skip button

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ 💡 FEATURE_ADOPTION - Highlight Advanced Analytics │
├─────────────────────────────────────────────────────┤
│ Customer paying for Advanced Analytics but only     │
│ using basic reports. Opportunity to demonstrate     │
│ value and increase engagement.                      │
│                                                     │
│ WHY THIS MATTERS:                                   │
│ Usage shows 12 hrs/month on manual reporting.      │
│ Advanced Analytics could automate 80% of work.     │
│                                                     │
│ SUPPORTING DATA:                                    │
│ • Manual Reporting Time: 12 hrs/month              │
│   (Time spent on manual report creation)           │
│ • Advanced Analytics Adoption: 5%                  │
│   (Only basic features being used)                 │
│ • Potential Time Savings: 10 hrs/month             │
│   (Based on similar customer usage)                │
│                                                     │
│ [📧 Send Email] [📅 Schedule Meeting]              │
│ [⏭️ Skip] [💤 Snooze 1 Week]                        │
└─────────────────────────────────────────────────────┘
```

#### 2. TaskList.tsx (~100 lines)
```tsx
<TaskList
  tasks={pendingTasks}
  groupBy="workflow" // or "priority"
  onTaskClick={(task) => viewTask(task)}
  onComplete={(taskId) => completeTask(taskId)}
/>
```

**Features:**
- Group tasks by workflow or priority
- Show task status badges (pending, snoozed, requires decision)
- Quick actions (complete, snooze, skip)
- Highlight tasks requiring decision (red border)

#### 3. ForcedDecisionModal.tsx (~80 lines)
```tsx
<ForcedDecisionModal
  task={task}
  open={task.requiresDecision}
  onAction={() => actionTask(task.id)}
  onSkip={() => skipTask(task.id)}
  onDismiss={() => autoSkip(task.id)} // Auto-skip
/>
```

**Features:**
- Cannot close without choosing (modal backdrop disabled)
- Two options: Take Action OR Skip Forever
- Warning message: "This task has been snoozed for 7 days"
- If user clicks outside modal → Trigger auto-skip

#### 4. OpenTasksStep.tsx (~200 lines)
```tsx
// Step 0 shown before workflow Step 1
<OpenTasksStep
  customerId={customer.id}
  onTasksCleared={() => proceedToWorkflowStep1()}
>
  {pendingTasks.map(task => (
    <TaskCard
      key={task.id}
      task={task}
      showOrigin={true} // "From Monitor Workflow"
      onComplete={() => completeTask(task.id)}
      onSnooze={() => snoozeTask(task.id)}
      onSkip={() => skipTask(task.id)}
    />
  ))}
</OpenTasksStep>
```

**Features:**
- Fetches pending tasks from all workflows: `GET /api/workflows/tasks/pending?customerId=X`
- Groups by original workflow
- Shows "From {Workflow Name}" tag
- Must clear all tasks (complete/skip/snooze) before proceeding
- Progress indicator: "2 of 5 tasks remaining"

#### 5. NotificationBell.tsx (~150 lines)
```tsx
<NotificationBell
  unreadCount={3}
  onNotificationClick={(notif) => navigate(notif.link)}
  onMarkAllRead={() => markAllRead()}
/>
```

**Features:**
- Red badge with unread count
- Dropdown menu with notifications list
- Click notification → Navigate to link
- Mark as read on click
- "Mark all read" button
- Poll every 60 seconds: `useSWR('/api/notifications', { refreshInterval: 60000 })`

---

### Hooks to Build

#### 1. useTaskSnooze.ts (~120 lines)
```typescript
const useTaskSnooze = (taskId: string) => {
  const snoozeTask = async (until?: Date) => {
    const snoozedUntil = until || calculateNextSnoozeDate();

    // Check if first snooze
    const firstSnoozedAt = task.firstSnoozedAt || new Date();
    const snoozeDeadline = calculateSnoozeDeadline(firstSnoozedAt);

    await fetch(`/api/workflows/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'snoozed',
        snoozedUntil,
        firstSnoozedAt: task.firstSnoozedAt || firstSnoozedAt,
        snoozeDeadline
      })
    });
  };

  const eligibility = calculateSnoozeEligibility(task);

  return {
    snoozeTask,
    canSnooze: eligibility.canSnooze,
    daysRemaining: eligibility.daysRemaining,
    requiresDecision: eligibility.requiresDecision
  };
};
```

#### 2. useNotifications.ts (~100 lines)
```typescript
const useNotifications = () => {
  const { data, mutate } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 60000 // Poll every 60 seconds
  });

  const markAsRead = async (notifId: string) => {
    await fetch(`/api/notifications/${notifId}/read`, {
      method: 'PATCH'
    });
    mutate();
  };

  const markAllRead = async () => {
    const unread = data?.notifications.filter(n => !n.read) || [];
    await Promise.all(unread.map(n => markAsRead(n.id)));
  };

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unread_count || 0,
    markAsRead,
    markAllRead
  };
};
```

---

## 🔌 API Integration Points

### Backend APIs Needed

#### Task Management

```typescript
// 1. Create task from recommendation action
POST /api/workflows/executions/[id]/tasks
Body: {
  stepExecutionId: string,
  taskType: 'AI_TASK' | 'CSM_TASK',
  owner: 'AI' | 'CSM',
  action: ActionId,
  recommendationId: string,
  description: string,
  metadata: {}
}
Returns: { task: WorkflowTask }

// 2. Get tasks for workflow
GET /api/workflows/executions/[id]/tasks
Returns: { tasks: WorkflowTask[] }

// 3. Update task (snooze, complete, skip)
PATCH /api/workflows/tasks/[taskId]
Body: {
  status: 'snoozed' | 'completed' | 'skipped',
  snoozedUntil?: Date,
  firstSnoozedAt?: Date,
  snoozeDeadline?: Date,
  metadata?: {}
}
Returns: { task: WorkflowTask }

// 4. Get pending tasks for customer (cross-workflow)
GET /api/workflows/tasks/pending?customerId=[id]
Returns: {
  tasks: WorkflowTask[],
  groupedByWorkflow: Record<string, WorkflowTask[]>,
  totalCount: number
}

// 5. Force decision action
PATCH /api/workflows/tasks/[taskId]
Body: { action: 'dismiss_without_choice' }
// Backend auto-skips task
```

#### Notifications

```typescript
// 1. Get notifications
GET /api/notifications
Returns: {
  unread_count: number,
  notifications: Notification[]
}

// 2. Mark as read
PATCH /api/notifications/[id]/read
Returns: { success: boolean }
```

---

## 🎯 Success Criteria

### Task Snooze System
- [x] Task can be snoozed for 1 week
- [ ] Snooze button disabled after 7-day limit
- [ ] Forced decision modal appears at deadline
- [ ] Cannot dismiss modal without choosing
- [ ] Auto-skip if user abandons modal
- [ ] Snooze count tracked in database

### Cross-Workflow Continuity
- [ ] Pending tasks fetched when workflow starts
- [ ] Step 0 "Open Tasks" shown if tasks exist
- [ ] Tasks grouped by original workflow
- [ ] Tasks transferable to new workflow
- [ ] Workflow cannot complete with pending tasks

### Notifications
- [ ] Red badge shows unread count
- [ ] Notifications dropdown functional
- [ ] Click notification navigates to link
- [ ] Mark as read works
- [ ] Daily cron creates notifications for resurfaced tasks

### UI Consistency
- [ ] All snooze buttons have same icon (💤)
- [ ] All skip buttons have same icon (⏭️)
- [ ] Status badges consistent (✅ ⏭️ 🔄 ⏸️ ⭕)
- [ ] Action buttons follow same pattern
- [ ] Modern, minimal design

---

## 🚧 Known Limitations (To Address Later)

1. **No LLM integration yet** - Using mocks, will integrate in future milestone
2. **No recommendation resurfacing** - `getResurfacedRecommendations()` returns empty array
3. **No task priority auto-escalation** - Priority is static
4. **No email/Slack notifications** - Only in-product notifications
5. **No task cancellation logic** - No auto-cancel after X days

---

## 📝 Next Steps

1. **Finish building frontend components** (remaining ~600 lines)
2. **Backend engineer completes APIs** (workflow_tasks CRUD, notifications, cron)
3. **Integration testing** - Full snooze lifecycle
4. **Design review** - Icon strategy, modern UI polish
5. **User testing** - Validate forced decision UX

---

## 🤝 Questions for Backend Engineer

1. **Task transfer:** When task moves to new workflow, should we update `workflow_execution_id` or create new task record?
   - My preference: Update existing task

2. **Auto-skip logging:** Should `dismiss_without_choice` action be logged differently than manual skip?
   - My suggestion: Yes, set `skip_reason = 'auto_skipped_on_abandon'`

3. **Notification priority:** Should `requires_decision` tasks always be `priority: 'high'`?
   - My assumption: Yes

4. **Snooze deadline extension:** If user re-snoozes before deadline, does deadline extend?
   - My assumption: No, fixed 7 days from first snooze

5. **Cron frequency:** Daily at 6am sufficient, or should we check more frequently?
   - My assumption: Daily is fine for renewal workflows

---

## 📦 Files Created (So Far)

1. **mock-recommendations.ts** (350 lines) - Mock data for UI development
2. **task-types-frontend.ts** (450 lines) - TypeScript interfaces + helpers
3. **CHECKPOINT-3-SUMMARY.md** (this file) - Documentation

**Remaining to create:**
- RecommendationCard.tsx
- TaskList.tsx
- ForcedDecisionModal.tsx
- OpenTasksStep.tsx
- NotificationBell.tsx
- useTaskSnooze.ts
- useNotifications.ts

**Total remaining: ~950 lines**

---

Ready for backend engineer to proceed with:
1. `workflow_tasks` table migration
2. Task CRUD APIs
3. Notifications table + APIs
4. Daily snooze evaluation cron
5. Auto-skip logic
