# Checkpoint 1: Core Recommendation Architecture

## ✅ Completed

### Files Created

**1. recommendation-types.ts** (327 lines)
- Comprehensive recommendation taxonomy with 4 main categories:
  - `FEATURE_ADOPTION` (3 subcategories)
  - `EXECUTIVE_ENGAGEMENT` (8 subcategories including conversation starters, relationship building)
  - `PRICING_STRATEGY` (3 subcategories)
  - `PROCEDURAL` (3 subcategories)

- Each recommendation type defines:
  - Valid workflows that can generate it
  - Supported actions (send_email, schedule_meeting, etc.)
  - Required data fields
  - Description

- `Recommendation` interface with:
  - Classification (category, subcategory)
  - Content (title, description, rationale)
  - Data points array (evidence with sources)
  - Priority score (calculated from impact + urgency)
  - Suggested actions
  - Status tracking

**2. action-types.ts** (353 lines)
- Defines 6 action types:
  - `send_email` - **Draft → Review → Edit → Confirm → Send** flow
  - `schedule_meeting` - Calendar integration with agenda
  - `review_data` - Show additional analysis (no automation)
  - `create_workflow` - Spawn new workflow
  - `skip` - Dismiss recommendation (resurfaces in 30 days)
  - `snooze` - Defer 1-7 days with daily re-evaluation

- `EmailDraftFlow` state machine:
  - generating → ready_for_review → editing → ready_to_send → sent
  - Never auto-send (requires CSM confirmation)
  - Edit history tracking

- `Task` interface:
  - Type: AI_TASK vs. CSM_TASK
  - Owner: AI or CSM
  - Status: pending, in_progress, completed, snoozed, skipped
  - Email draft flow (if applicable)

**3. workflow-types.js** (updated)
- Added new enums:
  - `TaskStatus` (pending, in_progress, completed, snoozed, skipped)
  - `TaskOwner` (AI, CSM)
  - `RecommendationStatus` (pending, actioned, skipped, snoozed)
  - `WorkflowStatus.COMPLETED_WITH_SNOOZE` (steps done, tasks snoozed)

**4. recommendation-engine.js** (253 lines)
- Core LLM-based recommendation generation system
- `generateRecommendations()` - Main entry point
  - Takes customer context + workflow stage
  - Calls LLM with structured prompt
  - Returns 0-N prioritized recommendations
  - Filters out low-priority (< 30 score)

- `shouldCreateWorkflow()` - Pre-flight check
  - Determines if workflow should be created
  - **Only creates if recommendations exist**
  - Returns recommendations for workflow initialization

- Priority score calculation:
  - Impact: low (20), medium (50), high (80)
  - Urgency: low (10), medium (30), high (50)
  - Combined score = impact + urgency (max 100)

- LLM prompt structure:
  - Customer context (ARR, health, usage, engagement)
  - Valid recommendation types for workflow stage
  - Historical actions (avoid redundancy)
  - Structured JSON output format

---

## Key Architecture Decisions

### 1. Conditional Workflow Creation
Workflows are **only created when actionable recommendations exist**. This eliminates noise and ensures CSMs only see workflows with value.

```javascript
const { shouldCreate, recommendations } = await shouldCreateWorkflow({
  customerId, workflowId, customerContext, historicalActions
});

if (shouldCreate) {
  // Create workflow instance with recommendations
}
```

### 2. Recommendation-Driven Actions
All actions are dynamically generated from recommendation types. Each recommendation specifies which actions make sense in context.

**Monitor workflow recommendations might suggest:**
- Send email about new feature
- Schedule meeting to demo capability
- Review usage data
- Snooze until next month

**Emergency workflow recommendations might suggest:**
- Send urgent email
- Schedule call today
- Escalate to leadership
- No "snooze" option (too urgent)

### 3. Email Draft-First Flow
**Critical user requirement:** AI never auto-sends emails.

```
AI drafts → CSM reviews → CSM edits (optional) → CSM confirms → System sends
```

All email actions go through this flow. State is tracked in `EmailDraftFlow`.

