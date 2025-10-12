# Checkpoint 2: Fix Workflow Triggers & Rebuild Monitor

## ✅ Completed

### 1. Fixed Signature Workflow Trigger

**File:** `renewal-configs/3-Signature.ts`

**Before:**
- Trigger: 14-29 days until renewal

**After:**
- Trigger: **7-30 days until renewal**

```typescript
trigger: {
  type: 'days_based',
  config: {
    daysMin: 7,  // Was: 14
    daysMax: 30  // Was: 29
  }
}
```

**Impact:**
- Now overlaps with Critical workflow (also 7-30 days)
- Overlaps are **expected and handled contextually**:
  - Critical: General renewal execution, risk assessment
  - Signature: Specifically for signature blockers/facilitation
- Both can fire for same customer if context warrants

---

### 2. Rebuilt Monitor Workflow (Recommendation-Driven)

**File:** `renewal-configs/8-Monitor.ts` (313 lines)

#### Added Conditional Workflow Creation

```typescript
trigger: {
  type: 'days_based',
  config: {
    daysMin: 180,
    daysMax: null
  },

  // NEW: Only create workflow if recommendations exist
  conditionalCreation: {
    check: 'recommendations_exist',
    processor: 'recommendation-engine.js',
    minimumRecommendations: 1
  }
}
```

**How it works:**
1. System detects customer is 180+ days from renewal
2. Calls `recommendation-engine.js` to analyze customer
3. LLM generates 0-N recommendations
4. **If 0 recommendations** → Workflow NOT created (no noise to CSM)
5. **If ≥1 recommendation** → Workflow created and queued

**Result:** CSMs only see Monitor workflows when there's something actionable.

#### Step 1: Health Check Review (Enhanced)

**Same core functionality, enhanced outputs:**

```typescript
outputs: [
  'health_status',    // Excellent/Good/Fair/Concerning
  'trending',         // Improving/Stable/Declining
  'early_warnings',   // Array of warning signs
  'patterns'          // NEW: Notable patterns/changes
]
```

**UI Flow:**
```
Initial Message:
📊 ROUTINE HEALTH CHECK
Acme Corp (ARR: $50,000)
Renewal in 245 days
Health: 72/100 | Risk: 28/100

[View Health Report]
  ↓
Shows Health Artifact:
- Overall Health Scorecard
- Early Warning Signs
- Notable Patterns

[View Recommendations] → Step 2
```

#### Step 2: Review Recommendations (NEW)

**Core Innovation:** Dynamic recommendation-driven actions

**LLM Analysis:**
```typescript
execution: {
  llmPrompt: `
    GENERATE MONITOR-STAGE RECOMMENDATIONS

    Valid types for Monitor (180+ days):
    1. FEATURE_ADOPTION
    2. EXECUTIVE_ENGAGEMENT (conversation starters, personal touchpoints)
    3. PRICING_STRATEGY (early value documentation)

    Generate 0-4 recommendations with:
    - Title, description, rationale
    - Data points (evidence with sources)
    - Impact & urgency scores
    - Suggested actions
  `,

  outputs: ['recommendations']
}
```

**Dynamic UI:**
```typescript
ui: {
  chat: {
    initialMessage: {
      text: 'Based on the health check, here are my recommendations:',
      buttons: 'dynamic' // Generated from recommendations
    }
  },

  artifacts: [
    {
      id: 'recommendations',
      type: 'recommendation_list',

      // Each recommendation renders as a card:
      // ┌─────────────────────────────────────────────┐
      // │ 💡 Feature Adoption - Highlight Advanced    │
      // │    Analytics Module                         │
      // ├─────────────────────────────────────────────┤
      // │ Customer paying for Advanced Analytics but  │
      // │ only using basic reports. Opportunity to    │
      // │ demonstrate value.                          │
      // │                                             │
      // │ WHY THIS MATTERS:                           │
      // │ Usage shows 12 hrs/month on manual          │
      // │ reporting; could automate 80% with          │
      // │ Advanced Analytics.                         │
      // │                                             │
      // │ SUPPORTING DATA:                            │
      // │ • Manual Reporting Time: 12 hrs/month       │
      // │   (Time spent creating reports manually)    │
      // │ • Advanced Analytics Adoption: 5%           │
      // │   (Only using basic features)               │
      // │                                             │
      // │ [Send Email] [Schedule Meeting] [Skip]      │
      // │ [Snooze]                                    │
      // └─────────────────────────────────────────────┘
    }
  ]
}
```

