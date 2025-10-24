# Back-End Engineer: Act 1 Task Breakdown

> **Purpose**: Detailed task list for implementing Act 1 backend (database + APIs + demo data)
> **Estimate**: 14-19 hours
> **Priority**: Start with database schema + seeding, then build APIs
> **Review Status**: 🟡 Pending Justin's approval before starting

---

## 📋 Quick Reference

**Your Onboarding Doc**: `BE_START_HERE.md`
**Scope Doc**: `ACT1_SCOPE_OF_WORK.md`
**Villain Universe Reference**: See "Creative Director's storyboard" in project context

**Key Context**:
- Customer: Obsidian Black (Obsidian Black)
- Contacts: Marcus Castellan (COO, "The Orchestrator"), Dr. Elena Voss (VP Tech Ops, "Nightingale")
- Product: ThreatOS™ - Enterprise Coordination Platform
- Theme: Professional villain universe (operation names, ticket subjects villain-themed)
- Database: Supabase (PostgreSQL)

---

## Phase 1: Database Schema Design (2-3 hours)

### Task 1.1: Design Obsidian Black Demo Data Schema
**File**: `supabase/migrations/YYYYMMDD_create_aco_demo_schema.sql`

**Tables to Create/Extend**:

1. **demo_customers** (or extend existing `customers` table)
   ```sql
   - customer_id (text, PK)
   - name (text)
   - industry (text)
   - operatives (int) -- villain-specific
   - facilities (int) -- villain-specific
   - arr (numeric)
   - renewal_date (date)
   - health_score (numeric) -- 0-10
   - opportunity_score (numeric) -- 0-10
   - is_demo (boolean) -- flag for demo data
   - created_at (timestamp)
   ```

2. **demo_contacts** (or extend existing)
   ```sql
   - contact_id (text, PK)
   - customer_id (text, FK to demo_customers)
   - name (text)
   - title (text)
   - villain_designation (text) -- e.g., "The Orchestrator"
   - engagement_level (text) -- high/medium/low
   - satisfaction (text) -- low/medium/high
   - last_contact (date)
   - is_evaluating_competitors (boolean)
   - initiative_value (numeric) -- for expansion opportunities
   - created_at (timestamp)
   ```

3. **demo_operations** (villain "projects")
   ```sql
   - operation_id (text, PK)
   - customer_id (text, FK)
   - name (text) -- e.g., "Operation Blackout"
   - status (text) -- success/failed/in_progress
   - failure_reason (text)
   - cost_impact (numeric)
   - quarter (text)
   - date (date)
   - created_at (timestamp)
   ```

4. **demo_support_tickets**
   ```sql
   - ticket_id (text, PK)
   - customer_id (text, FK)
   - subject (text)
   - category (text) -- permissions_error, performance, etc.
   - priority (text) -- high/medium/low
   - resolution_time_hours (int)
   - sentiment (text) -- frustrated/neutral/satisfied
   - created_at (timestamp)
   ```

5. **demo_contracts**
   ```sql
   - contract_id (text, PK)
   - customer_id (text, FK)
   - start_date (date)
   - end_date (date)
   - arr (numeric)
   - auto_renew (boolean)
   - sla_uptime (numeric) -- e.g., 99.5
   - status (text) -- active/expired/cancelled
   - created_at (timestamp)
   ```

6. **demo_strategic_plans** (for tracking workflow completion)
   ```sql
   - plan_id (text, PK)
   - customer_id (text, FK)
   - phase_1_tasks (jsonb) -- array of tasks
   - phase_2_tasks (jsonb)
   - phase_3_tasks (jsonb)
   - success_probability (numeric) -- e.g., 78
   - created_at (timestamp)
   - completed (boolean)
   ```

7. **demo_workflow_state** (for persistence)
   ```sql
   - session_id (text, PK)
   - customer_id (text)
   - workflow_type (text) -- strategic_planning, risk_detection, etc.
   - current_step (int)
   - data (jsonb) -- workflow-specific data
   - completed (boolean)
   - created_at (timestamp)
   - updated_at (timestamp)
   ```

