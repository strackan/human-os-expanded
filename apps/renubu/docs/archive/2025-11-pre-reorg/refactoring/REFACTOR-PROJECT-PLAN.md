# Workflow System Refactor - Project Plan

**Version:** 1.0
**Created:** October 7, 2025
**Status:** Planning → Execution
**Timeline:** 8 weeks (4 phases × 2 weeks each)

---

## 📋 Executive Summary

### The Problem

Our current workflow system has grown to the point where it's difficult to maintain and extend:

- **Massive monolithic files**: TaskModeAdvanced (910 lines), ChatInterface (874 lines), ArtifactsPanel (812 lines)
- **40+ config files**: Some over 800 lines, duplicative patterns, unclear organization
- **Tight coupling**: Components depend on each other in circular ways
- **Two separate systems**:
  - UI/Template system (renubu/src/components/artifacts/workflows)
  - Automation/Orchestration (automation/ directory with 159 passing tests)
- **Hard to demo**: Creating new workflows requires editing massive files, high risk of breaking things

**Impact**: Can't ship new features quickly, can't easily demo to customers, fear of making changes

### The Solution

Build a clean, modular system in isolation (`/refactor` directory) that is:

1. **Demo-first**: Every checkpoint = working UI you can test
2. **Config-driven**: Small JSON files → Full workflows
3. **Modular**: Components < 300 lines, single responsibility
4. **Integrated**: Connects UI templates to automation orchestration
5. **Production-ready**: Replaces old system once validated

### Success Metrics

✅ **Demo URL works**: `localhost:3000/refactor/workflows/renewal-planning`
✅ **File size**: No component > 300 lines
✅ **Config simplicity**: New workflow = 1 small file (not 800+ lines)
✅ **Human validation**: 12 UI checkpoints all pass
✅ **Integration**: Automation system feeds workflows to UI
✅ **Feature parity**: Does everything old system does, but simpler

### Timeline

- **Phase 1**: Foundation & Core Components (Weeks 1-2)
- **Phase 2**: Configuration System (Weeks 3-4)
- **Phase 3**: Automation Integration (Weeks 5-6)
- **Phase 4**: Production Ready (Weeks 7-8)

**Total**: 8 weeks, 12 validation checkpoints

---

## 🏗️ Architecture Overview

### Current State (What We Have)

```
Dashboard (CSMDashboard.tsx)
    ↓
TaskModeAdvanced.tsx (910 lines)
    ↓
┌─────────────────────┴─────────────────────┐
│                                            │
ChatInterface.tsx (874 lines)    ArtifactsPanel.tsx (812 lines)
│                                            │
└────────────→ ConversationEngine.ts ←──────┘
                      ↓
            DynamicChatFixedTemplated.ts (866 lines)
                      ↓
        [40+ other config files, some 800+ lines]
```

**Separate System** (not connected):
```
automation/
├── workflow-orchestrator.js    # Generates prioritized queues
├── workflow-scoring.js         # Priority algorithm
├── workflow-determination.js   # Business rules
├── schema-config.sql           # Plans → Workflows → Steps
└── renubu-test.db             # 10 customers, renewals
```

### Target State (What We're Building)

```
/refactor/workflows/renewal-planning/
    ↓
WorkflowPage.tsx (100 lines)
    ↓
WorkflowEngine.tsx (150 lines)
    ↓
┌───────────────┼───────────────┐
│               │               │
ChatPanel.tsx   │   ArtifactPanel.tsx
(150 lines)     │   (150 lines)
│               │               │
└───────────────┴───────────────┘
        ↓
SimpleRenewal.ts (100 lines config)
        ↓
WorkflowRegistry.ts (mapping)
        ↓
automation/workflow-orchestrator.js (CONNECTED!)
```

**Benefits**:
- ✅ All components < 200 lines
- ✅ Clear separation of concerns
- ✅ Config files < 150 lines each
- ✅ Automation system integrated
- ✅ Easy to test and demo

---

## 🎯 Phase 1: Foundation & Core Components

**Duration**: Weeks 1-2
**Goal**: Build basic workflow shell with steps and navigation
**Demo URL**: `localhost:3000/refactor/workflows/renewal-planning`

### File Structure

```
src/app/refactor/workflows/renewal-planning/
├── page.tsx                          # Main demo page
└── components/
    ├── WorkflowShell.tsx            # Modal container (~100 lines)
    ├── StepProgress.tsx             # Progress indicator (~80 lines)
    ├── ChatPanel.tsx                # Chat interface (~150 lines)
    └── ArtifactPanel.tsx            # Artifact display (~150 lines)
```

---

### 📍 Checkpoint 1.1: Basic Workflow Shell (25% Complete)

**What You're Building**:
- Modal that opens when you visit the page
- Title: "Renewal Planning"
- Step progress indicator showing 3 steps: "Start Planning", "Review Contract", "Send Email"
- Close button that works
- Basic layout with placeholder content

**Implementation**:

```tsx
// src/app/refactor/workflows/renewal-planning/page.tsx
export default function RenewalPlanningRefactor() {
  const [open, setOpen] = useState(true);

  return (
    <div className="container mx-auto p-8">
      <h1>Refactor: Renewal Planning Workflow</h1>
      <p>Checkpoint 1.1 - Basic Shell</p>

      <button onClick={() => setOpen(true)}>
        Launch Workflow
      </button>

      <WorkflowShell
        open={open}
        onClose={() => setOpen(false)}
        title="Renewal Planning"
        steps={[
          { id: 'start', label: 'Start Planning' },
          { id: 'review', label: 'Review Contract' },
          { id: 'send', label: 'Send Email' }
        ]}
        currentStep={0}
      >
        <div className="p-4">
          <h2>Step 1: Start Planning</h2>
          <p>Placeholder content</p>
        </div>
      </WorkflowShell>
    </div>
  );
}
```

