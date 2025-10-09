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

By demo date (NEXT WEEK), we must show:
- ✅ CSM opens workflow for a customer
- ✅ AI-generated context pre-populated from backend
- ✅ Chat interface with fixed buttons AND flexible LLM mode (Ollama)
- ✅ Specialized artifacts (3-5 demo-ready artifacts minimum)
- ✅ Task management with snooze/skip/complete
- ✅ Workflow completion with outcomes tracking
- ✅ Smooth, polished UI that feels demo-ready

**Timeline:** Demo is NEXT WEEK (October 2025). Focus on demo-ready functionality over production perfection.

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

**Status:** 30% Complete
**Timeline:** THIS WEEK (Demo next week)
**Goal:** Real LLM (Ollama) + complete workflow state integration + customer context API

**⚠️ CRITICAL PREREQUISITE:**
- **Database Migration:** Backend SQLite work → Postgres/Supabase
- **Status:** Unknown - needs verification before proceeding with integrations
- **Frontend connects to:** Supabase (Postgres)
- **Backend uses:** SQLite (automation/renubu-test.db)

### Checkpoint 3.1: Ollama Integration ✅

**Objective:** Replace mock LLM with real Ollama, with easy toggle for testing.

**Tasks:**

1. **Create LLM Service** ✅ COMPLETE (Backend finished)
   - File: Backend completed `LLMService.ts`
   - Ollama client (POST to `localhost:11434/api/generate`)
   - Mock fallback (existing responses)
   - Timeout handling (10 seconds)
   - Environment toggle: `NEXT_PUBLIC_USE_OLLAMA=true/false`
   - Model selection: `NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b`

2. **Update Messages API** ✅ COMPLETE
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

### Checkpoint 3.3: Customer Context Integration ⏳ CRITICAL FOR DEMO

**Objective:** Pass rich customer data to LLM for personalized responses.

**Priority:** HIGHEST - Must be wired up for demo

**Tasks:**

1. **Fetch Customer Context** ⏳ CRITICAL
   - API: `GET /api/workflows/[workflowId]/context` (backend must provide)
   - Returns: customer data, intelligence, financials, usage, engagement
   - Cache in workflow state

2. **Pass Context to LLM** ⏳ CRITICAL
   - Update: `LLMService.ts` system prompt (backend may have already done this)
   - Include customer name, ARR, renewal date, risk score, trends
   - LLM responses reference specific customer data

3. **Variable Injection in Chat** ⏳ CRITICAL
   - Support `{{customer.name}}`, `{{data.financials.currentARR}}` in messages
   - Inject variables before displaying
   - Update chat templates to use variables

**Deliverable:** LLM knows customer context, gives personalized recommendations. MUST WORK FOR DEMO.

---

## 📦 Phase 4: Artifact Components (URGENT - This Week)

**Status:** Not Started
**Timeline:** THIS WEEK (alongside Phase 3) - Demo next week
**Goal:** Build ALL 10 artifact components for demo workflows

### Overview

Artifacts are specialized UI components that display workflow-specific data. Each artifact type has:
- **Database config** or **config file** defining content, styling, actions (uses handlebars for {{variables}})
- **React component** for rendering with inline editing support
- **Basic button actions** (save, edit, complete, create task)
- **Integration** with backend data sources

**Build Strategy for Demo:**
- **Text-based artifacts:** Build fully functional with real data/editing
- **Complex/intelligent artifacts:** Build display components with MOCKED data/actions
- **Focus:** Handlebars template variables + inline text editing + basic buttons
- **NOT building:** PDF parsing, Salesforce integration, complex calculations (mock these)

### All 10 Artifacts (Prioritized for Demo)

**Priority 1 - Build Fully (Demo Critical):**
1. **CSM Assessment Form** - Text-based form, build fully
2. **Open Tasks Step** - Existing component, integrate/test
3. **Pricing Analysis Table** - Editable table, build fully with mock calculations

