# Renubu Intelligent Workflow System
## Complete System Architecture (UI + Backend)

**Version:** 1.0
**Date:** October 7, 2025
**Status:** In Development (Parallel Tracks)

---

## 🎯 Executive Summary

### The Vision

An intelligent, AI-powered customer success workflow system that:
1. **Ingests** real-time customer data from multiple sources
2. **Analyzes** using AI to generate insights and risk scores
3. **Assigns** workflows to CSMs based on priority and workload
4. **Guides** CSMs through structured workflows with beautiful UI
5. **Tracks** outcomes and continuously improves

### The Complete User Journey

```
Customer shows risk signal in Active
    ↓
AI analyzes data, generates insights (Backend)
    ↓
System assigns "Emergency Renewal" workflow to Sarah (Backend)
    ↓
Sarah opens dashboard, sees workflow in queue (UI)
    ↓
Sarah clicks "Start Workflow" (UI)
    ↓
Beautiful modal opens with AI-generated context (UI)
    ↓
Sarah works through 4 steps with pre-populated data (UI + Backend)
    ↓
Each step completion tracked in database (Backend)
    ↓
Workflow completes, outcomes recorded (Backend)
    ↓
Sarah moves to next customer in queue (UI)
```

### Success Metrics

By Week 8:
- ✅ Data flows from Active → AI Analysis → Workflow Assignment
- ✅ CSMs see intelligent, prioritized workflow queues
- ✅ Workflows execute with beautiful, templated UI
- ✅ Step completion tracked, outcomes recorded
- ✅ System is demoable to design partners

---

## 🏗️ System Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: DATA INGESTION & INTELLIGENCE                     │
│  (Backend - Orchestration Engineer)                         │
├─────────────────────────────────────────────────────────────┤
│  • Active data feeds                                         │
│  • Salesforce integration                                    │
│  • intelligence-processor.js (AI analysis)                   │
│  • customer_intelligence table                               │
│  • LLM prompts for insight generation                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: WORKFLOW ORCHESTRATION                            │
│  (Backend - Orchestration Engineer)                         │
├─────────────────────────────────────────────────────────────┤
│  • workflow-determination.js (business rules)                │
│  • workflow-scoring.js (priority algorithm)                  │
│  • workflow-orchestrator.js (assignment)                     │
│  • workflow-state-manager.js (state machine)                 │
│  • workflow-step-executor.js (step logic)                    │
│  • workflow_instances table                                  │
│  • REST APIs for UI consumption                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: PRESENTATION & USER INTERACTION                   │
│  (Frontend - UI Refactor Engineer)                          │
├─────────────────────────────────────────────────────────────┤
│  • WorkflowShell, ChatPanel, ArtifactPanel                   │
│  • WorkflowEngine (config interpreter)                       │
│  • Workflow config templates                                 │
│  • WorkflowService (API bridge)                              │
│  • Variable injection system                                 │
│  • User interaction handlers                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Architecture

### Complete Flow: Customer Risk → CSM Action

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. DATA SOURCES                                                  │
└───────────┬──────────────────────────────────────────────────────┘
            │
            ├─→ Active (Customer Intelligence Platform)
            │   • Usage metrics
            │   • Engagement scores
            │   • Risk signals
            │
            ├─→ Salesforce
            │   • Opportunity data
            │   • Account info
            │   • Contact details
            │
            └─→ Product Analytics
                • Feature adoption
                • User activity
                • Support tickets
                ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. INTELLIGENCE PROCESSING (Backend)                             │
