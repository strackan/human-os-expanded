# Flexible Notification System

## Overview

The notification system provides a **flexible, template-driven** way to send alerts to users from any workflow step or action. Notifications appear in the reminder button (bell icon) in the app header.

**Key Principle**: Notifications are **communication only** - they're separate from escalations, reassignments, or sharing. They're lightweight alerts that show up in the UI.

## Architecture

```
Workflow Config (notifications array)
    ↓
notificationProcessor.js (evaluates conditions, resolves templates)
    ↓
API POST /api/notifications (creates notification in database)
    ↓
Frontend useNotifications hook (polls for new notifications)
    ↓
AppLayout reminder button (displays notifications with badge count)
```

---

## Adding Notifications to Workflow Configs

### Basic Structure

Add a `notifications` array to any workflow step:

```typescript
{
  id: 'some-workflow-step',
  name: 'Grace Period Management',

  notifications: [
    {
      condition: '{{workflow.daysOverdue >= 7}}',  // When to send (optional)
      type: 'overdue_alert',                        // Notification type
      title: 'Renewal 7 Days Overdue',              // Notification title
      message: '{{customer.name}} is {{workflow.daysOverdue}} days overdue',  // Message
      priority: 2,                                   // 1=urgent (pulsing red), 3=normal
      recipients: ['{{csm.email}}', '{{csm.manager}}'],  // Who gets notified
      metadata: {                                    // Extra data for navigation
        customerId: '{{customer.id}}',
        workflowStage: 'overdue',
        daysOverdue: '{{workflow.daysOverdue}}'
      }
    }
  ]
}
```

### Notification Types

```typescript
type NotificationType =
  | 'task_requires_decision'      // CSM must take action
  | 'task_deadline_approaching'   // Deadline warning
  | 'workflow_started'            // New workflow triggered
  | 'escalation_required'         // Team escalation
  | 'overdue_alert'               // Something is overdue
  | 'key_task_pending'            // Important task needs attention
  | 'recommendation_available'    // AI has a recommendation
  | 'approval_needed';            // Requires manager approval
```

### Priority Levels

```typescript
1 = Urgent     // Red pulsing badge, top of list
2 = High       // Red badge
3 = Normal     // Blue badge (default)
4 = Low        // Gray badge
5 = Info       // Gray badge, bottom of list
```

---

## Template Variables

