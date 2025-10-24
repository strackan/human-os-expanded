# Next Steps - Phase 2 Implementation

**Current Status:** ✅ Phase 1 Complete (Algorithm Foundation)
**Next Phase:** Configuration UI & Database-Driven Rules
**Target Timeline:** 6-8 weeks
**Goal:** Non-technical users can manage workflow configuration without editing code

---

## Overview: What We're Building

Transform the workflow system from **code-configured** to **UI-configured**:

**Before (Current):**
```javascript
// To change rules, edit workflow-determination.js:
const WORKFLOW_THRESHOLDS = {
  strategic_account_plans: ['invest', 'expand']  // ← change here
};
```

**After (Phase 2):**
```
Admin opens browser → Configuration UI → Changes rule → Clicks Save → Done
Rules stored in database, no code deployment needed
```

---

## The 3 Big Pieces

### 1. Database Schema (Week 1-2)
Move configuration from JS objects to database tables

### 2. REST API (Week 3-4)
Build API for managing configuration

### 3. Admin UI (Week 5-7)
Build web interface for non-technical users

---

## Detailed Implementation Plan

### 📊 Task 1: Database Schema (Week 1-2)

**Goal:** Create tables to store all configuration currently in JS objects

#### Subtasks

**1.1 Design Schema (Day 1)**
- [ ] Review current `WORKFLOW_THRESHOLDS` and `SCORING_CONFIG` objects
- [ ] Design `workflow_rules` table structure
- [ ] Design `scoring_config` table structure
- [ ] Design `workflow_templates` table structure
- [ ] Design `workflow_executions` table (for history tracking)
- [ ] Design `config_audit_log` table (for change tracking)

**1.2 Create Schema File (Day 1)**
- [ ] Create `schema-v2.sql` with all new tables
- [ ] Add indexes for performance
- [ ] Add constraints and foreign keys
- [ ] Document each table with comments

**1.3 Write Migration Script (Day 2-3)**
- [ ] Create `migrate-config-to-db.js`
- [ ] Migrate `WORKFLOW_THRESHOLDS` → `workflow_rules` table
- [ ] Migrate `SCORING_CONFIG` → `scoring_config` table
- [ ] Seed with default values from current JS config
- [ ] Test migration on fresh database

**1.4 Update Data Access Layer (Day 4-5)**
- [ ] Create `config-data-access.js`
- [ ] Add `loadWorkflowRules()` function
- [ ] Add `loadScoringConfig()` function
- [ ] Add `saveWorkflowRule()` function
- [ ] Add `saveScoringConfig()` function

**1.5 Update Core Modules (Day 6-8)**
- [ ] Modify `workflow-determination.js` to read from database
- [ ] Modify `workflow-scoring.js` to read from database
- [ ] Add fallback to hardcoded config if database empty
- [ ] Add config caching (refresh every 5 minutes)
- [ ] Test with existing test suite (ensure 159 tests still pass)

**1.6 Write New Tests (Day 9-10)**
- [ ] Create `test-config-data-access.js`
- [ ] Test loading config from database
- [ ] Test saving config to database
- [ ] Test cache invalidation
- [ ] Test fallback to hardcoded config

**Deliverable:** Database schema + migration + modules reading from DB

---

### 🔌 Task 2: REST API (Week 3-4)

**Goal:** Build API endpoints for managing configuration

#### Subtasks

**2.1 API Architecture (Day 1)**
- [ ] Design API route structure
- [ ] Define request/response schemas
- [ ] Plan error handling approach
- [ ] Design authentication strategy

**2.2 Set Up API Infrastructure (Day 2)**
- [ ] Extend `server.js` with API routes
- [ ] Add body parser middleware
- [ ] Add CORS middleware
- [ ] Add error handling middleware
- [ ] Add request logging

**2.3 Workflow Rules API (Day 3-4)**
- [ ] `GET /api/workflow-rules` - list all rules
- [ ] `GET /api/workflow-rules/:id` - get specific rule
- [ ] `POST /api/workflow-rules` - create new rule
- [ ] `PUT /api/workflow-rules/:id` - update rule
- [ ] `DELETE /api/workflow-rules/:id` - delete rule
- [ ] Add input validation
- [ ] Add error responses

