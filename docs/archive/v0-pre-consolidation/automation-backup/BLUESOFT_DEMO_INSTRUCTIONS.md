# Bluesoft Showcase Demo - Complete Setup Instructions

**Last Updated:** October 9, 2025
**Status:** ✅ Ready to run
**Estimated Setup Time:** 10-15 minutes

---

## Overview

This demo showcases a **complete 120-day renewal lifecycle** for "Bluesoft Corporation" - a $180K ARR customer that successfully renewed with 10% expansion to $198K.

**What's Included:**
- ✅ Real customer intelligence data (risk, opportunity, health scores)
- ✅ Real financials data (ARR history, growth trends, payment status)
- ✅ Real usage metrics (active users, utilization, adoption)
- ✅ Real engagement data (QBR dates, NPS scores, support tickets)
- ✅ 5 stakeholders with roles and influence levels
- ✅ 2 workflow executions (Critical + Emergency)
- ✅ 6 tasks across the workflows
- ✅ 6 AI-generated artifacts showcasing the renewal journey
- ✅ Complete 120-day narrative from initial assessment to successful expansion

---

## Files Overview

### Migration Files (Run in order)
1. **`RUN_THIS_MIGRATION.sql`** - Chat system + customer enhancements *(already run)*
2. **`BLUESOFT_DEMO_MIGRATION.sql`** - Intelligence/financials tables *(new)*
3. **`BLUESOFT_DEMO_SEED.sql`** - Bluesoft customer + intelligence data *(new)*
4. **`BLUESOFT_WORKFLOWS_SEED.sql`** - Workflows + artifacts *(new)*

### Documentation Files
- **`BLUESOFT_WORKFLOW_PLAN.md`** - Complete workflow and artifact mapping
- **`BLUESOFT_DEMO_INSTRUCTIONS.md`** - This file

---

## Step-by-Step Setup

### ✅ Step 1: Prerequisites (Already Complete)

You've already run:
- ✅ `RUN_THIS_MIGRATION.sql` - Chat tables, user preferences, customer enhancements
- ✅ `SEED_DATA.sql` - 6 saved actions (snooze, skip, escalate, etc.)

### 🚀 Step 2: Create workflow_executions Table

**File:** `automation/CREATE_WORKFLOW_EXECUTIONS.sql`

**What it does:**
- Creates the `workflow_executions` table (was referenced but never created)
- Proper schema with `workflow_config_id` FK to `workflows` table
- Includes `metadata` JSONB column for flexible data
- Status tracking, timestamps, snooze support

**Why this matters:**
- This table is required for workflow execution tracking
- Proper foreign key constraints for data integrity
- Indexed for performance

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `automation/CREATE_WORKFLOW_EXECUTIONS.sql`
3. Copy entire file
4. Paste into SQL Editor
5. Click "Run"
6. ✅ Verify success message

---

### 🚀 Step 3: Run Intelligence/Financials Migration

**File:** `automation/BLUESOFT_DEMO_MIGRATION.sql`

**What it creates:**
- `customer_intelligence` table
- `customer_financials` table
- `customer_usage_metrics` table
- `customer_engagement` table
- `customer_stakeholders` table
- Helper functions for retrieving latest data

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `automation/BLUESOFT_DEMO_MIGRATION.sql`
3. Copy entire file
4. Paste into SQL Editor
5. Click "Run"
6. ✅ Verify success message

**Expected output:**
```
========================================
BLUESOFT DEMO SCHEMA MIGRATION COMPLETE!
========================================
Created tables:
  - customer_intelligence
  - customer_financials
  - customer_usage_metrics
  - customer_engagement
  - customer_stakeholders

Created helper functions:
  - get_latest_intelligence()
  - get_latest_financials()
  - get_latest_usage()
  - get_latest_engagement()

Next: Run BLUESOFT_DEMO_SEED.sql
========================================
```

---

### 🚀 Step 3: Seed Bluesoft Customer Data

**File:** `automation/BLUESOFT_DEMO_SEED.sql`

**What it creates:**
- **Bluesoft Corporation** customer (`id: 00000000-0000-0000-0000-000000000001`)
- **5 stakeholders** (Sarah Chen - VP Eng, Marcus Thompson - Champion, David Kim - CFO, etc.)
- **8 intelligence snapshots** across 120-day journey (health: 72 → 85)
- **3 financial records** (ARR: $165K → $180K → $198K)
- **7 usage metric snapshots** (users: 32 → 40, utilization: 80% → 89%)
- **8 engagement records** (NPS: 7 → 9, meetings, QBRs, support tickets)

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `automation/BLUESOFT_DEMO_SEED.sql`
3. Copy entire file
4. Paste into SQL Editor
5. Click "Run"
6. ✅ Verify success message

