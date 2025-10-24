# Renewal Workflows - Complete Summary

**Created:** October 7, 2025
**Status:** ✅ 3 workflows defined, ready for backend implementation

---

## 🎯 What We Built

We created **3 complete renewal workflow definitions** using the unified schema pattern. Each workflow has backend execution logic AND UI configuration in a single file.

### Workflow Comparison

| Workflow | Days Until Renewal | Urgency | Base Score | Steps | Focus |
|----------|-------------------|---------|------------|-------|-------|
| **Emergency** | 0-6 days | CRITICAL (100) | 90 | 3 | Fast action, emergency protocols |
| **Critical** | 7-30 days | HIGH (80) | 80 | 3 | Structured execution, proposal prep |
| **Prepare** | 120-179 days | MEDIUM (40) | 50 | 3 | Strategic planning, relationship building |

---

## 📁 Files Created

### 1. Emergency Renewal (`renewal-configs/1-Emergency.ts`) - 645 lines

**Purpose:** Handle last-minute renewals with maximum urgency

**Steps:**
1. **Assess Emergency Risk** (10min)
   - LLM analyzes urgent situation
   - Risk triage assessment
   - Retention offer recommendations
   - Artifacts: Risk analysis, action plan, retention offers

2. **Emergency Outreach** (15min)
   - AI generates email/call scripts
   - Personalized for urgency
   - Tracks email sends and calls
   - Artifacts: Email drafts, call scripts

3. **Track Outcome** (5min)
   - Document results
   - Capture learnings
   - Record next actions
   - Artifacts: Outcome summary

**Key Features:**
- 🚨 Maximum urgency indicators throughout
- Retention offer recommendations (discount %)
- Emergency call scripts with objection handlers
- Fast-track decision making

---

### 2. Critical Renewal (`renewal-configs/2-Critical.ts`) - 347 lines

**Purpose:** Execute structured renewal process with sense of urgency

**Steps:**
1. **Comprehensive Risk Assessment** (15min)
   - Full renewal likelihood analysis
   - Risk vs. success factors
   - Stakeholder engagement plan
   - Recommended renewal strategy
   - Artifacts: Assessment report with metrics

2. **Stakeholder Engagement** (20min)
   - Personalized outreach for top 3 stakeholders
   - Email and call scripts tailored by role
   - Multi-contact orchestration
   - Artifacts: 3 email templates, call scripts

3. **Renewal Proposal** (20min)
   - Professional business proposal
   - Multiple pricing options
   - Executive-ready materials
   - Export to PDF capability
   - Artifacts: Proposal document, pricing comparison

**Key Features:**
- ⚠️ High urgency, structured approach
- Multi-week action timeline
- Multiple pricing scenarios
- Professional proposal generation

---

### 3. Prepare Renewal (`renewal-configs/7-Prepare.ts`) - 728 lines

**Purpose:** Proactive renewal preparation with time for strategic planning

**Steps:**
1. **Strategic Relationship Assessment** (20min)
   - Comprehensive 4-6 month view
   - Relationship strength analysis
   - Expansion opportunity identification
   - Risk & opportunity profile
   - Strategic action plan with phases
   - Artifacts: Strategic assessment, expansion analysis, multi-month plan

2. **Value Demonstration Plan** (15min)
   - ROI quantification
   - Success story development
   - Feature adoption initiatives
   - Executive materials package
   - Artifacts: ROI calculator, success stories, adoption plan, exec deck

3. **Relationship Building** (10min)
   - QBR planning and scheduling
   - Executive engagement strategy
   - Multi-month touch calendar
   - Artifacts: QBR plan, exec engagement plan, touch calendar

**Key Features:**
- 📋 Strategic, forward-looking approach
- Expansion/upsell focus (not just defense)
- Multi-month phased planning
- Value demonstration emphasis
- Relationship-building activities

---

## 🔑 Key Concepts Demonstrated

### 1. **Unified Schema Pattern**
Every workflow follows the same structure:
```typescript
{
  // Metadata
  id, type, stage, name, description,
  baseScore, urgencyScore,
  trigger: { type, config },

  // Steps array
  steps: [
    {
      id, name, type, estimatedTime,

      // Backend
      execution: {
        llmPrompt,
        dataRequired,
        processor,
        outputs
      },

      // Frontend
      ui: {
        chat: { initialMessage, branches },
        artifacts: [...]
      }
    }
  ]
}
```

