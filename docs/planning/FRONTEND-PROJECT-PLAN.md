# Renubu Frontend Project Plan
## Intelligent Workflow UI System

**Version:** 1.1
**Date:** October 9, 2025
**Demo Date:** Next Week (October 2025)
**Status:** Phase 3 - Integration & LLM Enhancement
**Goal:** Demo-ready renewal workflow system with dynamic LLM interactions

---

## 📁 Project Context

**This is a REFACTOR project:**
- All new work lives in `/refactor` or `/automation` folders
- Kept separate from main application during development
- Will eventually replace legacy pages once merged
- Clear separation allows independent development and testing

---

## 🎯 Executive Summary

### The Mission

Build a beautiful, demo-ready frontend for renewal workflows that:
1. **Displays** workflows from backend orchestration system
2. **Guides** CSMs through structured steps with AI assistance
3. **Supports** both fixed chat branches AND dynamic LLM conversations (Ollama)
4. **Renders** specialized artifacts (contracts, pricing, stakeholder maps, etc.)
5. **Tracks** progress and outcomes for analytics

**Scope:** Demo-ready, not production-ready. Mock complex features, build core functionality.

### Key Demo Requirements

By demo date, we must show:
- ✅ CSM opens workflow for a customer
- ✅ AI-generated context pre-populated from backend
- ✅ Chat interface with fixed buttons AND flexible LLM mode
- ✅ Specialized artifacts (contract review, pricing analysis, stakeholder mapping)
- ✅ Task management with snooze/skip/complete
- ✅ Workflow completion with outcomes tracking
- ✅ Smooth, polished UI that feels production-ready

### Ollama's Role

**Why Ollama:**
- Enable **dynamic conversations** outside fixed workflows
- Handle **subjective questions**: "How did the meeting go?" "Can we push this to next week?"
- Support **interview-style** interactions for qualitative assessment
- Test **real LLM responses** without API costs during development

**When to use Ollama vs Fixed Branches:**
- **Fixed Branches**: Structured decision points (Review contract → Yes/No/Skip)
- **LLM Mode**: Open-ended questions, drafting emails, assessments, deviations from script

---

## ✅ Phase 1 & 2: Foundation (COMPLETED)

### Phase 1: Core Infrastructure ✅

**What Was Built:**

1. **WorkflowExecutor Component** (`src/components/workflows/WorkflowExecutor.tsx`)
   - Main workflow orchestrator (renders steps, manages state)
   - Progress tracking, breadcrumbs, step navigation
   - Modal-based workflow container
   - Completion handlers and exit flows

2. **WorkflowChatPanel Component** (`src/components/workflows/WorkflowChatPanel.tsx`)
   - Chat interface with message history
   - Branch selection (fixed buttons from config)
   - LLM mode toggle (switch to open conversation)
   - Full-screen mode
   - Sidebar awareness (adjusts width dynamically)
   - User preferences (Enter to send, Shift+Enter toggle)

3. **TaskPanel Component** (`src/components/workflows/TaskPanel.tsx`)
   - Display tasks from database
   - Filter by status (active, completed, snoozed)
   - Task creation, snooze, skip, complete actions
   - Integration with task management APIs

4. **Test Workflow Definition** (`src/components/workflows/definitions/testWorkflow.ts`)
   - Sample renewal planning workflow
   - Step definitions with chat branches
   - Artifact configurations
   - Demonstrates pattern for future workflows

5. **Test Page** (`src/app/test-workflow-executor/page.tsx`)
   - Demo/testing environment
   - Sidebar-aware positioning
   - Live testing of workflow components

**Key Achievements:**
- ✅ Modular components (all <400 lines)
- ✅ Clean separation of concerns
- ✅ Reusable patterns established
- ✅ UI tested and refined through Checkpoint 2

---

### Phase 2: Backend Integration ✅

**What Was Built:**

1. **Chat APIs** (`src/app/api/workflows/chat/`)
   - `POST /api/workflows/chat/threads` - Create thread
   - `GET /api/workflows/chat/threads/[threadId]` - Get thread
   - `GET /api/workflows/chat/threads/[threadId]/messages` - Get messages
   - `POST /api/workflows/chat/threads/[threadId]/messages` - Send message (uses LLMService)
   - `POST /api/workflows/chat/threads/[threadId]/complete` - Complete thread