**Acceptance Criteria**:
- [ ] Migration script runs without errors
- [ ] All tables created with correct schema
- [ ] Foreign keys properly defined
- [ ] Indexes added for performance (customer_id, created_at)
- [ ] `is_demo` flag allows easy filtering of demo data
- [ ] Schema documented in comments

**Estimated Time**: 2 hours

---

### Task 1.2: Create Demo Reset Script
**File**: `supabase/scripts/reset_demo_data.sql`

**Requirements**:
- Delete all records where `is_demo = true` or `customer_id = 'aco-001'`
- Re-seed fresh Obsidian Black data
- Reset workflow states
- Can be called via API endpoint

**Script Structure**:
```sql
-- Delete existing demo data
DELETE FROM demo_workflow_state WHERE customer_id = 'aco-001';
DELETE FROM demo_strategic_plans WHERE customer_id = 'aco-001';
DELETE FROM demo_contracts WHERE customer_id = 'aco-001';
DELETE FROM demo_support_tickets WHERE customer_id = 'aco-001';
DELETE FROM demo_operations WHERE customer_id = 'aco-001';
DELETE FROM demo_contacts WHERE customer_id = 'aco-001';
DELETE FROM demo_customers WHERE customer_id = 'aco-001';

-- Re-seed (call seed script)
\i seed_aco_demo_data.sql
```

**Acceptance Criteria**:
- [ ] Script deletes all Obsidian Black demo data
- [ ] Script re-seeds fresh data
- [ ] Idempotent (can run multiple times safely)
- [ ] Fast execution (< 2 seconds)
- [ ] Can be triggered via `/api/demo/reset` endpoint

**Estimated Time**: 45 minutes

---

## Phase 2: Data Seeding (3-4 hours)

### Task 2.1: Seed Obsidian Black Organization
**File**: `supabase/scripts/seed_aco_demo_data.sql`

**Data to Insert**:
```sql
INSERT INTO demo_customers (
  customer_id,
  name,
  industry,
  operatives,
  facilities,
  arr,
  renewal_date,
  health_score,
  opportunity_score,
  is_demo
) VALUES (
  'aco-001',
  'Obsidian Black',
  'Global Strategic Coordination Services',
  450,
  23,
  1500000,
  '2026-04-15',
  4.2,
  8.7,
  true
);
```

**Acceptance Criteria**:
- [ ] Obsidian Black record inserts successfully
- [ ] All fields populated correctly
- [ ] ARR formatted as numeric (1500000, not "$850,000")
- [ ] Renewal date is future date (April 15, 2026)
- [ ] Health score reflects "at-risk" status (4.2/10)
- [ ] Opportunity score reflects expansion potential (8.7/10)

**Estimated Time**: 15 minutes

---

### Task 2.2: Seed Marcus Castellan (Primary Contact)
**File**: Same as Task 2.1

**Data to Insert**:
```sql
INSERT INTO demo_contacts (
  contact_id,
  customer_id,
  name,
  title,
  villain_designation,
  engagement_level,
  satisfaction,
  last_contact,
  is_evaluating_competitors,
  initiative_value
) VALUES (
  'aco-marcus',
  'aco-001',
  'Marcus Castellan',
  'Chief Operating Officer',
  'The Orchestrator',
  'high',
  'low',
  '2025-09-12',
  false,
  NULL
);
```