**UI Test Checklist** (Human Validation):

- [ ] Visit `localhost:3000/refactor/workflows/renewal-planning`
- [ ] Page loads without errors
- [ ] See "Launch Workflow" button
- [ ] Click button → Modal opens
- [ ] Modal shows "Renewal Planning" title
- [ ] See step progress bar with 3 steps
- [ ] "Start Planning" step is highlighted/active
- [ ] Other steps visible but not active
- [ ] See placeholder content "Step 1: Start Planning"
- [ ] X button visible in modal header
- [ ] Click X → Modal closes
- [ ] Click "Launch Workflow" again → Modal reopens

**Acceptance Criteria**: All 12 items checked = Checkpoint 1.1 PASS

**Files to Create**:
- `src/app/refactor/workflows/renewal-planning/page.tsx`
- `src/app/refactor/workflows/renewal-planning/components/WorkflowShell.tsx`
- `src/app/refactor/workflows/renewal-planning/components/StepProgress.tsx`

---

### 📍 Checkpoint 1.2: Step Navigation (50% Complete)

**What You're Building**:
- "Next Step" button that advances through steps
- "Previous Step" button to go back
- Content changes based on current step
- Step progress indicator updates
- Buttons disabled appropriately (no "Previous" on step 1, no "Next" on last step)

**Implementation**:

```tsx
// Updated WorkflowShell.tsx
export function WorkflowShell({ steps, onStepChange, children }) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const previous = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  return (
    <Modal>
      <StepProgress steps={steps} current={currentStep} />
      <div className="content">{children}</div>
      <div className="actions">
        <button onClick={previous} disabled={currentStep === 0}>
          Previous
        </button>
        <button onClick={next} disabled={currentStep === steps.length - 1}>
          Next Step
        </button>
      </div>
    </Modal>
  );
}

// Updated page.tsx with step content
const STEP_CONTENT = [
  { title: 'Start Planning', description: 'Let\'s begin the renewal process' },
  { title: 'Review Contract', description: 'Review contract terms and pricing' },
  { title: 'Send Email', description: 'Draft and send renewal email' }
];

export default function RenewalPlanningRefactor() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <WorkflowShell
      steps={STEPS}
      onStepChange={setCurrentStep}
    >
      <h2>{STEP_CONTENT[currentStep].title}</h2>
      <p>{STEP_CONTENT[currentStep].description}</p>
    </WorkflowShell>
  );
}
```

**UI Test Checklist** (Human Validation):

- [ ] Start on Step 1 "Start Planning"
- [ ] "Previous" button is disabled (grayed out)
- [ ] "Next Step" button is enabled
- [ ] Click "Next Step" → Move to Step 2
- [ ] Progress bar updates: Step 2 now highlighted
- [ ] Content changes to "Review Contract"
- [ ] "Previous" button now enabled
- [ ] Click "Previous" → Back to Step 1
- [ ] Content changes back to "Start Planning"
- [ ] Navigate to Step 3 (last step)
- [ ] "Next Step" button disabled on last step
- [ ] "Previous" button still enabled
- [ ] Can navigate back and forth smoothly

**Acceptance Criteria**: All 13 items checked = Checkpoint 1.2 PASS

---

### 📍 Checkpoint 1.3: Chat + Artifacts Split View (Phase 1 Complete - 100%)

**What You're Building**:
- Two-panel layout: Chat on left, Artifacts on right
- Chat shows messages and buttons
- Click button → New message appears
- Click button → Artifact panel slides in/shows on right
- Artifact shows relevant content (contract, email, etc.)
- Both panels visible side-by-side

**Implementation**:

```tsx
// components/ChatPanel.tsx
export function ChatPanel({ messages, buttons, onButtonClick }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">{msg.text}</div>
          </div>
        ))}
      </div>

      {buttons && buttons.length > 0 && (
        <div className="p-4 border-t space-x-2">
          {buttons.map(btn => (
            <button
              key={btn.value}
              onClick={() => onButtonClick(btn.value)}
              className="btn"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// components/ArtifactPanel.tsx
export function ArtifactPanel({ artifact, visible }) {
  if (!visible) return null;

  return (
    <div className="border-l h-full overflow-y-auto p-6">
      <h3 className="text-xl font-bold mb-4">{artifact.title}</h3>
      <div className="artifact-content">
        {artifact.type === 'contract' && (
          <ContractArtifact data={artifact.data} />
        )}
        {artifact.type === 'email' && (
          <EmailArtifact data={artifact.data} />
        )}
      </div>
    </div>
  );
}

// Updated page.tsx with chat flow
export default function RenewalPlanningRefactor() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: 'Hi! Ready to start renewal planning for Acme Corp?' }
  ]);
  const [buttons, setButtons] = useState([
    { label: 'Start Planning', value: 'start' },
    { label: 'Not Yet', value: 'skip' }
  ]);
  const [artifact, setArtifact] = useState(null);
  const [showArtifact, setShowArtifact] = useState(false);

  const handleButton = (value: string) => {
    if (value === 'start') {
      setMessages([...messages,
        { id: 2, role: 'user', text: 'Start Planning' },
        { id: 3, role: 'ai', text: 'Great! I\'ve pulled up the contract details on the right.' }
      ]);
      setArtifact({
        title: 'Contract Details',
        type: 'contract',
        data: {
          customer: 'Acme Corp',
          arr: '$725,000',
          renewalDate: 'Feb 28, 2026',
          terms: ['8% price cap', '60-day notice', 'Multi-year discounts available']
        }
      });
      setShowArtifact(true);
      setButtons([
        { label: 'Review Terms', value: 'review' },
        { label: 'Continue', value: 'next' }
      ]);
    }
  };

  return (
    <WorkflowShell title="Renewal Planning" steps={STEPS}>
      <div className="flex h-full">
        <div className="w-1/2">
          <ChatPanel
            messages={messages}
            buttons={buttons}
            onButtonClick={handleButton}
          />
        </div>
        <div className="w-1/2">
          <ArtifactPanel
            artifact={artifact}
            visible={showArtifact}
          />
        </div>
      </div>
    </WorkflowShell>
  );
}
```

