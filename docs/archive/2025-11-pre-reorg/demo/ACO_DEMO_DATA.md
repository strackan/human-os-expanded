# Obsidian Black Demo Data Reference

> **Purpose**: Quick reference for all Obsidian Black demo data IDs and key values
> **Last Updated**: October 11, 2025
> **Database**: Remote Supabase (uuvdjjclwwulvyeboavk)

---

## 📊 Data Specification (PM-Approved)

**Core Metrics**:
- **ARR**: $185,000 (realistic mid-market SaaS)
- **Health Score**: 6.4/10 (moderate risk, not critical)
- **Churn Probability**: 42%
- **Opportunity Score**: 8.7/10 (high expansion potential)

**Operation Blackout**:
- **Cost Impact**: $150,000 (~46% of ARR)
- **Date**: October 15, 2024
- **Cause**: 47-second latency delay in critical coordination phase

---

## 🆔 Fixed UUIDs

### Customer
```
ID: 550e8400-e29b-41d4-a716-446655440001
Name: Obsidian Black
Domain: apexconsolidated.ops
Industry: Global Strategic Coordination Services
```

### Contacts
**Marcus Castellan** (Primary Contact):
- Role: Chief Operating Officer ("The Orchestrator")
- Email: marcus.castellan@apexconsolidated.ops
- Phone: +1 (555) 0100
- Status: Frustrated, disengaged for 90 days
- Last Contact: July 15, 2024

**Dr. Elena Voss** (Secondary Contact):
- Role: VP of Technical Operations ("Nightingale")
- Email: elena.voss@apexconsolidated.ops
- Phone: +1 (555) 0101
- Status: Evaluating competitors
- Initiative: $1.7M Global Synchronization Initiative
- Competitors: ShadowCore Systems, Helix Coordination Platform, Obsidian Enterprise

---

## 📈 Customer Metrics

| Metric | Value | Status |
|--------|-------|--------|
| ARR | $185,000 | neutral |
| Health Score | 6.4/10 | warning |
| Opportunity Score | 8.7/10 | complete |
| Renewal Date | Apr 15, 2026 | warning |
| Days to Renewal | 186 days | warning |
| Churn Probability | 42% | warning |
| Contract Auto-Renew | false | error |

---

## 🎯 Operations

**Operation Blackout** (FAILED):
- Date: October 15, 2024
- Quarter: Q4 2024
- Cost Impact: $150,000
- Status: failed
- Reason: Platform latency caused 47-second delay in critical coordination phase

**Operation Nightfall** (SUCCESS):
- Date: August 22, 2024
- Quarter: Q3 2024
- Status: success

**Operation Shadow Strike** (SUCCESS):
- Date: June 10, 2024
- Quarter: Q2 2024
- Status: success

---

## 🎫 Support Tickets (Ticket Spike)

**Recent Tickets** (Past 7 days):

1. **ACO-4891** (1 day ago)
   - Subject: Dashboard not displaying real-time operational status
   - Category: ux
   - Priority: medium
   - Sentiment: neutral
   - Resolution: 24 hours

2. **ACO-4856** (2 days ago)
   - Subject: Integration with Operative Management System v8.2 failing
   - Category: integration
   - Priority: high
   - Sentiment: frustrated
   - Resolution: PENDING

3. **ACO-4728** (3 days ago)
   - Subject: Operative Smith cannot access Phase 3 coordination documents
   - Category: permissions_error
   - Priority: high
   - Sentiment: frustrated
   - Resolution: 72 hours

4. **ACO-4823** (4 days ago)
   - Subject: Performance degradation during peak operational hours
   - Category: performance
   - Priority: high
   - Sentiment: frustrated
   - Resolution: PENDING

5. **ACO-4801** (6 days ago)
   - Subject: Timezone conversion bug in Jakarta facility coordination
   - Category: bug
   - Priority: medium
   - Sentiment: frustrated
   - Resolution: 48 hours

**Summary**:
- Total Tickets (2 weeks): 5
- Frustrated: 4 (80%)
- Neutral/Satisfied: 1 (20%)
- Spike Multiplier: 3.3x normal rate

---

## 📋 Contract Details

**Contract Number**: ACO-CONTRACT-2023
- Start Date: April 15, 2023
- End Date: April 15, 2026
- Term: 3 years
- ARR: $185,000
- Seats: 450 operatives
- Type: subscription
- Status: active
- **Auto-Renewal: FALSE** ⚠️ (Creates urgency!)
- SLA: 99.5% uptime

