# Workflow Queue API

## Overview

API endpoint that connects the automation system's workflow orchestrator to the frontend dashboard. Returns prioritized workflow assignments for a specific CSM.

**Status**: ✅ Ready for integration

---

## API Endpoint

### Get Workflow Queue for CSM

```
GET /api/workflows/queue/[csmId]?companyId={companyId}
```

**Parameters**:
- `csmId` (path): CSM/User ID to get workflows for
- `companyId` (query): Company ID to filter workflows

**Auth**: Required (uses server-side Supabase auth)

**Response**:
```json
{
  "success": true,
  "csmId": "user-123",
  "companyId": "company-456",
  "totalWorkflows": 12,
  "stats": {
    "total": 12,
    "byType": {
      "renewal": 8,
      "strategic": 2,
      "opportunity": 1,
      "risk": 1
    },
    "byStage": {
      "critical": 3,
      "emergency": 2,
      "overdue": 1,
      "active": 4
    },
    "byAccountPlan": {
      "invest": 5,
      "expand": 3,
      "manage": 2,
      "monitor": 2
    },
    "uniqueCustomers": 8,
    "avgPriority": 245,
    "priorityRange": {
      "min": 120,
      "max": 450
    }
  },
  "workflows": [
    {
      "workflow": {
        "id": "wf-uuid-123",
        "type": "renewal",
        "status": "pending",
        "priorityScore": 450,
        "priorityFactors": {
          "base_score": 300,
          "arr_multiplier": 1.5,
          "urgency_score": 100,
          "stage_bonus": 50,
          "account_plan_multiplier": 1.0
        },
        "config": {
          "stage": "critical",
          "template": "renewal-critical"
        },
        "metadata": {
          "renewal_stage": "critical",
          "days_until_renewal": 5,
          "arr": 150000,
          "generated_at": "2025-10-09T10:30:00Z"
        }
      },
      "customer": {
        "id": "cust-123",
        "domain": "acme.com",
        "arr": 150000,
        "renewalDate": "2025-10-14",
        "owner": "user-123"
      },
      "context": {
        "daysUntilRenewal": 5,
        "renewalStage": "critical",
        "accountPlan": "invest",
        "opportunityScore": null,
        "riskScore": null
      }
    }
    // ... more workflows (sorted by priority, highest first)
  ],
  "groupedByCustomer": [
    {
      "customerId": "cust-123",
      "customer": {
        "id": "cust-123",
        "domain": "acme.com",
        "arr": 150000,
        "renewalDate": "2025-10-14",
        "owner": "user-123"
      },
      "workflows": [
        // Array of workflow assignments for this customer
      ],
      "totalPriority": 600,
      "highestPriority": 450
    }
    // ... more customers
  ]
}
```

---

## How It Works

### 1. Data Flow

```
Frontend Dashboard
    ↓
API Endpoint (/api/workflows/queue/[csmId])
    ↓
Automation Orchestrator (workflow-orchestrator.js)
    ↓
Data Access Layer (workflow-data-access.js)
    ↓
SQLite Database (renubu-test.db)
```

### 2. Workflow Generation

The orchestrator:
1. Queries SQLite for customers needing workflows
2. Determines which workflow types each customer needs
3. Calculates priority scores based on multiple factors
4. Sorts by priority (highest first)
5. Returns enriched workflow assignments

### 3. Priority Scoring

Priority is calculated using:
- **Base Score**: Varies by workflow type and stage
- **ARR Multiplier**: Higher ARR = higher priority
  - $150k+: 1.5x
  - $100k-$150k: 1.3x
  - $50k-$100k: 1.2x
- **Urgency Score**: Based on days until renewal
  - Overdue: +100
  - Critical (< 7 days): +80
  - Emergency (7-14 days): +60
- **Stage Bonus**: Additional points for critical stages
- **Account Plan Multiplier**:
  - Invest: 1.5x
  - Expand: 1.3x
  - Manage: 1.0x
  - Monitor: 0.8x

---

## Frontend Integration

### Basic Usage