All notification fields support Handlebars template syntax:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{customer.name}}` | Customer company name | `Acme Corp` |
| `{{customer.arr}}` | Annual Recurring Revenue | `125000` |
| `{{customer.id}}` | Customer UUID | `abc-123` |
| `{{customer.hasAccountPlan}}` | Boolean | `true` |
| `{{csm.email}}` | CSM email | `carol@company.com` |
| `{{csm.name}}` | CSM full name | `Carol CSM` |
| `{{csm.manager}}` | Manager email | `alice@company.com` |
| `{{csm.managerName}}` | Manager name | `Alice Manager` |
| `{{workflow.daysUntilRenewal}}` | Days until renewal | `5` |
| `{{workflow.daysOverdue}}` | Days overdue | `7` |
| `{{workflow.currentStage}}` | Current stage | `8-Critical` |
| `{{workflow.renewalARR}}` | Renewal ARR | `125000` |
| `{{company.vpCustomerSuccess}}` | VP CS email | `john@company.com` |
| `{{company.ceo}}` | CEO email | `jane@company.com` |

See `TEMPLATE_VARIABLES.md` for full reference.

---

## Conditional Sending

Use the `condition` field to send notifications only when certain criteria are met:

### Example: Send on Specific Day

```typescript
{
  condition: '{{eq workflow.daysOverdue 7}}',  // Only on day 7
  type: 'overdue_alert',
  title: 'Renewal 1 Week Overdue',
  priority: 2,
  recipients: ['{{csm.email}}', '{{csm.manager}}']
}
```

### Example: Send if Above Threshold

```typescript
{
  condition: '{{gte workflow.renewalARR 100000}}',  // Only if ARR >= $100K
  type: 'escalation_required',
  title: 'High-Value Renewal at Risk',
  priority: 1,
  recipients: ['{{company.vpCustomerSuccess}}', '{{company.ceo}}']
}
```

### Example: Multiple Conditions (AND)

```typescript
{
  condition: '{{and (gte workflow.daysOverdue 15) customer.hasAccountPlan}}',
  type: 'escalation_required',
  title: 'Strategic Account 15 Days Overdue',
  priority: 1,
  recipients: ['{{accountTeam.allEmails}}']
}
```

### Available Condition Helpers

| Helper | Description | Example |
|--------|-------------|---------|
| `{{eq a b}}` | Equals | `{{eq workflow.daysOverdue 7}}` |
| `{{gte a b}}` | Greater than or equal | `{{gte customer.arr 50000}}` |
| `{{lte a b}}` | Less than or equal | `{{lte workflow.daysUntilRenewal 0}}` |
| `{{and cond1 cond2}}` | Logical AND | `{{and (gte arr 100000) hasAccountPlan}}` |
| `{{or cond1 cond2}}` | Logical OR | `{{or (lte days 0) (eq stage "emergency")}}` |
| `{{abs num}}` | Absolute value | `{{abs workflow.daysUntilRenewal}}` |

---

## Recipient Lists

Recipients can be:

### Single Recipient

```typescript
recipients: ['{{csm.email}}']
```

### Multiple Recipients

```typescript
recipients: [
  '{{csm.email}}',
  '{{csm.manager}}',
  '{{company.vpCustomerSuccess}}'
]
```

### Conditional Recipients

```typescript
recipients: [
  '{{csm.email}}',
  '{{#if customer.hasAccountPlan}}{{accountTeam.allEmails}}{{/if}}'
]
```

### Account Team (All Members)

```typescript
recipients: ['{{accountTeam.allEmails}}']
// Resolves to: ['ae@co.com', 'sa@co.com', 'csm@co.com', 'exec@co.com']
```

---

## Metadata for Navigation

The `metadata` object stores contextual data for:
- Click navigation (route to customer page)
- Displaying additional info in notification panel
- Filtering notifications

```typescript
metadata: {
  customerId: '{{customer.id}}',        // For navigation
  workflowStage: '{{workflow.currentStage}}',
  daysOverdue: '{{workflow.daysOverdue}}',
  arr: '{{customer.arr}}',
  requiresAcknowledgment: true           // Special flags
}
```

Frontend can use metadata to navigate:

```typescript
function handleNotificationClick(notification) {
  if (notification.metadata.customerId) {
    router.push(`/customers/${notification.metadata.customerId}`);
  }
}
```

---

## Complete Examples

### Example 1: Overdue Day-Based Notifications

```typescript
// In 10-Overdue.ts workflow config
{
  id: 'grace-period-management',
  name: 'Grace Period Management',

  notifications: [
    // Day 7: Manager FYI
    {
      condition: '{{eq workflow.daysOverdue 7}}',
      type: 'overdue_alert',
      title: '📧 Renewal 1 Week Overdue',
      message: '{{customer.name}} renewal is 1 week overdue. Your manager has been notified.',
      priority: 3,
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        daysOverdue: 7
      }
    },

    // Day 15: VP CS Involvement
    {
      condition: '{{eq workflow.daysOverdue 15}}',
      type: 'escalation_required',
      title: '🚨 VP CS Involvement Required',
      message: '{{customer.name}} (${{customer.arr}}) is 15 days overdue. VP CS has been looped in.',
      priority: 1,  // Urgent - pulsing red badge
      recipients: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
      metadata: {
        customerId: '{{customer.id}}',
        daysOverdue: 15,
        escalationLevel: 'vp_cs'
      }
    },

    // Day 30: War Room
    {
      condition: '{{eq workflow.daysOverdue 30}}',
      type: 'task_requires_decision',
      title: '⚠️ War Room Activation Required',
      message: '{{customer.name}} is 30 days overdue. War room must be activated immediately.',
      priority: 1,
      recipients: [
        '{{csm.email}}',
        '{{csm.manager}}',
        '{{company.vpCustomerSuccess}}',
        '{{#if (gte customer.arr 250000)}}{{company.ceo}}{{/if}}'
      ],
      metadata: {
        customerId: '{{customer.id}}',
        daysOverdue: 30,
        requiresWarRoom: true
      }
    },

    // Strategic accounts: Accelerated escalation
    {
      condition: '{{and (eq workflow.daysOverdue 8) customer.hasAccountPlan}}',
      type: 'escalation_required',
      title: '⭐ Strategic Account 8 Days Overdue',
      message: 'Strategic account {{customer.name}} needs immediate attention. Account team notified.',
      priority: 1,
      recipients: ['{{accountTeam.allEmails}}'],
      metadata: {
        customerId: '{{customer.id}}',
        isStrategic: true,
        daysOverdue: 8
      }
    }
  ]
}
```

### Example 2: Emergency Manager Acknowledgment

```typescript
// In 9-Emergency.ts workflow config
{
  id: 'mandatory-team-escalation',
  name: 'Mandatory Team Escalation',

  notifications: [
    // Immediate notification to manager
    {
      type: 'approval_needed',
      title: 'Manager Acknowledgment Required',
      message: 'Emergency renewal for {{customer.name}} (${{customer.arr}}) requires your immediate acknowledgment. {{workflow.hoursUntilRenewal}} hours remaining.',
      priority: 1,
      recipients: ['{{csm.manager}}'],
      metadata: {
        customerId: '{{customer.id}}',
        workflowStage: 'emergency',
        hoursRemaining: '{{workflow.hoursUntilRenewal}}',
        requiresAcknowledgment: true,
        csmEmail: '{{csm.email}}'
      }
    },

    // High-value renewals: CEO notification
    {
      condition: '{{gte workflow.renewalARR 250000}}',
      type: 'workflow_started',
      title: 'Emergency: High-Value Renewal at Risk',
      message: '${{customer.arr}} renewal ({{customer.name}}) is in emergency status with {{workflow.hoursUntilRenewal}} hours remaining.',
      priority: 1,
      recipients: ['{{company.ceo}}', '{{company.vpCustomerSuccess}}'],
      metadata: {
        customerId: '{{customer.id}}',
        arr: '{{customer.arr}}',
        hoursRemaining: '{{workflow.hoursUntilRenewal}}'
      }
    }
  ],

  // Also send notification when action is executed
  actions: [
    {
      id: 'manager-acknowledge',
      label: 'Acknowledge Emergency',
      type: 'primary',
      onExecute: {
        apiEndpoint: 'POST /api/team-escalations/manager-acknowledge',
        onSuccess: {
          sendNotification: {
            type: 'workflow_started',
            title: 'Manager Acknowledged Emergency',
            message: '{{csm.managerName}} has acknowledged {{customer.name}} emergency renewal',
            priority: 2,
            recipients: ['{{csm.email}}', '{{company.vpCustomerSuccess}}'],
            metadata: {
              customerId: '{{customer.id}}',
              acknowledgedBy: '{{csm.manager}}',
              acknowledgedAt: '{{workflow.currentTimestamp}}'
            }
          }
        }
      }
    }
  ]
}
```

### Example 3: Key Task Reminders

```typescript
// In 5-Engage.ts workflow config
{
  id: 'stakeholder-engagement',
  name: 'Stakeholder Engagement',

  notifications: [
    // Scheduled meeting reminder
    {
      type: 'task_deadline_approaching',
      title: 'QBR Scheduled Tomorrow',
      message: 'Quarterly Business Review with {{customer.name}} is scheduled for tomorrow at 2pm. Ensure deck is prepared.',
      priority: 3,
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        eventType: 'qbr',
        daysUntil: 1
      }
    },

    // No response follow-up
    {
      condition: '{{eq workflow.daysSinceContact 5}}',
      type: 'key_task_pending',
      title: 'Follow-up Needed: No Response for 5 Days',
      message: 'No response from {{customer.name}} CFO. Consider alternative outreach strategy.',
      priority: 3,
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        daysSinceContact: 5,
        lastContactType: 'email'
      }
    }
  ]
}
```

### Example 4: AI Recommendations

```typescript
// In any workflow step with AI processing
{
  id: 'ai-analysis',
  name: 'AI-Driven Analysis',

  execution: {
    llmPrompt: '...',
    processor: 'aiAnalysisProcessor.js'
  },

  notifications: [
    // AI found opportunity
    {
      type: 'recommendation_available',
      title: 'AI Recommends Price Increase Discussion',
      message: 'Based on usage patterns, {{customer.name}} may accept a {{metadata.suggestedIncrease}}% price increase',
      priority: 4,
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        recommendationType: 'pricing',
        suggestedIncrease: 5,
        confidence: 'high',
        usageGrowth: '{{metadata.usageGrowth}}'
      }
    }
  ]
}
```

---

## Sending Notifications from Actions

You can also send notifications when actions are executed:

```typescript
actions: [
  {
    id: 'create-war-room',
    label: 'Create War Room',
    type: 'primary',

    onExecute: {
      apiEndpoint: 'POST /api/war-rooms/create',

      onSuccess: {
        sendNotification: {
          type: 'workflow_started',
          title: 'War Room Activated',
          message: 'War room created for {{customer.name}} - ${{customer.arr}} renewal at risk',
          priority: 1,
          recipients: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
          metadata: {
            customerId: '{{customer.id}}',
            warRoomCreatedAt: '{{workflow.currentTimestamp}}'
          }
        }
      }
    }
  }
]
```

---

## Processing Notifications in Workflow Engine

The workflow engine automatically processes notifications when steps are executed:

```javascript
const { processNotifications } = require('./notificationProcessor');

