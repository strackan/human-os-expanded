# Bluesoft Demo: Workflow & Artifact Plan

**Customer:** Bluesoft Corporation
**Customer ID:** `00000000-0000-0000-0000-000000000001`
**Journey:** 120-day renewal lifecycle with expansion
**Final Outcome:** ✅ Renewed with 10% expansion ($180K → $198K)

---

## 120-Day Journey Overview

| Stage | Days Before Renewal | Renewal Stage | Health Score | Key Events |
|-------|---------------------|---------------|--------------|------------|
| 1. Initial Assessment | 120-90 | Monitor | 72 | Baseline assessment |
| 2. QBR & Expansion | 90-60 | Prepare | 78 | QBR executed, opportunity identified |
| 3. Negotiation | 60-45 | Negotiate | 68 | Pricing concerns surface |
| 4. Terms Finalized | 45-30 | Finalize | 75 | Agreement reached |
| 5. Stakeholder Alignment | 30-15 | Signature | 74 | Waiting on signatures |
| 6. **Critical Push** | 15-5 | **Critical** | 74 | **CRITICAL WORKFLOW** |
| 7. **Emergency Push** | 5-0 | **Emergency** | 73→85 | **EMERGENCY WORKFLOW** |
| 8. Success | Day 120 | Renewed | 85 | Expansion secured |

---

## Workflow Selection for Demo

For the Bluesoft showcase, we'll demonstrate **2 workflows** that cover the final critical weeks:

### 1. Critical Renewal Workflow (Days 105-115)
**File:** `database/seeds/workflows/08-critical.json`
**Trigger:** 7-14 days before renewal
**Timeline:** Day 105 (15 days before) → Day 115 (5 days before)

**Steps Demonstrated:**
1. **Critical Status Assessment** → Assess what's blocking completion
2. **Executive Escalation** → War room activation, VP CS involvement
3. **Emergency Resolution** → Fast-track signature collection
4. **Alternative Options** (optional) → Not needed for Bluesoft (deal is on track)

### 2. Emergency Renewal Workflow (Days 115-120)
**File:** `database/seeds/workflows/09-emergency.json`
**Trigger:** 0-6 days before renewal
**Timeline:** Day 115 (5 days before) → Day 120 (renewal day)

**Steps Demonstrated:**
1. **Emergency Status Check** → Rapid assessment (hours, not days)
2. **Mandatory Team Escalation** → CEO involvement for high-value deal
3. **Final Push** → Executive-to-executive outreach, signature secured
4. **Outcome Resolution** → ✅ Success! Expansion achieved

---

## Artifact Mapping to Lifecycle Stages

### Early Stages (Days 0-90) - Context Only
*No workflow artifacts for demo, but intelligence data shows:*
- Initial account assessment (health: 72)
- QBR summary showing expansion opportunity (health: 78)
- Engagement improving, usage growing

### Negotiation Stage (Days 60-75)
*No workflow artifacts, but data shows:*
- Pricing concerns (health dips to 68)
- 3 support tickets opened and resolved
- Contract discussions ongoing

### Critical Workflow Artifacts (Days 105-115)

#### Artifact 1: Critical Status Assessment
**Type:** `contract_analysis`
**Day:** 105 (15 days before renewal)
**Title:** "Critical Renewal Status - Bluesoft Corporation"
**Content:**
```json
{
  "daysUntilRenewal": 15,
  "currentARR": 180000,
  "renewalARR": 198000,
  "signatures": {
    "docusignSent": true,
    "customerSigned": false,
    "vendorCountersigned": false,
    "status": "SIGNATURE_PENDING"
  },
  "payment": {
    "invoiceSent": true,
    "paymentReceived": false,
    "poReceived": true
  },
  "salesforce": {
    "opportunityStage": "Negotiation/Review",
    "contractEndDateUpdated": false,
    "nextYearOpportunityCreated": false
  },
  "negotiation": {
    "priceAgreed": true,
    "termsFinalized": true,
    "pendingApprovals": ["CFO signature", "Legal final review"]
  },
  "routeSelected": "SIGNATURE_PENDING",
  "reasoning": "All terms agreed, but waiting on customer's CFO (David Kim) to sign. Executive escalation needed to accelerate signature collection.",
  "secondaryConcerns": ["Legal review taking 3+ days", "CFO traveling next week"]
}
```

