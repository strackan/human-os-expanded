# System Architecture Overview

**Last Updated:** 2025-10-28
**Target Audience:** Mid-level engineers
**Reading Time:** ~10 minutes

> **Quick Links:** [Full Architecture](../technical/ARCHITECTURE.md) | [Database Schema](../technical/DATABASE.md) | [Product Overview](../product/SYSTEM-OVERVIEW.md)

---

## What You're Looking At

Renubu is a customer success management (CSM) platform that helps account managers handle renewals, expansions, and customer relationships. Think of it as "one task per day" instead of "30 dashboards to check." The system guides CSMs through complex workflows (like renewing a $500K contract) with AI assistance and personalized content.

## The Tech Stack (What You Know)

**Frontend:**
- **Next.js 15** with React 19 - Server & client components
- **TypeScript** - Full type safety
- **TailwindCSS** - Utility-first styling
- **Framer Motion** - Animations

**Backend:**
- **Supabase** (PostgreSQL + Auth + Realtime) - BaaS (Backend-as-a-Service)
- **Next.js API Routes** - Serverless functions
- **Handlebars** - Template rendering for placeholders

**Key Libraries:**
- `@supabase/ssr` - Server-side rendering auth
- `react-markdown` - Render markdown in chat
- `canvas-confetti` - Celebration effects 🎉
- `recharts` - Data visualization

## The Three-Layer Architecture

The system follows a straightforward layered pattern:

```
┌──────────────────────────────────────┐
│    DATABASE (Source of Truth)        │  ← PostgreSQL/Supabase
│    • workflow_definitions             │     Where workflows live
│    • customers, contracts             │     Customer data
│    • workflow_executions             │     Runtime state
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│    COMPOSITION (Build Workflows)     │  ← TypeScript services
│    • Fetch workflow from DB           │     Runs server-side
│    • Assemble slides from library     │     Hydrates templates
│    • Inject customer context          │     Returns JSON config
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│    PRESENTATION (React UI)           │  ← React components
│    • TaskModeFullscreen               │     Fullscreen modal
│    • ChatRenderer (left panel)        │     AI chat interface
│    • ArtifactRenderer (right panel)   │     Data visualization
└──────────────────────────────────────┘
```

## How a Workflow Actually Runs

Let's trace through what happens when a CSM launches a renewal workflow:

### 1. **Loading the Dashboard** (Server-Side)

**File:** `src/app/obsidian-black-v3/page.tsx`

When the user hits `/obsidian-black-v3`, Next.js server component runs:

```typescript
export default async function ObsidianBlackDashboardV3() {
  // 1. Get Supabase client (server-side)
  const supabase = await createClient();

  // 2. Fetch & compose workflow from database
  const config = await composeFromDatabase(
    'obsidian-black-renewal',  // workflow ID
    null,                       // company_id (null = stock workflow)
    { customer: {...}, pricing: {...} },  // context data
    supabase
  );

  // 3. Pass to client component for hydration
  return <ObsidianBlackV3Client initialWorkflowConfig={config} />;
}
```

**What's happening:** The server fetches the workflow definition from the database, builds it into a complete configuration, and sends it to the browser. No workflow logic exists in frontend code.

### 2. **Composing the Workflow** (Service Layer)

**File:** `src/lib/workflows/db-composer.ts`

```typescript
export async function composeFromDatabase(workflowId, companyId, context, supabase) {
  // Step 1: Query database for workflow definition
  const { data: workflowDef } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('workflow_id', workflowId)
    .is('company_id', null)  // Get stock workflow
    .single();

  // Step 2: workflowDef contains:
  // {
  //   slide_sequence: ['intro', 'account-overview', 'pricing', ...],
  //   slide_contexts: { pricing: { variables: {...} } }
  // }

  // Step 3: Build slides using the SLIDE_LIBRARY
  const slides = composeWorkflow(workflowDef, SLIDE_LIBRARY, context);

  // Step 4: Replace {{placeholders}} with actual values
  return hydrateWorkflowConfig(slides, context);
}
```

**Key Concept - The Slide Library:** Instead of hardcoding workflows, we have reusable "slide builders" registered in `SLIDE_LIBRARY`. Think of them as React components, but for workflow steps:

```typescript
// src/lib/workflows/slides/index.ts
export const SLIDE_LIBRARY = {
  'intro-slide': introSlideBuilder,
  'account-overview': accountOverviewSlideBuilder,
  'pricing-strategy': pricingStrategySlideBuilder,
  // ... 20+ more
};
```

A workflow is just an array of slide IDs: `['intro', 'account-overview', 'pricing']`

### 3. **Template Hydration** (String Replacement)

**File:** `src/lib/workflows/hydration/TemplateHydrator.ts`

Workflows use Handlebars-style placeholders that get replaced at runtime:

