# Emergency Renewal Workflow - Explained

**File:** `renewal-configs/1-Emergency.ts`

This document explains the Emergency Renewal workflow we just created, so you understand the structure before we build more.

---

## 🎯 The Big Picture

This ONE file defines:
- **Backend logic**: What the AI does, what data it needs, what it produces
- **UI configuration**: What the CSM sees, clicks, and interacts with
- **Integration between them**: How backend outputs feed into UI displays

Think of it as **two sides of the same coin** in one unified schema.

---

## 📋 File Structure (Top to Bottom)

### 1. Metadata (Lines 16-40)
```typescript
{
  id: 'emergency-renewal',      // Unique identifier
  type: 'renewal',               // One of: renewal, strategic, opportunity, risk
  stage: 'Emergency',            // Which renewal stage (0-6 days)
  name: 'Emergency Renewal Protocol',
  description: '0-6 days until renewal - critical intervention required',

  baseScore: 90,                 // For priority algorithm (higher = more urgent)
  urgencyScore: 100,             // Maximum urgency

  trigger: {                     // When does this workflow activate?
    type: 'days_based',
    config: {
      daysMin: 0,
      daysMax: 6                 // 0-6 days until renewal
    }
  }
}
```

**What this means:**
- System checks: "Is customer renewal 0-6 days away?"
- If YES → Assign this Emergency workflow
- Priority score of 90 puts it near top of CSM queue

---

### 2. Steps Array (Lines 46-642)

The workflow has **3 steps**:
1. Assess Emergency Risk
2. Emergency Outreach
3. Track Outcome

Each step has TWO parts:

---

## 🔧 Backend Part (The "Brain")

### Example: Step 1 - Assess Emergency Risk (Lines 59-111)

```typescript
execution: {
  llmPrompt: `
    URGENT RENEWAL RISK ANALYSIS

    Customer: {{customer.name}}
    ARR: ${{customer.arr}}
    Days until renewal: {{workflow.daysUntilRenewal}}
    ...

    TASK: Provide emergency triage assessment:
    1. Immediate risk level (Critical/High/Medium)
    2. Primary blocker to renewal (if any)
    ...
  `,

  dataRequired: [
    'customer.arr',
    'intelligence.riskScore',
    'data.usage.trend',
    ...
  ],

  processor: 'analyzers/emergencyRiskAssessment.js',

  outputs: [
    'emergency_assessment',
    'recommended_action',
    'talking_points',
    'retention_offer'
  ]
}
```

**What happens:**

1. **Your backend** receives a workflow execution request
2. Checks `dataRequired` - Fetches customer ARR, risk score, usage data from database
3. Injects data into `llmPrompt` template: `{{customer.name}}` → "Acme Corp"
4. Calls LLM with filled-in prompt
5. LLM analyzes data, returns structured response
6. Runs `processor` script (`analyzers/emergencyRiskAssessment.js`) to process LLM response
7. Stores results in `outputs`: `emergency_assessment`, `retention_offer`, etc.
8. **Sends outputs to UI** for display

---

## 🎨 UI Part (What CSM Sees)

### Example: Step 1 UI Config (Lines 116-331)

```typescript
ui: {
  chat: {
    initialMessage: {
      text: '🚨 **EMERGENCY RENEWAL ALERT**\n\n{{customer.name}} renewal is in **{{workflow.daysUntilRenewal}} days**.',
      buttons: [
        { label: 'View Risk Analysis', value: 'view_risk', action: 'show_artifact' },
        { label: 'See Recommended Actions', value: 'view_actions' }
      ]
    },

    branches: {
      'view_risk': {
        response: 'Here\'s the emergency risk analysis...',
        actions: ['show_artifact'],
        artifactId: 'risk-analysis'
      }
    }
  },

  artifacts: [
    {
      id: 'risk-analysis',
      title: 'Emergency Risk Analysis - {{customer.name}}',
      type: 'report',
      sections: [...]
    }
  ]
}
```

**What happens:**

1. **UI engine** receives workflow config + customer context
2. Renders **chat panel** with initial message
3. Injects variables: `{{customer.name}}` → "Acme Corp"
4. Shows two buttons: "View Risk Analysis" and "See Recommended Actions"
5. CSM clicks "View Risk Analysis"
6. UI looks up `branches['view_risk']`
7. Shows response message
8. Executes `actions: ['show_artifact']`
9. Shows artifact with `id: 'risk-analysis'` in right panel
10. Artifact displays data from `{{intelligence.riskScore}}`, `{{outputs.emergency_assessment}}`, etc.

