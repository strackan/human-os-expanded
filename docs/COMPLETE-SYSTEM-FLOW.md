# Complete System Flow - Renubu Database-Driven Architecture

**Last Updated:** October 23, 2025
**Current Version:** Phase 3 - Fully Database-Driven
**Demo Dashboard:** Obsidian-Black-v3

---

## Executive Summary

Renubu is a customer success management platform that uses AI-powered workflows to help CSMs manage renewals, expansions, and customer relationships at scale. The system has evolved through three phases:

- **Phase 1:** Hardcoded workflow configurations in TypeScript files
- **Phase 2:** Slide library with composition patterns
- **Phase 3 (Current):** Fully database-driven workflows with template hydration

This document explains **what happens step-by-step** when you:
1. Load the Obsidian Black dashboard
2. Click "Launch Task"
3. Navigate through the workflow slides

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Complete User Journey](#complete-user-journey)
3. [Database Schema](#database-schema)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Key Components](#key-components)
6. [Recent Architectural Changes](#recent-architectural-changes)

---

## System Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     1. DATABASE LAYER                    │
│  Supabase/PostgreSQL - Source of truth for workflows    │
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

---

## Complete User Journey

Let's follow the **exact sequence** of what happens when a user (Justin) opens the Obsidian Black dashboard.

### Part 1: Loading the Dashboard

**URL:** `/obsidian-black-v3`

#### Step 1: Server-Side Rendering (Next.js RSC)

**File:** `src/app/obsidian-black-v3/page.tsx:20-104`

```typescript
// This runs on the server
export default async function ObsidianBlackDashboardV3() {
  // 1. Initialize Supabase server client
  const supabase = await createClient();

  // 2. Fetch workflow from database
  const config = await composeFromDatabase(
    'obsidian-black-renewal',  // workflow_id
    null,                       // company_id (null = stock workflow)
    {
      // 3. Customer context for placeholder hydration
      customer: {
        name: 'Obsidian Black',
        current_arr: 185000,
        health_score: 87,
        contract_end_date: '2026-10-21',
        // ... more customer data
      },
      pricing: {
        currentARR: 185000,
        proposedARR: 199800,
        increasePercent: 8,
        // ... more pricing data
      }
    },
    supabase
  );

  // 4. Pass config to client component
  return <ObsidianBlackV3Client initialWorkflowConfig={config} />;
}
```

**What Happens Here:**
1. Server fetches workflow definition from `workflow_definitions` table
2. `composeFromDatabase()` orchestrates the entire composition process
3. Customer data is passed as context for template variable replacement
4. Fully assembled workflow config is sent to browser

---

#### Step 2: Database Composition

**File:** `src/lib/workflows/db-composer.ts:109-146`

The `composeFromDatabase()` function performs these steps:

```typescript
export async function composeFromDatabase(workflowId, companyId, customerContext) {
  // STEP 1: Fetch workflow definition from database
  const workflowDef = await fetchWorkflowDefinition(workflowId, companyId);

  /*
  Database returns:
  {
    workflow_id: 'obsidian-black-renewal',
    name: 'Renewal Planning for Obsidian Black',
    workflow_type: 'renewal',
    slide_sequence: ['intro-slide', 'account-overview', 'pricing-strategy', ...],
    slide_contexts: {
      'pricing-strategy': {
        variables: { recommendationText: 'We recommend...', buttons: [...] }
      }
    },
    settings: { ... }
  }
  */

  // STEP 2: Convert to WorkflowComposition format
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

  // STEP 5: Return complete WorkflowConfig
  return hydratedConfig;
}
```

**Database Query:**
```sql
SELECT *
FROM workflow_definitions
WHERE workflow_id = 'obsidian-black-renewal'
  AND company_id IS NULL  -- Stock workflow
LIMIT 1;
```

---

#### Step 3: Slide Library Composition

**File:** `src/lib/workflows/composer.ts:62-134`

The composer iterates through the slide sequence and builds each slide:

```typescript
export function composeWorkflow(composition, slideLibrary, context) {
  const slides = [];

  for (let i = 0; i < composition.slideSequence.length; i++) {
    const slideId = composition.slideSequence[i];  // e.g., 'account-overview'
    const slideBuilder = slideLibrary[slideId];    // Function from SLIDE_LIBRARY
    const slideContext = composition.slideContexts[slideId];

    // Merge runtime context (customer, pricing) with slide context
    const mergedContext = {
      ...slideContext,
      variables: {
        ...slideContext?.variables,
        ...context  // Customer + pricing data
      }
    };

    // Build the slide
    const slideDefinition = slideBuilder(mergedContext);

    // Resolve templates and components (V2 slides)
    const workflowSlide = resolveSlideV2(slideDefinition, i, context);
    slides.push(workflowSlide);
  }

  return slides;
}
```

**Example Slide Builder:**
```typescript
// From SLIDE_LIBRARY
const accountOverviewSlide = (context) => ({
  id: 'account-overview',
  title: 'Account Overview',
  chat: {
    template: 'account-overview-intro',  // References template registry
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

Replaces template placeholders with actual values:

```typescript
// Before hydration:
"Good {{timeOfDay}}, {{userName}}. {{customerName}}'s renewal is in {{daysToRenewal}} days."

// After hydration:
"Good morning, Justin. Obsidian Black's renewal is in 365 days."
```

**Hydration Process:**
1. Find all `{{placeholder}}` patterns
2. Look up value in hydration context
3. Replace with actual value
4. Handle nested objects: `{{customer.name}}` → `'Obsidian Black'`

---

#### Step 5: Client Component Receives Config

**File:** `src/app/obsidian-black-v3/ObsidianBlackV3Client.tsx:40-150`

```typescript
export default function ObsidianBlackV3Client({ initialWorkflowConfig }) {
  const [workflowConfig] = useState(initialWorkflowConfig);

  // Dashboard displays:
  return (
    <div>
      <ZenGreeting userName="Justin" />
      <PriorityWorkflowCard
        title="Renewal Planning for Obsidian Black"
        customerName="Obsidian Black"
        arr="$185K"
        onLaunch={handleLaunchWorkflow}
      />
      {/* Other dashboard components */}
    </div>
  );
}
```

**Dashboard UI Shows:**
- **Greeting:** "Good morning, Justin"
- **Today's One Thing:** Large card with workflow title
- **Priority Task:** "Renewal Planning for Obsidian Black - $185K ARR"
- **Quick Actions:** Secondary tasks
- **When You're Ready:** Links to documentation, support

---

### Part 2: Clicking "Launch Task"

**User Action:** Clicks the "Let's Begin!" button on the priority workflow card.

#### Step 6: Create Workflow Execution

**File:** `src/app/obsidian-black-v3/ObsidianBlackV3Client.tsx:86-135`

```typescript
const handleLaunchWorkflow = async () => {
  // 1. Get user ID
  const testUserId = await getTestUserId();

  // 2. Create workflow execution record in database
  const executionResult = await createWorkflowExecution({
    workflowConfigId: 'obsidian-black-renewal',
    workflowName: 'Renewal Planning for Obsidian Black',
    workflowType: 'renewal',
    customerId: '550e8400-e29b-41d4-a716-446655440001',
    userId: testUserId,
    totalSteps: 6  // Number of slides
  });

  // 3. Register config in workflow registry
  registerWorkflowConfig('obsidian-black-renewal', workflowConfig);

  // 4. Open TaskMode fullscreen modal
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
  assigned_csm_id,
  total_steps,
  status
) VALUES (
  'obsidian-black-renewal',
  'Renewal Planning for Obsidian Black',
  'renewal',
  '550e8400-e29b-41d4-a716-446655440001',
  'user-uuid',
  'user-uuid',
  6,
  'in_progress'
) RETURNING id;
```

**Result:**
- New record in `workflow_executions` table
- `executionId` generated (UUID)
- Status set to `in_progress`

---

#### Step 7: TaskMode Fullscreen Opens

**File:** `src/components/workflows/TaskMode/TaskModeFullscreen.tsx:55-193`

```typescript
export default function TaskModeFullscreen(props) {
  // 1. Initialize state management hook
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
        // Load any snoozed/skipped step indicators
        setStepStates(states);
      });
    }
  }, [executionId]);

  // 3. Render fullscreen modal
  return (
    <TaskModeContext.Provider value={contextValue}>
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#2D1271] to-[#1a0a3e]">
        {/* Header with progress */}
        <WorkflowHeader />
        <WorkflowStepProgress slides={state.slides} currentIndex={0} />

        {/* Main content area */}
        <div className="flex h-full">
          {/* Left: Chat Panel */}
          <ChatRenderer messages={state.chatMessages} />

          {/* Right: Artifacts Panel */}
          <ArtifactRenderer artifacts={state.currentSlide.artifacts} />
        </div>
      </div>
    </TaskModeContext.Provider>
  );
}
```

---

### Part 3: Navigating Through Slides

#### Step 8: First Slide - Introduction

**Slide ID:** `intro-slide` (index 0)

**What Renders:**

**Chat Panel (Left):**
```
Good morning, Justin. You've got one critical task for today:

**Renewal Planning for Obsidian Black.**

We need to review contract terms, make sure we've got the right contacts,
and put our initial forecast in.

The full plan is on the right. Ready to get started?

[Review Later]  [Let's Begin!]
```

**Artifacts Panel (Right):**
- **Strategic Plan Artifact:**
  - Goal: Secure renewal at $199,800 ARR (8% increase)
  - Timeline: 365 days until renewal
  - Key Actions:
    1. Review contract terms
    2. Validate contacts
    3. Analyze pricing
    4. Create proposal
    5. Draft communication
    6. Execute plan

---

#### Step 9: User Clicks "Let's Begin!"

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

  // 2. Navigate to branch (if specified)
  if (button.nextBranchId) {
    handleBranchNavigation(button.nextBranchId);
  }

  // 3. Add user response to chat
  const userMessage = {
    role: 'user',
    content: button.label
  };
  setChatMessages([...chatMessages, userMessage]);

  // 4. Auto-advance to next slide
  setTimeout(() => goToNextSlide(), 500);
};
```

**State Update:**
- `currentSlideIndex`: 0 → 1
- New slide loads: `account-overview`
- Chat history preserved

---

#### Step 10: Second Slide - Account Overview

**Slide ID:** `account-overview` (index 1)

**What Renders:**

**Chat Panel (Left):**
```
Please review Obsidian Black's current status to the right:

Key Insights:
• 20% usage increase over prior month
• 4 months to renewal - time to engage
• Paying less per unit than 65% of customers - Room for expansion
• Recent negative comments in support - May need to investigate
• Key contract items - 5% limit on price increases. Consider amendment.

Make sure you've reviewed the contract and stakeholders. When you're ready,
click to move onto pricing.

☐ I have reviewed the contract
☐ I have reviewed the contacts

[Next: Pricing Analysis →]
```

**Artifacts Panel (Right):**

**Tab 1: Contract Summary**
- Current ARR: $185,000
- Contract Start: 2024-10-21
- Contract End: 2026-10-21
- Term: 24 months
- Auto-Renewal: Yes
- Notice Period: 60 days
- Price Cap: 5% annual increase

**Tab 2: Contacts**
- **Primary Contact:**
  - Name: Marcus Chen
  - Title: VP of Engineering
  - Email: marcus.chen@obsidianblack.com
  - Last Contact: 2 weeks ago
- **Executive Sponsor:**
  - Name: Sarah Kim
  - Title: CTO
  - Email: sarah.kim@obsidianblack.com
  - Last Contact: 3 months ago

**Tab 3: Metrics**
- Health Score: 87/100 (Green)
- Usage Trend: +20% MoM
- Support Tickets: 12 this quarter
- NPS Score: 8/10

---

#### Step 11: User Checks Boxes and Advances

```typescript
// Checkboxes update state
const [contractReviewed, setContractReviewed] = useState(false);
const [contactsReviewed, setContactsReviewed] = useState(false);

// Button enabled only when both checked
<button
  disabled={!contractReviewed || !contactsReviewed}
  onClick={() => handleButtonClick('next-pricing')}
>
  Next: Pricing Analysis →
</button>
```

**State Changes:**
- Checkboxes turn green with checkmark
- Button activates
- User clicks → advances to slide 2
- `currentSlideIndex`: 1 → 2

---

### Part 4: Step-Level Actions (New!)

**Recent Addition:** Step-level snooze and skip functionality

#### Step 12: User Wants to Snooze a Step

**User Action:** Clicks on step number in progress bar → Menu appears

**File:** `src/components/workflows/sections/WorkflowStepProgress.tsx`

```typescript
<div onClick={() => onToggleStepActionMenu(index)}>
  {/* Step number */}
  <div className="step-number">{index + 1}</div>
</div>

{stepActionMenu === index && (
  <div className="step-action-menu">
    <button onClick={() => onSnoozeStep(index)}>
      <Clock /> Snooze
    </button>
    <button onClick={() => onSkipStep(index)}>
      <SkipForward /> Skip
    </button>
  </div>
)}
```

**Opens Modal:**

**File:** `src/components/workflows/StepActionModals.tsx`

```typescript
<StepSnoozeModal
  executionId="execution-uuid"
  userId="user-uuid"
  stepIndex={2}
  stepId="pricing-strategy"
  stepLabel="Pricing Analysis"
  onSuccess={() => {
    alert('✅ Step snoozed! It will reappear when due.');
    reloadStepStates();
  }}
/>
```

**Modal UI:**
```
┌─────────────────────────────────────────┐
│ Snooze Step: Pricing Analysis           │
│                                          │
│ When should this step reappear?          │
│                                          │
│ ○ In 2 hours                             │
│ ○ Tomorrow                               │
│ ○ In 3 days                              │
│ ○ Next week                              │
│ ● Custom date: [2025-10-25] [10:00 AM]  │
│                                          │
│ Reason (optional):                       │
│ ┌────────────────────────────────────┐  │
│ │ Waiting for finance approval       │  │
│ └────────────────────────────────────┘  │
│                                          │
│        [Cancel]  [Snooze Step]          │
└─────────────────────────────────────────┘
```

---

#### Step 13: Snooze Action Database Insert

**File:** `src/lib/workflows/actions/WorkflowStepActionService.ts`

```typescript
async snoozeStep(executionId, stepIndex, stepId, stepLabel, userId, options) {
  // 1. Insert into workflow_step_states
  await supabase.from('workflow_step_states').upsert({
    execution_id: executionId,
    step_index: stepIndex,
    step_id: stepId,
    step_label: stepLabel,
    status: 'snoozed',
    snoozed_until: options.snoozeUntil,
    snooze_count: 1
  });

  // 2. Log action in workflow_step_actions
  await supabase.from('workflow_step_actions').insert({
    execution_id: executionId,
    step_index: stepIndex,
    action_type: 'snooze',
    reason: options.reason,
    performed_by: userId,
    metadata: {
      snoozed_until: options.snoozeUntil,
      selected_duration: options.duration
    }
  });

  // 3. Update workflow_executions flags (via trigger)
  // Trigger automatically sets:
  // - has_snoozed_steps = true
  // - next_due_step_date = earliest snoozed step date
}
```

**Database State After Snooze:**

**Table: workflow_step_states**
```
execution_id | step_index | status   | snoozed_until       | snooze_count
─────────────┼────────────┼──────────┼─────────────────────┼─────────────
exec-uuid    | 2          | snoozed  | 2025-10-25 10:00:00 | 1
```

**Table: workflow_step_actions** (audit log)
```
execution_id | step_index | action_type | reason                      | performed_by
─────────────┼────────────┼─────────────┼─────────────────────────────┼─────────────
exec-uuid    | 2          | snooze      | Waiting for finance approval| user-uuid
```

**Table: workflow_executions** (auto-updated by trigger)
```
id        | has_snoozed_steps | next_due_step_date
──────────┼───────────────────┼───────────────────
exec-uuid | true              | 2025-10-25 10:00:00
```

---

#### Step 14: UI Updates to Show Snoozed Step

**File:** `src/components/workflows/sections/WorkflowStepProgress.tsx`

```typescript
const stepState = stepStates[index];
const isSnoozed = stepState?.status === 'snoozed';

return (
  <div className={`step ${isSnoozed ? 'snoozed' : ''}`}>
    {/* Orange badge for snoozed steps */}
    {isSnoozed && (
      <div className="snooze-badge">
        <Clock className="w-3 h-3" />
      </div>
    )}

    <div className="step-number">{index + 1}</div>
    <div className="step-label">{slide.label}</div>
  </div>
);
```

**Visual Result:**
```
┌─────────────────────────────────────────────────────────┐
│ Progress: Step 2 of 6                                   │
├─────────────────────────────────────────────────────────┤
│  [✓]──[✓]──[🕐]──[ ]──[ ]──[ ]                          │
│   1    2    3    4    5    6                            │
│  Intro Account Pricing Quote Email Done                │
│           Overview  ^                                   │
│                     └─ Orange badge (snoozed)           │
└─────────────────────────────────────────────────────────┘
```

---

### Part 5: Workflow Completion

#### Step 15: User Completes Final Slide

**Slide ID:** `summary-slide` (index 5)

```typescript
const handleComplete = async () => {
  if (!executionId) return;

  // 1. Update workflow execution status
  await supabase
    .from('workflow_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completion_percentage: 100
    })
    .eq('id', executionId);

  // 2. Close TaskMode
  onClose(true);

  // 3. Trigger confetti celebration
  triggerConfetti();

  // 4. Show completion message
  alert('🎉 Workflow completed! Great work.');
};
```

**Database Update:**
```sql
UPDATE workflow_executions
SET
  status = 'completed',
  completed_at = NOW(),
  completion_percentage = 100,
  updated_at = NOW()
WHERE id = 'exec-uuid';
```

---

## Database Schema

### Core Tables

#### workflow_definitions
Stores reusable workflow templates.

```sql
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,           -- 'obsidian-black-renewal'
  name TEXT NOT NULL,                  -- 'Renewal Planning for Obsidian Black'
  workflow_type TEXT NOT NULL,         -- 'renewal', 'expansion', 'risk'
  description TEXT,
  slide_sequence TEXT[] NOT NULL,      -- ['intro', 'account-overview', ...]
  slide_contexts JSONB,                -- Per-slide configuration
  settings JSONB,
  is_stock_workflow BOOLEAN DEFAULT false,
  company_id UUID,                     -- NULL for stock workflows
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Row:**
```json
{
  "workflow_id": "obsidian-black-renewal",
  "name": "Renewal Planning for Obsidian Black",
  "workflow_type": "renewal",
  "slide_sequence": [
    "intro-slide",
    "account-overview",
    "pricing-strategy",
    "prepare-quote",
    "email-draft",
    "summary-slide"
  ],
  "slide_contexts": {
    "pricing-strategy": {
      "variables": {
        "recommendationText": "We recommend an 8% increase...",
        "buttons": [
          { "id": "accept", "label": "Accept Recommendation" },
          { "id": "modify", "label": "Modify Pricing" }
        ]
      }
    }
  },
  "is_stock_workflow": true,
  "company_id": null
}
```

---

#### workflow_executions
Tracks individual workflow runs.

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_config_id TEXT NOT NULL,    -- References workflow_definitions.workflow_id
  workflow_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  customer_id UUID,
  user_id UUID NOT NULL,
  assigned_csm_id UUID,
  status TEXT DEFAULT 'in_progress',   -- 'in_progress', 'completed', 'snoozed', 'skipped'
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completion_percentage INTEGER DEFAULT 0,
  has_snoozed_steps BOOLEAN DEFAULT false,
  next_due_step_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### workflow_step_states
Tracks state of individual steps within a workflow.

```sql
CREATE TABLE workflow_step_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id),
  step_index INTEGER NOT NULL,
  step_id TEXT NOT NULL,
  step_label TEXT NOT NULL,
  status TEXT NOT NULL,                -- 'snoozed', 'skipped', 'completed'
  snoozed_until TIMESTAMPTZ,
  snooze_count INTEGER DEFAULT 0,
  skip_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(execution_id, step_index)
);
```

---

#### workflow_step_actions
Audit log of all step-level actions.

```sql
CREATE TABLE workflow_step_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id),
  step_index INTEGER NOT NULL,
  action_type TEXT NOT NULL,           -- 'snooze', 'skip', 'resume', 'complete'
  reason TEXT,
  performed_by UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Recent Schema Changes