### 2. **Progressive Complexity**
- **Emergency**: Simpler, faster workflows (3 quick steps)
- **Critical**: More comprehensive (detailed proposals)
- **Prepare**: Most sophisticated (multi-month planning, expansion focus)

### 3. **Variable Injection Throughout**
Same variables work in:
- LLM prompts: `{{customer.name}}`
- Chat messages: `{{customer.arr}}`
- Artifacts: `{{intelligence.riskScore}}`
- Calculated values: `{{math workflow.daysUntilRenewal / 30}}`

### 4. **Step Output Chaining**
- Step 1 produces `outputs.renewal_strategy`
- Step 2 uses `{{outputs.renewal_strategy.approach}}` in LLM prompt
- Step 3 references all previous outputs

### 5. **Artifact Type Diversity**
We used 15+ artifact types across workflows:
- `report`, `alert`, `metric`, `list`, `timeline`, `key-value`
- `checklist`, `comparison`, `email`, `script`, `document`
- `calculator`, `collection`, `action_plan`, `document_package`
- `opportunities`, `meeting_plan`, `engagement_plan`, `calendar`

---

## 📊 By The Numbers

| Metric | Value |
|--------|-------|
| **Total Workflows** | 3 |
| **Total Steps** | 9 |
| **Total Lines of Code** | 1,720 |
| **Avg Lines per Workflow** | 573 |
| **Artifact Types Used** | 15+ |
| **LLM Prompts Defined** | 9 |
| **Backend Processors Referenced** | 9 |
| **Variable Scopes** | 5 (customer, intelligence, data, outputs, workflow) |

---

## ✅ What's Complete

1. **Workflow Definitions** - All 3 renewal workflows fully defined
2. **Backend Execution Logic** - LLM prompts, data requirements, processors specified
3. **UI Configuration** - Chat flows, artifacts, buttons, branches complete
4. **Variable Injection** - Consistent variable usage throughout
5. **Step Dependencies** - Output chaining between steps defined
6. **Documentation** - EMERGENCY-WORKFLOW-EXPLAINED.md created

---

## 🚧 What's Next (Your Backend Implementation)

### Phase 1: Backend Processors (Week 1-2)

Create the processor files referenced in workflows:

**Analyzers** (Step 1 execution):
```
automation/processors/analyzers/
├── emergencyRiskAssessment.js
├── criticalRiskAssessment.js
└── strategicRenewalAssessment.js
```

Each analyzer:
- Receives customer context from database
- Calls LLM with filled-in prompt
- Parses LLM response
- Returns structured outputs

**Generators** (Step 2-3 execution):
```
automation/processors/generators/
├── emergencyOutreach.js
├── stakeholderEngagement.js
├── renewalProposal.js
├── valueDemonstrationPlan.js
└── relationshipPlan.js
```

**Trackers** (Final step execution):
```
automation/processors/trackers/
├── emergencyOutcome.js
├── criticalProgress.js
└── (future trackers)
```

---

### Phase 2: Intelligence Processing (Week 3-4)

Build the system that generates the `intelligence` and `data` objects:

```
automation/intelligence/
├── intelligence-processor.js       # Main processor
├── llm-analyzer.js                # LLM interface
├── data-enrichment.js             # Salesforce, usage data
└── prompts/
    ├── analyze-customer-risk.txt
    ├── generate-renewal-strategy.txt
    └── draft-outreach-email.txt
```

**intelligence-processor.js responsibilities:**
1. Receive webhook from Active (customer data update)
2. Fetch additional data from Salesforce, usage DB
3. Call LLM to analyze all data
4. Generate `intelligence` object with:
   - `riskScore`, `healthScore`, `sentiment`
   - `aiSummary`, `insights`, `recommendations`
5. Store in `customer_intelligence` table

**Output format:**
```javascript
{
  intelligence: {
    riskScore: 72,
    healthScore: 65,
    sentiment: "declining",
    aiSummary: "Customer shows declining engagement...",
    insights: [
      { type: "risk", severity: "high", message: "..." }
    ],
    recommendations: ["Schedule executive call", "Review pricing"]
  },
  data: {
    salesforce: { opportunities: [...], contacts: [...] },
    usage: { trend: "down", changePercent: -23, ... },
    financials: { currentARR: 500000, arrHistory: [...] },
    engagement: { lastMeeting: "2025-09-15", ... }
  }
}
```

---

### Phase 3: Workflow Execution Engine (Week 5-6)

Build the system that actually executes workflows:

```
automation/execution/
├── workflow-state-manager.js      # State machine
├── workflow-step-executor.js      # Runs individual steps
├── variable-injector.js           # {{var}} replacement
└── action-handler.js              # Executes actions (send_email, etc.)
```

**workflow-step-executor.js flow:**
```javascript
async function executeStep(workflowId, stepId) {
  // 1. Load workflow definition
  const workflow = await loadWorkflowConfig(workflowId);
  const step = workflow.steps.find(s => s.id === stepId);

  // 2. Gather required data
  const context = await gatherContext(step.execution.dataRequired);

  // 3. Inject variables into LLM prompt
  const filledPrompt = injectVariables(step.execution.llmPrompt, context);

  // 4. Call LLM
  const llmResponse = await callClaude(filledPrompt);

  // 5. Run processor
  const processor = require(`./processors/${step.execution.processor}`);
  const outputs = await processor.process(llmResponse, context);

  // 6. Store outputs for next step
  await storeStepOutputs(workflowId, stepId, outputs);

  // 7. Return context for UI
  return {
    outputs,
    updatedContext: { ...context, outputs }
  };
}
```

---

### Phase 4: API Layer (Week 7-8)

Create REST APIs for UI consumption:

```
automation/api/
└── routes/
    ├── workflows-queue.js         # GET /api/workflows/queue/:csmId
    ├── workflows-execute.js       # POST /api/workflows/:id/execute
    ├── workflows-steps.js         # POST /api/workflows/:id/steps/:stepId/complete
    └── workflows-context.js       # GET /api/workflows/:id/context
```

**Example API implementation:**
```javascript
// GET /api/workflows/queue/:csmId
app.get('/api/workflows/queue/:csmId', async (req, res) => {
  const { csmId } = req.params;

  // Use existing workflow-orchestrator.js
  const assignments = getWorkflowQueueForCSM(csmId, 'company-id');

  // Load workflow configs
  const workflows = assignments.map(a => ({
    id: a.workflow.id,
    customer: a.customer,
    workflow: {
      type: a.workflow.type,
      priorityScore: a.workflow.priority_score,
      assignedTo: a.assigned_to,
      status: 'pending'
    },
    intelligence: a.context.intelligence,  // From customer_intelligence table
    config: loadWorkflowConfig(a.workflow.type)  // From renewal-configs/*.ts
  }));

  res.json({ workflows });
});

// POST /api/workflows/:workflowId/steps/:stepId/complete
app.post('/api/workflows/:workflowId/steps/:stepId/complete', async (req, res) => {
  const { workflowId, stepId } = req.params;
  const { outcomes } = req.body;

  // Execute next step automatically
  const nextStep = await executeStep(workflowId, getNextStepId(stepId));

  // Update workflow state
  await updateWorkflowState(workflowId, {
    currentStep: nextStep.id,
    completedSteps: [...existing, stepId]
  });

  res.json({
    success: true,
    nextStep,
    workflow: await getWorkflowState(workflowId)
  });
});
```

---

## 🎯 Integration with UI Engineer

### Handoff Points:

1. **Week 4 Meeting** - Show UI engineer these workflow configs
   - They'll use them to build WorkflowEngine component
   - Align on variable injection syntax
   - Confirm artifact type rendering

2. **Week 5-6** - Connect APIs
   - UI calls your queue endpoint
   - UI renders workflows using configs
   - Test full loop with real customer data

3. **Week 7-8** - End-to-end demo
   - Data from Active → Intelligence → Assignment → UI → Execution → Completion
   - Ready for design partners

---

## 📖 Documentation Files

- `EMERGENCY-WORKFLOW-EXPLAINED.md` - Deep dive into Emergency workflow structure
- `WORKFLOWS-SUMMARY.md` - This file (overview of all 3)
- Individual workflow files:
  - `renewal-configs/1-Emergency.ts`
  - `renewal-configs/2-Critical.ts`
  - `renewal-configs/7-Prepare.ts`

---

## 🚀 Success Criteria

By end of Week 8, you should be able to:

✅ **Ingest data** - Active webhook → Intelligence processor → Database
✅ **Analyze** - LLM generates insights, risk scores, recommendations
✅ **Assign** - Workflow orchestrator assigns Emergency/Critical/Prepare based on days
✅ **Execute** - Step executor runs backend processors, generates outputs
✅ **Track** - State manager records progress, step completions
✅ **API** - REST endpoints serve data to UI
✅ **Demo** - Full flow from data ingestion to workflow completion

---

**Next Action:** Start building backend processors (Phase 1) using workflow definitions as specification.
