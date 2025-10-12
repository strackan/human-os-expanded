# Back-End Engineer: Act 1 Task Breakdown (v2 - WorkflowExecutor API Contracts)

> **Document Version**: 2.0 (Updated 2025-10-11)
> **Previous Version**: BE_ACT1_TASKS.md (v1)
> **Review Status**: 🟡 Pending Justin's approval before starting

---

## 🎉 Great News: Phase 1 Schema Is Already Complete!

### What Happened Since v1 Was Written

**Oct 11, 2025**: PM validated Phase 1 database schema with the validation script. All tests passed! Here's what exists:

**Database Schema ✅ COMPLETE**:
- ✅ `demo_operations` table (Operation Blackout history)
- ✅ `demo_support_tickets` table (support ticket spike data)
- ✅ `demo_strategic_plans` table (90-day plans)
- ✅ `customers.is_demo` column (flag for demo customers)
- ✅ `profiles.demo_godmode` column (demo admin access)
- ✅ `workflow_executions.renewal_id` column (link workflows to renewals)
- ✅ `reset_aco_demo()` function (reset demo state)

**What PM Validated**:
```bash
$ node scripts/validate-phase1-schema.mjs

✓ Test 1: Checking demo_operations table...
  ✅ PASSED: demo_operations table exists
✓ Test 2: Checking demo_support_tickets table...
  ✅ PASSED: demo_support_tickets table exists
✓ Test 3: Checking demo_strategic_plans table...
  ✅ PASSED: demo_strategic_plans table exists
✓ Test 4: Checking customers.is_demo column...
  ✅ PASSED: customers.is_demo column exists
✓ Test 5: Checking profiles.demo_godmode column...
  ✅ PASSED: profiles.demo_godmode column exists
✓ Test 7: Checking reset_aco_demo() function...
  ✅ PASSED: reset_aco_demo() function exists
✓ Test 8: Checking workflow_executions.renewal_id column...
  ✅ PASSED: workflow_executions.renewal_id column exists

✅ ALL TESTS PASSED - Phase 1 migration successful!
```

### What This Means for Your Work

**Original Estimate**: 14-19 hours
**NEW Estimate**: 10-14 hours (Phase 1 complete, 2-3 hours saved!)

**You DON'T need to do**:
- ❌ Create database schema (already exists)
- ❌ Write migration scripts (already applied)
- ❌ Create demo reset script (already exists as SQL function)

**You DO need to do**:
- ✅ Verify/seed Obsidian Black demo data
- ✅ Build API endpoints (with updated URL patterns for WorkflowExecutor)
- ✅ Create mock AI responses

---

## 📋 Quick Reference

**Your Onboarding Doc**: `BE_START_HERE.md`
**Scope Doc**: `ACT1_SCOPE_OF_WORK.md`
**Villain Universe Reference**: See "Creative Director's storyboard" in project context
**Database**: Supabase (PostgreSQL) - already linked and migrated

**Key Context**:
- Customer: Obsidian Black (Obsidian Black)
- Contacts: Marcus Castellan (COO, "The Orchestrator"), Dr. Elena Voss (VP Tech Ops, "Nightingale")
- Product: ThreatOS™ - Enterprise Coordination Platform
- Theme: Professional villain universe

---

## Phase 1: Database Schema ✅ COMPLETE

### Task 1.1: Verify Schema Status ✅ (DONE BY PM)
**Status**: ✅ **Complete** - All tables and columns exist

**What to Verify** (optional double-check):
- [ ] Run validation script: `node scripts/validate-phase1-schema.mjs`
- [ ] Verify all 8 tests pass
- [ ] Confirm Supabase connection works

**Estimated Time**: 5 minutes (verification only)

---

## Phase 2: Data Seeding & Verification (2-3 hours)

### Task 2.1: Check if Obsidian Black Data Already Exists
**Action**: Query Supabase to see if demo data is seeded

```sql
-- Check if Obsidian Black customer exists
SELECT * FROM customers WHERE name = 'Obsidian Black' AND is_demo = true;

-- Check demo operations
SELECT * FROM demo_operations WHERE customer_id = (SELECT id FROM customers WHERE name = 'Obsidian Black' AND is_demo = true);

-- Check demo tickets
SELECT * FROM demo_support_tickets WHERE customer_id = (SELECT id FROM customers WHERE name = 'Obsidian Black' AND is_demo = true);

-- Check demo strategic plans
SELECT * FROM demo_strategic_plans WHERE customer_id = (SELECT id FROM customers WHERE name = 'Obsidian Black' AND is_demo = true);
```

