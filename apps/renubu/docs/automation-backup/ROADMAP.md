# Workflow Automation System - Product Roadmap

**Repository:** `renubu/automation/`
**Status:** Phase 1 Complete (Algorithm Foundation)
**Version:** 1.0
**Last Updated:** October 2025

---

## Executive Summary

### Vision

Build a **standalone workflow automation system** that generates intelligent, prioritized workflow assignments for Customer Success Managers (CSMs). This system operates **independently** of the existing chat workflow, task mode, artifact system, and dynamic task mode - ensuring clean separation of concerns.

**End State:** CSMs open their dashboard and immediately see ranked workflows automatically selected based on:
- Customer renewal stage
- Account plan (invest/expand/manage/monitor)
- Account value (ARR)
- Risk/opportunity scores
- CSM workload and experience level

No manual template selection. No guesswork. Data-driven workflow assignments that optimize for customer outcomes and team capacity.

### Current State (Phase 1 Complete ✅)

We've built the **algorithm foundation** - the "brain" that determines which workflows customers need and ranks them by priority:

**Core Modules:**
- ✅ `workflow-types.js` - Type system and data structures
- ✅ `workflow-data-access.js` - Database query layer
- ✅ `workflow-determination.js` - Business rules engine (which workflows apply)
- ✅ `workflow-scoring.js` - Priority scoring algorithm (how to rank workflows)
- ✅ `workflow-orchestrator.js` - Orchestration layer (ties everything together)
- ✅ `demo-workflow-system.js` - End-to-end demonstration

**Testing:**
- ✅ 159 tests passing (100% pass rate)
- ✅ All tests run against real SQLite database
- ✅ Validation for edge cases, null handling, multi-workflow scenarios

**Documentation:**
- ✅ WORKFLOW-ALGORITHM-GUIDE.md (16KB comprehensive configuration guide)
- ✅ Git repository initialized with detailed commit history

**What's Working:**
1. System analyzes customers and determines which workflows they need (renewal/strategic/opportunity/risk)
2. Calculates priority scores using multi-factor algorithm (ARR, stage urgency, account plan, CSM workload)
3. Generates sorted workflow queues per CSM
4. All configuration is flexible and database-ready (no hard-coding)
5. Transparent scoring with factor breakdowns

