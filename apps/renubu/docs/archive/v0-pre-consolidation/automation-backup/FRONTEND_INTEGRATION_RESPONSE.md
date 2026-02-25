# Frontend Integration - Questions Answered

Hey! Here are the answers to your 5 questions. Backend is ready to support you. 🚀

---

## 1. Metrics API ✅ Already Built

**Location:** `renubu/src/app/api/workflows/executions/[id]/metrics/route.ts`

**Status:** Fully implemented and ready to use!

**Endpoint:**
```
GET /api/workflows/executions/[executionId]/metrics
```

**What it does:**
- Fetches customer data from database (customer, contracts, renewals)
- Calculates metrics with business logic (health score, risk, ARR trends, urgency)
- Returns prioritized metrics array (sorted 1-10 by priority)
- Determines display config (colors, thresholds, status indicators)

**Response format:**
```json
{
  "metrics": [
    {
      "label": "ARR",
      "value": "$125,000",
      "sublabel": "+12% YoY",
      "status": "green",
      "trend": "up",
      "priority": 1
    },
    {
      "label": "Health Score",
      "value": "85%",
      "sublabel": "Healthy",
      "status": "green",
      "priority": 2
    },
    {
      "label": "Renewal",
      "value": "45 days",
      "sublabel": "Jun 15, 2025",
      "status": "yellow",
      "priority": 3
    }
    // ... more metrics sorted by priority
  ],
  "customerId": "uuid-here",
  "customerName": "Acme Corp"
}
```

**Business logic (already implemented):**
- Health Score: 80+ = green, 60-79 = yellow, <60 = red
- Risk Score: ≤3 = green, 4-6 = yellow, >6 = red
- Renewal Urgency: >90 days = green, 30-90 = yellow, <30 = red
- ARR Trend: >5% = up, <-5% = down, -5% to 5% = flat
- Priority sorting: 1 (ARR) → 2 (Health) → 3 (Renewal) → ... → 8 (Next Action)

**What you need to do:**
- Test the endpoint with a valid executionId
- Render the metrics in your UI (already sorted by priority)
- Use the `status` field for color coding (green/yellow/red/neutral)
- Use the `trend` field for arrow indicators (up/down/flat)

---

## 2. Context API Endpoint 🔨 Need to Build

**Recommendation:** Create `/api/workflows/context/[customerId]` for real-time customer context

**Why customerId (not executionId):**
- Notifications need current state (not historical execution)
- UI components need customer context before execution starts
- Template rendering needs live data (CSM, manager, company info)

**Endpoint to build:**
```
GET /api/workflows/context/[customerId]
```

**Response format (matches backend context builder):**
```json
{
  "customer": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "arr": 125000,
    "renewalDate": "2025-06-15",
    "contractTerm": 12,
    "industry": "Technology",
    "employeeCount": 500,
    "hasAccountPlan": true,
    "accountPlan": {
      "owner": "john@company.com",
      "ownerName": "John Doe",
      "team": "john@company.com,jane@company.com,bob@company.com",
      "lastUpdated": "2025-03-01"
    }
  },
  "csm": {
    "id": "uuid",
    "email": "carol@company.com",
    "name": "Carol Chen",
    "title": "Customer Success Manager",
    "manager": "alice@company.com",
    "managerName": "Alice Anderson",
    "managerTitle": "Director of Customer Success"
  },
  "workflow": {
    "executionId": "uuid-or-null",
    "currentStage": "overdue",
    "daysUntilRenewal": -15,
    "hoursUntilRenewal": -360,
    "renewalARR": 125000,
    "currentDate": "2025-06-30T00:00:00Z",
    "currentTimestamp": "2025-06-30T14:23:15Z",
    "isOverdue": true,
    "daysOverdue": 15
  },
  "company": {
    "name": "YourCompany",
    "vpCustomerSuccess": "john@company.com",
    "vpCustomerSuccessName": "John VP",
    "ceo": "ceo@company.com",
    "ceoName": "CEO Name",
    "csTeamEmail": "cs-team@company.com",
    "execTeamEmail": "exec-team@company.com"
  },
  "accountTeam": {
    "ae": "ae@company.com",
    "aeName": "Account Executive Name",
    "sa": "sa@company.com",
    "saName": "Solutions Architect Name",
    "executiveSponsor": "exec@company.com",
    "executiveSponsorName": "Executive Name",
    "allEmails": "ae@company.com,sa@company.com,exec@company.com,carol@company.com"
  }
}
```

