# Workflow System API Contract

> **📅 FUTURE PLANNING DOCUMENT**
>
> **Status:** Planning Phase - NOT YET IMPLEMENTED
> **Target Date:** October 2025 (Week 5-6 Integration)
> **Purpose:** API contract definition for future 3-layer workflow orchestration system
>
> **Important:**
> - This describes a FUTURE system architecture
> - The current system uses different APIs (see current documentation)
> - Do NOT use this for current development
> - This is for planning and design partner discussions
>
> **Current Documentation:** See `docs/DOCUMENTATION_INDEX.md` for implemented systems
>
> ---

**Version:** 1.0
**Last Updated:** October 7, 2025
**Status:** Agreed between UI Engineer & Workflow Engineer

---

## Purpose

This document defines the **exact API contract** between the UI layer and the workflow orchestration backend. Both engineers use this as the source of truth during integration (Weeks 5-6).

---

## 🔗 API Endpoints

### Base URL
```
Development: http://localhost:3000/api
Production: https://app.renubu.com/api
```

---

## 1. Get Workflow Queue

**Get prioritized workflow queue for a CSM**

```http
GET /workflows/queue/{csmId}
```

### Parameters
- `csmId` (path): CSM user ID

### Response
```json
{
  "workflows": [
    {
      "id": "wf-12345",
      "customerId": "cust-123",
      "customer": {
        "id": "cust-123",
        "name": "Acme Corporation",
        "domain": "acme.com",
        "arr": 500000,
        "renewalDate": "2025-12-31",
        "owner": {
          "id": "csm-456",
          "name": "Sarah Johnson",
          "email": "sarah@company.com"
        }
      },
      "workflow": {
        "type": "emergency-renewal",
        "stage": "Emergency",
        "priorityScore": 287,
        "assignedTo": "sarah@company.com",
        "status": "pending",
        "daysUntilRenewal": 3
      },
      "intelligence": {
        "riskScore": 72,
        "healthScore": 65,
        "sentiment": "declining",
        "aiSummary": "Customer shows declining engagement with 23% drop in usage..."
      }
    }
  ],
  "stats": {
    "totalWorkflows": 8,
    "pending": 5,
    "inProgress": 2,
    "completedToday": 1
  }
}
```

---

## 2. Start Workflow

**Initialize a workflow (changes status from 'pending' to 'in_progress')**

```http
POST /workflows/{workflowId}/start
```

### Request Body
```json
{
  "csmId": "csm-456",
  "startedAt": "2025-10-07T14:00:00Z"
}
```

### Response
```json
{
  "success": true,
  "workflow": {
    "id": "wf-12345",
    "status": "in_progress",
    "currentStep": {
      "id": "analyze-arr-performance",
      "name": "Analyze ARR Performance",
      "estimatedTime": "15min"
    },
    "startedAt": "2025-10-07T14:00:00Z"
  }
}
```

---

## 3. Get Workflow Context

**Get complete customer context for variable injection**

```http
GET /workflows/{workflowId}/context
```

