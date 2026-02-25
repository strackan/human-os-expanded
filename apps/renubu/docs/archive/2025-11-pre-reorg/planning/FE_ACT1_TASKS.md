# Front-End Engineer: Act 1 Task Breakdown

> **Purpose**: Detailed task list for implementing Act 1 demo (dashboard + 4 workflows)
> **Estimate**: 15-21 hours
> **Priority**: Start with Dashboard + Workflow 1, then parallelize Workflows 2-4
> **Review Status**: 🟡 Pending Justin's approval before starting

---

## 📋 Quick Reference

**Your Onboarding Doc**: `FE_START_HERE.md`
**Scope Doc**: `ACT1_SCOPE_OF_WORK.md`
**Villain Universe Reference**: See "Creative Director's storyboard" in project context

**Key Context**:
- Customer: Obsidian Black (Obsidian Black)
- Contacts: Marcus Castellan (COO), Dr. Elena Voss (VP Tech Ops)
- Product: ThreatOS™
- Theme: Professional villain universe (dark mode, tactical aesthetic)
- Responsive: Tablet-optimized (768px min-width)

---

## Phase 1: Dashboard & Foundation (2-3 hours)

### Task 1.1: Create Dashboard Landing Page
**File**: `src/app/dashboard/page.tsx` (or appropriate location)

**Requirements**:
- Clean, modern layout
- Header: "Welcome back, Sarah" + current date
- ThreatOS branding (subtle villain aesthetic)
- Responsive: 768px minimum width

**Acceptance Criteria**:
- [ ] Dashboard loads after login
- [ ] Displays welcome message
- [ ] Shows current date
- [ ] Branding consistent with villain theme
- [ ] No console errors

**Estimated Time**: 30 minutes

---

### Task 1.2: Build Task Queue Component
**File**: `src/components/TaskQueue.tsx`

**Requirements**:
- Center focus of dashboard
- Single task card displayed:
  - Title: "Complete Strategic Account Plan - Obsidian Black"
  - Priority: HIGH (red/orange indicator)
  - Due: Today
  - Estimated Time: 25 minutes
  - Click → launches Workflow 1

**Acceptance Criteria**:
- [ ] Task card renders with all fields
- [ ] Priority indicator visible (color-coded)
- [ ] Click handler launches Workflow 1 modal
- [ ] Hover state shows tooltip with additional context
- [ ] Accessible (keyboard navigation works)

**Estimated Time**: 45 minutes

---

### Task 1.3: Build Customer Profile Card
**File**: `src/components/CustomerProfileCard.tsx`

**Requirements**:
- Right-side panel of dashboard
- Obsidian Black profile display:
  - Name: Obsidian Black
  - ARR: $850,000
  - Health Score: 4.2/10 (RED indicator)
  - Opportunity Score: 8.7/10 (GREEN indicator)
  - Renewal Date: April 15, 2026 (143 days away)
  - Primary Contact: Marcus Castellan (COO)

**Data Source**: `GET /api/customers/aco` (coordinate with BE)

**Acceptance Criteria**:
- [ ] Card renders with all Obsidian Black data
- [ ] Health score shows red indicator (< 5.0)
- [ ] Opportunity score shows green indicator (> 7.0)
- [ ] Renewal countdown displays days remaining
- [ ] Contact name clickable (future: opens contact modal)
- [ ] Handles loading state
- [ ] Handles error state (if API fails)

**Estimated Time**: 1 hour

---

### Task 1.4: Build Health/Opportunity Score Indicators
**File**: `src/components/HealthScoreIndicator.tsx`

**Requirements**:
- Visual component showing score 0-10
- Color-coded:
  - 0-3.9: Red (critical)
  - 4.0-6.9: Yellow (at-risk)
  - 7.0-10: Green (healthy)
- Tooltip on hover explaining score

**Acceptance Criteria**:
- [ ] Renders score with correct color
- [ ] Tooltip shows breakdown (if data available)
- [ ] Accessible (screen reader support)
- [ ] Reusable for both health and opportunity scores

**Estimated Time**: 30 minutes

---

