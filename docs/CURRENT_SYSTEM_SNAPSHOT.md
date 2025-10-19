# Current System Snapshot - zen-dashboard

**Created:** 2025-10-15
**Git Commit:** `bb21fad` (Created new artifact templates for expansion & exec engagement)
**Purpose:** Safety net before consolidation refactor - document exactly how zen-dashboard works today

---

## System Status: ✅ WORKING

The zen-dashboard currently functions correctly with 3 workflows in sequence:
1. Obsidian Black - Strategic Account Planning
2. TechFlow - Expansion Opportunity
3. Obsidian Black - Executive Engagement

---

## File Structure

### Primary Entry Point
```
src/app/zen-dashboard/page.tsx (227 lines)
```
- Uses TaskModeModal from TaskModeAdvanced
- Manages workflow sequences via workflowSequences.ts
- Hard-coded fallback data (lines 71-79)

### Workflow Renderer
```
src/components/artifacts/workflows/TaskModeAdvanced.tsx
```
- Config-driven modal renderer
- Loads from workflowRegistry
- Currently only 2 workflows registered (renewal-planning, bluesoft-account-overview)

### Hardcoded Workflows
```
src/components/workflows/TaskModeFullscreen.tsx (99,580 bytes!)
```
- Contains 3 demo workflows with all business logic
- Hard-coded data:
  - Lines 116-195: techFlowData (expansion workflow)
  - Lines 198-241: obsidianBlackStakeholders (executive engagement)
  - Lines 244-278: Step configurations for each workflow
- Workflow type detection via workflowId string matching

### Workflow Registry
```
src/components/artifacts/workflows/configs/workflows/workflowRegistry.ts
```
Currently registered:
- 'renewal-planning' → renewalPlanningWorkflow
- 'bluesoft-account-overview' → accountOverviewWithQAConfig

### Workflow Sequences
```
src/config/workflowSequences.ts (141 lines)
```
Defines 'bluesoft-demo-2025' sequence with 4 workflows:
- Day 1: obsblk-strategic-planning (Obsidian Black)
- Day 2: techflow-expansion-opportunity (TechFlow)
- Day 3: obsblk-executive-engagement (Obsidian Black)
- Day 4: bluesoft-account-overview (Bluesoft)

---

## Data Flow

### Launch Flow
```
1. User navigates to /zen-dashboard?sequence=bluesoft-demo-2025
   ↓
2. useEffect (lines 41-57) parses URL params
   ↓
3. getWorkflowSequence('bluesoft-demo-2025') → WorkflowSequence object
   ↓
4. Sets sequenceId, sequenceIndex=0, prepares first workflow
   ↓
5. User clicks "Start Planning" button
   ↓
6. handleLaunchWorkflow() (lines 88-100):
   - Sets activeWorkflow state
   - Opens TaskModeModal
   ↓
7. TaskModeModal renders with:
   - workflowId: 'obsblk-strategic-planning'
   - customerId: '550e8400-e29b-41d4-a716-446655440001' (Obsidian Black)
   - sequenceInfo: { sequenceId, currentIndex, totalCount, handlers }
```

### Workflow Resolution
```
TaskModeAdvanced.tsx (lines 109-133):
1. Receives workflowId prop ('obsblk-strategic-planning')
2. Calls getWorkflow(workflowId) from workflowRegistry
3. Returns WorkflowConfig object OR undefined
4. If undefined, modal shows "Configuration not found"
```

### Sequence Navigation
```
handleNextWorkflow() in zen-dashboard/page.tsx (lines 102-128):
1. Checks if hasNextWorkflow(sequenceId, sequenceIndex)
2. If yes:
   - Increments sequenceIndex
   - Loads next workflow from sequence
   - Keeps modal open
3. If no:
   - Closes modal
   - Resets sequence state
```

---

## Hard-Coded Data Inventory

### zen-dashboard/page.tsx

**Lines 71-79: Fallback Priority Workflow**
```typescript
{
  id: 'obsblk-strategic-planning',
  title: 'Complete Strategic Account Plan for Obsidian Black',
  customerId: '550e8400-e29b-41d4-a716-446655440001',
  customerName: 'Obsidian Black',
  priority: 'Critical',
  dueDate: 'Today',
  arr: '$185K'
}
```
Used when: API `/api/dashboard/today-workflows` fails

**Line 191: Completion Tracking**
```typescript
completedWorkflowIds={new Set()} // TODO: Track completion state
```
Should be: Stored in database or local storage

### TaskModeFullscreen.tsx

**Lines 116-195: techFlowData**
```typescript
const techFlowData = {
  contract: { licenseCount: 100, pricePerSeat: 6.50, ... },
  usage: { activeUsers: 140, utilizationPercent: 140, ... },
  market: { currentPrice: 6.50, marketAverage: 10.20, ... },
  scenarios: [ /* 3 detailed expansion scenarios */ ]
}
```
Purpose: Demo data for TechFlow expansion workflow
Should be: Fetched from database

