# Workflow Automation System - Project Summary

**Quick Reference:** What we've built, where we're going, and how it all fits together

---

## 🎯 The Big Picture

### The Problem We're Solving

CSMs currently have to:
1. Manually identify which customers need attention
2. Guess which workflow template to use
3. Prioritize work based on intuition
4. Context-switch constantly between customers

**Result:** Missed renewals, inconsistent customer experience, CSM burnout

### Our Solution

An **intelligent workflow automation system** that:
1. ✅ Analyzes all customers automatically
2. ✅ Determines which workflows each customer needs (renewal/strategic/opportunity/risk)
3. ✅ Calculates priority scores using data (ARR, urgency, account plan, CSM workload)
4. ✅ Generates sorted daily queues per CSM
5. ⚠️ (Future) Executes workflows with pre-populated customer data
6. ⚠️ (Future) Tracks completion and outcomes

**Result:** CSMs open dashboard → see top 10 highest-priority workflows → work top-to-bottom → maximize impact

---

## ✅ What's Already Built (Phase 1)

### Core Algorithm (The "Brain")

**6 Modules - All Working:**

1. **workflow-types.js** (10KB)
   - Type definitions for all data structures
   - Factory functions: `createWorkflowInstance()`, `createWorkflowAssignment()`, `createUserContext()`
   - 4 workflow types: renewal, strategic, opportunity, risk
   - Status: ✅ Complete, 36 tests passing

2. **workflow-data-access.js** (8KB)
   - Database query layer with 6 optimized functions
   - `getCustomerData()`, `getUserCustomers()`, `getActiveRenewals()`, `getCustomersNeedingWorkflows()`
   - Works with SQLite (`renubu-test.db`)
   - Status: ✅ Complete, 24 tests passing

3. **workflow-determination.js** (6KB)
   - Business rules: which workflows apply to which customers?
   - Renewal: customers with active renewal
   - Strategic: invest/expand account plans
   - Opportunity/Risk: score-based (future)
   - Configuration in `WORKFLOW_THRESHOLDS` object (lines 13-22)
   - Status: ✅ Complete, 32 tests passing

4. **workflow-scoring.js** (12KB)
   - Priority scoring algorithm using multi-factor formula
   - ARR multipliers, stage urgency, account plan weights, CSM workload, experience level
   - Formula: `((Base + Bonus) × ARR × Plan × Experience) + Workload`
   - Configuration in `SCORING_CONFIG` object (lines 15-70)
   - Transparent scoring with `explainWorkflowScore()`
   - Status: ✅ Complete, 29 tests passing

5. **workflow-orchestrator.js** (11KB)
   - The "conductor" that ties everything together
   - `generateAllWorkflows()` - main function
   - `getWorkflowQueueForCSM()` - per-CSM view
   - `groupWorkflowsByCustomer()`, `filterWorkflows()`, `getWorkflowStats()`
   - Status: ✅ Complete, 38 tests passing

6. **demo-workflow-system.js** (18KB)
   - End-to-end demonstration
   - 8 demo scenarios showing complete system
   - JSON output for dashboard integration
   - Status: ✅ Complete, works with real database

### Test Coverage

**159 Total Tests - 100% Passing**

- ✅ test-task-1-data-access.js: 24/24
- ✅ test-task-2-types.js: 36/36
- ✅ test-task-3-determination.js: 32/32
- ✅ test-task-4-scoring.js: 29/29
- ✅ test-task-5-orchestrator.js: 38/38

All tests run against **real database** with 10 seeded customers, not mocks.

### Documentation

**16KB Comprehensive Configuration Guide:**
- WORKFLOW-ALGORITHM-GUIDE.md
  - Step-by-step configuration examples
  - Scoring formula explanation
  - Testing instructions
  - Troubleshooting section
  - Phase 2 database migration roadmap

### Example: What the System Does

**Input:** Company with 4 customers