#### Artifact 2: Executive Escalation Brief
**Type:** `meeting_notes`
**Day:** 106 (14 days before renewal)
**Title:** "Executive Escalation Brief - Bluesoft Renewal"
**Content:**
```markdown
# CRITICAL RENEWAL ALERT

**Customer:** Bluesoft Corporation
**ARR at Risk:** $198,000 (10% expansion)
**Days Until Renewal:** 14
**Primary Blocker:** CFO signature pending

---

## SITUATION BRIEF

Bluesoft renewal terms are 100% agreed upon with 10% expansion ($180K → $198K). All stakeholders except CFO David Kim have approved. David is our champion Marcus Thompson's boss.

**Why Are We At Risk?**
- David Kim (CFO) is traveling next week (days 7-10 before renewal)
- Legal review delayed by 3 days due to custom payment terms
- If David doesn't sign before travel, we hit emergency window

**What's At Stake?**
- **ARR Impact:** $198,000
- **Strategic Impact:** Tier 1 Enterprise account, reference customer
- **Churn Risk:** LOW (customer wants to renew, just logistics)

---

## EXECUTIVE ACTION NEEDED

**For VP Customer Success:**
- [x] Approve war room activation
- [x] Daily 9am check-ins with CSM
- [ ] Fast-track legal review (4-hour SLA)

**For Executive Sponsor:**
- [ ] Direct call to David Kim (CFO) - request signature before travel
- [ ] Offer DocuSign walkthrough or wet signature alternative

**War Room Recommendation:** YES
- Daily 15-min standups (9am) until signature secured
- Attendees: CSM, VP CS, Executive Sponsor
- Slack: #war-room-bluesoft
```

#### Artifact 3: Emergency Resolution Plan
**Type:** `action_plan`
**Day:** 107 (13 days before renewal)
**Title:** "Emergency Signature Collection Plan - Bluesoft"
**Content:**
```markdown
# EMERGENCY SIGNATURE COLLECTION PLAN

**Primary Blocker:** CFO signature pending
**Deadline:** Day 110 (before CFO travel)

---

## RESOLUTION ACTIONS

### Multi-Channel Outreach (Days 107-108)
- [x] Email to David Kim with DocuSign link + urgency note
- [x] LinkedIn message from our CEO to David Kim
- [x] Phone call from Executive Sponsor → scheduled for tomorrow 10am
- [ ] Champion (Marcus Thompson) to escalate internally

### Executive-to-Executive Call (Day 108)
- [x] Scheduled: Tomorrow 10am PST
- Attendees: Our CEO + David Kim (Bluesoft CFO)
- Agenda: Quick DocuSign walkthrough, answer any questions, secure signature

### Alternative Signature Methods
- [ ] Wet signature option (overnight FedEx if DocuSign blocked)
- [ ] Authorized signatory (if David unavailable, can Marcus sign?)

### Fast-Track Internal Approvals
- [x] Legal review completed (4-hour SLA)
- [x] Finance approved payment flexibility
- [x] Contract final version sent to customer

---

## DAILY STATUS UPDATES

**Day 107:** Executive call scheduled, multi-channel outreach initiated
**Day 108:** [Pending] Executive call outcome
**Day 109:** [Pending] Signature secured or escalate to alternative methods
**Day 110:** [Deadline] Must have signature before CFO travel
```

### Emergency Workflow Artifacts (Days 115-120)