---

## 💡 Renewal Details

- **Renewal Date**: April 15, 2026
- **Days Until Renewal**: 186 days (from Oct 11, 2025)
- **Current ARR**: $185,000
- **Proposed ARR**: $185,000 (no change yet)
- **Probability**: 58% (moderate risk)
- **Stage**: discovery
- **Risk Level**: medium
- **Expansion Opportunity**: $1,700,000 (Elena's initiative)

**AI Insights**:
- Risk Score: 42% churn probability
- Confidence: 75%
- Recommendation: "Priority: Establish relationship with Dr. Elena Voss within 7 days. She is evaluating competitors and launching $1.7M initiative."

---

## 🎨 Health Score Components

| Component | Score | Status |
|-----------|-------|--------|
| Overall Health | 6.4/10 | warning |
| Product Usage | 7.2/10 | good |
| Engagement | 4.8/10 | warning |
| Support Satisfaction | 5.1/10 | warning |
| Payment History | 9.5/10 | excellent |
| Platform Reliability | 5.0/10 | warning |

---

## 🚀 Expansion Opportunity

**Global Synchronization Initiative**:
- Sponsor: Dr. Elena Voss
- Value: $1,700,000
- Status: evaluation
- Probability: 65%
- Target Close: June 30, 2026
- Key Requirement: Timezone-intelligent scheduling
- Competitors Evaluating:
  - ShadowCore Systems
  - Helix Coordination Platform
  - Obsidian Enterprise

---

## 📝 Strategic Plan (Pre-seeded)

**Phase 1: Immediate Response (Days 1-7)**:
1. Respond to Marcus email (Day 1)
2. Intro outreach to Elena (Day 3)
3. Schedule Marcus call (Day 5)

**Phase 2: Trust Rebuilding (Days 8-30)**:
1. Elena discovery call (Week 2)
2. Deliver Accountability Report (Week 3)
3. Propose dedicated liaison (Week 4)
4. Schedule Q1 QBR (Week 4)

**Phase 3: Roadmap Positioning (Days 31-90)**:
1. Demo timezone automation prototype (Month 2)
2. Expansion proposal presentation (Month 2)
3. Q1 QBR execution (Month 3)
4. Renewal negotiation kickoff (Month 3)

**Success Probability**: 78% (if plan executed correctly)

---

## 🔄 Demo Reset

To reset all Obsidian Black demo data:

```bash
# Via API (requires demo_godmode permission)
POST /api/demo/reset
{
  "confirm": true
}

# Via SQL function
SELECT * FROM reset_aco_demo();

# Via script
node scripts/seed-aco-simple.mjs
```

**What Gets Reset**:
- Obsidian Black customer record
- Marcus & Elena contacts
- All operations (Blackout, Nightfall, etc.)
- All support tickets
- Contract & renewal records
- Strategic plans
- Any workflow executions linked to Obsidian Black

---

## 📊 API Endpoints (Coming in Phase 3-4)

**Customer Context**:
- `GET /api/customers/aco` → Full profile
- `GET /api/customers/aco/contacts` → Marcus + Elena
- `GET /api/customers/aco/operations` → Operation Blackout history
- `GET /api/customers/aco/tickets` → Support ticket spike
- `GET /api/customers/aco/opportunities` → Elena's $1.7M initiative

**Workflow Execution**:
- `POST /api/workflows/executions` → Create workflow
- `GET /api/workflows/executions/{id}` → Load workflow
- `PUT /api/workflows/executions/{id}/steps` → Save step data
- `GET /api/workflows/executions/{id}/metrics` → Customer metrics

**AI Insights** (Mock):
- `POST /api/ai/risk-analysis` → Risk breakdown
- `POST /api/ai/email-draft` → Email templates

---

## ✅ Verification Queries

```sql
-- Check customer exists
SELECT * FROM customers WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Check contacts
SELECT * FROM contacts WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Check Operation Blackout
SELECT * FROM demo_operations WHERE name = 'Operation Blackout';

-- Check support tickets
SELECT COUNT(*) FROM demo_support_tickets WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Check renewal
SELECT * FROM renewals WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';
```

---

**Status**: ✅ All data seeded and verified
**Last Seeded**: October 11, 2025
**Seeded By**: Back-End Engineer (Phase 2)
