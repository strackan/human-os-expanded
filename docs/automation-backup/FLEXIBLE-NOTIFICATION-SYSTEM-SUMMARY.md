# Flexible Notification System - Implementation Summary

## Overview

Implemented a **flexible, template-driven notification system** that allows any workflow step or action to send alerts to users via the reminder button (bell icon) in the app header.

**Key Principle**: Notifications are **communication only** - separate from escalations, reassignments, or sharing. They're lightweight alerts that can be triggered flexibly from any workflow.

---

## What Was Built

### 1. Database Schema
**File**: `database/migrations/004_notifications.sql`

- `notifications` table with flexible JSONB metadata
- Priority levels (1=urgent with pulsing badge, 3=normal, 5=low)
- Notification types (task_requires_decision, overdue_alert, escalation_required, etc.)
- Auto-cleanup function for old read notifications
- Helper views (`unread_notifications`, `urgent_notifications`)
- Sample data for testing

**Key Features**:
- Links to customers, tasks, workflow executions
- Rich metadata for navigation context
- Type constraints for consistency
- Optimized indexes for performance

### 2. Notification Processor
**File**: `workflow-engine/notificationProcessor.js`

**Responsibilities**:
- Evaluate conditional logic (`{{eq workflow.daysOverdue 7}}`)
- Resolve template variables (`{{customer.name}} is {{workflow.daysOverdue}} days overdue`)
- Send notifications to multiple recipients
- Process notifications from step configs and action results
- Support Handlebars helpers (gte, lte, eq, and, or, abs)

**Key Functions**:
```javascript
processNotifications(step, context)        // Process step notifications
processActionNotification(result, context) // Process action notifications
sendNotification(email, notification)      // One-off manual sending
evaluateCondition(condition, context)      // Test conditions
resolveTemplate(template, context)         // Resolve variables
```

### 3. REST API
**File**: `api/notifications.js`

**Endpoints**:
- `GET /api/notifications` - Fetch user notifications (with unread first sorting)
- `GET /api/notifications/unread-count` - Get badge count
- `PATCH /api/notifications/:id` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications` - Create notification (manual/system)
- `GET /api/notifications/summary` - Get counts by type/priority

**Features**:
- Authentication middleware
- Pagination support
- Unread filtering
- Rich response with customer/task/workflow data

### 4. Frontend Hook
**File**: `hooks/useNotifications.ts` (copy to frontend)

**Features**:
- Auto-polling every 60 seconds
- Unread count tracking
- Mark as read functionality
- Grouping by notification type
- New notification detection
- Error handling

**Usage**:
```tsx
const { notifications, unreadCount, markAsRead, hasUnreadUrgent } = useNotifications();
```

### 5. Documentation

#### `NOTIFICATION_SYSTEM.md`
Comprehensive guide covering:
- Adding notifications to workflow configs
- Template variable reference
- Conditional sending logic
- Priority levels and types
- Metadata for navigation
- Best practices
- Testing strategies

#### `APPLAYOUT_NOTIFICATION_INTEGRATION.md`
Step-by-step guide for wiring notifications into AppLayout:
- Replace sample reminders with real notifications
- Update bell icon and badge
- Add click navigation handlers
- Show loading/empty states
- Style urgent notifications with pulsing effect

#### `WORKFLOW_NOTIFICATION_EXAMPLES.md`
Complete examples:
- Overdue workflow day-based escalation
- Emergency manager acknowledgment
- War room creation notifications
- Task deadline reminders
- AI recommendations

---

## How It Works

### Architecture Flow

```
1. Workflow Step Config (with notifications array)
       ↓
2. Workflow Engine executes step
       ↓
3. notificationProcessor.js evaluates conditions
       ↓
4. Template variables resolved ({{customer.name}}, etc.)
       ↓
5. POST /api/notifications creates notification
       ↓
6. useNotifications hook polls API (every 60s)
       ↓
7. AppLayout bell icon displays badge with count
       ↓