async function executeWorkflowStep(step, context) {
  // ... execute step logic ...

  // Process notifications
  const notificationCount = await processNotifications(step, context);
  console.log(`Sent ${notificationCount} notifications`);
}
```

---

## Frontend Integration

The frontend uses the `useNotifications` hook to fetch and display notifications:

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function ReminderButton() {
  const { notifications, unreadCount, markAsRead, hasUnreadUrgent } = useNotifications();

  return (
    <button>
      🔔
      {unreadCount > 0 && (
        <span className={hasUnreadUrgent() ? 'pulse-red' : ''}>
          {unreadCount}
        </span>
      )}
    </button>
  );
}
```

---

## Best Practices

### 1. Use Conditions to Avoid Spam

```typescript
// ❌ BAD: Sends notification every time step runs
{
  type: 'overdue_alert',
  title: 'Still Overdue',
  recipients: ['{{csm.email}}']
}

// ✅ GOOD: Only sends on specific days
{
  condition: '{{or (eq workflow.daysOverdue 7) (eq workflow.daysOverdue 15)}}',
  type: 'overdue_alert',
  title: 'Overdue Milestone Reached',
  recipients: ['{{csm.email}}']
}
```

### 2. Set Appropriate Priorities

```typescript
// Urgent (1-2): Requires immediate action or involves leadership
priority: 1  // Manager acknowledgment, CEO notification, war room

// Normal (3): Informational or routine tasks
priority: 3  // QBR reminder, standard follow-up

// Low (4-5): Nice-to-know, AI recommendations
priority: 4  // AI suggests price increase
```