```
Before: "Good {{timeOfDay}}, {{userName}}. {{customerName}}'s renewal is {{daysToRenewal}} days away."

After:  "Good morning, Justin. Obsidian Black's renewal is 365 days away."
```

This enables one workflow template to serve thousands of customers with personalized content.

### 4. **Launching TaskMode** (Client-Side)

**File:** `src/app/obsidian-black-v3/ObsidianBlackV3Client.tsx`

When user clicks "Let's Begin!":

```typescript
const handleLaunchWorkflow = async () => {
  // 1. Create execution record in database
  const { executionId } = await createWorkflowExecution({
    workflowConfigId: 'obsidian-black-renewal',
    customerId: '550e8400-...',
    userId: testUserId,
    totalSteps: 6
  });

  // 2. Open fullscreen modal
  setTaskModeOpen(true);
  setExecutionId(executionId);
};
```

**Database Insert:**
```sql
INSERT INTO workflow_executions (
  workflow_config_id, customer_id, user_id,
  status, current_step, total_steps
) VALUES (
  'obsidian-black-renewal', 'customer-uuid', 'user-uuid',
  'in_progress', 0, 6
);
```

### 5. **Rendering the Workflow** (React Components)

**File:** `src/components/workflows/TaskMode/TaskModeFullscreen.tsx`

The main orchestrator component:

```typescript
export default function TaskModeFullscreen(props) {
  // State management hook (handles navigation, chat, etc.)
  const state = useTaskModeState({
    workflowId: 'obsidian-black-renewal',
    customerId: props.customerId,
    onClose: props.onClose
  });

  return (
    <div className="fixed inset-0 z-50">
      <WorkflowStepProgress
        slides={state.slides}
        currentIndex={state.currentSlideIndex}
      />

      <div className="flex h-full">
        {/* Left panel: Chat messages */}
        <ChatRenderer messages={state.chatMessages} />

        {/* Right panel: Data & visualizations */}
        <ArtifactRenderer artifacts={state.currentSlide.artifacts} />
      </div>
    </div>
  );
}
```

**Layout:**
```
┌─────────────────────────────────────────────┐
│  [1]─[2]─[3]─[4]─[5]─[6]  Progress Bar     │
├─────────────────┬───────────────────────────┤
│                 │                           │
│  Chat Panel     │   Artifact Panel          │
│  (messages,     │   (contract data,         │
│   AI guidance,  │    charts, forms,         │
│   buttons)      │    visualizations)        │
│                 │                           │
└─────────────────┴───────────────────────────┘
```

## Key Patterns to Understand

### Pattern 1: Server vs Client Components

**Server Components** (run on server, good for data fetching):
- `src/app/obsidian-black-v3/page.tsx`
- Fetch from database
- Compose workflows
- Send HTML to browser

**Client Components** (run in browser, good for interactivity):
- `src/app/obsidian-black-v3/ObsidianBlackV3Client.tsx`
- Handle user clicks
- Manage state
- Render dynamic UI

### Pattern 2: Database-Driven Configuration

Instead of hardcoding workflows in TypeScript:

```typescript
// ❌ OLD WAY (Phase 1): 910-line config file
export const workflowConfig = {
  slides: [
    { id: 'intro', chat: {...}, artifacts: {...} },  // 150 lines
    { id: 'account', chat: {...}, artifacts: {...} }, // 150 lines
    // ...
  ]
};
```

We store them in the database:

```sql
-- ✅ NEW WAY (Phase 3): Simple database row
INSERT INTO workflow_definitions (workflow_id, slide_sequence, slide_contexts)
VALUES (
  'new-workflow',
  ARRAY['intro', 'pricing', 'summary'],  -- Just list slide IDs
  '{"pricing": {"variables": {...}}}'    -- Per-slide config
);
```

**Why?** Create new workflows in 5 minutes without deploying code. Support customer-specific customizations (multi-tenant).

### Pattern 3: Component Registry

Artifact components (charts, forms, etc.) are registered centrally:

```typescript
// src/lib/workflows/components/ComponentRegistry.ts
export const COMPONENT_REGISTRY = {
  'ContractSummary': ContractSummaryComponent,
  'ContactList': ContactListComponent,
  'PricingAnalysis': PricingAnalysisComponent,
  // ...
};

// In a slide definition:
artifacts: {
  components: [
    { type: 'ContractSummary', props: { contractId: '...' } }
  ]
}

// Renderer looks up and renders dynamically
const Component = COMPONENT_REGISTRY[artifact.type];
return <Component {...artifact.props} />;
```

## Important Files & Their Roles

**Entry Points:**
- `src/app/obsidian-black-v3/page.tsx` - Server component, workflow loader
- `src/app/obsidian-black-v3/ObsidianBlackV3Client.tsx` - Client component, dashboard UI

