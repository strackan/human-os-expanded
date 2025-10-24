# Task System Integration Guide

This guide explains how to integrate the task management system (built in Checkpoint 3) with your workflow execution engine.

## Overview

The task system adds cross-workflow continuity, 7-day snooze limits, and forced decision modals to the workflow system. This guide shows how to integrate these features into your workflow execution flow.

---

## 1. Prerequisites

Ensure you have:

- ✅ Task CRUD APIs (`/api/workflows/tasks/*`)
- ✅ Notifications APIs (`/api/notifications/*`)
- ✅ `workflow_tasks` table with required fields
- ✅ `notifications` table
- ✅ Daily cron job for snooze evaluation
- ✅ Frontend components: `OpenTasksStep`, `ForcedDecisionModal`, `TaskList`, `RecommendationCard`, `NotificationBell`
- ✅ Frontend hooks: `useTaskSnooze`, `useNotifications`

---

## 2. Workflow Execution Flow with Tasks

### High-Level Flow

```
1. CSM opens customer record
   ↓
2. System fetches workflow assignment for customer
   ↓
3. Check: Does customer have open tasks from other workflows?
   ├─ YES → Show OpenTasksStep (Step 0)
   │   ├─ Check: Any tasks with requiresDecision=true?
   │   │   ├─ YES → Show ForcedDecisionModal (cannot dismiss)
   │   │   └─ NO → Show regular task list with actions
   │   └─ CSM resolves tasks → Continue to Step 1
   └─ NO → Start at Step 1
   ↓
4. Execute workflow steps normally
   ↓
5. At recommendation steps: Show RecommendationCard components
   ├─ CSM can: Send Email, Schedule Meeting, Update CRM, Skip, Snooze
   └─ If CSM chooses action → Create AI_TASK or CSM_TASK
   ↓
6. Complete workflow
   ├─ Status: completed_with_pending_tasks (if tasks created)
   └─ Status: completed (if no pending tasks)
```

---

## 3. Step 0: OpenTasksStep Integration

### When to Show Step 0

Show `OpenTasksStep` component **before** workflow Step 1 if:

```javascript
// Pseudo-code
const hasOpenTasks = await checkForOpenTasks(customerId, currentWorkflowExecutionId);
if (hasOpenTasks) {
  // Inject Step 0 before regular steps
  steps.unshift({
    id: 'open-tasks',
    component: 'OpenTasksStep',
    props: {
      currentWorkflowExecutionId,
      customerId,
      onTaskCompleted: () => refreshWorkflow(),
      onStepComplete: () => moveToNextStep(),
      onError: (error) => handleError(error)
    }
  });
}
```

### API Call to Check for Open Tasks

```javascript
async function checkForOpenTasks(customerId, currentWorkflowExecutionId) {
  const response = await fetch(
    `/api/workflows/tasks?customerId=${customerId}&excludeWorkflowExecutionId=${currentWorkflowExecutionId}&status=pending,snoozed`
  );
  const data = await response.json();
  return data.tasks.length > 0;
}
```

### Step 0 Behavior

- **Cannot proceed** if any task has `requiresDecision: true`
- Shows `ForcedDecisionModal` automatically for tasks requiring decision
- CSM can:
  - Transfer task to current workflow
  - Complete task immediately
  - Snooze task (if eligible)
  - Skip task
- Once all tasks resolved (or none require decision), CSM clicks "Continue to Workflow"

---

## 4. ForcedDecisionModal Integration

### When to Trigger

The `ForcedDecisionModal` should appear when:

1. **Step 0 Detection**: `OpenTasksStep` detects a task with `requiresDecision: true`
2. **Daily Queue Check**: CSM views their daily task queue and sees tasks requiring decision
3. **Notification Click**: CSM clicks a notification about a task requiring decision

### Usage Example