### Task 1.5: Demo Reset Button
**Files**:
- `src/components/UserAvatarDropdown.tsx` (add reset option)
- `src/lib/demoReset.ts` (reset logic)

**Requirements**:
- User avatar dropdown shows "Reset Demo" option (only for demo users)
- Keyboard shortcut: Ctrl+Alt+R
- Confirmation modal: "Reset demo state? This will clear all workflow progress."
- On confirm: Call `POST /api/demo/reset`, reload page

**Acceptance Criteria**:
- [ ] Reset option visible in dropdown for demo users only
- [ ] Ctrl+Alt+R triggers reset confirmation
- [ ] Confirmation modal prevents accidental reset
- [ ] Reset clears all workflow state
- [ ] Page reloads to fresh dashboard
- [ ] Non-demo users don't see reset option

**Estimated Time**: 45 minutes

---

## Phase 2: Workflow 1 - Strategic Account Planning (4-5 hours)

### Task 2.1: Create Workflow Modal Container
**File**: `src/components/workflows/WorkflowModal.tsx`

**Requirements**:
- Full-screen modal (or large centered modal)
- Split layout: Chat interface (left) + Artifacts panel (right)
- Close button (returns to dashboard)
- Workflow progress indicator (Step X of 5)

**Acceptance Criteria**:
- [ ] Modal renders over dashboard
- [ ] Split layout responsive on tablets
- [ ] Close button returns to dashboard (preserves state)
- [ ] Progress indicator updates per step
- [ ] Smooth transitions between steps

**Estimated Time**: 1 hour

---

### Task 2.2: Build Strategic Planning Workflow Config
**File**: `src/components/workflows/configs/strategicPlanningConfig.ts`

**Requirements**:
- Define 5-step workflow structure
- Each step has:
  - AI prompt text
  - Artifact to display
  - Chat branching options
  - Next step logic

**Steps**:
1. Contract Intelligence Review
2. Performance History Analysis
3. Risk Score Calculation
4. Chat Flow - Strategic Response
5. Account Plan Generation

**Acceptance Criteria**:
- [ ] Config exports WorkflowConfig type
- [ ] All 5 steps defined
- [ ] Chat branching logic specified
- [ ] Artifact references correct components
- [ ] Can be loaded by WorkflowOrchestrator

**Estimated Time**: 45 minutes

---

### Task 2.3: Build Contract Intelligence Artifact
**File**: `src/components/artifacts/ContractIntelligenceArtifact.tsx`

**Requirements**:
- Display contract summary:
  - Renewal Date
  - Current ARR
  - Contract Term
  - Auto-Renewal status
  - SLA Terms
- AI insight callout box

**Data Source**: `GET /api/customers/aco/contract`

**Acceptance Criteria**:
- [ ] Renders contract data in readable format
- [ ] AI insight box styled distinctly
- [ ] Dates formatted correctly
- [ ] Currency formatted (e.g., $850,000)
- [ ] Villain-themed artifact title: "Annual Coordination Services Agreement"

**Estimated Time**: 45 minutes

---

### Task 2.4: Build Incident Log Artifact
**File**: `src/components/artifacts/IncidentLogArtifact.tsx`

**Requirements**:
- Timeline visualization of Obsidian Black failures:
  - Oct 2024: Operation Blackout (47-sec latency, $850K loss)
  - Jun-Sep 2024: 87-day communication gap
  - Q2-Q4 2024: Support turnover (4 liaisons in 8 months)
- Each incident clickable for details
- AI insight callout

**Data Source**: `GET /api/customers/aco/operations`

**Acceptance Criteria**:
- [ ] Timeline renders chronologically
- [ ] Each incident shows date, description, impact
- [ ] Operation Blackout highlighted (most severe)
- [ ] AI insight box visible
- [ ] Villain-themed title: "Operational Incident Log"

**Estimated Time**: 1 hour

---

### Task 2.5: Build Threat Analysis Report Artifact
**File**: `src/components/artifacts/ThreatAnalysisReportArtifact.tsx`

**Requirements**:
- Overall health score: 4.2/10 (large, prominent)
- Component score breakdown:
  - Product Performance: 3.1/10
  - Relationship Strength: 4.8/10
  - Strategic Alignment: 5.2/10
  - Support Quality: 3.5/10
  - Executive Sponsorship: 6.0/10