**Services (Backend Logic):**
- `src/lib/workflows/db-composer.ts` - Fetches workflows from DB
- `src/lib/workflows/composer.ts` - Assembles slides from library
- `src/lib/workflows/actions/index.ts` - Workflow execution APIs
- `src/lib/workflows/actions/WorkflowStepActionService.ts` - Step-level actions (snooze/skip)

**Registries (Configuration):**
- `src/lib/workflows/slides/index.ts` - SLIDE_LIBRARY registry
- `src/lib/workflows/components/ComponentRegistry.ts` - Artifact components
- `src/lib/workflows/templates/TemplateRegistry.ts` - Template patterns

**UI Components:**
- `src/components/workflows/TaskMode/TaskModeFullscreen.tsx` - Main orchestrator
- `src/components/workflows/TaskMode/hooks/useTaskModeState.ts` - State management
- `src/components/workflows/sections/ChatRenderer.tsx` - Left panel
- `src/components/workflows/sections/ArtifactRenderer.tsx` - Right panel

**API Routes (Serverless Functions):**
- `src/app/api/workflows/executions/route.ts` - Create execution
- `src/app/api/workflows/executions/[id]/route.ts` - Get execution status
- `src/app/api/orchestrator/executions/[id]/snooze/route.ts` - Snooze step

## Database Tables (What You Need to Know)

**Workflow Tables:**
```sql
workflow_definitions     -- Templates (reusable workflows)
  ├─ workflow_id         -- 'obsidian-black-renewal'
  ├─ slide_sequence[]    -- ['intro', 'account', 'pricing', ...]
  └─ slide_contexts      -- Per-slide config (JSON)

workflow_executions      -- Runs (individual executions)
  ├─ workflow_config_id  -- References workflow_definitions
  ├─ customer_id         -- Who this is for
  ├─ status              -- 'in_progress', 'completed', 'snoozed'
  └─ current_step        -- Where user is now

workflow_step_states     -- Step status (snoozed/skipped)
  ├─ execution_id        -- References workflow_executions
  ├─ step_index          -- Step number (0-based)
  ├─ status              -- 'snoozed', 'skipped', 'completed'
  └─ snoozed_until       -- When to resume

workflow_step_actions    -- Audit log (who did what when)
  ├─ execution_id
  ├─ action_type         -- 'snooze', 'skip', 'resume'
  ├─ reason              -- Why they did it
  └─ performed_by        -- User ID
```

**Customer Tables:**
```sql
customers       -- Company info (Obsidian Black, BlueSoft, etc.)
contracts       -- Contract lifecycle (dates, ARR, status)
contract_terms  -- Business terms (pricing, SLA, renewals)
renewals        -- Renewal opportunities
```

See [Database Schema](../technical/DATABASE.md) for full reference.

## Advanced Concept: Step-Level Actions

Users can snooze/skip individual steps within a workflow (new feature, Oct 2025):

**Example:** In a 6-step renewal workflow, you can snooze Step 3 (pricing) until finance approves, but continue with Steps 4-6.

**How it works:**

1. User clicks step number → menu appears
2. Clicks "Snooze" → modal opens
3. Selects date → API call to `/api/orchestrator/executions/[id]/snooze`
4. Server inserts into `workflow_step_states` table
5. Database trigger updates parent `workflow_executions` record
6. UI shows orange badge on snoozed step

**Code:** `src/lib/workflows/actions/WorkflowStepActionService.ts`

## Common Confusion Points

### "Why is there both db-composer.ts and composer.ts?"

- **db-composer.ts**: Fetches workflow from database (database → JSON)
- **composer.ts**: Assembles slides from library (JSON → final config)

They're separate because you might want to compose workflows from sources other than the database in the future.

### "What's the difference between workflow_definitions and workflow_executions?"

- **workflow_definitions**: The recipe (reusable template)
- **workflow_executions**: The cake you baked (individual run)

One definition can have 1,000+ executions.

### "Why Next.js 15 + React 19?"

We need:
- Server components for secure database access
- API routes for serverless functions
- Client components for rich interactivity
- TypeScript for type safety

Next.js gives us all of this in one framework.

## What to Read Next

**If you're working on:**
- **Workflows** → [Workflow Guide](WORKFLOWS.md), [Full Architecture](../technical/ARCHITECTURE.md)
- **Database** → [Database Schema](../technical/DATABASE.md), [Contract Terms Guide](CONTRACT-TERMS.md)
- **Step Actions** → [Step Actions Guide](STEP-ACTIONS.md)
- **Product Understanding** → [System Overview](../product/SYSTEM-OVERVIEW.md)

## Quick Wins (Good First Tasks)

1. **Add a new slide to the library** - Create a slide builder in `src/lib/workflows/slides/`
2. **Create a new artifact component** - Add to `src/lib/workflows/components/`
3. **Build a simple workflow** - Insert row into `workflow_definitions` table
4. **Add a new API endpoint** - Create route in `src/app/api/`

---

**Questions?** Check the [Documentation Hub](../README.md) or ping the team on Slack.
