# Strategic Account Planning Workflow

**Implementation of INVEST Strategy Workflow**
**Type:** Strategic Workflow (database-driven)
**Status:** ✅ Complete
**Last Updated:** October 2025

---

## Overview

The Strategic Account Planning workflow is a 6-step AI-assisted process that guides CSMs through creating comprehensive account plans. This is the first production implementation of the "strategic" workflow type referenced in the automation system roadmap.

### Key Innovation: "Good Doctor" Pattern

Unlike traditional task lists that feel like homework, this workflow uses an **AI-first approach**:
- **"I'll Handle" Section**: AI automatically performs tasks (send emails, update CRM, set reminders)
- **"You'll Need To" Section**: Minimal user actions (2-3 tasks only)

This reduces cognitive load and emphasizes automation, creating a calm, supportive experience.

---

## Workflow Architecture

### 6-Step Flow

```
1. Greeting        → Planning Checklist
2. Assessment      → 3-question form (opportunity, risk, year overview)
3. Overview        → Contract/Contacts/Pricing tabs with intelligence
4. Recommendation  → Strategy recommendation (INVEST/EXPAND/PROTECT)
5. Strategic Plan  → 9-step timeline with actions
6. Next Actions    → Split into AI tasks + User tasks
```

### Split-Screen Layout

```
┌────────────────────────────────────────────────────────┐
│  Left Panel: Chat Context        │  Right Panel: Artifact │
│                                   │                        │
│  AI Messages                      │  Interactive Forms     │
│  User Input                       │  Data Displays         │
│  Global Chat Input                │  Action Buttons        │
└────────────────────────────────────────────────────────┘
```

- **Left (40-70% width)**: Conversational context, guidance
- **Right (30-60% width)**: Structured artifacts, forms, data
- **Resizable**: User can adjust split

---

## Step-by-Step Breakdown

### Step 1: Greeting
**Purpose:** Set context and give user choice to proceed

**Artifact:** `PlanningChecklistArtifact.tsx`
- Shows 5 items to prepare for planning session
- Non-interactive (visual preview only)

**Chat Context:**
```
"It's time to do the annual planning for {customerName}.
Review the checklist to the right, and let me know if
you're ready to get started."
```

**Actions:**
- Start Planning (primary)
- Snooze (7 days)
- Skip

---

### Step 2: Assessment
**Purpose:** Gather CSM's qualitative insights

**Artifact:** `AccountAssessmentArtifact.tsx`
- Opportunity Score (1-10 slider)
- Risk Score (0-10 slider)
- Year Overview (free text)
- Each has "Why?" text field
- Microphone icon for voice input (future)

**Chat Context:**
```
"Great! Let's start with a quick assessment. I need to
understand the current state of this account to create
the best strategic plan."
```

**Data Flow:**
```javascript
handleAssessmentSubmit(answers) {
  setAssessmentAnswers(answers);
  const strategy = determineStrategy(answers);
  setStrategyType(strategy); // 'expand' | 'invest' | 'protect'
  setCurrentStep('overview');
}
```

**Strategy Determination:**
- **PROTECT**: riskScore >= 7 (high risk takes priority)
- **EXPAND**: opportunityScore >= 7 AND riskScore < 7
- **INVEST**: Everything else (strategic partnership)

---

### Step 3: Overview
**Purpose:** Review customer intelligence data

**Artifact:** `AccountOverviewArtifact.tsx`
- **3 Tabs:** Contract, Contacts, Pricing

**Contract Tab:**
- Basic info (dates, terms, auto-renew)
- **Business Impact** section:
  - Auto-renew language
  - Pricing caps
  - Non-standard terms
  - Unsigned amendments
  - Risk level indicator

**Contacts Tab:**
- Organized by **persona type**:
  - Executive (decision authority)
  - Champion (internal advocate)
  - Business (day-to-day users)
- Confirmation UI (✓ or ? for each contact)

**Pricing Tab:**
- Current vs last year ARR
- Seats, price per seat, add-ons
- **Value Metrics:**
  - Market percentile (where they stand)
  - Usage score (product adoption)
  - Adoption rate
- **Pricing Opportunity** indicator (high/medium/low/none)

**Data Source:**
```javascript
// From workflow system database
const intelligence = await supabase.rpc('get_latest_intelligence', { customer_id });
const financials = await supabase.rpc('get_latest_financials', { customer_id });
const usage = await supabase.rpc('get_latest_usage', { customer_id });
```

---