**2.4 Scoring Config API (Day 5-6)**
- [ ] `GET /api/scoring-config` - list all configs
- [ ] `GET /api/scoring-config/:key` - get specific config
- [ ] `PUT /api/scoring-config/:key` - update config
- [ ] `POST /api/scoring-config/reset` - reset to defaults
- [ ] Add input validation
- [ ] Add error responses

**2.5 Workflow Queue API (Day 7-8)**
- [ ] `GET /api/workflows/queue/:csmId` - get CSM queue
- [ ] `GET /api/workflows/company/:companyId` - get company workflows
- [ ] `POST /api/workflows/generate` - manually trigger generation
- [ ] `GET /api/workflows/:id` - get workflow details
- [ ] Add pagination support

**2.6 Testing API (Day 9)**
- [ ] `POST /api/test/scoring` - test scoring with sample data
- [ ] `POST /api/test/determination` - test determination rules
- [ ] Returns predicted workflows and scores

**2.7 API Testing (Day 10)**
- [ ] Create `test-api.js` with API tests
- [ ] Test all CRUD operations
- [ ] Test error cases (invalid input, not found, etc.)
- [ ] Test authentication (if implemented)

**Deliverable:** Working REST API with full CRUD for configuration

---

### 🎨 Task 3: Admin UI (Week 5-7)

**Goal:** Build web interface for managing workflow configuration

#### Subtasks

**3.1 UI Architecture & Design (Day 1-2)**
- [ ] Choose framework (React, Vue, or vanilla JS)
- [ ] Design component structure
- [ ] Create mockups/wireframes for key screens
- [ ] Define color scheme and styling approach
- [ ] Plan API client layer

**3.2 Set Up Frontend Build (Day 3)**
- [ ] Set up build tooling (Vite, Webpack, or none)
- [ ] Create directory structure in `public/admin/`
- [ ] Set up CSS architecture
- [ ] Create API client wrapper (`api-client.js`)
- [ ] Set up development workflow

**3.3 Dashboard Overview Page (Day 4-5)**
- [ ] Build main layout with navigation
- [ ] Display system statistics
- [ ] Show active workflows count
- [ ] Show pending workflows count
- [ ] Add quick links to other pages
- [ ] Test responsive design

**3.4 Workflow Rules Management Screen (Day 6-8)**
- [ ] List all workflow rules
- [ ] Show rule status (active/inactive)
- [ ] Add "Create New Rule" form
- [ ] Add "Edit Rule" modal
- [ ] Add "Delete Rule" confirmation
- [ ] Add "Test Rule" functionality
- [ ] Show which customers match each rule
- [ ] Add validation and error messages

**3.5 Scoring Configuration Screen (Day 9-11)**
- [ ] Display all scoring configs
- [ ] ARR breakpoints editor (2 inputs + multipliers)
- [ ] Renewal stage urgency editor (9 sliders)
- [ ] Account plan multipliers editor (4 inputs)
- [ ] Workload penalty editor (1 input)
- [ ] Experience multipliers editor (4 inputs)
- [ ] Visual feedback (progress bars, color coding)
- [ ] "Save Changes" / "Reset to Defaults" buttons
- [ ] Show preview of impact before saving

**3.6 Test & Preview Screen (Day 12-13)**
- [ ] Form to enter test customer data
- [ ] Calculate predicted workflows
- [ ] Show priority scores with breakdown
- [ ] Display formula step-by-step
- [ ] Compare before/after configuration changes
- [ ] Export test results to JSON

**3.7 Polish & UX (Day 14-15)**
- [ ] Add loading states for all async operations
- [ ] Add error handling and user-friendly messages
- [ ] Add success confirmations
- [ ] Add keyboard shortcuts
- [ ] Add tooltips and help text
- [ ] Add responsive design for tablets/mobile
- [ ] Test cross-browser compatibility

**Deliverable:** Fully functional admin UI for configuration management

---