2. **Branch API** (`src/app/api/workflows/[workflowId]/branches/route.ts`)
   - Returns available chat options for a step
   - Supports hybrid model (fixed buttons + LLM mode + saved actions)

3. **Actions API** (`src/app/api/workflows/actions/execute/route.ts`)
   - Execute saved actions (snooze, skip, escalate, schedule)
   - Returns action results and navigation

4. **Tasks API** (`src/app/api/workflows/tasks/route.ts`)
   - `GET /api/workflows/tasks` - Fetch tasks with filters
   - `POST /api/workflows/tasks` - Create new task
   - Supports task management system

5. **Steps API** (`src/app/api/workflows/executions/[id]/steps/route.ts`)
   - `PUT /api/workflows/executions/[id]/steps` - Update step data and status
   - Tracks step completion

**Database Tables (Backend):**
- `workflow_chat_threads` - Chat conversation threads
- `workflow_chat_messages` - Chat messages
- `workflow_chat_branches` - Available chat options
- `saved_actions` - Predefined actions (snooze, skip, etc.)
- `action_executions` - Action execution history
- `workflow_tasks` - Task management
- `workflow_task_artifacts` - Artifacts linked to tasks
- `workflow_executions` - Workflow execution tracking
- `workflow_step_executions` - Step-level tracking

**Key Achievements:**
- ✅ Full CRUD for chat, tasks, actions
- ✅ Mock LLM responses in place (to be replaced with Ollama)
- ✅ Hybrid chat model (fixed + dynamic + saved actions)
- ✅ Graceful error handling
- ✅ All APIs tested and functional

---

## 🚧 Phase 3: LLM Integration & State Tracking (IN PROGRESS)

**Status:** 50% Complete
**Timeline:** Current sprint (1-2 weeks)
**Goal:** Real LLM (Ollama) + complete workflow state integration

### Checkpoint 3.1: Ollama Integration ⏳

**Objective:** Replace mock LLM with real Ollama, with easy toggle for testing.

**Tasks:**

1. **Create LLM Service** ⏳ IN PROGRESS
   - File: `src/lib/services/LLMService.ts`
   - Ollama client (POST to `localhost:11434/api/generate`)
   - Mock fallback (existing responses)
   - Timeout handling (10 seconds)
   - Environment toggle: `NEXT_PUBLIC_USE_OLLAMA=true/false`
   - Model selection: `NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b`

2. **Update Messages API** ✅ DONE
   - File: `src/app/api/workflows/chat/threads/[threadId]/messages/route.ts`
   - Already updated to use `LLMService.generateResponse()`
   - Passes conversation history and customer context
   - Returns source: 'ollama' or 'mock' for debugging

3. **Create Artifact Save API** ⏳ PENDING
   - File: `src/app/api/workflows/artifacts/route.ts`
   - POST endpoint to save email drafts, recommendations, analyses
   - Uses `workflow_task_artifacts` table
   - Returns artifact ID for linking

4. **Auto-detect & Save Artifacts** ⏳ PENDING
   - Detect artifacts in LLM responses (email drafts, recommendations)
   - Automatically save via artifacts API
   - Show "Draft saved ✓" confirmation in chat

5. **Frontend: LLM Mode Indicator** ⏳ PENDING
   - Update: `WorkflowChatPanel.tsx`
   - Show badge: "🤖 Ollama" or "🎭 Mock"
   - Loading spinner during Ollama generation
   - Error handling: "Ollama unavailable, using mock responses"

6. **Environment Setup** ⏳ PENDING
   - Create `.env.local` template
   - Document Ollama setup instructions
   - Quick toggle guide

**Deliverable:** Chat works with real LLM (Ollama) or mocks, easily switchable.

---

### Checkpoint 3.2: Workflow State Integration ⏳

**Objective:** Connect chat/task completions to workflow execution tracking.

**Tasks:**

1. **Thread Complete → Step Update** ⏳ PENDING
   - Update: `src/app/api/workflows/chat/threads/[threadId]/complete/route.ts`
   - When thread completes, call `PUT /api/workflows/executions/[id]/steps`
   - Mark current step as completed
   - Update metadata (duration, outcomes)
   - Return next step for navigation