├──────────────────────────────────────────────────────────────────┤
│ intelligence-processor.js                                        │
│ ├─→ Receives webhook from Active                                │
│ ├─→ Enriches with Salesforce data                               │
│ ├─→ Analyzes trends (compares to historical)                    │
│ ├─→ Calls LLM: "Analyze this customer's risk..."               │
│ ├─→ Generates structured insights                               │
│ └─→ Stores in customer_intelligence table                       │
│                                                                  │
│ Output:                                                          │
│ {                                                                │
│   customerId: 'acme-corp',                                       │
│   riskScore: 72,                                                 │
│   aiSummary: 'Customer shows declining engagement...',          │
│   trends: {                                                      │
│     usage: { direction: 'down', magnitude: -23% },              │
│     support: { tickets: 5, avgResolutionTime: '12h' }          │
│   },                                                             │
│   recommendations: ['Schedule executive call', 'Review pricing']│
│ }                                                                │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. WORKFLOW DETERMINATION (Backend)                              │
├──────────────────────────────────────────────────────────────────┤
│ renewal-planning-agent.js                                        │
│ ├─→ Reviews customer intelligence                               │
│ ├─→ Checks renewal date (days until)                            │
│ ├─→ Applies business rules                                      │
│ └─→ Determines workflow type                                    │
│                                                                  │
│ Decision Logic:                                                  │
│ IF days_until_renewal <= 6 AND riskScore > 70                  │
│   THEN assign "Emergency Renewal" workflow                      │
│ ELSE IF days_until_renewal <= 30                                │
│   THEN assign "Critical Renewal" workflow                       │
│ ELSE IF 30 < days_until_renewal <= 179                         │
│   THEN assign "Prepare Renewal" workflow                        │
│ ELSE                                                             │
│   THEN assign "Monitor Renewal" workflow                        │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. PRIORITY SCORING (Backend)                                    │
├──────────────────────────────────────────────────────────────────┤
│ workflow-scoring.js                                              │
│ ├─→ Base score from workflow type (Emergency = 90 pts)          │
│ ├─→ ARR multiplier (>$150k = 2x)                                │
│ ├─→ Account plan weight (invest = 1.5x)                         │
│ ├─→ CSM workload penalty (-2 pts per active workflow)           │
│ └─→ Calculate final priority score                              │
│                                                                  │
│ Example Calculation:                                             │
│ (90 base × 2.0 ARR × 1.5 plan × 1.1 experience) - 10 workload  │
│ = 287 priority points                                            │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. WORKFLOW ASSIGNMENT (Backend)                                 │
├──────────────────────────────────────────────────────────────────┤
│ workflow-orchestrator.js                                         │
│ ├─→ Creates workflow instance in database                       │
│ ├─→ Assigns to appropriate CSM                                  │
│ ├─→ Sets initial state: 'pending'                               │
│ └─→ Adds to CSM's workflow queue                                │
│                                                                  │
│ Database: workflow_instances                                     │
│ {                                                                │
│   id: 'wf-12345',                                                │
│   customer_id: 'acme-corp',                                      │
│   workflow_type: 'emergency-renewal',                            │
│   assigned_to: 'sarah@company.com',                              │
│   priority_score: 287,                                           │
│   status: 'pending',                                             │
│   context_data: {                                                │
│     customer: {...},                                             │
│     intelligence: {...},                                         │
│     recommendations: [...]                                       │
│   },                                                             │
│   current_step: null,                                            │
│   created_at: '2025-10-07T10:30:00Z'                            │
│ }                                                                │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. CSM DASHBOARD (UI)                                            │
├──────────────────────────────────────────────────────────────────┤
│ Dashboard.tsx                                                    │
│ ├─→ Calls: GET /api/workflows/queue?csm=sarah                  │
│ ├─→ Receives sorted workflow list                               │
│ └─→ Renders queue with priorities                               │
│                                                                  │
│ UI Display:                                                      │
│ ┌────────────────────────────────────────────────────┐          │
│ │ Sarah's Queue - 8 Active Workflows                 │          │
│ ├────────────────────────────────────────────────────┤          │
│ │ 🔴 Acme Corp - Emergency Renewal (287 pts)        │          │
│ │    Risk: 72 | Usage down 23% | 3 days left        │          │
│ │    [View Intelligence] [Start Workflow]            │          │
│ │                                                    │          │
│ │ 🟡 TechCo - Critical Renewal (156 pts)            │          │
│ │    Risk: 45 | Healthy | 28 days left              │          │
│ │    [Start Workflow]                                │          │
│ └────────────────────────────────────────────────────┘          │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
            Sarah clicks "Start Workflow" on Acme Corp
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. WORKFLOW EXECUTION BEGINS (UI + Backend)                      │
├──────────────────────────────────────────────────────────────────┤
│ UI: WorkflowService.executeWorkflow('wf-12345')                 │
│ ├─→ POST /api/workflows/wf-12345/execute                        │
│ └─→ Backend updates status: 'pending' → 'in_progress'           │
│                                                                  │
│ UI: WorkflowEngine renders workflow                              │
│ ├─→ Loads config: WorkflowRegistry['emergency-renewal']         │
│ ├─→ Injects variables from context_data                         │
│ └─→ Renders WorkflowShell with first step                       │
│                                                                  │
│ UI Display (Modal):                                              │
│ ┌────────────────────────────────────────────────────┐          │
│ │ Emergency Renewal - Acme Corp              [X]     │          │
│ ├────────────────────────────────────────────────────┤          │
│ │ ① Assess Risk  ② Review Contract  ③ Draft Plan    │          │
│ ├────────────────────────────────────────────────────┤          │
│ │ CHAT                      │ ARTIFACTS              │          │
│ │                           │                        │          │
│ │ AI: "Acme Corp shows      │ [Risk Analysis]        │          │
│ │ declining engagement      │                        │          │
│ │ (-23% usage). Customer    │ Risk Score: 72/100     │          │
│ │ has 3 days until          │                        │          │
│ │ renewal. Recommend        │ Trends:                │          │
│ │ immediate executive       │ • Usage: ↓ 23%        │          │
│ │ outreach."                │ • Support: 5 tickets   │          │
│ │                           │ • Engagement: Low      │          │
│ │ [Review Risk Details]     │                        │          │
│ │ [Schedule Call]           │ AI Recommendation:     │          │
│ │ [Draft Outreach]          │ "Schedule exec call    │          │
│ │                           │  within 24h"           │          │
│ └───────────────────────────┴────────────────────────┘          │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
            Sarah clicks "Schedule Call"
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. STEP EXECUTION (UI + Backend)                                 │
├──────────────────────────────────────────────────────────────────┤
│ UI: Button click handler                                         │
│ ├─→ Updates local UI state (shows loading)                      │
│ ├─→ Calls: WorkflowService.handleAction('schedule-call')        │
│ └─→ POST /api/workflows/wf-12345/actions/schedule-call          │
│                                                                  │
│ Backend: workflow-step-executor.js                               │
│ ├─→ Executes step logic (creates calendar invite)               │
│ ├─→ Calls LLM to generate meeting agenda                        │
│ ├─→ Updates workflow_instances.context_data                      │
│ └─→ Returns new state to UI                                     │
│                                                                  │
│ UI: Receives response                                            │
│ ├─→ Updates chat: "Meeting scheduled for tomorrow 2pm"          │
│ ├─→ Shows new artifact: [Meeting Agenda]                        │
│ └─→ Enables "Complete Step" button                              │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
            Sarah clicks "Complete Step"
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ 9. STEP COMPLETION (Backend)                                     │
├──────────────────────────────────────────────────────────────────┤
│ UI: POST /api/workflows/wf-12345/steps/assess-risk/complete    │
│ {                                                                │
│   stepId: 'assess-risk',                                         │
│   duration: 420, // seconds                                      │
│   outcomes: {                                                    │
│     action: 'scheduled-call',                                    │
│     callDate: '2025-10-08T14:00:00Z',                           │
│     notes: 'Customer receptive, scheduled exec call'            │
│   }                                                              │
│ }                                                                │
│                                                                  │
│ Backend: workflow-state-manager.js                               │
│ ├─→ Updates workflow_instances.current_step: 'assess-risk'→'review-contract'│
│ ├─→ Records step completion in workflow_step_history            │
│ ├─→ Triggers next step initialization                           │
│ └─→ Returns next step data to UI                                │
│                                                                  │
│ UI: Advances to Step 2 automatically                             │
│ └─→ StepProgress updates (Step 1 green, Step 2 blue)           │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
            Sarah completes all steps
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ 10. WORKFLOW COMPLETION (Backend)                                │
├──────────────────────────────────────────────────────────────────┤
│ UI: POST /api/workflows/wf-12345/complete                       │
│ {                                                                │
│   completedAt: '2025-10-07T11:15:00Z',                          │
│   totalDuration: 2700, // 45 minutes                            │
│   outcomes: {                                                    │
│     status: 'success',                                           │
│     nextSteps: ['Follow up after call', 'Send proposal'],      │
│     confidence: 'high'                                           │
│   }                                                              │
│ }                                                                │
│                                                                  │
│ Backend: workflow-state-manager.js                               │
│ ├─→ Updates status: 'in_progress' → 'completed'                 │
│ ├─→ Records completion timestamp                                │
│ ├─→ Calculates metrics (time spent, steps completed)            │
│ ├─→ Updates customer record                                     │
│ └─→ Triggers analytics recording                                │
│                                                                  │
│ UI: Shows completion screen                                      │
│ └─→ "Workflow complete! Moving to next customer..."            │
└───────────┬──────────────────────────────────────────────────────┘
            ↓
            Dashboard refreshes, shows next workflow
            ↓
            CYCLE REPEATS for next customer