**UI Test Checklist** (Human Validation):

- [ ] See chat panel on left side
- [ ] See initial AI message: "Ready to start renewal planning..."
- [ ] See two buttons: "Start Planning" and "Not Yet"
- [ ] Right side is empty (no artifact yet)
- [ ] Click "Start Planning" button
- [ ] User message appears: "Start Planning"
- [ ] AI response appears: "I've pulled up the contract..."
- [ ] Artifact panel slides in on right side
- [ ] See "Contract Details" title
- [ ] See contract data: ARR, renewal date, terms
- [ ] Buttons change to "Review Terms" and "Continue"
- [ ] Both panels visible side-by-side
- [ ] Can scroll chat independently
- [ ] Can scroll artifact independently
- [ ] Layout responsive (doesn't break)

**Acceptance Criteria**: All 15 items checked = Checkpoint 1.3 PASS = **PHASE 1 COMPLETE**

**Phase 1 Deliverables**:
- ✅ Working modal shell
- ✅ Step navigation
- ✅ Chat + Artifacts split view
- ✅ Basic interaction flow
- ✅ Clean, modular components (all < 200 lines)

---

## 🎯 Phase 2: Configuration System

**Duration**: Weeks 3-4
**Goal**: Move hardcoded logic to JSON configs, support multiple workflows
**Demo URL**: `localhost:3000/refactor/workflows/renewal-planning?config=simple`

### File Structure

```
src/app/refactor/workflows/
├── renewal-planning/
│   └── page.tsx                      # Updated to use configs
├── configs/
│   ├── SimpleRenewal.ts             # Simple renewal workflow
│   ├── StrategicQBR.ts              # Strategic QBR workflow
│   └── schema.ts                     # TypeScript types
└── engine/
    ├── WorkflowEngine.tsx            # Interprets configs
    └── ActionHandler.tsx             # Executes actions
```

---

### 📍 Checkpoint 2.1: Config-Driven Messages (25% Complete)

**What You're Building**:
- Unified schema config defines both backend execution AND UI presentation (Option A)
- WorkflowEngine component reads config and renders chat
- Change config → UI updates (no code changes needed)

**Implementation**:

```typescript
// configs/SimpleRenewal.ts
// UNIFIED SCHEMA: Backend execution + UI configuration in one file
export const SimpleRenewal = {
  id: 'simple-renewal',
  name: 'Simple Renewal Planning',
  version: '1.0',

  // Backend metadata
  type: 'renewal',
  stage: 'prepare', // Emergency, Critical, Prepare, Monitor
  baseScore: 50,

  steps: [
    {
      id: 'start',
      title: 'Start Planning',

      // Backend execution logic
      type: 'planning',
      dataRequired: ['customer.arr', 'customer.renewalDate', 'intelligence.riskScore'],

      // UI configuration
      chat: {
        initialMessage: {
          text: 'Hi! Ready to start renewal planning for {{customer.name}}? ARR: {{customer.arr}}, Risk Score: {{intelligence.riskScore}}',
          buttons: [
            { label: 'Start Planning', value: 'confirm' },
            { label: 'Not Yet', value: 'skip' }
          ]
        },

        branches: {
          'confirm': {
            response: 'Great! I\'ve pulled up the contract details.',
            actions: ['showArtifact'],
            artifactId: 'contract',
            buttons: [
              { label: 'Review Terms', value: 'review' },
              { label: 'Continue', value: 'next' }
            ]
          },
          'skip': {
            response: 'No problem. Let me know when you\'re ready.'
          }
        }
      },

      artifacts: [
        {
          id: 'contract',
          title: 'Contract Details',
          type: 'contract',
          visible: false,
          data: {
            customer: '{{customer.name}}',
            arr: '{{data.financials.currentARR}}',
            renewalDate: '{{customer.renewalDate}}',
            terms: ['8% price cap', '60-day notice']
          }
        }
      ]
    }
  ]
};
```

```tsx
// engine/WorkflowEngine.tsx
export function WorkflowEngine({ config, variables }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);

  useEffect(() => {
    // Initialize with first message
    const step = config.steps[currentStep];
    const initialMsg = injectVariables(
      step.chat.initialMessage.text,
      variables
    );

    setMessages([{ id: 1, role: 'ai', text: initialMsg }]);
  }, [currentStep]);

  const handleButton = (value: string) => {
    const step = config.steps[currentStep];
    const branch = step.chat.branches[value];

    if (branch) {
      // Add user message
      setMessages(prev => [...prev,
        { id: Date.now(), role: 'user', text: value }
      ]);

      // Add AI response
      const response = injectVariables(branch.response, variables);
      setMessages(prev => [...prev,
        { id: Date.now() + 1, role: 'ai', text: response }
      ]);

      // Execute actions
      if (branch.actions?.includes('showArtifact')) {
        // Show artifact logic
      }

      setCurrentBranch(branch);
    }
  };

  const step = config.steps[currentStep];
  const buttons = currentBranch?.buttons || step.chat.initialMessage.buttons;

  return (
    <ChatPanel
      messages={messages}
      buttons={buttons}
      onButtonClick={handleButton}
    />
  );
}
```

**UI Test Checklist** (Human Validation):

- [ ] Config file is readable JSON/TypeScript (not 800 lines)
- [ ] Config defines messages, buttons, branches
- [ ] WorkflowEngine loads config without errors
- [ ] Initial message displays from config
- [ ] Buttons render from config
- [ ] Click button → Response from config appears
- [ ] Change config message text → UI updates
- [ ] Change button label → UI updates
- [ ] Variable injection works: `{{customer.name}}` becomes "Acme Corp"
- [ ] No hardcoded strings in component code

**Acceptance Criteria**: All 10 items checked = Checkpoint 2.1 PASS

---

### 📍 Checkpoint 2.2: Config-Driven Artifacts (50% Complete)

**What You're Building**:
- Artifacts defined in config
- Actions trigger showing/hiding artifacts
- Artifact data comes from config
- Support multiple artifact types (contract, email, checklist)

**Implementation**:

```typescript
// Updated config with artifacts
export const SimpleRenewal = {
  steps: [
    {
      chat: { /* ... */ },

      artifacts: [
        {
          id: 'contract',
          title: 'Contract Review',
          type: 'contract',
          visible: false,
          data: {
            contractId: 'DYN-2024-0512',
            customer: '{{customer.name}}',
            arr: '{{customer.arr}}',
            renewalDate: '{{customer.renewalDate}}',
            terms: {
              priceCaps: ['8% annual increase cap'],
              nonStandard: ['60-day notice required'],
              multiYear: ['10% discount for 2-year', '20% for 3-year']
            }
          }
        },
        {
          id: 'email',
          title: 'Email Draft',
          type: 'email',
          visible: false,
          data: {
            to: '{{customer.contact.email}}',
            subject: 'Renewal Discussion - {{customer.name}}',
            body: 'Hi {{customer.contact.name}}, ...'
          }
        }
      ]
    }
  ]
};
```

**UI Test Checklist** (Human Validation):

- [ ] Artifacts defined in config (not hardcoded)
- [ ] Click button with `showArtifact` action → Artifact appears
- [ ] Artifact shows correct title from config
- [ ] Artifact shows correct data from config
- [ ] Variables injected in artifact data
- [ ] Multiple artifact types render correctly (contract, email)
- [ ] Can show/hide different artifacts via config actions
- [ ] Change artifact config → UI updates
- [ ] Add new artifact to config → Shows in UI
- [ ] No artifact rendering code in main component

**Acceptance Criteria**: All 10 items checked = Checkpoint 2.2 PASS

---

### 📍 Checkpoint 2.3: Multiple Workflow Configs (Phase 2 Complete - 100%)

**What You're Building**:
- Multiple workflow configs (Renewal, Strategic QBR, Health Check)
- Dropdown to switch between workflows
- Same engine, different configs
- Each workflow has different steps, messages, artifacts

**Implementation**:

```typescript
// configs/StrategicQBR.ts
export const StrategicQBR = {
  id: 'strategic-qbr',
  name: 'Quarterly Business Review',

  steps: [
    {
      id: 'prepare',
      title: 'Prepare QBR',
      chat: {
        initialMessage: {
          text: 'Let\'s prepare for {{customer.name}}\'s QBR. I\'ve gathered key metrics.',
          buttons: [
            { label: 'Review Metrics', value: 'metrics' },
            { label: 'Skip QBR', value: 'skip' }
          ]
        },
        branches: {
          'metrics': {
            response: 'Here are the key metrics for this quarter.',
            actions: ['showArtifact'],
            artifactId: 'metrics'
          }
        }
      },
      artifacts: [
        {
          id: 'metrics',
          title: 'QBR Metrics Dashboard',
          type: 'metrics',
          data: {
            usage: '{{customer.usage}}',
            growth: '{{customer.growth}}',
            health: '{{customer.healthScore}}'
          }
        }
      ]
    }
  ]
};

// configs/index.ts (Registry)
export const WorkflowRegistry = {
  'simple-renewal': SimpleRenewal,
  'strategic-qbr': StrategicQBR,
  'health-check': HealthCheck
};

// Updated page.tsx
export default function WorkflowsRefactor() {
  const [selectedWorkflow, setSelectedWorkflow] = useState('simple-renewal');
  const config = WorkflowRegistry[selectedWorkflow];

  return (
    <div>
      <select onChange={(e) => setSelectedWorkflow(e.target.value)}>
        <option value="simple-renewal">Renewal Planning</option>
        <option value="strategic-qbr">Strategic QBR</option>
        <option value="health-check">Health Check</option>
      </select>

      <WorkflowEngine config={config} variables={SAMPLE_CUSTOMER} />
    </div>
  );
}
```

**UI Test Checklist** (Human Validation):

- [ ] Dropdown shows 3 workflow options
- [ ] Select "Renewal Planning" → Shows renewal workflow
- [ ] See renewal-specific steps and messages
- [ ] Select "Strategic QBR" → Workflow changes
- [ ] See different steps (Prepare QBR, etc.)
- [ ] See different messages and artifacts
- [ ] Select "Health Check" → Another different workflow
- [ ] Switching workflows resets state (fresh start)
- [ ] All 3 workflows functional
- [ ] Can add 4th workflow by just adding config file
- [ ] No code changes needed to add new workflow
- [ ] Config files small (<150 lines each)

**Acceptance Criteria**: All 12 items checked = Checkpoint 2.3 PASS = **PHASE 2 COMPLETE**

**Phase 2 Deliverables**:
- ✅ Config-driven workflow engine
- ✅ Multiple workflow support
- ✅ Variable injection system
- ✅ Artifact rendering from config
- ✅ Registry pattern for workflows

---

## 🎯 Phase 3: Automation Integration

**Duration**: Weeks 5-6
**Goal**: Connect UI to automation orchestration system
**Demo URL**: `localhost:3000/refactor/dashboard`

### File Structure

```
src/app/refactor/
├── dashboard/
│   └── page.tsx                      # CSM dashboard with queue
├── workflows/renewal-planning/
│   └── page.tsx                      # Updated to accept customer data
├── api/
│   └── workflows/
│       ├── queue/route.ts           # GET workflow queue
│       └── execute/route.ts         # POST execute workflow
└── services/
    ├── WorkflowService.ts           # Bridge to automation
    └── CustomerService.ts           # Customer data access
```

---

### 📍 Checkpoint 3.1: Workflow Queue from Automation (25% Complete)

**What You're Building**:
- Dashboard page showing workflow queue
- Connect to automation system's `workflow-orchestrator.js`
- Display workflows sorted by priority score
- Show customer name, workflow type, priority score

**Implementation**:

```typescript
// services/WorkflowService.ts
// API Bridge Layer - Connects UI to Backend Orchestration System
// Uses endpoints defined in API-CONTRACT.md

export class WorkflowService {
  private baseUrl = '/api/workflows';

  /**
   * Get prioritized workflow queue for a CSM
   * Endpoint: GET /workflows/queue/{csmId}
   * See API-CONTRACT.md Section 1
   */
  static async getQueue(csmId: string) {
    const response = await fetch(`${this.baseUrl}/queue/${csmId}`);
    if (!response.ok) throw new Error('Failed to fetch queue');

    const data = await response.json();

    // Response format:
    // {
    //   workflows: Array<{
    //     id, customerId, customer, workflow, intelligence
    //   }>,
    //   stats: { totalWorkflows, pending, inProgress, completedToday }
    // }

    return data;
  }

  /**
   * Start a workflow (pending → in_progress)
   * Endpoint: POST /workflows/{workflowId}/start
   * See API-CONTRACT.md Section 2
   */
  static async startWorkflow(workflowId: string, csmId: string) {
    const response = await fetch(`${this.baseUrl}/${workflowId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csmId,
        startedAt: new Date().toISOString()
      })
    });
    if (!response.ok) throw new Error('Failed to start workflow');
    return response.json();
  }

  /**
   * Get complete customer context for variable injection
   * Endpoint: GET /workflows/{workflowId}/context
   * See API-CONTRACT.md Section 3
   */
  static async getWorkflowContext(workflowId: string) {
    const response = await fetch(`${this.baseUrl}/${workflowId}/context`);
    if (!response.ok) throw new Error('Failed to fetch context');

    const context = await response.json();

    // Context structure from API-CONTRACT.md:
    // {
    //   customer: { id, name, domain, arr, renewalDate, owner },
    //   intelligence: { riskScore, healthScore, sentiment, aiSummary, insights, recommendations },
    //   data: {
    //     salesforce: { opportunities, cases, contacts },
    //     usage: { activeUsers, licensedUsers, utilizationRate, trend, featureAdoption },
    //     financials: { currentARR, arrHistory, paymentHistory },
    //     engagement: { lastMeeting, meetingFrequency, supportTickets, qbrStatus }
    //   },
    //   workflow: { stage, daysUntilRenewal, priorityScore }
    // }

    return context;
  }

  /**
   * Complete a workflow step
   * Endpoint: POST /workflows/{workflowId}/steps/{stepId}/complete
   * See API-CONTRACT.md Section 4
   */
  static async completeStep(workflowId: string, stepId: string, outcomes: StepOutcomes) {
    const response = await fetch(
      `${this.baseUrl}/${workflowId}/steps/${stepId}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          completedAt: new Date().toISOString(),
          duration: outcomes.duration,
          status: 'completed',
          outputs: outcomes.outputs,
          completedBy: outcomes.completedBy
        })
      }
    );
    if (!response.ok) throw new Error('Failed to complete step');
    return response.json();
  }

  /**
   * Complete entire workflow
   * Endpoint: POST /workflows/{workflowId}/complete
   * See API-CONTRACT.md Section 5
   */
  static async completeWorkflow(workflowId: string, outcomes: WorkflowOutcomes) {
    const response = await fetch(`${this.baseUrl}/${workflowId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedAt: new Date().toISOString(),
        totalDuration: outcomes.totalDuration,
        status: outcomes.status,
        outcomes: outcomes.outcomes,
        completedBy: outcomes.completedBy
      })
    });
    if (!response.ok) throw new Error('Failed to complete workflow');
    return response.json();
  }
}
```

```tsx
// dashboard/page.tsx
export default function RefactorDashboard() {
  const [queue, setQueue] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  useEffect(() => {
    // Load workflow queue
    WorkflowService.getQueue('sarah', 'acme-corp')
      .then(setQueue);
  }, []);

  const launchWorkflow = async (workflowId: string) => {
    const workflow = await WorkflowService.executeWorkflow(workflowId);
    setSelectedWorkflow(workflow);
  };

  return (
    <div className="p-8">
      <h1>Your Workflow Queue</h1>
      <p>Sorted by priority (automation system)</p>

      <div className="queue">
        {queue.map(item => (
          <div
            key={item.id}
            className="queue-item"
            onClick={() => launchWorkflow(item.id)}
          >
            <div className="customer">{item.customer.domain}</div>
            <div className="type">{item.type}</div>
            <div className="priority">{item.priority} pts</div>
          </div>
        ))}
      </div>

      {selectedWorkflow && (
        <WorkflowEngine
          config={selectedWorkflow.config}
          variables={selectedWorkflow.variables}
        />
      )}
    </div>
  );
}
```

**UI Test Checklist** (Human Validation):

- [ ] Dashboard page loads at `/refactor/dashboard`
- [ ] See list of workflows from automation system
- [ ] Workflows sorted by priority (highest first)
- [ ] Each item shows: customer name, workflow type, priority score
- [ ] Priority scores match automation system calculations
- [ ] Click workflow item → Modal opens
- [ ] Workflow pre-populated with customer data
- [ ] Customer variables injected correctly
- [ ] See correct workflow type (renewal/strategic/etc)
- [ ] Can close and select different workflow
- [ ] Queue persists (same data on refresh)

**Acceptance Criteria**: All 11 items checked = Checkpoint 3.1 PASS

---

### 📍 Checkpoint 3.2: Dynamic Customer Variables (50% Complete)

**What You're Building**:
- Same workflow config works for any customer
- Customer data injected from automation system
- Variables in messages: `{{customer.name}}`, `{{customer.arr}}`
- Variables in artifacts: Contract data, email addresses
- Different customer → Same workflow → Different personalized content

**Implementation**:

```typescript
// Updated SimpleRenewal config with variables
// Variables match API-CONTRACT.md context structure
export const SimpleRenewal = {
  steps: [
    {
      chat: {
        initialMessage: {
          text: 'Hi! {{customer.name}} (ARR: ${{data.financials.currentARR}}) renewal is on {{customer.renewalDate}}. Days until renewal: {{workflow.daysUntilRenewal}}. Risk Score: {{intelligence.riskScore}}. Ready to start?',
          buttons: [...]
        },
        branches: {
          'confirm': {
            response: 'Great! Based on {{customer.name}}\'s {{customer.arr}} ARR and {{workflow.stage}} stage, here\'s the contract. Current health score: {{intelligence.healthScore}}/100.',
            actions: ['showArtifact'],
            artifactId: 'contract'
          }
        }
      },
      artifacts: [
        {
          id: 'contract',
          title: 'Contract: {{customer.name}}',
          data: {
            customer: '{{customer.domain}}',
            arr: '{{data.financials.currentARR}}',
            renewalDate: '{{customer.renewalDate}}',
            stage: '{{workflow.stage}}',
            daysRemaining: '{{workflow.daysUntilRenewal}}',
            riskScore: '{{intelligence.riskScore}}',
            sentiment: '{{intelligence.sentiment}}',
            usage: {
              activeUsers: '{{data.usage.activeUsers}}',
              trend: '{{data.usage.trend}}',
              changePercent: '{{data.usage.changePercent}}'
            },
            lastMeeting: '{{data.engagement.lastMeeting}}',
            contacts: '{{data.salesforce.contacts}}'
          }
        }
      ]
    }
  ]
};

