# Backend MVP Project Plan
## Intelligent Workflow System - Backend Infrastructure

**Version:** 1.0
**Date:** January 2025
**Status:** Phase 3 - API Development & LLM Integration
**Goal:** Support frontend demo with robust APIs, LLM integration, and workflow orchestration

---

## 🎯 Executive Summary

### Current State

Backend has made significant progress building APIs and services to support the frontend workflow system. **Key achievements:**

- ✅ **7 Chat APIs** built (branches, threads, messages, actions)
- ✅ **LLMService** with Ollama + mock fallback (complete)
- ✅ **Workflow Queue API** connecting automation orchestrator
- ✅ **Task CRUD APIs** (enhanced with field updates + delete)
- ✅ **User Preferences API** (settings persistence)
- ✅ **Automation Algorithm** (159 tests passing, priority scoring working)

### What Frontend Needs (According to Their Plan)

Frontend is in **Phase 3 (50% complete)** and needs:

**Immediate (Phase 3):**
- ⏳ Artifact Save API
- ⏳ Customer Context API
- ⏳ Thread Complete → Step Update integration
- ⏳ Action Execute → Workflow State integration

**Near-term (Phase 4 - 4 weeks):**
- ⏳ Contract Upload + LLM Extraction API
- ⏳ Stakeholder Data API
- ⏳ Workflow Start/Complete APIs
- ⏳ Artifact retrieval and linking

---

## ⚠️ **CRITICAL: Discrepancies & Concerns**

### 1. **Project Plan Confusion** 🚨

**Issue:** We have **3 different project plans** with conflicting information:

| Plan | Date | Approach | Status Claim |
|------|------|----------|--------------|
| **REFACTOR-PROJECT-PLAN.md** | October 2025 | Build new `/refactor` directory from scratch | "Planning → Execution" |
| **FRONTEND-PROJECT-PLAN.md** | January 2025 | Use existing components (WorkflowExecutor, etc.) | "Phase 3 - 50% complete" |
| **Backend docs** (30+ files) | Various | Database-driven workflows, automation orchestrator | "Phase 1 complete" |

**Questions:**
- ❓ Are we building `/refactor` (new system) or enhancing existing components?
- ❓ Which timeline is accurate? 8-week refactor vs 12-week phases?
- ❓ Is the "refactor" abandoned in favor of current components?

**Impact:**
If we're doing a **refactor**, backend needs to build new database-driven config system.
If we're **enhancing existing**, backend just needs to support current components with APIs.

**Recommendation:**
🎯 **Decision needed**: Clarify which path we're on before proceeding.

---

### 2. **Database Migration Status Unknown** 🚨

**Issue:** Frontend plan assumes database tables exist:
- `workflow_chat_threads`
- `workflow_chat_messages`
- `workflow_chat_branches`
- `workflow_executions`
- `workflow_step_executions`
- `workflow_tasks`
- `saved_actions`
- `action_executions`

**Current Reality:**
- ✅ Migration files exist: `005_workflows_complete.sql`, `006_user_preferences.sql`
- ❓ **Have these been run on the database?**
- ❓ Are we using SQLite (`automation/renubu-test.db`) or Postgres?
- ❓ Which database does frontend connect to?

**Evidence from codebase:**
- Automation system uses **SQLite** (`renubu-test.db`)
- Frontend APIs use **Supabase** (Postgres)
- These are **different databases**!

**Impact:**
If migrations haven't run, **ALL chat APIs will fail** when frontend calls them.

**Recommendation:**
🎯 **Immediate action**: Verify migration status, run if needed, or frontend will be blocked.

---

### 3. **Scope Creep Risk: Phase 4 Artifacts** ⚠️

**Issue:** Frontend Phase 4 wants to build **6 artifact types** over 4 weeks:

| Artifact | Complexity | Backend APIs Needed |
|----------|------------|---------------------|
| CSM Assessment Form | Low | Artifact save API |
| Open Tasks | Medium | Already built ✅ |
| **Contract Analysis** | **HIGH** | File upload, PDF parsing, LLM extraction, storage |
| **Pricing Table** | **Medium-High** | Financial data API, calculations engine |
| **Stakeholder Map** | **HIGH** | Graph data structure, Salesforce integration, canvas state storage |
| **Recommendations** | **HIGH** | LLM streaming, task creation integration |

**Concerns:**