- Visual bars/indicators for each component
- AI insight: "CHURN PROBABILITY: 68%"

**Data Source**: `GET /api/customers/aco/health`

**Acceptance Criteria**:
- [ ] Overall score prominently displayed
- [ ] Component scores render with visual indicators
- [ ] Color-coded (red for low, yellow for medium)
- [ ] AI churn probability callout styled urgently
- [ ] Villain-themed title: "Threat Analysis Report"

**Estimated Time**: 1 hour

---

### Task 2.6: Build Account Plan Artifact
**File**: `src/components/artifacts/AccountPlanArtifact.tsx`

**Requirements**:
- Display 90-day strategic plan:
  - **Phase 1 (Days 1-7)**: Immediate response (3 tasks)
  - **Phase 2 (Days 8-30)**: Trust rebuilding (4 tasks)
  - **Phase 3 (Days 31-90)**: Roadmap positioning (4 tasks)
- Each task shows:
  - Task name
  - Due date
  - Status (pending/scheduled)
- AI success probability: "78% renewal probability if executed"

**Data Source**: Generated during workflow (POST to save plan)

**Acceptance Criteria**:
- [ ] All 3 phases render with tasks
- [ ] Tasks grouped by phase
- [ ] Due dates calculated dynamically
- [ ] AI success metric displayed
- [ ] Villain-themed title: "Operational Continuity Blueprint"
- [ ] Expandable/collapsible phases (optional but nice)

**Estimated Time**: 1.5 hours

---

### Task 2.7: Implement Chat Branching Logic
**File**: `src/components/workflows/ChatInterface.tsx`

**Requirements**:
- Step 4 of workflow: AI asks "What's your biggest concern?"
- 4 option buttons:
  1. "I'm worried we can't fix technical issues in time"
  2. "I don't know Elena Voss at all—she could tank this"
  3. "143 days isn't enough time to rebuild trust"
  4. "What if Marcus has already decided to leave?"
- Demo path: Option 2 selected
- AI responds with Elena context

**Acceptance Criteria**:
- [ ] 4 buttons render after AI prompt
- [ ] Selecting option triggers AI response
- [ ] Response specific to selected option
- [ ] Workflow advances to Step 5 after response
- [ ] Chat history preserved (can scroll back)

**Estimated Time**: 45 minutes

---

## Phase 3: Workflows 2-4 (6-8 hours total)

### Task 3.1: Build Risk Detection Workflow
**File**: `src/components/workflows/RiskDetectionWorkflow.tsx`

**Requirements**:
- 3-step workflow:
  1. **Risk Alert**: "⚠️ Urgent: Support Ticket Spike - Obsidian Black"
  2. **Context Analysis**: Show 5 tickets, sentiment = frustrated
  3. **Action Recommendation**: Draft email, schedule call button

**Artifacts**:
- Support ticket summary (table or list)
- Email draft preview
- Call scheduling confirmation

**Data Source**: `GET /api/customers/aco/tickets`

**Acceptance Criteria**:
- [ ] Alert displays with urgency styling
- [ ] Ticket summary shows themes (permissions, performance)
- [ ] AI insight: "3x normal rate, frustration detected"
- [ ] Email draft editable (optional)
- [ ] "Schedule call" button triggers confirmation
- [ ] Workflow exits with "Call scheduled" state

**Estimated Time**: 2-2.5 hours

---

### Task 3.2: Build Opportunity Detection Workflow
**File**: `src/components/workflows/OpportunityWorkflow.tsx`

**Requirements**:
- 3-step workflow:
  1. **Opportunity Alert**: "💡 New Initiative Detected - Obsidian Black"
  2. **Context Analysis**: Elena launching $1.7M "Global Synchronization Initiative"
  3. **Action Recommendation**: Draft intro email to Elena

**Artifacts**:
- Expansion proposal (current $850K → potential $2.55M)
- Competitive threat analysis (VectorSync, OmniCoord)
- Email draft to Elena

**Data Source**: `GET /api/customers/aco/opportunities`

