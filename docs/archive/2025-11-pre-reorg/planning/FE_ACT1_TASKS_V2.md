# Front-End Engineer: Act 1 Task Breakdown (v2 - WorkflowExecutor Architecture)

> **Document Version**: 2.0 (Updated 2025-10-11)
> **Previous Version**: FE_ACT1_TASKS.md (v1) - See "What Changed" section below
> **Review Status**: 🟡 Pending Justin's approval before starting

---

## 🎉 Great News: Your Past Self Already Built Most of This!

### What Happened Since v1 Was Written

**Oct 9-10, 2025**: You (with PM support) built a **complete modern workflow execution system** over 2 intensive days. Here's what you accomplished:

**What You Built** (4,600+ lines of code):
- ✅ **WorkflowExecutor.tsx** (754 lines) - Full workflow orchestration with step navigation, progress tracking, auto-save, and state management
- ✅ **CustomerMetrics.tsx** (283 lines) - Slide-down metrics panel (NOT old quadrant system)
- ✅ **ArtifactRenderer.tsx** (558 lines) - Renders 9 artifact types (status_grid, countdown, action_tracker, timeline, table, checklist, alert, markdown, dashboard)
- ✅ **ArtifactDisplay.tsx** (369 lines) - Resizable right-side artifact panel with fullscreen mode
- ✅ **ResizableModal.tsx** - Draggable, resizable modal with minimize/maximize
- ✅ **StepRenderer.tsx** - Renders workflow steps
- ✅ **WorkflowChatPanel.tsx** - Chat interface for workflows
- ✅ **TaskPanel.tsx** - Task management panel
- ✅ **WorkflowContext.tsx** - Context provider for workflow state

**What PM Did Today** (Oct 11, 2025):
- ✅ Updated **CSMDashboard.tsx** to use WorkflowExecutor (modern UX) instead of TaskModeStandalone (deprecated)
- ✅ Verified the architecture works end-to-end
- ✅ Validated database schema (Phase 1 complete)

### What This Means for Your Work

**Original Estimate**: 15-21 hours
**NEW Estimate**: 8-12 hours (40% reduction!)

**You DON'T need to build**:
- ❌ Workflow modal container (already exists)
- ❌ Individual artifact components (ArtifactRenderer handles all types)
- ❌ Chat interface (WorkflowChatPanel exists)
- ❌ Customer metrics display (CustomerMetrics exists)
- ❌ State management (WorkflowExecutor handles it)
- ❌ Step navigation (breadcrumbs, progress bar - all done)

**You DO need to build**:
- ✅ 4 WorkflowDefinition configs (data structures, not components)
- ✅ Dashboard polish (customer profile card, demo reset)
- ✅ Workflow chaining logic (W1 → W2 → W3 → W4)
- ✅ Villain theming touches

### Architecture You'll Be Using

**Modern Stack** (what you built Oct 9-10):
```
Dashboard (CSMDashboard.tsx)
  └─> ResizableModal
       └─> WorkflowExecutor
            ├─> CustomerMetrics (slide-down panel)
            ├─> StepRenderer (current step content)
            ├─> ArtifactRenderer (inline artifacts)
            ├─> ArtifactDisplay (right-side panel)
            ├─> WorkflowChatPanel (slide-in chat)
            └─> TaskPanel (slide-in tasks)
```

**Your Job**: Create WorkflowDefinition files (data configs) that feed into this system.

---

## 📋 Quick Reference

**Your Onboarding Doc**: `FE_START_HERE.md`
**Scope Doc**: `ACT1_SCOPE_OF_WORK.md`
**Villain Universe Reference**: See "Creative Director's storyboard" in project context
**Architecture Examples**:
- `src/components/workflows/WorkflowExecutor.tsx` (how it orchestrates)
- `src/components/workflows/definitions/testWorkflow.ts` (example WorkflowDefinition)
- `src/app/test-modal-workflow/page.tsx` (example integration)

**Key Context**:
- Customer: Obsidian Black (Obsidian Black)
- Contacts: Marcus Castellan (COO), Dr. Elena Voss (VP Tech Ops)
- Product: ThreatOS™
- Theme: Professional villain universe (dark mode, tactical aesthetic)
- Responsive: Tablet-optimized (768px min-width)

---

## Phase 1: Dashboard Verification & Polish (1-2 hours)

### Task 1.1: Verify Dashboard Integration ✅ (ALREADY DONE BY PM)
**File**: `src/components/artifacts/dashboards/CSMDashboard.tsx`

**Status**: ✅ **Complete** - PM updated dashboard today to use WorkflowExecutor

**What Was Done**:
- Replaced old `TaskModeStandalone` with modern `WorkflowExecutor`
- Wrapped in `ResizableModal` for draggable/resizable UX
- Created temp converter function `convertWorkflowConfigToDefinition`
- Integrated with existing task queue

**What to Verify**:
- [ ] Dashboard renders without errors
- [ ] Task queue shows Obsidian Black task (Priority: HIGH, Due: Today)
- [ ] Clicking task opens ResizableModal with WorkflowExecutor
- [ ] Modal displays "Strategic Account Planning - Obsidian Black"
- [ ] Modal is draggable, resizable, minimizable

**Estimated Time**: 15 minutes (verification only)

---

### Task 1.2: Add Customer Profile Card to Dashboard
**File**: `src/components/artifacts/dashboards/CSMDashboard.tsx` or new component

**Requirements**:
- Right-side panel of dashboard (next to or below task queue)
- Obsidian Black profile display:
  - Name: Obsidian Black
  - ARR: $185,000
  - Health Score: 6.4/10 (YELLOW indicator)
  - Opportunity Score: 8.7/10 (GREEN indicator)
  - Renewal Date: April 15, 2026 (143 days away)
  - Primary Contact: Marcus Castellan (COO)

**Data Source**: `GET /api/customers/aco` (coordinate with BE)

**Design Guidance**:
- Use existing dashboard component patterns
- Color-code health score (red < 5.0, yellow 5.0-6.9, green 7.0+)
- Color-code opportunity score (green 7.0+)
- Show countdown dynamically calculated

**Acceptance Criteria**:
- [ ] Card renders with all Obsidian Black data
- [ ] Health score shows yellow indicator (5.0-6.9)
- [ ] Opportunity score shows green indicator (> 7.0)
- [ ] Renewal countdown displays days remaining
- [ ] Contact name displayed
- [ ] Handles loading state
- [ ] Handles error state (if API fails)

**Estimated Time**: 1 hour

---

### Task 1.3: Add Demo Reset Button
**Files**:
- `src/components/UserAvatarDropdown.tsx` (add reset option)

**Requirements**:
- User avatar dropdown shows "Reset Demo" option (only for demo users)
- Check `profile.demo_godmode` flag from database to determine visibility
- Keyboard shortcut: Ctrl+Alt+R
- Confirmation modal: "Reset demo state? This will clear all workflow progress."
- On confirm: Call `POST /api/demo/reset`, reload page