8. User clicks notification → navigates to customer page
```

### Example Workflow Config

```typescript
{
  id: 'grace-period-management',
  name: 'Grace Period Management',

  // Flexible notifications array
  notifications: [
    {
      condition: '{{eq workflow.daysOverdue 15}}',  // When to send
      type: 'escalation_required',                   // Notification type
      title: '🚨 VP CS Involvement Required',         // Title
      message: '{{customer.name}} (${{customer.arr}}) is 15 days overdue',
      priority: 1,                                   // Urgent (pulsing red)
      recipients: ['{{csm.email}}', '{{company.vpCustomerSuccess}}'],
      metadata: {                                     // For navigation
        customerId: '{{customer.id}}',
        daysOverdue: 15,
        escalationLevel: 'vp_cs'
      }
    }
  ]
}
```

### Example Action Notification

```typescript
actions: [
  {
    id: 'create-war-room',
    label: 'Create War Room',

    onExecute: {
      apiEndpoint: 'POST /api/war-rooms/create',

      onSuccess: {
        sendNotification: {
          type: 'workflow_started',
          title: 'War Room Activated',
          message: 'War room created for {{customer.name}}',
          priority: 1,
          recipients: ['{{csm.email}}', '{{csm.manager}}']
        }
      }
    }
  }
]
```

---

## Key Features

### ✅ Flexible Triggers
- Conditional sending based on workflow state
- Day-based triggers (Day 7, 15, 30)
- ARR-based thresholds
- Account plan detection
- Combine multiple conditions with AND/OR

### ✅ Template-Driven
- Dynamic content using Handlebars
- Access to customer, CSM, workflow, company data
- Helpers for math and logic (gte, eq, abs, etc.)
- Multi-recipient support with conditionals

### ✅ Priority System
```
1 = Urgent     → Red pulsing badge (manager ack, CEO alerts, war rooms)
2 = High       → Red badge (important escalations)
3 = Normal     → Blue badge (routine tasks)
4 = Low        → Gray badge (AI recommendations)
5 = Info       → Gray badge (nice-to-know)
```

### ✅ Rich Metadata
```typescript
metadata: {
  customerId: '{{customer.id}}',           // For navigation
  workflowStage: '{{workflow.currentStage}}',
  daysOverdue: '{{workflow.daysOverdue}}',
  arr: '{{customer.arr}}',
  escalationLevel: 'vp_cs',
  requiresAcknowledgment: true
}
```

### ✅ Multiple Notification Types
```
- task_requires_decision      (CSM must act)
- task_deadline_approaching   (Deadline warning)
- workflow_started            (New workflow triggered)
- escalation_required         (Team escalation)
- overdue_alert               (Something overdue)
- key_task_pending            (Important task)
- recommendation_available    (AI suggestion)
- approval_needed             (Manager approval)
```

### ✅ Auto-Polling Frontend
- Fetches new notifications every 60 seconds
- Shows unread count in badge
- Pulsing effect for urgent items
- Click to navigate to context
- Mark as read on click
- Delete individual notifications

---

## Integration Steps

### Backend Integration

1. **Run Database Migration**:
   ```bash
   psql -U postgres -d renubu < database/migrations/004_notifications.sql
   ```

2. **Add Notification API Routes**:
   ```javascript
   const notificationRoutes = require('./api/notifications');
   app.use('/api', notificationRoutes);
   ```

3. **Integrate into Workflow Engine**:
   ```javascript
   const { processNotifications } = require('./workflow-engine/notificationProcessor');

   async function executeWorkflowStep(step, context) {
     // ... execute step logic ...

     // Process notifications
     await processNotifications(step, context);
   }
   ```

4. **Add Notifications to Workflow Configs**:
   - See `WORKFLOW_NOTIFICATION_EXAMPLES.md` for complete examples
   - Add `notifications` array to any workflow step
   - Use conditions to control when to send

### Frontend Integration

1. **Copy useNotifications Hook**:
   - Source: `/automation/hooks/useNotifications.ts`
   - Destination: `/renubu/src/hooks/useNotifications.ts`

2. **Update AppLayout**:
   - Follow `APPLAYOUT_NOTIFICATION_INTEGRATION.md`
   - Replace sample reminders with real notifications
   - Add navigation handlers
   - Style urgent notifications

3. **Test**:
   - Create test notification in database
   - Verify badge shows count
   - Verify click navigation works
   - Verify mark as read decreases count
   - Verify auto-polling fetches new notifications

---

## Use Cases Enabled

### 1. Overdue Day-Based Escalation
- Day 7: Manager FYI → Normal priority
- Day 15: VP CS involvement → Urgent priority
- Day 30: War room → Urgent priority with CEO notification

### 2. Emergency Manager Acknowledgment
- Manager gets urgent notification requiring acknowledgment
- CSM notified when manager acknowledges
- CEO notified for high-value renewals (>$250K)

### 3. Strategic Account Alerts
- Account plan detection lowers thresholds
- Full account team notified
- Accelerated escalation timeline (7 days earlier)

### 4. Task Deadline Reminders
- QBR scheduled tomorrow → Normal priority
- Contract ends in 48 hours → Urgent priority
- No response for 5 days → Follow-up reminder

### 5. War Room Activation
- Notification when war room created
- Team Slack channel notification
- Daily standup reminders

### 6. AI Recommendations
- Price increase suggestions → Low priority
- Upsell opportunities → Low priority
- Usage pattern alerts → Normal priority

---

## Best Practices

### 1. Use Conditions to Avoid Spam
```typescript
// ✅ GOOD
condition: '{{eq workflow.daysOverdue 7}}'  // Only on day 7

