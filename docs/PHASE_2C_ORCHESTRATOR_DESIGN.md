# Phase 2C: Orchestrator Architecture Design

**Date:** 2025-10-15
**Branch:** demo/bluesoft-2025
**Status:** Design Phase

---

## Executive Summary

**Goal:** Create "ONE HUGE file" orchestrator that coordinates database, config, actions, automations, and artifacts with branched modular files

**User Directive:**
> "I want one HUGE file, with branched modules depending on circumstance of one modularized file where the db, config, actions, automations, and artifacts are all orchestrated in one place."

**Target File Sizes:**
- WorkflowOrchestrator.tsx: ~300 lines (master coordinator)
- Workflow definitions: ~150 lines each
- Step components: ~150 lines each
- Data providers: ~100-200 lines each (created in Phase 2B)

---

## Orchestrator Pattern Overview

### Current Architecture (Phase 2A/2B)

```
TaskModeFullscreen-v2.tsx (1900 lines after 2B)
├── All 3 workflows in one file
├── All step logic in one file
├── All artifact rendering in one file
├── All state management in one file
└── Hardcoded workflow routing
```

**Problem:** Single massive file, hard to maintain, unclear responsibilities

### Target Architecture (Phase 2C)

```
WorkflowOrchestrator.tsx (~300 lines)
├── Receives: workflowId, customerId
├── Loads: Data via providers (Phase 2B)
├── Routes: To appropriate workflow definition
├── Manages: Global state (navigation, completion)
└── Renders: Workflow UI + sequence controls

├── workflows/definitions/
│   ├── StrategicPlanningWorkflow.tsx (~150 lines)
│   ├── ExpansionOpportunityWorkflow.tsx (~150 lines)
│   └── ExecutiveEngagementWorkflow.tsx (~150 lines)
│
├── workflows/steps/ (reusable across workflows)
│   ├── GreetingStep.tsx (~100 lines)
│   ├── AssessmentStep.tsx (~150 lines)
│   ├── OverviewStep.tsx (~150 lines)
│   └── ActionPlanStep.tsx (~150 lines)
│
└── lib/data-providers/ (Phase 2B)
    ├── contractProvider.ts (~150 lines)
    ├── stakeholderProvider.ts (~100 lines)
    └── workflowContextProvider.ts (~200 lines)
```

**Benefit:** Modular, testable, clear separation of concerns

---

## WorkflowOrchestrator.tsx Design

### Responsibilities (300 lines)

1. **Data Loading** (20 lines)
   - Use workflowContextProvider from Phase 2B
   - Handle loading/error states
   - Pass data to workflow definitions

2. **Workflow Routing** (50 lines)
   - Detect workflow type from workflowId
   - Load appropriate workflow definition
   - Handle unknown workflows gracefully

3. **Global State Management** (80 lines)
   - Current step tracking
   - Completion status
   - Sequence navigation (next workflow, jump to workflow)
   - Artifact visibility

4. **UI Rendering** (100 lines)
   - Header (customer name, metrics, close button)
   - Workflow content area
   - Sequence navigation panel
   - Global modals/overlays

5. **Lifecycle Hooks** (50 lines)
   - onWorkflowComplete
   - onStepChange
   - onError
   - Auto-save state

### Interface

```typescript
// src/components/workflows/WorkflowOrchestrator.tsx

export interface WorkflowOrchestratorProps {
  workflowId: string;
  workflowTitle: string;
  customerId: string;
  customerName: string;
  onClose: () => void;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };
}

export default function WorkflowOrchestrator({
  workflowId,
  workflowTitle,
  customerId,
  customerName,
  onClose,
  sequenceInfo
}: WorkflowOrchestratorProps) {
  // 1. DATA LOADING (20 lines)
  const { customer, expansionData, stakeholders, loading, error } =
    useWorkflowContext(workflowId, customerId);

  // 2. WORKFLOW ROUTING (50 lines)
  const WorkflowComponent = useWorkflowRouter(workflowId);

  // 3. GLOBAL STATE (80 lines)
  const [currentStep, setCurrentStep] = useState('greeting');
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [workflowComplete, setWorkflowComplete] = useState(false);

  // 4. UI RENDERING (100 lines)
  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      {/* Header with customer name, metrics, close button */}
      <WorkflowHeader customer={customer} onClose={onClose} />

      {/* Main workflow content area */}
      <div className="workflow-content">
        {loading && <LoadingState />}
        {error && <ErrorState error={error} />}
        {WorkflowComponent && (
          <WorkflowComponent
            customer={customer}
            expansionData={expansionData}
            stakeholders={stakeholders}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onComplete={() => setWorkflowComplete(true)}
          />
        )}
      </div>

      {/* Sequence navigation panel */}
      {sequenceInfo && (
        <WorkflowSequencePanel
          sequenceId={sequenceInfo.sequenceId}
          currentIndex={sequenceInfo.currentIndex}
          totalCount={sequenceInfo.totalCount}
          onNextWorkflow={sequenceInfo.onNextWorkflow}
          onJumpToWorkflow={sequenceInfo.onJumpToWorkflow}
        />
      )}
    </div>
  );

  // 5. LIFECYCLE HOOKS (50 lines)
  useEffect(() => {
    // Auto-save state
    // Track analytics
    // Handle keyboard shortcuts
  }, [currentStep, completedSteps]);
}
```