### 4. Task Ownership (AI vs. CSM)
- **AI tasks**: AI does the work (draft email, generate report), CSM approves
- **CSM tasks**: CSM owns the action (schedule meeting, make call)

This distinction drives UI presentation and task routing.

### 5. Snooze with Daily Re-evaluation
When CSM snoozes a task:
1. Task marked `status: 'snoozed'` with `snoozedUntil: Date`
2. Daily orchestrator checks: "Should this resurface today?"
3. Evaluation considers:
   - Snooze date reached?
   - Are there higher-priority tasks today?
   - Context changed (customer health dropped)?
4. Decision: Resurface or snooze another day

---

## Recommendation Taxonomy Highlights

### Monitor Workflow (180+ days)
Valid recommendations:
- ✅ Feature adoption (new features, underutilized capabilities)
- ✅ Conversation starters
- ✅ Personal touchpoints (send card, congrats)
- ✅ Early pricing justification prep
- ❌ Risk mitigation (that's At-Risk workflow)
- ❌ Urgent tactics (that's Emergency workflow)

### Prepare Workflow (120-179 days)
Valid recommendations:
- ✅ Value documentation & ROI calculation
- ✅ Success story gathering
- ✅ QBR preparation
- ✅ Stakeholder mapping updates
- ✅ Expansion opportunity prep

### Negotiate Workflow (60-89 days)
Valid recommendations:
- ✅ Pricing strategies
- ✅ Objection responses
- ✅ Concession frameworks
- ✅ Upsell opportunities
- ✅ Product roadmap preview

### Emergency Workflow (0-6 days)
Valid recommendations:
- ✅ Emergency retention offers
- ✅ Executive escalation scripts
- ✅ Same-day action plans
- ❌ No long-term strategic recommendations
- ❌ No snooze option (too urgent)

---

## Data Structures

### Recommendation
```typescript
{
  id: "rec_123",
  workflowId: "monitor",
  customerId: "cust_456",
  category: "FEATURE_ADOPTION",
  subcategory: "underutilized_feature",
  title: "Highlight Advanced Analytics Module",
  description: "Customer paying for Advanced Analytics but only using basic reports",
  rationale: "Usage shows 12 hrs/month on manual reporting; could save 80%",
  dataPoints: [
    {
      label: "Manual Reporting Time",
      value: "12 hrs/month",
      context: "Time spent creating reports manually",
      source: "data.usage.reportingTime"
    }
  ],
  priorityScore: 80,
  impact: "high",
  urgency: "medium",
  suggestedActions: ["send_email", "schedule_meeting", "skip", "snooze"],
  status: "pending"
}
```

### Task
```typescript
{
  id: "task_789",
  workflowId: "monitor",
  recommendationId: "rec_123",
  customerId: "cust_456",
  type: "AI_TASK",
  owner: "AI",
  action: "send_email",
  description: "Draft email highlighting Advanced Analytics ROI",
  status: "pending",
  emailDraftFlow: {
    state: "generating",
    draftContent: { ... }
  }
}
```

---

## Next Steps (Checkpoint 2)

1. Fix workflow trigger overlaps:
   - Signature: 7-30 days (currently 14-29)

2. Rebuild Monitor workflow with:
   - Step 1: Health Check (context gathering)
   - Step 2: Review Recommendations (LLM-generated)
   - Dynamic button generation from recommendations
   - Recommendation artifact UI design

3. Test conditional workflow creation logic

---

## Review Questions

1. **Recommendation taxonomy**: Are we missing any important categories for Monitor-stage workflows?

2. **Priority scoring**: Is simple additive (impact + urgency) sufficient, or should we use multiplicative?

3. **Action types**: Are there other action types we need beyond the 6 defined?

4. **Snooze durations**: 1-7 days seems right for renewal workflows. Agree?

5. **Skip resurface timing**: 30 days for skipped recommendations - too long/short?

6. **Email sendable types**: Currently `email` and `quote`. What about `report`, `contract`, `proposal`?