**Expected output:**
```
========================================
BLUESOFT DEMO SEED DATA COMPLETE!
========================================
Created showcase customer:
  - Bluesoft Corporation
  - ID: 00000000-0000-0000-0000-000000000001
  - ARR: $198,000 (after 10% expansion)
  - Health Score: 85

Seeded data:
  - 5 stakeholders
  - 8 intelligence snapshots (120-day journey)
  - 3 financial records (historical + current)
  - 7 usage metric snapshots
  - 8 engagement records

120-Day Renewal Journey:
  Day 0: Monitor (Health: 72)
  Day 30: Prepare - QBR (Health: 78)
  Day 60: Negotiate (Health: 68)
  Day 75: Finalize (Health: 75)
  Day 90: Signature (Health: 74)
  Day 105: Critical (Health: 74)
  Day 115: Emergency (Health: 73)
  Day 120: SUCCESS! (Health: 85)

Next: Update Context API to read from these tables
========================================
```

---

### 🚀 Step 5: Seed Workflows & Artifacts

**File:** `automation/BLUESOFT_WORKFLOWS_SEED.sql`

**What it creates:**
- **2 workflow configs** (Critical, Emergency)
- **2 workflow executions** (Critical: Days 105-115, Emergency: Days 115-120)
- **6 workflow tasks** (assessments, escalations, action plans)
- **6 AI-generated artifacts:**
  1. Critical Status Assessment
  2. Executive Escalation Brief (War Room activation)
  3. Emergency Resolution Plan (Signature collection)
  4. Emergency Status Check (5 days remaining)
  5. Final Push Action Plan (Payment collection)
  6. Renewal Success Report (Post-mortem)

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `automation/BLUESOFT_WORKFLOWS_SEED.sql`
3. Copy entire file
4. Paste into SQL Editor
5. Click "Run"
6. ✅ Verify success message

**Expected output:**
```
========================================
BLUESOFT WORKFLOWS & ARTIFACTS SEEDED!
========================================
Created workflow executions:
  - Critical Renewal (Days 105-115)
  - Emergency Renewal (Days 115-120)

Created tasks:
  - Critical Status Assessment
  - Executive Escalation
  - Emergency Resolution Plan
  - Emergency Status Check
  - Final Push - Payment Collection
  - Renewal Success Report

Created artifacts:
  - 6 artifacts across the renewal lifecycle
  - All artifacts AI-generated and approved
  - Mapped to workflow tasks

Demo ready! Access Bluesoft showcase:
  - Customer ID: 00000000-0000-0000-0000-000000000001
  - Final ARR: $198,000 (10% expansion)
  - Health Score: 85
  - Status: Renewal Secured ✅
========================================
```

---

## Step 5: Verify Context API (Already Updated)

✅ **The Context API has been updated** to read from the new database tables instead of using mocks.

**What changed:**
- `GET /api/workflows/context?customerId={id}` now calls:
  - `get_latest_intelligence()` for real intelligence data
  - `get_latest_financials()` for real financial data
  - `get_latest_usage()` for real usage metrics
  - `get_latest_engagement()` for real engagement data
  - Fetches stakeholders from `customer_stakeholders` table

**Fallback behavior:**
- If no data in new tables → falls back to calculated/mocked values
- Ensures API never breaks, even with incomplete data

---

## Testing the Demo

### Test 1: Customer Context API

```bash
# Get Bluesoft context
curl http://localhost:3000/api/workflows/context?customerId=00000000-0000-0000-0000-000000000001
```