### Step 4: Recommendation
**Purpose:** Present AI recommendation with confidence score

**Artifact:** `RecommendationSlide.tsx`
- Strategy title (e.g., "Strategic Account Plan - INVEST Strategy")
- Confidence score (92%)
- 4-5 key factors (icons + text)
- Highlighted primary factor

**Dynamic Content:**
Reasons are **generated based on assessment**:

```javascript
// For PROTECT strategy
reasons: [
  { icon: 'alert', text: 'High risk score (8/10) - immediate action required', highlight: true },
  { icon: 'alert', text: 'Account retention is top priority' },
  { icon: 'check', text: 'Executive engagement needed to rebuild trust' },
  { icon: 'target', text: 'Rapid intervention can prevent churn' }
]

// For INVEST strategy
reasons: [
  { icon: 'target', text: 'Balanced profile indicates strategic partnership potential', highlight: true },
  { icon: 'check', text: 'Account is stable - ideal for deepening relationship' },
  { icon: 'trending', text: 'Co-innovation opportunities can drive mutual growth' },
  { icon: 'target', text: 'Multi-year partnership framework recommended' }
]
```

---

### Step 5: Strategic Plan
**Purpose:** Present 9-step execution timeline

**Artifact:** `StrategicAccountPlanArtifact.tsx`

**Structure:**
- **Header:** Strategy badge + customer name (compact)
- **Summary:** Renewal date, ARR, Health score (single line)
- **9 Steps:** Expandable cards with:
  - Day marker (Day 30, Day 60, etc.)
  - Title + description
  - Action items (checkboxes)

**Strategy-Specific Timelines:**

**INVEST Strategy** (300-day timeline):
- Day 30: Strategic Alignment Session
- Day 60: Innovation Roadmap Review
- Day 75: Success Metrics Framework
- Day 90: QBR #1
- Day 120: Executive Sponsorship Program
- Day 150: Strategic Initiative Workshop
- Day 180: QBR #2 with Future Planning
- Day 240: Co-Innovation Pilot
- Day 300: Partnership Maturity Assessment

**EXPAND Strategy** (180-day timeline):
- Day 30: Discovery & Opportunity Mapping
- Day 45: Value Alignment Workshop
- Day 60: Proposal Development
- Day 75: Executive Presentation
- Day 90: Negotiation & Refinement
- Day 105: Contract Execution
- Day 120: Implementation Launch
- Day 150: Mid-Implementation Check
- Day 180: Expansion Value Realization

**PROTECT Strategy** (150-day timeline):
- Day 15: Critical Situation Assessment
- Day 20: Executive Escalation & Commitment
- Day 30: Quick Wins & Issue Resolution
- Day 45: Comprehensive Action Plan
- Day 60: Relationship Rebuilding
- Day 75: Mid-Recovery Check
- Day 90: Stability & Satisfaction Validation
- Day 120: Value Reinforcement
- Day 150: Renewal Positioning

---

### Step 6: Next Actions
**Purpose:** Split responsibilities between AI and user

**Artifact:** `PlanSummaryArtifact.tsx`

**4 Sections:**

**1. Tasks Initiated** (what was completed):
- Strategic plan created
- Account data gathered
- Stakeholders confirmed
- CRM updated

**2. Key Accomplishments** (wins):
- Strategy identified
- Executive sponsors confirmed
- Contract terms reviewed
- Pricing opportunity established
- Comprehensive plan created

**3. I'll Handle** (AI tasks):
```typescript
[
  {
    title: 'Send strategic plan summary email to Marcus',
    description: 'Automated email with plan overview and key milestones',
    dueDate: 'Tomorrow',
    type: 'ai'
  },
  {
    title: 'Update CRM with strategic plan details',
    description: 'All plan data synced to Salesforce automatically',
    dueDate: 'Today',
    type: 'ai'
  },
  {
    title: 'Check back in 3 days',
    description: "I'll send you a reminder to follow up on progress",
    dueDate: 'Mar 20',
    type: 'ai'
  }
]
```

**4. You'll Need To** (User tasks - minimal):
```typescript
[
  {
    title: 'Schedule stakeholder meeting with Marcus',
    description: '30-min call to present strategic plan',
    dueDate: 'Mar 20, 2025',
    type: 'user'
  },
  {
    title: 'Review account plan before call',
    description: 'Refresh on key points and priorities',
    dueDate: 'Before meeting',
    type: 'user'
  }
]
```

