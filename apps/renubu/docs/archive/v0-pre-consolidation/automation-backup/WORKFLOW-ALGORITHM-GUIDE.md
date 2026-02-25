# Workflow Algorithm Configuration Guide

**Version:** 1.0
**Last Updated:** October 2025

## Overview

The Workflow Algorithm automatically assigns and prioritizes workflows for Customer Success Managers (CSMs). It operates in two stages:

1. **Stage 1: Workflow Determination** - Identifies which workflows a customer qualifies for
2. **Stage 2: Workflow Scoring** - Ranks all qualified workflows by priority

This guide shows you how to configure the algorithm's behavior without writing code.

---

## System Architecture

The algorithm consists of 6 modules:

| Module | Purpose | Configuration File |
|--------|---------|-------------------|
| `workflow-types.js` | Data structures and enums | No config |
| `workflow-data-access.js` | Database queries | No config |
| **`workflow-determination.js`** | **Which workflows apply** | **`WORKFLOW_THRESHOLDS`** |
| **`workflow-scoring.js`** | **Priority calculation** | **`SCORING_CONFIG`** |
| `workflow-orchestrator.js` | Ties everything together | Minimal config |

**Configuration is in the first ~50 lines of each file** - easy to find and modify.

---

## Configuration Guide

### Part 1: Workflow Determination (`workflow-determination.js`)

**Location:** Lines 8-20 of `workflow-determination.js`

```javascript
const WORKFLOW_THRESHOLDS = {
  // Strategic workflows trigger for these account plans
  strategic_account_plans: ['invest', 'expand'],

  // Opportunity workflow threshold (future)
  opportunity_score_min: 70,

  // Risk workflow threshold (future)
  risk_score_min: 60
};
```

#### What Each Setting Does

| Setting | Default | What It Controls |
|---------|---------|------------------|
| `strategic_account_plans` | `['invest', 'expand']` | Which account plans get strategic workflows |
| `opportunity_score_min` | `70` | Minimum opportunity score to trigger opportunity workflow |
| `risk_score_min` | `60` | Minimum risk score to trigger risk workflow |

#### Example 1: Add 'manage' accounts to strategic workflows

**Before:**
```javascript
strategic_account_plans: ['invest', 'expand'],
```

**After:**
```javascript
strategic_account_plans: ['invest', 'expand', 'manage'],
```

**Impact:** Customers with `account_plan = 'manage'` will now receive strategic workflows in addition to renewal workflows.

**How to Test:**
```bash
node test-task-3-determination.js
```
Look for: "Customer with 'manage' plan gets strategic workflow ✅"

---

#### Example 2: Change opportunity score threshold

**Before:**
```javascript
opportunity_score_min: 70,
```

**After:**
```javascript
opportunity_score_min: 80,  // More selective - only high opportunities
```

**Impact:** Customers need opportunity_score ≥ 80 (instead of 70) to receive opportunity workflows.

---

### Part 2: Workflow Scoring (`workflow-scoring.js`)

**Location:** Lines 10-80 of `workflow-scoring.js`

```javascript
const SCORING_CONFIG = {
  // ARR-based scoring
  arr_breakpoints: {
    high: 150000,    // $150k+
    medium: 100000   // $100k+
  },
  arr_multipliers: {
    high: 2.0,       // 2x for $150k+
    medium: 1.5,     // 1.5x for $100k-$150k
    low: 1.0         // 1x for < $100k
  },

  // Renewal stage urgency scores
  renewal_stage_urgency: {
    'Overdue': 100,
    'Emergency': 90,
    'Critical': 80,
    'Signature': 70,
    'Finalize': 60,
    'Negotiate': 50,
    'Engage': 40,
    'Prepare': 30,
    'Monitor': 20
  },

  // Account plan multipliers
  account_plan_multipliers: {
    'invest': 1.5,
    'expand': 1.3,
    'manage': 1.0,
    'monitor': 0.8
  },

  // User context factors
  workload_penalty_per_workflow: 2,  // reduce score by 2 points per existing workflow
  experience_multipliers: {
    'expert': 1.2,
    'senior': 1.1,
    'mid': 1.0,
    'junior': 0.9
  }
};
```

---

#### Example 3: Change ARR breakpoints (enterprise focus)