## Testing Strategy

### For Each Task

**Database Schema:**
- [ ] Run migration on fresh database
- [ ] Verify all tables created correctly
- [ ] Test CRUD operations on each table
- [ ] Ensure existing tests still pass (159 tests)

**REST API:**
- [ ] Test all endpoints with Postman/curl
- [ ] Write automated API tests
- [ ] Test error handling
- [ ] Test with invalid/malicious input

**Admin UI:**
- [ ] Manual testing in browser (Chrome, Firefox, Safari)
- [ ] Test all forms and buttons
- [ ] Test with various screen sizes
- [ ] Test with slow network (throttling)

### Integration Testing

After all 3 tasks complete:
- [ ] End-to-end flow: Edit config in UI → Save → API stores in DB → Algorithm reads new config
- [ ] Test config changes affect workflow generation
- [ ] Test multiple users editing config simultaneously
- [ ] Test undo/rollback scenarios

---

## Decision Points

Before starting, align on these choices:

### Technology Choices

**1. UI Framework**
- ⬜ React (most popular, rich ecosystem)
- ⬜ Vue.js (easier learning curve, progressive)
- ⬜ Vanilla JS (no dependencies, simple)

**Recommendation:** Vue.js (good balance of power and simplicity)

**2. CSS Approach**
- ⬜ Tailwind CSS (utility-first)
- ⬜ Custom CSS (full control)
- ⬜ Bootstrap (component library)

**Recommendation:** Tailwind CSS (fast development, modern)

**3. Database**
- ⬜ Stay with SQLite (simple, local)
- ⬜ Switch to Supabase now (production-ready)

**Recommendation:** Stay with SQLite for now, migrate in Phase 4

**4. Authentication**
- ⬜ Build custom auth (more work)
- ⬜ Integrate with existing renubu auth (if available)
- ⬜ Skip for MVP (add later)

**Recommendation:** Skip for MVP, add in Phase 4 during integration

### UX Decisions

**5. Configuration Changes**
- ⬜ Take effect immediately (risky but fast)
- ⬜ Require "Publish" button (safer)
- ⬜ Scheduled deployment (most control)

**Recommendation:** Require "Publish" button with preview

**6. Validation**
- ⬜ Client-side only (faster UX)
- ⬜ Server-side only (more secure)
- ⬜ Both (best practice)

**Recommendation:** Both (validate client-side for UX, server-side for security)

---

## File Structure (After Phase 2)

```
automation/
├── Core Algorithm (Phase 1 - ✅ Complete)
│   ├── workflow-types.js
│   ├── workflow-data-access.js
│   ├── workflow-determination.js
│   ├── workflow-scoring.js
│   └── workflow-orchestrator.js
│
├── Database (Phase 2 - New)
│   ├── schema-v2.sql                   # New tables
│   ├── migrate-config-to-db.js         # Migration script
│   └── config-data-access.js           # Config queries
│
├── API (Phase 2 - New)
│   ├── server.js                       # Extended with routes
│   └── api/
│       ├── routes/
│       │   ├── workflow-rules.js
│       │   ├── scoring-config.js
│       │   ├── workflows.js
│       │   └── test-api.js
│       └── middleware/
│           ├── validation.js
│           └── error-handler.js
│
├── Admin UI (Phase 2 - New)
│   └── public/admin/
│       ├── index.html                  # Dashboard
│       ├── workflow-rules.html         # Rules management
│       ├── scoring-config.html         # Scoring config
│       ├── test-preview.html           # Testing tool
│       ├── css/
│       │   ├── admin.css
│       │   └── components.css
│       └── js/
│           ├── api-client.js           # API wrapper
│           ├── components/
│           │   ├── rule-editor.js
│           │   ├── score-slider.js
│           │   └── test-panel.js
│           └── pages/
│               ├── dashboard.js
│               ├── rules.js
│               ├── scoring.js
│               └── test-preview.js
│
├── Tests
│   ├── test-config-data-access.js      # New
│   ├── test-api.js                     # New
│   └── [existing test files]
│
└── Documentation
    ├── ROADMAP.md                      # ✅ Complete
    ├── PROJECT-SUMMARY.md              # ✅ Complete
    ├── NEXT-STEPS.md                   # ✅ You are here
    └── WORKFLOW-ALGORITHM-GUIDE.md     # ✅ Complete
```