---

## 🔗 How Backend & UI Connect

### The Data Flow:

```
BACKEND EXECUTION                          UI DISPLAY
─────────────────────                      ──────────

1. Get customer data:
   - customer.name = "Acme Corp"
   - customer.arr = 500000              →  Chat: "Acme Corp (ARR: $500,000)"
   - workflow.daysUntilRenewal = 3

2. Run LLM analysis:
   - Call Claude with prompt
   - Claude analyzes risk                →  Loading indicator

3. Process LLM response:
   - Parse JSON response
   - Store in outputs:
     {
       emergency_assessment: {
         riskLevel: "Critical",
         primaryBlocker: "No exec engagement"
       },
       retention_offer: {
         discountPercent: 15,
         newARR: 425000
       }
     }                                   →  Artifact: "Risk Level: Critical"
                                         →  Artifact: "15% discount recommended"

4. Return to UI:
   - context.customer (base data)
   - intelligence (AI insights)
   - outputs (step results)             →  UI injects into templates
                                         →  CSM sees personalized workflow
```

---

## 📊 Variable Injection System

Variables use `{{path.to.data}}` syntax:

### Available Variable Scopes:

| Scope | Example | Source |
|-------|---------|--------|
| `customer.*` | `{{customer.name}}` | Customer database record |
| `workflow.*` | `{{workflow.daysUntilRenewal}}` | Workflow instance metadata |
| `intelligence.*` | `{{intelligence.riskScore}}` | AI analysis from Active |
| `data.*` | `{{data.usage.trend}}` | Raw data (Salesforce, usage, etc.) |
| `outputs.*` | `{{outputs.retention_offer.discountPercent}}` | Results from previous steps |
| `user.*` | `{{user.name}}` | Current CSM info |

### Example Workflow:

```
Step 1 completes → Stores outputs.emergency_assessment
                                  outputs.retention_offer

Step 2 starts    → LLM prompt can use {{outputs.emergency_assessment.riskLevel}}
                → UI can display {{outputs.retention_offer.discountPercent}}%

Step 3 starts    → Can reference ALL previous outputs
```

---

## 🎨 Artifact Types

We defined several artifact types in this workflow:

### 1. Report (Lines 174-238)
```typescript
{
  id: 'risk-analysis',
  type: 'report',
  sections: [
    { type: 'alert', severity: 'critical', content: '...' },
    { type: 'metric', content: { label, value, threshold } },
    { type: 'list', style: 'warning', content: [...] },
    { type: 'timeline', content: [...] },
    { type: 'key-value', content: { ... } }
  ]
}
```

**Displays:** Multi-section report with alerts, metrics, lists

### 2. Checklist (Lines 240-281)
```typescript
{
  id: 'action-plan',
  type: 'checklist',
  content: {
    intro: 'Recommended actions...',
    items: [
      { text: 'Schedule call', priority: 'critical', dueIn: '2 hours' }
    ]
  }
}
```

**Displays:** Interactive checklist with priorities and due dates

### 3. Comparison (Lines 283-329)
```typescript
{
  id: 'retention-offers',
  type: 'comparison',
  content: {
    options: [
      { id: 'recommended', highlighted: true, details: {...} },
      { id: 'aggressive', details: {...} }
    ]
  }
}
```

**Displays:** Side-by-side comparison of options

### 4. Email (Lines 434-461)
```typescript
{
  id: 'email-draft',
  type: 'email',
  editable: true,
  content: {
    to: '{{data.salesforce.contacts[0].email}}',
    subject: '{{outputs.outreach_email.subject}}',
    body: '{{outputs.outreach_email.body}}',
    tracking: { trackOpens: true }
  }
}
```

**Displays:** Editable email composer with tracking

### 5. Script (Lines 463-522)
```typescript
{
  id: 'call-script',
  type: 'script',
  content: {
    greeting: '...',
    sections: [...],
    objectionHandlers: [...]
  }
}
```

**Displays:** Structured call script with talking points

---

## 🚀 Actions System

Buttons trigger actions:

### UI Actions:
- `show_artifact` - Show artifact panel
- `edit_artifact` - Make artifact editable
- `complete_step` - Mark step complete, advance

### Backend Actions:
- `send_email` - Trigger email send
- `make_call` - Log call in CRM
- `set_reminder` - Create follow-up reminder
- `log_call` - Record call outcome

**Example:**
```typescript
buttons: [
  {
    label: 'Send Email',
    value: 'send_email',
    action: 'send_email'  // Triggers backend email send
  }
]

branches: {
  'send_email': {
    response: '✅ Email sent!',
    actions: ['send_email', 'set_reminder'],  // Multiple actions
    nextButtons: [...]
  }
}
```

---

## 🔄 Step Flow Example

**CSM Working Emergency Renewal:**

```
STEP 1: Assess Emergency Risk
├─ UI shows: "🚨 EMERGENCY RENEWAL ALERT"
├─ Backend: Running LLM analysis...
├─ UI shows: Two buttons appear
├─ CSM clicks: "View Risk Analysis"
├─ UI shows: Risk report artifact slides in
├─ Artifact displays: Risk score 85/100, red flags, recommendations
├─ CSM clicks: "Schedule Emergency Call"
└─ Step completes → Advance to Step 2

STEP 2: Emergency Outreach
├─ Backend: Generate email draft using LLM
├─ UI shows: "I've drafted personalized content..."
├─ CSM clicks: "Review Email Draft"
├─ UI shows: Editable email with subject/body pre-filled
├─ CSM edits: Updates subject line
├─ CSM clicks: "Send Email"
├─ Backend: Sends email via API, tracks open
├─ UI shows: "✅ Email sent! Tracking opens..."
├─ CSM clicks: "Complete Step"
└─ Step completes → Advance to Step 3

STEP 3: Track Outcome
├─ UI shows: "What's the current status?"
├─ CSM clicks: "🤝 Negotiating"
├─ UI shows: "What's the main sticking point?"
├─ CSM clicks: "Pricing"
├─ Backend: Records outcome, generates summary
├─ UI shows: Final summary artifact
├─ CSM clicks: "Complete Workflow"
└─ Workflow completes → Removed from queue
```

---

## 📝 Key Concepts to Understand

### 1. **Unified Schema**
- ONE file contains both backend logic AND UI config
- No separate backend/frontend files to keep in sync
- Change workflow = edit one file

### 2. **Variable Injection**
- `{{customer.name}}` works in BOTH LLM prompts AND UI displays
- Same data source, consistent everywhere
- Backend outputs become UI variables for next steps

### 3. **Step Dependencies**
- Step 2 can use `{{outputs.emergency_assessment}}` from Step 1
- Each step builds on previous
- Outputs flow forward through workflow

### 4. **Chat Branches**
- One initial message
- Multiple possible paths based on button clicks
- `branches` object defines what happens for each button value

### 5. **Artifacts**
- Start `visible: false`
- Shown via button action `show_artifact`
- Can reference backend outputs for data

### 6. **Actions**
- UI actions (show, hide, edit)
- Backend actions (send, log, create)
- Can trigger multiple actions at once

---

## 🎯 Next Steps

Now that you understand this Emergency workflow, we can:

1. **Build 2 more workflows** (Critical, Prepare) using same pattern
2. **Create backend processors** referenced in `execution.processor`
3. **Build intelligence-processor.js** to generate the `intelligence` and `outputs` data
4. **Connect to UI** - UI engineer uses this config to render workflows

---

## ❓ Questions to Ensure Understanding

Before we proceed, make sure you can answer:

1. **Where does `{{customer.name}}` get its value?**
   - Answer: From customer database record, injected by backend

2. **What happens when CSM clicks a button?**
   - Answer: UI looks up button.value in branches, executes actions, shows response

3. **How does Step 2 know what Step 1 discovered?**
   - Answer: Step 1 stores results in `outputs`, Step 2 references `{{outputs.*}}`

4. **What's the difference between `execution` and `ui` sections?**
   - Answer: `execution` = backend logic (LLM, data), `ui` = CSM interface (chat, artifacts)

5. **Can we add a 4th step without changing backend code?**
   - Answer: YES - just add another step object to the array with execution + ui config

---

Ready to discuss or proceed?