**Acceptance Criteria**:
- [ ] Alert displays with opportunity styling (green/positive)
- [ ] Initiative details shown (scope, value, requirements)
- [ ] Competitive threat noted (Elena evaluating 2 others)
- [ ] AI insight: "Key requirement: timezone automation"
- [ ] Email draft professional, peer-to-peer tone
- [ ] "Schedule intro call" button triggers confirmation
- [ ] Workflow exits with "Call scheduled" state

**Estimated Time**: 2-2.5 hours

---

### Task 3.3: Build Executive Engagement Workflow
**File**: `src/components/workflows/ExecutiveEngagementWorkflow.tsx`

**Requirements**:
- 3-step workflow:
  1. **Scheduled Touchpoint**: From strategic plan, time for QBR
  2. **QBR Preparation**: Auto-generated deck preview
  3. **Meeting Scheduling**: Confirm meeting with Marcus

**Artifacts**:
- QBR deck (slide preview or summary)
  - Metrics: Response time improved, usage up, NPS increased
  - Risk caught: Support ticket spike (resolved)
  - Opportunity: Elena's initiative (in progress)
  - Forward-looking: Renewal on track

**Data Source**: Generated from workflow history + Obsidian Black data

**Acceptance Criteria**:
- [ ] Touchpoint shows context (from strategic plan, Month 7)
- [ ] QBR deck displays key metrics
- [ ] Progress shown (risks mitigated, opportunities pursued)
- [ ] Minor edits allowed (optional, can be static for demo)
- [ ] "Schedule meeting" button triggers confirmation
- [ ] Workflow exits with "Meeting scheduled" state

**Estimated Time**: 2-2.5 hours

---

## Phase 4: Scene Integration & Polish (2-3 hours)

### Task 4.1: Implement Workflow Chaining
**File**: `src/lib/workflowChain.ts` or within dashboard

**Requirements**:
- After completing Workflow 1, show option to continue to Workflow 2
- "Next: Risk Detection" button or auto-advance after 2-second pause
- User can navigate: Dashboard → W1 → W2 → W3 → W4
- User can return to dashboard at any point (state preserved)