```typescript
import { useState, useEffect } from 'react';

interface Workflow {
  workflow: {
    id: string;
    type: string;
    priorityScore: number;
    config: any;
    metadata: any;
  };
  customer: {
    id: string;
    domain: string;
    arr: number;
    renewalDate: string;
  };
  context: {
    daysUntilRenewal: number;
    renewalStage: string;
    accountPlan: string;
  };
}

function DashboardPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const csmId = 'current-user-id'; // Get from auth context
    const companyId = 'company-id'; // Get from user's company

    fetch(`/api/workflows/queue/${csmId}?companyId=${companyId}`)
      .then(res => res.json())
      .then(data => {
        setWorkflows(data.workflows);
        setStats(data.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load workflow queue', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading workflow queue...</div>;

  return (
    <div>
      <h1>Workflow Queue</h1>
      <div className="stats">
        <div>Total Workflows: {stats.total}</div>
        <div>Unique Customers: {stats.uniqueCustomers}</div>
        <div>Avg Priority: {stats.avgPriority}</div>
      </div>

      <div className="workflow-list">
        {workflows.map(wf => (
          <div key={wf.workflow.id} className="workflow-card">
            <h3>{wf.customer.domain}</h3>
            <div>Type: {wf.workflow.type}</div>
            <div>Priority: {wf.workflow.priorityScore}</div>
            <div>Days Until Renewal: {wf.context.daysUntilRenewal}</div>
            <div>ARR: ${wf.customer.arr.toLocaleString()}</div>
            <button onClick={() => openWorkflow(wf)}>
              Start Workflow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Data Structures

### Workflow Assignment

```typescript
interface WorkflowAssignment {
  workflow: {
    id: string;
    type: 'renewal' | 'strategic' | 'opportunity' | 'risk';
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    priorityScore: number;
    priorityFactors: {
      base_score: number;
      arr_multiplier: number;
      urgency_score: number;
      stage_bonus: number;
      account_plan_multiplier: number;
    };
    config: {
      stage: string;
      template: string;
      [key: string]: any;
    };
    metadata: {
      renewal_stage: string;
      days_until_renewal: number;
      arr: number;
      generated_at: string;
      [key: string]: any;
    };
  };
  customer: {
    id: string;
    domain: string;
    arr: number;
    renewalDate: string;
    owner: string;
  };
  context: {
    daysUntilRenewal: number;
    renewalStage: string;
    accountPlan: string | null;
    opportunityScore: number | null;
    riskScore: number | null;
  };
}
```

### Stats Object

```typescript
interface WorkflowStats {
  total: number;
  byType: {
    renewal: number;
    strategic: number;
    opportunity: number;
    risk: number;
  };
  byStage: {
    [stage: string]: number;
  };
  byAccountPlan: {
    invest?: number;
    expand?: number;
    manage?: number;
    monitor?: number;
  };
  uniqueCustomers: number;
  avgPriority: number;
  priorityRange: {
    min: number;
    max: number;
  };
}
```

---

## Testing

### 1. Test with Existing Data

The automation system already has test data in `renubu-test.db`:

```bash
# Check available CSMs and customers
sqlite3 automation/renubu-test.db "SELECT DISTINCT owner FROM customers;"
sqlite3 automation/renubu-test.db "SELECT DISTINCT company_id FROM customers;"
```

### 2. Example API Call

```bash
# Get workflow queue for a CSM
curl "http://localhost:3000/api/workflows/queue/csm-123?companyId=company-456" \
  -H "Authorization: Bearer {token}"
```

### 3. Expected Response

Should return:
- Workflows sorted by priority (highest first)
- Each workflow includes customer data and context
- Stats summary with breakdowns by type, stage, and account plan
- Grouped view by customer (useful for showing "this customer has 3 workflows")

---

## Error Handling

### 400 Bad Request
```json
{
  "error": "companyId query parameter is required"
}
```
**Cause**: Missing companyId query parameter

---

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause**: Missing or invalid auth token

---

### 500 Internal Server Error

**Orchestrator not available:**
```json
{
  "error": "Workflow orchestrator not available"
}
```
**Cause**: Failed to load `workflow-orchestrator.js` module

**Database error:**
```json
{
  "error": "Failed to fetch customers from database"
}
```
**Cause**: SQLite database missing or corrupted

---

## Dependencies

The workflow queue API depends on:

1. **Automation Orchestrator**: `automation/workflow-orchestrator.js`
2. **Data Access Layer**: `automation/workflow-data-access.js`
3. **SQLite Database**: `automation/renubu-test.db`
4. **Supporting Modules**:
   - `workflow-determination.js` - Determines which workflows a customer needs
   - `workflow-scoring.js` - Calculates priority scores
   - `workflow-types.js` - Type definitions
   - `renewal-helpers.js` - Renewal stage calculation

---

## Next Steps

1. ✅ **Backend API Built** - Workflow queue endpoint ready
2. ⏳ **Frontend Dashboard** - Build UI to consume this API
3. ⏳ **Workflow Execution** - Connect to workflow execution system
4. ⏳ **Real-time Updates** - Add polling or WebSocket for live queue updates

---

## Files Created

**API**:
- `renubu/src/app/api/workflows/queue/[csmId]/route.ts`

**Documentation**:
- `automation/WORKFLOW_QUEUE_API.md` (this file)

---

## Support

For questions or issues:
1. Check this documentation
2. Review automation orchestrator: `workflow-orchestrator.js`
3. Test with automation test files: `test-task-5-orchestrator.js`