**UI Treatment:**
- AI tasks: Blue-tinted background, checkmark icons (reassuring)
- User tasks: Gray background, empty checkboxes (actionable)

**System Status:**
- CRM: Synced ✓
- Reminders: Active ✓
- Next Follow-up: April 15, 2025

---

## Technical Implementation

### File Structure

```
src/components/
├── artifacts/
│   ├── PlanningChecklistArtifact.tsx      # Step 1
│   ├── AccountAssessmentArtifact.tsx      # Step 2
│   ├── AccountOverviewArtifact.tsx        # Step 3
│   ├── RecommendationSlide.tsx            # Step 4
│   ├── StrategicAccountPlanArtifact.tsx   # Step 5
│   └── PlanSummaryArtifact.tsx            # Step 6
│
└── workflows/
    └── TaskModeFullscreen.tsx              # Orchestrator
```

### State Management

```typescript
// Core state
const [currentStep, setCurrentStep] = useState<'greeting' | 'assessment' | ...>('greeting');
const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set(['greeting']));
const [assessmentAnswers, setAssessmentAnswers] = useState(null);
const [strategyType, setStrategyType] = useState<'expand' | 'invest' | 'protect'>('expand');

// Caching (prevent regeneration)
const [planSummaryCache, setPlanSummaryCache] = useState(null);

// UI state
const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50); // percentage
const [metricsExpanded, setMetricsExpanded] = useState(false);
```

### Navigation Logic

**Completed Steps Tracking:**
- Allows clicking on any completed step to navigate back
- Current step is always marked active
- Forward navigation only after completing current step

**Pending Actions:**
```typescript
// Temporary actions (skip/snooze) don't persist until modal exit
const [pendingAction, setPendingAction] = useState<'skip' | 'snooze' | null>(null);

handleClose() {
  if (pendingAction === 'snooze') {
    // Persist snooze to backend
  }
  onClose();
}
```

### Scrolling Pattern

**All artifacts follow this pattern:**
```tsx
<div className="bg-white h-full flex flex-col">
  {/* Fixed Header */}
  <div className="px-8 py-4 border-b">...</div>

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto px-8 py-6">
    {/* Content here */}
  </div>

  {/* Fixed Footer */}
  <div className="px-8 py-4 border-t flex-shrink-0">...</div>
</div>
```

**Key classes:**
- `h-full flex flex-col` - Take full height, column layout
- `flex-1 overflow-y-auto` - Expand to fill space, scroll vertically
- `flex-shrink-0` - Prevent shrinking (for footers)

---

## Integration Points

### With Workflow System

**Trigger Condition:**
```sql
-- In workflow_rules table
{
  workflow_type: 'strategic',
  rule_type: 'account_plan',
  field_name: 'account_plan',
  operator: 'in',
  value: '["invest", "expand"]',
  active: true
}
```

**Priority Scoring:**
```javascript
// Base score for strategic workflows
const BASE_SCORE = 70;

// Applied multipliers
const score = (BASE_SCORE × ARR_MULTIPLIER × ACCOUNT_PLAN_MULTIPLIER × EXPERIENCE_MULTIPLIER) + WORKLOAD_PENALTY;

// Example: invest plan, $180K ARR, senior CSM, 5 workflows
const finalScore = (70 × 2.0 × 1.5 × 1.1) - 10 = 221 points
```

### With Database

**Customer Intelligence:**
```javascript
// Fetched via RPC functions
const data = {
  intelligence: { risk_score, opportunity_score, health_score },
  financials: { current_arr, growth_rate },
  usage: { active_users, utilization_rate },
  engagement: { nps_score, qbr_count },
  stakeholders: [{ name, role, decision_authority }]
};
```

**Workflow Execution:**
```javascript
// Created in workflow_executions table
{
  id: 'wf-xxx',
  workflow_type: 'strategic',
  workflow_subtype: 'invest',
  customer_id: 'cust-xxx',
  assigned_to: 'csm-xxx',
  priority_score: 221,
  status: 'in_progress',
  started_at: '2025-03-15T10:00:00Z'
}
```

**Artifacts Saved:**
```javascript
// Stored in workflow_task_artifacts table
{
  artifact_type: 'strategic_account_plan',
  artifact_content: {
    strategy: 'invest',
    timeline: [...9 steps],
    assessment: { opportunityScore: 8, riskScore: 3 },
    nextActions: { ai: [...], user: [...] }
  },
  created_at: '2025-03-15T10:30:00Z'
}
```

---

## Design Patterns