**Expected response:**
```json
{
  "success": true,
  "customer": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Bluesoft Corporation",
    "domain": "bluesoft.com",
    "industry": "Enterprise Software",
    "arr": 198000,
    "renewalDate": "2026-10-09",
    "accountPlan": "expand",
    "healthScore": 85
  },
  "intelligence": {
    "riskScore": 15,
    "opportunityScore": 90,
    "healthScore": 85,
    "trends": {
      "health": "improving",
      "usage": "increasing",
      "engagement": "high"
    },
    "churnProbability": 5.0,
    "expansionProbability": 90.0
  },
  "data": {
    "financials": {
      "currentARR": 198000,
      "previousARR": 180000,
      "projectedARR": 220000,
      "trend": "growing",
      "growthRate": 10.0,
      "paymentStatus": "current"
    },
    "usage": {
      "activeUsers": 40,
      "utilizationRate": 88.9,
      "lastActivityDate": "2025-10-09T...",
      "trend": "increasing",
      "adoptionRate": 90.0
    },
    "engagement": {
      "lastContact": "2025-10-09T...",
      "qbrDate": "2025-07-11",
      "npsScore": 9,
      "supportTickets": 0,
      "engagementScore": 90,
      "sentiment": "positive"
    }
  },
  "workflow": {
    "daysUntilRenewal": 365,
    "renewalStage": "Monitor",
    "accountPlan": "expand",
    "priorityScore": 85
  },
  "accountTeam": {
    "csm": {...},
    "stakeholders": [
      {
        "name": "Sarah Chen",
        "title": "VP of Engineering",
        "role": "decision_maker",
        "influence_level": "high",
        "decision_authority": true,
        "is_champion": false,
        "sentiment": "positive"
      },
      {
        "name": "Marcus Thompson",
        "title": "Director of DevOps",
        "role": "champion",
        "influence_level": "high",
        "is_champion": true,
        "sentiment": "positive"
      },
      // ... 3 more stakeholders
    ],
    "decisionMakers": [...],
    "champions": [...]
  }
}
```

---

### Test 2: Workflow Executions

```sql
-- Get Bluesoft workflow executions
SELECT
  id,
  workflow_id,
  status,
  started_at,
  completed_at,
  metadata
FROM workflow_executions
WHERE customer_id = '00000000-0000-0000-0000-000000000001'
ORDER BY started_at;
```

**Expected result:**
- 2 executions: `critical` and `emergency`
- Both status: `completed`
- Metadata shows ARR, outcomes, executive involvement

---

### Test 3: Artifacts

```sql
-- Get Bluesoft artifacts
SELECT
  a.id,
  a.artifact_type,
  a.title,
  t.title as task_title,
  a.created_at
FROM workflow_task_artifacts a
JOIN workflow_tasks t ON a.task_id = t.id
JOIN workflow_executions e ON t.workflow_execution_id = e.id
WHERE e.customer_id = '00000000-0000-0000-0000-000000000001'
ORDER BY a.created_at;
```

**Expected result:**
- 6 artifacts in chronological order
- Types: `contract_analysis`, `meeting_notes`, `action_plan`, `assessment`
- All `is_approved = true`
- All `generated_by_ai = true`

---

### Test 4: Intelligence History

```sql
-- Get Bluesoft health score journey
SELECT
  calculated_at::date as date,
  health_score,
  risk_score,
  opportunity_score,
  health_trend,
  churn_probability,
  expansion_probability
FROM customer_intelligence
WHERE customer_id = '00000000-0000-0000-0000-000000000001'
ORDER BY calculated_at;
```

**Expected result:**
- 8 records showing health journey: 72 → 78 → 68 → 75 → 74 → 74 → 73 → 85
- Risk decreases, Opportunity increases over time
- Expansion probability grows from 45% to 90%

---

## Demo Narrative

**For presenting the demo, follow this story:**

### Act 1: The Setup (Days 0-90)
> "Meet Bluesoft Corporation - a $180K ARR enterprise software customer with 120 days until renewal. Our AI-powered system has been tracking their health, usage, and engagement throughout the journey. Let's look at their intelligence dashboard..."

**Show:** Customer Context API response - baseline health 72, moderate engagement

### Act 2: The Journey (Days 30-90)
> "At Day 30, we conducted a QBR. Our system detected an expansion opportunity based on increasing usage and positive stakeholder sentiment. Health improved to 78..."

**Show:** Intelligence history - health trend improving

> "By Day 60, negotiations began. Some pricing concerns surfaced - notice health dips to 68. Our system flagged this for CSM attention..."

**Show:** Usage metrics showing stable adoption, engagement data showing multiple touchpoints

> "By Day 75, terms were finalized. Health recovered to 75. But signatures were still pending..."

### Act 3: Critical Escalation (Days 105-115)
> "With 15 days remaining, our system automatically triggered the **Critical Renewal Workflow**. The AI assessed the situation and identified the primary blocker: CFO signature pending."

