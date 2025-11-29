# Chat API Guide

## Overview

The Chat API system supports the **hybrid chat model** with both static (fixed) and dynamic (LLM-powered) conversation paths within workflows.

**Status**: ✅ All APIs built and ready for testing

---

## API Endpoints

### 1. Branch API
**Get available chat options for a workflow step**

```
GET /api/workflows/[workflowId]/branches?stepId={stepId}
```

**Parameters**:
- `workflowId` (path): Workflow identifier (e.g., "critical", "emergency")
- `stepId` (query): Step identifier (e.g., "critical-status-assessment")

**Response**:
```json
{
  "success": true,
  "workflowId": "critical",
  "stepId": "critical-status-assessment",
  "branches": [
    {
      "id": "uuid",
      "branchId": "proceed",
      "branchLabel": "Let's do it",
      "branchType": "fixed",
      "userPrompts": ["Let's do it", "Proceed", "Yes"],
      "responseText": "Great! Let's proceed with the renewal.",
      "nextStepId": "signature-workflow",
      "savedActionId": null,
      "llmHandler": null,
      "allowOffScript": false,
      "returnToStep": null
    },
    {
      "id": "uuid",
      "branchId": "ask-question",
      "branchLabel": "Ask a question",
      "branchType": "llm",
      "userPrompts": null,
      "responseText": null,
      "nextStepId": null,
      "savedActionId": null,
      "llmHandler": "handlers/renewalQA.js",
      "allowOffScript": true,
      "returnToStep": "critical-status-assessment"
    },
    {
      "id": "uuid",
      "branchId": "snooze-7-days",
      "branchLabel": "Snooze 7 days",
      "branchType": "saved_action",
      "userPrompts": ["Snooze", "Remind me later"],
      "responseText": null,
      "nextStepId": null,
      "savedActionId": "snooze-7-days",
      "llmHandler": null,
      "allowOffScript": false,
      "returnToStep": "critical-status-assessment"
    }
  ]
}
```

**Branch Types**:
- `fixed`: Static button → Shows response → Navigates to next step
- `llm`: Dynamic chat → Opens LLM conversation interface
- `saved_action`: Action button → Executes saved action (snooze, skip, escalate)
- `rag`: RAG-powered chat → LLM with knowledge base search

**Example**:
```bash
curl "http://localhost:3000/api/workflows/critical/branches?stepId=critical-status-assessment"
```

---

### 2. Thread Create API
**Create a new LLM conversation thread**

```
POST /api/workflows/chat/threads
```

**Request Body**:
```json
{
  "workflowExecutionId": "uuid-optional",
  "stepId": "critical-status-assessment",
  "threadType": "llm",
  "returnToStep": "critical-status-assessment"
}
```

**Parameters**:
- `workflowExecutionId` (optional): Current workflow execution UUID
- `stepId` (required): Step where chat was initiated
- `threadType` (required): "llm", "rag", "analysis", or "custom"
- `returnToStep` (optional): Step to return to when chat ends (defaults to stepId)

**Response**:
```json
{
  "success": true,
  "thread": {
    "id": "uuid",
    "workflowExecutionId": "uuid",
    "stepId": "critical-status-assessment",
    "threadType": "llm",
    "status": "active",
    "startedAt": "2025-10-08T19:30:00Z",
    "returnToStep": "critical-status-assessment",
    "totalMessages": 0,
    "totalTokens": 0
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/workflows/chat/threads \
  -H "Content-Type: application/json" \
  -d '{
    "stepId": "critical-status-assessment",
    "threadType": "llm",
    "returnToStep": "critical-status-assessment"
  }'
```

---

### 3. Thread Get API
**Get thread details and metadata**

```
GET /api/workflows/chat/threads/[threadId]
```