**Implementation Guidance**:
```typescript
const handleDemoReset = async () => {
  if (!confirm('Reset demo state? This will clear all workflow progress.')) {
    return;
  }

  try {
    const response = await fetch('/api/demo/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true })
    });

    if (response.ok) {
      window.location.reload();
    } else {
      console.error('Demo reset failed');
    }
  } catch (error) {
    console.error('Demo reset error:', error);
  }
};
```

**Acceptance Criteria**:
- [ ] Reset option visible in dropdown for demo users only
- [ ] Ctrl+Alt+R triggers reset confirmation
- [ ] Confirmation modal prevents accidental reset
- [ ] Reset calls API and reloads page
- [ ] Non-demo users don't see reset option
- [ ] Error handling if reset fails

**Estimated Time**: 45 minutes

---

## Phase 2: Workflow 1 - Strategic Account Planning (3-4 hours)

### Background: What WorkflowDefinition Does

WorkflowDefinition is a **data structure** (not a component) that tells WorkflowExecutor what to render. Think of it as a config file.

**Example Structure** (from testWorkflow.ts):
```typescript
export const testWorkflowDefinition: WorkflowDefinition = {
  id: 'test-workflow',
  name: 'Test Workflow',
  description: 'A workflow to test the execution framework',
  steps: [
    {
      id: 'step-1',
      number: 1,
      title: 'Basic Information',
      description: 'Enter basic information to get started',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'status-grid-1',
          type: 'status_grid',
          title: 'Current Status',
          config: {
            columns: 4,
            items: [
              { label: 'Contract Signed', value: '✅', status: 'complete' },
              { label: 'Payment Received', value: '✅', status: 'complete' },
              { label: 'Kickoff Scheduled', value: '⏳', status: 'pending' },
              { label: 'Success Plan', value: '❌', status: 'error' }
            ]
          }
        }
      ]
    }
  ]
};
```

**Artifact Types Available** (all rendered by ArtifactRenderer.tsx):
- `status_grid` - 2x2 or 4-column status cards
- `countdown` - Timer display with thresholds
- `action_tracker` - Task list with progress bar
- `timeline` - Chronological events
- `table` - Data table with sorting
- `checklist` - Checkable items
- `alert` - Alert/notification panel
- `markdown` - Rendered markdown content
- `dashboard` - Multi-section dashboard

---

### Task 2.1: Create Strategic Planning WorkflowDefinition
**File**: `src/components/workflows/definitions/strategicPlanningWorkflow.ts`

**Requirements**:
- Create WorkflowDefinition with 5 steps
- Each step has: id, number, title, description, component, artifacts array
- Use ACO-specific data in artifact configs
- Villain-themed artifact titles

**Step Structure**:

**Step 1: Contract Intelligence Review**
- Artifact: `status_grid` (4 columns)
- Title: "📋 Annual Coordination Services Agreement"
- Items:
  - ARR: $185,000 (status: neutral)
  - Renewal Date: Apr 15, 2026 (status: warning, sublabel: "143 days away")
  - Auto-Renew: ❌ DISABLED (status: error, sublabel: "Manual renewal required")
  - SLA Target: 99.5% uptime (status: error, sublabel: "Not met in Q4")

**Step 2: Performance History Analysis**
- Artifact: `timeline`
- Title: "🗂️ Operational Incident Log"
- Events:
  - Oct 2024: Operation Blackout (status: complete, description: "Platform latency caused 47-second delay. Cost impact: $150K")
  - Jul 2024: Operation Nightfall (status: complete, description: "Successfully coordinated global asset deployment")
  - Apr 2024: Support turnover began (status: complete, description: "4 liaisons in 8 months")
  - Sep-Dec 2024: Communication void (status: current, description: "87-day gap after predecessor departure")

**Step 3: Risk Score Calculation**
- Artifact: `status_grid` (5 columns or 2x3 grid)
- Title: "⚠️ Threat Analysis Report"
- Items:
  - Overall Health: 6.4/10 (status: warning, sublabel: "Moderate risk")
  - Product Performance: 3.1/10 (status: error)
  - Relationship Strength: 4.8/10 (status: warning)
  - Strategic Alignment: 5.2/10 (status: warning)
  - Support Quality: 3.5/10 (status: error)
  - Executive Sponsorship: 6.0/10 (status: warning)
- Second Artifact: `alert`
  - Type: error
  - Title: "Churn Risk Assessment"
  - Message: "CHURN PROBABILITY: 42% - Without intervention, renewal is unlikely. Obsidian Black experienced 3 critical service failures in past 12 months."