```tsx
import { ForcedDecisionModal } from './components/ForcedDecisionModal';
import { useTaskSnooze } from './hooks/useTaskSnooze';

function WorkflowExecution({ workflowExecutionId, customerId }) {
  const [forcedDecisionTask, setForcedDecisionTask] = useState(null);
  const taskSnooze = useTaskSnooze({
    onSuccess: () => {
      setForcedDecisionTask(null);
      refreshWorkflow();
    }
  });

  useEffect(() => {
    // Check for tasks requiring decision
    fetchTasks().then(tasks => {
      const taskNeedingDecision = tasks.find(t => t.requiresDecision);
      if (taskNeedingDecision) {
        setForcedDecisionTask(taskNeedingDecision);
      }
    });
  }, [customerId]);

  return (
    <>
      {/* Regular workflow UI */}
      <WorkflowSteps />

      {/* Forced Decision Modal */}
      {forcedDecisionTask && (
        <ForcedDecisionModal
          task={forcedDecisionTask}
          open={!!forcedDecisionTask}
          onAction={() => taskSnooze.completeTask(forcedDecisionTask.id)}
          onSkip={() => taskSnooze.skipTask(forcedDecisionTask.id)}
          onDismiss={() => taskSnooze.dismissWithoutChoice(forcedDecisionTask.id)}
        />
      )}
    </>
  );
}
```

### Key Properties

- **Cannot close** without making a choice (ESC disabled, backdrop click shows warning)
- **Auto-skip countdown** (5 seconds) if CSM tries to dismiss
- **Shows task context** (description, owner, snooze count, days snoozed)
- **Two actions only**: "Take Action Now" or "Skip Forever"

---

## 5. Recommendation Step Integration

### Monitor Workflow Example (Step 2: Review Recommendations)

When a workflow step shows recommendations, integrate as follows:

```tsx
import { RecommendationCard } from './components/RecommendationCard';
import { useTaskSnooze } from './hooks/useTaskSnooze';

function RecommendationStep({ workflowExecutionId, customerId, recommendations }) {
  const taskSnooze = useTaskSnooze({
    onSuccess: () => {
      // Refresh workflow state
      fetchWorkflowState();
    }
  });

  const handleAction = async (recommendationId, actionId) => {
    // Create a task for this action
    const task = await createTaskFromRecommendation({
      workflowExecutionId,
      customerId,
      recommendationId,
      actionId
    });

    // Update recommendation status
    await updateRecommendation(recommendationId, { status: 'in_progress' });
  };

  const handleSnooze = async (recommendationId) => {
    // Create a task for this recommendation
    const task = await createTaskFromRecommendation({
      workflowExecutionId,
      customerId,
      recommendationId,
      actionId: 'snooze'
    });

    // Snooze the task
    await taskSnooze.snoozeTask(task.id, task);

    // Update recommendation status
    await updateRecommendation(recommendationId, { status: 'snoozed' });
  };

  const handleSkip = async (recommendationId) => {
    // Update recommendation status
    await updateRecommendation(recommendationId, { status: 'skipped' });
  };

  return (
    <div>
      <h2>Review Recommendations</h2>
      <p>We've identified {recommendations.length} opportunities for this customer.</p>

      {recommendations.map(rec => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onAction={(actionId) => handleAction(rec.id, actionId)}
          onSnooze={() => handleSnooze(rec.id)}
          onSkip={() => handleSkip(rec.id)}
        />
      ))}
    </div>
  );
}
```

### Creating Tasks from Recommendations

```javascript
async function createTaskFromRecommendation({
  workflowExecutionId,
  customerId,
  recommendationId,
  actionId
}) {
  const response = await fetch('/api/workflows/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowExecutionId,
      customerId,
      recommendationId,
      action: actionId,
      taskType: getTaskType(actionId), // 'AI_TASK' or 'CSM_TASK'
      owner: getTaskOwner(actionId), // 'AI' or 'CSM'
      description: getTaskDescription(recommendationId, actionId),
      priority: getTaskPriority(recommendationId),
      status: actionId === 'snooze' ? 'snoozed' : 'pending',
      metadata: {
        recommendationId,
        createdFromWorkflow: true
      }
    })
  });

  return response.json();
}

function getTaskType(actionId) {
  const AI_TASKS = ['send_email', 'update_crm', 'get_transcript'];
  return AI_TASKS.includes(actionId) ? 'AI_TASK' : 'CSM_TASK';
}

function getTaskOwner(actionId) {
  const AI_TASKS = ['send_email', 'update_crm', 'get_transcript'];
  return AI_TASKS.includes(actionId) ? 'AI' : 'CSM';
}
```