#### Artifact 4: Emergency Status Check
**Type:** `meeting_notes`
**Day:** 115 (5 days before renewal)
**Title:** "Emergency Status - Bluesoft Renewal"
**Content:**
```markdown
# EMERGENCY STATUS CHECK

**Hours Until Renewal:** 120 hours
**Customer:** Bluesoft Corporation
**ARR:** $198,000

---

## RAPID STATUS

1. **Contract Status:** SIGNED ✅ (David Kim signed on Day 111)
2. **Payment Status:** PENDING ⏳ (PO received, payment scheduled Day 118)
3. **Customer Intent:** RENEWING ✅ (100% commitment confirmed)
4. **Primary Blocker:** Payment processing (AP/Finance coordination)
5. **Hours Needed:** 48-72 hours (payment clears Day 118-119)

---

## IMMEDIATE DECISION

**Path Forward:** FINAL_PUSH

**Reasoning:** Customer 100% committed, just need payment to process. Will coordinate with AP/Finance to ensure payment clears before renewal date.

---

## TEAM NOTIFICATION

- [x] Manager acknowledged
- [x] VP CS notified
- [ ] Daily sync at 9am (CSM, Manager, VP CS)
```

#### Artifact 5: Final Push Action Plan
**Type:** `action_plan`
**Day:** 116 (4 days before renewal)
**Title:** "Final Push - Payment Collection"
**Content:**
```markdown
# FINAL PUSH - PAYMENT COLLECTION

**Hours Remaining:** 96 hours
**Primary Blocker:** Payment processing

---

## IMMEDIATE ACTIONS

### Payment Coordination (Day 116-117)
- [x] Called Bluesoft AP/Finance directly (spoke with Sarah in AP)
- [x] Confirmed payment scheduled for Day 118 (3 days before renewal)
- [x] Backup: Accept credit card payment if wire/ACH delayed
- [x] Finance approved payment plan if needed (50/50 split)

### Executive Confirmation (Day 117)
- [x] CEO-to-CEO confirmation call with Sarah Chen (Bluesoft VP Eng)
- Confirmed renewal commitment and timeline
- Discussed future expansion opportunities (Q2 2026)

### Hourly Updates (Days 118-120)
**Day 118 (3 days before):**
- 9am: Payment initiated by Bluesoft AP
- 3pm: Payment confirmed in transit (ACH 24-48 hours)

**Day 119 (2 days before):**
- 9am: Payment still processing
- 3pm: Payment CLEARED ✅

**Day 120 (Renewal Day):**
- 9am: Renewal SECURED ✅
- Contract fully executed, payment received, Salesforce updated
```

#### Artifact 6: Renewal Success Report
**Type:** `assessment`
**Day:** 120 (Renewal Day)
**Title:** "Bluesoft Renewal - Success Report"
**Content:**
```markdown
# RENEWAL SUCCESS REPORT

**Customer:** Bluesoft Corporation
**Final Outcome:** ✅ RENEWAL SECURED WITH EXPANSION

---

## OUTCOME DETAILS

**What Was Agreed:**
- 10% expansion: $180K → $198K ARR
- License expansion: 40 → 45 seats
- 1-year contract (renews Oct 2026)
- Payment terms: Net 30

**Contract Value:** $198,000
**Start Date:** October 10, 2025
**End Date:** October 9, 2026

---

## NEXT STEPS

**Immediate (Day 120-121):**
- [x] Contract processed and filed
- [x] Payment confirmed received ($198K)
- [x] Salesforce updated (Closed Won, next renewal opp created)
- [x] Thank you email sent to Sarah Chen and David Kim

**Follow-Up (Week 1):**
- [ ] Onboard 5 new users (expansion seats)
- [ ] Schedule success check-in (30 days)
- [ ] Plan Q1 QBR (January 2026)

**Future Planning:**
- Health score: 85 (excellent)
- Expansion opportunity: Q2 2026 (Sarah mentioned potential for 20 more seats)
- Executive sponsor relationship: Strong (CEO-to-VP relationship established)

---

## POST-MORTEM

**What Led to This Emergency?**
- CFO signature delayed due to travel schedule
- Legal review took 3 days (custom payment terms)
- AP/Finance payment processing near deadline

**What Could We Have Done Differently?**
- Start signature collection 30 days earlier (not 15 days)
- Identify CFO travel schedule sooner
- Simplify payment terms to avoid legal delays

**What Did We Learn?**
- Executive-to-executive relationships are critical for high-value renewals
- Multi-channel outreach (email, phone, LinkedIn) accelerates responses
- Payment processing can take 48-72 hours - plan accordingly

**How Do We Prevent This Next Time?**
- 60-day signature collection timeline (not 30 days)
- Stakeholder travel calendars tracked in CRM
- Standard payment terms for renewals (custom terms only if necessary)

---

## CELEBRATION 🎉

Bluesoft renewed with expansion! Excellent teamwork by CSM, Executive Sponsor, and VP CS. Health score improved to 85, customer relationship stronger than ever.

**Next Renewal:** October 9, 2026
**Growth Potential:** 20+ additional seats in Q2 2026
**Status:** Tier 1 Strategic Account ⭐
```