#### contract_terms (NEW)
Stores business and legal terms for contracts.

**Migration:** `supabase/migrations/20251023000001_add_contract_terms.sql`

```sql
CREATE TABLE contract_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) UNIQUE,

  -- Pricing
  pricing_model TEXT,                  -- 'per_seat', 'usage_based', 'custom'
  discount_percent NUMERIC,
  payment_terms TEXT,                  -- 'net_30', 'net_60'
  invoicing_schedule TEXT,             -- 'monthly', 'quarterly', 'annual'

  -- Renewal
  auto_renewal BOOLEAN DEFAULT true,
  auto_renewal_notice_days INTEGER DEFAULT 60,
  renewal_price_cap_percent NUMERIC,

  -- Service
  sla_uptime_percent NUMERIC,
  support_tier TEXT,                   -- 'standard', 'premium', 'white_glove'
  response_time_hours INTEGER,

  -- Legal
  liability_cap TEXT,                  -- 'unlimited', '12_months_fees'
  data_residency TEXT[],               -- ['us', 'eu']

  -- Features
  included_features TEXT[],
  usage_limits JSONB,
  overage_pricing JSONB,
  custom_terms JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Separate business terms (rarely change) from contract lifecycle events (change frequently).

---

## Data Flow Diagrams

### Diagram 1: Loading Obsidian Black Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│ USER                                                          │
│ Navigates to /obsidian-black-v3                              │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ NEXT.JS SERVER (page.tsx)                                    │
│ 1. Initialize Supabase client                                │
│ 2. Call composeFromDatabase('obsidian-black-renewal')        │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ DB-COMPOSER (db-composer.ts)                                 │
│ 3. Fetch workflow_definitions                                │
│ 4. Convert to WorkflowComposition format                     │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ SUPABASE DATABASE                                            │
│ Query: SELECT * FROM workflow_definitions                    │
│        WHERE workflow_id = 'obsidian-black-renewal'          │
│ Returns: { slide_sequence, slide_contexts, ... }             │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ COMPOSER (composer.ts)                                       │
│ 5. Loop through slide_sequence                               │
│ 6. For each slideId, call SLIDE_LIBRARY[slideId](context)   │
│ 7. Build WorkflowSlide objects                               │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ SLIDE LIBRARY (slides/index.ts)                              │
│ 8. Execute slide builder functions                           │
│ 9. Return slide definitions with templates                   │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ TEMPLATE HYDRATOR (hydration/TemplateHydrator.ts)            │
│ 10. Replace {{placeholders}} with actual values              │
│     {{customerName}} → 'Obsidian Black'                      │
│     {{timeOfDay}} → 'morning'                                │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ CLIENT COMPONENT (ObsidianBlackV3Client.tsx)                 │
│ 11. Receive complete WorkflowConfig                          │
│ 12. Render dashboard UI                                      │
│     - ZenGreeting                                            │
│     - PriorityWorkflowCard                                   │
│     - TodaysWorkflows                                        │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ BROWSER                                                       │
│ Dashboard visible to user                                     │
└──────────────────────────────────────────────────────────────┘
```