---

## 6. Workflow Completion States

### Determining Completion Status

```javascript
async function completeWorkflow(workflowExecutionId) {
  // Check if there are pending tasks created during this workflow
  const pendingTasks = await fetch(
    `/api/workflows/tasks?workflowExecutionId=${workflowExecutionId}&status=pending,snoozed`
  ).then(r => r.json());

  const status = pendingTasks.tasks.length > 0
    ? 'completed_with_pending_tasks'
    : 'completed';

  // Update workflow execution status
  await fetch(`/api/workflows/executions/${workflowExecutionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      completedAt: new Date().toISOString(),
      metadata: {
        pendingTasksCount: pendingTasks.tasks.length,
        tasksRequiringDecision: pendingTasks.tasks.filter(t => t.requiresDecision).length
      }
    })
  });

  return { status, pendingTasks: pendingTasks.tasks };
}
```

### Completion Status Types

- **`completed`**: Workflow finished, no pending tasks
- **`completed_with_pending_tasks`**: Workflow finished, but has tasks that will resurface later
- **`completed_with_snooze`**: Workflow finished, has snoozed tasks (subset of above)

---

## 7. NotificationBell Integration

### Header Integration

```tsx
import { NotificationBell } from './components/NotificationBell';

function AppHeader() {
  const handleNotificationClick = (notification) => {
    // Route to appropriate page based on notification type
    switch (notification.type) {
      case 'task_requires_decision':
        // Navigate to customer with forced decision modal
        router.push(`/customers/${notification.metadata.customerId}`);
        break;

      case 'task_deadline_approaching':
        // Navigate to task queue
        router.push('/tasks');
        break;

      case 'workflow_started':
        // Navigate to workflow
        router.push(`/workflows/${notification.workflowExecutionId}`);
        break;

      case 'recommendation_available':
        // Navigate to customer
        router.push(`/customers/${notification.metadata.customerId}`);
        break;
    }
  };

  return (
    <header>
      <div className="logo">Renubu</div>
      <nav>{/* ... */}</nav>
      <NotificationBell onNotificationClick={handleNotificationClick} />
      <UserMenu />
    </header>
  );
}
```

### Notification Polling

The `useNotifications` hook automatically polls every 60 seconds. No additional setup required.

---

## 8. Daily Task Queue View

### Recommended UI for CSM Daily View

```tsx
import { TaskList } from './components/TaskList';
import { useTaskSnooze } from './hooks/useTaskSnooze';
import { ForcedDecisionModal } from './components/ForcedDecisionModal';

