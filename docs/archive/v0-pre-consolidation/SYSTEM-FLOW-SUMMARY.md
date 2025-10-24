# Renubu System Flow - Executive Summary

**Last Updated:** October 23, 2025
**Version:** Phase 3 - Database-Driven Architecture
**Reading Time:** 10 minutes

---

## What is Renubu?

Renubu is a customer success management platform that helps CSMs manage renewals, expansions, and customer relationships using AI-powered workflows. Instead of juggling 30 dashboards, CSMs see **one critical task** each day with a guided workflow to complete it.

---

## System Architecture (3 Layers)

```
DATABASE LAYER (Supabase/PostgreSQL)
    ↓ Stores workflow definitions, executions, customer data

COMPOSITION LAYER (Runtime Assembly)
    ↓ Fetches from DB, builds slides, hydrates templates

PRESENTATION LAYER (React Components)
    ↓ Renders UI, handles navigation, manages state
```

---

## The Complete Flow (Simplified)

### When You Load `/obsidian-black-v3`:

1. **Server queries database** for workflow definition
2. **Composer builds slides** from slide library
3. **Hydrator replaces placeholders** with customer data (`{{customerName}}` → `Obsidian Black`)
4. **Dashboard renders** showing "Today's One Thing"

### When You Click "Launch Task":

5. **Creates workflow_executions record** (tracks progress)
6. **Opens TaskMode fullscreen** with first slide
7. **User navigates** through 6 slides (intro → account → pricing → quote → email → done)
8. **Can snooze/skip individual steps** (new feature!)
9. **Completes workflow** → Database updated, confetti triggers

---

## Key Innovation: Database-Driven Workflows

### Old Way (Phase 1 - Deprecated)
```typescript
// 910-line TypeScript file with hardcoded everything
export const workflowConfig = {
  slides: [
    { text: "Good morning, Justin...", buttons: [...] },
    // ... 900+ more lines
  ]
};
```
**Problem:** New workflow = new code file = deploy required

### New Way (Phase 3 - Current)
```json
// Database stores simple definition
{
  "workflow_id": "obsidian-black-renewal",
  "slide_sequence": ["intro", "account-overview", "pricing", ...],
  "slide_contexts": { /* customization per slide */ }
}
```
**Benefit:** New workflow = database insert = no deploy

---

## Core Database Tables

### workflow_definitions
**What:** Reusable workflow templates
**Key Fields:** `slide_sequence` (array of slide IDs), `slide_contexts` (customization)
**Example:** `obsidian-black-renewal` workflow with 6 slides

### workflow_executions
**What:** Individual workflow runs
**Key Fields:** `status`, `current_step`, `has_snoozed_steps`
**Tracks:** Who's running what workflow, for which customer, current progress

### workflow_step_states (NEW!)
**What:** State of individual steps within a workflow
**Key Fields:** `status` (snoozed/skipped/completed), `snoozed_until`
**Enables:** Step-level snooze/skip instead of entire workflow

### workflow_step_actions (NEW!)
**What:** Audit log of all step actions
**Tracks:** When user snoozed/skipped steps, with reason and timestamp

### contract_terms (NEW!)
**What:** Business and legal terms for contracts
**Key Fields:** `pricing_model`, `auto_renewal_notice_days`, `support_tier`
**Benefit:** Separates terms (rarely change) from lifecycle events

---

## What Happens Step-by-Step

### Dashboard Load

```
User visits /obsidian-black-v3
    ↓
Next.js server component runs
    ↓
composeFromDatabase('obsidian-black-renewal', customerData)
    ↓
fetchWorkflowDefinition() → Queries workflow_definitions table
    ↓
composer.ts loops through slide_sequence
    ↓
SLIDE_LIBRARY['intro-slide'](context) → Returns slide definition
    ↓
TemplateHydrator replaces {{placeholders}}
    ↓
Complete WorkflowConfig sent to browser
    ↓
Dashboard renders: "Renewal Planning for Obsidian Black"
```

**Time:** ~200ms (database query + composition)

---

### Task Launch

```
User clicks "Let's Begin!"
    ↓
createWorkflowExecution() → INSERT into workflow_executions
    ↓
Returns execution_id (UUID)
    ↓
registerWorkflowConfig() → Makes config available to TaskMode
    ↓
TaskModeFullscreen opens (fullscreen modal)
    ↓
useTaskModeState() initializes state
    ↓
First slide renders (index 0)
```