---

## Success Criteria

### Phase 2 is Complete When:

**Database:**
- [ ] All configuration stored in database tables
- [ ] Migration script successfully populates tables
- [ ] Modules read from database instead of hardcoded objects
- [ ] Existing 159 tests still pass

**API:**
- [ ] All CRUD endpoints working
- [ ] API tests pass
- [ ] Error handling works correctly
- [ ] Postman/curl requests documented

**Admin UI:**
- [ ] Non-technical user can edit workflow rules
- [ ] Non-technical user can edit scoring config
- [ ] Test tool shows accurate predictions
- [ ] UI is intuitive (< 5 minutes to learn)
- [ ] Changes persist to database

**Integration:**
- [ ] End-to-end flow works: UI → API → Database → Algorithm
- [ ] Configuration changes affect workflow generation
- [ ] System handles edge cases gracefully

---

## Resources & References

### Documentation
- **ROADMAP.md** - Full Phase 2-4 plan
- **PROJECT-SUMMARY.md** - Current state overview
- **WORKFLOW-ALGORITHM-GUIDE.md** - Configuration reference

### Code to Study
- `workflow-determination.js` lines 13-22 (WORKFLOW_THRESHOLDS)
- `workflow-scoring.js` lines 15-70 (SCORING_CONFIG)
- `demo-workflow-system.js` (see how config is used)

### Similar Systems (for inspiration)
- LaunchDarkly (feature flags configuration UI)
- Segment (event configuration UI)
- Retool (admin panel builder)

---

## Weekly Milestones

### Week 1-2: Database Foundation
**Goal:** Configuration stored in database, modules reading from it
**Demo:** Show config changes in database affecting workflow generation

### Week 3-4: API Layer
**Goal:** REST API for all configuration management
**Demo:** Use Postman to edit config, see changes reflected in system

### Week 5-7: Admin UI
**Goal:** Web interface for managing configuration
**Demo:** Non-technical user edits rules and scoring through UI

### Week 8: Buffer & Polish
**Goal:** Fix bugs, improve UX, write documentation
**Demo:** Full end-to-end demonstration to stakeholders

---

## After Phase 2: What's Next?

### Phase 3: Workflow Execution (Weeks 9-14)
- Connect to task mode templates
- Variable injection engine
- Progress tracking
- Completion handlers

### Phase 4: Integration (Weeks 15-20)
- Merge into main `renubu/` app
- Migrate to Supabase
- Add authentication
- Multi-tenancy support

---

## Getting Started

### This Week (Week 1)

**Day 1: Planning**
- [ ] Review this document with team
- [ ] Make technology decisions (UI framework, CSS, etc.)
- [ ] Set up development environment
- [ ] Create new branch: `feature/phase-2-config-ui`

**Day 2-3: Database Schema**
- [ ] Design tables
- [ ] Create `schema-v2.sql`
- [ ] Write migration script
- [ ] Test on fresh database

**Day 4-5: Data Access Layer**
- [ ] Create `config-data-access.js`
- [ ] Add CRUD functions for config
- [ ] Write tests

**Day 6-7: Update Core Modules**
- [ ] Modify `workflow-determination.js`
- [ ] Modify `workflow-scoring.js`
- [ ] Ensure existing tests pass

**Day 8-10: Testing & Validation**
- [ ] Write comprehensive tests
- [ ] Test edge cases
- [ ] Document changes

### Next Week (Week 2)

Continue with Task 2 (REST API) per detailed plan above.

---

## Questions?

- **Technical questions:** Review code in core modules
- **Design questions:** See mockups in ROADMAP.md
- **Business logic questions:** See WORKFLOW-ALGORITHM-GUIDE.md

---

**Last Updated:** October 7, 2025
**Phase:** Ready to Start Phase 2
**Status:** All planning documents complete, ready to code