### 3. Include Rich Metadata

```typescript
// ❌ BAD: No context
metadata: {}

// ✅ GOOD: Rich context for navigation and display
metadata: {
  customerId: '{{customer.id}}',
  workflowStage: '{{workflow.currentStage}}',
  arr: '{{customer.arr}}',
  daysOverdue: '{{workflow.daysOverdue}}',
  escalationLevel: 'vp_cs'
}
```

### 4. Use Clear, Actionable Titles

```typescript
// ❌ BAD: Vague
title: 'Renewal Update'

// ✅ GOOD: Specific and actionable
title: 'Manager Acknowledgment Required - 36 Hours Remaining'
```

### 5. Conditional Recipients

```typescript
// Send to CEO only for high-value renewals
recipients: [
  '{{csm.email}}',
  '{{csm.manager}}',
  '{{#if (gte customer.arr 250000)}}{{company.ceo}}{{/if}}'
]
```

---

## Testing Notifications

### 1. Test Condition Evaluation

```javascript
const { evaluateCondition } = require('./workflow-engine/notificationProcessor');

const context = {
  workflow: { daysOverdue: 7 },
  customer: { hasAccountPlan: true }
};

const result = evaluateCondition('{{eq workflow.daysOverdue 7}}', context);
console.log('Should send:', result); // true
```

### 2. Test Template Resolution

```javascript
const { resolveTemplate } = require('./workflow-engine/notificationProcessor');

const context = {
  customer: { name: 'Acme Corp', arr: 125000 },
  workflow: { daysOverdue: 7 }
};

const title = resolveTemplate('{{customer.name}} is {{workflow.daysOverdue}} days overdue', context);
console.log(title); // "Acme Corp is 7 days overdue"
```

### 3. Manual Notification Sending

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "type": "overdue_alert",
    "title": "Test Notification",
    "message": "This is a test",
    "priority": 3
  }'
```

---

## Summary

**Notifications are flexible alerts** that can be triggered from any workflow step or action based on conditions. They're separate from business logic (escalations/reassignments) and provide a lightweight way to keep users informed.

**Key Features**:
- ✅ Template-driven (dynamic content)
- ✅ Conditional sending (only when needed)
- ✅ Multi-recipient support
- ✅ Priority-based display
- ✅ Rich metadata for navigation
- ✅ Type-safe notification categories

**Next Steps**:
1. Add `notifications` arrays to your workflow configs
2. Use conditions to avoid notification spam
3. Test template variable resolution
4. Wire up frontend click handlers for navigation