---

### Diagram 2: Launching Task and Navigating Slides

```
┌──────────────────────────────────────────────────────────────┐
│ USER CLICKS "LET'S BEGIN!"                                    │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ ObsidianBlackV3Client.handleLaunchWorkflow()                 │
│ 1. Get test user ID                                          │
│ 2. Create workflow_executions record                         │
│ 3. Register config in workflow registry                      │
│ 4. Open TaskModeFullscreen modal                             │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ DATABASE INSERT                                              │
│ INSERT INTO workflow_executions (...)                        │
│ RETURNS execution_id                                         │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ TaskModeFullscreen.tsx                                       │
│ 5. Initialize useTaskModeState hook                          │
│ 6. Load workflow config from registry                        │
│ 7. Load step states from workflow_step_states               │
│ 8. Render initial slide (index 0)                           │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ SLIDE RENDERING                                              │
│ ChatRenderer (left panel)                                    │
│   - Display initial message                                  │
│   - Show buttons                                             │
│                                                              │
│ ArtifactRenderer (right panel)                               │
│   - Render artifact components                               │
│   - Display strategic plan                                   │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ USER CLICKS BUTTON                                           │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ useTaskModeState.handleButtonClick()                         │
│ 9. Find button action (e.g., 'nextSlide')                   │
│ 10. Execute action                                           │
│ 11. Update currentSlideIndex (0 → 1)                        │
│ 12. Load next slide data                                    │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ NEXT SLIDE RENDERS                                           │
│ - New chat message displayed                                 │
│ - New artifacts loaded                                       │
│ - Progress bar updates                                       │
└──────────────────────────────────────────────────────────────┘
```