### Spa Aesthetic
See **SPA-AESTHETIC-DESIGN-GUIDE.md** for complete guidelines.

**Quick Summary:**
- Minimal headers (text-base, py-4 instead of py-6)
- Cool grays (gray-400, gray-500) instead of bold colors
- Subtle icons (w-4 h-4, gray-400)
- No gradients, no emojis (unless customer-facing)
- Maximum information density

### "Good Doctor" Pattern

**Principle:** Like a good doctor telling you the plan

**Bad (overwhelming homework):**
```
Next Steps:
☐ Send renewal notice to customer
☐ Schedule stakeholder meeting
☐ Legal review of contract terms
☐ Update CRM with pricing details
☐ Prepare ROI deck
☐ Book executive session
☐ Submit for approval
☐ Follow up in 3 days
☐ Update roadmap
☐ Brief internal team
```

**Good (AI handles most, minimal user effort):**
```
I'll Handle:
✓ Send strategic plan summary (Tomorrow)
✓ Update CRM automatically (Today)
✓ Check back in 3 days (Reminder set)

You'll Need To:
☐ Schedule meeting with Marcus (Mar 20)
☐ Review plan before call (Before meeting)
```

**Result:** User feels supported, not overwhelmed

---

## Future Enhancements

### Phase 2: Real-time AI Actions
- Actually send emails via AI
- Actually update CRM fields
- Actually schedule reminders
- Show live status ("Email sent ✓")

### Phase 3: Multi-Strategy Support
- **EXPAND Strategy** (9 steps for growth)
- **PROTECT Strategy** (9 steps for retention)
- Dynamic timeline based on urgency

### Phase 4: Customization
- Allow CSMs to modify timelines
- Add custom steps
- Adjust AI vs user task split
- Save as template for similar customers

### Phase 5: Outcome Tracking
- Track completion rates per strategy
- Measure success (renewals, expansions)
- Optimize timelines based on data
- A/B test different approaches

---

## Testing Guidance

### Manual Testing

**Happy Path:**
1. Launch workflow for customer with `account_plan = 'invest'`
2. Complete assessment (opportunity: 7, risk: 3)
3. Verify INVEST strategy recommended
4. Review 9-step timeline (Day 30 → Day 300)
5. Check AI vs User task split (3 AI, 2 User)
6. Confirm CRM status shows "Synced"

**Edge Cases:**
- High risk (8+) → Should recommend PROTECT
- High opportunity + low risk → Should recommend EXPAND
- Null values in intelligence data → Should show defaults
- Customer with no stakeholders → Should handle gracefully

### Integration Testing

```javascript
// Test workflow creation
const workflow = await createWorkflow({
  customer_id: 'test-customer',
  workflow_type: 'strategic',
  strategy: 'invest'
});

expect(workflow.priority_score).toBeGreaterThan(0);
expect(workflow.status).toBe('pending');

// Test step completion
await completeStep(workflow.id, 'assessment');
expect(workflow.completed_steps).toContain('assessment');

// Test artifact generation
const artifact = await getArtifact(workflow.id, 'strategic_plan');
expect(artifact.content.timeline).toHaveLength(9);
```

---

## Troubleshooting

### Artifacts Not Scrolling
**Symptom:** Content cut off at bottom
**Cause:** Parent container using `flex` instead of `flex flex-col`
**Fix:** Ensure artifacts panel has `flex flex-col overflow-hidden`

### Assessment Not Advancing
**Symptom:** Clicking Continue does nothing
**Cause:** Form validation preventing submit
**Fix:** Check all required fields have values, remove strict validation

### Wrong Strategy Recommended
**Symptom:** Expected PROTECT but got INVEST
**Cause:** Risk score threshold not met (needs >= 7)
**Fix:** Verify assessment answers, check determination logic

### AI Tasks Not Showing
**Symptom:** Only user tasks visible
**Cause:** Filter logic excluding `type: 'ai'`
**Fix:** Check `nextSteps.filter(step => step.type === 'ai')`

---

## References

- **Workflow Algorithm:** See `WORKFLOW-ALGORITHM-GUIDE.md`
- **Database Schema:** See `DATABASE_WORKFLOW_SYSTEM.md`
- **API Integration:** See `CHAT_API_GUIDE.md`
- **Spa Aesthetic:** See `SPA-AESTHETIC-DESIGN-GUIDE.md` (companion doc)

---

**Questions? Contact the product team.**

**Status:** ✅ Production-ready, actively used for INVEST strategy workflows