---

## Workflow Execution Seed Data

To demonstrate these workflows in the UI, we'll create:

### Workflow Execution 1: Critical Renewal
```sql
INSERT INTO workflow_executions (
  id,
  customer_id,
  workflow_id,
  status,
  started_at,
  completed_at,
  metadata
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001', -- Bluesoft
  'critical',
  'completed',
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE - INTERVAL '5 days',
  '{"daysUntilRenewal": 15, "arr": 198000, "outcome": "escalated_to_emergency"}'::jsonb
);
```

### Workflow Execution 2: Emergency Renewal
```sql
INSERT INTO workflow_executions (
  id,
  customer_id,
  workflow_id,
  status,
  started_at,
  completed_at,
  metadata
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001', -- Bluesoft
  'emergency',
  'completed',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE,
  '{"hoursUntilRenewal": 120, "arr": 198000, "outcome": "renewal_secured_with_expansion"}'::jsonb
);
```

### Workflow Tasks (for artifact attachment)
```sql
-- Critical workflow tasks
INSERT INTO workflow_tasks (workflow_execution_id, task_type, title, status, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'assessment', 'Critical Status Assessment', 'completed', CURRENT_DATE - INTERVAL '15 days'),
  ('10000000-0000-0000-0000-000000000001', 'escalation', 'Executive Escalation', 'completed', CURRENT_DATE - INTERVAL '14 days'),
  ('10000000-0000-0000-0000-000000000001', 'action', 'Emergency Resolution Plan', 'completed', CURRENT_DATE - INTERVAL '13 days');

-- Emergency workflow tasks
INSERT INTO workflow_tasks (workflow_execution_id, task_type, title, status, created_at) VALUES
  ('10000000-0000-0000-0000-000000000002', 'assessment', 'Emergency Status Check', 'completed', CURRENT_DATE - INTERVAL '5 days'),
  ('10000000-0000-0000-0000-000000000002', 'action', 'Final Push - Payment Collection', 'completed', CURRENT_DATE - INTERVAL '4 days'),
  ('10000000-0000-0000-0000-000000000002', 'completion', 'Renewal Success Report', 'completed', CURRENT_DATE);
```

---

## Demo Flow

**For the demo, showcase:**

1. **Customer Intelligence Dashboard** - Show Bluesoft's 120-day health trend
2. **Critical Workflow** - Walk through Day 105-115 artifacts
3. **Emergency Workflow** - Show final 5-day push and success
4. **Artifacts Gallery** - Display all 6 artifacts with context
5. **Success Metrics** - $198K ARR, 10% expansion, health score 85

**Key Talking Points:**
- Real intelligence data (not mocked) from database
- Workflow orchestration based on renewal stage
- Executive escalation and war room activation
- Successful expansion despite critical/emergency escalation
- Post-mortem learning for future renewals

---

**Last Updated:** October 9, 2025
**Status:** Ready for seed data creation