### Response
```json
{
  "customer": {
    "id": "cust-123",
    "name": "Acme Corporation",
    "domain": "acme.com",
    "arr": 500000,
    "renewalDate": "2025-12-31",
    "contractStart": "2024-01-01",
    "owner": {
      "id": "csm-456",
      "name": "Sarah Johnson",
      "email": "sarah@company.com"
    }
  },

  "intelligence": {
    "riskScore": 72,
    "healthScore": 65,
    "sentiment": "declining",
    "aiSummary": "Customer shows declining engagement with 23% drop in usage over 3 months. However, recent expansion hiring suggests potential upsell opportunity.",
    "insights": [
      {
        "type": "risk",
        "severity": "high",
        "message": "Missed 3 scheduled meetings in past month",
        "dataPoint": "calendar_engagement"
      },
      {
        "type": "opportunity",
        "severity": "medium",
        "message": "Team size increased 30% in Q2",
        "dataPoint": "headcount_growth"
      }
    ],
    "recommendations": [
      "Schedule executive alignment call within 2 weeks",
      "Review product roadmap alignment",
      "Explore expansion into new departments"
    ]
  },

  "data": {
    "salesforce": {
      "opportunities": [
        {
          "id": "opp-789",
          "stage": "Renewal",
          "amount": 500000,
          "closeDate": "2025-12-31"
        }
      ],
      "cases": [
        {
          "id": "case-101",
          "subject": "Login issues",
          "status": "resolved",
          "priority": "high"
        }
      ],
      "contacts": [
        {
          "name": "John Smith",
          "role": "VP Engineering",
          "email": "john@acme.com"
        }
      ]
    },

    "usage": {
      "activeUsers": 45,
      "licensedUsers": 50,
      "utilizationRate": 0.9,
      "trend": "down",
      "changePercent": -23,
      "lastActivity": "2025-10-05",
      "featureAdoption": {
        "corePlatform": 0.95,
        "advancedFeatures": 0.34,
        "integrations": 0.67
      }
    },

    "financials": {
      "currentARR": 500000,
      "arrHistory": [
        { "date": "2025-09-01", "arr": 500000 },
        { "date": "2025-06-01", "arr": 480000 },
        { "date": "2025-03-01", "arr": 450000 }
      ],
      "paymentHistory": [
        {
          "date": "2025-01-01",
          "amount": 125000,
          "status": "paid",
          "daysLate": 0
        }
      ],
      "outstandingInvoices": []
    },

    "engagement": {
      "lastMeeting": "2025-09-15",
      "meetingFrequency": "monthly",
      "responseTime": "2.3 days avg",
      "supportTickets": {
        "open": 2,
        "resolved": 45,
        "avgResolutionTime": "1.2 days"
      },
      "qbrStatus": {
        "lastQBR": "2025-07-15",
        "nextQBR": "2025-10-15",
        "completed": true
      }
    }
  },

  "workflow": {
    "stage": "Emergency",
    "stageName": "Emergency Response Phase",
    "daysUntilRenewal": 3,
    "priorityScore": 287,
    "priorityFactors": {
      "arrMultiplier": 2.0,
      "urgencyScore": 90,
      "accountPlanMultiplier": 1.5
    },
    "assignedAt": "2025-10-07T10:00:00Z",
    "startedAt": "2025-10-07T14:00:00Z",
    "estimatedCompletion": "2025-10-08T17:00:00Z"
  }
}
```

---

## 4. Complete Step

**Mark a workflow step as complete**

```http
POST /workflows/{workflowId}/steps/{stepId}/complete
```

### Request Body
```json
{
  "stepId": "analyze-arr-performance",
  "completedAt": "2025-10-07T14:30:00Z",
  "duration": 847,
  "status": "completed",
  "outputs": {
    "decision": "proceed",
    "notes": "Customer ARR growth looks healthy. Usage decline is concerning but likely due to seasonal factors. Recommend monitoring for another month before escalating.",
    "tags": ["healthy", "monitor", "seasonal-variance"],
    "artifacts": [
      {
        "id": "arr-report-123",
        "type": "report",
        "title": "ARR Performance Analysis",
        "content": {},
        "generatedBy": "ai"
      }
    ],
    "nextActions": [
      {
        "type": "task",
        "description": "Schedule renewal strategy call",
        "dueDate": "2025-10-15",
        "priority": "high"
      },
      {
        "type": "reminder",
        "description": "Check usage metrics again in 30 days",
        "dueDate": "2025-11-07"
      }
    ],
    "customData": {
      "arrGrowthRate": 0.15,
      "confidenceLevel": "high",
      "benchmarkComparison": "above_average"
    }
  },
  "completedBy": "sarah@company.com"
}
```