**Step 4: Strategic Response (Chat Branching)**
- Artifact: `markdown`
- Title: "🤔 Strategic Context"
- Content: Brief intro explaining Sarah needs to choose her approach
- Note: Chat branching handled by WorkflowChatPanel (you don't need to build this)
- For demo purposes, this can be a simple prompt step

**Step 5: Account Plan Generation**
- Artifact: `action_tracker`
- Title: "📋 Operational Continuity Blueprint"
- Config:
  ```typescript
  {
    showProgress: true,
    actions: [
      // Phase 1 (Days 1-7)
      {
        id: 'p1-marcus-email',
        title: 'Respond to Marcus email acknowledging Year One failures',
        owner: 'Sarah Chen',
        deadline: 'Day 1',
        status: 'pending',
        checkable: true
      },
      {
        id: 'p1-elena-outreach',
        title: 'Intro outreach to Elena Voss (expansion champion)',
        owner: 'Sarah Chen',
        deadline: 'Day 3',
        status: 'pending',
        checkable: true
      },
      {
        id: 'p1-marcus-call',
        title: 'Schedule Marcus call to discuss Year Two expectations',
        owner: 'Sarah Chen',
        deadline: 'Day 5',
        status: 'pending',
        checkable: true
      },
      // Phase 2 (Days 8-30)
      {
        id: 'p2-elena-discovery',
        title: 'Elena discovery call - understand Global Synchronization Initiative',
        owner: 'Sarah Chen',
        deadline: 'Week 2',
        status: 'pending',
        checkable: true
      },
      {
        id: 'p2-accountability',
        title: 'Deliver Accountability Report to Marcus (Operation Blackout post-mortem)',
        owner: 'Sarah Chen',
        deadline: 'Week 3',
        status: 'pending',
        checkable: true
      },
      {
        id: 'p2-liaison',
        title: 'Propose dedicated technical liaison (end support turnover)',
        owner: 'Sarah Chen',
        deadline: 'Week 4',
        status: 'pending',
        checkable: true
      },
      {
        id: 'p2-qbr',
        title: 'Schedule Q1 QBR with Marcus and executive team',
        owner: 'Sarah Chen',
        deadline: 'Week 4',
        status: 'pending',
        checkable: true
      },
      // Phase 3 (Days 31-90)
      {
        id: 'p3-timezone-demo',
        title: 'Demo timezone automation prototype to Elena',
        owner: 'Product Team',
        deadline: 'Month 2',
        status: 'pending',
        checkable: true
      },
      {
        id: 'p3-expansion',
        title: 'Expansion proposal presentation ($410K opportunity)',
        owner: 'Sarah Chen',
        deadline: 'Month 2',
        status: 'pending',
        checkable: true
      },
      {
        id: 'p3-qbr-exec',
        title: 'Q1 QBR execution - show progress on trust rebuilding',
        owner: 'Sarah Chen',
        deadline: 'Month 3',
        status: 'pending',
        checkable: true
      },
      {
        id: 'p3-renewal-kickoff',
        title: 'Renewal negotiation kickoff with Marcus',
        owner: 'Sarah Chen',
        deadline: 'Month 3',
        status: 'pending',
        checkable: true
      }
    ]
  }
  ```
- Second Artifact: `alert`
  - Type: success
  - Title: "Success Probability"
  - Message: "78% renewal probability if this plan is executed. Expansion to $595K possible if Elena initiative secured."

**Full Code Template**:
```typescript
import { WorkflowDefinition } from '../WorkflowExecutor';

export const strategicPlanningWorkflow: WorkflowDefinition = {
  id: 'aco-strategic-planning',
  name: 'Strategic Account Planning - Obsidian Black',
  description: 'Create a 90-day strategic plan to save Obsidian Black renewal and unlock $410K expansion',
  steps: [
    {
      id: 'contract-review',
      number: 1,
      title: 'Contract Intelligence Review',
      description: 'Review Obsidian Black contract terms and renewal status',
      component: 'GenericFormStep',
      artifacts: [
        {
          id: 'contract-summary',
          type: 'status_grid',
          title: '📋 Annual Coordination Services Agreement',
          config: {
            columns: 4,
            items: [
              { label: 'ARR', value: '$185,000', status: 'neutral', sublabel: 'Current contract' },
              { label: 'Renewal Date', value: 'Apr 15, 2026', status: 'warning', sublabel: '143 days away' },
              { label: 'Auto-Renew', value: '❌ DISABLED', status: 'error', sublabel: 'Manual renewal required' },
              { label: 'SLA Target', value: '99.5% uptime', status: 'error', sublabel: 'Not met in Q4 2024' }
            ]
          }
        }
      ]
    },
    // ... Add Steps 2-5 following the structure above
  ]
};
```

**Acceptance Criteria**:
- [ ] WorkflowDefinition exports correctly
- [ ] All 5 steps defined with proper structure
- [ ] Artifacts use correct types (status_grid, timeline, action_tracker, alert)
- [ ] Artifact configs use ACO-specific data (names, dates, values)
- [ ] Villain-themed titles (e.g., "Annual Coordination Services Agreement" not "Contract Summary")
- [ ] Can be imported by CSMDashboard.tsx
- [ ] No TypeScript errors

**Estimated Time**: 2-2.5 hours

**Reference Files**:
- `src/components/workflows/definitions/testWorkflow.ts` - Example structure
- `src/components/workflows/artifacts/ArtifactRenderer.tsx` - See artifact type definitions

---

### Task 2.2: Wire Up Strategic Planning to Dashboard
**File**: `src/components/artifacts/dashboards/CSMDashboard.tsx`

**Current State**: Dashboard has a temp converter function that returns a basic 1-step workflow:
```typescript
function convertWorkflowConfigToDefinition(config: WorkflowConfig, configId: string): WorkflowDefinition {
  const customerName = config.customer?.name || 'Customer';
  return {
    id: configId,
    name: `Strategic Account Planning - ${customerName}`,
    description: `Complete strategic planning for ${customerName}`,
    steps: [
      {
        id: 'step-1',
        number: 1,
        title: 'Account Overview',
        description: 'Review customer information and current status',
        component: 'GenericFormStep'
      }
    ]
  };
}
```

**What to Do**: Replace temp converter with real workflow import

**Changes**:
```typescript
// Add import at top of file:
import { strategicPlanningWorkflow } from '@/components/workflows/definitions/strategicPlanningWorkflow';

// In the modal render section (around line 701), replace:
workflowDefinition={convertWorkflowConfigToDefinition(currentConfig, currentConfigId || 'unknown')}

// With:
workflowDefinition={strategicPlanningWorkflow}
```

**Also Update**:
- CustomerId: Change from hardcoded to dynamic if possible, or keep `"aco-001"` for demo

**Acceptance Criteria**:
- [ ] Dashboard imports strategicPlanningWorkflow
- [ ] Modal passes real workflow to WorkflowExecutor
- [ ] Clicking Obsidian Black task launches 5-step workflow (not 1-step temp)
- [ ] All artifacts render correctly
- [ ] Progress bar shows "Step X of 5"
- [ ] Breadcrumbs show all 5 step titles
- [ ] No console errors

**Estimated Time**: 30 minutes

---

### Task 2.3: Test Strategic Planning Full Flow
**Test Steps**:
1. Run `npm run dev`
2. Navigate to dashboard
3. Click "Complete Strategic Account Plan - Obsidian Black" task
4. Modal opens with WorkflowExecutor

**Step-by-Step Verification**:

**Step 1: Contract Review**
- [ ] status_grid artifact shows 4 items (ARR, Renewal Date, Auto-Renew, SLA)
- [ ] ARR displays "$185,000"
- [ ] Renewal Date shows "Apr 15, 2026" with "143 days away" sublabel
- [ ] Auto-Renew shows "❌ DISABLED" with yellow/warning styling
- [ ] SLA shows "99.5% uptime" with error styling
- [ ] Click "Continue" button advances to Step 2

**Step 2: Performance History**
- [ ] timeline artifact shows Operation Blackout + other operations
- [ ] Operation Blackout marked as failed/complete with $185K cost
- [ ] Timeline displays chronologically
- [ ] Villain-themed title "Operational Incident Log" displays
- [ ] Click "Continue"

**Step 3: Risk Analysis**
- [ ] status_grid shows health score breakdown (6 items)
- [ ] Overall Health shows 6.4/10 with yellow/warning styling
- [ ] Component scores display (Product: 3.1, Relationship: 4.8, etc.)
- [ ] alert artifact shows "CHURN PROBABILITY: 42%"
- [ ] Alert has error/urgent styling
- [ ] Click "Continue"

**Step 4: Strategic Response**
- [ ] Step renders (markdown or simple prompt)
- [ ] For demo, can be minimal (chat branching is future enhancement)
- [ ] Click "Continue"

**Step 5: Account Plan**
- [ ] action_tracker artifact shows all 11 tasks
- [ ] Tasks grouped logically (can see Phase 1, 2, 3 distinctions)
- [ ] Progress bar shows 0/11 completed
- [ ] Each task shows owner (Sarah Chen or Product Team)
- [ ] Deadlines show (Day 1, Week 2, Month 2, etc.)
- [ ] Checkboxes functional (clicking toggles task)
- [ ] alert artifact shows "78% renewal probability"
- [ ] Click "Complete Workflow"

**Post-Completion**:
- [ ] Modal closes OR shows "Continue to Risk Detection" prompt
- [ ] No console errors throughout flow
- [ ] Workflow state saved (if you reload page and reopen, it remembers progress)

**Additional Tests**:
- [ ] CustomerMetrics toggle button works (slide-down panel)
- [ ] ArtifactDisplay panel can be opened (right side)
- [ ] Modal can be dragged, resized, minimized, maximized
- [ ] Breadcrumbs allow jumping back to previous steps
- [ ] Progress bar updates per step (20%, 40%, 60%, 80%, 100%)

**Estimated Time**: 30 minutes

---

## Phase 3: Workflows 2-4 (4-5 hours)

### Task 3.1: Create Risk Detection WorkflowDefinition
**File**: `src/components/workflows/definitions/riskDetectionWorkflow.ts`

**Requirements**:
- 3-step workflow
- Focus: Support ticket spike detection
- Data: Obsidian Black has 5 recent tickets, 3.3x normal rate, 80% frustrated sentiment

**Step Structure**:

**Step 1: Risk Alert**
- Artifact: `alert`
- Type: 'warning'
- Title: "⚠️ Urgent: Support Ticket Spike Detected"
- Message: "Obsidian Black has submitted 5 support tickets in past 2 weeks (3.3x normal rate). 4 of 5 marked as frustrated. Immediate action required."

**Step 2: Context Analysis**
- Artifact: `markdown`
- Title: "🎫 Recent Support Tickets"
- Content: Table of tickets (use markdown table format)
  ```markdown
  | Ticket | Subject | Category | Sentiment | Status |
  |--------|---------|----------|-----------|--------|
  | ACO-4891 | Dashboard not displaying real-time status | UX | Neutral | Resolved (24h) |
  | ACO-4856 | Integration with Operative Management System failing | Integration | Frustrated | Open |
  | ACO-4823 | Performance degradation during peak hours | Performance | Frustrated | Open |
  | ACO-4801 | Timezone conversion bug in Jakarta facility | Bug | Frustrated | Resolved (48h) |
  | ACO-4728 | Operative Smith cannot access Phase 3 documents | Permissions | Frustrated | Resolved (72h) |
  ```
- Second Artifact: `alert`
  - Type: 'info'
  - Title: "AI Insight"
  - Message: "Themes: Permissions errors (40%), Performance issues (40%), Integration failures (20%). This spike correlates with Operation Blackout aftermath. Marcus is likely frustrated."

**Step 3: Action Recommendation**
- Artifact: `markdown`
- Title: "✉️ Recommended Response"
- Content: Email draft to Marcus
  ```markdown
  **To:** Marcus Castellan (marcus@obsidian-ops.net)
  **Subject:** Re: Recent Support Issues - Immediate Action Plan

  Marcus,

  I'm reaching out about the support tickets Obsidian Black submitted this week. I've reviewed all five issues and want you to know I'm personally overseeing their resolution.

  **What I've Done:**
  - Escalated the integration issue (ACO-4856) to our engineering team - resolution by EOD tomorrow
  - Root cause analysis on performance degradation (ACO-4823) - identified and fixing
  - Permissions audit scheduled for tomorrow morning

  **What I'm Proposing:**
  I'd like to schedule a 30-minute call this week to:
  1. Walk through what we're doing to prevent these issues
  2. Understand your biggest pain points right now
  3. Discuss dedicated technical liaison (end support turnover)

  Would Thursday at 2 PM PST work?

  Best regards,
  Sarah Chen
  Customer Success Manager, Squelch
  ```
- Second Artifact: `action_tracker`
  - Title: "Follow-Up Actions"
  - Actions:
    - Schedule call with Marcus (due: This week)
    - Engineering escalation for ACO-4856 (due: Tomorrow)
    - Permissions audit (due: Tomorrow)
    - Root cause report for ACO-4823 (due: Friday)

**Acceptance Criteria**:
- [ ] 3 steps defined
- [ ] Alert displays with warning/urgent styling
- [ ] Ticket table renders in markdown
- [ ] AI insight shows themes and correlation
- [ ] Email draft professional, acknowledges issues
- [ ] action_tracker shows follow-up tasks
- [ ] Workflow can be imported and launched

**Estimated Time**: 1.5-2 hours

---

### Task 3.2: Create Opportunity Detection WorkflowDefinition
**File**: `src/components/workflows/definitions/opportunityWorkflow.ts`

**Requirements**:
- 3-step workflow
- Focus: Elena's $410K Global Synchronization Initiative
- Data: Elena evaluating VectorSync + OmniCoord, needs timezone automation

**Step Structure**:

**Step 1: Opportunity Alert**
- Artifact: `alert`
- Type: 'success'
- Title: "💡 New Initiative Detected: High-Value Expansion Opportunity"
- Message: "Dr. Elena Voss (VP Technical Operations) is launching \"Global Synchronization Initiative\" - projected value $410K. This is a strategic expansion opportunity if Squelch can deliver timezone-intelligent scheduling by Q1 2026."

**Step 2: Context Analysis**
- Artifact: `status_grid`
- Title: "💰 Expansion Financial Modeling"
- Config:
  ```typescript
  {
    columns: 4,
    items: [
      { label: 'Current ARR', value: '$185K', status: 'neutral', sublabel: 'Existing contract' },
      { label: 'Expansion Value', value: '$410K', status: 'complete', sublabel: "Elena's initiative" },
      { label: 'Total Potential', value: '$595K', status: 'complete', sublabel: '3x current value' },
      { label: 'Competition', value: '2 vendors', status: 'warning', sublabel: 'VectorSync, OmniCoord' }
    ]
  }
  ```
- Second Artifact: `alert`
  - Type: 'warning'
  - Title: "⚠️ Competitive Threat"
  - Message: "Elena reached out to VectorSync and OmniCoord last week. Both vendors are pitching timezone automation. Squelch has relationship advantage but must commit to Q1 2026 delivery to neutralize competitive threat."
- Third Artifact: `markdown`
  - Title: "🎯 Key Requirements"
  - Content:
    ```markdown
    **Global Synchronization Initiative Details:**
    - **Sponsor:** Dr. Elena Voss (VP Technical Operations, "Nightingale")
    - **Scope:** Coordinate 23 facilities across 12 timezones
    - **Timeline:** Launch Q1 2026
    - **Budget:** $410K for platform expansion
    - **Critical Feature:** Timezone-intelligent scheduling (currently missing from Squelch)

    **Elena's Evaluation Criteria:**
    1. Timezone automation capability (MUST-HAVE)
    2. Proven reliability (Operation Blackout was a red flag)
    3. Technical partnership approach (not just vendor)
    4. Q1 2026 delivery commitment

    **AI Insight:** Elena's evaluation is driven by ONE feature. If Squelch commits to Q1 2026 timezone automation delivery, you neutralize VectorSync and OmniCoord. Sarah hasn't met Elena yet—this is the perfect intro opportunity.
    ```

**Step 3: Action Recommendation**
- Artifact: `markdown`
- Title: "✉️ Recommended Outreach"
- Content: Email draft to Elena
  ```markdown
  **To:** Dr. Elena Voss (elena.voss@obsidian-ops.net)
  **Subject:** Global Synchronization Initiative - Squelch Partnership Opportunity

  Dr. Voss,

  I'm Sarah Chen, your new Customer Success Manager at Squelch. I came across your Global Synchronization Initiative and wanted to introduce myself—this sounds like exactly the type of strategic project where Squelch can add real value.

  I understand you're evaluating options for timezone-intelligent scheduling across Obsidian Black's 23 facilities. This is an area where we're actively investing, and I'd love to discuss how Squelch can support your Q1 2026 launch.

  Would you have 30 minutes this week or next for a brief intro call? I'm not coming with a pitch—I'm genuinely curious about your vision for this initiative and whether Squelch is the right partner.

  Looking forward to connecting,
  Sarah Chen
  Customer Success Manager, Squelch
  sarah.chen@bluesoft.com
  ```
- Second Artifact: `action_tracker`
  - Title: "Follow-Up Actions"
  - Actions:
    - Send intro email to Elena (due: Today)
    - Schedule discovery call (due: This week)
    - Loop in Product team on timezone automation roadmap (due: Tomorrow)
    - Prepare competitive differentiation vs VectorSync/OmniCoord (due: This week)

**Acceptance Criteria**:
- [ ] 3 steps defined
- [ ] Alert displays with success/opportunity styling
- [ ] status_grid shows financial modeling (Current, Expansion, Total)
- [ ] Competitive threat noted (VectorSync, OmniCoord)
- [ ] Key requirements explained (timezone automation)
- [ ] AI insight clear and actionable
- [ ] Email draft professional, peer-to-peer tone (not salesy)
- [ ] action_tracker shows follow-up tasks
- [ ] Workflow can be imported and launched

**Estimated Time**: 1.5-2 hours

---

### Task 3.3: Create Executive Engagement WorkflowDefinition
**File**: `src/components/workflows/definitions/executiveEngagementWorkflow.ts`

**Requirements**:
- 3-step workflow
- Focus: Quarterly Business Review (QBR) with Marcus
- Context: Month 7 of strategic plan, time for progress check-in

**Step Structure**:

**Step 1: Scheduled Touchpoint**
- Artifact: `markdown`
- Title: "📅 Scheduled QBR Reminder"
- Content:
  ```markdown
  **From Your Strategic Plan (Month 3, Task 7):**
  > "Q1 QBR execution - show progress on trust rebuilding"

  **Timeline Context:**
  - Today: Month 7 since Sarah took over Obsidian Black
  - Strategic plan Phase 1-2 completed
  - Phase 3 in progress
  - Marcus engagement improving (from "low" to "medium")

  **QBR Purpose:**
  - Demonstrate progress on Year Two commitments
  - Show Obsidian Black you've addressed Operation Blackout root causes
  - Position renewal as natural next step
  - Highlight Elena expansion opportunity (if appropriate)

  **Recommended Format:**
  - 60-minute virtual meeting
  - Attendees: Marcus Castellan, Sarah Chen, optional: Product team
  - Deck structure: Past (accountability), Present (progress), Future (roadmap)
  ```

**Step 2: QBR Preparation**
- Artifact: `status_grid`
- Title: "📊 Q1 Performance Metrics"
- Config:
  ```typescript
  {
    columns: 4,
    items: [
      { label: 'Response Time', value: '↓ 42% faster', status: 'complete', sublabel: 'Avg 8h → 4.6h' },
      { label: 'Platform Uptime', value: '99.8%', status: 'complete', sublabel: 'Exceeded 99.5% SLA' },
      { label: 'Support Satisfaction', value: '↑ 4.1 → 7.8', status: 'complete', sublabel: 'NPS improved' },
      { label: 'Renewal Status', value: 'On Track', status: 'complete', sublabel: '87 days remaining' }
    ]
  }
  ```
- Second Artifact: `markdown`
  - Title: "🎯 Progress on Strategic Plan"
  - Content:
    ```markdown
    **Phase 1 (Days 1-7): Immediate Response ✅ COMPLETE**
    - ✅ Responded to Marcus email (acknowledged Year One failures)
    - ✅ Intro outreach to Elena Voss (first contact established)
    - ✅ Scheduled Marcus call (discussed Year Two expectations)

    **Phase 2 (Days 8-30): Trust Rebuilding ✅ COMPLETE**
    - ✅ Elena discovery call (understand Global Synchronization Initiative)
    - ✅ Delivered Accountability Report (Operation Blackout post-mortem)
    - ✅ Proposed dedicated technical liaison (ended support turnover)
    - ✅ Scheduled this QBR

    **Phase 3 (Days 31-90): Roadmap Positioning 🔄 IN PROGRESS**
    - 🔄 Timezone automation prototype demo (scheduled Month 8 with Elena)
    - 🔄 Expansion proposal presentation (Elena evaluating)
    - 📅 This QBR (Month 7)
    - 📅 Renewal negotiation kickoff (Month 9)

    **Risks Caught & Mitigated:**
    - ⚠️ Support ticket spike (Jan 2025) - Caught early, resolved in 72h avg
    - ⚠️ Elena evaluating competitors - Proactive outreach established relationship

    **Opportunities Pursued:**
    - 💰 Elena's $410K Global Synchronization Initiative - In discovery phase
    - 🤝 Dedicated liaison assigned - Marcus satisfaction improved
    ```

**Step 3: Meeting Scheduling**
- Artifact: `markdown`
- Title: "✅ QBR Confirmation"
- Content:
  ```markdown
  **Meeting Scheduled:**
  - **Date:** [Dynamic - 2 weeks from today]
  - **Time:** 2:00 PM PST
  - **Duration:** 60 minutes
  - **Format:** Virtual (Zoom link sent)
  - **Attendees:**
    - Marcus Castellan (Obsidian Black COO)
    - Sarah Chen (Squelch CSM)
    - [Optional] Product team member for timezone automation discussion

  **Pre-Meeting Preparation:**
  - [ ] Send deck to Marcus 24h before meeting
  - [ ] Confirm Product team attendance for timezone discussion
  - [ ] Review Marcus's recent feedback/concerns
  - [ ] Prepare renewal conversation talking points

  **Deck Sent to Marcus** ✅
  ```
- Second Artifact: `action_tracker`
  - Title: "Pre-QBR Actions"
  - Actions:
    - Finalize QBR deck (due: 1 week before)
    - Send deck to Marcus (due: 24h before)
    - Confirm Product team attendance (due: 1 week before)
    - Review Marcus feedback (due: Day before)
    - Prep renewal talking points (due: Day before)

**Acceptance Criteria**:
- [ ] 3 steps defined
- [ ] Touchpoint shows context (Month 7, from strategic plan)
- [ ] status_grid shows Q1 performance metrics (improved)
- [ ] Progress markdown shows Phase 1-3 status
- [ ] Risks/opportunities highlighted
- [ ] Meeting confirmation with dynamic date
- [ ] action_tracker shows pre-meeting prep tasks
- [ ] Professional tone throughout
- [ ] Workflow can be imported and launched

**Estimated Time**: 1.5-2 hours

---

## Phase 4: Integration & Polish (2-3 hours)

### Task 4.1: Add Workflow Chaining to Dashboard
**File**: `src/components/artifacts/dashboards/CSMDashboard.tsx`

**Current State**: Dashboard launches strategic planning workflow. After completion, modal closes.

**Goal**: After completing each workflow, show "Continue to [Next Workflow]" prompt instead of closing modal.

**Implementation Approach**:

**Add State for Current Workflow**:
```typescript
const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
const [showNextWorkflowPrompt, setShowNextWorkflowPrompt] = useState<string | null>(null);
```

**Update Modal Workflow Assignment**:
```typescript
// When launching workflow from task
const handleLaunchTaskMode = (taskId?: number) => {
  // ... existing logic
  setCurrentWorkflowId('aco-strategic-planning'); // Track which workflow is running
  setShowTaskModal(true);
};
```

**Update onComplete Handler**:
```typescript
onComplete={(executionId) => {
  console.log('Workflow completed:', executionId);

  // Determine next workflow
  if (currentWorkflowId === 'aco-strategic-planning') {
    setShowNextWorkflowPrompt('risk-detection');
  } else if (currentWorkflowId === 'risk-detection') {
    setShowNextWorkflowPrompt('opportunity-detection');
  } else if (currentWorkflowId === 'opportunity-detection') {
    setShowNextWorkflowPrompt('executive-engagement');
  } else {
    // Final workflow done
    handleCloseModal();
  }
}}
```

**Add Next Workflow Prompt UI** (inside ResizableModal or as overlay):
```typescript
{showNextWorkflowPrompt && (
  <div className="absolute inset-0 bg-white/95 flex items-center justify-center z-50">
    <div className="text-center space-y-4">
      <div className="text-2xl font-bold text-green-600">✅ Workflow Complete!</div>
      <p className="text-gray-700">Great work completing {currentWorkflowId}</p>

      <div className="space-x-4">
        <button
          onClick={() => {
            setCurrentWorkflowId(showNextWorkflowPrompt);
            setShowNextWorkflowPrompt(null);
            // Load next workflow definition
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue to {getWorkflowName(showNextWorkflowPrompt)}
        </button>

        <button
          onClick={handleCloseModal}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  </div>
)}
```

**Create Workflow Map**:
```typescript
const workflowMap: Record<string, WorkflowDefinition> = {
  'aco-strategic-planning': strategicPlanningWorkflow,
  'risk-detection': riskDetectionWorkflow,
  'opportunity-detection': opportunityWorkflow,
  'executive-engagement': executiveEngagementWorkflow
};

const getWorkflowName = (id: string) => {
  const names: Record<string, string> = {
    'risk-detection': 'Risk Detection',
    'opportunity-detection': 'Opportunity Detection',
    'executive-engagement': 'Executive Engagement'
  };
  return names[id] || id;
};
```

**Acceptance Criteria**:
- [ ] Completing Strategic Planning shows "Continue to Risk Detection"
- [ ] Clicking continues to next workflow (modal stays open)
- [ ] Completing Risk Detection shows "Continue to Opportunity Detection"
- [ ] Completing Opportunity Detection shows "Continue to Executive Engagement"
- [ ] Completing Executive Engagement closes modal (final workflow)
- [ ] "Return to Dashboard" button works at any point
- [ ] All 4 workflows can be completed in sequence without closing modal
- [ ] No console errors during transitions

**Estimated Time**: 1-1.5 hours

---

### Task 4.2: Apply Villain Theming
**Files**: Various component files, Tailwind config, or component-level styling

**Requirements**:
Subtle villain references throughout the experience:
- Artifact titles (already in WorkflowDefinitions)
- Button copy
- Loading states
- Dashboard header
- Error messages

**Changes to Make**:

**Button Copy** (villain-appropriate language):
- "Save" → "Execute Plan"
- "Submit" → "Coordinate Action"
- "Continue" → "Proceed to Next Phase" (optional, can keep "Continue")
- "Complete Workflow" → "Finalize Operation"

**Loading States** (update wherever spinners appear):
- "Loading..." → "Coordinating assets..."
- "Saving..." → "Securing intelligence..."
- "Processing..." → "Analyzing tactical data..."

**Dashboard Header** (add ThreatOS™ branding):
```typescript
<div className="dashboard-header">
  <div className="flex items-center space-x-2">
    <span className="text-2xl font-bold">ThreatOS™</span>
    <span className="text-sm text-gray-500">Customer Success Intelligence</span>
  </div>
  {/* ... rest of header */}
</div>
```

**Error Messages** (maintain professionalism):
- "Error loading data" → "Intelligence retrieval compromised"
- "Failed to save" → "Operation failed to secure data"
- "Network error" → "Communication channel interrupted"

**Tone Guidelines**:
- Professional, not campy
- Enterprise-grade UI feel
- Villain references subtle (smile, not laugh)
- NO cartoon villain clichés (no "MWAHAHA", no evil laughter, no skulls)
- Think "tactical operations center" not "villain lair"

**Color Palette** (optional enhancement):
- Consider dark mode toggle for "tactical operations" feel
- Primary: Deep blues/charcoal
- Accent: Tactical orange/amber for alerts
- Success: Emerald green
- Error: Crimson red
- Neutral: Slate gray

**Acceptance Criteria**:
- [ ] Artifact titles use villain naming (already in workflows)
- [ ] Button copy uses villain-appropriate language
- [ ] Loading states use villain language
- [ ] Dashboard header shows ThreatOS™ branding
- [ ] Error messages maintain professional villain tone
- [ ] Theme feels tactical/professional (NOT campy)
- [ ] NO cartoon villain clichés present
- [ ] All changes subtle and tasteful

**Estimated Time**: 1 hour

---

### Task 4.3: Test Full Act 1 Flow
**Comprehensive Test Script**:

**Pre-Test Setup**:
1. Run `npm run dev`
2. Clear browser cache/localStorage (fresh state)
3. Login as demo user
4. Verify dashboard loads

**Test Flow**:

**Dashboard Verification**:
- [ ] Dashboard renders without errors
- [ ] Task queue shows Obsidian Black task (Priority HIGH, Due Today)
- [ ] Customer profile card displays (if Task 1.2 done)
  - [ ] Name: Obsidian Black
  - [ ] ARR: $185,000
  - [ ] Health Score: 6.4/10 (yellow)
  - [ ] Opportunity Score: 8.7/10 (green)
  - [ ] Renewal Date: Apr 15, 2026 (143 days)
  - [ ] Primary Contact: Marcus Castellan

**Workflow 1: Strategic Planning**:
- [ ] Click Obsidian Black task → Modal opens with WorkflowExecutor
- [ ] Modal draggable, resizable, minimizable
- [ ] Progress bar shows "Step 1 of 5"
- [ ] CustomerMetrics toggle button visible in header
- [ ] Step 1: Contract Review
  - [ ] status_grid artifact renders (ARR, Renewal, Auto-Renew, SLA)
  - [ ] All 4 items display correctly with proper styling
  - [ ] Click "Continue"
- [ ] Step 2: Performance History
  - [ ] timeline artifact shows Operation Blackout + others
  - [ ] Chronological display
  - [ ] Click "Continue"
- [ ] Step 3: Risk Analysis
  - [ ] status_grid shows 6 health components
  - [ ] alert shows "CHURN PROBABILITY: 42%"
  - [ ] Click "Continue"
- [ ] Step 4: Strategic Response
  - [ ] Step renders (minimal OK for demo)
  - [ ] Click "Continue"
- [ ] Step 5: Account Plan
  - [ ] action_tracker shows 11 tasks
  - [ ] Progress bar shows 0/11
  - [ ] Checkboxes functional (click to toggle)
  - [ ] alert shows "78% renewal probability"
  - [ ] Click "Complete Workflow" or "Finalize Operation"
- [ ] Completion prompt shows "Continue to Risk Detection"
- [ ] Click "Continue to Risk Detection"

**Workflow 2: Risk Detection**:
- [ ] Modal transitions to Risk Detection (doesn't close/reopen)
- [ ] Progress bar shows "Step 1 of 3"
- [ ] Step 1: Risk Alert
  - [ ] alert artifact shows ticket spike warning
  - [ ] Urgency styling applied
  - [ ] Click "Continue"
- [ ] Step 2: Context Analysis
  - [ ] markdown table shows 5 tickets
  - [ ] AI insight displays themes
  - [ ] Click "Continue"
- [ ] Step 3: Action Recommendation
  - [ ] markdown shows email draft to Marcus
  - [ ] action_tracker shows follow-up tasks
  - [ ] Click "Complete Workflow"
- [ ] Completion prompt shows "Continue to Opportunity Detection"
- [ ] Click "Continue to Opportunity Detection"

**Workflow 3: Opportunity Detection**:
- [ ] Modal transitions to Opportunity Detection
- [ ] Progress bar shows "Step 1 of 3"
- [ ] Step 1: Opportunity Alert
  - [ ] alert artifact shows Elena's initiative (success styling)
  - [ ] $410K value mentioned
  - [ ] Click "Continue"
- [ ] Step 2: Context Analysis
  - [ ] status_grid shows financial modeling (Current, Expansion, Total)
  - [ ] Competitive threat alert displays
  - [ ] markdown shows key requirements (timezone automation)
  - [ ] Click "Continue"
- [ ] Step 3: Action Recommendation
  - [ ] markdown shows email draft to Elena
  - [ ] Peer-to-peer tone (not salesy)
  - [ ] action_tracker shows follow-up tasks
  - [ ] Click "Complete Workflow"
- [ ] Completion prompt shows "Continue to Executive Engagement"
- [ ] Click "Continue to Executive Engagement"

**Workflow 4: Executive Engagement**:
- [ ] Modal transitions to Executive Engagement
- [ ] Progress bar shows "Step 1 of 3"
- [ ] Step 1: Scheduled Touchpoint
  - [ ] markdown shows QBR context (Month 7, from strategic plan)
  - [ ] Click "Continue"
- [ ] Step 2: QBR Preparation
  - [ ] status_grid shows Q1 metrics (Response Time, Uptime, Satisfaction, Renewal)
  - [ ] markdown shows progress on Phases 1-3
  - [ ] Click "Continue"
- [ ] Step 3: Meeting Scheduling
  - [ ] markdown shows meeting confirmation
  - [ ] Dynamic date displays correctly
  - [ ] action_tracker shows pre-meeting prep tasks
  - [ ] Click "Complete Workflow"
- [ ] Modal closes (final workflow)
- [ ] Returns to dashboard

**Post-Flow Tests**:
- [ ] Dashboard reflects completed workflows (if tracking implemented)
- [ ] Demo reset button visible (if Task 1.3 done)
- [ ] Press Ctrl+Alt+R → Confirmation modal appears
- [ ] Confirm reset → Page reloads → Dashboard returns to fresh state

**CustomerMetrics Panel Tests**:
- [ ] Relaunch any workflow
- [ ] Click CustomerMetrics toggle in header
- [ ] Metrics panel slides down from top (50% height)
- [ ] Panel shows customer metrics (if API connected)
- [ ] Click expand button → Panel goes fullscreen
- [ ] Click close → Panel collapses
- [ ] Metrics toggle works from any workflow step

**ArtifactDisplay Panel Tests**:
- [ ] During any workflow, click artifact icon (if present)
- [ ] Right-side panel opens with artifact list
- [ ] Panel resizable (drag edge)
- [ ] Click expand → Panel goes fullscreen
- [ ] Click close → Panel closes
- [ ] Can switch between artifacts if multiple generated

**Responsive Test**:
- [ ] Resize browser to tablet width (768px)
- [ ] Dashboard responsive (no horizontal scroll)
- [ ] Modal responsive (min-width constraints work)
- [ ] Artifacts display correctly on tablet
- [ ] Touch interactions work (if testing on tablet)

**Performance Test**:
- [ ] Each workflow loads in < 2 seconds
- [ ] Step transitions smooth (< 500ms)
- [ ] No lag when clicking breadcrumbs
- [ ] Modal drag/resize smooth (60fps feel)

**Console Test**:
- [ ] Open browser DevTools
- [ ] Complete full Act 1 flow (all 4 workflows)
- [ ] No console errors
- [ ] No console warnings (OK to have minor warnings)
- [ ] No network errors (except expected 404s for unavailable APIs)

**Estimated Time**: 1 hour (thorough testing)

---

## Coordination with Backend

### API Endpoints You'll Need

**Customer Context APIs** (for dashboard + workflow data):
- `GET /api/customers/aco` → Full Obsidian Black profile (name, ARR, health, opportunity scores)
- `GET /api/customers/aco/contacts` → Marcus + Elena contact info
- `GET /api/customers/aco/operations` → Operation Blackout history
- `GET /api/customers/aco/health` → Risk score breakdown (component scores)
- `GET /api/customers/aco/tickets` → Support ticket spike data (5 recent tickets)
- `GET /api/customers/aco/opportunities` → Elena's $410K initiative details

**Workflow Execution APIs** (WorkflowExecutor expects these):
- `POST /api/workflows/executions` → Create new workflow execution
  - Request: `{ workflowConfigId, workflowName, workflowType, customerId, totalSteps }`
  - Response: `{ execution: { id, ... } }`
- `GET /api/workflows/executions/{executionId}` → Load existing execution state
  - Response: `{ execution: { id, workflow_config_id, current_step_index, status, ... } }`
- `PUT /api/workflows/executions/{executionId}/steps` → Save step progress
  - Request: `{ stepNumber, stepData, status }`
  - Response: `{ success: true }`
- `PUT /api/workflows/executions/{executionId}` → Update execution (current step)
  - Request: `{ currentStep }`
  - Response: `{ success: true }`
- `GET /api/workflows/executions/{executionId}/metrics` → Customer metrics for panel
  - Response: `{ metrics: [...], customerName: '...' }`

**Demo Management APIs**:
- `POST /api/demo/reset` → Clear all demo workflow state
  - Request: `{ confirm: true }`
  - Response: `{ success: true, message: '...' }`

**AI Insights APIs** (Pre-written responses for demo):
- `POST /api/ai/risk-analysis` → Risk breakdown (churn probability, component scores)
- `POST /api/ai/opportunity-analysis` → Expansion analysis (Elena's initiative)
- `POST /api/ai/email-draft` → Email templates (Marcus, Elena)

### Mock Data Strategy

**For Act 1 Demo**: Backend can return static JSON responses (no real LLM needed yet)

**Data Should Match**:
- Obsidian Black profile data (ARR $185K, health 6.4, opportunity 8.7)
- Operation Blackout details (Oct 2024, $150K cost, 47-sec latency)
- Support tickets (5 tickets, 3.3x spike, 80% frustrated)
- Elena's initiative ($410K, timezone automation requirement)

**API Contract Document**: Ask BE to create `docs/planning/API-CONTRACT.md` with example responses

---

## Definition of Done

### Phase 1: Dashboard ✅
- [ ] Dashboard renders correctly
- [ ] Task queue shows Obsidian Black task
- [ ] Customer profile card displays Obsidian Black data (Task 1.2)
- [ ] Health/opportunity scores color-coded
- [ ] Demo reset button functional (Task 1.3)
- [ ] Clicking Obsidian Black task launches Workflow 1 in modal

### Phase 2: Workflow 1 ✅
- [ ] strategicPlanningWorkflow.ts created with 5 steps
- [ ] All artifacts defined (status_grid, timeline, action_tracker, alert)
- [ ] Dashboard imports and launches workflow
- [ ] All 5 steps render correctly
- [ ] Artifacts display ACO-specific data
- [ ] Villain-themed titles applied
- [ ] Progress bar shows "Step X of 5"
- [ ] Breadcrumbs functional
- [ ] Workflow completes and saves state

### Phase 3: Workflows 2-4 ✅
- [ ] riskDetectionWorkflow.ts created (3 steps)
- [ ] opportunityWorkflow.ts created (3 steps)
- [ ] executiveEngagementWorkflow.ts created (3 steps)
- [ ] All workflows importable
- [ ] All artifacts render correctly
- [ ] Data matches Obsidian Black context

### Phase 4: Integration ✅
- [ ] Workflow chaining works (W1 → W2 → W3 → W4)
- [ ] Completion prompts show "Continue to [Next]"
- [ ] User can complete all 4 workflows in sequence
- [ ] "Return to Dashboard" works at any point
- [ ] Dashboard reflects progress (if tracking implemented)
- [ ] Villain theming applied consistently
- [ ] Button copy villain-appropriate
- [ ] Loading states use villain language
- [ ] ThreatOS™ branding visible
- [ ] Demo reset clears all state
- [ ] CustomerMetrics slide-down works
- [ ] ArtifactDisplay panel functional
- [ ] Tablet responsive (768px+)
- [ ] Full Act 1 demo runs in < 15 minutes
- [ ] No console errors
- [ ] Performance acceptable (< 2sec workflow loads)

### Final Approval ✅
- [ ] PM reviews all 4 workflows
- [ ] Justin approves the implementation
- [ ] Ready for BE integration (API connections)
- [ ] Ready for demo presentation

---

## Time Estimates Summary

| Phase | Tasks | Original Estimate | NEW Estimate | Time Saved |
|-------|-------|------------------|--------------|------------|
| Phase 1: Dashboard | 3 tasks | 2-3 hours | 1-2 hours | 1 hour (verification vs build) |
| Phase 2: Workflow 1 | 7 tasks | 4-5 hours | 3-4 hours | 1-2 hours (no modal build) |
| Phase 3: Workflows 2-4 | 3 tasks | 6-8 hours | 4-5 hours | 2-3 hours (no artifact components) |
| Phase 4: Integration | 3 tasks | 2-3 hours | 2-3 hours | 0 hours |
| **TOTAL** | **16 tasks** | **15-21 hours** | **10-14 hours** | **5-7 hours saved!** |

### Why Time Reduced

**You Already Built** (Oct 9-10, 2025):
- ✅ WorkflowExecutor (754 lines) - Saved ~4 hours
- ✅ CustomerMetrics (283 lines) - Saved ~1 hour
- ✅ ArtifactRenderer (558 lines) - Saved ~3 hours
- ✅ ArtifactDisplay (369 lines) - Saved ~1 hour
- ✅ ResizableModal - Saved ~1 hour
- ✅ StepRenderer, WorkflowChatPanel, TaskPanel - Saved ~2 hours

**Total Infrastructure**: ~12 hours of work already done!

---

## Questions for PM (Before Starting)

1. **Workflow Data**: Should artifacts pull data from APIs or use static data embedded in WorkflowDefinitions for demo?
2. **Chat Branching** (Step 4 of Strategic Planning): Do we need functional branching, or can it be simulated/minimal for demo?
3. **Email Drafts**: Should they be editable in workflows, or static preview for demo?
4. **Workflow Exit Flow**: Auto-advance to next workflow, or require user click on "Continue to [Next]"?
5. **Obsidian Black Logo/Assets**: Do we need villain organization branding/logo files, or text-only branding?
6. **API Integration Timing**: Are BE APIs ready now, or should I use mock data in WorkflowDefinitions for now?

---

## Reference Files (Study These First!)

**Architecture Examples**:
- `src/components/workflows/WorkflowExecutor.tsx` - The orchestrator (how it all works)
- `src/components/workflows/definitions/testWorkflow.ts` - Example WorkflowDefinition structure
- `src/app/test-modal-workflow/page.tsx` - Example dashboard integration

**Component APIs**:
- `src/components/workflows/artifacts/ArtifactRenderer.tsx` - All artifact types and configs
- `src/components/workflows/CustomerMetrics.tsx` - Metrics panel component
- `src/components/workflows/ArtifactDisplay.tsx` - Right-side artifact panel
- `src/components/workflows/ResizableModal.tsx` - Modal wrapper

**Current Dashboard**:
- `src/components/artifacts/dashboards/CSMDashboard.tsx` - Your starting point (already updated by PM)

---

**Ready to start? You're building on a solid foundation—your past self did great work! Focus on creating the 4 WorkflowDefinitions and polishing the dashboard. The hard infrastructure work is done!**

**Questions? Ask PM before starting. Good luck! 🚀**