```

---

## 🔧 Technical Architecture

### Backend Components (Orchestration Engineer)

#### 1. Data Layer
```
databases/
├── customer_intelligence (Active data + AI insights)
├── customers (core customer data)
├── contracts (contract terms)
├── renewals (renewal tracking)
├── workflow_instances (active workflows)
├── workflow_step_history (audit trail)
└── scoring_config (algorithm configuration)
```

#### 2. Intelligence Processing
```
intelligence/
├── intelligence-processor.js
│   ├─→ processActiveWebhook(data)
│   ├─→ enrichWithSalesforce(customerId)
│   ├─→ analyzeTrends(customerId)
│   ├─→ callLLM(prompt, context)
│   └─→ storeIntelligence(insights)
│
└── llm-prompts/
    ├── analyze-customer-risk.txt
    ├── generate-renewal-strategy.txt
    └── draft-outreach-email.txt
```

#### 3. Workflow Orchestration
```
workflows/
├── workflow-types.js (type definitions)
├── workflow-data-access.js (DB queries)
├── workflow-determination.js (business rules)
├── workflow-scoring.js (priority algorithm)
├── workflow-orchestrator.js (assignment)
├── workflow-state-manager.js (state machine)
├── workflow-step-executor.js (step logic)
└── renewal-planning-agent.js (renewal-specific)
```

#### 4. Workflow Definitions
```
workflow-templates/
├── renewal/
│   ├── emergency.js (0-6 days)
│   ├── critical.js (7-30 days)
│   ├── prepare.js (120-179 days)
│   └── monitor.js (180+ days)
├── strategic/
│   ├── qbr.js
│   └── health-check.js
└── shared/
    └── step-types.js