**Business Goal:** Prioritize enterprise accounts more heavily

**Before:**
```javascript
arr_breakpoints: {
  high: 150000,    // $150k+
  medium: 100000   // $100k+
},
arr_multipliers: {
  high: 2.0,       // 2x for $150k+
  medium: 1.5,     // 1.5x for $100k-$150k
  low: 1.0         // 1x for < $100k
},
```

**After:**
```javascript
arr_breakpoints: {
  high: 200000,    // $200k+ (enterprise only)
  medium: 150000   // $150k+
},
arr_multipliers: {
  high: 3.0,       // 3x for $200k+ (much higher priority!)
  medium: 2.0,     // 2x for $150k-$200k
  low: 1.0         // 1x for < $150k
},
```

**Impact:**
- A $250k ARR customer now gets 3x multiplier (was 2x)
- A $175k ARR customer now gets 2x multiplier (was 2x)
- A $125k ARR customer now gets 1x multiplier (was 1.5x)

**Result:** Larger accounts will appear higher in CSM workflow queues.

**How to Test:**
```bash
node test-task-4-scoring.js
```
Look at "Real Database Workflows" section - high ARR customers should rank higher.

---

#### Example 4: Adjust stage urgency scores

**Business Goal:** Make "Emergency" stage even more urgent

**Before:**
```javascript
renewal_stage_urgency: {
  'Overdue': 100,
  'Emergency': 90,
  'Critical': 80,
  // ...
},
```

**After:**
```javascript
renewal_stage_urgency: {
  'Overdue': 100,
  'Emergency': 95,   // Increased from 90
  'Critical': 80,
  // ...
},
```

**Impact:** Emergency renewals (0-6 days) will score higher and appear earlier in CSM queues.

---

#### Example 5: Increase workload balancing

**Business Goal:** Better distribute work across CSMs

**Before:**
```javascript
workload_penalty_per_workflow: 2,  // -2 points per workflow
```

**After:**
```javascript
workload_penalty_per_workflow: 5,  // -5 points per workflow (stronger penalty)
```

**Impact:** A CSM with 10 active workflows will get a -50 point penalty (was -20), making new workflows more likely to go to CSMs with lighter workloads.

**Scenario:**
- CSM A (3 workflows): Priority score = 100 - (3 × 5) = **85**
- CSM B (12 workflows): Priority score = 100 - (12 × 5) = **40**

New workflow goes to CSM A.

---

#### Example 6: Adjust account plan multipliers

**Business Goal:** Strategic accounts need more attention

**Before:**
```javascript
account_plan_multipliers: {
  'invest': 1.5,
  'expand': 1.3,
  'manage': 1.0,
  'monitor': 0.8
},
```

**After:**
```javascript
account_plan_multipliers: {
  'invest': 2.0,   // Increased from 1.5
  'expand': 1.5,   // Increased from 1.3
  'manage': 1.0,
  'monitor': 0.7   // Decreased from 0.8 (even lower priority)
},
```

**Impact:** Strategic workflows for "invest" accounts will score 33% higher, pushing them to the top of queues.

---

## How Scoring Works (The Formula)

### Basic Formula

```
Total Score = ((Base Score + Stage Bonus) × ARR Multiplier × Account Plan Multiplier × Experience Multiplier) + Workload Penalty
```

### Example Calculation

**Customer:** cloudnine.io
**ARR:** $180,000
**Renewal Stage:** Emergency
**Account Plan:** invest
**CSM:** Sarah (senior, 5 workflows)

**Step 1: Base Score**
- Emergency stage urgency = 90 points

**Step 2: Stage Bonus**
- Emergency gets +15 bonus = 15 points

**Step 3: ARR Multiplier**
- $180k > $150k threshold = 2.0x

**Step 4: Account Plan Multiplier**
- invest = 1.5x

**Step 5: Experience Multiplier**
- senior = 1.1x

**Step 6: Workload Penalty**
- 5 workflows × 2 points = -10 points

**Final Calculation:**
```
((90 + 15) × 2.0 × 1.5 × 1.1) + (-10)
= (105 × 2.0 × 1.5 × 1.1) - 10
= 346.5 - 10
= 337 points (rounded)
```