---

### Diagram 3: Step-Level Snooze Action

```
┌──────────────────────────────────────────────────────────────┐
│ USER CLICKS STEP NUMBER IN PROGRESS BAR                      │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ WorkflowStepProgress                                         │
│ Show step action menu: [Snooze] [Skip]                      │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ USER CLICKS "SNOOZE"                                         │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ StepSnoozeModal Opens                                        │
│ - Date/time picker                                           │
│ - Reason field                                               │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ USER SELECTS DATE AND CLICKS "SNOOZE STEP"                   │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ WorkflowStepActionService.snoozeStep()                       │
│ 1. Upsert workflow_step_states                              │
│ 2. Insert workflow_step_actions (audit)                     │
│ 3. Database trigger updates workflow_executions flags       │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ DATABASE WRITES                                              │
│ workflow_step_states: status = 'snoozed'                    │
│ workflow_step_actions: action_type = 'snooze'               │
│ workflow_executions: has_snoozed_steps = true               │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ TaskModeFullscreen.reloadStepStates()                        │
│ 4. Fetch updated step states                                │
│ 5. Update UI to show orange badge on step                   │
└────────────────────┬─────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ VISUAL UPDATE                                                │
│ Progress bar shows snoozed step with clock icon              │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. db-composer.ts
**Purpose:** Fetch workflows from database and orchestrate composition.

**Key Functions:**
- `fetchWorkflowDefinition()` - Query database
- `composeFromDatabase()` - Main entry point
- `listAvailableWorkflows()` - Get available workflows

**Location:** `src/lib/workflows/db-composer.ts`

---

### 2. composer.ts
**Purpose:** Build workflow slides from slide library.

**Key Functions:**
- `composeWorkflow()` - Iterate slide sequence and build slides
- `validateComposition()` - Ensure all slides exist
- `resolveSlideV2()` - Handle template-based slides

**Location:** `src/lib/workflows/composer.ts`

---

### 3. SLIDE_LIBRARY
**Purpose:** Registry of reusable slide builders.

**Structure:**
```typescript
export const SLIDE_LIBRARY: Record<string, UniversalSlideBuilder> = {
  'intro-slide': introSlideBuilder,
  'account-overview': accountOverviewSlideBuilder,
  'pricing-strategy': pricingStrategySlideBuilder,
  // ... more slides
};
```

**Location:** `src/lib/workflows/slides/index.ts`

---

### 4. TaskModeFullscreen
**Purpose:** Main orchestrator for workflow execution UI.

**Responsibilities:**
- Initialize state via `useTaskModeState` hook
- Render chat and artifact panels
- Handle navigation between slides
- Manage step-level actions (snooze/skip)

**Location:** `src/components/workflows/TaskMode/TaskModeFullscreen.tsx`

---

### 5. useTaskModeState Hook
**Purpose:** Centralized state management for TaskMode.

**State Managed:**
- Current slide index
- Chat messages
- Workflow state
- Customer data
- Artifact visibility

**Location:** `src/components/workflows/TaskMode/hooks/useTaskModeState.ts`

---

### 6. WorkflowStepActionService
**Purpose:** Handle step-level snooze/skip/resume actions.

**Methods:**
- `snoozeStep()` - Snooze a step until specified date
- `skipStep()` - Skip a step with reason
- `resumeStep()` - Resume a snoozed step
- `getStepStates()` - Fetch all step states for execution

**Location:** `src/lib/workflows/actions/WorkflowStepActionService.ts`

---

## Recent Architectural Changes

### Phase 3: Database-Driven Workflows (Current)

**Date:** October 2025
**Status:** ✅ Complete

**What Changed:**
1. Workflows now stored in `workflow_definitions` table
2. Runtime composition via `db-composer.ts`
3. Template hydration for dynamic content
4. Multi-tenant support (stock + custom workflows)

**Benefits:**
- No code deploys to create new workflows
- Customer-specific workflow customization
- Centralized workflow management
- A/B testing capabilities

**Files Added:**
- `src/lib/workflows/db-composer.ts`
- `src/lib/workflows/hydration/TemplateHydrator.ts`
- `supabase/migrations/20251022000000_workflow_definitions.sql`

---

### Step-Level Actions

**Date:** October 22-23, 2025
**Status:** ✅ 90% Complete (UI integration pending)

**What Changed:**
1. Added `workflow_step_states` table
2. Added `workflow_step_actions` audit log
3. Created `WorkflowStepActionService`
4. Built step snooze/skip modals
5. Auto-update triggers for workflow flags

**Benefits:**
- Users can snooze individual steps
- No need to snooze entire workflow
- Better workflow flexibility
- Audit trail of all actions

**Files Added:**
- `supabase/migrations/20251022000007_step_level_actions.sql`
- `src/lib/workflows/actions/WorkflowStepActionService.ts`
- `src/components/workflows/StepActionModals.tsx`

**Documentation:**
- `docs/STEP-LEVEL-ACTIONS-INTEGRATION.md`
- `docs/STEP-LEVEL-ACTIONS-FIXES.md`

---

### Contract Terms Separation

**Date:** October 23, 2025
**Status:** ✅ Complete

**What Changed:**
1. Created `contract_terms` table
2. Separated business terms from lifecycle data
3. Added `term_months` auto-calculation
4. Created `contract_matrix` view

**Benefits:**
- Business terms in one place
- Reduce duplication
- Support complex pricing models
- Track auto-renewal windows

**Files Added:**
- `supabase/migrations/20251023000000_add_contract_term_months.sql`
- `supabase/migrations/20251023000001_add_contract_terms.sql`
- `docs/CONTRACT-TERMS-GUIDE.md`

---

## Comparison: Old vs. New Architecture

### Phase 1: Hardcoded Configs (Deprecated)

**File:** `src/config/workflows/obsidianBlackPricing.config.ts`

```typescript
export const obsidianBlackPricingConfig: WorkflowConfig = {
  workflowId: 'obsidian-black-pricing',
  slides: [
    {
      id: 'intro',
      title: 'Introduction',
      chat: {
        initialMessage: {
          text: 'Good morning, Justin...',  // ❌ Hardcoded
          buttons: [...]                     // ❌ Hardcoded
        }
      },
      artifacts: {
        sections: [...]                     // ❌ Hardcoded
      }
    },
    // ... 5 more slides, all hardcoded
  ]
};
```

**Problems:**
- ❌ Every workflow requires new TypeScript file
- ❌ Code deploy needed for content changes
- ❌ No multi-tenant support
- ❌ 910+ lines per workflow file

---

### Phase 3: Database-Driven (Current)

**Database:** `workflow_definitions` table

```json
{
  "workflow_id": "obsidian-black-renewal",
  "slide_sequence": ["intro-slide", "account-overview", ...],
  "slide_contexts": {
    "intro-slide": {
      "variables": {
        "greeting": "{{timeOfDay}}",     // ✅ Template
        "customerName": "{{customer.name}}"  // ✅ Dynamic
      }
    }
  }
}
```

**Runtime:** Composed on-demand with customer data

```typescript
// ✅ Fetch from database
const workflowDef = await fetchWorkflowDefinition('obsidian-black-renewal');