### Response
```json
{
  "success": true,
  "message": "Step completed successfully",
  "workflow": {
    "id": "wf-12345",
    "status": "in_progress",
    "currentStep": {
      "id": "review-health-indicators",
      "name": "Review Health Indicators",
      "estimatedTime": "10min"
    },
    "completedSteps": ["analyze-arr-performance"],
    "progress": 0.25,
    "context": {}
  },
  "suggestions": {
    "skipRecommended": false,
    "escalationNeeded": false,
    "estimatedTimeRemaining": "45min"
  }
}
```

---

## 5. Complete Workflow

**Mark entire workflow as complete**

```http
POST /workflows/{workflowId}/complete
```

### Request Body
```json
{
  "completedAt": "2025-10-07T15:30:00Z",
  "totalDuration": 5400,
  "status": "success",
  "outcomes": {
    "status": "success",
    "nextSteps": [
      "Follow up after executive call",
      "Send renewal proposal by 10/15"
    ],
    "confidence": "high",
    "notes": "Workflow completed successfully. Customer receptive to renewal discussion.",
    "artifacts": [
      {
        "id": "renewal-plan-456",
        "type": "plan",
        "title": "Acme Corp Renewal Strategy"
      }
    ]
  },
  "completedBy": "sarah@company.com"
}
```

### Response
```json
{
  "success": true,
  "message": "Workflow completed successfully",
  "workflow": {
    "id": "wf-12345",
    "status": "completed",
    "completedAt": "2025-10-07T15:30:00Z",
    "totalDuration": 5400,
    "stats": {
      "stepsCompleted": 4,
      "stepsSkipped": 0,
      "avgStepDuration": 1350
    }
  },
  "nextWorkflow": {
    "id": "wf-67890",
    "customerId": "cust-456",
    "customer": {
      "name": "TechCo Inc",
      "domain": "techco.com"
    },
    "priorityScore": 156
  }
}
```

---

## 📝 Variable Injection Reference

### Syntax
```
{{path.to.value}}
```

### Supported Paths

```javascript
// Customer info
{{customer.name}}                    // "Acme Corporation"
{{customer.domain}}                  // "acme.com"
{{customer.arr}}                     // 500000
{{customer.renewalDate}}             // "2025-12-31"
{{customer.owner.name}}              // "Sarah Johnson"
{{customer.owner.email}}             // "sarah@company.com"

// Intelligence (AI-generated)
{{intelligence.riskScore}}           // 72
{{intelligence.healthScore}}         // 65
{{intelligence.sentiment}}           // "declining"
{{intelligence.aiSummary}}           // Full text
{{intelligence.insights[0].message}} // First insight
{{intelligence.recommendations[0]}}  // First recommendation

// Usage data
{{data.usage.activeUsers}}           // 45
{{data.usage.licensedUsers}}         // 50
{{data.usage.trend}}                 // "down"
{{data.usage.changePercent}}         // -23
{{data.usage.featureAdoption.corePlatform}} // 0.95

// Financial data
{{data.financials.currentARR}}       // 500000
{{data.financials.arrHistory[0].arr}}// 500000 (latest)
{{data.financials.paymentHistory[0].status}} // "paid"

// Salesforce data
{{data.salesforce.opportunities[0].stage}}    // "Renewal"
{{data.salesforce.opportunities[0].amount}}   // 500000
{{data.salesforce.contacts[0].name}}          // "John Smith"
{{data.salesforce.contacts[0].role}}          // "VP Engineering"

// Engagement data
{{data.engagement.lastMeeting}}              // "2025-09-15"
{{data.engagement.supportTickets.open}}      // 2
{{data.engagement.qbrStatus.lastQBR}}        // "2025-07-15"

// Workflow metadata
{{workflow.stage}}                   // "Emergency"
{{workflow.daysUntilRenewal}}        // 3
{{workflow.priorityScore}}           // 287
{{workflow.assignedAt}}              // "2025-10-07T10:00:00Z"
```

---

## 🔐 Authentication

All API requests must include:

```http
Authorization: Bearer {jwt_token}
```