---

## Workflow Definition Pattern

### Interface (Each workflow implements this)

```typescript
// src/components/workflows/types.ts

export interface WorkflowDefinitionProps {
  customer: CustomerContext;
  expansionData?: ExpansionData;      // Optional, for expansion workflows
  stakeholders?: Stakeholder[];        // Optional, for engagement workflows
  currentStep: string;
  onStepChange: (step: string) => void;
  onComplete: () => void;
}

export interface WorkflowStep {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  condition?: (context: WorkflowContext) => boolean; // When to show this step
}
```

### Example: Strategic Planning Workflow (~150 lines)

```typescript
// src/components/workflows/definitions/StrategicPlanningWorkflow.tsx

import { WorkflowDefinitionProps, WorkflowStep } from '../types';
import GreetingStep from '../steps/GreetingStep';
import AssessmentStep from '../steps/AssessmentStep';
import OverviewStep from '../steps/OverviewStep';
import RecommendationStep from '../steps/RecommendationStep';
import StrategicPlanStep from '../steps/StrategicPlanStep';
import ActionPlanStep from '../steps/ActionPlanStep';

export default function StrategicPlanningWorkflow({
  customer,
  stakeholders,
  currentStep,
  onStepChange,
  onComplete
}: WorkflowDefinitionProps) {

  // STEP DEFINITIONS (40 lines)
  const steps: WorkflowStep[] = [
    { id: 'greeting', label: 'Overview', component: GreetingStep },
    { id: 'assessment', label: 'Assessment', component: AssessmentStep },
    { id: 'overview', label: 'Account Overview', component: OverviewStep },
    { id: 'recommendation', label: 'Recommendation', component: RecommendationStep },
    { id: 'strategic-plan', label: 'Strategic Plan', component: StrategicPlanStep },
    { id: 'action-plan', label: 'Action Plan', component: ActionPlanStep }
  ];

  // STATE (20 lines)
  const [assessmentData, setAssessmentData] = useState(null);
  const [strategyType, setStrategyType] = useState<'expand' | 'invest' | 'protect'>('expand');

  // STEP NAVIGATION (30 lines)
  const handleNextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      onStepChange(steps[currentIndex + 1].id);
    } else {
      onComplete();
    }
  };

  // RENDERING (60 lines)
  const CurrentStepComponent = steps.find(s => s.id === currentStep)?.component;

  return (
    <div className="workflow-container">
      {/* Side panel with step navigation */}
      <StepSidebar steps={steps} currentStep={currentStep} onStepClick={onStepChange} />

      {/* Main content area */}
      <div className="step-content">
        {CurrentStepComponent && (
          <CurrentStepComponent
            customer={customer}
            stakeholders={stakeholders}
            assessmentData={assessmentData}
            strategyType={strategyType}
            onAssessmentComplete={setAssessmentData}
            onStrategySelect={setStrategyType}
            onNext={handleNextStep}
          />
        )}
      </div>
    </div>
  );
}
```

**Total:** ~150 lines per workflow

---

## Step Component Pattern

### Interface (All steps implement this)

```typescript
// src/components/workflows/steps/types.ts

export interface StepComponentProps {
  customer: CustomerContext;
  onNext: () => void;
  onBack?: () => void;
  // Step-specific props passed from workflow definition
  [key: string]: any;
}
```

### Example: Assessment Step (~150 lines)

