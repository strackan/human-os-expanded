# Frontend Integration Update - Database-Driven Workflows

Hey! Quick update on the architecture decision:

## Decision: Option A (Full API Approach)

We're going with **database-driven workflows** instead of TypeScript imports. This gives us flexibility for the builder UI and custom workflows down the road.

## What This Means for You

### ✅ No Changes to Your Integration

1. **Context API** - Ready now: `GET /api/workflows/context/[customerId]`
2. **Workflow API** - Coming soon: `GET /api/workflows/[workflowId]?tenantId=[tenantId]`
3. **Template resolution** - Same Handlebars approach we discussed
4. **Response format** - Same WorkflowConfig structure

### 📋 Your Integration Steps (Unchanged)

```typescript
// 1. Fetch context (available now)
const { context } = await fetch(`/api/workflows/context/${customerId}`);

// 2. Fetch workflow (available in 6-8 hours)
const { workflow } = await fetch(`/api/workflows/overdue?tenantId=${tenantId}`);

// 3. Resolve notifications (same as before)
const resolved = resolveNotification(workflow.steps[0].notifications[0], context);
```

### 🚀 You Can Start Now

**Use mock workflow data while we finish conversion:**

```typescript
// Temporary mock (replace with API call later)
const mockOverdueWorkflow = {
  id: 'overdue',
  name: 'Overdue Renewal',
  steps: [{
    id: 'daily-follow-up',
    name: 'Daily Follow-Up',
    notifications: [
      {
        condition: '{{eq workflow.daysOverdue 15}}',
        type: 'escalation_required',
        title: '🚨 VP CS Involvement Required',
        message: '{{customer.name}} (${{customer.arr}}) is 15 days overdue. VP CS has been looped in for strategic guidance.',
        priority: 1,
        recipients: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
        metadata: {
          customerId: '{{customer.id}}',
          daysOverdue: 15,
          arr: '{{customer.arr}}',
          escalationLevel: 'vp_cs'
        }
      },
      {
        condition: '{{eq workflow.daysOverdue 7}}',
        type: 'manager_notification',
        title: 'FYI: Renewal 7 Days Overdue',
        message: '{{customer.name}} renewal is 7 days past due. CSM {{csm.name}} is following up.',
        priority: 3,
        recipients: ['{{csm.manager}}'],
        metadata: {
          customerId: '{{customer.id}}',
          daysOverdue: 7
        }
      }
    ]
  }]
};
```

**Build the UI now:**
- ✅ Install Handlebars: `npm install handlebars`
- ✅ Create Handlebars utility with helpers
- ✅ Build notification display component
- ✅ Update AppLayout with notification bell
- ✅ Implement template resolution logic

**When workflow API is ready (6-8 hours):**
- 🔄 Swap mock data for API call (15 minutes)

```typescript
// Replace mock with:
const response = await fetch(`/api/workflows/overdue?tenantId=${tenantId}`);
const { workflow } = await response.json();
```

### 📅 Timeline

- **Now**: Context API ready, start UI development
- **6-8 hours**: Workflow API ready, swap to real data
- **No blockers**: You have everything needed to build

### 🎯 Why This Approach

**Immediate benefits:**
- ✅ Builder UI ready (customers can create custom workflows)
- ✅ LLM integration ready (generate workflows on the fly)
- ✅ Per-customer customization built in
- ✅ No frontend rebuild when workflows change

**Technical benefits:**
- Same API contract - backend implementation doesn't affect you
- Database = single source of truth
- Core workflows still protected (marked `is_core`)
- Easy version control and audit trail

### 📚 Handlebars Setup

**Install and configure:**

```bash
npm install handlebars
```

**Create helper utility** (`utils/handlebarsHelpers.ts`):

```typescript
import Handlebars from 'handlebars';

// Register helpers (one-time setup)
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('gte', (a, b) => a >= b);
Handlebars.registerHelper('lte', (a, b) => a <= b);
Handlebars.registerHelper('and', (...args) => args.slice(0, -1).every(Boolean));
Handlebars.registerHelper('or', (...args) => args.slice(0, -1).some(Boolean));
Handlebars.registerHelper('abs', (val) => Math.abs(val));

export function resolveTemplate(template: string, context: any): string {
  const compiled = Handlebars.compile(template);
  return compiled(context);
}

export function evaluateCondition(condition: string, context: any): boolean {
  const compiled = Handlebars.compile(condition);
  return Boolean(compiled(context));
}
```

**Use in components:**

```typescript
import { resolveTemplate, evaluateCondition } from '@/utils/handlebarsHelpers';

// Evaluate condition
const shouldShow = evaluateCondition(notification.condition, context);

// Resolve templates
if (shouldShow) {
  const title = resolveTemplate(notification.title, context);
  const message = resolveTemplate(notification.message, context);

  // Display notification...
}
```

### 🧪 Test Data

Use these test customer IDs (from earlier):

```typescript
const TEST_CUSTOMERS = {
  healthy: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  atRisk: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  critical: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'
};
```

### ❓ Questions?

Let me know if you need anything. Context API is live and tested!

**API Endpoints Summary:**
- ✅ `GET /api/workflows/context/[customerId]` - Ready now
- 🔄 `GET /api/workflows/[workflowId]?tenantId=[tenantId]` - Ready in 6-8 hours
- ✅ `GET /api/workflows/executions/[id]/metrics` - Already built (metrics display)

You're unblocked to start building! 🚀