**Priority 2 - Build Display + Mock Actions:**
4. **Contract Review** - Display component with inline editing, mock document upload
5. **Recommendations** - LLM output display with "Create Task" buttons, use mock recommendations
6. **Stakeholder Map** - Visual display (React Flow), use static mock nodes

**Priority 3 - Mock for Demo (If Time):**
7. **Email Draft Template** - Display with handlebars variables, mock send
8. **Meeting Notes** - Form with sections, mock AI summaries
9. **Risk Analysis Dashboard** - Static graphs/metrics display
10. **Action Items Checklist** - Simple checklist component

---

### Checkpoint 4.1: Priority 1 Artifacts (Demo Critical)

#### Artifact 1: CSM Assessment Form

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

#### Artifact 2: Open Tasks (Step 0)

**Status:** ✅ Component exists (backend built), needs integration testing

**Purpose:** Show existing open tasks from previous workflows.

**Component:** `src/components/workflows/OpenTasksStep.tsx` (already exists)

**What to Do:**
- Integrate with frontend workflow system
- Test display of tasks from `workflow_tasks` table
- Verify transfer task functionality
- Test snooze eligibility display
- Test ForcedDecisionModal integration

**Deliverable:** Open tasks display works in workflow, can transfer/resolve tasks.

---

#### Artifact 3: Pricing Analysis Table

**Purpose:** Review current pricing and build renewal pricing model.

**Component:** `src/components/artifacts/PricingAnalysisArtifact.tsx`

**Features (Build Fully):**
- Editable data table (inline editing with contentEditable or inputs)
- Row add/delete functionality
- Handlebars variables for pre-population: `{{data.currentARR}}`
- Basic save functionality

**Features (Mock for Demo):**
- Column calculations (totals, discounts, ARR) - use hardcoded/static calculations
- Export to CSV - show button, mock action

**Deliverable:** CSM can edit pricing table, see mock calculations, save data.

---

### Checkpoint 4.2: Priority 2 Artifacts (Display + Mock)

#### Artifact 4: Contract Review

**Purpose:** Display contract terms with inline editing.

**Component:** `src/components/artifacts/ContractReviewArtifact.tsx`

**Features (Build):**
- Display contract terms in structured layout
- Inline text editing (contentEditable)
- Handlebars support: `{{contract.startDate}}`, `{{contract.value}}`
- Save edited terms

**Features (Mock for Demo):**
- Document upload - show upload button, use pre-populated mock data
- PDF parsing/extraction - NOT building, use static mock data
- Document preview - optional, low priority

**Deliverable:** CSM can view contract terms (pre-populated), edit inline, save changes. NO PDF parsing.

#### Artifact 5: AI Recommendations with Task Creation

**Purpose:** Display AI recommendations and convert to actionable tasks.

**Component:** `src/components/artifacts/RecommendationsArtifact.tsx`

**Features (Build):**
- Display recommendations list with categorization (Urgent/Important/Nice-to-have)
- "Convert to Task" buttons for each recommendation
- Task creation form (assignee, due date, priority)
- Link recommendations to created tasks

**Features (Mock for Demo):**
- LLM streaming - use static mock recommendations, NOT real-time generation
- Recommendation generation - pre-populated mock data

**Mock Recommendations Example:**
```typescript
[
  { id: 1, text: "Schedule executive review meeting", priority: "urgent", category: "Relationship" },
  { id: 2, text: "Review Q3 usage metrics with customer", priority: "important", category: "Health" },
  // ...
]
```

**Deliverable:** Display recommendations, CSM can create tasks from them. Use mock data.

---

#### Artifact 6: Stakeholder Mapping Canvas

**Purpose:** Visual relationship map of key stakeholders.

**Component:** `src/components/artifacts/StakeholderMapArtifact.tsx`