**Response**:
```json
{
  "success": true,
  "thread": {
    "id": "uuid",
    "workflowExecutionId": "uuid",
    "stepId": "critical-status-assessment",
    "threadType": "llm",
    "startedBy": "user-uuid",
    "startedAt": "2025-10-08T19:30:00Z",
    "endedAt": null,
    "status": "active",
    "returnToStep": "critical-status-assessment",
    "totalMessages": 5,
    "totalTokens": 420
  }
}
```

**Example**:
```bash
curl http://localhost:3000/api/workflows/chat/threads/{threadId}
```

---

### 4. Thread Messages Get API
**Get conversation history**

```
GET /api/workflows/chat/threads/[threadId]/messages
```

**Response**:
```json
{
  "success": true,
  "threadId": "uuid",
  "messages": [
    {
      "id": "uuid",
      "role": "system",
      "content": "You are a helpful AI assistant...",
      "messageType": "text",
      "metadata": null,
      "tokensUsed": null,
      "createdAt": "2025-10-08T19:30:00Z",
      "sequenceNumber": 0
    },
    {
      "id": "uuid",
      "role": "user",
      "content": "What's our ROI with this customer?",
      "messageType": "text",
      "metadata": null,
      "tokensUsed": null,
      "createdAt": "2025-10-08T19:30:10Z",
      "sequenceNumber": 1
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Based on the customer's usage data...",
      "messageType": "text",
      "metadata": null,
      "tokensUsed": 85,
      "createdAt": "2025-10-08T19:30:12Z",
      "sequenceNumber": 2
    }
  ]
}
```

**Message Types**:
- `text`: Standard text message
- `chart`: Chart data (see metadata for chart config)
- `table`: Tabular data (see metadata for rows/columns)
- `code`: Code snippet

**Example**:
```bash
curl http://localhost:3000/api/workflows/chat/threads/{threadId}/messages
```

---

### 5. Thread Messages Post API
**Send a message and get LLM response**

```
POST /api/workflows/chat/threads/[threadId]/messages
```

**Request Body**:
```json
{
  "content": "What's our ROI with this customer?"
}
```

**Response**:
```json
{
  "success": true,
  "threadId": "uuid",
  "userMessage": {
    "id": "uuid",
    "role": "user",
    "content": "What's our ROI with this customer?",
    "messageType": "text",
    "createdAt": "2025-10-08T19:30:10Z",
    "sequenceNumber": 1
  },
  "assistantMessage": {
    "id": "uuid",
    "role": "assistant",
    "content": "Based on the customer's usage data, I can provide an ROI analysis...",
    "messageType": "text",
    "metadata": null,
    "tokensUsed": 85,
    "createdAt": "2025-10-08T19:30:12Z",
    "sequenceNumber": 2
  }
}
```

**Special Response Types**:

**Chart Response**:
```json
{
  "assistantMessage": {
    "messageType": "chart",
    "content": "Here's a chart showing the renewal trend:",
    "metadata": {
      "chartType": "line",
      "chartData": {
        "labels": ["Jan", "Feb", "Mar", ...],
        "datasets": [{ "label": "Renewal Rate", "data": [92, 94, 91, ...] }]
      }
    }
  }
}
```

**Table Response**:
```json
{
  "assistantMessage": {
    "messageType": "table",
    "content": "Here's the renewal history:",
    "metadata": {
      "columns": ["Date", "ARR", "Status"],
      "rows": [
        ["2024-12-01", "$100,000", "Completed"],
        ["2023-12-01", "$85,000", "Completed"]
      ]
    }
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/workflows/chat/threads/{threadId}/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "What is our ROI?"}'
```

---

### 6. Thread Complete API
**Mark thread as completed**

```
POST /api/workflows/chat/threads/[threadId]/complete
```

**Request Body**: (none)

**Response**:
```json
{
  "success": true,
  "thread": {
    "id": "uuid",
    "status": "completed",
    "endedAt": "2025-10-08T19:35:00Z",
    "returnToStep": "critical-status-assessment"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/workflows/chat/threads/{threadId}/complete
```

---