**Database:** One INSERT, one SELECT for step states

---

### Slide Navigation

```
User on slide 0 (Intro)
    ↓
Clicks button "Let's Begin!"
    ↓
handleButtonClick() → Checks button.action === 'nextSlide'
    ↓
goToNextSlide() → currentSlideIndex: 0 → 1
    ↓
New slide data loaded from config.slides[1]
    ↓
ChatRenderer updates with new message
    ↓
ArtifactRenderer loads new components
    ↓
Progress bar updates: [✓][✓][ ][ ][ ][ ]
```

**State:** Entirely client-side, no database calls during navigation

---

### Step-Level Snooze (New Feature)

```
User clicks step number in progress bar
    ↓
Step action menu appears: [Snooze] [Skip]
    ↓
User clicks "Snooze"
    ↓
StepSnoozeModal opens with date picker
    ↓
User selects date + reason → Clicks "Snooze Step"
    ↓
WorkflowStepActionService.snoozeStep()
    ↓
UPSERT workflow_step_states (status='snoozed')
    ↓
INSERT workflow_step_actions (audit log)
    ↓
Database trigger updates workflow_executions.has_snoozed_steps
    ↓
UI reloads step states
    ↓
Progress bar shows orange clock icon on snoozed step
```

**Database:** 2 writes (state + audit), trigger auto-updates parent record

---

## The 6 Slides in Obsidian-Black-v3

1. **Intro Slide**
   - Chat: "Good morning, Justin. You've got one critical task..."
   - Artifact: Strategic plan with timeline and goals
   - Action: "Let's Begin!" → Next slide

2. **Account Overview**
   - Chat: "Review Obsidian Black's current status..."
   - Artifact: Contract details, contacts, metrics (tabs)
   - Action: Checkboxes to confirm review → Next slide

3. **Pricing Strategy**
   - Chat: "We recommend an 8% increase..."
   - Artifact: Pricing analysis with comparison charts
   - Action: Accept/modify recommendation → Next slide

4. **Prepare Quote**
   - Chat: "Here's your quote draft..."
   - Artifact: Interactive quote builder
   - Action: Approve quote → Next slide

5. **Email Draft**
   - Chat: "Here's a personalized email..."
   - Artifact: Email composer with template
   - Action: Send/edit email → Next slide

6. **Summary**
   - Chat: "Great work! Here's your summary..."
   - Artifact: Completion report with next steps
   - Action: "Mark Complete" → Confetti + close

---

## Key Components

### Server Side
- **`page.tsx`** - Next.js server component, fetches workflow
- **`db-composer.ts`** - Orchestrates database fetch + composition
- **`composer.ts`** - Builds slides from SLIDE_LIBRARY
- **`TemplateHydrator.ts`** - Replaces {{placeholders}}

### Client Side
- **`ObsidianBlackV3Client.tsx`** - Dashboard component
- **`TaskModeFullscreen.tsx`** - Main workflow orchestrator
- **`useTaskModeState.ts`** - State management hook
- **`ChatRenderer.tsx`** - Left panel with messages/buttons
- **`ArtifactRenderer.tsx`** - Right panel with components
- **`WorkflowStepProgress.tsx`** - Progress bar with step actions

### Services
- **`WorkflowStepActionService.ts`** - Snooze/skip/resume steps
- **`createWorkflowExecution()`** - Initialize workflow run

---

## Recent Changes (Last 2 Weeks)

### 1. Step-Level Actions (Oct 22-23)
**Status:** 90% complete (UI integration pending)

**What Changed:**
- Added `workflow_step_states` and `workflow_step_actions` tables
- Built snooze/skip modals
- Created `WorkflowStepActionService`

**Why:** Users can now snooze individual steps instead of entire workflow

**Example:** User can snooze "Pricing Analysis" until finance approves, while continuing other steps

---

### 2. Contract Terms Separation (Oct 23)
**Status:** Complete

**What Changed:**
- Created `contract_terms` table
- Added `term_months` auto-calculation
- Built `contract_matrix` view

**Why:** Business terms (pricing model, SLA) change rarely; lifecycle events change often. Separating them reduces duplication.

**Example:** Contract renewed 3 times? Same terms record, 3 renewal records.

---

### 3. Database-Driven Workflows (Phase 3)
**Status:** Complete

**What Changed:**
- Workflows stored in `workflow_definitions` table
- Runtime composition via slide library
- Template hydration for dynamic content

**Why:** No code deploys for new workflows, multi-tenant support, A/B testing