**Button Actions:**
- **Send Email** → AI drafts email → CSM reviews → CSM edits → CSM confirms → Send
- **Schedule Meeting** → AI generates agenda → CSM schedules
- **Update CRM** → AI drafts update → CSM approves → Log to Salesforce
- **Get Transcript** → AI identifies meeting → Fetch → Analyze
- **Skip** → Mark skipped, resurface at next workflow if valid
- **Snooze** → Defer 1 week, daily re-evaluation

---

### 3. Recommendation Artifact Design

**New Artifact Type:** `recommendation_list`

**Structure:**
```typescript
{
  id: 'recommendations',
  type: 'recommendation_list',
  icon: '💡',
  visible: true,

  sections: [
    {
      id: 'recommendation-cards',
      type: 'dynamic_recommendations',
      content: '{{outputs.recommendations}}'
    }
  ]
}
```

**Each recommendation card includes:**
1. **Header**: Category icon + Title
2. **Description**: 1-2 sentence summary
3. **Rationale**: "WHY THIS MATTERS" section with context
4. **Data Points**: Bulleted evidence with sources
5. **Action Buttons**: Dynamically generated from `suggestedActions`

**Example Recommendation Object:**
```javascript
{
  id: "rec_123",
  category: "FEATURE_ADOPTION",
  subcategory: "underutilized_feature",
  title: "Highlight Advanced Analytics Module",
  description: "Customer paying for Advanced Analytics but only using basic reports.",
  rationale: "Usage shows 12 hrs/month on manual reporting; could automate 80%",
  dataPoints: [
    {
      label: "Manual Reporting Time",
      value: "12 hrs/month",
      context: "Time spent creating reports manually",
      source: "data.usage.reportingTime"
    },
    {
      label: "Advanced Analytics Adoption",
      value: "5%",
      context: "Only using basic features",
      source: "data.usage.featureAdoption.advancedAnalytics"
    }
  ],
  priorityScore: 80,
  impact: "high",
  urgency: "medium",
  suggestedActions: ["send_email", "schedule_meeting", "skip", "snooze"]
}
```

---

### 4. Dynamic Artifacts Creation

When CSM clicks an action button, additional artifacts are created:

**"Send Email" clicked:**
```javascript
// System creates email draft artifact:
{
  id: 'email-draft',
  type: 'email',
  editable: true,
  content: {
    to: 'john@acmecorp.com',
    subject: 'Advanced Analytics: Automate Your Reporting',
    body: `Hi John,\n\nI noticed your team is spending significant time...`
  },
  state: 'ready_for_review'
}
```

**"Update CRM" clicked:**
```javascript
// System creates CRM update draft:
{
  id: 'crm-update-draft',
  type: 'crm_update',
  editable: true,
  content: {
    updateType: 'activity',
    subject: 'Feature adoption opportunity identified',
    body: 'Customer underutilizing Advanced Analytics (5% adoption)...',
    opportunity_field_updates: {
      'Next_Steps__c': 'Demo Advanced Analytics to reduce manual reporting'
    }
  },
  state: 'ready_for_review'
}
```

**"Get Transcript" clicked:**
```javascript
// System creates transcript request:
{
  id: 'transcript-request',
  type: 'transcript_request',
  content: {
    meeting: {
      title: 'Q4 QBR with Acme Corp',
      date: '2024-12-15',
      participants: ['John Smith', 'Sarah CSM'],
      source: 'gong'
    },
    status: 'fetching'
  }
}

// After fetching, creates analysis artifact:
{
  id: 'transcript-analysis',
  type: 'report',
  content: {
    keyPoints: [...],
    actionItems: [...],
    sentiment: 'positive',
    renewalSignals: [...]
  }
}
```

---

### 5. Monitor-Specific Valid Recommendations

**Monitor workflow (180+ days) can recommend:**

#### Feature Adoption
- `new_feature_announcement` - Announce new features
- `underutilized_feature` - Highlight unused paid features
- `advanced_capability_intro` - Introduce advanced capabilities

#### Executive Engagement
- `conversation_starters` - Talking points for next call
- `industry_insights` - Share industry trends/benchmarks
- `success_story_sharing` - Share relevant case studies
- `personal_touchpoint` - Send card, congratulations
- `product_roadmap_preview` - Preview upcoming features