### 7. Action Execute API
**Execute saved actions (snooze, skip, escalate)**

```
POST /api/workflows/actions/execute
```

**Request Body**:
```json
{
  "actionId": "snooze-7-days",
  "workflowExecutionId": "uuid-optional",
  "params": {
    "days": 7,
    "reason": "Customer requested more time",
    "returnToStep": "critical-status-assessment"
  }
}
```

**Response**:
```json
{
  "success": true,
  "action": {
    "id": "uuid",
    "actionId": "snooze-7-days",
    "actionName": "Snooze 7 Days",
    "actionType": "snooze"
  },
  "result": {
    "success": true,
    "message": "Workflow snoozed for 7 days",
    "returnToStep": "critical-status-assessment",
    "data": {
      "days": 7,
      "reason": "Customer requested more time",
      "resumeDate": "2025-10-15T19:30:00Z",
      "snoozedAt": "2025-10-08T19:30:00Z"
    }
  }
}
```

**Built-in Action Types**:
- `snooze`: Pause workflow for X days
- `skip`: Skip current step
- `escalation`: Trigger escalation notification

**Example**:
```bash
curl -X POST http://localhost:3000/api/workflows/actions/execute \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "snooze-7-days",
    "params": {"days": 7, "reason": "Customer requested more time"}
  }'
```

---

## Frontend Integration

### Rendering Chat Branches

```typescript
// Fetch branches for current step
const response = await fetch(
  `/api/workflows/${workflowId}/branches?stepId=${stepId}`
);
const { branches } = await response.json();

// Render based on branch type
branches.forEach(branch => {
  switch (branch.branchType) {
    case 'fixed':
      // Static button
      <Button onClick={() => {
        showMessage(branch.responseText);
        navigateToStep(branch.nextStepId);
      }}>
        {branch.branchLabel}
      </Button>
      break;

    case 'llm':
    case 'rag':
      // Dynamic chat button
      <Button onClick={async () => {
        const { thread } = await createThread({
          stepId: currentStepId,
          threadType: branch.branchType,
          returnToStep: branch.returnToStep
        });
        openChatInterface(thread.id);
      }}>
        {branch.branchLabel}
      </Button>
      break;

    case 'saved_action':
      // Action button
      <Button onClick={async () => {
        const { result } = await executeAction(branch.savedActionId);
        showMessage(result.message);
        navigateToStep(result.returnToStep);
      }}>
        {branch.branchLabel}
      </Button>
      break;
  }
});
```

---

### LLM Chat Flow

```typescript
// 1. Create thread
const { thread } = await fetch('/api/workflows/chat/threads', {
  method: 'POST',
  body: JSON.stringify({
    stepId: currentStepId,
    threadType: 'llm',
    returnToStep: currentStepId
  })
});

// 2. Send messages
const sendMessage = async (content: string) => {
  const { userMessage, assistantMessage } = await fetch(
    `/api/workflows/chat/threads/${thread.id}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ content })
    }
  );

  // Render user message
  appendMessage(userMessage);

  // Render assistant message (check for chart/table)
  if (assistantMessage.messageType === 'chart') {
    renderChart(assistantMessage.metadata.chartData);
  } else if (assistantMessage.messageType === 'table') {
    renderTable(assistantMessage.metadata);
  } else {
    appendMessage(assistantMessage);
  }
};

// 3. Complete thread and return to workflow
const exitChat = async () => {
  const { thread } = await fetch(
    `/api/workflows/chat/threads/${thread.id}/complete`,
    { method: 'POST' }
  );

  navigateToStep(thread.returnToStep);
};
```

---

## Mock LLM Responses

The Messages Post API includes a mock LLM response generator for testing. It responds to keywords:

**ROI Questions**:
- "roi", "return on investment" → Detailed ROI analysis

**Chart Requests**:
- "chart", "graph" → Line chart with renewal trends

**Data/History Requests**:
- "history", "data" → Table with renewal history

**Negotiation/Pricing**:
- "negotiation", "pricing", "discount" → Negotiation strategies

**Default**:
- Any other question → Helpful clarifying response

**Example Responses**:
```bash
# ROI question
curl -X POST .../messages -d '{"content":"What is our ROI?"}'
# Returns: Detailed ROI analysis with productivity gains

