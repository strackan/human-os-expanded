# Database-Driven Workflow System

## Overview

The workflow system has been migrated from TypeScript configuration files to a database-driven architecture. This enables:

- ✅ **Workflow Builder UI** - Create and modify workflows through a visual interface
- ✅ **Custom Workflows** - Tenants can create their own workflows
- ✅ **Chat Branches** - Fixed and dynamic conversational paths within workflows
- ✅ **LLM Integration** - AI-powered Q&A and analysis during workflow execution
- ✅ **Version History** - Audit trail of workflow changes
- ✅ **Saved Actions** - Reusable global functions (snooze, skip, escalate)

---

## Database Schema

### 8 Core Tables

#### 1. `workflows`
**Purpose**: Store workflow configurations (structure, notifications, logic - NO UI artifacts)

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  workflow_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  config JSONB NOT NULL,
  is_core BOOLEAN DEFAULT FALSE,
  tenant_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields**:
- `config`: JSONB containing entire workflow structure (trigger, context, steps, notifications)
- `is_core`: TRUE for system workflows (available to all tenants)
- `tenant_id`: NULL for core workflows, UUID for tenant-specific workflows

**What's Stored in `config`**:
- ✅ Workflow ID, name, description, version
- ✅ Trigger conditions (daysUntilRenewal, earlyTriggers, manualTriggers)
- ✅ System prompts (context.systemPrompt)
- ✅ Steps (id, name, type, description, execution)
- ✅ LLM prompts (execution.llmPrompt)
- ✅ Processors (execution.processor)
- ✅ Routing logic (routing.routes, defaultRoute)
- ✅ Notifications (type, title, message, recipients, priority, condition, actionTriggered, metadata)
- ✅ Conditional logic (conditional, conditionalLogic)

**What's Excluded from `config`**:
- ❌ UI artifacts (dashboards, charts, tables)
- ❌ UI actions (buttons, forms, modals)
- ❌ Rendering configs (cardTitle, cardDescription)
- ❌ Styling (colors, layouts, themes)

---

#### 2. `workflow_versions`
**Purpose**: Audit trail of workflow configuration changes

```sql
CREATE TABLE workflow_versions (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  version INT NOT NULL,
  config JSONB NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  change_description TEXT,
  UNIQUE(workflow_id, version)
);
```

**Automatic Versioning**: A trigger automatically creates a new version entry whenever a workflow's `config` is updated.

---

#### 3. `saved_actions`
**Purpose**: Global reusable functions (snooze, skip, escalate, custom scripts)