2. **Action Execute → Workflow State** ⏳ PENDING
   - Update: `src/app/api/workflows/actions/execute/route.ts`
   - When snooze action executes, update `workflow_executions.status = 'snoozed'`
   - When skip action executes, update status appropriately
   - Log in execution history

3. **Frontend State Sync** ⏳ PENDING
   - Update: `WorkflowExecutor.tsx`
   - Track overall workflow progress
   - Update progress bar when steps complete
   - Show completion screen with metrics

**Deliverable:** Workflow state persists across page refreshes, progress tracked in database.

---

### Checkpoint 3.3: Customer Context Integration ⏳

**Objective:** Pass rich customer data to LLM for personalized responses.

**Tasks:**

1. **Fetch Customer Context** ⏳ PENDING
   - API: `GET /api/workflows/[workflowId]/context` (backend provides)
   - Returns: customer data, intelligence, financials, usage, engagement
   - Cache in workflow state

2. **Pass Context to LLM** ⏳ PENDING
   - Update: `LLMService.ts` system prompt
   - Include customer name, ARR, renewal date, risk score, trends
   - LLM responses reference specific customer data

3. **Variable Injection in Chat** ⏳ PENDING
   - Support `{{customer.name}}`, `{{data.financials.currentARR}}` in messages
   - Inject variables before displaying
   - Update chat templates to use variables

**Deliverable:** LLM knows customer context, gives personalized recommendations.

---

## 📦 Phase 4: Artifact Components (NEXT - 4 weeks)

**Status:** Not Started
**Timeline:** After Phase 3 completion
**Goal:** Build specialized artifact components for demo workflows

### Overview

Artifacts are specialized UI components that display workflow-specific data. Each artifact type has:
- **Database config** or **config file** defining content, styling, actions
- **React component** for rendering
- **Integration** with backend data sources

### Checkpoint 4.1: Forms & Assessment (Week 1)

**Objective:** Build form-based artifacts for data collection.

#### Artifact: CSM Assessment Form

**Purpose:** Capture CSM's qualitative assessment of customer relationship.

**Component:** `src/components/artifacts/CSMAssessmentArtifact.tsx`

**Features:**
- Multi-field form (text inputs, textareas, dropdowns, radio buttons)
- Customer relationship strength rating (1-5 scale)
- Key stakeholder identification
- Pain points and concerns
- Success metrics tracking
- Auto-save on blur (uses existing auto-save from Checkpoint 1)

**Data Source:**
- Pre-populated from `customer_intelligence` table (backend)
- Saves to `workflow_step_executions.metadata` or dedicated table

**Config:**
```typescript
{
  id: 'csm-assessment',
  type: 'form',
  title: 'CSM Assessment - {{customer.name}}',
  fields: [
    { name: 'relationship_strength', type: 'rating', label: 'Relationship Strength', max: 5 },
    { name: 'key_stakeholders', type: 'textarea', label: 'Key Stakeholders' },
    { name: 'pain_points', type: 'textarea', label: 'Current Pain Points' },
    { name: 'success_metrics', type: 'text', label: 'Success Metrics' }
  ]
}
```

**Deliverable:** CSM can fill out assessment form, data saves to workflow.

---

#### Artifact: Open Tasks (Step 0)

**Purpose:** Show existing open tasks from previous workflows.

**Component:** `src/components/workflows/OpenTasksStep.tsx` (already exists from backend Checkpoint 3)

**Integration:**
- Display all tasks from `workflow_tasks` table
- Transfer task to current workflow
- Show snooze eligibility and days remaining
- Auto-show ForcedDecisionModal for tasks requiring decision
- Block workflow continuation while tasks require decision

**Status:** ✅ Component exists (backend built this), needs frontend integration testing.

---

### Checkpoint 4.2: Document Processing (Week 2)

**Objective:** Build file upload and document analysis artifacts.

#### Artifact: Contract Analysis

**Purpose:** Upload contract documents, use LLM to extract key terms.

**Component:** `src/components/artifacts/ContractAnalysisArtifact.tsx`