// Enhanced variable injection
// Supports nested paths from API context structure
function injectVariables(template: string, variables: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], variables);
    return value !== undefined ? String(value) : match;
  });
}
```

**UI Test Checklist** (Human Validation):

- [ ] Select Customer 1 (e.g., "Acme Corp", $500k ARR)
- [ ] See "Acme Corp" in chat messages
- [ ] See "$500k" in chat messages
- [ ] See correct renewal date
- [ ] Open contract artifact → See Acme Corp data
- [ ] Close workflow, select Customer 2 (e.g., "Tech Inc", $1.2M ARR)
- [ ] Same workflow, but see "Tech Inc" everywhere
- [ ] See "$1.2M" in messages
- [ ] Contract shows Tech Inc data
- [ ] Variables nested work: `{{customer.contact.email}}`
- [ ] Variables in artifacts render correctly
- [ ] Missing variables don't crash (show placeholder)

**Acceptance Criteria**: All 12 items checked = Checkpoint 3.2 PASS

---

### 📍 Checkpoint 3.3: Complete Integration Loop (Phase 3 Complete - 100%)

**What You're Building**:
- Full flow: Automation generates queue → UI displays → User completes workflow → Updates automation
- Step completion tracked
- Workflow state saved
- Progress visible in dashboard
- "Next customer" button loads next in queue

**Implementation**:

```typescript
// services/WorkflowService.ts (extended)
export class WorkflowService {
  static async completeStep(workflowId: string, stepId: string) {
    // Update automation system
    await fetch('/api/workflows/complete-step', {
      method: 'POST',
      body: JSON.stringify({ workflowId, stepId })
    });

    // Update local state
    // Trigger any automation actions (e.g., priority recalc)
  }