**Outcomes**:
- **If data exists**: Document what's there, verify it matches spec → Go to Task 2.3
- **If data doesn't exist**: Proceed to Task 2.2 to seed it

**Estimated Time**: 15 minutes

---

### Task 2.2: Seed Obsidian Black Demo Data (If Needed)
**File**: Create `supabase/scripts/seed_aco_demo_data.sql` if it doesn't exist

**Data to Seed**:

**1. Obsidian Black Customer**:
```sql
INSERT INTO customers (id, name, is_demo, arr, renewal_date, health_score, opportunity_score, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Obsidian Black',
  true,
  1150000,
  '2026-04-15',
  6.4,
  8.7,
  NOW()
) ON CONFLICT (id) DO NOTHING;
```

**2. Marcus Castellan (Primary Contact)**:
```sql
INSERT INTO contacts (id, customer_id, name, title, email, last_contact_date, satisfaction, engagement_level)
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'Marcus Castellan',
  'Chief Operating Officer',
  'marcus@obsidian-ops.net',
  '2024-09-12',
  'low',
  'high'
) ON CONFLICT DO NOTHING;
```

**3. Dr. Elena Voss (Secondary Contact)**:
```sql
INSERT INTO contacts (id, customer_id, name, title, email, last_contact_date, is_evaluating_competitors, initiative_value)
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'Dr. Elena Voss',
  'VP of Technical Operations',
  'elena.voss@obsidian-ops.net',
  NULL, -- Never contacted
  true, -- Evaluating VectorSync and OmniCoord
  410000 -- $1.7M Global Synchronization Initiative
) ON CONFLICT DO NOTHING;
```

**4. Operation Blackout**:
```sql
INSERT INTO demo_operations (id, customer_id, name, status, failure_reason, cost_impact, date)
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'Operation Blackout',
  'failed',
  'Platform latency caused 47-second delay in synchronized sequence',
  150000,
  '2024-10-15'
) ON CONFLICT DO NOTHING;
```

**5. Support Ticket Spike (5 tickets)**:
```sql
INSERT INTO demo_support_tickets (id, customer_id, subject, category, priority, sentiment, created_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Operative Smith cannot access Phase 3 coordination documents', 'permissions_error', 'high', 'frustrated', '2025-01-05'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Timezone conversion bug in Jakarta facility coordination', 'bug', 'medium', 'frustrated', '2025-01-08'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Performance degradation during peak operational hours', 'performance', 'high', 'frustrated', '2025-01-10'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Integration with Operative Management System v8.2 failing', 'integration', 'high', 'frustrated', '2025-01-12'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Dashboard not displaying real-time operational status', 'ux', 'medium', 'neutral', '2025-01-14')
ON CONFLICT DO NOTHING;
```

**Acceptance Criteria**:
- [ ] Obsidian Black customer record exists
- [ ] Marcus and Elena contacts exist
- [ ] Operation Blackout recorded
- [ ] 5 support tickets exist (4 frustrated, 1 neutral)
- [ ] All data matches ACT1_SCOPE_OF_WORK.md specs

**Estimated Time**: 1-1.5 hours (if seeding needed)

---

### Task 2.3: Document Current Data State
**Action**: Create a quick reference doc showing what demo data exists

**File**: `docs/demo/Obsidian Black_DEMO_DATA.md`

**Contents**:
- Customer ID for Obsidian Black
- Contact IDs for Marcus and Elena
- Operation IDs
- Ticket IDs
- Any other relevant IDs FE might need

**Estimated Time**: 15 minutes

---

## Phase 3: Workflow Execution APIs (4-5 hours)

### **IMPORTANT: Updated API Contracts for WorkflowExecutor**

The modern WorkflowExecutor (built Oct 9-10) expects specific API URL patterns. DO NOT use the old patterns from BE_ACT1_TASKS.md v1!