**Features:**
- File upload (drag-and-drop, PDF/DOCX support)
- Document preview (PDF viewer)
- LLM integration for contract extraction
- Structured data display (terms, dates, pricing, clauses)
- Edit/override extracted data
- Document storage (Supabase Storage)

**Flow:**
1. User uploads contract PDF
2. Frontend uploads to Supabase Storage
3. Backend calls LLM: "Extract key terms from this contract"
4. LLM returns structured data (JSON)
5. Frontend displays editable form with extracted data
6. User reviews/edits, saves to workflow

**API Needed:**
- `POST /api/workflows/contracts/upload` - Upload file, trigger LLM extraction
- Returns: `{ contractId, extractedData }`

**LLM Prompt:**
```
Extract key contract terms from the following contract text:
- Contract ID
- Start Date
- End Date
- Annual Value
- Payment Terms
- Auto-renewal clause
- Price increase caps
- Notice period
- Non-standard terms

Return as JSON.
```

**Deliverable:** CSM can upload contract, LLM extracts terms, CSM reviews and saves.

---

### Checkpoint 4.3: Data Tables & Calculations (Week 3)

**Objective:** Build editable table artifacts for pricing analysis.

#### Artifact: Pricing Analysis Table

**Purpose:** Review current pricing and build renewal pricing model.

**Component:** `src/components/artifacts/PricingAnalysisArtifact.tsx`

**Features:**
- Editable data table (inline editing with contentEditable or inputs)
- Row add/delete functionality
- Column calculations (totals, discounts, ARR)
- Pricing comparison (current vs. proposed)
- Discount approval workflow
- Export to CSV/Excel

**Table Structure:**
```
Product | Current Price | Proposed Price | Discount % | ARR Impact
--------|---------------|----------------|------------|------------
Base    | $50,000       | $55,000       | 0%         | +$5,000
Feature | $20,000       | $22,000       | 5%         | +$1,000
...
--------|---------------|----------------|------------|------------
Total   | $70,000       | $77,000       | 2%         | +$7,000
```

**Calculations:**
- Discount % = (Proposed - Current) / Current * 100
- ARR Impact = Proposed - Current
- Auto-calculate totals

**Data Source:**
- Pre-populated from `contracts` and `financials` tables (backend)
- Saves to `workflow_step_executions.metadata.pricing_analysis`

**Deliverable:** CSM can build pricing model with calculations, export to CSV.

---

### Checkpoint 4.4: Visual & Advanced Artifacts (Week 4)

**Objective:** Build visual canvas and advanced artifacts.

#### Artifact: Stakeholder Mapping Canvas

**Purpose:** Visual relationship map of key stakeholders.

**Component:** `src/components/artifacts/StakeholderMapArtifact.tsx`