```typescript
// src/components/workflows/steps/AssessmentStep.tsx

export default function AssessmentStep({
  customer,
  onNext,
  onAssessmentComplete
}: StepComponentProps) {

  // STATE (20 lines)
  const [opportunityScore, setOpportunityScore] = useState(5);
  const [riskScore, setRiskScore] = useState(5);
  const [opportunityReason, setOpportunityReason] = useState('');
  const [riskReason, setRiskReason] = useState('');

  // HANDLERS (30 lines)
  const handleSubmit = () => {
    const assessment = {
      opportunityScore,
      riskScore,
      opportunityReason,
      riskReason
    };
    onAssessmentComplete(assessment);
    onNext();
  };

  // RENDERING (100 lines)
  return (
    <div className="assessment-step">
      <h2>Account Assessment</h2>

      {/* Opportunity Scoring */}
      <div className="assessment-section">
        <label>Opportunity Score (1-10)</label>
        <Slider value={opportunityScore} onChange={setOpportunityScore} />
        <textarea
          value={opportunityReason}
          onChange={(e) => setOpportunityReason(e.target.value)}
          placeholder="What makes this a strong opportunity?"
        />
      </div>

      {/* Risk Scoring */}
      <div className="assessment-section">
        <label>Risk Score (1-10)</label>
        <Slider value={riskScore} onChange={setRiskScore} />
        <textarea
          value={riskReason}
          onChange={(e) => setRiskReason(e.target.value)}
          placeholder="What are the key risks?"
        />
      </div>

      {/* Navigation */}
      <button onClick={handleSubmit}>Continue</button>
    </div>
  );
}
```

**Total:** ~150 lines per step

---

## Workflow Router

### Purpose
Routes workflowId to appropriate workflow definition component

```typescript
// src/components/workflows/hooks/useWorkflowRouter.tsx

import StrategicPlanningWorkflow from '../definitions/StrategicPlanningWorkflow';
import ExpansionOpportunityWorkflow from '../definitions/ExpansionOpportunityWorkflow';
import ExecutiveEngagementWorkflow from '../definitions/ExecutiveEngagementWorkflow';

export function useWorkflowRouter(workflowId: string) {
  // String matching (for now, can move to database later)
  if (workflowId.includes('strategic') || workflowId.includes('planning')) {
    return StrategicPlanningWorkflow;
  }

  if (workflowId.includes('expansion') || workflowId.includes('opportunity')) {
    return ExpansionOpportunityWorkflow;
  }

  if (workflowId.includes('executive') || workflowId.includes('engagement')) {
    return ExecutiveEngagementWorkflow;
  }

  console.error(`Unknown workflow: ${workflowId}`);
  return null;
}
```

**Total:** ~50 lines

---

## File Structure Summary

```
src/components/workflows/
├── WorkflowOrchestrator.tsx              (300 lines) ⭐ THE ONE HUGE FILE
├── types.ts                              (50 lines)  Common interfaces
│
├── definitions/                          Workflow-specific logic
│   ├── StrategicPlanningWorkflow.tsx     (150 lines)
│   ├── ExpansionOpportunityWorkflow.tsx  (150 lines)
│   └── ExecutiveEngagementWorkflow.tsx   (150 lines)
│
├── steps/                                Reusable step components
│   ├── GreetingStep.tsx                  (100 lines)
│   ├── AssessmentStep.tsx                (150 lines)
│   ├── OverviewStep.tsx                  (150 lines)
│   ├── RecommendationStep.tsx            (150 lines)
│   ├── StrategicPlanStep.tsx             (150 lines)
│   ├── ActionPlanStep.tsx                (150 lines)
│   ├── GrowthAssessmentStep.tsx          (150 lines)
│   ├── ExpansionProposalStep.tsx         (150 lines)
│   ├── EmailComposerStep.tsx             (150 lines)
│   └── StakeholderProfileStep.tsx        (150 lines)
│
├── hooks/                                Routing & utilities
│   ├── useWorkflowRouter.tsx             (50 lines)
│   └── useStepNavigation.tsx             (80 lines)
│
└── components/                           Shared UI components
    ├── StepSidebar.tsx                   (100 lines)
    ├── WorkflowHeader.tsx                (80 lines)
    └── WorkflowSequencePanel.tsx         (120 lines) [existing]

src/lib/data-providers/                   Data fetching (Phase 2B)
├── contractProvider.ts                   (150 lines)
├── stakeholderProvider.ts                (100 lines)
└── workflowContextProvider.ts            (200 lines)

src/components/artifacts/                 Display components (existing)
├── PlanSummaryArtifact.tsx               (existing)
├── StrategicAccountPlanArtifact.tsx      (existing)
├── ExpansionOverviewArtifact.tsx         (existing)
└── ... (all existing artifacts)
```

---

## Migration Strategy

### Phase 2C.1: Create Orchestrator Shell

**Tasks:**
1. Create WorkflowOrchestrator.tsx with basic structure
2. Integrate workflowContextProvider from Phase 2B
3. Add global state management
4. Implement header + layout
5. Add sequence navigation

**Result:** Empty orchestrator that can render workflow content area

### Phase 2C.2: Extract Strategic Planning Workflow

**Tasks:**
1. Create StrategicPlanningWorkflow.tsx
2. Extract greeting, assessment, overview steps from TaskModeFullscreen-v2
3. Create step components (GreetingStep, AssessmentStep, OverviewStep)
4. Wire workflow to orchestrator
5. Test Strategic Planning workflow end-to-end