**Acceptance Criteria**:
- [ ] Marcus record links to Obsidian Black
- [ ] Villain designation included
- [ ] Satisfaction = "low" (he's angry!)
- [ ] Last contact was 90 days ago (creates urgency)
- [ ] Not evaluating competitors (loyal but frustrated)

**Estimated Time**: 15 minutes

---

### Task 2.3: Seed Dr. Elena Voss (Secondary Stakeholder)
**File**: Same as Task 2.1

**Data to Insert**:
```sql
INSERT INTO demo_contacts (
  contact_id,
  customer_id,
  name,
  title,
  villain_designation,
  engagement_level,
  satisfaction,
  last_contact,
  is_evaluating_competitors,
  initiative_value
) VALUES (
  'aco-elena',
  'aco-001',
  'Dr. Elena Voss',
  'VP of Technical Operations',
  'Nightingale',
  'medium',
  'neutral',
  NULL, -- Sarah hasn't contacted her yet!
  true, -- She IS evaluating competitors
  1700000 -- Her initiative is worth $1.7M
);
```

**Acceptance Criteria**:
- [ ] Elena record links to Obsidian Black
- [ ] Villain designation: "Nightingale"
- [ ] Last contact is NULL (Sarah hasn't met her)
- [ ] Evaluating competitors = true (creates urgency)
- [ ] Initiative value = $1.7M (expansion opportunity)

**Estimated Time**: 15 minutes

---

### Task 2.4: Seed Operation Blackout (Failed Operation)
**File**: Same as Task 2.1

**Data to Insert**:
```sql
INSERT INTO demo_operations (
  operation_id,
  customer_id,
  name,
  status,
  failure_reason,
  cost_impact,
  quarter,
  date
) VALUES (
  'op-blackout',
  'aco-001',
  'Operation Blackout',
  'failed',
  'Platform latency caused 47-second delay in synchronized sequence',
  1500000,
  'Q4 2024',
  '2024-10-15'
);
```

**Additional Operations** (for context):
- Operation Nightfall (success, Q3 2024)
- Operation Crimson Dawn (success, Q2 2024)
- Operation Shadow Grid (in_progress, Q4 2024)

**Acceptance Criteria**:
- [ ] Operation Blackout marked as "failed"
- [ ] Cost impact = $850K (huge!)
- [ ] Failure reason clearly describes platform issue
- [ ] Date is recent enough to matter (Oct 2024)
- [ ] Additional operations show Obsidian Black's history

**Estimated Time**: 30 minutes

---

### Task 2.5: Seed Support Tickets (Ticket Spike)
**File**: Same as Task 2.1

**Data to Insert** (5 recent tickets):
```sql
INSERT INTO demo_support_tickets (ticket_id, customer_id, subject, category, priority, resolution_time_hours, sentiment, created_at) VALUES
('aco-4728', 'aco-001', 'Operative Smith cannot access Phase 3 coordination documents', 'permissions_error', 'high', 72, 'frustrated', '2025-01-05'),
('aco-4801', 'aco-001', 'Timezone conversion bug in Jakarta facility coordination', 'bug', 'medium', 48, 'frustrated', '2025-01-08'),
('aco-4823', 'aco-001', 'Performance degradation during peak operational hours', 'performance', 'high', NULL, 'frustrated', '2025-01-10'),
('aco-4856', 'aco-001', 'Integration with Operative Management System v8.2 failing', 'integration', 'high', NULL, 'frustrated', '2025-01-12'),
('aco-4891', 'aco-001', 'Dashboard not displaying real-time operational status', 'ux', 'medium', 24, 'neutral', '2025-01-14');
```

**Acceptance Criteria**:
- [ ] 5 tickets inserted for Obsidian Black
- [ ] Ticket subjects villain-themed but realistic
- [ ] 3+ tickets have "frustrated" sentiment
- [ ] Recent dates (past 2 weeks)
- [ ] Mix of priorities (high/medium)
- [ ] Some unresolved (resolution_time_hours = NULL)

**Estimated Time**: 45 minutes

---

### Task 2.6: Seed Contract Terms
**File**: Same as Task 2.1

**Data to Insert**:
```sql
INSERT INTO demo_contracts (
  contract_id,
  customer_id,
  start_date,
  end_date,
  arr,
  auto_renew,
  sla_uptime,
  status
) VALUES (
  'aco-contract-2025',
  'aco-001',
  '2025-04-15',
  '2026-04-15',
  1500000,
  false, -- Manual renewal required!
  99.5,
  'active'
);
```

**Acceptance Criteria**:
- [ ] Contract links to Obsidian Black
- [ ] Auto-renew = false (creates urgency!)
- [ ] SLA = 99.5% (which they failed to meet)
- [ ] End date = April 15, 2026 (143 days from demo date)
- [ ] Status = active

**Estimated Time**: 15 minutes

---

### Task 2.7: Seed Strategic Plan (Pre-populated for demo)
**File**: Same as Task 2.1

**Optional**: Pre-seed a strategic plan so Workflow 1 can load it (for demo continuity if workflow is re-run)

**Data Structure**:
```sql
INSERT INTO demo_strategic_plans (
  plan_id,
  customer_id,
  phase_1_tasks,
  phase_2_tasks,
  phase_3_tasks,
  success_probability,
  completed
) VALUES (
  'aco-plan-001',
  'aco-001',
  '[
    {"task": "Respond to Marcus email", "due": "Day 1", "status": "pending"},
    {"task": "Intro outreach to Elena", "due": "Day 3", "status": "pending"},
    {"task": "Schedule Marcus call", "due": "Day 5", "status": "pending"}
  ]'::jsonb,
  '[
    {"task": "Elena discovery call", "due": "Week 2", "status": "pending"},
    {"task": "Deliver Accountability Report", "due": "Week 3", "status": "pending"},
    {"task": "Propose dedicated liaison", "due": "Week 4", "status": "pending"},
    {"task": "Schedule Q1 QBR", "due": "Week 4", "status": "pending"}
  ]'::jsonb,
  '[
    {"task": "Demo timezone automation prototype", "due": "Month 2", "status": "pending"},
    {"task": "Expansion proposal presentation", "due": "Month 2", "status": "pending"},
    {"task": "Q1 QBR execution", "due": "Month 3", "status": "pending"},
    {"task": "Renewal negotiation kickoff", "due": "Month 3", "status": "pending"}
  ]'::jsonb,
  78.0,
  false
);
```

**Acceptance Criteria**:
- [ ] Plan links to Obsidian Black
- [ ] 3 phases with tasks in JSONB format
- [ ] Success probability = 78% (matches workflow)
- [ ] Completed = false initially
- [ ] Can be queried and displayed in artifacts

**Estimated Time**: 30 minutes

---

## Phase 3: Customer Context APIs (4-5 hours)

### Task 3.1: Build GET /api/customers/aco Endpoint
**File**: `src/app/api/customers/aco/route.ts` (or appropriate)

**Requirements**:
- Return full Obsidian Black profile
- Include: name, industry, operatives, facilities, ARR, renewal date, health/opportunity scores
- Response format: JSON

**Example Response**:
```json
{
  "customer_id": "aco-001",
  "name": "Obsidian Black",
  "industry": "Global Strategic Coordination Services",
  "operatives": 450,
  "facilities": 23,
  "arr": 1500000,
  "renewal_date": "2026-04-15",
  "days_to_renewal": 143,
  "health_score": 4.2,
  "opportunity_score": 8.7,
  "primary_contact": "Marcus Castellan"
}
```

**Acceptance Criteria**:
- [ ] Endpoint returns 200 OK
- [ ] Data matches seeded Obsidian Black record
- [ ] Days to renewal calculated dynamically
- [ ] Handles errors gracefully (404 if not found)
- [ ] CORS configured for frontend

**Estimated Time**: 45 minutes

---

### Task 3.2: Build GET /api/customers/aco/contacts Endpoint
**File**: `src/app/api/customers/aco/contacts/route.ts`

**Requirements**:
- Return Marcus + Elena contact records
- Include all fields (name, title, villain designation, satisfaction, etc.)

**Example Response**:
```json
{
  "contacts": [
    {
      "contact_id": "aco-marcus",
      "name": "Marcus Castellan",
      "title": "Chief Operating Officer",
      "villain_designation": "The Orchestrator",
      "engagement_level": "high",
      "satisfaction": "low",
      "last_contact": "2025-09-12",
      "days_since_contact": 90
    },
    {
      "contact_id": "aco-elena",
      "name": "Dr. Elena Voss",
      "title": "VP of Technical Operations",
      "villain_designation": "Nightingale",
      "engagement_level": "medium",
      "is_evaluating_competitors": true,
      "initiative_value": 1700000,
      "last_contact": null
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Returns both Marcus and Elena
- [ ] Days since contact calculated dynamically
- [ ] Elena shows NULL for last_contact (never contacted)
- [ ] Handles errors gracefully

**Estimated Time**: 45 minutes

---

### Task 3.3: Build GET /api/customers/aco/operations Endpoint
**File**: `src/app/api/customers/aco/operations/route.ts`

**Requirements**:
- Return all Obsidian Black operations (including Operation Blackout)
- Sort by date (most recent first)
- Include success/failure status

**Example Response**:
```json
{
  "operations": [
    {
      "operation_id": "op-blackout",
      "name": "Operation Blackout",
      "status": "failed",
      "failure_reason": "Platform latency caused 47-second delay",
      "cost_impact": 1500000,
      "quarter": "Q4 2024",
      "date": "2024-10-15"
    },
    {
      "operation_id": "op-nightfall",
      "name": "Operation Nightfall",
      "status": "success",
      "quarter": "Q3 2024",
      "date": "2024-07-22"
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Returns all operations chronologically
- [ ] Operation Blackout included with full details
- [ ] Failed operations clearly marked
- [ ] Cost impacts formatted as numbers

**Estimated Time**: 45 minutes

---

### Task 3.4: Build GET /api/customers/aco/health Endpoint
**File**: `src/app/api/customers/aco/health/route.ts`

**Requirements**:
- Return overall health score (4.2/10)
- Return component score breakdown
- Include AI-generated churn probability

**Example Response**:
```json
{
  "overall_health_score": 4.2,
  "component_scores": {
    "product_performance": 3.1,
    "relationship_strength": 4.8,
    "strategic_alignment": 5.2,
    "support_quality": 3.5,
    "executive_sponsorship": 6.0
  },
  "churn_probability": 68,
  "risk_level": "high",
  "ai_insight": "Obsidian Black experienced 3 critical service failures in past 12 months. Without intervention, renewal is unlikely."
}
```

**Acceptance Criteria**:
- [ ] Returns overall + component scores
- [ ] Churn probability calculated (68%)
- [ ] Risk level determined by health score
- [ ] AI insight is pre-written but contextual

**Estimated Time**: 1 hour

---

### Task 3.5: Build GET /api/customers/aco/tickets Endpoint
**File**: `src/app/api/customers/aco/tickets/route.ts`

**Requirements**:
- Return recent support tickets (past 2 weeks)
- Include sentiment analysis
- Sort by created date (most recent first)

**Example Response**:
```json
{
  "tickets": [
    {
      "ticket_id": "aco-4891",
      "subject": "Dashboard not displaying real-time status",
      "category": "ux",
      "priority": "medium",
      "sentiment": "neutral",
      "created_at": "2025-01-14",
      "resolution_time_hours": 24
    },
    ...
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
- [ ] Includes summary with spike detection
- [ ] Sentiment counts accurate
- [ ] Sorted by date (newest first)

**Estimated Time**: 1 hour

---

### Task 3.6: Build GET /api/customers/aco/opportunities Endpoint
**File**: `src/app/api/customers/aco/opportunities/route.ts`

**Requirements**:
- Return Elena's Global Synchronization Initiative
- Include expansion value, competitive threats, key requirements

**Example Response**:
```json
{
  "opportunities": [
    {
      "opportunity_id": "aco-opp-001",
      "name": "Global Synchronization Initiative",
      "sponsor": "Dr. Elena Voss",
      "value": 1700000,
      "status": "evaluating",
      "key_requirement": "Timezone-intelligent scheduling",
      "competitors_evaluating": ["VectorSync", "OmniCoord"],
      "urgency": "high",
      "ai_insight": "Elena's evaluation is driven by ONE feature: timezone automation. If Squelch commits to Q1 2026 delivery, you neutralize competitive threat."
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Returns Elena's initiative
- [ ] Value = $1.7M
- [ ] Competitors listed
- [ ] Key requirement noted (timezone automation)
- [ ] AI insight contextual

**Estimated Time**: 45 minutes

---

## Phase 4: Workflow State APIs (3-4 hours)

### Task 4.1: Build POST /api/workflows/start Endpoint
**File**: `src/app/api/workflows/start/route.ts`

**Requirements**:
- Initialize new workflow session
- Accept: customer_id, workflow_type
- Return: session_id, initial context

**Request Body**:
```json
{
  "customer_id": "aco-001",
  "workflow_type": "strategic_planning"
}
```

**Response**:
```json
{
  "session_id": "wf-session-123",
  "customer_id": "aco-001",
  "workflow_type": "strategic_planning",
  "current_step": 1,
  "total_steps": 5,
  "context": {
    "customer_name": "Obsidian Black",
    "health_score": 4.2
  }
}
```

**Acceptance Criteria**:
- [ ] Creates workflow_state record
- [ ] Returns unique session_id
- [ ] Includes customer context
- [ ] Handles duplicate requests gracefully

**Estimated Time**: 1 hour

---

### Task 4.2: Build PUT /api/workflows/{session_id}/step Endpoint
**File**: `src/app/api/workflows/[sessionId]/step/route.ts`

**Requirements**:
- Save workflow progress after each step
- Update current_step, save step data
- Return updated workflow state

**Request Body**:
```json
{
  "step": 2,
  "data": {
    "artifact": "contract_intelligence",
    "user_selections": {}
  }
}
```

**Response**:
```json
{
  "session_id": "wf-session-123",
  "current_step": 2,
  "total_steps": 5,
  "completed": false
}
```

**Acceptance Criteria**:
- [ ] Updates workflow_state record
- [ ] Saves step data as JSONB
- [ ] Returns updated state
- [ ] Handles invalid step numbers

**Estimated Time**: 1 hour

---

### Task 4.3: Build GET /api/workflows/{session_id}/context Endpoint
**File**: `src/app/api/workflows/[sessionId]/context/route.ts`

**Requirements**:
- Retrieve saved workflow state
- Include all step data
- Return customer context

**Response**:
```json
{
  "session_id": "wf-session-123",
  "customer_id": "aco-001",
  "workflow_type": "strategic_planning",
  "current_step": 3,
  "total_steps": 5,
  "completed": false,
  "data": {
    "step_1": {...},
    "step_2": {...}
  },
  "customer_context": {
    "name": "Obsidian Black",
    "health_score": 4.2
  }
}
```

**Acceptance Criteria**:
- [ ] Returns full workflow state
- [ ] Includes all saved step data
- [ ] Returns 404 if session not found
- [ ] Customer context included

**Estimated Time**: 45 minutes

---

### Task 4.4: Build POST /api/demo/reset Endpoint
**File**: `src/app/api/demo/reset/route.ts`

**Requirements**:
- Execute demo reset script (delete + re-seed)
- Return success confirmation
- Only accessible to demo users (auth check)

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
  "customer_id": "aco-001"
}
```

**Acceptance Criteria**:
- [ ] Calls reset_demo_data.sql script
- [ ] Returns success response
- [ ] Requires auth (only demo users)
- [ ] Handles errors gracefully (rollback on failure)
- [ ] Fast execution (< 3 seconds)

**Estimated Time**: 1 hour

---

## Phase 5: AI Insights (Mock Responses) (2-3 hours)

### Task 5.1: Build POST /api/ai/risk-analysis Endpoint
**File**: `src/app/api/ai/risk-analysis/route.ts`

**Requirements**:
- Accept customer_id
- Return pre-written risk analysis
- Can be swapped for real LLM later

**Request Body**:
```json
{
  "customer_id": "aco-001"
}
```

**Response**:
```json
{
  "overall_health_score": 4.2,
  "churn_probability": 68,
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
- [ ] Returns contextual risk analysis
- [ ] Pre-written but feels intelligent
- [ ] Specific to Obsidian Black situation
- [ ] Fast response (< 200ms)

**Estimated Time**: 45 minutes

---

### Task 5.2: Build POST /api/ai/opportunity-analysis Endpoint
**File**: `src/app/api/ai/opportunity-analysis/route.ts`

**Requirements**:
- Accept customer_id
- Return expansion opportunity analysis
- Pre-written but contextual

**Response**:
```json
{
  "opportunities": [
    {
      "name": "Global Synchronization Initiative",
      "sponsor": "Dr. Elena Voss",
      "value": 1700000,
      "probability": 65,
      "key_requirement": "Timezone-intelligent scheduling",
      "competitive_threat": "Elena reached out to VectorSync and OmniCoord"
    }
  ],
  "ai_insight": "Elena's evaluation is driven by ONE feature: timezone automation. If Squelch commits to Q1 2026 delivery, you neutralize the competitive threat and unlock $1.7M expansion.",
  "recommendation": "Introduce yourself to Elena within 3 days. Position as strategic partner, not vendor."
}
```

**Acceptance Criteria**:
- [ ] Returns opportunity data
- [ ] Contextual to Obsidian Black
- [ ] Includes actionable recommendations
- [ ] Fast response

**Estimated Time**: 45 minutes

---

### Task 5.3: Build POST /api/ai/email-draft Endpoint
**File**: `src/app/api/ai/email-draft/route.ts`

**Requirements**:
- Accept: recipient, context, purpose
- Return: pre-written email template
- Personalized to recipient (Marcus vs Elena)

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

**Acceptance Criteria**:
- [ ] Returns email draft
- [ ] Tone appropriate for recipient
- [ ] Contextual to Obsidian Black situation
- [ ] Professional, not campy
- [ ] Different templates for Marcus vs Elena

**Estimated Time**: 1 hour

---

## Coordination with Frontend

### Data Contracts FE Expects

Frontend will call these endpoints (ensure response formats match):

1. `GET /api/customers/aco` → Customer profile
2. `GET /api/customers/aco/contacts` → Marcus + Elena
3. `GET /api/customers/aco/operations` → Operation history
4. `GET /api/customers/aco/health` → Risk scores
5. `GET /api/customers/aco/tickets` → Support tickets
6. `GET /api/customers/aco/opportunities` → Elena's initiative
7. `POST /api/workflows/start` → Initialize workflow
8. `PUT /api/workflows/{id}/step` → Save progress
9. `GET /api/workflows/{id}/context` → Retrieve state
10. `POST /api/demo/reset` → Reset demo data
11. `POST /api/ai/risk-analysis` → Risk insights
12. `POST /api/ai/opportunity-analysis` → Opportunity insights
13. `POST /api/ai/email-draft` → Email templates

**API Documentation**:
- Document all endpoints in `docs/planning/API-CONTRACT.md` (if not already)
- Share response examples with FE
- Coordinate on error handling

---

## Definition of Done (BE Tasks)

### Phase 1: Schema
- [ ] Database migrations run successfully
- [ ] All 7 tables created
- [ ] Demo reset script functional
- [ ] Schema documented

### Phase 2: Seeding
- [ ] Obsidian Black organization seeded
- [ ] Marcus + Elena contacts seeded
- [ ] Operation Blackout + history seeded
- [ ] 5 support tickets seeded (frustrated themes)
- [ ] Contract terms seeded (auto-renew = false)
- [ ] Strategic plan template seeded
- [ ] All seed data realistic and compelling

### Phase 3: Customer APIs
- [ ] All 6 customer context endpoints functional
- [ ] Response formats match FE expectations
- [ ] Error handling implemented
- [ ] Performance acceptable (< 500ms per request)

### Phase 4: Workflow APIs
- [ ] Workflow session management works
- [ ] Step progress saves correctly
- [ ] Context retrieval functional
- [ ] Demo reset endpoint triggers full reset

### Phase 5: AI APIs
- [ ] Risk analysis returns contextual insights
- [ ] Opportunity analysis returns Elena data
- [ ] Email drafting returns professional templates
- [ ] All responses feel intelligent (not generic)

### Integration
- [ ] FE can fetch all required data
- [ ] Demo reset clears all state
- [ ] Workflow state persists across sessions
- [ ] No CORS issues
- [ ] Justin approves the implementation

---

## Time Estimates Summary

| Phase | Tasks | Estimated Hours |
|-------|-------|----------------|
| Phase 1: Schema | 2 tasks | 2-3 hours |
| Phase 2: Seeding | 7 tasks | 3-4 hours |
| Phase 3: Customer APIs | 6 tasks | 4-5 hours |
| Phase 4: Workflow APIs | 4 tasks | 3-4 hours |
| Phase 5: AI APIs | 3 tasks | 2-3 hours |
| **TOTAL** | **22 tasks** | **14-19 hours** |

---

## Questions for PM

1. **Real LLM Integration**: When should we swap mock AI responses for real LLM calls? (Phase 2? Later?)
2. **Database**: Are we extending existing tables or creating new demo-specific tables?
3. **Auth**: Should demo reset require special permissions, or allow any logged-in user?
4. **Performance**: Any caching strategy for customer context APIs?
5. **Monitoring**: Should we log demo resets for analytics?

---

**Ready to start? Read `BE_START_HERE.md` for onboarding, then begin with Phase 1!**

**Questions? Ask PM before starting.**