```sql
CREATE TABLE saved_actions (
  id UUID PRIMARY KEY,
  action_id VARCHAR UNIQUE NOT NULL,
  action_name VARCHAR NOT NULL,
  action_type VARCHAR NOT NULL,  -- 'snooze', 'skip', 'escalation', 'script'
  handler VARCHAR,                -- 'code:GlobalActions.snooze' or 'file:handlers/custom.js'
  config JSONB,
  available_globally BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Action Types**:
- `snooze`: Pause workflow for X days
- `skip`: Skip current step
- `escalation`: Trigger escalation workflow
- `script`: Custom JavaScript/TypeScript handler

**Handler Resolution**:
- `code:GlobalActions.snooze` → Calls code module
- `file:handlers/custom.js` → Loads file dynamically

---

#### 4. `workflow_chat_branches`
**Purpose**: Fixed and dynamic conversation paths within workflows

```sql
CREATE TABLE workflow_chat_branches (
  id UUID PRIMARY KEY,
  workflow_id VARCHAR NOT NULL,
  from_step_id VARCHAR NOT NULL,
  branch_id VARCHAR NOT NULL,
  branch_label VARCHAR NOT NULL,
  branch_type VARCHAR NOT NULL,  -- 'fixed', 'llm', 'saved_action', 'rag'
  user_prompts TEXT[],
  response_text TEXT,
  next_step_id VARCHAR,
  saved_action_id VARCHAR REFERENCES saved_actions(action_id),
  llm_handler VARCHAR,
  allow_off_script BOOLEAN DEFAULT FALSE,
  return_to_step VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Branch Types**:

1. **Fixed**: Deterministic path
   - User clicks "Let's do it" → Goes to specific next step
   - `user_prompts`: ["Let's do it", "Proceed", "Yes"]
   - `response_text`: "Great! Let's proceed with the renewal."
   - `next_step_id`: "signature-workflow"

2. **LLM**: Dynamic AI conversation
   - User asks custom question → LLM responds
   - `llm_handler`: "handlers/renewalQA.js"
   - `allow_off_script`: TRUE
   - Creates LLM thread for multi-turn conversation

3. **Saved Action**: Global function call
   - User clicks "Snooze 7 days" → Calls saved action
   - `saved_action_id`: "snooze-7-days"
   - `return_to_step`: "critical-status-assessment"

4. **RAG**: Retrieval-Augmented Generation
   - User asks "What's our ROI?" → Searches knowledge base
   - `llm_handler`: "handlers/ragSearch.js"
   - Uses LLM + vector search

---

#### 5. `workflow_chat_threads`
**Purpose**: LLM conversation container (multi-turn Q&A sessions)

```sql
CREATE TABLE workflow_chat_threads (
  id UUID PRIMARY KEY,
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  step_id VARCHAR NOT NULL,
  thread_type VARCHAR NOT NULL,  -- 'llm', 'rag', 'analysis', 'custom'
  started_by UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status VARCHAR DEFAULT 'active',  -- 'active', 'completed', 'abandoned'
  return_to_step VARCHAR,
  total_messages INT DEFAULT 0,
  total_tokens INT DEFAULT 0
);
```

**Thread Lifecycle**:
1. User triggers LLM branch → Thread created (`status: 'active'`)
2. Multi-turn conversation → Messages added
3. User returns to workflow → Thread marked `status: 'completed'`

---

#### 6. `workflow_chat_messages`
**Purpose**: Individual messages in LLM conversations

```sql
CREATE TABLE workflow_chat_messages (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'text',  -- 'text', 'chart', 'table', 'code'
  metadata JSONB,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW(),
  sequence_number INT NOT NULL
);
```

**Message Types**:
- `text`: Standard text response
- `chart`: Chart data in metadata
- `table`: Tabular data in metadata
- `code`: Code snippet

**Metadata Examples**:
```json
// Chart message
{
  "chartType": "line",
  "chartData": { ... },
  "sources": ["contract_data", "renewal_history"]
}

// Table message
{
  "columns": ["Customer", "ARR", "Status"],
  "rows": [ ... ]
}
```

---

#### 7. `workflow_llm_context`
**Purpose**: LLM configuration and context per conversation thread

```sql
CREATE TABLE workflow_llm_context (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE UNIQUE,
  system_prompt TEXT NOT NULL,
  tools_available TEXT[],  -- ['rag_search', 'database_query', 'chart_create']
  context_data JSONB NOT NULL,
  model_used VARCHAR,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 2000,
  total_tokens_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Context Data Structure**:
```json
{
  "customer": { "id": "...", "name": "...", "arr": 100000 },
  "csm": { "email": "...", "name": "..." },
  "workflow": { "daysUntilRenewal": 10, "renewalARR": 100000 },
  "company": { "vpCustomerSuccess": "...", "ceo": "..." },
  "accountTeam": { "ae": "...", "sa": "..." }
}
```

---

#### 8. `workflow_llm_tool_calls`
**Purpose**: Tool executions during LLM conversations (RAG, queries, charts)

```sql
CREATE TABLE workflow_llm_tool_calls (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES workflow_chat_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES workflow_chat_messages(id) ON DELETE CASCADE,
  tool_name VARCHAR NOT NULL,  -- 'rag_search', 'database_query', 'create_chart'
  tool_input JSONB NOT NULL,
  tool_output JSONB,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Available Tools**:

1. **rag_search**: Vector search in knowledge base
   ```json
   {
     "tool_name": "rag_search",
     "tool_input": { "query": "What's our ROI for this customer?" },
     "tool_output": { "results": [...], "sources": [...] }
   }
   ```

2. **database_query**: Query customer/contract data
   ```json
   {
     "tool_name": "database_query",
     "tool_input": { "query": "SELECT * FROM contracts WHERE customer_id = ?" },
     "tool_output": { "rows": [...] }
   }
   ```

3. **create_chart**: Generate chart from data
   ```json
   {
     "tool_name": "create_chart",
     "tool_input": { "type": "line", "data": {...} },
     "tool_output": { "chartId": "...", "imageUrl": "..." }
   }
   ```

---

## API Endpoints

### 1. Context API

**Endpoint**: `GET /api/workflows/context/[customerId]`

**Purpose**: Provides workflow context for template resolution (Handlebars variables)

**Response**:
```json
{
  "success": true,
  "context": {
    "customer": {
      "id": "...",
      "name": "Acme Corp",
      "arr": 100000,
      "renewalDate": "2025-12-31",
      "hasAccountPlan": true
    },
    "csm": {
      "email": "csm@company.com",
      "name": "John Doe",
      "manager": "manager@company.com"
    },
    "workflow": {
      "daysUntilRenewal": 10,
      "hoursUntilRenewal": 240,
      "renewalARR": 100000
    },
    "company": {
      "vpCustomerSuccess": "vp@company.com",
      "ceo": "ceo@company.com"
    },
    "accountTeam": {
      "ae": "ae@company.com",
      "sa": "sa@company.com",
      "allEmails": "ae@company.com,sa@company.com,csm@company.com"
    }
  }
}
```

**Usage**: Frontend calls this API to resolve notification templates like:
```handlebars
{{customer.name}} renewal is {{workflow.daysUntilRenewal}} days away.
```

**File**: `renubu/src/app/api/workflows/context/[customerId]/route.ts`

---

### 2. Workflow API

**Endpoint**: `GET /api/workflows/[workflowId]?tenantId=[tenantId]`

**Purpose**: Retrieves workflow configuration from database

**Parameters**:
- `workflowId` (path): Workflow identifier (e.g., "critical", "emergency", "overdue")
- `tenantId` (query, optional): Tenant UUID (defaults to current user's tenant)

**Response**:
```json
{
  "success": true,
  "workflow": {
    "id": "uuid-here",
    "workflowId": "critical",
    "name": "Critical Renewal",
    "description": "High-urgency escalation for renewals 7-14 days out",
    "version": "1.0.0",
    "isCore": true,
    "config": {
      "id": "critical",
      "trigger": {
        "daysUntilRenewal": { "min": 7, "max": 14 }
      },
      "context": {
        "systemPrompt": "You are an AI assistant..."
      },
      "steps": [
        {
          "id": "critical-status-assessment",
          "name": "Critical Status Assessment",
          "type": "conditional_routing",
          "execution": { ... },
          "routing": { ... }
        }
      ]
    }
  }
}
```

**Access Control**:
- Returns **core workflows** (is_core = TRUE) for all tenants
- Returns **tenant-specific workflows** (tenant_id matches user's tenant)
- Returns 404 if workflow not found

**File**: `renubu/src/app/api/workflows/[workflowId]/route.ts`

---

## Core Workflows

Three core workflows have been extracted and are ready for database seeding:

### 1. Critical Workflow (`08-critical.json`)
- **Trigger**: 7-14 days until renewal
- **Steps**: 4 (status assessment, escalation, emergency resolution, alternative options)
- **Notifications**: 2 (war room activation, Slack channel creation)
- **Key Feature**: Action-triggered notifications for war room creation

### 2. Emergency Workflow (`09-emergency.json`)
- **Trigger**: 0-6 days until renewal
- **Steps**: 4 (status check, team escalation, final push, outcome resolution)
- **Notifications**: 5 (manager acknowledgment, high-value alerts, strategic account notices)
- **Key Feature**: Mandatory manager approval before proceeding

### 3. Overdue Workflow (`10-overdue.json`)
- **Trigger**: Renewal date passed (daysUntilRenewal < 0)
- **Steps**: 3 (status check, daily follow-up, completion confirmation)
- **Notifications**: 8 (escalating notifications at days 7, 8, 15, 22, 30)
- **Key Feature**: Progressive escalation (manager → VP CS → war room → CEO)

**File Locations**:
- `automation/database/seeds/workflows/08-critical.json`
- `automation/database/seeds/workflows/09-emergency.json`
- `automation/database/seeds/workflows/10-overdue.json`

---

## Scripts

### 1. Validation Script

**Purpose**: Validates extracted workflow JSON files

**File**: `automation/scripts/validate-workflows.js`

**Tests**:
1. ✅ Valid JSON syntax
2. ✅ Required fields present (id, name, description, version, trigger, context, steps)
3. ✅ UI artifacts excluded (no ui.artifacts)
4. ✅ UI actions excluded (no ui.actions)
5. ✅ Notifications present
6. ✅ Handlebars template syntax valid (matching {{ }})
7. ✅ Workflow structure valid (each step has id, name, type)
8. ✅ Notification structure valid (type, title, recipients)

**Run**:
```bash
cd automation
node scripts/validate-workflows.js
```

**Results**:
```
Total tests: 62
Passed: 62
Failed: 0
✓ All validations passed!
```

---

### 2. Database Seed Script

**Purpose**: Seeds core workflows into database

**File**: `automation/scripts/seed-core-workflows.js`

**Process**:
1. Reads JSON files from `automation/database/seeds/workflows/`
2. Inserts into `workflows` table with `is_core = TRUE`, `tenant_id = NULL`
3. Uses upsert (INSERT ... ON CONFLICT DO UPDATE) for idempotency
4. Wrapped in transaction (all-or-nothing)

**Run** (after migration):
```bash
cd automation
DB_HOST=localhost DB_NAME=renubu DB_USER=postgres DB_PASSWORD=*** node scripts/seed-core-workflows.js
```

**Environment Variables**:
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: renubu)
- `DB_USER`: Database user (default: postgres)
- `DB_PASSWORD`: Database password (required)

---

## Migration

**File**: `automation/database/migrations/005_workflows_complete.sql`

**Features**:
- Creates 8 tables (workflows, versions, saved_actions, chat_branches, chat_threads, chat_messages, llm_context, llm_tool_calls)
- Indexes for performance (workflow lookup, tenant filtering, chat threading)
- Triggers (auto-versioning, timestamp updates)
- Helper functions (`get_tenant_workflows`, `get_workflow`, `get_step_chat_branches`)
- Row-Level Security (RLS) policies for multi-tenant isolation
- Validation tests (built into migration)

**Run** (when ready):
```bash
psql -U postgres -d renubu -f automation/database/migrations/005_workflows_complete.sql
```

---

## Template Resolution

### Handlebars Helpers

The notification system supports Handlebars templates with custom helpers:

**Comparison Helpers**:
- `{{eq a b}}` - Equals
- `{{gte a b}}` - Greater than or equal
- `{{lte a b}}` - Less than or equal
- `{{gt a b}}` - Greater than
- `{{lt a b}}` - Less than

**Logical Helpers**:
- `{{and a b}}` - Logical AND
- `{{or a b}}` - Logical OR
- `{{not a}}` - Logical NOT

**Utility Helpers**:
- `{{abs n}}` - Absolute value

**Examples**:

```handlebars
{{#if (gte workflow.renewalARR 250000)}}
  High-value renewal detected!
{{/if}}

{{#if (and customer.hasAccountPlan (gte workflow.renewalARR 100000))}}
  Strategic account war room required.
{{/if}}

Renewal is {{abs workflow.daysOverdue}} days overdue.
```

---

## Next Steps

### 1. **Run Migration** (when ready)
```bash
psql -U postgres -d renubu -f automation/database/migrations/005_workflows_complete.sql
```

### 2. **Seed Core Workflows**
```bash
cd automation
DB_PASSWORD=*** node scripts/seed-core-workflows.js
```

### 3. **Test Workflow API**
```bash
curl http://localhost:3000/api/workflows/critical
```

### 4. **Test Context API**
```bash
curl http://localhost:3000/api/workflows/context/[customerId]
```

### 5. **Integrate Frontend**
- Use `WorkflowContext` from context API for template resolution
- Fetch workflow config from workflow API
- Render steps dynamically based on config
- Support action-triggered notifications

---

## Architecture Decisions

### Why Database over TypeScript?

**Database Wins**:
- ✅ Workflow Builder UI ready (create/edit workflows visually)
- ✅ Tenant-specific workflows (custom workflows per tenant)
- ✅ Version history (audit trail)
- ✅ Runtime updates (no code deploy required)
- ✅ Multi-tenant isolation (RLS policies)

**TypeScript Trade-offs**:
- ❌ Type safety (mitigated by validation tests)
- ❌ Version control (mitigated by workflow_versions table)

### What Goes in Database?

**Included** (Workflow Logic + Content):
- ✅ Workflow structure (steps, tasks, routing)
- ✅ Text content (names, descriptions, prompts)
- ✅ LLM prompts (system prompts, step prompts)
- ✅ Notifications (type, title, message, recipients, conditions)
- ✅ Routing logic (conditional routing, default routes)
- ✅ Chat branches (fixed paths, LLM handlers)

**Excluded** (UI Rendering):
- ❌ UI artifacts (dashboards, charts, tables)
- ❌ UI actions (buttons, forms, modals)
- ❌ Rendering configs (cardTitle, cardDescription)
- ❌ Styling (colors, layouts, themes)

### Why Separate Chat Tables?

**Fixed Branches** (workflow_chat_branches):
- Deterministic paths ("Let's do it" → next step)
- Defined at workflow design time
- Part of workflow config

**Dynamic Threads** (workflow_chat_threads + messages):
- Runtime conversations
- User-initiated Q&A
- Persisted for history/audit

---

## Support

For questions or issues:
1. Review this documentation
2. Check migration file: `automation/database/migrations/005_workflows_complete.sql`
3. Run validation tests: `node scripts/validate-workflows.js`
4. Check API endpoints: `/api/workflows/[workflowId]` and `/api/workflows/context/[customerId]`