**Acceptance Criteria**:
- [ ] Completing W1 shows "Continue to Risk Detection"
- [ ] Clicking continues to W2 (doesn't reload page)
- [ ] All 4 workflows can be accessed in sequence
- [ ] Returning to dashboard preserves completed workflows
- [ ] Progress indicator shows current position (W1/4, W2/4, etc.)

**Estimated Time**: 1 hour

---

### Task 4.2: Apply Villain Theming
**Files**: `src/styles/villain-theme.css` or Tailwind config

**Requirements**:
- Dark mode color palette:
  - Background: Deep navy/charcoal
  - Accent: Tactical orange/red
  - Text: High-contrast white/light gray
- Subtle villain references:
  - Artifact titles (already specified)
  - Button copy ("Execute Plan" instead of "Save")
  - Loading states ("Coordinating assets..." instead of "Loading...")

**Tone Guidelines**:
- Professional, not campy
- Enterprise-grade UI
- Villain references subtle (smile, not laugh)

**Acceptance Criteria**:
- [ ] Dark mode applied across all components
- [ ] Color palette consistent
- [ ] Artifact titles use villain naming
- [ ] Button copy uses villain-appropriate language
- [ ] NO cartoon villain clichés (no "MWAHAHA")
- [ ] Theme feels tactical/professional

**Estimated Time**: 1-1.5 hours

---

### Task 4.3: Test Full Act 1 Flow
**Test Script**:
1. Login as Sarah (demo user)
2. Dashboard loads with Obsidian Black task
3. Launch Workflow 1 (Strategic Planning)
   - Complete all 5 steps
   - Verify artifacts display correctly
   - Verify chat branching works
   - Verify plan generates
4. Continue to Workflow 2 (Risk Detection)
   - Verify alert displays
   - Verify ticket data loads
   - Verify action recommendation
5. Continue to Workflow 3 (Opportunity)
   - Verify opportunity alert
   - Verify Elena data displays
   - Verify expansion proposal
6. Continue to Workflow 4 (Executive Engagement)
   - Verify QBR deck generates
   - Verify meeting scheduling
7. Return to dashboard (verify state preserved)
8. Test demo reset (Ctrl+Alt+R)
9. Test tablet responsiveness (768px)

**Acceptance Criteria**:
- [ ] Full flow completes without errors
- [ ] All workflows function independently
- [ ] Transitions smooth between workflows
- [ ] Dashboard accurately reflects completed workflows
- [ ] Demo reset clears all state
- [ ] Responsive on tablets (768px+)
- [ ] No console errors
- [ ] Performance acceptable (< 2sec per workflow load)

**Estimated Time**: 45 minutes

---

## Coordination with Backend

### API Endpoints You'll Need (Coordinate with BE)

**Customer Context**:
- `GET /api/customers/aco` → Full Obsidian Black profile
- `GET /api/customers/aco/contacts` → Marcus + Elena
- `GET /api/customers/aco/contract` → Contract terms
- `GET /api/customers/aco/operations` → Operation Blackout history
- `GET /api/customers/aco/health` → Risk/opportunity scores
- `GET /api/customers/aco/tickets` → Support ticket spike data
- `GET /api/customers/aco/opportunities` → Elena's initiative

**Workflow State**:
- `POST /api/workflows/start` → Initialize workflow session
- `PUT /api/workflows/{id}/step` → Save step progress
- `GET /api/workflows/{id}/context` → Retrieve saved context

**Demo Management**:
- `POST /api/demo/reset` → Clear all demo state

**AI Insights** (Pre-written responses for now):
- `POST /api/ai/risk-analysis` → Returns risk breakdown
- `POST /api/ai/opportunity-analysis` → Returns expansion scenarios
- `POST /api/ai/email-draft` → Returns email template

**Mock Data Strategy**:
- For Act 1, backend can return static JSON responses
- Structure should match production API contracts
- FE builds for real APIs (easy to swap later)

---

## Definition of Done (FE Tasks)

### Phase 1: Dashboard
- [ ] Dashboard renders correctly
- [ ] Task queue shows Obsidian Black task
- [ ] Customer profile card displays Obsidian Black data
- [ ] Health/opportunity scores visible
- [ ] Demo reset button functional
- [ ] Clicking task launches Workflow 1

### Phase 2: Workflow 1
- [ ] All 5 steps render correctly
- [ ] All 4 artifacts display Obsidian Black data
- [ ] Chat branching works (4 options → Elena response)
- [ ] Account plan generates properly
- [ ] Workflow completes and saves state

### Phase 3: Workflows 2-4
- [ ] Risk workflow detects ticket spike
- [ ] Opportunity workflow shows Elena's initiative
- [ ] Executive engagement workflow generates QBR
- [ ] All workflows function independently

### Phase 4: Integration
- [ ] Workflow chaining works (W1 → W2 → W3 → W4)
- [ ] Dashboard shows completed workflows
- [ ] Villain theming applied consistently
- [ ] Demo reset clears all state
- [ ] Tablet responsive (768px+)
- [ ] Full Act 1 demo runs in < 15 minutes
- [ ] No console errors
- [ ] Justin approves the implementation

---

## Time Estimates Summary

| Phase | Tasks | Estimated Hours |
|-------|-------|----------------|
| Phase 1: Dashboard | 5 tasks | 2-3 hours |
| Phase 2: Workflow 1 | 7 tasks | 4-5 hours |
| Phase 3: Workflows 2-4 | 3 tasks | 6-8 hours |
| Phase 4: Integration | 3 tasks | 2-3 hours |
| **TOTAL** | **18 tasks** | **15-21 hours** |

---

## Questions for PM

1. **Component Library**: Are there existing workflow components I can extend, or build from scratch?
2. **Design System**: Is there a Figma/design file, or should I follow existing UI patterns?
3. **Obsidian Black Logo/Assets**: Do we need villain organization branding, or is this text-only?
4. **Email Drafts**: Should they be editable in workflows, or static preview for demo?
5. **Workflow Exit**: Auto-advance to next workflow or require user click?

---

**Ready to start? Read `FE_START_HERE.md` for onboarding, then begin with Phase 1!**

**Questions? Ask PM before starting.**