// ❌ BAD
// No condition = sends every time step runs
```

### 2. Set Appropriate Priorities
```typescript
priority: 1  // Only for: Manager ack, CEO alerts, war rooms
priority: 3  // Most common: Routine tasks, reminders
priority: 4  // AI recommendations, nice-to-know
```

### 3. Include Rich Metadata
```typescript
metadata: {
  customerId: '{{customer.id}}',      // Required for navigation
  workflowStage: '{{workflow.currentStage}}',
  escalationLevel: 'vp_cs',
  requiresAction: true
}
```

### 4. Clear, Actionable Titles
```typescript
// ✅ GOOD
title: 'Manager Acknowledgment Required - 36 Hours Remaining'

// ❌ BAD
title: 'Renewal Update'
```

### 5. Conditional Recipients
```typescript
recipients: [
  '{{csm.email}}',
  '{{csm.manager}}',
  '{{#if (gte customer.arr 250000)}}{{company.ceo}}{{/if}}'
]
```

---

## Testing Checklist

### Backend Testing

- [ ] Database migration runs successfully
- [ ] `GET /api/notifications` returns notifications
- [ ] `POST /api/notifications` creates notification
- [ ] Condition evaluation works (`{{eq workflow.daysOverdue 7}}`)
- [ ] Template resolution works (`{{customer.name}}`)
- [ ] Recipients list resolves correctly
- [ ] Metadata stores rich context

### Frontend Testing

- [ ] useNotifications hook fetches notifications
- [ ] Badge shows unread count
- [ ] Urgent notifications have pulsing red badge
- [ ] Click notification navigates to customer page
- [ ] Mark as read decreases badge count
- [ ] Auto-polling fetches new notifications every 60s
- [ ] Empty state shows when no notifications
- [ ] Loading state shows during fetch

### Integration Testing

- [ ] Trigger workflow with notification config
- [ ] Notification appears in bell icon
- [ ] Click navigates to correct customer
- [ ] Multiple recipients all receive notification
- [ ] Conditional logic works (account plan, ARR thresholds)
- [ ] Action notifications send on button click

---

## Next Steps

### Immediate
1. Run database migration
2. Wire API routes
3. Update AppLayout with useNotifications hook
4. Test with manual notification insertion

### Short Term
1. Add notifications to Overdue workflow (Day 7, 15, 30 triggers)
2. Add notifications to Emergency workflow (manager ack)
3. Add notifications to Critical workflow (war room)
4. Test end-to-end with real workflow execution

### Future Enhancements
1. Browser push notifications (desktop alerts)
2. Email digest of unread notifications
3. Notification preferences (mute certain types)
4. Notification history/archive page
5. Mobile app notifications (if applicable)

---

## Files Created/Modified

### New Files
1. `database/migrations/004_notifications.sql` - Database schema
2. `workflow-engine/notificationProcessor.js` - Condition evaluation and sending
3. `api/notifications.js` - REST API endpoints
4. `hooks/useNotifications.ts` - Frontend hook (copy to frontend)
5. `docs/NOTIFICATION_SYSTEM.md` - Comprehensive usage guide
6. `docs/APPLAYOUT_NOTIFICATION_INTEGRATION.md` - Frontend integration guide
7. `docs/WORKFLOW_NOTIFICATION_EXAMPLES.md` - Complete workflow examples
8. `FLEXIBLE-NOTIFICATION-SYSTEM-SUMMARY.md` - This file

### Files to Modify
1. `/renubu/src/components/layout/AppLayout.tsx` - Replace sample reminders
2. Workflow configs (8-Critical.ts, 9-Emergency.ts, 10-Overdue.ts) - Add notifications arrays

---

## Summary

**Implemented a complete, flexible notification system** that:

✅ **Separates notifications from business logic** (escalations/reassignments)
✅ **Works with ANY workflow step or action**
✅ **Uses template variables for dynamic content**
✅ **Supports conditional sending** (only when needed)
✅ **Priority-based display** (urgent = pulsing red badge)
✅ **Rich metadata for navigation**
✅ **Auto-polling frontend** (60-second updates)
✅ **Fully documented** with examples

**Key Innovation**: Notifications are **not hardcoded** to specific scenarios like team escalations. They're a general-purpose communication system that can be flexibly configured in any workflow.

**User Benefit**: CSMs get timely, actionable alerts about critical tasks, deadlines, and escalations without being overwhelmed by noise.

**Next**: Wire the frontend AppLayout component and add notification configs to your workflow steps!