This workflow appears near the top of Sarah's queue.

---

## Testing Your Changes

### Quick Test Suite

Run all validation tests to ensure your changes work:

```bash
# Test workflow determination rules
node test-task-3-determination.js

# Test scoring algorithm
node test-task-4-scoring.js

# Test complete system (when available)
node test-task-5-orchestrator.js
```

### Manual Testing

**Check specific scenarios:**

```javascript
// In Node REPL or test script
const { determineWorkflowsForCustomer } = require('./workflow-determination');
const { calculateWorkflowPriority } = require('./workflow-scoring');

// Test customer
const customer = {
  customer_id: 'test-001',
  domain: 'test.com',
  arr: 175000,
  account_plan: 'invest',
  renewal_id: 'renewal-123',
  renewal_stage: 'Negotiate',
  days_until_renewal: 70
};

// What workflows do they get?
const workflows = determineWorkflowsForCustomer(customer);
console.log('Workflows:', workflows);
// Expected: ['renewal', 'strategic']

// How do they score?
const workflow = createWorkflowInstance({
  id: 'wf-001',
  type: 'renewal',
  customer_id: 'test-001',
  metadata: { renewal_stage: 'Negotiate' }
});

const scoring = calculateWorkflowPriority(workflow, customer);
console.log('Score:', scoring.totalScore);
console.log('Factors:', scoring.factors);
```

---

## Common Scenarios

### Scenario 1: "We want to focus more on renewals than strategic planning"

**Change:**
```javascript
// In workflow-scoring.js
strategic_base_scores: {
  'invest': 50,  // Reduced from 70
  'expand': 40   // Reduced from 60
}
```

**Result:** Renewal workflows will generally score higher than strategic workflows.

---

### Scenario 2: "Junior CSMs shouldn't handle high-value renewals"

**Change:**
```javascript
// In workflow-scoring.js
experience_multipliers: {
  'expert': 1.3,   // Increased
  'senior': 1.2,   // Increased
  'mid': 1.0,
  'junior': 0.7    // Decreased from 0.9
}
```

**Result:** High-value workflows (high ARR × urgency) will score much lower for junior CSMs, routing them to senior team members.

---

### Scenario 3: "Monitor stage renewals are too low priority"

**Change:**
```javascript
// In workflow-scoring.js
renewal_stage_urgency: {
  // ...
  'Monitor': 35   // Increased from 20
}
```

**Result:** Monitor-stage renewals (180+ days out) will score 75% higher, appearing earlier in queues.

---

## Understanding Workflow Types

### The 4 Workflow Types

| Type | Trigger Conditions | Current Implementation |
|------|-------------------|------------------------|
| **Renewal** | `renewal_id` exists OR `renewal_date` is in future | ✅ Fully implemented (9 stage templates) |
| **Strategic** | `account_plan` = 'invest' OR 'expand' | ⚠️ Determination working, templates pending |
| **Opportunity** | `opportunity_score` ≥ 70 | ⚠️ Future - scores not in DB yet |
| **Risk** | `risk_score` ≥ 60 | ⚠️ Future - scores not in DB yet |

### Renewal Workflow Sub-Types (9 Stages)

Each renewal workflow is further categorized by days until renewal:

| Stage | Days Until Renewal | Template | Urgency Score |
|-------|-------------------|----------|---------------|
| Overdue | < 0 | `0-Overdue.ts` | 100 |
| Emergency | 0-6 | `1-Emergency.ts` | 90 |
| Critical | 7-13 | `2-Critical.ts` | 80 |
| Signature | 14-29 | `3-Signature.ts` | 70 |
| Finalize | 30-59 | `4-Finalize.ts` | 60 |
| Negotiate | 60-89 | `5-Negotiate.ts` | 50 |
| Engage | 90-119 | `6-Engage.ts` | 40 |
| Prepare | 120-179 | `7-Prepare.ts` | 30 |
| Monitor | 180+ | `8-Monitor.ts` | 20 |

**To change stage thresholds:** Edit `renewal-helpers.js` `getRenewalStage()` function.

---

## Runtime Configuration (Advanced)

You can modify configuration programmatically:

```javascript
const { updateWorkflowThresholds } = require('./workflow-determination');
const { updateScoringConfig } = require('./workflow-scoring');

// Change determination thresholds
updateWorkflowThresholds({
  strategic_account_plans: ['invest', 'expand', 'manage']
});

// Change scoring config
updateScoringConfig({
  arr_breakpoints: {
    high: 200000,
    medium: 150000
  },
  arr_multipliers: {
    high: 3.0,
    medium: 2.0,
    low: 1.0
  }
});
```

**Use Case:** Load configuration from database or API at startup.

---

## Phase 2: Database-Driven Configuration

**Future Enhancement:** Move all configuration to database tables.

### Proposed Schema

```sql
-- Workflow determination rules
CREATE TABLE workflow_rules (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL,
  condition_field TEXT NOT NULL,
  condition_operator TEXT NOT NULL,
  condition_value TEXT,
  active BOOLEAN DEFAULT 1
);

-- Scoring configuration
CREATE TABLE scoring_config (
  id TEXT PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  config_type TEXT NOT NULL,  -- 'number' | 'object' | 'array'
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Admin UI Mock

**Scoring Configuration Screen:**

```
┌─────────────────────────────────────────┐
│  Workflow Scoring Configuration         │
├─────────────────────────────────────────┤
│                                          │
│  ARR Breakpoints                         │
│  ├─ High Threshold:  [$150,000]  (2.0x) │
│  └─ Medium Threshold: [$100,000] (1.5x) │
│                                          │
│  Renewal Stage Urgency                   │
│  ├─ Overdue:   [100] ████████████ Max   │
│  ├─ Emergency: [90]  █████████▒▒        │
│  ├─ Critical:  [80]  ████████▒▒▒        │
│  ⋮                                       │
│  └─ Monitor:   [20]  ██▒▒▒▒▒▒▒▒▒        │
│                                          │
│  Workload Balancing                      │
│  └─ Penalty per workflow: [2] points    │
│                                          │
│  [Save Changes]  [Reset to Default]     │
└─────────────────────────────────────────┘
```

**Benefits:**
- Change rules without code deployments
- A/B test different configurations
- Multi-tenant (each company has own config)
- Audit trail of configuration changes

---

## Troubleshooting

### "Workflows aren't being assigned"

**Check:** `workflow-determination.js` thresholds

```javascript
// Are your customers meeting the criteria?
const explanation = getWorkflowDeterminationExplanation(customer);
console.log(explanation);
```

---

### "Scoring doesn't make sense"

**Check:** `workflow-scoring.js` config

```javascript
// See detailed score breakdown
const scoring = calculateWorkflowPriority(workflow, customer, userContext);
const explanation = explainWorkflowScore(scoring, workflow, customer);
console.log(explanation);
```

Look for unexpected multipliers or penalties.

---

### "High ARR customers aren't scoring high enough"

**Possible Causes:**
1. ARR breakpoints are too high
2. ARR multipliers are too low
3. Workload penalty is too aggressive
4. Stage urgency is too low

**Solution:** Increase ARR multipliers or lower breakpoints.

---

## Quick Reference Card

### Configuration Files

| File | What It Controls | Line Numbers |
|------|-----------------|--------------|
| `workflow-determination.js` | Which workflows apply | Lines 8-20 |
| `workflow-scoring.js` | Priority calculation | Lines 10-80 |
| `renewal-helpers.js` | Stage thresholds | Lines 7-17 |

### Key Functions

| Function | Purpose |
|----------|---------|
| `determineWorkflowsForCustomer(customer)` | Returns array of workflow types |
| `calculateWorkflowPriority(workflow, customer, userContext)` | Returns `{totalScore, factors}` |
| `explainWorkflowScore(scoring, workflow, customer)` | Returns human-readable explanation |
| `updateWorkflowThresholds(config)` | Modify determination thresholds at runtime |
| `updateScoringConfig(config)` | Modify scoring weights at runtime |

---

## Support

**Questions?** Check the test files for examples:
- `test-task-3-determination.js` - Workflow determination examples
- `test-task-4-scoring.js` - Scoring algorithm examples

**Report Issues:** Create an issue with:
1. Configuration changes you made
2. Expected behavior
3. Actual behavior
4. Test output

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 2025 | Initial release - Tasks 1-4 complete |

---

**End of Guide**