**OLD (v1 - WRONG)**:
- ❌ `POST /api/workflows/start`
- ❌ `PUT /api/workflows/{id}/step`
- ❌ `GET /api/workflows/{id}/context`

**NEW (v2 - CORRECT)**:
- ✅ `POST /api/workflows/executions`
- ✅ `GET /api/workflows/executions/{executionId}`
- ✅ `PUT /api/workflows/executions/{executionId}/steps`
- ✅ `PUT /api/workflows/executions/{executionId}`
- ✅ `GET /api/workflows/executions/{executionId}/metrics`

---

### Task 3.1: Build POST /api/workflows/executions
**File**: `src/app/api/workflows/executions/route.ts`

**Purpose**: Create new workflow execution (replaces old "start" endpoint)

**Request Body**:
```typescript
{
  workflowConfigId?: string,
  workflowName: string,
  workflowType: string,
  customerId: string,
  totalSteps: number
}
```

**Response**:
```typescript
{
  execution: {
    id: string,
    workflow_config_id: string | null,
    workflow_name: string,
    workflow_type: string,
    customer_id: string,
    current_step_index: number, // 0
    total_steps: number,
    status: 'in_progress',
    step_data: {},
    created_at: string,
    updated_at: string
  }
}
```

**Implementation Notes**:
- Insert into `workflow_executions` table
- Return full execution object
- Handle duplicate requests (idempotency)

**Acceptance Criteria**:
- [ ] Creates execution record in database
- [ ] Returns execution with ID
- [ ] Status = 'in_progress' initially
- [ ] current_step_index = 0

**Estimated Time**: 1 hour

---

### Task 3.2: Build GET /api/workflows/executions/[executionId]
**File**: `src/app/api/workflows/executions/[executionId]/route.ts`

**Purpose**: Load existing workflow execution state

**Response**:
```typescript
{
  execution: {
    id: string,
    workflow_config_id: string | null,
    workflow_name: string,
    workflow_type: string,
    customer_id: string,
    current_step_index: number,
    total_steps: number,
    status: 'in_progress' | 'completed' | 'abandoned',
    step_data: Record<string, any>,
    created_at: string,
    updated_at: string
  }
}
```

**Acceptance Criteria**:
- [ ] Fetches execution from database
- [ ] Returns 404 if not found
- [ ] Includes all step_data
- [ ] Status reflects current state

**Estimated Time**: 30 minutes

---

### Task 3.3: Build PUT /api/workflows/executions/[executionId]/steps
**File**: `src/app/api/workflows/executions/[executionId]/steps/route.ts`

**Purpose**: Save step data after user completes a step

**Request Body**:
```typescript
{
  stepNumber: number,
  stepData: Record<string, any>,
  status?: 'complete' | 'in_progress'
}
```

**Response**:
```typescript
{
  success: true,
  execution: {
    id: string,
    current_step_index: number,
    step_data: Record<string, any>
  }
}
```

**Implementation Notes**:
- Update `step_data` JSONB column
- Merge new step data with existing data
- Update `updated_at` timestamp