**Lines 198-241: obsidianBlackStakeholders**
```typescript
const obsidianBlackStakeholders = [
  {
    name: 'Marcus Castellan',
    role: 'Chief Operating Officer',
    relationshipStrength: 'weak',
    communicationStyle: '...',
    keyConcerns: [...],
    leveragePoints: [...]
  }
  // ... more stakeholders
]
```
Purpose: Demo data for executive engagement workflow
Should be: Fetched from CRM/database

**Lines 244-278: Workflow-Specific Logic**
- Step configurations (7 steps per workflow)
- Initial greetings
- Artifact configurations
- All embedded in conditional branches

### workflowSequences.ts

**Lines 33-72: bluesoftDemo2025**
```typescript
workflows: [
  {
    workflowId: 'obsblk-strategic-planning',
    title: 'Complete Strategic Account Plan for Obsidian Black',
    customerId: '550e8400-e29b-41d4-a716-446655440001',
    customerName: 'Obsidian Black',
    day: 'Day 1'
  },
  // ... 3 more workflows
]
```
Status: Acceptable - demo sequences can be hardcoded

---

## Database State

### Tables Exist (from migrations)
- ✅ `workflow_executions` - Workflow state tracking
- ✅ `workflow_step_executions` - Step progress
- ✅ `customers`, `contacts`, `contracts`, `renewals` - Customer data
- ✅ `demo_operations`, `demo_support_tickets`, `demo_strategic_plans` - Demo-specific
- ✅ `profiles` with `demo_godmode` column

### Data Population Status
- ⚠️ Likely EMPTY or minimal seed data
- Database schema exists but not actively used by zen-dashboard
- Fallback to hardcoded data when database queries fail

---

## Working Workflows

### 1. Obsidian Black - Strategic Account Planning
- **Type:** Strategic workflow (INVEST strategy)
- **Steps:** 7 steps (greeting → assessment → overview → recommendation → plan → summary)
- **Artifacts:** PlanningChecklist, AccountAssessment, AccountOverview, RecommendationSlide, StrategicAccountPlan, PlanSummary
- **Data:** Hardcoded in TaskModeFullscreen

### 2. TechFlow - Expansion Opportunity
- **Type:** Opportunity workflow
- **Steps:** 7 steps (greeting → assessment → overview → scenarios → proposal → summary)
- **Artifacts:** GrowthAssessment, ExpansionOverview, PricingTable, ExpansionProposal
- **Data:** techFlowData (lines 116-195)

### 3. Obsidian Black - Executive Engagement
- **Type:** Relationship workflow
- **Steps:** 7 steps (greeting → strategy → profiles → talking points → email → summary)
- **Artifacts:** ExecutiveEngagementStrategy, StakeholderProfile, TalkingPoints, EmailArtifact
- **Data:** obsidianBlackStakeholders (lines 198-241)

---

## Key Dependencies

### npm Packages (relevant to workflows)
- Next.js (app routing)
- React (hooks, state management)
- Tailwind CSS (styling)
- lucide-react (icons)
- Supabase (database client, not actively used)

### Internal Dependencies
```
zen-dashboard/page.tsx
├── TaskModeModal (TaskModeAdvanced)
│   ├── workflowRegistry.getWorkflow()
│   ├── CustomerOverview
│   ├── Analytics
│   ├── ChatInterface
│   └── ArtifactsPanel
├── workflowSequences.getWorkflowSequence()
├── TodaysWorkflows component
└── QuickActions component
```

---

## Routes

- `/zen-dashboard` - Main dashboard (currently working)
- `/zen-dashboard?sequence=bluesoft-demo-2025` - Launch workflow sequence
- `/demo-dashboard` - Alternative dashboard (uses WorkflowExecutor, modern system)

---

## Known Issues / Limitations

1. **Hardcoded customer data** - All demo data in code, not database
2. **Workflow registration gap** - Only 2 workflows in registry, but 3 in sequence
3. **Two parallel systems** - TaskModeAdvanced (config) vs TaskModeFullscreen (hardcoded)
4. **No completion tracking** - Completed workflows not persisted
5. **Manual test only** - No automated tests

---

## Success Criteria (For Parity)

A replacement system must:
- ✅ Launch from `/zen-dashboard` URL
- ✅ Support workflow sequences (4 workflows chained)
- ✅ Load workflow by workflowId
- ✅ Display all artifacts correctly
- ✅ Navigate between workflows with "Next Customer" button
- ✅ Close modal and reset state properly
- ✅ Handle sequence completion gracefully
- ✅ Show customer context (name, metrics)

---

## Rollback Instructions

If refactor fails:
```bash
# Revert to this commit
git reset --hard bb21fad

# Or restore from backup
cp -r src/app/zen-dashboard-legacy src/app/zen-dashboard
```

---

## Testing Procedure

See `ZEN_DASHBOARD_TEST_CHECKLIST.md` for manual testing steps.

---

**This snapshot preserves the working state. DO NOT modify these files until v2 is tested and confirmed working.**