```

#### 5. API Layer
```
api/
├── workflows/
│   ├── GET /queue (get CSM's workflows)
│   ├── POST /:id/execute (start workflow)
│   ├── POST /:id/steps/:stepId/complete
│   ├── POST /:id/complete (finish workflow)
│   └── GET /:id/status
├── intelligence/
│   ├── POST /customer/:id/analyze
│   └── GET /customer/:id/insights
└── webhooks/
    └── POST /active/customer-update
```

---

### Frontend Components (UI Refactor Engineer)

#### 1. Core UI Components
```
components/workflows/
├── WorkflowShell.tsx (modal container)
├── StepProgress.tsx (progress indicator)
├── ChatPanel.tsx (chat interface)
├── ArtifactPanel.tsx (artifact display)
└── WorkflowActions.tsx (button handlers)
```

#### 2. Workflow Engine
```
engine/
├── WorkflowEngine.tsx (main orchestrator)
├── ConfigInterpreter.ts (parses configs)
├── VariableInjector.ts ({{customer.name}})
├── ActionHandler.ts (button click logic)
└── StateManager.ts (UI state)
```

#### 3. Config Templates
```
configs/
├── renewal/
│   ├── EmergencyRenewal.ts
│   ├── CriticalRenewal.ts
│   ├── PrepareRenewal.ts
│   └── MonitorRenewal.ts
├── strategic/
│   ├── QBRWorkflow.ts
│   └── HealthCheck.ts
└── WorkflowRegistry.ts (maps types to configs)
```

#### 4. Bridge Layer
```
services/
├── WorkflowService.ts
│   ├─→ getQueue(csmId)
│   ├─→ executeWorkflow(workflowId)
│   ├─→ completeStep(workflowId, stepId, outcomes)
│   ├─→ completeWorkflow(workflowId, outcomes)
│   └─→ handleAction(action, context)
│
└── CustomerService.ts
    └─→ getCustomerContext(customerId)
```

#### 5. Dashboard & Queue
```
dashboard/
├── Dashboard.tsx (main queue view)
├── QueueList.tsx (workflow list)
├── WorkflowCard.tsx (individual item)
└── PriorityBadge.tsx (visual priority)
```

---

## 🔗 Integration Points

### Week 4: Schema Alignment

**Unified Workflow Schema:**
```typescript
interface WorkflowDefinition {
  // Backend metadata
  id: string;
  type: 'renewal' | 'strategic' | 'opportunity' | 'risk';
  stage?: string; // For renewals: "Emergency", "Critical", etc.

  // Execution logic (Backend owns)
  steps: {
    id: string;
    name: string;
    type: 'data_analysis' | 'planning' | 'action' | 'review';
    llmPrompt?: string;
    dataRequired?: string[];
    executor?: string; // Function name to run

    // UI configuration (Frontend owns)
    ui: {
      chat: {
        initialMessage: string;
        buttons: Array<{
          label: string;
          value: string;
          action: string;
        }>;
      };
      artifacts: Array<{
        id: string;
        title: string;
        type: 'report' | 'email' | 'contract' | 'plan';
        template: string;
      }>;
    };
  }[];

  // Priority calculation (Backend)
  baseScore: number;
  urgencyScore?: number;
}
```

### Week 5-6: API Integration

**API Contract:**
```typescript
// GET /api/workflows/queue?csm=sarah
Response: {
  workflows: Array<{
    id: string;
    customerId: string;
    customer: {
      name: string;
      domain: string;
      arr: number;
      renewalDate: string;
    };
    workflow: {
      type: 'emergency-renewal';
      priorityScore: 287;
      assignedTo: 'sarah@company.com';
      status: 'pending';
    };
    context: {
      riskScore: 72;
      aiInsights: {
        summary: string;
        recommendations: string[];
        urgency: 'high' | 'medium' | 'low';
      };
      trends: {
        usage: { direction: 'up' | 'down', magnitude: number };
        support: { tickets: number, avgTime: string };
      };
      salesforce: {
        opportunityStage: string;
        lastActivity: string;
      };
    };
  }>;
}

// POST /api/workflows/:id/execute
Request: { csmId: string }
Response: {
  workflowInstance: WorkflowInstance;
  config: WorkflowDefinition;
  context: CustomerContext;
}

// POST /api/workflows/:id/steps/:stepId/complete
Request: {
  stepId: string;
  duration: number; // seconds
  outcomes: {
    action: string;
    notes?: string;
    artifacts?: string[];
    nextActions?: string[];
  };
}
Response: {
  nextStep: Step | null;
  updatedContext: CustomerContext;
}
```

---

## 📅 Combined Timeline

### Phase 1: Foundation (Weeks 1-2)

**UI Track:**
- ✅ Checkpoint 1.1: Basic workflow shell
- ✅ Checkpoint 1.2: Step navigation
- ⏳ Checkpoint 1.3: Chat + Artifacts

**Backend Track:**
- ✅ Define workflow structures
- ✅ Design step types
- ✅ Create template for 2-3 renewal stages

**Milestone:** Both teams have basic building blocks

---

### Phase 2: Configuration & Processing (Weeks 3-4)

**UI Track:**
- Checkpoint 2.1: Config-driven messages
- Checkpoint 2.2: Config-driven artifacts
- Checkpoint 2.3: Multiple workflow configs

**Backend Track:**
- Build data ingestion API
- Create intelligence-processor.js
- Implement LLM integration
- Store customer intelligence

**Milestone:** UI has templating, Backend has data pipeline

**Week 4 Sync:**
- Schema alignment meeting
- API contract definition
- Integration planning

---

### Phase 3: Integration & Execution (Weeks 5-6)

**UI Track:**
- Checkpoint 3.1: Connect to workflow queue API
- Checkpoint 3.2: Dynamic customer variables
- Checkpoint 3.3: Complete integration loop

**Backend Track:**
- Build workflow execution engine
- Create workflow-state-manager.js
- Implement step executor
- Add workflow_instances table

**Joint Work:**
- API integration
- End-to-end testing
- One complete workflow working

**Milestone:** Full integration, data flows through entire system

---

### Phase 4: Production Ready (Weeks 7-8)

**UI Track:**
- Checkpoint 4.1: Performance & polish
- Checkpoint 4.2: Side-by-side comparison
- Checkpoint 4.3: Migration complete

**Backend Track:**
- Build CSM queue (uses UI components)
- Analytics & reporting
- Error handling
- Performance optimization

**Joint Work:**
- Combined demo preparation
- Design partner testing
- Documentation
- Deployment

**Milestone:** Production-ready system, demo-able to design partners

---

## 🎯 Success Criteria

### Technical Success

**By Week 8, the system must:**

1. ✅ **Data Ingestion**: Accept webhooks from Active, enrich with Salesforce
2. ✅ **AI Analysis**: Generate insights, risk scores, recommendations
3. ✅ **Assignment**: Assign workflows based on priority algorithm
4. ✅ **Queue**: Display prioritized workflows to CSMs
5. ✅ **Execution**: CSMs can work through workflows step-by-step
6. ✅ **Tracking**: All steps and outcomes recorded
7. ✅ **Beautiful**: UI is polished and professional
8. ✅ **Fast**: Dashboard loads <2s, workflows execute smoothly
9. ✅ **Modular**: Components <300 lines, configs <200 lines
10. ✅ **Tested**: Key flows validated with UI checkpoints

### Business Success

**By Design Partner Meeting:**

1. ✅ Demo complete renewal workflow (data → queue → execution → completion)
2. ✅ Show AI-generated insights driving workflow assignment
3. ✅ Demonstrate priority algorithm in action
4. ✅ Walk through CSM experience step-by-step
5. ✅ Show outcomes tracking and reporting
6. ✅ Prove system handles multiple customers/CSMs
7. ✅ Display professional, production-quality UI

---

## 🚀 Key Differentiators

### What Makes This System Special

1. **AI-Powered Intelligence**
   - Not just static workflows, but dynamically generated based on customer data
   - LLM analyzes customer health and generates recommendations
   - Pre-populates workflow context so CSMs don't start from scratch

2. **Intelligent Prioritization**
   - Algorithm considers ARR, urgency, account plan, CSM workload
   - Ensures highest-value, most urgent work gets done first
   - Balances workload across team

3. **Beautiful, Modular UI**
   - Not clunky enterprise software, but modern, polished interface
   - Config-driven templates mean new workflows in minutes
   - Reusable components mean consistent experience

4. **Complete Tracking**
   - Every step, every outcome, every minute tracked
   - Enables analytics: Which workflows work? How long do they take?
   - Continuous improvement through data

5. **Scalable Architecture**
   - Backend and Frontend cleanly separated
   - Can scale each layer independently
   - Easy to add new workflow types

---

## 📏 Component Size Budget

### Target: All Components <300 Lines

**UI Components:**
- WorkflowShell: ~135 lines ✅
- StepProgress: 80 lines ✅
- ChatPanel: ~150 lines (target)
- ArtifactPanel: ~150 lines (target)
- WorkflowEngine: ~200 lines (target)

**Backend Modules:**
- intelligence-processor: ~250 lines (target)
- workflow-state-manager: ~200 lines (target)
- workflow-orchestrator: ~200 lines (exists, under budget ✅)
- workflow-scoring: ~150 lines (exists, under budget ✅)

**Config Files:**
- Each workflow config: <150 lines
- Each workflow template: <200 lines

**Compare to Current:**
- TaskModeAdvanced: 910 lines ❌
- DynamicChatFixedTemplated: 866 lines ❌

---

## 🔮 Future Enhancements (Post-Week 8)

### Phase 2 Features
- Multi-tenant configuration (different companies, different rules)
- Admin UI for algorithm tuning
- A/B testing different workflow templates
- Mobile-responsive UI
- Notifications (Slack, email)

### Phase 3 Features
- Predictive analytics (which customers will churn?)
- Auto-workflow assignment (skip CSM approval)
- Team collaboration (multiple CSMs on one workflow)
- Workflow templates marketplace
- Custom workflow builder (no-code)

### Phase 4 Features
- Integration marketplace (HubSpot, Intercom, Zendesk)
- Advanced analytics dashboard
- AI-generated workflow suggestions
- Auto-pilot mode (AI executes simple workflows)

---

## 📞 Coordination Protocol

### Weekly Sync (Every Monday)
- 30 min standup
- Progress updates from both tracks
- Blockers and dependencies
- Next week's priorities

### Week 4 Integration Meeting
- 2 hours
- Schema alignment
- API contracts
- Integration planning

### Week 5-6 Daily Standups
- 15 min each morning
- Integration blockers
- Quick decisions
- Pair programming sessions as needed

### Week 8 Demo Prep
- Full day
- End-to-end testing
- Demo script writing
- Stakeholder practice run

---

## 🎬 The Demo Story

**What we'll show design partners:**

> "Let me show you how Renubu's intelligent workflow system works.
>
> **[Show Active Dashboard]**
> Here's Acme Corp in our customer intelligence platform. Notice their usage dropped 23% last week and they have 5 support tickets. The AI detected this risk signal.
>
> **[Show Backend Processing]**
> Our system ingested this data, analyzed it with AI, and generated this insight: 'High churn risk due to declining engagement.' It calculated a risk score of 72/100.
>
> **[Show Workflow Assignment]**
> Based on the risk score and 3 days until renewal, the system assigned an 'Emergency Renewal' workflow to Sarah with a priority of 287 points.
>
> **[Show CSM Queue]**
> Sarah logs into her dashboard and sees this workflow at the top of her queue, sorted by priority. She can see the AI summary right here.
>
> **[Click Start Workflow]**
> She clicks to start, and our beautiful UI opens with all the context pre-loaded. The AI has already drafted talking points, analyzed the contract, and recommended next steps.
>
> **[Work Through Steps]**
> Sarah works through each step: assess risk, review contract, draft outreach. At each step, the system provides AI-generated insights and tracks her progress.
>
> **[Complete Workflow]**
> She completes the workflow in 45 minutes, schedules an executive call, and the system records all outcomes. The workflow moves to 'completed' and the next customer appears in her queue.
>
> **[Show Analytics]**
> We can see Sarah completed 8 workflows today, averaging 35 minutes each. The system optimized her queue to focus on high-value, urgent renewals first."

---

**Last Updated:** October 7, 2025
**Status:** In Development - Week 1
**Next Milestone:** Week 4 Integration Meeting
**Contact:** [UI Engineer] & [Backend Engineer]