  static async completeWorkflow(workflowId: string) {
    // Mark workflow complete in automation
    await fetch('/api/workflows/complete', {
      method: 'POST',
      body: JSON.stringify({ workflowId })
    });

    // Get next workflow in queue
    return this.getNextInQueue();
  }

  static async getNextInQueue() {
    const queue = await this.getQueue('current-user', 'current-company');
    return queue[0]; // Highest priority
  }
}

// Updated WorkflowEngine with completion
export function WorkflowEngine({ config, variables, onComplete }) {
  const [completedSteps, setCompletedSteps] = useState([]);

  const completeStep = async (stepId: string) => {
    await WorkflowService.completeStep(variables.workflowId, stepId);
    setCompletedSteps([...completedSteps, stepId]);
  };

  const finishWorkflow = async () => {
    await WorkflowService.completeWorkflow(variables.workflowId);
    onComplete?.();
  };

  // ... rest of engine
}

// Updated dashboard with "next customer" flow
export default function RefactorDashboard() {
  const [queue, setQueue] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);

  const loadNextWorkflow = async () => {
    const next = await WorkflowService.getNextInQueue();
    setActiveWorkflow(next);
  };

  const handleComplete = async () => {
    // Refresh queue
    const updatedQueue = await WorkflowService.getQueue();
    setQueue(updatedQueue);

    // Load next
    await loadNextWorkflow();
  };

  return (
    <div>
      <div className="queue">
        {/* Queue display */}
      </div>

      {activeWorkflow && (
        <WorkflowEngine
          config={activeWorkflow.config}
          variables={activeWorkflow.variables}
          onComplete={handleComplete}
        />
      )}

      <button onClick={loadNextWorkflow}>
        Next Customer
      </button>
    </div>
  );
}
```

**UI Test Checklist** (Human Validation):

- [ ] Dashboard shows 5 workflows in priority order
- [ ] Click #1 (highest priority) → Workflow opens
- [ ] Complete step 1 → Progress tracked
- [ ] Complete all steps → Workflow marked complete
- [ ] Click "Next Customer" → Workflow #2 opens automatically
- [ ] Previous workflow removed from queue or marked complete
- [ ] Queue count decreases (was 5, now 4)
- [ ] Complete workflow #2 → Moves to #3
- [ ] Refresh page → Progress persists
- [ ] Can see completed workflows in separate list
- [ ] Priority scores update if customer data changes
- [ ] Automation system and UI in sync

**Acceptance Criteria**: All 12 items checked = Checkpoint 3.3 PASS = **PHASE 3 COMPLETE**

**Phase 3 Deliverables**:
- ✅ Automation system connected to UI
- ✅ Workflow queue from priority algorithm
- ✅ Customer variables injected dynamically
- ✅ Step completion tracked
- ✅ "Next customer" flow working
- ✅ Full integration loop validated

---

## 🎯 Phase 4: Production Ready

**Duration**: Weeks 7-8
**Goal**: Polish, performance, migration strategy, documentation
**Demo URL**: `localhost:3000/refactor` (production-ready demo)

---

### 📍 Checkpoint 4.1: Performance & Polish (25% Complete)

**What You're Testing**:
- Load 50 workflows in queue → Renders smoothly
- Switch between workflows → No lag
- Large artifacts (100+ lines) → Scrollable, performant
- Animations smooth (modal open/close, artifact slide-in)
- Mobile responsive
- Error handling (API failures, missing data)

**UI Test Checklist** (Human Validation):

- [ ] Dashboard loads 50+ workflows without lag (<2 seconds)
- [ ] Scroll through queue smoothly
- [ ] Click workflow → Opens in <500ms
- [ ] Chat messages appear with smooth animation
- [ ] Artifact slides in smoothly (no jank)
- [ ] Switch workflows quickly → No memory leaks
- [ ] Open/close 10 workflows in succession → No slowdown
- [ ] Test on mobile device → Layout adapts
- [ ] Test on tablet → Works well
- [ ] Simulate API failure → See error message
- [ ] Handle missing customer data → Graceful fallback
- [ ] Browser back button works correctly

**Acceptance Criteria**: All 12 items checked = Checkpoint 4.1 PASS

---

### 📍 Checkpoint 4.2: Migration & Side-by-Side Comparison (50% Complete)

**What You're Testing**:
- Old system vs new system side-by-side
- Feature parity check
- Same workflow in both systems
- Identify any missing features
- Performance comparison

**UI Test Checklist** (Human Validation):

- [ ] Open old system: `/app/test-templated-dynamic`
- [ ] Open new system: `/refactor/workflows/renewal-planning`
- [ ] Compare features: Both have chat, artifacts, steps
- [ ] Test same workflow in both → Same result
- [ ] New system feels faster/smoother
- [ ] New system has cleaner UI
- [ ] All old system features present in new system
- [ ] Config file comparison: Old (800 lines) vs New (<150 lines)
- [ ] Component size: Old (900 lines) vs New (<200 lines)
- [ ] Document missing features (if any)
- [ ] Create migration checklist for each component
- [ ] Stakeholder review: Old vs New

**Acceptance Criteria**: All 12 items checked = Checkpoint 4.2 PASS

---

### 📍 Checkpoint 4.3: Production Deployment (Phase 4 Complete - 100%)

**What You're Testing**:
- Move components from `/refactor` to `/src`
- Update main dashboard to use new system
- Deprecate old system (move to `/legacy`)
- All tests passing
- Documentation complete
- Ready for production

**UI Test Checklist** (Human Validation):

- [ ] Move WorkflowEngine to `src/components/workflows/`
- [ ] Update Dashboard to use new WorkflowService
- [ ] Old components moved to `src/legacy/` (archived)
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings fixed
- [ ] Run full test suite → All pass
- [ ] Test in production build (`npm run build`)
- [ ] No console errors in production
- [ ] Performance metrics acceptable (Lighthouse >90)
- [ ] Documentation complete (README, ADRs)
- [ ] Migration guide written
- [ ] Team training completed

**Acceptance Criteria**: All 12 items checked = Checkpoint 4.3 PASS = **PHASE 4 COMPLETE**

**Phase 4 Deliverables**:
- ✅ Production-ready components
- ✅ Performance optimized
- ✅ Migration complete
- ✅ Old system deprecated
- ✅ Documentation complete
- ✅ Ready to ship

---

## 📚 Further Reading

### Current System Documentation

1. **Automation System**
   - `automation/PROJECT-SUMMARY.md` - Complete overview
   - `automation/WORKFLOW-ALGORITHM-GUIDE.md` - Configuration guide
   - `automation/ROADMAP.md` - Future plans
   - `automation/schema-config.sql` - Database schema

2. **Current UI System**
   - `src/components/artifacts/workflows/TaskModeAdvanced.tsx` (910 lines)
   - `src/components/artifacts/workflows/components/ChatInterface.tsx` (874 lines)
   - `src/components/artifacts/workflows/config/WorkflowConfig.ts` - Type definitions
   - `src/components/artifacts/workflows/config/configs/DynamicChatFixedTemplated.ts` (866 lines)

3. **Template Builders**
   - `src/components/artifacts/workflows/config/branchTemplates.ts` - Reusable branch patterns
   - `src/components/artifacts/workflows/config/artifactTemplates.ts` - Reusable artifact templates
   - `src/components/artifacts/workflows/config/slideTemplates.ts` - Slide builders

### Architecture Decisions

**Why Refactor?**
- Current files too large (800-910 lines), hard to maintain
- Tight coupling between components
- 40+ config files with duplicative patterns
- Two separate systems (UI + Automation) not connected
- Can't easily demo new workflows

**Why Isolated `/refactor` Directory?**
- Build new system without breaking old
- Compare side-by-side
- Validate before migration
- Lower risk

**Why Demo-First Approach?**
- Stakeholder can see progress at each checkpoint
- Early feedback prevents wrong direction
- UI tests are human validation, not just code tests
- Easier to explain to non-technical stakeholders

**Why Config-Driven?**
- Non-developers can create workflows (eventually)
- Workflows stored in database (future)
- A/B testing different flows
- Faster iteration (no code deploy)

### Key Design Patterns

1. **Registry Pattern**: `WorkflowRegistry[type]` → config
2. **Template Interpolation**: `{{customer.name}}` → "Acme Corp"
3. **Action System**: Buttons trigger actions (`showArtifact`, `nextStep`)
4. **Service Layer**: Components don't talk to DB directly
5. **Composition**: Small components (<200 lines) compose into features

### Related Systems

1. **Plans → Workflows → Steps** (Automation hierarchy)
2. **WorkflowConfig → Steps → Branches** (UI hierarchy)
3. **Bridge**: `WorkflowService` maps automation → UI

---

## 🎬 Getting Started

### Prerequisites

- Node.js 18+
- Existing renubu app running
- Automation system set up (`automation/` directory)

### Day 1: Start Checkpoint 1.1

```bash
# Create refactor directory structure
cd src/app
mkdir -p refactor/workflows/renewal-planning/components