**Acceptance Criteria**:
- [ ] Saves step data to database
- [ ] Merges with existing step_data (doesn't overwrite)
- [ ] Returns updated execution
- [ ] Handles invalid step numbers

**Estimated Time**: 45 minutes

---

### Task 3.4: Build PUT /api/workflows/executions/[executionId]
**File**: `src/app/api/workflows/executions/[executionId]/route.ts`

**Purpose**: Update execution (current step, status)

**Request Body**:
```typescript
{
  currentStep?: number,
  status?: 'in_progress' | 'completed' | 'abandoned'
}
```

**Response**:
```typescript
{
  success: true,
  execution: {
    id: string,
    current_step_index: number,
    status: string
  }
}
```

**Acceptance Criteria**:
- [ ] Updates current_step_index
- [ ] Updates status
- [ ] Returns updated execution
- [ ] Updates updated_at timestamp

**Estimated Time**: 30 minutes

---

### Task 3.5: Build GET /api/workflows/executions/[executionId]/metrics
**File**: `src/app/api/workflows/executions/[executionId]/metrics/route.ts`

**Purpose**: Get customer metrics for CustomerMetrics panel

**Response**:
```typescript
{
  customerId: string,
  customerName: string,
  metrics: [
    { label: 'ARR', value: '$185,000', status: 'neutral' },
    { label: 'Health Score', value: '6.4/10', status: 'warning' },
    { label: 'Opportunity Score', value: '8.7/10', status: 'complete' },
    { label: 'Renewal Date', value: 'Apr 15, 2026', status: 'warning' },
    { label: 'Days to Renewal', value: '143 days', status: 'warning' }
  ]
}
```

**Implementation Notes**:
- Fetch customer data from database
- Calculate days to renewal dynamically
- Format metrics for CustomerMetrics component

**Acceptance Criteria**:
- [ ] Returns customer metrics array
- [ ] Metrics match Obsidian Black data
- [ ] Status colors correct (error, warning, complete, neutral)
- [ ] Days to renewal calculated dynamically

**Estimated Time**: 45 minutes

---

## Phase 4: Customer Context APIs (3-4 hours)

### Task 4.1: Build GET /api/customers/aco
**File**: `src/app/api/customers/aco/route.ts`

**Purpose**: Full Obsidian Black profile for dashboard

**Response**:
```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Obsidian Black",
  "industry": "Global Strategic Coordination Services",
  "operatives": 450,
  "facilities": 23,
  "arr": 1150000,
  "renewal_date": "2026-04-15",
  "days_to_renewal": 143,
  "health_score": 6.4,
  "opportunity_score": 8.7,
  "primary_contact": "Marcus Castellan"
}
```

**Acceptance Criteria**:
- [ ] Returns Obsidian Black customer data
- [ ] Days to renewal calculated dynamically
- [ ] All fields match seeded data
- [ ] Returns 200 OK

**Estimated Time**: 30 minutes

---

### Task 6.4: Build GET /api/customers/aco/contacts
**File**: `src/app/api/customers/aco/contacts/route.ts`

**Purpose**: Marcus + Elena contact info

**Response**:
```json
{
  "contacts": [
    {
      "contact_id": "...",
      "name": "Marcus Castellan",
      "title": "Chief Operating Officer",
      "email": "marcus@obsidian-ops.net",
      "engagement_level": "high",
      "satisfaction": "low",
      "last_contact": "2024-09-12",
      "days_since_contact": 90
    },
    {
      "contact_id": "...",
      "name": "Dr. Elena Voss",
      "title": "VP of Technical Operations",
      "email": "elena.voss@obsidian-ops.net",
      "engagement_level": "medium",
      "is_evaluating_competitors": true,
      "initiative_value": 410000,
      "last_contact": null
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Returns both contacts
- [ ] Days since contact calculated
- [ ] Elena shows NULL for last_contact
- [ ] Initiative value included for Elena

**Estimated Time**: 30 minutes

---

### Task 4.3: Build GET /api/customers/aco/operations
**File**: `src/app/api/customers/aco/operations/route.ts`

**Purpose**: Operation Blackout + history

**Response**:
```json
{
  "operations": [
    {
      "operation_id": "...",
      "name": "Operation Blackout",
      "status": "failed",
      "failure_reason": "Platform latency caused 47-second delay",
      "cost_impact": 150000,
      "quarter": "Q4 2024",
      "date": "2024-10-15"
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Returns operations chronologically
- [ ] Operation Blackout included
- [ ] Cost impacts as numbers
- [ ] Failure reason clear

**Estimated Time**: 30 minutes

---

### Task 4.4: Build GET /api/customers/aco/tickets
**File**: `src/app/api/customers/aco/tickets/route.ts`

**Purpose**: Support ticket spike data

**Response**:
```json
{
  "tickets": [
    {
      "ticket_id": "ACO-4891",
      "subject": "Dashboard not displaying real-time status",
      "category": "ux",
      "priority": "medium",
      "sentiment": "neutral",
      "created_at": "2025-01-14"
    }
  ],
  "summary": {
    "total_tickets_2_weeks": 5,
    "normal_rate": 1.5,
    "spike_multiplier": 3.3,
    "frustrated_count": 4
  }
}
```

**Acceptance Criteria**:
- [ ] Returns tickets from past 2 weeks
- [ ] Summary shows spike detection
- [ ] Sentiment counts accurate
- [ ] Sorted by date

**Estimated Time**: 45 minutes

---

### Task 4.5: Build GET /api/customers/aco/opportunities
**File**: `src/app/api/customers/aco/opportunities/route.ts`

**Purpose**: Elena's $1.7M initiative

**Response**:
```json
{
  "opportunities": [
    {
      "opportunity_id": "...",
      "name": "Global Synchronization Initiative",
      "sponsor": "Dr. Elena Voss",
      "value": 410000,
      "status": "evaluating",
      "key_requirement": "Timezone-intelligent scheduling",
      "competitors_evaluating": ["VectorSync", "OmniCoord"],
      "urgency": "high"
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Returns Elena's initiative
- [ ] Value = $1.7M
- [ ] Competitors listed
- [ ] Key requirement noted

**Estimated Time**: 30 minutes

---

## Phase 5: Demo Management & AI APIs (2-3 hours)

### Task 5.1: Build POST /api/demo/reset
**File**: `src/app/api/demo/reset/route.ts`

**Purpose**: Call `reset_aco_demo()` SQL function

**Request Body**:
```json
{
  "confirm": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Demo data reset successfully",
  "customer_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Implementation**:
```typescript
// Call the SQL function
await supabase.rpc('reset_aco_demo');
```

**Acceptance Criteria**:
- [ ] Calls reset_aco_demo() function
- [ ] Returns success response
- [ ] Requires auth (demo users only)
- [ ] Fast execution (< 3 seconds)

**Estimated Time**: 45 minutes

---

### Task 5.2: Build POST /api/ai/risk-analysis (Mock Response)
**File**: `src/app/api/ai/risk-analysis/route.ts`

**Purpose**: Pre-written risk analysis (no real LLM needed for demo)

**Request Body**:
```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response**:
```json
{
  "overall_health_score": 6.4,
  "churn_probability": 42,
  "component_scores": {
    "product_performance": 3.1,
    "relationship_strength": 4.8,
    "strategic_alignment": 5.2,
    "support_quality": 3.5,
    "executive_sponsorship": 6.0
  },
  "insights": [
    "Obsidian Black experienced 3 critical service failures in past 12 months.",
    "Most severe: Operation Blackout directly cost Obsidian Black $850K and damaged trust.",
    "Your predecessor's departure created an 87-day communication void.",
    "Without intervention, renewal is unlikely."
  ],
  "recommendation": "Priority: Establish relationship with Dr. Elena Voss within 7 days. She's evaluating competitors and launching $1.7M initiative."
}
```

**Acceptance Criteria**:
- [ ] Returns mock analysis
- [ ] Contextual to Obsidian Black
- [ ] Fast response (< 200ms)
- [ ] Data matches Obsidian Black situation

**Estimated Time**: 30 minutes

---

### Task 5.3: Build POST /api/ai/email-draft (Mock Response)
**File**: `src/app/api/ai/email-draft/route.ts`

**Purpose**: Pre-written email templates

**Request Body**:
```json
{
  "recipient": "Marcus Castellan",
  "context": "responding to proving ground email",
  "purpose": "acknowledge concerns and request call"
}
```

**Response**:
```json
{
  "subject": "Re: Obsidian Black Renewal Discussion - Year Two Expectations",
  "body": "Marcus,\n\nThank you for your email. I appreciate your directness—it's exactly what I need to serve Obsidian Black effectively.\n\nYou're right: Year One was disappointing. The Operation Blackout incident cost you $850K and should never have happened. The 87-day communication gap after my predecessor's departure was unacceptable. These aren't excuses I'm offering—they're problems I'm committed to solving.\n\nI'd like to request a 30-minute call this week to listen and understand your expectations for Year Two. I'm not coming with a pitch—I'm coming to learn what \"strategic partnership\" looks like from your perspective.\n\nWould Thursday at 2 PM PST work?\n\nBest regards,\nSarah Chen\nCustomer Success Manager, Squelch"
}
```

**Implementation Notes**:
- Store templates in code or database
- Switch templates based on recipient (Marcus vs Elena)
- Professional tone

**Acceptance Criteria**:
- [ ] Returns email draft
- [ ] Tone appropriate for recipient
- [ ] Contextual to Obsidian Black situation
- [ ] Different templates for Marcus vs Elena

**Estimated Time**: 45 minutes

---

## Coordination with Frontend

### API Endpoints FE Expects

**Workflow Execution** (WorkflowExecutor uses these):
1. `POST /api/workflows/executions` → Create execution
2. `GET /api/workflows/executions/{id}` → Load execution
3. `PUT /api/workflows/executions/{id}/steps` → Save step data
4. `PUT /api/workflows/executions/{id}` → Update execution
5. `GET /api/workflows/executions/{id}/metrics` → Customer metrics

**Customer Context** (for dashboard + workflows):
6. `GET /api/customers/aco` → Full profile
7. `GET /api/customers/aco/contacts` → Marcus + Elena
8. `GET /api/customers/aco/operations` → Operation Blackout
9. `GET /api/customers/aco/tickets` → Support tickets
10. `GET /api/customers/aco/opportunities` → Elena's initiative

**Demo Management**:
11. `POST /api/demo/reset` → Reset demo

**AI Insights** (mock for demo):
12. `POST /api/ai/risk-analysis` → Risk breakdown
13. `POST /api/ai/email-draft` → Email templates

### Testing with FE

**Recommended approach**:
1. Build one endpoint at a time
2. Test with `curl` or Postman
3. Share example responses with FE
4. Coordinate on error formats

**API Documentation**: Consider creating `docs/planning/API-CONTRACT.md` with all example requests/responses

---

## Definition of Done

### Phase 1: Schema ✅
- [x] Database migrations run successfully (COMPLETE)
- [x] All 7 tables created (COMPLETE)
- [x] Demo reset function exists (COMPLETE)

### Phase 2: Seeding
- [ ] Obsidian Black customer seeded
- [ ] Marcus + Elena contacts seeded
- [ ] Operation Blackout + history seeded
- [ ] 5 support tickets seeded
- [ ] All data matches spec

### Phase 3: Workflow APIs
- [ ] All 5 workflow execution endpoints functional
- [ ] URL patterns match WorkflowExecutor expectations
- [ ] Error handling implemented
- [ ] Performance acceptable (< 500ms per request)

### Phase 4: Customer APIs
- [ ] All 5 customer context endpoints functional
- [ ] Response formats match FE expectations
- [ ] Error handling implemented

### Phase 5: Demo & AI APIs
- [ ] Demo reset triggers full reset
- [ ] Risk analysis returns contextual insights
- [ ] Email drafting returns templates
- [ ] All responses feel intelligent

### Integration
- [ ] FE can fetch all required data
- [ ] Workflow state persists across sessions
- [ ] Demo reset clears all state
- [ ] No CORS issues
- [ ] Justin approves the implementation

---

## Time Estimates Summary

| Phase | Tasks | Original Estimate | NEW Estimate | Time Saved |
|-------|-------|------------------|--------------|------------|
| Phase 1: Schema | 2 tasks | 2-3 hours | 0 hours | ✅ 2-3 hours (COMPLETE) |
| Phase 2: Seeding | 3 tasks | 3-4 hours | 2-3 hours | 1 hour (verification vs build) |
| Phase 3: Workflow APIs | 5 tasks | 4-5 hours | 4-5 hours | 0 hours |
| Phase 4: Customer APIs | 5 tasks | 3-4 hours | 3-4 hours | 0 hours |
| Phase 5: Demo & AI | 3 tasks | 2-3 hours | 2-3 hours | 0 hours |
| **TOTAL** | **18 tasks** | **14-19 hours** | **11-15 hours** | **3-4 hours saved!** |

### Why Time Reduced

**Already Complete** (Oct 11, 2025):
- ✅ Database schema migration (2-3 hours saved)
- ✅ reset_aco_demo() SQL function (30 min saved)
- ✅ All column additions (30 min saved)

---

## Questions for PM (Before Starting)

1. **Data Seeding**: Should I verify Obsidian Black data exists first, or just run the seed script?
2. **API Authentication**: What auth mechanism should I use for demo reset endpoint?
3. **Real LLM Integration**: When should we swap mock AI responses for real LLM calls?
4. **Performance**: Any caching strategy for customer context APIs?
5. **Monitoring**: Should we log demo resets for analytics?

---

**Ready to start? Phase 1 is done! Focus on verifying data and building the updated API contracts.**

**Questions? Ask PM before starting.**