```javascript
// Customer 1: cloudnine.io
{
  arr: 180000,
  renewal_stage: 'Emergency',
  account_plan: 'invest',
  days_until_renewal: 3
}

// Customer 2: streamlinetech.com
{
  arr: 250000,
  renewal_stage: 'Prepare',
  account_plan: 'expand',
  days_until_renewal: 145
}

// Customer 3: nexgensoft.com
{
  arr: 125000,
  renewal_stage: 'Negotiate',
  account_plan: 'manage',
  days_until_renewal: 68
}

// Customer 4: pixelperfect.co
{
  arr: 98000,
  renewal_stage: 'Critical',
  account_plan: 'monitor',
  days_until_renewal: 11
}
```

**Output:** 6 workflows, sorted by priority

```javascript
[
  {
    workflow: {
      id: "wf-001",
      type: "strategic",
      priority_score: 337,
      customer_id: "cloudnine.io"
    },
    customer: {
      domain: "cloudnine.io",
      arr: 180000
    },
    context: {
      renewal_stage: "Emergency",
      account_plan: "invest"
    }
  },
  {
    workflow: {
      id: "wf-002",
      type: "renewal",
      priority_score: 210,
      customer_id: "streamlinetech.com"
    },
    customer: {
      domain: "streamlinetech.com",
      arr: 250000
    },
    context: {
      renewal_stage: "Prepare",
      account_plan: "expand"
    }
  },
  // ... 4 more workflows
]
```

**CSM View:** Sarah opens her dashboard, sees:

1. 🔥 cloudnine.io - Strategic (337 pts) - invest, $180k, Emergency
2. 🟡 cloudnine.io - Renewal (210 pts) - invest, $180k, Emergency
3. 🟡 streamlinetech.com - Strategic (190 pts) - expand, $250k, Prepare
4. 🟢 nexgensoft.com - Renewal (98 pts) - manage, $125k, Negotiate
5. 🟢 pixelperfect.co - Renewal (48 pts) - monitor, $98k, Critical
6. 🟢 streamlinetech.com - Renewal (45 pts) - expand, $250k, Prepare

Sarah starts with #1 (highest priority), system pre-populates workflow with customer data.

---

## 🔧 Technical Details

### Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SQLite Database                        │
│               (renubu-test.db)                          │
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │customers │contracts │ renewals │ account_plan     │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           workflow-data-access.js                       │
│  (Database Query Layer)                                 │
│  • getCustomersNeedingWorkflows()                       │
│  • getCustomerData()                                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌─────────────────┐    ┌──────────────────────┐
│workflow-        │    │workflow-scoring.js   │
│determination.js │    │(Priority Algorithm)  │
│(Business Rules) │    │• calculates scores   │
│• which workflows│    │• ranks workflows     │
└────────┬────────┘    └──────────┬───────────┘
         │                        │
         └────────────┬───────────┘
                      ▼
         ┌────────────────────────┐
         │workflow-orchestrator.js│
         │(The "Brain")           │
         │• ties everything       │
         │  together              │
         │• generates queues      │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  Sorted Workflow Queue │
         │  (ready for dashboard) │
         └────────────────────────┘