1. **Contract Upload + LLM Extraction** is a major feature:
   - File upload to Supabase Storage
   - PDF text extraction (requires library like pdf-parse or Tesseract)
   - LLM prompt to extract structured data
   - Validation and error handling
   - **Estimated effort**: 1-2 weeks backend work

2. **Stakeholder Mapping** requires:
   - Salesforce API integration (if using real data)
   - Graph data structure (nodes, edges, positions)
   - Canvas state storage (JSONB or separate table)
   - **Estimated effort**: 1 week backend work

3. **LLM Recommendations with streaming**:
   - Streaming response handling (vs current non-streaming)
   - Different API pattern than current messages endpoint
   - **Estimated effort**: 3-5 days backend work

**Total Phase 4 backend effort**: ~3-4 weeks (same as frontend)

**Question:**
❓ Were these artifacts in the **original MVP scope**?
❓ Are they **must-haves** for demo or **nice-to-haves**?

**Impact:**
Adding 3-4 weeks of backend work could **push demo timeline** significantly.

**Recommendation:**
🎯 **Prioritize**: Which artifacts are essential for demo?
🎯 **Defer**: Consider mocking complex artifacts (contract upload, stakeholder map) with static data for demo.

---

### 4. **Frontend References "Existing Components" Not Built by Backend** ⚠️

**Issue:** Frontend plan mentions components backend didn't build:

**Frontend claims these exist:**
- ✅ `WorkflowExecutor.tsx` - built by frontend
- ✅ `WorkflowChatPanel.tsx` - built by frontend
- ✅ `TaskPanel.tsx` - built by frontend
- ✅ `OpenTasksStep.tsx` - frontend says "exists from backend Checkpoint 3"