function DailyTaskQueue({ csmId }) {
  const [tasks, setTasks] = useState([]);
  const [forcedTask, setForcedTask] = useState(null);

  const taskSnooze = useTaskSnooze({
    onSuccess: () => {
      fetchTasks();
      setForcedTask(null);
    }
  });

  useEffect(() => {
    fetchTasks();
  }, [csmId]);

  const fetchTasks = async () => {
    const response = await fetch(`/api/workflows/tasks?ownerId=${csmId}&status=pending,snoozed`);
    const data = await response.json();

    // Sort: requiresDecision first
    const sorted = data.tasks.sort((a, b) => {
      if (a.requiresDecision !== b.requiresDecision) {
        return a.requiresDecision ? -1 : 1;
      }
      return a.priority - b.priority;
    });

    setTasks(sorted);

    // Auto-show forced decision modal for first task requiring decision
    const firstForcedTask = sorted.find(t => t.requiresDecision);
    if (firstForcedTask) {
      setForcedTask(firstForcedTask);
    }
  };

  return (
    <div className="daily-queue">
      <header>
        <h1>My Tasks</h1>
        <p>{tasks.length} tasks in your queue</p>
      </header>

      <TaskList
        tasks={tasks}
        groupBy="priority"
        onComplete={(taskId) => taskSnooze.completeTask(taskId)}
        onSnooze={(taskId) => {
          const task = tasks.find(t => t.id === taskId);
          taskSnooze.snoozeTask(taskId, task);
        }}
        onSkip={(taskId) => taskSnooze.skipTask(taskId)}
      />

      {forcedTask && (
        <ForcedDecisionModal
          task={forcedTask}
          open={!!forcedTask}
          onAction={() => taskSnooze.completeTask(forcedTask.id)}
          onSkip={() => taskSnooze.skipTask(forcedTask.id)}
          onDismiss={() => taskSnooze.dismissWithoutChoice(forcedTask.id)}
        />
      )}
    </div>
  );
}
```

---

## 9. API Contracts

### Required API Endpoints

#### GET `/api/workflows/tasks`

Fetch tasks with filters.

**Query Parameters:**
- `customerId` (optional): Filter by customer
- `ownerId` (optional): Filter by task owner
- `workflowExecutionId` (optional): Filter by workflow
- `excludeWorkflowExecutionId` (optional): Exclude workflow (for Step 0)
- `status` (optional): Comma-separated status values (e.g., "pending,snoozed")

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_123",
      "workflowExecutionId": "workflow_456",
      "customerId": "customer_789",
      "taskType": "AI_TASK",
      "owner": "AI",
      "action": "send_email",
      "description": "Draft email about Advanced Analytics",
      "status": "pending",
      "priority": 2,
      "requiresDecision": false,
      "snoozeCount": 0,
      "firstSnoozedAt": null,
      "snoozeDeadline": null,
      "snoozedUntil": null,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z",
      "metadata": {}
    }
  ]
}
```

#### PATCH `/api/workflows/tasks/:taskId`

Update task status, snooze fields, etc.

**Request Body:**
```json
{
  "status": "snoozed",
  "snoozedUntil": "2025-01-22T10:00:00Z",
  "firstSnoozedAt": "2025-01-15T10:00:00Z",
  "snoozeDeadline": "2025-01-22T10:00:00Z",
  "snoozeCount": 1
}
```

#### POST `/api/workflows/tasks/:taskId/transfer`

Transfer task to a different workflow.

**Request Body:**
```json
{
  "targetWorkflowExecutionId": "workflow_999"
}
```

**Response:**
```json
{
  "task": { /* updated task */ },
  "message": "Task transferred successfully"
}
```

#### GET `/api/notifications`

Fetch notifications for current user.

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "userId": "user_456",
      "taskId": "task_789",
      "type": "task_requires_decision",
      "title": "Task Requires Decision",
      "message": "Task 'Send renewal kickoff email' has reached its 7-day snooze limit.",
      "priority": 1,
      "read": false,
      "createdAt": "2025-01-15T10:00:00Z",
      "metadata": {
        "customerId": "customer_789",
        "taskId": "task_789"
      }
    }
  ]
}
```

#### PATCH `/api/notifications/:notificationId`

Mark notification as read.

**Request Body:**
```json
{
  "read": true
}
```

#### POST `/api/notifications/mark-all-read`

Mark all notifications as read for current user.

---

## 10. Backend Cron Job Requirements

### Daily Snooze Evaluation (runs once per day)

```javascript
// Pseudo-code
async function evaluateSnoozedTasks() {
  const now = new Date();

  // Find all snoozed tasks with deadline <= now
  const tasksAtDeadline = await db.query(`
    SELECT * FROM workflow_tasks
    WHERE status = 'snoozed'
      AND snooze_deadline <= $1
      AND requires_decision = false
  `, [now]);

  for (const task of tasksAtDeadline) {
    // Set requiresDecision flag
    await db.query(`
      UPDATE workflow_tasks
      SET requires_decision = true,
          updated_at = $1
      WHERE id = $2
    `, [now, task.id]);

    // Create high-priority notification
    await db.query(`
      INSERT INTO notifications (user_id, task_id, type, title, message, priority, read)
      VALUES ($1, $2, 'task_requires_decision', $3, $4, 1, false)
    `, [
      task.owner_id,
      task.id,
      'Task Requires Decision',
      `Task '${task.description}' has reached its 7-day snooze limit and requires your decision.`
    ]);
  }

  console.log(`Evaluated ${tasksAtDeadline.length} tasks requiring decision`);
}

