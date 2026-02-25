# System Architecture

**Last Updated:** 2025-10-23
**Reading Time:** 30-45 minutes
**Audience:** Engineers, architects

> **Note:** For a high-level product overview, see [System Overview](../product/SYSTEM-OVERVIEW.md).
> For database details, see [Database Schema](DATABASE.md).

---

## Recent Changes
- **2025-10-23:** Added versioning strategy and dashboard architecture guidelines
- **2025-10-23:** Initial consolidated version from COMPLETE-SYSTEM-FLOW.md
- **2025-10-23:** Added step-level actions architecture
- **2025-10-23:** Updated to Phase 3 database-driven workflows
- **2025-10-22:** Added workflow_step_states and workflow_step_actions tables

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Complete User Journey](#complete-user-journey)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Key Components](#key-components)
5. [Phase Evolution](#phase-evolution)
6. [Versioning Strategy & Dashboard Architecture](#versioning-strategy--dashboard-architecture)
7. [Code Reference](#code-reference)

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  1. DATABASE LAYER                       │
│  Supabase/PostgreSQL - Source of truth                  │
│  • workflow_definitions                                  │
│  • workflow_executions                                   │
│  • workflow_step_states                                  │
│  • contracts, customers, renewals                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  2. COMPOSITION LAYER                    │
│  Runtime workflow assembly                               │
│  • db-composer.ts - Fetch from database                  │
│  • composer.ts - Assemble slides                         │
│  • SLIDE_LIBRARY - Reusable slide builders               │
│  • Template Hydrator - Fill placeholders                 │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  3. PRESENTATION LAYER                   │
│  React components render the UI                          │
│  • TaskModeFullscreen - Main orchestrator                │
│  • useTaskModeState - State management hook              │
│  • ChatRenderer, ArtifactRenderer                        │
│  • Step-level action modals (snooze/skip)                │
└─────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Database-Driven** - Workflows stored in database, not code
2. **Template-Based** - Reusable slides with context injection
3. **Component Registry** - Artifact components registered centrally
4. **Audit Trail** - Every action logged for compliance
5. **Multi-Tenant** - Stock workflows + customer overrides

---

## Complete User Journey

### Part 1: Loading the Dashboard

**URL:** `/obsidian-black-v3`

#### Step 1: Server-Side Rendering

**File:** `src/app/obsidian-black-v3/page.tsx:20-104`

```typescript
export default async function ObsidianBlackDashboardV3() {
  // 1. Initialize Supabase server client
  const supabase = await createClient();

  // 2. Fetch workflow from database
  const config = await composeFromDatabase(
    'obsidian-black-renewal',  // workflow_id
    null,                       // company_id (null = stock workflow)
    {
      customer: { name: 'Obsidian Black', current_arr: 185000, ... },
      pricing: { currentARR: 185000, proposedARR: 199800, ... }
    },
    supabase
  );

  // 3. Pass config to client component
  return <ObsidianBlackV3Client initialWorkflowConfig={config} />;
}
```

**What Happens:**
1. Server fetches workflow definition from `workflow_definitions` table
2. `composeFromDatabase()` orchestrates composition
3. Customer data passed as context for template variables
4. Fully assembled workflow sent to browser

---

#### Step 2: Database Composition

**File:** `src/lib/workflows/db-composer.ts:109-146`

```typescript
export async function composeFromDatabase(workflowId, companyId, customerContext) {
  // STEP 1: Fetch workflow definition
  const workflowDef = await fetchWorkflowDefinition(workflowId, companyId);

  // STEP 2: Convert to WorkflowComposition
  const composition = {
    id: workflowDef.workflow_id,
    name: workflowDef.name,
    slideSequence: workflowDef.slide_sequence,
    slideContexts: workflowDef.slide_contexts
  };

  // STEP 3: Build slides using slide library
  const config = buildWorkflowConfig(composition, customerContext, SLIDE_LIBRARY);

  // STEP 4: Hydrate template placeholders
  const hydrationContext = createHydrationContext(customerContext);
  const hydratedConfig = hydrateWorkflowConfig(config, hydrationContext);

  return hydratedConfig;
}
```

**Database Query:**
```sql
SELECT * FROM workflow_definitions
WHERE workflow_id = 'obsidian-black-renewal'
  AND company_id IS NULL
LIMIT 1;
```

**Returns:**
```json
{
  "workflow_id": "obsidian-black-renewal",
  "slide_sequence": ["intro-slide", "account-overview", "pricing-strategy", ...],
  "slide_contexts": {
    "pricing-strategy": {
      "variables": { "recommendationText": "...", "buttons": [...] }
    }
  }
}
```

---

#### Step 3: Slide Library Composition

**File:** `src/lib/workflows/composer.ts:62-134`

```typescript
export function composeWorkflow(composition, slideLibrary, context) {
  const slides = [];

  for (let i = 0; i < composition.slideSequence.length; i++) {
    const slideId = composition.slideSequence[i];
    const slideBuilder = slideLibrary[slideId];
    const slideContext = composition.slideContexts[slideId];

    // Merge runtime context with slide context
    const mergedContext = {
      ...slideContext,
      variables: { ...slideContext?.variables, ...context }
    };

    // Build the slide
    const slideDefinition = slideBuilder(mergedContext);

    // Resolve templates and components
    const workflowSlide = resolveSlideV2(slideDefinition, i, context);
    slides.push(workflowSlide);
  }

  return slides;
}
```

**Slide Library Example:**
```typescript
const accountOverviewSlide = (context) => ({
  id: 'account-overview',
  title: 'Account Overview',
  chat: {
    template: 'account-overview-intro',
    variables: {
      customerName: context.variables.customer.name,
      healthScore: context.variables.customer.health_score
    }
  },
  artifacts: {
    template: 'account-metrics',
    components: [
      { type: 'ContractSummary', props: {...} },
      { type: 'ContactList', props: {...} }
    ]
  }
});
```

---

#### Step 4: Template Hydration

**File:** `src/lib/workflows/hydration/TemplateHydrator.ts`

**Before:**
```
"Good {{timeOfDay}}, {{userName}}. {{customerName}}'s renewal is in {{daysToRenewal}} days."
```

**After:**
```
"Good morning, Justin. Obsidian Black's renewal is in 365 days."
```

**Process:**
1. Find all `{{placeholder}}` patterns
2. Look up value in hydration context
3. Replace with actual value
4. Handle nested objects: `{{customer.name}}` → `'Obsidian Black'`

---

### Part 2: Launching the Task

**User Action:** Clicks "Let's Begin!"

#### Step 5: Create Workflow Execution

**File:** `src/app/obsidian-black-v3/ObsidianBlackV3Client.tsx:86-135`

```typescript
const handleLaunchWorkflow = async () => {
  // 1. Get user ID
  const testUserId = await getTestUserId();

  // 2. Create workflow execution record
  const executionResult = await createWorkflowExecution({
    workflowConfigId: 'obsidian-black-renewal',
    workflowName: 'Renewal Planning for Obsidian Black',
    workflowType: 'renewal',
    customerId: '550e8400-e29b-41d4-a716-446655440001',
    userId: testUserId,
    totalSteps: 6
  });

  // 3. Register config in workflow registry
  registerWorkflowConfig('obsidian-black-renewal', workflowConfig);

  // 4. Open TaskMode
  setTaskModeOpen(true);
  setExecutionId(executionResult.executionId);
};
```

**Database Insert:**
```sql
INSERT INTO workflow_executions (
  workflow_config_id,
  workflow_name,
  workflow_type,
  customer_id,
  user_id,
  total_steps,
  status
) VALUES (
  'obsidian-black-renewal',
  'Renewal Planning for Obsidian Black',
  'renewal',
  '550e8400-e29b-41d4-a716-446655440001',
  'user-uuid',
  6,
  'in_progress'
) RETURNING id;
```

---

#### Step 6: TaskMode Fullscreen Opens

**File:** `src/components/workflows/TaskMode/TaskModeFullscreen.tsx:55-193`

```typescript
export default function TaskModeFullscreen(props) {
  // 1. Initialize state management
  const state = useTaskModeState({
    workflowId: 'obsidian-black-renewal',
    customerId: '550e8400-e29b-41d4-a716-446655440001',
    customerName: 'Obsidian Black',
    onClose
  });

  // 2. Load step states from database
  useEffect(() => {
    if (executionId) {
      const service = new WorkflowStepActionService();
      service.getStepStates(executionId).then(states => {
        setStepStates(states);
      });
    }
  }, [executionId]);

  // 3. Render fullscreen modal
  return (
    <TaskModeContext.Provider value={contextValue}>
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#2D1271] to-[#1a0a3e]">
        <WorkflowHeader />
        <WorkflowStepProgress slides={state.slides} currentIndex={0} />

        <div className="flex h-full">
          <ChatRenderer messages={state.chatMessages} />
          <ArtifactRenderer artifacts={state.currentSlide.artifacts} />
        </div>
      </div>
    </TaskModeContext.Provider>
  );
}
```

---

### Part 3: Navigating Slides

#### Step 7: Button Click Handler

**File:** `src/components/workflows/TaskMode/hooks/useTaskModeState.ts`

```typescript
const handleButtonClick = async (buttonId: string) => {
  const currentMessage = chatMessages[chatMessages.length - 1];
  const button = currentMessage.buttons?.find(b => b.id === buttonId);

  if (!button) return;

  // 1. Handle button action
  if (button.action === 'nextSlide') {
    goToNextSlide();
  }

  // 2. Navigate to branch
  if (button.nextBranchId) {
    handleBranchNavigation(button.nextBranchId);
  }

  // 3. Add user response to chat
  const userMessage = { role: 'user', content: button.label };
  setChatMessages([...chatMessages, userMessage]);

  // 4. Auto-advance
  setTimeout(() => goToNextSlide(), 500);
};
```

**State Update:**
- `currentSlideIndex`: 0 → 1
- New slide loads from `config.slides[1]`
- Chat history preserved

---

### Part 4: Step-Level Actions

#### Step 8: Snooze Step Flow

**User clicks step number → Menu appears → Clicks "Snooze"**

**File:** `src/components/workflows/StepActionModals.tsx`

```typescript
<StepSnoozeModal
  executionId="execution-uuid"
  userId="user-uuid"
  stepIndex={2}
  stepId="pricing-strategy"
  stepLabel="Pricing Analysis"
  onSuccess={() => {
    reloadStepStates();
  }}
/>
```

**Service Call:**

**File:** `src/lib/workflows/actions/WorkflowStepActionService.ts`

```typescript
async snoozeStep(executionId, stepIndex, stepId, stepLabel, userId, options) {
  // 1. Insert into workflow_step_states
  await supabase.from('workflow_step_states').upsert({
    execution_id: executionId,
    step_index: stepIndex,
    step_id: stepId,
    status: 'snoozed',
    snoozed_until: options.snoozeUntil,
    snooze_count: 1
  });

  // 2. Log action
  await supabase.from('workflow_step_actions').insert({
    execution_id: executionId,
    step_index: stepIndex,
    action_type: 'snooze',
    reason: options.reason,
    performed_by: userId
  });

  // 3. Database trigger updates workflow_executions flags
}
```

**Database Updates:**

See [Database Schema](DATABASE.md#workflow-step-states) for table details.

---

## Data Flow Diagrams

### Diagram 1: Loading Dashboard

```
USER navigates to /obsidian-black-v3
    ↓
NEXT.JS SERVER (page.tsx)
    ↓ composeFromDatabase()
DB-COMPOSER (db-composer.ts)
    ↓ fetchWorkflowDefinition()
SUPABASE DATABASE
    ↓ Returns workflow definition
COMPOSER (composer.ts)
    ↓ Loop through slide_sequence
SLIDE LIBRARY (slides/index.ts)
    ↓ Execute slide builders
TEMPLATE HYDRATOR (hydration/TemplateHydrator.ts)
    ↓ Replace {{placeholders}}
CLIENT COMPONENT (ObsidianBlackV3Client.tsx)
    ↓ Render dashboard
BROWSER displays dashboard
```

### Diagram 2: Launching Task

```
USER clicks "Let's Begin!"
    ↓
handleLaunchWorkflow()
    ↓
createWorkflowExecution() → INSERT workflow_executions
    ↓
registerWorkflowConfig()
    ↓
TaskModeFullscreen opens
    ↓
useTaskModeState() initializes
    ↓
Load step states from database
    ↓
Render first slide (index 0)
```

### Diagram 3: Step Snooze

```
USER clicks step number
    ↓
Step action menu appears
    ↓
USER clicks "Snooze"
    ↓
StepSnoozeModal opens
    ↓
USER selects date + clicks "Snooze Step"
    ↓
WorkflowStepActionService.snoozeStep()
    ↓
UPSERT workflow_step_states
    ↓
INSERT workflow_step_actions
    ↓
Database trigger updates workflow_executions
    ↓
reloadStepStates()
    ↓
UI updates with orange badge
```

---

## Key Components

### 1. db-composer.ts

**Purpose:** Fetch workflows from database and orchestrate composition

**Location:** `src/lib/workflows/db-composer.ts`

**Key Functions:**
- `fetchWorkflowDefinition()` - Query database for workflow
- `composeFromDatabase()` - Main entry point
- `listAvailableWorkflows()` - Get available workflows

**Usage:**
```typescript
const config = await composeFromDatabase(
  'workflow-id',
  null, // company_id
  { customer: {...}, pricing: {...} }
);
```

---

### 2. composer.ts

**Purpose:** Build workflow slides from slide library

**Location:** `src/lib/workflows/composer.ts`

**Key Functions:**
- `composeWorkflow()` - Iterate slide sequence, build slides
- `validateComposition()` - Ensure all slides exist
- `resolveSlideV2()` - Handle template-based slides

**Usage:**
```typescript
const slides = composeWorkflow(composition, SLIDE_LIBRARY, context);
```

---

### 3. SLIDE_LIBRARY

**Purpose:** Registry of reusable slide builders

**Location:** `src/lib/workflows/slides/index.ts`

**Structure:**
```typescript
export const SLIDE_LIBRARY: Record<string, UniversalSlideBuilder> = {
  'intro-slide': introSlideBuilder,
  'account-overview': accountOverviewSlideBuilder,
  'pricing-strategy': pricingStrategySlideBuilder,
  // ... 20+ more slides
};
```

**Creating New Slide:**
```typescript
export const myNewSlide: SlideBuilder = (context?: SlideContext) => ({
  id: 'my-new-slide',
  title: 'My New Slide',
  chat: { ... },
  artifacts: { ... }
});
```

---

### 4. TaskModeFullscreen

**Purpose:** Main orchestrator for workflow execution UI

**Location:** `src/components/workflows/TaskMode/TaskModeFullscreen.tsx`

**Responsibilities:**
- Initialize state via `useTaskModeState` hook
- Render chat and artifact panels
- Handle navigation between slides
- Manage step-level actions (snooze/skip)

**Props:**
```typescript
interface TaskModeFullscreenProps {
  workflowId: string;
  customerId: string;
  customerName: string;
  executionId?: string;
  userId?: string;
  onClose: (completed?: boolean) => void;
}
```

---

### 5. useTaskModeState

**Purpose:** Centralized state management for TaskMode

**Location:** `src/components/workflows/TaskMode/hooks/useTaskModeState.ts`

**State Managed:**
- Current slide index
- Chat messages
- Workflow state
- Customer data
- Artifact visibility

**Returns:**
```typescript
{
  slides,
  currentSlide,
  currentSlideIndex,
  goToNextSlide,
  goToPreviousSlide,
  handleButtonClick,
  // ... 20+ more
}
```

---

### 6. WorkflowStepActionService

**Purpose:** Handle step-level snooze/skip/resume actions

**Location:** `src/lib/workflows/actions/WorkflowStepActionService.ts`

**Methods:**
- `snoozeStep()` - Snooze until specified date
- `skipStep()` - Skip with reason
- `resumeStep()` - Resume snoozed step
- `getStepStates()` - Fetch all step states

**Usage:**
```typescript
const service = new WorkflowStepActionService();
await service.snoozeStep(executionId, stepIndex, stepId, stepLabel, userId, {
  snoozeUntil: '2025-10-25 10:00:00',
  reason: 'Waiting for finance approval'
});
```

---

## Phase Evolution

### Phase 1: Hardcoded Configs (2024)

**Approach:** Workflows as TypeScript files

```typescript
// 910-line file
export const workflowConfig: WorkflowConfig = {
  workflowId: 'obsidian-black-pricing',
  slides: [
    { id: 'intro', chat: { ... }, artifacts: { ... } }, // 150 lines
    { id: 'account', chat: { ... }, artifacts: { ... } }, // 150 lines
    // ... 4 more slides
  ]
};
```

**Problems:**
- Code deploy for every workflow
- 910+ lines per workflow
- No multi-tenant support
- Duplication across workflows

---

### Phase 2: Slide Library (Sep 2025)

**Approach:** Reusable slide builders

```typescript
const composition: WorkflowComposition = {
  id: 'obsidian-black-renewal',
  slideSequence: ['intro', 'account-overview', 'pricing'],
  slideContexts: {
    'pricing': { variables: { ... } }
  }
};

const config = composeWorkflow(composition, SLIDE_LIBRARY);
```

**Benefits:**
- Reusable slides
- Less duplication
- Easier maintenance

**Limitations:**
- Still code-based
- Deploy required for new workflows

---

### Phase 3: Database-Driven (Oct 2025 - Current)

**Approach:** Workflows in database

**Database:**
```sql
INSERT INTO workflow_definitions (workflow_id, slide_sequence, slide_contexts)
VALUES ('new-workflow',
  ARRAY['intro', 'pricing', 'summary'],
  '{"pricing": {"variables": {...}}}'::jsonb
);
```

**Benefits:**
- No code deploys
- Multi-tenant support
- A/B testing enabled
- Instant updates

**Current State:**
- ✅ Database schema complete
- ✅ Composition engine complete
- ✅ Template hydration complete
- ✅ Demo workflows working
- 🔄 Step-level actions 90% complete

---

### Phase 4: Visual Builder (Planned Q1 2026)

**Approach:** Drag-and-drop workflow builder UI

**Features:**
- Visual slide sequencing
- Context editor
- Template variable picker
- Preview mode
- Version control

**Timeline:** Q1 2026

---

## Versioning Strategy & Dashboard Architecture

### Dashboard vs Workflow Executor

The codebase has **two distinct types of pages** that serve different purposes:

#### 1. Dashboard Pages (Entry Points)
Pages where users see their workflows/tasks and can launch them.

**Recommended Structure:**
```
/dashboard              → Main user dashboard
```

**Components:**
- WorkflowStatePanel (active, snoozed, escalated tabs)
- NotificationBanner (due workflows, escalations)
- WorkflowAnalyticsDashboard (insights)
- PriorityWorkflowCard (main focus card)

#### 2. Workflow Execution Pages (Runners)
Pages that execute a specific workflow in fullscreen mode.

**Recommended Structure:**
```
/workflows/[executionId]    → Dynamic workflow executor
/workflows/demo/[id]        → Demo/testing workflows
```

**Backend:**
- TaskModeFullscreen component
- Database-driven composition
- Phase 3 architecture

---

### Version Management Rules

#### Rule 1: No Version Suffixes
**❌ NEVER:**
```
my-feature-v2/
my-feature-v3/
my-feature-final/
```

**✅ INSTEAD:**
```
my-feature/                    # Current version (always)
_archive/my-feature-2024-10-23/ # If you must keep old version
```

#### Rule 2: Use Git Branches for Experiments
**❌ NEVER:** Create `/my-feature-experimental` page

**✅ INSTEAD:**
```bash
git checkout -b experiment/new-workflow-ui
# Make changes to /dashboard or /workflows
# Test
# If good: merge to main
# If bad: delete branch
```

#### Rule 3: Feature Flags for A/B Testing
**❌ NEVER:** Create `/dashboard-new-design` for testing

**✅ INSTEAD:**
```tsx
export default function Dashboard() {
  const { useNewDesign } = useFeatureFlags();

  return useNewDesign ? (
    <NewDashboardDesign />
  ) : (
    <CurrentDashboard />
  );
}
```

#### Rule 4: Archive, Don't Delete
When replacing code:
```bash
# Move to archive with date
mv src/components/old-component src/components/_archive/old-component-2024-10-23

# Add deprecation notice
echo "// DEPRECATED 2024-10-23: Use new-component instead" >> old-component.tsx
```

---

### Clean Architecture Guidelines

#### Current State (To Be Cleaned)
```
/obsidian-black          → Legacy dashboard
/obsidian-black-v2       → Deprecated
/obsidian-black-v3       → Current workflow executor template
/demo-dashboard          → CSMDashboard component
/zen-dashboard           → Zen aesthetic dashboard
/zen-dashboard-v2        → Zen V2
```

#### Target State (Clean)
```
/dashboard               → THE dashboard (single source of truth)
/workflows/[id]          → THE workflow executor (dynamic)
/workflows/demo/[id]     → Demo/testing workflows
/_archive/*              → Old versions (don't touch)
```

---

### Migration Strategy

#### Step 1: Identify "Latest" Version
**For Workflow Execution:**
- ✅ **LATEST:** `obsidian-black-v3` and `workflow-demo`
  - Uses database-driven workflows (Phase 3)
  - Fetches from `workflow_definitions` table
  - Multi-tenant ready

**For Dashboards:**
- ✅ **LATEST:** zen-dashboard aesthetic + Phase 3F components
  - Gradient backgrounds (gray-50 to purple-50)
  - Minimal, centered design
  - Database-driven workflows

#### Step 2: Consolidate
1. Create single `/dashboard` page (zen aesthetic + Phase 3F)
2. Create dynamic `/workflows/[executionId]` page
3. Move old versions to `/_archive/`
4. Update all links/references
5. Add deprecation notices

#### Step 3: Maintain
- Never create new version suffixes
- Use Git branches for experiments
- Use feature flags for A/B testing
- Archive when replacing, don't delete

---

### Zen Dashboard Design Principles

When building dashboard UIs, follow these zen aesthetic guidelines:

**Color Palette:**
```css
--zen-gradient-from: #f9fafb;  /* gray-50 */
--zen-gradient-to: #faf5ff;    /* purple-50 */
--zen-card: rgba(255, 255, 255, 0.8);
--zen-border: #e9d5ff;         /* purple-100 */
--zen-accent: #9333ea;         /* purple-600 */
```

**Card Style:**
```tsx
<div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-purple-100 shadow-sm">
  {/* Content */}
</div>
```

**Typography:**
```tsx
<h1 className="text-3xl font-light text-gray-700">  // Greeting
<h2 className="text-2xl font-light text-gray-800">  // Section headers
<p className="text-sm text-gray-400">               // Subtle text
```

**Layout:**
- Centered, minimal design
- Spacious, breathing room
- Soft shadows, rounded corners
- Gradient background
- Purple accents

---

## Code Reference

### File Structure

```
src/
├── app/
│   └── obsidian-black-v3/
│       ├── page.tsx                    ← Server component entry
│       └── ObsidianBlackV3Client.tsx   ← Client component
│
├── components/
│   └── workflows/
│       ├── TaskMode/
│       │   ├── TaskModeFullscreen.tsx  ← Main orchestrator
│       │   ├── TaskModeContext.tsx     ← React context
│       │   └── hooks/
│       │       └── useTaskModeState.ts ← State management
│       ├── sections/
│       │   ├── ChatRenderer.tsx        ← Left panel
│       │   ├── ArtifactRenderer.tsx    ← Right panel
│       │   └── WorkflowStepProgress.tsx ← Progress bar
│       └── StepActionModals.tsx        ← Snooze/skip modals
│
└── lib/
    └── workflows/
        ├── db-composer.ts              ← Database orchestration
        ├── composer.ts                 ← Slide composition
        ├── slides/
        │   ├── index.ts                ← SLIDE_LIBRARY
        │   └── [various slide builders]
        ├── hydration/
        │   └── TemplateHydrator.ts     ← Template variables
        ├── templates/
        │   └── TemplateRegistry.ts     ← Template patterns
        ├── components/
        │   └── ComponentRegistry.ts    ← Artifact components
        └── actions/
            └── WorkflowStepActionService.ts ← Step actions
```

### Important Files

**Server-Side:**
- `src/app/obsidian-black-v3/page.tsx` - Entry point
- `src/lib/workflows/db-composer.ts` - Database fetch
- `src/lib/workflows/composer.ts` - Slide assembly

**Client-Side:**
- `src/components/workflows/TaskMode/TaskModeFullscreen.tsx` - UI orchestrator
- `src/components/workflows/TaskMode/hooks/useTaskModeState.ts` - State
- `src/components/workflows/sections/` - UI sections

**Slides:**
- `src/lib/workflows/slides/index.ts` - SLIDE_LIBRARY registry
- `src/lib/workflows/slides/[slide-name].ts` - Individual slides

**Services:**
- `src/lib/workflows/actions/WorkflowStepActionService.ts` - Step actions
- `src/lib/workflows/actions/index.ts` - createWorkflowExecution

---

## Performance Characteristics

**Dashboard Load:**
- Database query: ~50ms
- Composition: ~100ms
- Hydration: ~10ms
- Total: ~200ms

**Slide Navigation:**
- Instant (client-side state change)

**Step Action:**
- Database write: ~100ms
- UI update: <50ms

**Workflow Completion:**
- Database update: ~100ms
- Confetti animation: 2000ms

---

## Related Documentation

- **[Database Schema](DATABASE.md)** - All tables, migrations, queries
- **[Step Actions Guide](../guides/STEP-ACTIONS.md)** - Implementing step-level actions
- **[Workflow Guide](../guides/WORKFLOWS.md)** - Creating workflows
- **[System Overview](../product/SYSTEM-OVERVIEW.md)** - Product perspective
- **[Roadmap](../planning/ROADMAP.md)** - What's next

---

**Questions?** See [Documentation Hub](../README.md) or contact the engineering team.