Backend validates:
- Token is valid
- User has access to the workflow
- CSM is assigned to the workflow (for sensitive operations)

---

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow with ID wf-12345 not found",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `WORKFLOW_NOT_FOUND` | 404 | Workflow ID doesn't exist |
| `UNAUTHORIZED` | 401 | Invalid or missing auth token |
| `FORBIDDEN` | 403 | User doesn't have access to workflow |
| `INVALID_STEP` | 400 | Step ID not valid for this workflow |
| `WORKFLOW_ALREADY_STARTED` | 409 | Workflow already in progress |
| `WORKFLOW_COMPLETED` | 409 | Can't modify completed workflow |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `SERVER_ERROR` | 500 | Internal server error |

---

## 🧪 Testing

### Mock Data Endpoints (Development Only)

```http
GET /workflows/mock/queue/{csmId}
GET /workflows/mock/{workflowId}/context
```

These endpoints return static mock data for UI development before backend is fully integrated.

---

## 🔄 Real-Time Updates

### MVP Approach (Week 5-6)
**Synchronous responses** - All POST requests return updated workflow state immediately.

UI updates by reading the response:
```javascript
const response = await fetch('/api/workflows/wf-123/steps/step-1/complete', {
  method: 'POST',
  body: JSON.stringify(outcomes)
});

const { workflow } = await response.json();
// workflow.currentStep has next step
// Update UI based on response
```

### Future Enhancement
**WebSocket** for dashboard updates (new workflows assigned, priority changes).

**Step completion remains synchronous** for reliability.

---

## 📚 Implementation Reference

### Frontend: WorkflowService.ts

```typescript
// lib/services/WorkflowService.ts
class WorkflowService {
  private baseUrl = '/api/workflows';

  async getWorkflowQueue(csmId: string) {
    const response = await fetch(`${this.baseUrl}/queue/${csmId}`);
    if (!response.ok) throw new Error('Failed to fetch queue');
    return response.json();
  }

  async startWorkflow(workflowId: string, csmId: string) {
    const response = await fetch(`${this.baseUrl}/${workflowId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csmId, startedAt: new Date().toISOString() })
    });
    if (!response.ok) throw new Error('Failed to start workflow');
    return response.json();
  }

  async getWorkflowContext(workflowId: string) {
    const response = await fetch(`${this.baseUrl}/${workflowId}/context`);
    if (!response.ok) throw new Error('Failed to fetch context');
    return response.json();
  }

  async completeStep(workflowId: string, stepId: string, outcomes: StepOutcomes) {
    const response = await fetch(
      `${this.baseUrl}/${workflowId}/steps/${stepId}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outcomes)
      }
    );
    if (!response.ok) throw new Error('Failed to complete step');
    return response.json();
  }

  async completeWorkflow(workflowId: string, outcomes: WorkflowOutcomes) {
    const response = await fetch(`${this.baseUrl}/${workflowId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outcomes)
    });
    if (!response.ok) throw new Error('Failed to complete workflow');
    return response.json();
  }
}

export const workflowService = new WorkflowService();
```

---

## 🎯 Integration Checklist

### Week 4 Preparation
- [ ] Backend engineer implements mock endpoints
- [ ] UI engineer creates WorkflowService.ts
- [ ] Test with mock data (no real backend yet)
- [ ] Validate variable injection works with mock context

### Week 5-6 Integration
- [ ] Backend engineer implements real endpoints
- [ ] Backend engineer builds data ingestion pipeline
- [ ] UI engineer connects to real endpoints
- [ ] End-to-end test: Queue → Start → Complete step → Complete workflow
- [ ] Validate all variable paths work with real data
- [ ] Test error handling

### Week 8 Production
- [ ] Load testing (50+ workflows in queue)
- [ ] Error handling comprehensive
- [ ] Authentication working
- [ ] Performance acceptable (<2s queue load)

---

**Last Updated:** October 7, 2025
**Status:** Agreed - Ready for Implementation
**Next Review:** Week 4 Integration Meeting