# Create first checkpoint
# Follow Checkpoint 1.1 instructions above
# Build WorkflowShell, StepProgress, page.tsx

# Test
npm run dev
# Visit localhost:3000/refactor/workflows/renewal-planning

# Validate against UI Test Checklist 1.1
```

### Checkpoint Workflow

For each checkpoint:

1. **Read checkpoint description** (What You're Building)
2. **Study implementation code** (Implementation section)
3. **Build the feature** (create/update files)
4. **Test manually** (UI Test Checklist)
5. **Check all boxes** ✅
6. **Demo to stakeholder** (get approval)
7. **Move to next checkpoint**

### When You Get Stuck

1. **Check existing code**: Look at current `TaskModeAdvanced.tsx` for patterns
2. **Review automation docs**: `automation/PROJECT-SUMMARY.md`
3. **Compare with old system**: `/app/test-templated-dynamic` vs `/refactor`
4. **Simplify**: If checkpoint too complex, break into smaller pieces

---

## 📊 Success Metrics

### Quantitative

- ✅ Component size: 0 files > 300 lines
- ✅ Config size: 0 files > 200 lines
- ✅ UI tests passed: 12 / 12 checkpoints
- ✅ Performance: Dashboard <2s load with 50 workflows
- ✅ Bundle size: 20% smaller than old system

### Qualitative

- ✅ Stakeholder can demo workflows easily
- ✅ New workflow = 1 config file, no code changes
- ✅ Developer onboarding: Understand system in <1 hour
- ✅ Confidence: Can make changes without fear of breaking

---

## 🚀 Timeline Summary

| Phase | Weeks | Checkpoints | Deliverable |
|-------|-------|-------------|-------------|
| Phase 1: Foundation | 1-2 | 3 | Working modal with chat + artifacts |
| Phase 2: Config System | 3-4 | 3 | Config-driven workflows |
| Phase 3: Integration | 5-6 | 3 | Automation connected |
| Phase 4: Production | 7-8 | 3 | Migration complete |

**Total**: 8 weeks, 12 validation checkpoints

---

## 📝 Notes

- Each checkpoint builds on the previous
- Don't skip checkpoints (dependencies)
- Get stakeholder sign-off at each phase boundary
- Document any deviations from plan
- Update this README as you learn

---

**Last Updated**: October 7, 2025
**Status**: Ready to start Checkpoint 1.1
**Next Action**: Create `src/app/refactor/workflows/renewal-planning/page.tsx`