**Backend reference implementation:**
See `automation/workflow-engine/workflowExecutor.js` function `buildWorkflowContext()` (lines 20-152) - this is exactly what we use to build context for notifications.

**I can build this API endpoint for you if needed - just confirm you want it!**

---

## 3. Test Customer UUIDs 🧪 Sample Data

Here are 3 test customer UUIDs you can use for hardcoding in test pages:

```typescript
// Test Customer 1: Healthy Strategic Account
const TEST_CUSTOMER_1 = {
  customerId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  name: 'Acme Corp',
  arr: 125000,
  daysUntilRenewal: 45,
  healthScore: 85,
  hasAccountPlan: true
};

// Test Customer 2: At-Risk Mid-Market
const TEST_CUSTOMER_2 = {
  customerId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  name: 'TechStart Inc',
  arr: 50000,
  daysUntilRenewal: 15,
  healthScore: 62,
  hasAccountPlan: false
};

// Test Customer 3: Critical Overdue Enterprise
const TEST_CUSTOMER_3 = {
  customerId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  name: 'Global Enterprises',
  arr: 500000,
  daysUntilRenewal: -15, // 15 days overdue
  healthScore: 45,
  hasAccountPlan: true
};
```

**Note:** These UUIDs are dummy data. When you're ready to test with real database:
1. Run database migrations (in `automation/database/migrations/`)
2. Migrations include sample customer data
3. Or create customers via your admin UI

---

## 4. Workflow Configs Location 📂 Files & Demo Recommendation

**Location:** `automation/renewal-configs/`

**Available workflows:**
1. `1-Onboarding.ts` - Customer onboarding (90+ days)
2. `2-Planning.ts` - QBR and account planning (60-90 days)
3. `3-PreRenewal.ts` - Pre-renewal kickoff (30-60 days)
4. `4-Active.ts` - Active renewal execution (15-30 days)
5. `5-Negotiation.ts` - Final negotiation (7-15 days)
6. `6-Closing.ts` - Contract closing (0-7 days)
7. `7-PostRenewal.ts` - Post-renewal follow-up (+1 to +7 days)
8. `8-Critical.ts` - Critical risk workflows
9. `9-Emergency.ts` - Emergency escalation (<24 hours)
10. `10-Overdue.ts` - Overdue administrative completion

**Recommended for demo: `10-Overdue.ts`**

**Why Overdue workflow:**
- ✅ Most comprehensive notification setup (7 notification triggers)
- ✅ Best examples of conditional notifications (`{{eq workflow.daysOverdue 15}}`)
- ✅ Shows escalation patterns (Manager → VP CS → War Room)
- ✅ Demonstrates dynamic recipients (CSM, manager, executives, account team)
- ✅ Priority-based notifications (1=urgent, 2=important, 3=normal)
- ✅ Rich metadata for navigation (customerId, daysOverdue, escalationLevel)

**Example notification from Overdue workflow:**
```typescript
// Day 15: VP CS Involvement Required
{
  condition: '{{eq workflow.daysOverdue 15}}',
  type: 'escalation_required',
  title: '🚨 VP CS Involvement Required',
  message: '{{customer.name}} (${{customer.arr}}) is 15 days overdue. VP CS has been looped in for strategic guidance.',
  priority: 1,  // Urgent - pulsing red badge
  recipients: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
  metadata: {
    customerId: '{{customer.id}}',
    daysOverdue: 15,
    arr: '{{customer.arr}}',
    escalationLevel: 'vp_cs'
  }
}
```

**File structure:**
```typescript
export const OverdueWorkflow: WorkflowConfig = {
  id: 'overdue',
  name: 'Overdue Renewal',
  trigger: { daysUntilRenewal: { max: -1 } },

  steps: [
    {
      id: 'overdue-status-check',
      name: 'Overdue Status Check',
      execution: { processor: 'processors/overdueStatus.js' },
      notifications: [ /* step notifications */ ]
    },
    {
      id: 'daily-follow-up',
      name: 'Daily Follow-Up',
      notifications: [
        // Day 7, 8, 15, 22, 30 notifications here
      ]
    }
  ]
};
```

---

## 5. Template Resolver 🔧 Handlebars Recommendation

**Backend uses:** Handlebars.js (`automation/workflow-engine/notificationProcessor.js`)

**Recommendation:** Use Handlebars on frontend for consistency