**Technology Options:**
- **Option A:** Use [React Flow](https://reactflow.dev/) (drag-and-drop nodes, connections)
- **Option B:** Custom canvas with D3.js
- **Recommendation:** React Flow (faster, professional, well-maintained)

**Features:**
- Interactive canvas (drag-and-drop nodes)
- Node creation (stakeholders with roles, influence, sentiment)
- Connection lines (relationships between stakeholders)
- Visual indicators:
  - Color-coded by sentiment (red=negative, yellow=neutral, green=positive)
  - Size by influence (larger = more influential)
- Pan and zoom functionality
- Export as PNG/SVG
- Save/load canvas state

**Node Data:**
```typescript
{
  id: 'stakeholder-1',
  type: 'stakeholder',
  position: { x: 100, y: 100 },
  data: {
    name: 'John Doe',
    role: 'CTO',
    influence: 'high', // high, medium, low
    sentiment: 'positive', // positive, neutral, negative
    notes: 'Champions our product'
  }
}
```

**Data Source:**
- Pre-populated from `salesforce.contacts` (backend)
- Saves to `workflow_step_executions.metadata.stakeholder_map`

**Deliverable:** CSM can visually map stakeholders, save map to workflow.

---

#### Artifact: AI Recommendations with Task Creation

**Purpose:** Generate AI recommendations and convert to actionable tasks.

**Component:** `src/components/artifacts/RecommendationsArtifact.tsx`

**Features:**
- LLM streaming integration (show recommendations as they generate)
- Recommendation display with categorization:
  - 🔴 Urgent
  - 🟡 Important
  - 🟢 Nice-to-have
- "Convert to Task" buttons for each recommendation
- Task creation modal/form
- Task assignment and due dates
- Link recommendations to created tasks

**Flow:**
1. System calls LLM: "Based on {{customer.name}}'s data, what are the top 5 renewal actions?"
2. LLM streams back recommendations
3. Frontend displays each recommendation with "Create Task" button
4. CSM clicks button → Task creation form opens
5. CSM sets assignee, due date, priority
6. Task created via `POST /api/workflows/tasks`
7. Recommendation marked as "converted to task"

**LLM Prompt:**
```
Based on this customer's data:
- ARR: {{data.financials.currentARR}}
- Risk Score: {{intelligence.riskScore}}
- Days until renewal: {{workflow.daysUntilRenewal}}
- Usage trend: {{data.usage.trend}}
- Recent support tickets: {{data.support.recentTickets}}

Generate 5 specific, actionable recommendations for this renewal.
Categorize each as Urgent, Important, or Nice-to-have.
Format as numbered list.
```

**Deliverable:** LLM generates recommendations, CSM converts to tasks with one click.

---

## 📊 Artifact Type Registry

**Summary of Artifact Types:**

| Artifact Type | Component | Complexity | Data Source | Save Location |
|---------------|-----------|------------|-------------|---------------|
| CSM Assessment | CSMAssessmentArtifact | Low | Pre-filled from intelligence | step_executions.metadata |
| Open Tasks | OpenTasksStep | Medium | workflow_tasks table | task actions update DB |
| Contract Analysis | ContractAnalysisArtifact | High | File upload + LLM | contracts table + storage |
| Pricing Table | PricingAnalysisArtifact | Medium-High | contracts + financials | step_executions.metadata |
| Stakeholder Map | StakeholderMapArtifact | High | salesforce.contacts | step_executions.metadata |
| Recommendations | RecommendationsArtifact | High | LLM generation | tasks table (when converted) |

**Artifact Component Pattern:**

```typescript
interface ArtifactProps {
  artifactId: string;
  artifactType: string;
  title: string;
  data: any; // Artifact-specific data
  customerContext?: CustomerContext;
  onSave: (data: any) => Promise<void>;
  onClose?: () => void;
}

export function GenericArtifact({ artifactId, artifactType, title, data, customerContext, onSave, onClose }: ArtifactProps) {
  // Render artifact based on type
  // Handle interactions
  // Auto-save on change
  // Return updated data
}
```

---

## 🎨 Phase 5: Demo Polish & Deployment (Final 2 weeks)

**Status:** Not Started
**Timeline:** After Phase 4 completion
**Goal:** Production-ready UI for design partner demos

### Checkpoint 5.1: Performance & UX Polish

**Objective:** Ensure smooth, professional user experience.

**Tasks:**

1. **Performance Optimization**
   - Load 50+ workflows in queue without lag (<2s)
   - Smooth animations (modal open/close, artifact transitions)
   - Optimize bundle size (code splitting, lazy loading)
   - Lighthouse score >90

2. **Visual Polish**
   - Consistent spacing, typography, colors
   - Loading states for all async operations
   - Empty states (no tasks, no workflows, no data)
   - Error states (API failures, network issues)
   - Success confirmations (task created, step completed, etc.)

3. **Responsive Design**
   - Test on tablet (1024px width)
   - Test on small laptop (1366px width)
   - Ensure modals don't break on smaller screens
   - Adjust artifact layouts for different widths

4. **Accessibility**
   - Keyboard navigation (Tab, Enter, Escape)
   - ARIA labels for screen readers
   - Focus management (auto-focus on modals)
   - Color contrast compliance

**Deliverable:** UI feels polished and professional, performs well under load.

---

### Checkpoint 5.2: Integration Testing & Bug Fixes

**Objective:** End-to-end testing of complete workflows.

**Test Scenarios:**

1. **Happy Path: Simple Renewal**
   - CSM opens workflow
   - Reviews pre-populated data
   - Fills out CSM assessment
   - Reviews contract (no upload needed, uses existing)
   - Builds pricing model
   - Creates 2 tasks from recommendations
   - Completes workflow
   - **Verify:** All data saved, tasks created, workflow marked complete

2. **Complex Path: Emergency Renewal with Contract Upload**
   - CSM opens emergency workflow
   - Resolves 3 open tasks from previous workflow
   - Uploads new contract PDF
   - LLM extracts terms
   - CSM edits extracted data
   - Builds pricing with 15% discount
   - Maps 5 stakeholders on canvas
   - Chats with LLM about strategy
   - Creates 4 tasks
   - Completes workflow
   - **Verify:** Contract stored, LLM extraction worked, map saved, tasks linked

3. **Edge Cases**
   - API timeout during LLM call → Shows error, allows retry
   - File upload fails → Shows error, allows re-upload
   - Customer context missing → Shows fallback data
   - User closes modal mid-workflow → State persists, can resume

4. **Ollama Testing**
   - Toggle `USE_OLLAMA=true` → Verify real LLM responses
   - Toggle `USE_OLLAMA=false` → Verify mock responses
   - Ollama down → Verify graceful fallback
   - Slow Ollama (>10s) → Verify timeout and fallback

**Deliverable:** All test scenarios pass, bugs fixed, edge cases handled.

---

### Checkpoint 5.3: Demo Preparation & Documentation

**Objective:** Prepare for design partner demos.

**Tasks:**

1. **Demo Script**
   - Step-by-step walkthrough
   - Key talking points (AI intelligence, priority algorithm, beautiful UI)
   - Customer story (Acme Corp example)
   - Screenshots and recordings

2. **Demo Data**
   - Seed database with 10 realistic customers
   - Pre-populate intelligence data
   - Create 5 workflows at different stages
   - Set up 1 complete end-to-end demo workflow

3. **Documentation**
   - README: How to run the system
   - SETUP.md: Environment setup (Ollama, database, API keys)
   - DEMO.md: Demo script and talking points
   - TROUBLESHOOTING.md: Common issues and fixes

4. **Deployment**
   - Deploy to staging environment
   - Test on production-like setup
   - Performance testing under load
   - Backup and rollback plan

**Deliverable:** Ready to demo, fully documented, deployed to staging.

---

## 🔗 Integration with Backend

### API Contract

See `docs/planning/API-CONTRACT.md` for complete specification.

**Key Endpoints Used by Frontend:**

```typescript
// Workflow Queue
GET /api/workflows/queue?csmId={csmId}
  → Returns: { workflows: [...], stats: {...} }

// Workflow Context (for variable injection)
GET /api/workflows/[workflowId]/context
  → Returns: { customer, intelligence, data, workflow }

// Workflow Execution
POST /api/workflows/[workflowId]/start
PUT /api/workflows/executions/[id]/steps
POST /api/workflows/[workflowId]/complete

// Chat
POST /api/workflows/chat/threads
POST /api/workflows/chat/threads/[threadId]/messages
POST /api/workflows/chat/threads/[threadId]/complete

// Tasks
GET /api/workflows/tasks?status={status}&customerId={id}
POST /api/workflows/tasks

// Actions
POST /api/workflows/actions/execute

// Artifacts (to be built)
POST /api/workflows/artifacts
GET /api/workflows/artifacts/[id]

// Contracts (to be built)
POST /api/workflows/contracts/upload
GET /api/workflows/contracts/[id]
```

### Data Flow

```
Backend Orchestration
    ↓ (assigns workflow)
Frontend Dashboard
    ↓ (CSM clicks "Start Workflow")
WorkflowExecutor
    ↓ (fetches context)
GET /api/workflows/[id]/context
    ↓ (renders step)
WorkflowChatPanel + ArtifactPanels
    ↓ (user interactions)
POST /api/workflows/chat/threads/[id]/messages
    ↓ (LLM response via Ollama)
LLMService.generateResponse()
    ↓ (saves data)
PUT /api/workflows/executions/[id]/steps
    ↓ (completes workflow)
POST /api/workflows/[id]/complete
```

---

## 🛠️ Technical Specifications

### Component Size Budget

**Target:** All components <400 lines

**Current Status:**
- WorkflowExecutor: ~350 lines ✅
- WorkflowChatPanel: ~380 lines ✅
- TaskPanel: ~320 lines ✅
- LLMService: ~350 lines (estimated) ✅

**Planned:**
- CSMAssessmentArtifact: <250 lines
- ContractAnalysisArtifact: <350 lines
- PricingAnalysisArtifact: <300 lines
- StakeholderMapArtifact: <350 lines
- RecommendationsArtifact: <300 lines

### Technology Stack

**Core:**
- Next.js 15.5.2
- React 18+
- TypeScript
- Tailwind CSS

**Key Libraries:**
- React Flow (for stakeholder mapping)
- Supabase Client (database, storage, auth)
- Ollama (local LLM via HTTP)

**Testing:**
- Manual UI testing checkpoints (TDD-UI approach)
- End-to-end test scenarios
- Performance testing (Lighthouse)

### File Structure

```
src/
├── app/
│   ├── api/workflows/          # API routes
│   │   ├── chat/
│   │   ├── tasks/
│   │   ├── actions/
│   │   ├── executions/
│   │   └── artifacts/          # To be built
│   └── test-workflow-executor/ # Test page
├── components/
│   ├── workflows/
│   │   ├── WorkflowExecutor.tsx
│   │   ├── WorkflowChatPanel.tsx
│   │   ├── TaskPanel.tsx
│   │   ├── OpenTasksStep.tsx   # Exists, needs integration
│   │   └── definitions/
│   │       └── testWorkflow.ts
│   └── artifacts/              # To be built
│       ├── CSMAssessmentArtifact.tsx
│       ├── ContractAnalysisArtifact.tsx
│       ├── PricingAnalysisArtifact.tsx
│       ├── StakeholderMapArtifact.tsx
│       └── RecommendationsArtifact.tsx
└── lib/
    └── services/
        ├── LLMService.ts       # In progress
        ├── WorkflowService.ts  # Exists
        └── CustomerService.ts  # To be built

docs/planning/
├── FRONTEND-PROJECT-PLAN.md    # This file
├── API-CONTRACT.md             # Backend API spec
└── COMBINED-SYSTEM-ARCHITECTURE.md
```

---

## 📅 Timeline Summary

| Phase | Duration | Status | Deliverable |
|-------|----------|--------|-------------|
| Phase 1: Core Infrastructure | 2 weeks | ✅ COMPLETE | WorkflowExecutor, ChatPanel, TaskPanel |
| Phase 2: Backend APIs | 2 weeks | ✅ COMPLETE | All APIs functional, hybrid chat model |
| Phase 3: LLM & State Integration | 1-2 weeks | ⏳ 50% DONE | Ollama working, state tracking complete |
| Phase 4: Artifact Components | 4 weeks | ⏳ PENDING | All 6 artifact types built and tested |
| Phase 5: Demo Polish | 2 weeks | ⏳ PENDING | Production-ready, demo-able |

**Total:** ~10-12 weeks
**Current Week:** Phase 3, Week 1
**Next Milestone:** Ollama integration complete, state tracking complete

---

## 🎯 Success Criteria

### By Demo Date

**Technical:**
- ✅ All 6 artifact types functional
- ✅ Ollama LLM integration working (with mock fallback)
- ✅ Workflow state persists across sessions
- ✅ Customer context populates throughout workflow
- ✅ Task management fully integrated
- ✅ Performance: Dashboard loads <2s, no lag

**Business:**
- ✅ Can demo complete renewal workflow end-to-end
- ✅ Show both fixed branches AND dynamic LLM conversations
- ✅ Demonstrate specialized artifacts (contract, pricing, stakeholder map)
- ✅ Show AI-generated recommendations → tasks
- ✅ UI looks polished and production-ready

**Quality:**
- ✅ No critical bugs in demo scenarios
- ✅ Graceful error handling (API failures, LLM timeouts)
- ✅ Edge cases handled (missing data, network issues)
- ✅ All components <400 lines (modular, maintainable)

---

## 📝 Ollama Configuration & Usage

### Setup Instructions

1. **Install Ollama**
   ```bash
   # Mac/Linux
   curl https://ollama.ai/install.sh | sh

   # Windows
   # Download from https://ollama.ai
   ```

2. **Pull Model**
   ```bash
   ollama pull llama3.1:8b
   # or
   ollama pull mistral
   ```

3. **Start Ollama**
   ```bash
   ollama serve
   # Runs on http://localhost:11434
   ```

4. **Configure Environment**
   Create `.env.local`:
   ```bash
   # LLM Configuration
   NEXT_PUBLIC_USE_OLLAMA=true
   NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b
   NEXT_PUBLIC_OLLAMA_TIMEOUT=10000
   ```

5. **Test Ollama**
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "llama3.1:8b",
     "prompt": "Say hello",
     "stream": false
   }'
   ```

### Quick Toggle

**Enable Ollama:**
```bash
echo "NEXT_PUBLIC_USE_OLLAMA=true" >> .env.local
npm run dev
```

**Disable Ollama (use mocks):**
```bash
echo "NEXT_PUBLIC_USE_OLLAMA=false" >> .env.local
npm run dev
```

**Check Current Mode:**
- Look for badge in chat: "🤖 Ollama" or "🎭 Mock"
- Check console logs: `[LLM] Using mock responses` or `[LLM] Attempting Ollama request...`

### When to Use Each Mode

**Use Ollama (`USE_OLLAMA=true`):**
- Testing dynamic conversations
- Drafting emails/recommendations
- Subjective assessments
- Interview-style interactions
- Realistic demo preparation

**Use Mocks (`USE_OLLAMA=false`):**
- Fast iteration on UI
- Predictable responses for testing
- When Ollama is slow/unavailable
- CI/CD environments
- Debugging specific scenarios

---

## 🚀 Next Actions

### Immediate (This Week)

1. **Complete LLMService.ts** ⏳
   - Finish Ollama client implementation
   - Test timeout and fallback behavior
   - Document usage patterns

2. **Build Artifact Save API** ⏳
   - Create `POST /api/workflows/artifacts`
   - Test with sample artifacts
   - Integrate with chat for auto-save

3. **Wire Thread Complete → Step Update** ⏳
   - Update thread complete API
   - Call steps API to mark complete
   - Test state persistence

4. **Add LLM Mode Indicator** ⏳
   - Show Ollama/Mock badge in chat
   - Display loading spinner
   - Handle errors gracefully

### Next Sprint (Week 2)

1. **Customer Context Integration**
   - Fetch context from backend
   - Pass to LLM system prompt
   - Test variable injection

2. **Start Artifact Components**
   - Begin with CSM Assessment (simplest)
   - Build reusable form patterns
   - Test auto-save functionality

### Month 2

1. **Complete All Artifact Components** (4 weeks)
2. **Integration Testing** (ongoing)
3. **Demo Preparation** (final 2 weeks)

---

## 📞 Coordination with Backend

### Weekly Sync

- Review API contracts
- Discuss data structure changes
- Plan integration work
- Resolve blockers

### Integration Points

**Phase 3:**
- Backend provides: Customer context API, artifact storage
- Frontend consumes: Context for LLM, saves artifacts

**Phase 4:**
- Backend provides: Contract upload API, LLM extraction, stakeholder data
- Frontend consumes: Uploaded contracts, extracted data, pre-populated stakeholders

**Phase 5:**
- Joint demo preparation
- End-to-end testing
- Performance optimization

---

## 📚 References

- **Backend Plan:** `automation/CHECKPOINT-3-COMPLETION-SUMMARY.md` (and others)
- **System Architecture:** `docs/planning/COMBINED-SYSTEM-ARCHITECTURE.md`
- **API Contract:** `docs/planning/API-CONTRACT.md`
- **Refactor Plan:** `REFACTOR-PROJECT-PLAN.md` (future vision)

---

**Last Updated:** January 2025
**Next Review:** After Phase 3 completion
**Status:** Phase 3 in progress - Ollama integration + workflow state tracking

---

## ✨ Vision: What We're Building

> "A CSM logs in, sees their intelligently prioritized queue, clicks on Acme Corp's urgent renewal. The UI opens with all customer context pre-loaded—ARR, risk score, trends, AI insights. They chat with the AI: 'How did the last meeting go?' The AI responds naturally. They upload the new contract, and within seconds, key terms are extracted. They build a pricing model in a visual table, map stakeholders on a canvas, and convert AI recommendations into tasks—all in one beautiful, flowing experience. 45 minutes later, the renewal is planned, tracked, and ready for action."

That's what we're building. Let's make it happen. 🚀