# Chart request
curl -X POST .../messages -d '{"content":"Show me a chart"}'
# Returns: messageType="chart" with chartData in metadata

# History request
curl -X POST .../messages -d '{"content":"Show renewal history"}'
# Returns: messageType="table" with rows/columns in metadata
```

---

## Testing Workflow

### 1. Test Branch API (Empty Response Expected)
```bash
curl "http://localhost:3000/api/workflows/critical/branches?stepId=test-step"
# Expected: { "success": true, "branches": [] }
# (Empty because database not seeded yet)
```

### 2. Test Thread Creation
```bash
curl -X POST http://localhost:3000/api/workflows/chat/threads \
  -H "Content-Type: application/json" \
  -d '{
    "stepId": "test-step",
    "threadType": "llm"
  }'
# Expected: Thread created with ID
```

### 3. Test Sending Messages
```bash
# Replace {threadId} with ID from step 2
curl -X POST http://localhost:3000/api/workflows/chat/threads/{threadId}/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "What is our ROI?"}'
# Expected: User message + assistant response with ROI analysis
```

### 4. Test Chart Response
```bash
curl -X POST http://localhost:3000/api/workflows/chat/threads/{threadId}/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Show me a chart"}'
# Expected: messageType="chart" with chartData in metadata
```

### 5. Test Thread Completion
```bash
curl -X POST http://localhost:3000/api/workflows/chat/threads/{threadId}/complete
# Expected: Thread marked as completed
```

### 6. Test Action Execution
```bash
curl -X POST http://localhost:3000/api/workflows/actions/execute \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "snooze-7-days",
    "params": {"days": 7}
  }'
# Expected: Mock snooze action result (action table not seeded yet)
```

---

## Database Status

**Current State**: APIs built but database not migrated/seeded

**What Works Now**:
- ✅ All API endpoints functional
- ✅ Mock LLM responses for testing
- ✅ Thread creation and message storage
- ✅ Action execution (mock results)

**What Needs Database Migration**:
- ❌ Branch API returns empty (no branches seeded)
- ❌ Action API returns "not found" (no actions seeded)
- ❌ Real LLM context integration
- ❌ Tool calls (RAG, database queries, charts)

**Next Steps**:
1. ✅ **APIs Ready** - Frontend can integrate immediately
2. ⏳ **Database Migration** - Run `005_workflows_complete.sql`
3. ⏳ **Seed Chat Branches** - Add branch data for workflows
4. ⏳ **Seed Saved Actions** - Add snooze, skip, escalate actions
5. ⏳ **Real LLM Integration** - Replace mock with OpenAI/Anthropic
6. ⏳ **Tool Integration** - Add RAG, database queries, chart generation

---

## Files Created

**APIs**:
- `renubu/src/app/api/workflows/[workflowId]/branches/route.ts`
- `renubu/src/app/api/workflows/chat/threads/route.ts`
- `renubu/src/app/api/workflows/chat/threads/[threadId]/route.ts`
- `renubu/src/app/api/workflows/chat/threads/[threadId]/messages/route.ts`
- `renubu/src/app/api/workflows/chat/threads/[threadId]/complete/route.ts`
- `renubu/src/app/api/workflows/actions/execute/route.ts`

**Documentation**:
- `automation/CHAT_API_GUIDE.md` (this file)
- `automation/DATABASE_WORKFLOW_SYSTEM.md` (database schema reference)

---

## Support

For questions or issues:
1. Review this guide
2. Check database schema: `automation/DATABASE_WORKFLOW_SYSTEM.md`
3. Test with curl examples above
4. Check API responses for error messages