**Why Handlebars:**
- ✅ Same syntax across backend and frontend
- ✅ Already implemented and tested on backend
- ✅ Better performance (precompilation)
- ✅ 13M+ weekly downloads, industry standard
- ✅ Frontend native support (no extra dependencies needed)

**Install:**
```bash
npm install handlebars
```

**Usage example:**
```typescript
import Handlebars from 'handlebars';

// Register helpers (same as backend)
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('gte', (a, b) => a >= b);
Handlebars.registerHelper('lte', (a, b) => a <= b);
Handlebars.registerHelper('and', (...args) => args.slice(0, -1).every(Boolean));
Handlebars.registerHelper('or', (...args) => args.slice(0, -1).some(Boolean));
Handlebars.registerHelper('abs', (val) => Math.abs(val));

// Resolve template
function resolveTemplate(template: string, context: any): string {
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(context);
}

// Example
const context = {
  customer: { name: 'Acme Corp', arr: 125000 },
  workflow: { daysOverdue: 15 }
};

const message = resolveTemplate(
  '{{customer.name}} (${{customer.arr}}) is {{workflow.daysOverdue}} days overdue',
  context
);
// Result: "Acme Corp ($125000) is 15 days overdue"

// Evaluate condition
const condition = '{{eq workflow.daysOverdue 15}}';
const shouldShow = Boolean(Handlebars.compile(condition)(context));
// Result: true (because daysOverdue === 15)
```

**All notification templates use this syntax:**
- Variables: `{{customer.name}}`, `{{csm.email}}`
- Conditionals: `{{eq a b}}`, `{{gte a b}}`, `{{and (eq a 5) (gte b 10)}}`
- Blocks: `{{#if customer.hasAccountPlan}}Show this{{/if}}`
- Recipient lists: `['{{csm.email}}', '{{csm.manager}}']`

**Alternative (if you prefer):**
You could use a custom JavaScript resolver, but you'd need to:
1. Rewrite all 14 notification configs in new syntax
2. Maintain separate syntax from backend
3. Handle all edge cases (nested objects, arrays, conditionals)

**My recommendation:** Stick with Handlebars - it's already working and tested!

---

## Integration Timeline Estimate

**Backend tasks (2 hours):**
- ✅ Metrics API - Already done
- 🔨 Context API - Build `/api/workflows/context/[customerId]` endpoint (1 hour)
- 🔨 Sample data - Create test customers in database (30 min)
- ✅ Notification API - Already done (`automation/api/notifications.js`)
- 🔨 Mount routes - Wire notification API into Express server (30 min)

**Frontend tasks (3-4 hours):**
- Install Handlebars (5 min)
- Create Handlebars helper utility (30 min)
- Fetch context from API (15 min)
- Resolve notification templates (30 min)
- Update AppLayout with real notifications (1 hour)
- Test notification display and navigation (1-1.5 hours)

**Total:** 5-6 hours end-to-end

---

## Next Steps

**Ready to start when you confirm:**

1. **Do you want me to build the context API?**
   - I can create `/api/workflows/context/[customerId]` endpoint in Next.js
   - Should match backend context structure exactly
   - 1 hour to build and test

2. **Which approach do you prefer?**
   - **Option A:** Full API approach (context API + notification API)
   - **Option B:** Import workflow configs directly (faster, less HTTP calls)

3. **When do you want to run database migrations?**
   - Needed for: notifications table, org hierarchy, workflow executions
   - Migrations are ready in `automation/database/migrations/`
   - Can run now or wait until frontend UI is ready

**Let me know and I'll get started!** 🚀

---

## Useful Files for Reference

**Backend notification system:**
- `automation/workflow-engine/notificationProcessor.js` - Template resolver
- `automation/workflow-engine/workflowExecutor.js` - Context builder (lines 20-152)
- `automation/api/notifications.js` - REST API endpoints
- `automation/renewal-configs/10-Overdue.ts` - Example workflow with 7 notifications

**Documentation:**
- `automation/docs/NOTIFICATION_SYSTEM.md` - Comprehensive guide
- `automation/docs/APPLAYOUT_NOTIFICATION_INTEGRATION.md` - Frontend integration steps
- `automation/NOTIFICATION_BACKEND_INTEGRATION_COMPLETE.md` - Backend summary

**Database:**
- `automation/database/migrations/004_notifications.sql` - Notifications schema
- `automation/database/migrations/003_organizational_hierarchy.sql` - Org structure

Happy to pair program or answer any questions! 👍