// ✅ Apply customer context
const config = composeFromDatabase(workflowDef, customerData);

// ✅ Hydrate templates
hydrateWorkflowConfig(config, { customer, pricing });
```

**Benefits:**
- ✅ No code changes for new workflows
- ✅ Multi-tenant ready
- ✅ Instant updates
- ✅ 50-line configs instead of 910-line files

---

## Summary

### Complete Flow: URL → UI

1. **User navigates** to `/obsidian-black-v3`
2. **Server fetches** workflow from `workflow_definitions` table
3. **Composer builds** slides from `SLIDE_LIBRARY`
4. **Hydrator replaces** template variables with customer data
5. **Client renders** dashboard with workflow card
6. **User clicks** "Launch Task"
7. **Server creates** `workflow_executions` record
8. **TaskMode opens** with slide 0
9. **User navigates** through slides via buttons
10. **User can snooze/skip** individual steps
11. **Database tracks** all actions in audit log
12. **Workflow completes**, confetti triggers, status updated

### Key Technologies

- **Next.js 15** - Server + client rendering
- **React 19** - UI components
- **TypeScript** - Type safety
- **Supabase** - Database + realtime
- **PostgreSQL** - Data storage
- **Claude AI** - Conversational workflows (future)

### Architecture Principles

1. **Database-Driven:** Workflows stored in database, not code
2. **Template-Based:** Reusable slides with context injection
3. **Component Registry:** Artifact components registered centrally
4. **Audit Trail:** Every action logged for compliance
5. **Multi-Tenant:** Stock workflows + customer overrides

---

## Next Steps

### Pending Work

1. **Step-Level Actions UI Integration** (5% remaining)
   - Connect modals to TaskModeFullscreen
   - Show snooze badges in progress bar
   - Test end-to-end flow

2. **Contract Provider Migration**
   - Update `contractProvider.ts` to use `contract_terms`
   - Remove legacy fields from `contracts` table
   - Deploy migration to production

3. **Workflow Builder UI** (Phase 4)
   - Visual workflow composer
   - Drag-and-drop slide sequencing
   - Context editor for slide customization

---

**Questions?** Check these docs:
- Step-level actions: `docs/STEP-LEVEL-ACTIONS-INTEGRATION.md`
- Contract terms: `docs/CONTRACT-TERMS-GUIDE.md`
- Architecture decisions: `docs/ARCHITECTURE-OVERRIDE-STRUCTURE-ANALYSIS.md`
- Simple explanation: `docs/archive/EXPLAIN_LIKE_IM_12.md`