**Example:** Create new workflow by inserting database row, not writing 910-line TypeScript file

---

## Architecture Evolution

### Phase 1: Hardcoded (Deprecated)
- **910-line config files** per workflow
- **40+ workflow files** in codebase
- **Code deploy** required for changes
- **No multi-tenant** support

### Phase 2: Slide Library (Transition)
- **Reusable slide builders** in `SLIDE_LIBRARY`
- **Composition patterns** for workflows
- **Still code-based** definitions
- **Better reusability** but not database-driven

### Phase 3: Database-Driven (Current)
- **Database stores** workflow definitions
- **Runtime composition** from slide library
- **Template hydration** for personalization
- **Multi-tenant ready** (stock + custom workflows)
- **50-line configs** instead of 910-line files

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Navigates to /obsidian-black-v3                │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Server: Fetch workflow from workflow_definitions    │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Composer: Build slides from SLIDE_LIBRARY           │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Hydrator: Replace {{customer.name}} → Real data     │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Client: Render dashboard with workflow card         │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. User: Clicks "Launch Task"                          │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Database: INSERT workflow_executions record         │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 8. TaskMode: Opens with slide 0                        │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 9. User: Navigates through slides (client-side)        │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 10. User: Snoozes step 3 (database write)              │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 11. User: Completes workflow (UPDATE status)           │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 12. Confetti + Dashboard updates                       │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

**Frontend:**
- Next.js 15 (React 19)
- TypeScript
- TailwindCSS
- Framer Motion (animations)

**Backend:**
- Next.js API routes
- Supabase (database + auth)
- PostgreSQL

**AI (Future):**
- Claude 3.5 Sonnet
- Streaming responses
- AI-generated content

---

## Performance

- **Dashboard load:** ~200ms (includes database query + composition)
- **Slide navigation:** Instant (client-side state changes)
- **Step actions:** ~100ms (database write)
- **Template hydration:** <10ms (string replacement)

---

## Next Steps

### Immediate (This Week)
1. **Complete step-level actions UI integration** (5% remaining)
   - Connect modals to TaskModeFullscreen
   - Test end-to-end snooze/skip flow

### Short Term (Next Sprint)
2. **Migrate contract provider** to use `contract_terms` table
3. **Add dashboard for snoozed steps** (show what's due today)

### Long Term (Phase 4)
4. **Visual workflow builder UI** (drag-and-drop slide sequencing)
5. **AI-powered workflow recommendations**
6. **Multi-workflow sequences** (chain multiple workflows)

---

## Quick Reference

### Where to Find Things

**Documentation:**
- Full detailed flow: `docs/COMPLETE-SYSTEM-FLOW.md`
- This summary: `docs/SYSTEM-FLOW-SUMMARY.md`
- Step actions guide: `docs/STEP-LEVEL-ACTIONS-INTEGRATION.md`
- Contract terms guide: `docs/CONTRACT-TERMS-GUIDE.md`
- Simple explanation: `docs/archive/EXPLAIN_LIKE_IM_12.md`

**Code Locations:**
- Dashboard: `src/app/obsidian-black-v3/`
- TaskMode: `src/components/workflows/TaskMode/`
- Composition: `src/lib/workflows/composer.ts`
- Database: `src/lib/workflows/db-composer.ts`
- Slide library: `src/lib/workflows/slides/`
- Services: `src/lib/workflows/actions/`

**Database:**
- Migrations: `supabase/migrations/`
- Key tables: `workflow_definitions`, `workflow_executions`, `workflow_step_states`

---

## Common Questions

**Q: Where do workflows come from?**
A: Database table `workflow_definitions`. Composed at runtime using slide library.

**Q: What happens when I click "Launch Task"?**
A: Creates `workflow_executions` record, opens TaskMode fullscreen, loads first slide.

**Q: Can users customize workflows?**
A: Yes, via `company_id` field. Stock workflows (company_id=null) + company overrides.

**Q: How do step-level actions work?**
A: User clicks step number → Menu appears → Select snooze/skip → Database records state → UI updates.

**Q: What's the difference between old and new architecture?**
A: Old = 910-line TypeScript files. New = 50-line database rows + runtime composition.

**Q: Where are templates stored?**
A: Template patterns in `TemplateRegistry.ts`, actual text in slide definitions.

---

**For More Details:** See `docs/COMPLETE-SYSTEM-FLOW.md` (comprehensive 73K-word guide)