**Result:** One workflow fully migrated to orchestrator pattern

### Phase 2C.3: Extract Remaining Workflows

**Tasks:**
1. Create ExpansionOpportunityWorkflow.tsx
2. Extract expansion-specific steps
3. Create ExecutiveEngagementWorkflow.tsx
4. Extract engagement-specific steps
5. Test all 3 workflows in orchestrator

**Result:** All workflows migrated, orchestrator complete

### Phase 2C.4: Update zen-dashboard-v2

**Tasks:**
1. Replace TaskModeFullscreen-v2 with WorkflowOrchestrator in zen-dashboard-v2
2. Keep TaskModeFullscreen-v2 as fallback (commented out)
3. Test all 3 workflows in zen-dashboard-v2

**Result:** zen-dashboard-v2 uses orchestrator, TaskModeFullscreen-v2 retired

---

## File Size Analysis

### Current (After Phase 2B)

| File | Lines | Notes |
|------|-------|-------|
| TaskModeFullscreen-v2.tsx | ~1900 | Monolithic |

### After Phase 2C

| Category | File | Lines | Total |
|----------|------|-------|-------|
| **Orchestrator** | WorkflowOrchestrator.tsx | 300 | **300** ⭐ |
| **Workflows** | StrategicPlanningWorkflow.tsx | 150 | **450** |
| | ExpansionOpportunityWorkflow.tsx | 150 | |
| | ExecutiveEngagementWorkflow.tsx | 150 | |
| **Steps** | 10 step components | ~150 each | **1500** |
| **Hooks** | useWorkflowRouter, useStepNavigation | ~80 each | **160** |
| **Shared UI** | StepSidebar, WorkflowHeader | ~100 each | **200** |
| **Data Providers** | (from Phase 2B) | ~450 | **450** |

**Total:** ~3060 lines (vs 1900 monolithic)

**Analysis:**
- More total code BUT:
  - Each file <300 lines ✅
  - Clear responsibilities ✅
  - Testable in isolation ✅
  - Reusable across workflows ✅
  - WorkflowOrchestrator is "ONE HUGE" coordinator ✅

---

## Integration with zen-dashboard-v2

### Before (Phase 2B)

```typescript
// zen-dashboard-v2/page.tsx
<TaskModeFullscreen-v2
  workflowId={workflowId}
  customerId={customerId}
  customerName={customerName}
  onClose={onClose}
  sequenceInfo={sequenceInfo}
/>
```

### After (Phase 2C)

```typescript
// zen-dashboard-v2/page.tsx
<WorkflowOrchestrator
  workflowId={workflowId}
  customerId={customerId}
  customerName={customerName}
  onClose={onClose}
  sequenceInfo={sequenceInfo}
/>
```

**Same interface!** Drop-in replacement

---

## Success Criteria

### Phase 2C Complete When:

- [ ] WorkflowOrchestrator.tsx created (~300 lines)
- [ ] All 3 workflow definitions created (~150 lines each)
- [ ] All step components created (~150 lines each)
- [ ] Workflow router functional
- [ ] zen-dashboard-v2 uses WorkflowOrchestrator
- [ ] All 3 workflows work in orchestrator
- [ ] TaskModeFullscreen-v2 retired (kept as reference)
- [ ] File size target met (all files <300 lines)

---

## Benefits of Orchestrator Pattern

### For Development
- ✅ Clear file structure (easy to find code)
- ✅ Small files (quick to understand)
- ✅ Step reusability (share across workflows)
- ✅ Easy to add new workflows (follow pattern)
- ✅ Testable (mock data providers)

### For MVP
- ✅ Database-driven (no hardcoded data)
- ✅ Modular (add workflows without refactoring)
- ✅ Maintainable (clear separation of concerns)
- ✅ Scalable (orchestrator coordinates everything)

### For Demo
- ✅ Identical UI to current (no visual changes)
- ✅ Same workflow flow (no UX changes)
- ✅ Faster to iterate (change one file, not monolith)

---

## Next Phase Preview

**Phase 2D: File Size Review & Modularization Plan**

After orchestrator complete:
1. Review all files >300 lines
2. Identify modularization opportunities
3. Extract reusable components
4. Consolidate duplicate logic

**Then Phase 2E:** Execute modularization

**Then Phase 2F:** Test zen-dashboard-v2 thoroughly

**Then Phase 2G:** Merge back to zen-dashboard

---

**Phase 2C Status:** Design Complete, Ready to Implement
**Blockers:** Requires Phase 2B completion (data providers)
**Next Action:** Complete Phase 2B, then start 2C.1 (orchestrator shell)