**What's Missing:**
- ❌ No database tables for configuration (currently in JS objects)
- ❌ No admin UI for rule management
- ❌ No CSM dashboard to view workflow queue
- ❌ No workflow execution engine (templates exist but aren't connected)
- ❌ No API layer for frontend integration
- ❌ Not integrated with main `renubu/` application yet

---

## System Architecture

### 4 Workflow Types

| Type | Trigger Condition | Status |
|------|------------------|--------|
| **Renewal** | Customer has active renewal | ✅ Fully implemented (9 stages) |
| **Strategic** | Account plan = invest/expand | ⚠️ Algorithm works, templates pending |
| **Opportunity** | opportunity_score ≥ 70 | ⚠️ Future (scores not in DB yet) |
| **Risk** | risk_score ≥ 60 | ⚠️ Future (scores not in DB yet) |

### 9 Renewal Stages

| Stage | Days Until Renewal | Template File | Urgency Score |
|-------|-------------------|---------------|---------------|
| Overdue | < 0 | `renewal-configs/0-Overdue.ts` | 100 |
| Emergency | 0-6 | `renewal-configs/1-Emergency.ts` | 90 |
| Critical | 7-13 | `renewal-configs/2-Critical.ts` | 80 |
| Signature | 14-29 | `renewal-configs/3-Signature.ts` | 70 |
| Finalize | 30-59 | `renewal-configs/4-Finalize.ts` | 60 |
| Negotiate | 60-89 | `renewal-configs/5-Negotiate.ts` | 50 |
| Engage | 90-119 | `renewal-configs/6-Engage.ts` | 40 |
| Prepare | 120-179 | `renewal-configs/7-Prepare.ts` | 30 |
| Monitor | 180+ | `renewal-configs/8-Monitor.ts` | 20 |

### Priority Scoring Formula

```
Total Score = ((Base Score + Stage Bonus) × ARR Multiplier × Account Plan Multiplier × Experience Multiplier) + Workload Penalty
```

**Example:**
- Customer: cloudnine.io ($180k ARR, Emergency stage, invest plan)
- CSM: Sarah (senior, 5 active workflows)
- Calculation: `((90 + 15) × 2.0 × 1.5 × 1.1) - 10 = 337 points`

### Current Tech Stack

- **Language:** JavaScript (Node.js) + TypeScript (future integration)
- **Database:** SQLite (`renubu-test.db`) with 10 seeded customers
- **ORM:** None - using `better-sqlite3` directly
- **Testing:** Custom test runner with real database
- **Documentation:** Markdown

---

## Phase 2 Roadmap: Configuration UI & Management

### Goal

Move from "code-based configuration" to "database-driven configuration with admin UI" so non-technical users can modify workflow rules without deployments.

### Priority 1: Database Schema for Configuration ⭐⭐⭐

**Objective:** Move all configuration from JavaScript objects to database tables.

#### New Tables

```sql
-- 1. Workflow determination rules (which workflows apply)
CREATE TABLE workflow_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT,  -- NULL = global rule for all companies
  workflow_type TEXT NOT NULL,  -- 'renewal' | 'strategic' | 'opportunity' | 'risk'
  rule_type TEXT NOT NULL,  -- 'account_plan' | 'score_threshold' | 'field_exists'
  field_name TEXT,  -- e.g., 'account_plan', 'opportunity_score', 'renewal_id'
  operator TEXT,  -- 'equals' | 'gte' | 'lte' | 'in' | 'exists'
  value TEXT,  -- JSON-encoded value (e.g., '["invest","expand"]' or '70')
  active BOOLEAN DEFAULT 1,
  priority INTEGER DEFAULT 0,  -- execution order
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Scoring configuration (how to calculate priority)
CREATE TABLE scoring_config (
  id TEXT PRIMARY KEY,
  company_id TEXT,  -- NULL = global config
  config_key TEXT NOT NULL,  -- e.g., 'arr_breakpoints', 'renewal_stage_urgency'
  config_value TEXT NOT NULL,  -- JSON-encoded value
  config_type TEXT NOT NULL,  -- 'number' | 'object' | 'array'
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Workflow templates (connects workflows to task templates)
CREATE TABLE workflow_templates (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL,
  workflow_subtype TEXT,  -- e.g., 'Overdue', 'Emergency' for renewals
  template_name TEXT NOT NULL,
  template_content TEXT,  -- JSON or markdown content
  variables TEXT,  -- JSON array of variable names
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Workflow execution history
CREATE TABLE workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  assigned_to TEXT NOT NULL,  -- CSM user_id
  workflow_type TEXT NOT NULL,
  priority_score INTEGER,
  priority_factors TEXT,  -- JSON breakdown
  status TEXT DEFAULT 'pending',  -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Configuration audit log
CREATE TABLE config_audit_log (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,  -- 'created' | 'updated' | 'deleted'
  old_value TEXT,  -- JSON
  new_value TEXT,  -- JSON
  changed_by TEXT,  -- user_id
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Migration Strategy:**
1. Create schema in `schema-v2.sql`
2. Write migration script `migrate-config-to-db.js` to populate tables from current JS config
3. Update modules to read from database instead of hardcoded objects
4. Add fallback to JS config if database is empty (backward compatibility)

**Files to Modify:**
- `workflow-determination.js` - read from `workflow_rules` table
- `workflow-scoring.js` - read from `scoring_config` table
- `workflow-orchestrator.js` - add config loading at startup

**Estimated Time:** 2-3 days

---

### Priority 2: Configuration Management API ⭐⭐⭐

**Objective:** Create REST API for managing workflow configuration.

#### API Endpoints

```javascript
// Workflow Rules Management
GET    /api/workflow-rules              // List all rules
GET    /api/workflow-rules/:id          // Get specific rule
POST   /api/workflow-rules              // Create new rule
PUT    /api/workflow-rules/:id          // Update rule
DELETE /api/workflow-rules/:id          // Delete rule
POST   /api/workflow-rules/validate     // Validate rule before saving

// Scoring Configuration Management
GET    /api/scoring-config              // List all scoring configs
GET    /api/scoring-config/:key         // Get specific config
PUT    /api/scoring-config/:key         // Update config
POST   /api/scoring-config/reset        // Reset to defaults

// Workflow Queue (for CSM dashboard)
GET    /api/workflows/queue/:csmId      // Get CSM's workflow queue
GET    /api/workflows/company/:companyId // Get company-wide workflows
POST   /api/workflows/generate          // Manually trigger workflow generation
GET    /api/workflows/:id               // Get specific workflow details

// Workflow Execution
POST   /api/workflows/:id/start         // Mark workflow as started
POST   /api/workflows/:id/complete      // Mark workflow as completed
POST   /api/workflows/:id/cancel        // Cancel workflow

// Analytics & Reporting
GET    /api/analytics/workflows         // Workflow statistics
GET    /api/analytics/csm/:csmId        // CSM performance metrics
GET    /api/analytics/customer/:customerId // Customer workflow history

// Configuration Testing
POST   /api/test/scoring                // Test scoring with sample data
POST   /api/test/determination          // Test determination rules
```

#### Implementation Options

**Option A: Express.js Server (Current)**
- Extend existing `server.js` (currently serves static files)
- Add API routes
- Pros: Already have Express setup, easy to add
- Cons: Need to add authentication, input validation

**Option B: Separate API Service**
- New `api-server.js` file
- Runs on different port (e.g., 3001)
- Pros: Clean separation, easier to scale
- Cons: More infrastructure

**Recommendation:** Option A (extend current server.js) for MVP.

**Files to Create:**
- `api/routes/workflow-rules.js`
- `api/routes/scoring-config.js`
- `api/routes/workflows.js`
- `api/routes/analytics.js`
- `api/middleware/auth.js`
- `api/middleware/validation.js`

**Estimated Time:** 3-4 days

---

### Priority 3: Admin UI for Configuration Management ⭐⭐⭐

**Objective:** Build web interface for managing workflow rules and scoring configuration.

#### UI Screens

**1. Dashboard / Overview**
```
┌────────────────────────────────────────────────────────────┐
│  🎯 Workflow Configuration Admin                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📊 System Status                                          │
│  ├─ Active Workflows: 42                                   │
│  ├─ Pending Workflows: 18                                  │
│  ├─ Completed Today: 12                                    │
│  └─ CSMs Active: 8                                         │
│                                                            │
│  ⚙️  Quick Links                                           │
│  ├─ [Workflow Rules]                                       │
│  ├─ [Scoring Configuration]                                │
│  ├─ [Templates]                                            │
│  └─ [Analytics]                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**2. Workflow Rules Screen**
```
┌────────────────────────────────────────────────────────────┐
│  📋 Workflow Determination Rules          [+ Add New Rule] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Renewal Workflows                          [Edit] [Test]  │
│  └─ Trigger: renewal_id EXISTS OR renewal_date IS FUTURE  │
│     Status: ✅ Active                                      │
│                                                            │
│  Strategic Workflows                        [Edit] [Test]  │
│  └─ Trigger: account_plan IN ['invest', 'expand']         │
│     Status: ✅ Active                                      │
│                                                            │
│  Opportunity Workflows                      [Edit] [Test]  │
│  └─ Trigger: opportunity_score >= 70                       │
│     Status: ⚠️  Inactive (scores not available)           │
│                                                            │
│  Risk Workflows                             [Edit] [Test]  │
│  └─ Trigger: risk_score >= 60                              │
│     Status: ⚠️  Inactive (scores not available)           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**3. Scoring Configuration Screen**
```
┌────────────────────────────────────────────────────────────┐
│  🎯 Workflow Scoring Configuration        [Save] [Reset]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  💰 ARR-Based Scoring                                      │
│  ├─ High Threshold:  [$150,000] → Multiplier: [2.0x]      │
│  └─ Medium Threshold: [$100,000] → Multiplier: [1.5x]     │
│                                                            │
│  ⏰ Renewal Stage Urgency                                  │
│  ├─ Overdue:   [100] ████████████████████ Max             │
│  ├─ Emergency: [ 90] ██████████████████░░                 │
│  ├─ Critical:  [ 80] ████████████████░░░░                 │
│  ├─ Signature: [ 70] ██████████████░░░░░░                 │
│  ├─ Finalize:  [ 60] ████████████░░░░░░░░                 │
│  ├─ Negotiate: [ 50] ██████████░░░░░░░░░░                 │
│  ├─ Engage:    [ 40] ████████░░░░░░░░░░░░                 │
│  ├─ Prepare:   [ 30] ██████░░░░░░░░░░░░░░                 │
│  └─ Monitor:   [ 20] ████░░░░░░░░░░░░░░░░                 │
│                                                            │
│  📊 Account Plan Multipliers                               │
│  ├─ invest:  [1.5x]                                        │
│  ├─ expand:  [1.3x]                                        │
│  ├─ manage:  [1.0x]                                        │
│  └─ monitor: [0.8x]                                        │
│                                                            │
│  👥 User Context                                           │
│  ├─ Workload Penalty: [2] points per workflow             │
│  └─ Experience Multipliers:                                │
│      • expert:  [1.2x]                                     │
│      • senior:  [1.1x]                                     │
│      • mid:     [1.0x]                                     │
│      • junior:  [0.9x]                                     │
│                                                            │
│  [Test Configuration] [View Impact Preview]                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**4. Template Management Screen**
```
┌────────────────────────────────────────────────────────────┐
│  📝 Workflow Templates                    [+ Create New]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🔄 Renewal Templates (9)                                  │
│  ├─ 0-Overdue.ts      [Edit] [Preview] [Test]             │
│  ├─ 1-Emergency.ts    [Edit] [Preview] [Test]             │
│  ├─ 2-Critical.ts     [Edit] [Preview] [Test]             │
│  └─ ... (6 more)                                           │
│                                                            │
│  🎯 Strategic Templates (2)                                │
│  ├─ strategic-invest  ⚠️  Placeholder                      │
│  └─ strategic-expand  ⚠️  Placeholder                      │
│                                                            │
│  💡 Opportunity Templates (1)                              │
│  └─ opportunity-upsell ⚠️  Placeholder                     │
│                                                            │
│  ⚡ Risk Templates (1)                                     │
│  └─ risk-intervention  ⚠️  Placeholder                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**5. Test & Preview Screen**
```
┌────────────────────────────────────────────────────────────┐
│  🧪 Test Configuration                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Enter test customer data:                                 │
│                                                            │
│  Domain:          [acme.com                              ] │
│  ARR:             [$125,000                              ] │
│  Account Plan:    [invest ▼]                               │
│  Renewal Date:    [2025-12-15                            ] │
│  Days Until:      [68 days] (calculated)                   │
│  Renewal Stage:   [Negotiate] (calculated)                 │
│                                                            │
│  CSM Context (optional):                                   │
│  Experience:      [senior ▼]                               │
│  Current Workload: [8 workflows]                           │
│                                                            │
│  [Run Test]                                                │
│                                                            │
│  Results:                                                  │
│  ├─ ✅ Renewal workflow: 98 points                         │
│  │   Formula: ((50 + 10) × 1.5 × 1.5 × 1.1) - 16 = 98    │
│  │                                                         │
│  └─ ✅ Strategic workflow: 84 points                       │
│      Formula: (70 × 1.5 × 1.5 × 1.1) - 16 = 84            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### Technology Choices

**Option A: React SPA**
- Pros: Rich interactions, component reusability, modern
- Cons: Build complexity, need bundler (Webpack/Vite)

**Option B: Vanilla JS + HTML**
- Pros: Simple, no build step, easy to understand
- Cons: More manual DOM manipulation

**Option C: Vue.js (lightweight)**
- Pros: Progressive, easier learning curve than React
- Cons: Another framework to learn

**Recommendation:** Option A (React) if team has React experience, otherwise Option C (Vue.js) for faster development.

**Files to Create:**
```
public/admin/
├── index.html
├── dashboard.html
├── workflow-rules.html
├── scoring-config.html
├── templates.html
├── analytics.html
├── css/
│   ├── admin.css
│   └── components.css
└── js/
    ├── api-client.js
    ├── components/
    │   ├── rule-editor.js
    │   ├── score-slider.js
    │   ├── test-panel.js
    │   └── analytics-chart.js
    └── pages/
        ├── dashboard.js
        ├── rules.js
        ├── scoring.js
        └── templates.js
```

**Estimated Time:** 5-7 days

---

### Priority 4: CSM Dashboard (Workflow Queue UI) ⭐⭐

**Objective:** Build interface for CSMs to view and work their prioritized workflow queue.

#### UI Mockup

```
┌────────────────────────────────────────────────────────────┐
│  👤 Sarah Johnson - Workflow Queue                         │
│  📊 8 active workflows  |  2 completed today               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🔴 HIGH PRIORITY (3)                                      │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 1. cloudnine.io                         [337 pts] 🔥│  │
│  │    🔄 Renewal - Emergency (3 days until renewal)    │  │
│  │    💰 $180k ARR  |  🎯 invest plan                  │  │
│  │    [Start Workflow] [View Details] [Snooze]         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 2. streamlinetech.com                   [210 pts]   │  │
│  │    🎯 Strategic - Expansion Strategy                │  │
│  │    💰 $250k ARR  |  🎯 expand plan                  │  │
│  │    [Start Workflow] [View Details] [Snooze]         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  🟡 MEDIUM PRIORITY (3)                                    │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 3. nexgensoft.com                       [98 pts]    │  │
│  │    🔄 Renewal - Negotiate (68 days until renewal)   │  │
│  │    💰 $125k ARR  |  🎯 manage plan                  │  │
│  │    [Start Workflow] [View Details] [Snooze]         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  🟢 LOW PRIORITY (2)                                       │
│  ... (collapsed, click to expand)                          │
│                                                            │
│  [Filters ▼] [Sort ▼] [Export to CSV]                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time workflow queue updates
- Priority-based grouping (high/medium/low)
- Quick actions (start, snooze, complete)
- Filtering (by type, ARR range, urgency)
- Workflow details panel (scoring breakdown, customer context)
- Progress tracking

**Files to Create:**
```
public/dashboard/
├── index.html
├── workflow-detail.html
├── css/
│   └── dashboard.css
└── js/
    ├── workflow-queue.js
    ├── workflow-detail.js
    └── notifications.js
```

**Estimated Time:** 4-5 days

---

## Phase 3 Roadmap: Workflow Execution & Integration

### Priority 5: Workflow Execution Engine ⭐⭐

**Objective:** Connect workflow system to task mode templates for actual execution.

#### Integration Points

```
Workflow Assignment → Task Template → TaskModeAdvanced → Execution
```

**Key Questions to Answer:**
1. How do workflow templates map to existing task mode templates?
2. Should workflows generate task artifacts, or run inline?
3. How do we inject customer data into task templates?
4. What happens when a workflow is completed?
5. How do we track partial progress?

**Files to Create:**
- `workflow-executor.js` - orchestrates workflow execution
- `template-engine.js` - injects variables into templates
- `task-connector.js` - bridges to TaskModeAdvanced

**Estimated Time:** 5-7 days

---

### Priority 6: Real-Time Updates & Notifications ⭐

**Objective:** Push workflow updates to CSM dashboard in real-time.

**Technology Options:**
- WebSockets (Socket.io)
- Server-Sent Events (SSE)
- Polling (fallback)

**Features:**
- New workflow notifications
- Priority changes
- Workflow completion alerts
- Team updates (other CSMs completing workflows)

**Estimated Time:** 2-3 days

---

### Priority 7: Analytics & Reporting ⭐

**Objective:** Provide insights into workflow system performance.

**Reports:**
- Workflow completion rates by CSM
- Average time to complete by workflow type
- Priority score distribution
- Customer engagement metrics
- Bottleneck identification

**Charts:**
- Workflow volume over time
- Priority heatmap
- CSM workload distribution
- Completion trends

**Estimated Time:** 3-4 days

---

### Priority 8: Integration with Main Renubu App

**Objective:** Merge automation system into main `renubu/` codebase.

**Strategy:**
1. Keep automation as separate module in `renubu/lib/workflows/`
2. Import workflows into main Next.js app
3. Add workflow routes to main API
4. Embed CSM dashboard into main UI
5. Share authentication/authorization
6. Migrate from SQLite to production database (Supabase)

**Considerations:**
- Database migration (SQLite → Supabase)
- Authentication integration
- Multi-tenancy support
- Performance at scale

**Estimated Time:** 7-10 days

---

## Technical Debt & Future Enhancements

### Code Quality
- [ ] Add TypeScript for all modules (currently JS)
- [ ] Add JSDoc comments to all functions
- [ ] Improve error handling and logging
- [ ] Add input validation middleware

### Testing
- [ ] Add unit tests (Jest)
- [ ] Add integration tests (API endpoints)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Add performance tests

### Features
- [ ] Multi-tenancy (company-specific configs)
- [ ] Role-based access control (admin/manager/CSM)
- [ ] Workflow templates with rich variables
- [ ] A/B testing different scoring configurations
- [ ] Machine learning for score optimization
- [ ] Mobile-responsive dashboard
- [ ] Slack/email notifications
- [ ] Calendar integration (Google/Outlook)

### Performance
- [ ] Cache workflow queues (Redis)
- [ ] Optimize database queries (indexes)
- [ ] Background job processing (Bull/Agenda)
- [ ] Rate limiting on API

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture diagrams
- [ ] Video tutorials for admins
- [ ] CSM user guide

---

## Development Workflow

### Branching Strategy

```
main (production-ready)
├── develop (integration branch)
    ├── feature/database-schema
    ├── feature/config-api
    ├── feature/admin-ui
    ├── feature/csm-dashboard
    └── feature/workflow-execution
```

### Release Process

1. Complete feature branch
2. Run full test suite
3. Manual testing
4. Code review
5. Merge to `develop`
6. Integration testing on `develop`
7. Merge to `main` when stable
8. Tag release (v1.1.0, v1.2.0, etc.)

### Version Numbering

- **v1.0:** Algorithm foundation (current)
- **v1.1:** Database schema + config API
- **v1.2:** Admin UI
- **v1.3:** CSM dashboard
- **v2.0:** Workflow execution + integration
- **v2.1:** Analytics & reporting
- **v3.0:** Production deployment in main renubu app

---

## Next Steps (Immediate)

Based on priority and dependencies, here's the recommended order:

### Week 1-2: Database Foundation
1. ✅ Create `schema-v2.sql` with all new tables
2. ✅ Write migration script `migrate-config-to-db.js`
3. ✅ Update `workflow-determination.js` to read from database
4. ✅ Update `workflow-scoring.js` to read from database
5. ✅ Add fallback to JS config (backward compatibility)
6. ✅ Test with existing test suite (ensure 159 tests still pass)

### Week 3-4: API Layer
1. ✅ Extend `server.js` with API routes
2. ✅ Implement workflow rules CRUD endpoints
3. ✅ Implement scoring config CRUD endpoints
4. ✅ Implement workflow queue endpoints
5. ✅ Add authentication middleware
6. ✅ Add input validation middleware
7. ✅ Write API tests

### Week 5-7: Admin UI
1. ✅ Build dashboard overview page
2. ✅ Build workflow rules management screen
3. ✅ Build scoring configuration screen
4. ✅ Build test & preview functionality
5. ✅ Add form validation
6. ✅ Add loading states and error handling

### Week 8-10: CSM Dashboard
1. ✅ Build workflow queue page
2. ✅ Build workflow detail panel
3. ✅ Add filtering and sorting
4. ✅ Add quick actions (start/complete/snooze)
5. ✅ Add real-time updates (optional)

---

## Success Metrics

### Phase 2 (Configuration UI)
- [ ] Non-technical users can modify workflow rules
- [ ] Configuration changes take effect immediately (no code deployment)
- [ ] Test tool shows accurate predictions
- [ ] Admin UI is intuitive (< 5 min to learn)

### Phase 3 (Execution & Integration)
- [ ] CSMs use dashboard daily
- [ ] Workflow completion rate > 80%
- [ ] Average workflow start time < 1 hour
- [ ] CSM satisfaction score > 4/5
- [ ] System handles 1000+ workflows/day

---

## Long-Term Vision (6-12 Months)

### Intelligent Workflow System
- Machine learning predicts optimal workflow timing
- Auto-generates workflow templates based on historical data
- Recommends actions based on customer patterns
- Integrates with CRM (Salesforce, HubSpot)
- Predictive analytics for customer churn

### Multi-Product Support
- Expand beyond renewals (onboarding, expansion, churn prevention)
- Industry-specific workflow templates
- Customizable workflow builder (drag-and-drop)

### Enterprise Features
- Multi-company support (white-label)
- Advanced RBAC (roles/permissions)
- API for third-party integrations
- Webhook support
- SLA tracking and enforcement

---

## Questions for Product Direction

Before proceeding with Phase 2, we should align on:

1. **UI Framework:** React, Vue, or vanilla JS for admin UI?
2. **Authentication:** Build custom or integrate with existing auth system?
3. **Database:** Stay with SQLite for dev, or move to Supabase now?
4. **Deployment:** Where will this run in production? (Vercel, AWS, self-hosted?)
5. **Timeline:** What's the target date for v2.0 (workflow execution)?
6. **Team:** Who will work on frontend vs backend?
7. **Design System:** Use existing renubu UI components or build new?

---

## Conclusion

**Current Status:** ✅ Phase 1 Complete - Algorithm foundation is solid and tested.

**Recommended Next Phase:** Priority 1-3 (Database Schema → API → Admin UI)

**Estimated Timeline:** 6-8 weeks for Phase 2 completion

**Key Milestone:** Non-technical users can manage workflow configuration through UI without touching code.

---

**Last Updated:** October 7, 2025
**Document Owner:** Product/Engineering Team
**Status:** Living Document (update as priorities shift)