**Backend reality:**
- ❌ Backend never built `OpenTasksStep.tsx` component (that's frontend work)
- ✅ Backend built **APIs** for tasks (GET, POST, PATCH, DELETE)
- ⚠️ Frontend may be confused about what backend provides

**Clarification:**
Backend provides **data via APIs**, not **React components**. Frontend builds components that consume APIs.

**Impact:**
Minor confusion, but could lead to misalignment if not clarified.

**Recommendation:**
🎯 **Clarify**: Backend = APIs/Services, Frontend = Components/UI

---

### 5. **Ollama Integration Complete** ✅ (but frontend may not know)

**Issue:** Frontend plan says LLMService is "IN PROGRESS" but backend **completed it today**.

**What backend built:**
- ✅ `LLMService.ts` with Ollama client
- ✅ Timeout handling (10 seconds)
- ✅ Automatic fallback to mocks
- ✅ Environment toggle (`NEXT_PUBLIC_USE_OLLAMA`)
- ✅ Customer context injection
- ✅ Source tracking (`'ollama'` or `'mock'`)
- ✅ Messages API updated to use LLMService

**Status:** ✅ **COMPLETE** (not in progress)

**Recommendation:**
🎯 **Update frontend**: LLMService is ready for testing.

---

### 6. **Workflow Orchestration vs Execution Confusion** ⚠️

**Issue:** Two separate systems that may not be connected:

**System A: Automation Orchestrator** (in `automation/` folder)
- ✅ Analyzes customers, determines workflows, calculates priority
- ✅ Generates workflow queues (who should work on what)
- ✅ 159 tests passing
- ✅ API: `GET /api/workflows/queue/[csmId]` (built today)
- **Purpose:** **Workflow assignment** (which workflows to show CSM)

**System B: Workflow Execution** (in `renubu/src/app/api/workflows/`)
- ⏳ Chat threads, messages, branches
- ⏳ Step tracking, task management
- ⏳ Workflow state persistence
- **Purpose:** **Workflow execution** (guiding CSM through steps)

**Current State:**
These systems are **not yet connected**.

**Gap:**
When CSM clicks workflow in queue → How does it open the right workflow config?
Where is the workflow config stored (database? TypeScript file?)

**Recommendation:**
🎯 **Connect systems**: Workflow Queue API should return `workflowId` that frontend uses to fetch workflow config.

---

## 📋 Backend Work Completed (with Evidence)

### ✅ Phase 1: Automation Algorithm Foundation (COMPLETE)

**Status:** 100% Complete
**Evidence:** 159 tests passing, all modules working

- ✅ `workflow-types.js` - Type system (36 tests passing)
- ✅ `workflow-data-access.js` - Database queries (24 tests)
- ✅ `workflow-determination.js` - Business rules (32 tests)
- ✅ `workflow-scoring.js` - Priority algorithm (29 tests)
- ✅ `workflow-orchestrator.js` - Orchestration (38 tests)
- ✅ `demo-workflow-system.js` - E2E demo
- ✅ `WORKFLOW-ALGORITHM-GUIDE.md` - Configuration guide

**Database:** SQLite (`automation/renubu-test.db`) with 10 seeded customers

---

### ✅ Phase 2: Database Schema & Migrations (COMPLETE - but not run?)

**Status:** Files created, **execution status unknown**

**Migration Files:**
- ✅ `005_workflows_complete.sql` (8 tables: workflows, versions, executions, steps, etc.)
- ✅ `006_user_preferences.sql` (user preferences table)

**Tables Defined:**
- ✅ `workflows` - Workflow configs
- ✅ `workflow_versions` - Audit trail
- ✅ `saved_actions` - Reusable actions (snooze, skip, escalate)
- ✅ `workflow_chat_branches` - Chat options (fixed, llm, saved_action)
- ✅ `workflow_chat_threads` - LLM conversation threads
- ✅ `workflow_chat_messages` - Chat messages
- ✅ `workflow_executions` - Workflow runs
- ✅ `workflow_step_executions` - Step tracking
- ✅ `workflow_tasks` - Task management
- ✅ `workflow_task_artifacts` - Artifacts linked to tasks
- ✅ `action_executions` - Action execution history
- ✅ `user_preferences` - User settings

**⚠️ Action Required:**
- 🔲 **Verify migrations have been run on Postgres**
- 🔲 **If not run, execute migrations before frontend testing**

---

### ✅ Phase 3: Core APIs (85% COMPLETE)

**Status:** Most APIs built, some integration work remaining

#### Chat APIs ✅

**All built and functional:**

1. ✅ `GET /api/workflows/[workflowId]/branches?stepId={stepId}`
   - Returns available chat options for a step
   - Supports hybrid model (fixed buttons, LLM mode, saved actions)
   - **File:** `renubu/src/app/api/workflows/[workflowId]/branches/route.ts`

2. ✅ `POST /api/workflows/chat/threads`
   - Create new LLM conversation thread
   - Auto-creates system message with context
   - **File:** `renubu/src/app/api/workflows/chat/threads/route.ts`

3. ✅ `GET /api/workflows/chat/threads/[threadId]`
   - Get thread metadata
   - **File:** `renubu/src/app/api/workflows/chat/threads/[threadId]/route.ts`

4. ✅ `GET /api/workflows/chat/threads/[threadId]/messages`
   - Fetch conversation history
   - **File:** `renubu/src/app/api/workflows/chat/threads/[threadId]/messages/route.ts`

5. ✅ `POST /api/workflows/chat/threads/[threadId]/messages`
   - Send user message, get LLM response
   - **Uses LLMService** (Ollama or mock)
   - Returns `source: 'ollama' | 'mock'` for debugging
   - Includes full conversation history for context
   - **File:** `renubu/src/app/api/workflows/chat/threads/[threadId]/messages/route.ts`

6. ✅ `POST /api/workflows/chat/threads/[threadId]/complete`
   - Mark thread as completed
   - Returns `returnToStep` for navigation
   - **File:** `renubu/src/app/api/workflows/chat/threads/[threadId]/complete/route.ts`

**Documentation:** `automation/CHAT_API_GUIDE.md`

#### Actions API ✅

7. ✅ `POST /api/workflows/actions/execute`
   - Execute saved actions (snooze, skip, escalate, schedule)
   - Built-in handlers for common actions
   - Supports custom code handlers (future)
   - Logs execution history
   - **File:** `renubu/src/app/api/workflows/actions/execute/route.ts`

#### Task APIs ✅

8. ✅ `GET /api/workflows/tasks?status={status}&workflowExecutionId={id}`
   - Fetch tasks with filters
   - **File:** `renubu/src/app/api/workflows/tasks/route.ts`

9. ✅ `POST /api/workflows/tasks`
   - Create new task
   - **File:** `renubu/src/app/api/workflows/tasks/route.ts`

10. ✅ `GET /api/workflows/tasks/[id]`
    - Get task by ID
    - **File:** `renubu/src/app/api/workflows/tasks/[id]/route.ts`

11. ✅ `PATCH /api/workflows/tasks/[id]`
    - Update task (both action-based and field-based)
    - Supports `action: 'complete'|'skip'` OR `{ title, completed, priority, dueDate, assignedTo }`
    - **File:** `renubu/src/app/api/workflows/tasks/[id]/route.ts`

12. ✅ `DELETE /api/workflows/tasks/[id]`
    - Delete task
    - **File:** `renubu/src/app/api/workflows/tasks/[id]/route.ts`

#### Workflow Queue API ✅

13. ✅ `GET /api/workflows/queue/[csmId]?companyId={companyId}`
    - Returns prioritized workflow queue for CSM
    - Connects to automation orchestrator
    - Workflows sorted by priority score
    - Includes stats (total, by type, by stage, etc.)
    - **File:** `renubu/src/app/api/workflows/queue/[csmId]/route.ts`
    - **Documentation:** `automation/WORKFLOW_QUEUE_API.md`

#### User Preferences API ✅

14. ✅ `GET /api/user/preferences`
    - Get user preferences
    - Auto-creates defaults if none exist
    - **File:** `renubu/src/app/api/user/preferences/route.ts`

15. ✅ `PUT /api/user/preferences`
    - Update user preferences (partial updates supported)
    - **File:** `renubu/src/app/api/user/preferences/route.ts`
    - **Documentation:** `automation/USER_PREFERENCES_API.md`

---

### ✅ LLM Service (COMPLETE)

16. ✅ `LLMService.ts`
    - Ollama API integration (`POST localhost:11434/api/chat`)
    - 10-second timeout (configurable)
    - Automatic fallback to mock responses
    - Customer context injection
    - Conversation history support
    - Source tracking (`'ollama'` or `'mock'`)
    - **File:** `renubu/src/lib/services/LLMService.ts`
    - **Documentation:** `automation/OLLAMA_INTEGRATION_COMPLETE.md`

**Environment Variables:**
```bash
NEXT_PUBLIC_USE_OLLAMA=true              # Enable Ollama
NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b     # Model to use
NEXT_PUBLIC_OLLAMA_TIMEOUT=10000         # Timeout in ms
```

---

## 🔲 Backend Work Needed (Frontend Dependencies)

### Phase 3 APIs (Immediate - This Sprint)

#### 🔲 1. Artifact Save API **HIGH PRIORITY**

**Needed by:** Frontend Phase 3.1 (Ollama Integration checkpoint)

**Endpoint:**
```typescript
POST /api/workflows/artifacts
{
  workflowExecutionId: string;
  stepId: string;
  artifactType: string; // 'email_draft', 'recommendation', 'assessment', etc.
  title: string;
  content: any; // Artifact-specific data
  metadata?: any;
}

Returns: { artifactId: string; ... }
```

**Database Table:** `workflow_task_artifacts` (already defined in migration)

**Effort:** 1-2 days

**Files to create:**
- `renubu/src/app/api/workflows/artifacts/route.ts` (POST - create)
- `renubu/src/app/api/workflows/artifacts/[id]/route.ts` (GET - retrieve)

---

#### 🔲 2. Customer Context API **HIGH PRIORITY**

**Needed by:** Frontend Phase 3.3 (Customer Context Integration)

**Endpoint:**
```typescript
GET /api/workflows/[workflowId]/context?executionId={executionId}

Returns: {
  customer: {
    id: string;
    name: string;
    domain: string;
    arr: number;
    renewalDate: string;
    owner: string;
  };
  intelligence: {
    riskScore: number;
    opportunityScore: number;
    healthScore: number;
    trends: any;
  };
  data: {
    financials: { currentARR, previousARR, trend };
    usage: { activeUsers, utilizationRate, trend };
    engagement: { lastContact, qbrDate, supportTickets };
  };
  workflow: {
    type: string;
    stage: string;
    daysUntilRenewal: number;
    priorityScore: number;
  };
}
```

**Data Sources:**
- `customers` table
- `customer_intelligence` table
- `contracts` table
- `financials` table
- Workflow orchestrator (for priority score, etc.)

**Effort:** 2-3 days (requires data aggregation from multiple tables)

**Files to create:**
- `renubu/src/app/api/workflows/[workflowId]/context/route.ts`

---

#### 🔲 3. Thread Complete → Step Update Integration **MEDIUM PRIORITY**

**Needed by:** Frontend Phase 3.2 (Workflow State Integration)

**Current State:**
- ✅ Thread complete API exists: `POST /api/workflows/chat/threads/[threadId]/complete`
- ✅ Step update API exists: `PUT /api/workflows/executions/[id]/steps`
- ❌ **Not integrated**

**Enhancement:**
When thread completes:
1. Call step update API to mark step as complete
2. Update step metadata (duration, outcomes)
3. Return next step ID for navigation

**Effort:** 1 day

**Files to modify:**
- `renubu/src/app/api/workflows/chat/threads/[threadId]/complete/route.ts`

---

#### 🔲 4. Action Execute → Workflow State Integration **MEDIUM PRIORITY**

**Needed by:** Frontend Phase 3.2 (Workflow State Integration)

**Current State:**
- ✅ Action execute API exists: `POST /api/workflows/actions/execute`
- ❌ Doesn't update `workflow_executions.status`

**Enhancement:**
When action executes:
- Snooze action → Update `workflow_executions.status = 'snoozed'`
- Skip action → Update step status appropriately
- Log in execution history

**Effort:** 1 day

**Files to modify:**
- `renubu/src/app/api/workflows/actions/execute/route.ts`

---

### Phase 4 APIs (Near-term - 4 weeks out)

#### 🔲 5. Contract Upload + LLM Extraction API **COMPLEX**

**Needed by:** Frontend Phase 4.2 (Contract Analysis Artifact)

**Endpoints:**
```typescript
POST /api/workflows/contracts/upload
- Upload PDF/DOCX to Supabase Storage
- Extract text (using pdf-parse or similar)
- Call LLM to extract structured data
- Save to contracts table
Returns: { contractId, extractedData }

GET /api/workflows/contracts/[id]
- Retrieve contract and extracted data
```

**Complexity:**
- File upload to Supabase Storage ⚠️
- PDF text extraction library (pdf-parse, Tesseract) ⚠️
- LLM prompt engineering for extraction ⚠️
- Validation and error handling ⚠️

**Effort:** 1-2 weeks

**Decision needed:**
🎯 Is this **must-have** for MVP demo or can we mock with sample contracts?

---

#### 🔲 6. Stakeholder Data API **MEDIUM**

**Needed by:** Frontend Phase 4.4 (Stakeholder Mapping Artifact)

**Endpoint:**
```typescript
GET /api/customers/[customerId]/stakeholders

Returns: [
  {
    id: string;
    name: string;
    role: string;
    influence: 'high' | 'medium' | 'low';
    sentiment: 'positive' | 'neutral' | 'negative';
    notes: string;
  }
]
```

**Data Source:**
- Salesforce integration (if using real data) ⚠️
- OR mock data in database (simpler)

**Effort:** 3-5 days (with Salesforce integration)
**Effort:** 1-2 days (with mock data)

**Decision needed:**
🎯 Real Salesforce integration or mock data for demo?

---

#### 🔲 7. Workflow Start/Complete APIs **MEDIUM PRIORITY**

**Needed by:** Frontend to track workflow execution lifecycle

**Endpoints:**
```typescript
POST /api/workflows/[workflowId]/start
{
  customerId: string;
  csmId: string;
  priority: number;
}
Returns: { executionId: string; ... }

POST /api/workflows/[workflowId]/complete
{
  executionId: string;
  outcome: string;
  metadata: any;
}
Returns: { success: true; ... }
```

**Database Tables:** `workflow_executions` (already defined)

**Effort:** 2-3 days

**Files to create:**
- `renubu/src/app/api/workflows/[workflowId]/start/route.ts`
- `renubu/src/app/api/workflows/[workflowId]/complete/route.ts`

---

#### 🔲 8. LLM Streaming Support **MEDIUM COMPLEXITY**

**Needed by:** Frontend Phase 4.4 (Recommendations Artifact with streaming)

**Current State:**
- LLMService uses `stream: false` (waits for complete response)

**Enhancement:**
- Support `stream: true` for real-time token streaming
- Different API pattern (Server-Sent Events or WebSocket)

**Effort:** 3-5 days

**Decision needed:**
🎯 Is streaming **necessary** for demo or is non-streaming acceptable?

---

## 📊 Summary: Work Status

### Completed (15 items) ✅

| Item | Status | Evidence |
|------|--------|----------|
| Automation Algorithm | ✅ COMPLETE | 159 tests passing |
| Database Schema | ✅ COMPLETE | Migration files ready |
| Chat APIs (6 endpoints) | ✅ COMPLETE | All routes built |
| Actions API | ✅ COMPLETE | Execute route built |
| Task APIs (5 endpoints) | ✅ COMPLETE | Full CRUD |
| Workflow Queue API | ✅ COMPLETE | Connects to orchestrator |
| User Preferences API | ✅ COMPLETE | GET/PUT routes |
| LLMService | ✅ COMPLETE | Ollama + mock fallback |

### In Progress (1 item) ⏳

| Item | Status | Next Steps |
|------|--------|-----------|
| Database Migrations | ⏳ UNKNOWN | **Verify if run, execute if not** |

### Needed for Frontend Phase 3 (4 items) 🔲

| Item | Priority | Effort | Blocks Frontend |
|------|----------|--------|-----------------|
| Artifact Save API | HIGH | 1-2 days | Phase 3.1 |
| Customer Context API | HIGH | 2-3 days | Phase 3.3 |
| Thread → Step Integration | MEDIUM | 1 day | Phase 3.2 |
| Action → State Integration | MEDIUM | 1 day | Phase 3.2 |

**Total Phase 3 effort:** ~5-7 days

### Needed for Frontend Phase 4 (4 items) 🔲

| Item | Priority | Effort | Complexity | Can Defer? |
|------|----------|--------|------------|------------|
| Contract Upload + LLM Extraction | MEDIUM | 1-2 weeks | HIGH | ✅ Yes - mock for demo |
| Stakeholder Data API | MEDIUM | 3-5 days | MEDIUM | ✅ Yes - mock for demo |
| Workflow Start/Complete APIs | HIGH | 2-3 days | LOW | ❌ No - needed for execution tracking |
| LLM Streaming Support | LOW | 3-5 days | MEDIUM | ✅ Yes - non-streaming works |

**Total Phase 4 effort (must-haves):** ~2-3 days
**Total Phase 4 effort (all features):** ~3-4 weeks

---

## 🎯 Recommendations

### Immediate Actions (This Week)

1. **✅ DECISION: Clarify Project Direction**
   - Are we building `/refactor` (new system) or enhancing existing components?
   - If refactor: Need to align backend with new architecture
   - If enhancing: Continue with current API approach

2. **🔲 CRITICAL: Verify Database Migrations**
   - Check if `005_workflows_complete.sql` has been run
   - Check if `006_user_preferences.sql` has been run
   - If not, **run immediately** or frontend will be completely blocked
   - Verify which database frontend connects to (SQLite vs Postgres)

3. **🔲 BUILD: Phase 3 Must-Have APIs (5-7 days)**
   - Artifact Save API (1-2 days)
   - Customer Context API (2-3 days)
   - Thread → Step Integration (1 day)
   - Action → State Integration (1 day)

4. **🔲 UPDATE: Frontend on LLMService Status**
   - LLMService is **COMPLETE** (not in progress)
   - Ready for testing with Ollama or mocks
   - Documentation at `automation/OLLAMA_INTEGRATION_COMPLETE.md`

### Phase 4 Decisions (Next 2 Weeks)

1. **✅ PRIORITIZE: Which Artifacts Are Must-Haves?**
   - **Essential for demo:**
     - ✅ CSM Assessment (simple form)
     - ✅ Open Tasks (already built)
     - ⏳ Recommendations (LLM-generated, no streaming needed)
   - **Can mock for demo:**
     - 🤔 Contract Analysis (use sample PDF with pre-extracted data)
     - 🤔 Pricing Table (use mock financial data)
     - 🤔 Stakeholder Map (use pre-defined graph data)

2. **✅ DEFER: Complex Integrations Post-MVP**
   - PDF upload/parsing → Post-MVP
   - Salesforce integration → Post-MVP
   - LLM streaming → Post-MVP
   - Focus on **core workflow execution** for demo

### Timeline Alignment

**Frontend Timeline:**
- Phase 3: 1-2 weeks (LLM + state integration)
- Phase 4: 4 weeks (6 artifact types)
- Phase 5: 2 weeks (polish + demo prep)
- **Total:** ~7-8 weeks

**Backend Timeline (Recommended):**
- Phase 3 APIs: 1 week (artifact save, context, integrations)
- Phase 4 Must-Haves: 1 week (workflow start/complete, simple artifacts)
- Phase 4 Deferrals: Mock for demo, build post-MVP
- Phase 5 Support: Testing, bug fixes, performance
- **Total:** ~2-3 weeks of focused API work

**Alignment:**
✅ Backend can stay ahead of frontend with recommended approach
⚠️ Backend will fall behind if building all complex artifacts (contract upload, Salesforce, streaming)

---

## 📁 Documentation Index

**Backend Project Docs (30+ files in `automation/`):**

**Core Guides:**
- `BACKEND-MVP-PROJECT-PLAN.md` - This file
- `WORKFLOW-ALGORITHM-GUIDE.md` - Orchestration algorithm config
- `DATABASE_WORKFLOW_SYSTEM.md` - Database schema and tables
- `PROJECT-SUMMARY.md` - System overview
- `ROADMAP.md` - Product roadmap

**API Documentation:**
- `CHAT_API_GUIDE.md` - Chat APIs (threads, messages, branches)
- `WORKFLOW_QUEUE_API.md` - Workflow queue API
- `USER_PREFERENCES_API.md` - User preferences API
- `OLLAMA_INTEGRATION_COMPLETE.md` - LLM service documentation

**Checkpoint Summaries:**
- `CHECKPOINT-1-SUMMARY.md` - Foundation work
- `CHECKPOINT-2-SUMMARY.md` - Configuration system
- `CHECKPOINT-3-COMPLETION-SUMMARY.md` - Task system integration

**Workflow Specs:**
- `WORKFLOWS-SUMMARY.md` - 3 renewal workflows defined
- `EMERGENCY-WORKFLOW-COMPLETION-SUMMARY.md`
- `CRITICAL-WORKFLOW-COMPLETION-SUMMARY.md`
- `PREPARE-WORKFLOW-COMPLETION-SUMMARY.md`

**Frontend Integration:**
- `FRONTEND-ACTION-PLAN-SPEC.md`
- `FRONTEND_INTEGRATION_RESPONSE.md`
- `FRONTEND_UPDATE_DATABASE_APPROACH.md`

---

## 🔗 Integration Points with Frontend

### Data Flow

```
1. CSM Login
   ↓
2. Frontend: GET /api/workflows/queue/[csmId]
   ← Backend: Returns prioritized workflows
   ↓
3. CSM Clicks Workflow
   ↓
4. Frontend: GET /api/workflows/[workflowId]/context
   ← Backend: Returns customer data, intelligence, financials
   ↓
5. Frontend: POST /api/workflows/[workflowId]/start
   ← Backend: Creates workflow_execution record
   ↓
6. CSM Works Through Steps
   ↓
7. Frontend: POST /api/workflows/chat/threads
   ← Backend: Creates chat thread
   ↓
8. Frontend: POST /api/workflows/chat/threads/[id]/messages
   ← Backend: LLMService generates response (Ollama or mock)
   ↓
9. Frontend: POST /api/workflows/artifacts
   ← Backend: Saves artifact (email draft, assessment, etc.)
   ↓
10. Frontend: POST /api/workflows/tasks
    ← Backend: Creates task from recommendation
    ↓
11. Frontend: POST /api/workflows/chat/threads/[id]/complete
    ← Backend: Marks thread complete, updates step status
    ↓
12. Frontend: POST /api/workflows/[workflowId]/complete
    ← Backend: Marks workflow complete, records outcome
```

### API Contract Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/workflows/queue/[csmId]` | ✅ Built | Connects to orchestrator |
| `GET /api/workflows/[workflowId]/context` | 🔲 Needed | Phase 3 priority |
| `POST /api/workflows/[workflowId]/start` | 🔲 Needed | Phase 4 must-have |
| `POST /api/workflows/[workflowId]/complete` | 🔲 Needed | Phase 4 must-have |
| `POST /api/workflows/chat/threads` | ✅ Built | Working |
| `POST /api/workflows/chat/threads/[id]/messages` | ✅ Built | Uses LLMService |
| `POST /api/workflows/chat/threads/[id]/complete` | ✅ Built | Needs step integration |
| `POST /api/workflows/artifacts` | 🔲 Needed | Phase 3 priority |
| `GET /api/workflows/artifacts/[id]` | 🔲 Needed | Phase 3 priority |
| `POST /api/workflows/tasks` | ✅ Built | Full CRUD exists |
| `POST /api/workflows/actions/execute` | ✅ Built | Needs state integration |
| `POST /api/workflows/contracts/upload` | 🔲 Optional | Phase 4 - can mock |
| `GET /api/customers/[id]/stakeholders` | 🔲 Optional | Phase 4 - can mock |

---

## 🚀 Next Steps

### Week 1 (Current)

- [x] ✅ Review frontend plan
- [x] ✅ Identify discrepancies and concerns
- [x] ✅ Create backend MVP plan
- [ ] 🔲 **DECISION:** Clarify refactor vs enhancement path
- [ ] 🔲 **CRITICAL:** Verify/run database migrations
- [ ] 🔲 Build Artifact Save API (1-2 days)
- [ ] 🔲 Build Customer Context API (2-3 days)

### Week 2

- [ ] 🔲 Thread → Step Integration (1 day)
- [ ] 🔲 Action → State Integration (1 day)
- [ ] 🔲 Build Workflow Start/Complete APIs (2-3 days)
- [ ] 🔲 Testing & bug fixes
- [ ] 🔲 Sync with frontend on Phase 3 progress

### Week 3-4 (Phase 4 Support)

- [ ] 🔲 **DECISION:** Which Phase 4 artifacts to build vs mock
- [ ] 🔲 Build must-have artifact APIs (if not mocking)
- [ ] 🔲 End-to-end testing with frontend
- [ ] 🔲 Performance optimization
- [ ] 🔲 Demo preparation

---

## ⚠️ Risks & Mitigation

### Risk 1: Database Migration Not Run
**Impact:** All APIs will fail, frontend completely blocked
**Probability:** High (status unknown)
**Mitigation:** Verify immediately, run migrations if needed

### Risk 2: Scope Creep (Complex Artifacts)
**Impact:** Backend work expands to 3-4 weeks, delays demo
**Probability:** Medium (frontend wants 6 artifact types)
**Mitigation:** Prioritize essential artifacts, mock complex ones for demo

### Risk 3: Project Direction Confusion
**Impact:** Building wrong thing, wasted effort
**Probability:** High (3 conflicting plans)
**Mitigation:** Get clarity on refactor vs enhancement ASAP

### Risk 4: Frontend/Backend Misalignment
**Impact:** Built APIs don't match frontend expectations
**Probability:** Low (good communication so far)
**Mitigation:** Weekly syncs, shared API contract document

---

## 📞 Questions for Team

1. **Project Direction:**
   ❓ Are we doing `/refactor` (new system) or enhancing existing components?

2. **Database:**
   ❓ Have migrations `005` and `006` been run?
   ❓ Which database does frontend connect to (SQLite or Postgres)?

3. **Phase 4 Scope:**
   ❓ Which artifacts are **must-haves** vs **nice-to-haves** for demo?
   ❓ Can we mock complex features (contract upload, Salesforce, streaming)?

4. **Timeline:**
   ❓ When is the actual demo date?
   ❓ What's the absolute minimum feature set for demo?

---

**Last Updated:** January 2025
**Next Review:** After Phase 3 decisions
**Status:** Awaiting direction on project approach and Phase 4 scope

---

## 🎯 TL;DR

**What's Done:**
- ✅ 15 APIs built (chat, tasks, actions, queue, preferences)
- ✅ LLMService with Ollama integration complete
- ✅ Automation orchestrator working (159 tests)

**What's Needed (Phase 3):**
- 🔲 Artifact Save API (1-2 days)
- 🔲 Customer Context API (2-3 days)
- 🔲 Thread/Action state integration (2 days)
- 🔲 **Verify database migrations run** ← CRITICAL

**Major Concerns:**
- ⚠️ 3 conflicting project plans (refactor vs enhancement?)
- ⚠️ Database migration status unknown (could block everything)
- ⚠️ Phase 4 scope creep risk (complex artifacts = 3-4 weeks backend work)
- ⚠️ Timeline confusion (October 2025 vs January 2025?)

**Recommendation:**
- 🎯 Get clarity on project direction
- 🎯 Verify migrations immediately
- 🎯 Build Phase 3 APIs (1 week)
- 🎯 Defer complex Phase 4 features, mock for demo