```

### Configuration Points

**All configuration in first ~50 lines of files:**

1. **workflow-determination.js** (lines 13-22)
```javascript
const WORKFLOW_THRESHOLDS = {
  strategic_account_plans: ['invest', 'expand'],
  opportunity_score_min: 70,
  risk_score_min: 60
};
```

2. **workflow-scoring.js** (lines 15-70)
```javascript
const SCORING_CONFIG = {
  arr_breakpoints: { high: 150000, medium: 100000 },
  arr_multipliers: { high: 2.0, medium: 1.5, low: 1.0 },
  renewal_stage_urgency: {
    'Overdue': 100, 'Emergency': 90, 'Critical': 80,
    'Signature': 70, 'Finalize': 60, 'Negotiate': 50,
    'Engage': 40, 'Prepare': 30, 'Monitor': 20
  },
  account_plan_multipliers: {
    'invest': 1.5, 'expand': 1.3, 'manage': 1.0, 'monitor': 0.8
  },
  workload_penalty_per_workflow: 2,
  experience_multipliers: {
    'expert': 1.2, 'senior': 1.1, 'mid': 1.0, 'junior': 0.9
  }
};
```

**These configs are "database-ready"** - designed to easily migrate to database tables in Phase 2.

### File Structure

```
automation/
├── workflow-types.js           # Core type definitions
├── workflow-data-access.js     # Database queries
├── workflow-determination.js   # Business rules
├── workflow-scoring.js         # Priority algorithm
├── workflow-orchestrator.js    # Orchestration layer
├── demo-workflow-system.js     # End-to-end demo
│
├── test-task-1-data-access.js
├── test-task-2-types.js
├── test-task-3-determination.js
├── test-task-4-scoring.js
├── test-task-5-orchestrator.js
│
├── WORKFLOW-ALGORITHM-GUIDE.md # Configuration guide
├── ROADMAP.md                  # This file
├── PROJECT-SUMMARY.md          # You are here
│
├── renubu-test.db              # SQLite database (10 customers)
├── schema.sql                  # Database schema
├── seed.js                     # Database seeder
│
├── renewal-helpers.js          # Stage calculation
├── renewal-workflow-mapper.js  # Maps stages to templates
├── renewal-configs/            # 9 template placeholders
│   ├── 0-Overdue.ts
│   ├── 1-Emergency.ts
│   ├── 2-Critical.ts
│   └── ... (6 more)
│
├── server.js                   # Express server (basic)
├── package.json
└── .git/                       # Local git repo
```

---

## ⚠️ What's NOT Built Yet

### Phase 2: Configuration UI (Next Priority)

**Missing:**
- ❌ Database tables for storing configuration
- ❌ REST API for managing rules
- ❌ Admin UI for editing configuration
- ❌ CSM dashboard for viewing workflow queue
- ❌ Real-time updates

**Impact:** Configuration requires code changes (editing JS files) - not sustainable.

### Phase 3: Workflow Execution

**Missing:**
- ❌ Workflow executor (bridge to task mode templates)
- ❌ Template variable injection
- ❌ Progress tracking
- ❌ Completion handlers

**Impact:** System can generate workflow assignments but can't execute them yet.

### Phase 4: Integration

**Missing:**
- ❌ Integration with main `renubu/` app
- ❌ Production database (Supabase)
- ❌ Authentication/authorization
- ❌ Multi-tenancy

**Impact:** This is a standalone prototype, not production-ready.

---

## 🚀 Quick Start Guide

### Running the System

```bash
# 1. Install dependencies
npm install

# 2. Check database is populated
node check-db.js

# 3. Run individual tests
node test-task-5-orchestrator.js

# 4. Run full demo
node demo-workflow-system.js

# 5. Start web server (basic)
node server.js
```

### Making Configuration Changes

**Example: Change ARR breakpoints to focus on enterprise**

1. Open `workflow-scoring.js`
2. Find `SCORING_CONFIG` (line 15)
3. Modify:
```javascript
arr_breakpoints: {
  high: 200000,    // changed from 150000
  medium: 150000   // changed from 100000
}
```
4. Test: `node test-task-4-scoring.js`
5. See impact: `node demo-workflow-system.js`

**See WORKFLOW-ALGORITHM-GUIDE.md for 10+ more examples.**

---

## 🎯 Separation from Chat Workflow

### Critical: This is a SEPARATE System

The workflow automation system is **completely independent** from:
- ❌ Chat workflow (user messages → AI responses)
- ❌ Task mode (multi-step AI tasks)
- ❌ Artifact system (code generation)
- ❌ Dynamic task mode (template-based tasks)

**Why separate?**
1. Different use case (CSM workflows vs AI chat)
2. Different data model (customers/renewals vs messages)
3. Different UI (dashboard vs chat interface)
4. Eventually will integrate but keep boundaries clear

**Shared concepts (but separate implementations):**
- Both use "templates" but different types
- Both have "workflows" but different meaning
- Both prioritize work but different algorithms

**Integration point (Phase 3):**
```
Workflow Assignment → Maps to → Task Template → Executes via → TaskModeAdvanced
```

But this bridge doesn't exist yet - that's Phase 3 work.

---

## 📊 Real-World Results

### Sample Output from Demo

```
Company: Acme Corporation
Total workflows generated: 6
Unique customers: 4
Average priority score: 33 points