**Show:** Critical Status Assessment artifact

> "The system immediately generated an **Executive Escalation Brief**, activated a war room, and coordinated executive involvement. Notice the detailed situation analysis, risk assessment, and action plan..."

**Show:** Executive Escalation Brief artifact

> "A multi-channel emergency resolution plan was executed - emails, LinkedIn messages, executive-to-executive calls. The CFO signed on Day 111..."

**Show:** Emergency Resolution Plan artifact

### Act 4: Emergency Push (Days 115-120)
> "With 5 days remaining, we entered **Emergency Workflow**. The final blocker was payment processing. The AI conducted a rapid status check and determined the path forward..."

**Show:** Emergency Status Check artifact

> "The team executed a final push - coordinating with AP/Finance, confirming payment timeline, CEO-to-CEO confirmation calls. Payment cleared on Day 119..."

**Show:** Final Push Action Plan artifact

### Act 5: Success! (Day 120)
> "Renewal secured with 10% expansion! The AI generated a comprehensive **Success Report** with post-mortem analysis. Notice the lessons learned and prevention plan for future renewals..."

**Show:** Renewal Success Report artifact

> "Final outcome: $198K ARR, health score 85, customer relationship stronger than ever. The system tracked every data point - intelligence, financials, usage, engagement - all retrieved from the database, not mocked."

**Show:** Updated Customer Context API with final state

---

## Key Demo Talking Points

1. **Real Data, Not Mocks**
   - All intelligence/financials/usage/engagement data stored in Postgres
   - Context API retrieves from `customer_intelligence`, `customer_financials`, etc.
   - Fallback to calculated values if tables empty

2. **Workflow Orchestration**
   - System automatically triggers workflows based on renewal stage
   - Critical: 7-14 days (executive escalation, war room)
   - Emergency: 0-6 days (CEO involvement, final push)

3. **AI-Generated Artifacts**
   - 6 artifacts across the lifecycle
   - Contract analysis, meeting notes, action plans, assessments
   - All approved and linked to workflow tasks

4. **120-Day Journey**
   - Complete narrative from initial assessment to renewal
   - Health score evolution: 72 → 85
   - Intelligence trends visible across 8 snapshots
   - Expansion achieved despite critical/emergency escalation

5. **Post-Mortem Learning**
   - System captures lessons learned
   - Prevention strategies for future renewals
   - Stakeholder relationship building

---

## Troubleshooting

### Issue: Context API returns null intelligence
**Solution:** Verify `BLUESOFT_DEMO_SEED.sql` ran successfully
```sql
SELECT COUNT(*) FROM customer_intelligence
WHERE customer_id = '00000000-0000-0000-0000-000000000001';
-- Should return 8
```

### Issue: No artifacts showing
**Solution:** Verify `BLUESOFT_WORKFLOWS_SEED.sql` ran successfully
```sql
SELECT COUNT(*) FROM workflow_task_artifacts a
JOIN workflow_tasks t ON a.task_id = t.id
JOIN workflow_executions e ON t.workflow_execution_id = e.id
WHERE e.customer_id = '00000000-0000-0000-0000-000000000001';
-- Should return 6
```

### Issue: Customer not found
**Solution:** Verify Bluesoft customer exists
```sql
SELECT * FROM customers
WHERE id = '00000000-0000-0000-0000-000000000001';
-- Should return Bluesoft Corporation
```

---

## Next Steps

After demo setup is complete:

1. ✅ **Test all APIs** with Bluesoft customer ID
2. ✅ **Verify frontend** can display customer context, workflows, and artifacts
3. 📝 **Prepare demo script** following the narrative above
4. 🎬 **Record demo walkthrough** or present live
5. 🚀 **Expand demo** with additional customers if needed

---

## Summary

You now have:
- ✅ Complete 120-day renewal lifecycle for Bluesoft
- ✅ Real database-backed intelligence/financials data
- ✅ 2 workflow executions (Critical + Emergency)
- ✅ 6 AI-generated artifacts
- ✅ 5 stakeholders with roles and influence
- ✅ Context API reading from real tables
- ✅ Ready-to-demo showcase customer

**Customer ID for all testing:** `00000000-0000-0000-0000-000000000001`

**Demo is ready! 🎉**

---

**Last Updated:** October 9, 2025
**Author:** AI Assistant
**Files:** 4 SQL migrations/seeds + 2 documentation files