**Technology:** Use [React Flow](https://reactflow.dev/) - drag-and-drop nodes

**Features (Build):**
- Interactive canvas (drag-and-drop nodes)
- Visual indicators:
  - Color-coded by sentiment (red=negative, yellow=neutral, green=positive)
  - Size by influence (larger = more influential)
- Basic save/load canvas state

**Features (Mock for Demo):**
- Node creation - pre-populate with static mock stakeholders
- Connection lines - static mock relationships
- Salesforce integration - NOT building, use mock data
- Export as PNG/SVG - show button, mock action

**Mock Stakeholder Data:**
```typescript
[
  { id: '1', name: 'John Doe', role: 'CTO', influence: 'high', sentiment: 'positive', position: { x: 100, y: 100 } },
  { id: '2', name: 'Jane Smith', role: 'VP Ops', influence: 'medium', sentiment: 'neutral', position: { x: 300, y: 150 } },
  // ...
]
```

**Deliverable:** Visual stakeholder map with React Flow, uses static mock data, drag-and-drop works.

---

### Checkpoint 4.3: Priority 3 Artifacts (If Time Permits)

These artifacts are lower priority. Build only if time permits, otherwise demo with placeholders.

#### Artifact 7: Email Draft Template
- Display template with handlebars variables
- Inline editing
- Mock "Send" button (no actual email sending)

#### Artifact 8: Meeting Notes
- Form with sections (Attendees, Summary, Action Items)
- Mock AI summary generation

#### Artifact 9: Risk Analysis Dashboard
- Static graphs/metrics display
- Mock data visualization

#### Artifact 10: Action Items Checklist
- Simple checklist component
- Check/uncheck items
- Basic status tracking

---

## 📊 Artifact Type Registry

**Summary of All 10 Artifacts:**

| # | Artifact Type | Component | Priority | Build Status | Data Source |
|---|---------------|-----------|----------|--------------|-------------|
| 1 | CSM Assessment | CSMAssessmentArtifact | P1 | Build Fully | Pre-filled from intelligence |
| 2 | Open Tasks | OpenTasksStep | P1 | Integrate Existing | workflow_tasks table |
| 3 | Pricing Table | PricingAnalysisArtifact | P1 | Build Fully + Mock Calcs | contracts + financials |
| 4 | Contract Review | ContractReviewArtifact | P2 | Display + Mock Upload | Mock contract data |
| 5 | Recommendations | RecommendationsArtifact | P2 | Display + Mock LLM | Static mock recommendations |
| 6 | Stakeholder Map | StakeholderMapArtifact | P2 | Display + Mock Data | Static mock stakeholders |
| 7 | Email Template | EmailDraftArtifact | P3 | Mock/Placeholder | Template with variables |
| 8 | Meeting Notes | MeetingNotesArtifact | P3 | Mock/Placeholder | Form with sections |
| 9 | Risk Dashboard | RiskAnalysisArtifact | P3 | Mock/Placeholder | Static charts/metrics |
| 10 | Action Checklist | ActionChecklistArtifact | P3 | Mock/Placeholder | Simple checklist |

**Build Strategy:**
- **P1 (Priority 1):** Must have for demo, build fully functional
- **P2 (Priority 2):** Important for demo, build display + mock complex features
- **P3 (Priority 3):** Nice to have, build only if time permits

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

## 🎨 Phase 5: Demo Polish & Deployment (Post-Demo)

**Status:** Not Started
**Timeline:** After demo, as needed for production
**Goal:** Production-ready UI for design partner rollout

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
| Phase 3: LLM & State Integration | THIS WEEK | ⏳ 30% DONE | Customer context API, state tracking, LLM wired up |
| Phase 4: Artifact Components | THIS WEEK | ⏳ PENDING | 3 Priority 1 artifacts + 3 Priority 2 artifacts |
| Phase 5: Demo Polish | Post-Demo | ⏳ PENDING | Production-ready polish after successful demo |

**Demo Date:** NEXT WEEK (October 2025)
**Current Focus:** Phase 3 + Phase 4 in parallel
**Critical Path:** Customer Context API → Artifact components → Demo testing

**This Week's Goals:**
1. Complete customer context API integration
2. Build 3 Priority 1 artifacts (CSM Assessment, Open Tasks, Pricing Table)
3. Build 3 Priority 2 artifacts (Contract, Recommendations, Stakeholder Map)
4. Integration testing and demo preparation

---

## 🎯 Success Criteria

### By Demo Date (NEXT WEEK)

**Technical (Must Have):**
- ✅ 3 Priority 1 artifacts functional (CSM Assessment, Open Tasks, Pricing Table)
- ✅ 3 Priority 2 artifacts with mock data (Contract, Recommendations, Stakeholder Map)
- ✅ Ollama LLM integration working (with mock fallback)
- ✅ Customer context API wired up and populating data
- ✅ Workflow state tracking functional
- ✅ Task management integrated

**Business (Must Show):**
- ✅ Complete renewal workflow end-to-end
- ✅ Fixed chat branches AND dynamic LLM conversations
- ✅ Specialized artifacts displaying customer data
- ✅ Handlebars template variables working ({{customer.name}}, etc.)
- ✅ Task creation from recommendations
- ✅ UI looks demo-ready (polished enough to impress)

**Quality (Demo Standards):**
- ✅ No critical bugs in happy path demo scenario
- ✅ Basic error handling (show error messages, not crashes)
- ✅ Mock data looks realistic
- ✅ Smooth transitions between steps

**NOT Required for Demo:**
- Production-perfect error handling
- PDF parsing / document upload
- Salesforce integration
- Advanced calculations / analytics
- Full test coverage

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

### Immediate Priority (This Week - Demo Prep)

**Day 1-2: Critical Infrastructure**
1. **Verify Database Migration Status** ⚠️ BLOCKER
   - Check if SQLite → Postgres migration complete
   - Ensure frontend APIs connect to correct database
   - Resolve any migration blockers

2. **Build Customer Context API** ⚠️ CRITICAL
   - Create `GET /api/workflows/[workflowId]/context`
   - Return customer data, intelligence, financials
   - Test variable injection in chat/artifacts

3. **Build Artifact Save API**
   - Create `POST /api/workflows/artifacts`
   - Integrate with workflow state
   - Test save/load flow

**Day 3-4: Priority 1 Artifacts**
4. **Build CSM Assessment Form**
   - Form component with handlebars
   - Auto-save on blur
   - Integration with context API

5. **Integrate Open Tasks Component**
   - Test existing component in workflow
   - Verify task actions work

6. **Build Pricing Table**
   - Editable table component
   - Mock calculations
   - Save functionality

**Day 5-6: Priority 2 Artifacts + Polish**
7. **Build Contract Review** (display + mock)
8. **Build Recommendations** (display + mock)
9. **Build Stakeholder Map** (React Flow + mock)

**Day 7: Demo Prep**
10. **Integration Testing** - End-to-end workflow test
11. **Demo Polish** - Fix critical bugs, smooth UX
12. **Demo Data** - Seed realistic customer data

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

**Last Updated:** October 9, 2025
**Next Review:** After demo (post-demo retrospective)
**Status:** Phase 3 + 4 in progress - Customer context API + artifacts for demo NEXT WEEK

**⚠️ URGENT:** Demo is next week. All hands on deck for Phase 3 (infrastructure) and Phase 4 (artifacts).

---

## ✨ Vision: What We're Building

> "A CSM logs in, sees their intelligently prioritized queue, clicks on Acme Corp's urgent renewal. The UI opens with all customer context pre-loaded—ARR, risk score, trends, AI insights. They chat with the AI: 'How did the last meeting go?' The AI responds naturally. They upload the new contract, and within seconds, key terms are extracted. They build a pricing model in a visual table, map stakeholders on a canvas, and convert AI recommendations into tasks—all in one beautiful, flowing experience. 45 minutes later, the renewal is planned, tracked, and ready for action."

That's what we're building. Let's make it happen. 🚀