// Run daily at 8 AM
cron.schedule('0 8 * * *', evaluateSnoozedTasks);
```

### Resurface Snoozed Tasks (runs once per day)

```javascript
async function resurfaceSnoozedTasks() {
  const now = new Date();

  // Find all snoozed tasks with snoozedUntil <= now
  const tasksToResurface = await db.query(`
    SELECT * FROM workflow_tasks
    WHERE status = 'snoozed'
      AND snoozed_until <= $1
      AND requires_decision = false
  `, [now]);

  for (const task of tasksToResurface) {
    // Change status back to pending
    await db.query(`
      UPDATE workflow_tasks
      SET status = 'pending',
          snoozed_until = NULL,
          updated_at = $1
      WHERE id = $2
    `, [now, task.id]);

    // Create notification (priority based on task priority)
    await db.query(`
      INSERT INTO notifications (user_id, task_id, type, title, message, priority, read)
      VALUES ($1, $2, 'task_deadline_approaching', $3, $4, $5, false)
    `, [
      task.owner_id,
      task.id,
      'Snoozed Task Resurfaced',
      `Task '${task.description}' is ready for your attention.`,
      task.priority
    ]);
  }

  console.log(`Resurfaced ${tasksToResurface.length} snoozed tasks`);
}

// Run daily at 8 AM
cron.schedule('0 8 * * *', resurfaceSnoozedTasks);
```

---

## 11. Testing Checklist

### Step 0 Integration
- [ ] OpenTasksStep appears when customer has open tasks
- [ ] OpenTasksStep does NOT appear when no open tasks exist
- [ ] ForcedDecisionModal auto-shows for tasks with requiresDecision=true
- [ ] Cannot proceed past Step 0 while tasks require decision
- [ ] Transfer task button works correctly
- [ ] Snooze button disabled when task cannot be snoozed

### Forced Decision Modal
- [ ] ESC key disabled
- [ ] Backdrop click shows auto-skip warning (not immediate close)
- [ ] 5-second countdown works
- [ ] "Take Action Now" completes task
- [ ] "Skip Forever" skips task
- [ ] Dismissal triggers auto-skip with correct metadata
- [ ] Modal shows task context correctly

### Recommendations
- [ ] RecommendationCard renders with correct action buttons
- [ ] Clicking action creates task with correct owner (AI vs CSM)
- [ ] Snooze creates task with snoozedUntil +1 week
- [ ] Skip updates recommendation status
- [ ] Recommendation status updates in UI after action

### Notifications
- [ ] NotificationBell shows unread count
- [ ] Red badge appears for unread notifications
- [ ] Polling updates every 60 seconds
- [ ] Mark as read works
- [ ] Mark all read works
- [ ] Clicking notification navigates to correct page
- [ ] Urgent notifications pulse

### Daily Cron
- [ ] Tasks at 7-day deadline get requiresDecision=true
- [ ] Notifications created for tasks requiring decision
- [ ] Snoozed tasks resurface when snoozedUntil reached
- [ ] Notifications created for resurfaced tasks

---

## 12. Future Enhancements

- **Step-level snooze**: Snooze entire workflow step for 1 week
- **Workflow-level snooze**: Snooze entire workflow for 1 week
- **Task templates**: Pre-defined task templates for common actions
- **Bulk task actions**: Mark multiple tasks complete/skip at once
- **Task delegation**: Assign task to another CSM
- **Custom snooze reasons**: Allow CSM to add note when snoozing
- **Snooze history**: Show full snooze history for audit trail

---

## Summary

This integration guide provides a complete roadmap for adding task management to your workflow execution engine. The key integration points are:

1. **Step 0 injection** when open tasks exist
2. **ForcedDecisionModal** for 7-day snooze limit enforcement
3. **RecommendationCard** integration for creating tasks
4. **NotificationBell** for real-time alerts
5. **Daily cron jobs** for snooze evaluation and resurfacing
6. **API contracts** for all task and notification operations

Follow this guide to ensure consistent UX across all workflows and proper enforcement of the 7-day snooze limit.