#### Pricing Strategy
- `usage_increase_justification` - Document usage increases for future pricing discussions
- `value_realization_documentation` - Document ROI/value delivered

**NOT valid for Monitor:**
- ❌ Urgent renewal tactics (that's Emergency/Critical)
- ❌ Risk mitigation (that's At-Risk workflow)
- ❌ Negotiation strategies (that's Negotiate workflow)
- ❌ Contract/signature logistics (that's Signature/Finalize workflows)

---

## Architecture Patterns Established

### 1. Two-Step Workflow Pattern

All recommendation-driven workflows follow this pattern:

```
Step 1: Context Gathering
- Run analysis (health check, stakeholder mapping, etc.)
- Generate outputs for Step 2

Step 2: Review Recommendations
- LLM analyzes Step 1 outputs + customer data
- Generates 0-N recommendations
- Dynamic UI based on recommendations
- Each recommendation has action buttons
```

### 2. Conditional Workflow Creation

```javascript
// Pre-flight check before creating workflow:
const { shouldCreate, recommendations } = await shouldCreateWorkflow({
  customerId,
  workflowId: 'monitor',
  customerContext,
  historicalActions
});

if (shouldCreate) {
  createWorkflowInstance({
    ...workflowConfig,
    initialData: { recommendations } // Pre-populated
  });
}
```

### 3. Dynamic Button Generation

```javascript
// Instead of hardcoded buttons:
buttons: [
  { label: 'Send Email', value: 'send_email' },
  { label: 'Skip', value: 'skip' }
]

// Use dynamic generation:
buttons: 'dynamic'

// System generates buttons from recommendation.suggestedActions:
recommendation.suggestedActions.map(actionId => {
  const action = ActionTypeRegistry[actionId];
  return {
    label: action.label,
    icon: action.icon,
    value: actionId,
    action: action.automation
  };
});
```

### 4. Data-Driven Recommendations

Every recommendation must include:
1. **Data points** (evidence)
2. **Source references** (where data came from)
3. **Rationale** (why it matters)
4. **Priority score** (impact + urgency)

No generic recommendations allowed.

---

## Testing Scenarios

### Scenario 1: Healthy Customer, No Issues
- Customer: 245 days from renewal, health score 85/100
- LLM Analysis: No significant issues, good engagement
- **Result:** 0 recommendations → Workflow NOT created
- CSM sees nothing (no noise)

### Scenario 2: Feature Adoption Opportunity
- Customer: 210 days from renewal, health score 75/100
- Data: Paying for Advanced Analytics, only 5% adoption
- **Result:** 1 recommendation generated
  - Title: "Highlight Advanced Analytics Module"
  - Actions: [Send Email, Schedule Meeting, Skip, Snooze]
- Workflow created and queued

### Scenario 3: Personal Touchpoint
- Customer: 190 days from renewal, health score 80/100
- Data: CEO recently promoted (from LinkedIn)
- **Result:** 1 recommendation generated
  - Title: "Congratulate CEO on Promotion"
  - Actions: [Send Email, Skip, Snooze]
- Workflow created (low priority, but actionable)

### Scenario 4: Multiple Recommendations
- Customer: 220 days from renewal, health score 70/100
- Data: Low feature adoption + usage increasing 40%
- **Result:** 2 recommendations generated
  1. Feature adoption opportunity (high priority)
  2. Document usage increase for pricing (medium priority)
- Workflow created with both recommendations shown

---

## Next Steps (Checkpoint 3)

Now that Monitor is rebuilt, next checkpoint will build:
1. Task tracking system (AI tasks vs. CSM tasks)
2. Snooze evaluation logic (daily re-evaluation)
3. Skip behavior (resurface at next workflow)
4. Cross-workflow task continuity
5. Workflow completion states (completed vs. completed_with_snooze)

---

## Review Questions

1. **Recommendation card UI** - Is the layout/format appropriate for CSM workflows?

2. **Dynamic button generation** - Should we limit number of action buttons per recommendation (max 4-5)?

3. **Monitor frequency** - If no recommendations at 180 days, when does system check again? 30 days later? 60 days?

4. **Recommendation threshold** - Currently filtering out priorityScore < 30. Is 30 the right threshold?

5. **LLM prompt length** - Step 2 prompt is detailed. Too long for token limits? Should we compress?

6. **Artifact visibility** - Recommendations artifact is `visible: true` by default. Should CSM have to click to see them?