Top 3 workflows:
1. stellaranalytics.com - Strategic (81 pts)
   invest plan, $78k ARR, Monitor stage

2. futuretech.vc - Strategic (54 pts)
   expand plan, $72k ARR, Monitor stage

3. pixelperfect.co - Renewal (48 pts)
   monitor plan, $98k ARR, Critical stage (11 days!)
```

### Priority Score Breakdown (Transparency)

```
Customer: stellaranalytics.com
Type: strategic
Final Score: 81 points

How calculated:
1. Base Score: 70 (strategic workflow for invest plan)
2. Account Plan: ×1.5 (invest multiplier)
3. Workload: -24 (CSM has 12 active workflows)
4. Formula: (70 × 1 × 1.5 × 1) + (-24) = 81
```

---

## 🤔 Design Decisions & Rationale

### Why JavaScript instead of TypeScript?

**Decision:** Build core modules in JavaScript, maintain TypeScript versions separately

**Reasons:**
1. Node.js can run JS directly (no build step)
2. Faster iteration during prototyping
3. TypeScript versions exist for future integration
4. Easy to convert later when merging into main app

### Why SQLite instead of Supabase?

**Decision:** Use SQLite for development/testing

**Reasons:**
1. No external dependencies (runs anywhere)
2. Fast queries (local file)
3. Easy to reset/seed for testing
4. Will migrate to Supabase when integrating with main app

### Why config in JS objects instead of database?

**Decision:** Start with JavaScript objects, migrate to database in Phase 2

**Reasons:**
1. Faster to prototype and test
2. Easy to version control (git)
3. No database setup required initially
4. Designed to be "database-ready" (easy migration path)

### Why separate git repo?

**Decision:** Keep automation in separate git repo initially

**Reasons:**
1. Isolated development (won't break main app)
2. Can iterate quickly without affecting production
3. Clear history for this specific feature
4. Will merge into main repo when stable (Phase 4)

---

## 🔮 Future Vision (Beyond Phase 3)

### Intelligent Features
- **Predictive Scoring:** ML predicts best time to engage customer
- **Auto-Template Generation:** System generates workflows from historical data
- **Smart Routing:** Match workflows to CSMs based on skills/history
- **Outcome Tracking:** Correlate workflow completion with renewal success

### Scaling Features
- **Multi-Tenant:** Each company has own configuration
- **White-Label:** Rebrand for different use cases
- **API Integration:** Connect to Salesforce, HubSpot, Intercom
- **Webhook Support:** Trigger workflows from external events

### Advanced Workflows
- **Conditional Logic:** If X happens, do Y workflow
- **Sequential Workflows:** Complete A before B
- **Approval Flows:** Manager reviews before execution
- **SLA Enforcement:** Alert if workflow not completed in time

---

## 📚 Additional Resources

### Key Documents
- **ROADMAP.md** - Detailed Phase 2-4 implementation plan
- **WORKFLOW-ALGORITHM-GUIDE.md** - Configuration reference
- **Git Commit Message** - Full technical details of Phase 1

### Test Files
- All test files include detailed comments explaining what they test
- Run any test file to see example usage
- Test output is human-readable with ✅/❌ indicators

### Demo File
- `demo-workflow-system.js` is executable documentation
- Shows 8 real-world scenarios
- Includes JSON output for dashboard integration

---

## 💬 Questions? Contact Points

### For Business Logic
- Review: `workflow-determination.js` (which workflows apply)
- Modify: `WORKFLOW_THRESHOLDS` object

### For Priority Scoring
- Review: `workflow-scoring.js` (how scoring works)
- Modify: `SCORING_CONFIG` object

### For Database Queries
- Review: `workflow-data-access.js` (what data we fetch)
- Add new queries as needed

### For Orchestration
- Review: `workflow-orchestrator.js` (how it all ties together)
- Main function: `generateAllWorkflows()`

---

**Last Updated:** October 7, 2025
**Phase:** 1 Complete ✅ | Phase 2 Ready to Start
**Status:** Production-ready algorithm, needs UI + execution engine
