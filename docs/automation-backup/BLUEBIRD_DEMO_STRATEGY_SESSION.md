# Bluebird Memorial Hospital Demo - Strategy Session Summary

**Date:** January 2025
**Participants:** Product Owner (Justin), Backend Engineer (Claude)
**Purpose:** Plan backend architecture and data strategy for Bluebird Memorial Hospital demo

---

## 🎯 **Project Goals**

Create a compelling **20-minute product demo** featuring:
- **Customer:** Bluebird Memorial Hospital (mid-size hospital, 180,000 patients/year)
- **Our Company:** Bluesoft (medical software provider)
- **Your Role:** Customer Success Manager managing Bluebird's renewal
- **Narrative:** "Year in the life" story showing renewal lifecycle intelligence
- **Outcome:** $165K → $198K (20% expansion) over 365-day journey

### **Key Objectives:**
1. Tell a cohesive story with realistic ups and downs
2. Showcase multiple workflows across the year
3. Demonstrate intelligence trending and insights
4. Show how system helps CSMs navigate complex renewals
5. Keep it concise - hit highlights, not every touchpoint

---

## 📊 **Current State Analysis**

### ✅ **What's Already Built:**

#### **Database Schema (Complete):**
- `customers` - Customer master records
- `customer_intelligence` - Risk/opportunity/health scores over time
- `customer_financials` - ARR history and growth trends
- `customer_usage_metrics` - Usage tracking over time
- `customer_engagement` - QBRs, NPS, support tickets
- `customer_stakeholders` - Key contacts with influence levels
- `workflow_executions` - Workflow tracking
- `workflow_step_executions` - Step-level progress
- `workflow_tasks` - Task management
- `workflow_task_artifacts` - AI-generated documents

#### **Backend APIs (Working):**
- ✅ `GET /api/workflows/context` - Customer intelligence retrieval
- ✅ `GET /api/workflows/queue/[csmId]` - Prioritized workflow queue
- ✅ Chat APIs - Thread management, LLM integration (Ollama + mock fallback)
- ✅ Task APIs - Full CRUD for task management
- ✅ Actions API - Execute saved actions (snooze, escalate, skip)
- ✅ User Preferences API - Settings persistence

#### **Helper Functions (Working):**
- `get_latest_intelligence(customer_id)` - Latest risk/health scores
- `get_latest_financials(customer_id)` - Current ARR and trends
- `get_latest_usage(customer_id)` - Usage metrics
- `get_latest_engagement(customer_id)` - Engagement data

#### **Previous Demo (Bluesoft - Reference):**
A complete 120-day demo already exists for "Bluesoft Corporation":
- 8 intelligence snapshots (health: 72 → 85)
- 3 financial records ($165K → $198K)
- 7 usage snapshots (32 → 40 users)
- 8 engagement records (NPS: 7 → 9)
- 5 stakeholders
- 2 workflow executions (Critical + Emergency)
- 6 AI-generated artifacts

**Location:** Migration files in `automation/BLUESOFT_*.sql`

---

## 🏗️ **Key Architecture Discussions**

### **1. Multi-Workflow Execution Concept**

#### **Real-World Scenario Discussed:**
> "It's Thursday. There's an active renewal workflow for a big customer. Suddenly a new risk event threatens everything, triggering a risk workflow. CSM logs in - do we have a way to say: 'You have 2 workflows today. Start, finish workflow 1, click next, move to workflow 2'?"

#### **Current Reality:**
- ✅ **Queue API shows multiple workflows** for same customer
- ✅ **Orchestrator groups by customer** already
- ❌ **No "workflow session" concept** - no way to bundle them
- ❌ **No automatic transitions** between workflows
- ❌ **No session progress tracking** (workflow 1 of 2 complete)

**Current Behavior:**
1. CSM sees queue: "You have 2 workflows for Bluebird"
2. CSM clicks workflow #1, completes it
3. CSM must return to queue, find workflow #2, click it again
4. **No continuity between them**

#### **Decision: Build Workflow Session System** ✅

**Why:** This is a **real product feature**, not just demo scaffolding.

**Benefits:**
- Batch work sessions ("3 customers need attention today")
- Contextual grouping (renewal + risk workflows together)
- Progress tracking ("2 of 5 workflows done")
- Focus mode (stay in flow, system guides through related work)
- Session analytics (track completion rates, timing)

**Implementation Needed:**
- New tables: `workflow_sessions`, `workflow_session_items`
- 4 new APIs: create session, get status, advance to next, auto-create
- Backend: 2-3 days
- Frontend: 3-4 days
- **Total: ~1 week for both teams**

---

### **2. Template Groups & Slides System**

#### **Historical Context:**
Product previously used:
- **Large config files** with workflow logic
- **Template Groups** - handlers specifying order of templates
- **Slides** - Multi-step progression through templates
- Could launch via URL and auto-advance like slides

#### **Question Asked:**
> "In our new database concept, did we forget about that? Does the slide or template group concept still exist?"

#### **Discovery:** ✅ **IT STILL EXISTS!**

**Frontend Has (Working Today):**

**Location:** `src/components/artifacts/workflows/config/`

1. **Template Groups** (`templateGroups.ts`):
```typescript
export interface TemplateGroup {
  id: string;
  name: string;
  description: string;
  templates: string[]; // Sequence of template names
  currentIndex?: number;
  tags?: string[];
}
```

**Example:**
```typescript
'demo-v1': {
  id: 'demo-v1',
  templates: ['bluebird-planning', 'dynamic-ai'], // Sequence!
  description: 'Combined demo with two templates'
}
```

2. **Slides** (`slideTemplates.ts`):
```typescript
export interface WorkflowSlide {
  id: string;
  slideNumber: number;
  title: string;
  chat: { /* config */ };
  artifacts: { /* config */ };
  onComplete?: {
    nextSlide?: number; // Auto-advance
  };
}
```

**Templates can have multiple slides:**
```typescript
export const planningChecklistDemo = {
  id: 'planning-checklist-demo',
  slides: [
    slide1, // Initial contact
    slide2, // Needs assessment
    slide3, // Pricing strategy
    slide4, // Contact planning
    slide5  // Plan summary
  ]
};
```

3. **UI Component:** `TemplateGroupManager.tsx`
   - Create/edit/launch template groups
   - Reorder templates
   - Copy demo URLs
   - Full UI for managing sequences

4. **URL-Based Launching:**
```
/dashboard?templateGroup=healthcare-demo
```

#### **Two-Level Hierarchy:**
```
Template Group (Multi-Template Sequence)
  ├─ Template 1 (Has multiple slides)
  │    ├─ Slide 1
  │    ├─ Slide 2
  │    └─ Slide 3
  ├─ Template 2 (Single or multiple slides)
  └─ Template 3 (Multiple slides)
```

#### **What's Missing:**
- ❌ Database storage of template groups (currently hardcoded)
- ❌ Database storage of templates (currently config files)
- ❌ Template execution tracking
- ❌ Session analytics

**Distinction:**
- **Template Groups (Frontend):** Demo/presentation tool for showing prospects
- **Workflow Sessions (Backend - Proposed):** Product feature for CSMs doing real work

---

## 🎬 **Demo Narrative Strategy**

### **Duration:** 20 minutes

### **Structure (4 Acts):**

**Intro (2 min):**
- Customer overview dashboard
- "This is Bluebird Memorial Hospital, $165K customer, 365 days ago..."
- Show intelligence timeline chart (health 68 → 88 over year)

**Act 1: Growth Phase (5 min):**
- 180 days out: Prepare workflow execution
- Show: Usage growth chart (28 → 38 users)
- Show: Expansion opportunity artifact
- Show: Account plan artifact

**Act 2: Renewal Planning (5 min):**
- 90 days out: Engage workflow (quick pass)
- 60 days out: Negotiate workflow
- Show: Pricing negotiation artifacts
- Show: Stakeholder engagement tracking

**Act 3: Critical Escalation (6 min):**
- 15 days out: Critical workflow execution
- Show: Critical status assessment artifact
- Show: Executive escalation brief
- Show: War room activation

**Act 4: Emergency & Success (2 min):**
- 5 days out: Emergency workflow (abbreviated)
- Show: Payment processing coordination
- Final: $198K ARR, 20% expansion, health 88

### **Streamlined Approach:**
- **3-5 key workflows** (not 9 - too many for 20 min)
- Focus on **highlights**, not every touchpoint
- Use **transitions** to skip time periods
- Emphasize **system intelligence**, not just data

---

## 📋 **Recommended Implementation Path**

### **Option Chosen: Hybrid Approach**

#### **For Demo (Next 2 Weeks):**
1. ✅ **Use existing template group system** (works today!)
2. ✅ **Backend creates Bluebird database records:**
   - Customer master record
   - 8-12 intelligence snapshots (monthly)
   - 4 financial records (quarterly)
   - 6-8 usage snapshots (bimonthly)
   - 8-10 engagement events
   - 5-7 stakeholders
   - 3-5 workflow executions
   - 15-20 tasks
   - 15-20 artifacts

3. ✅ **Frontend creates template group:**
```typescript
'bluebird-year-in-life': {
  id: 'bluebird-year-in-life',
  name: 'Bluebird Memorial Hospital - Year in Life',
  templates: [
    'bluebird-prepare-180',   // 3 slides
    'bluebird-critical-15',    // 3 slides
    'bluebird-emergency-5',    // 2 slides
    'bluebird-success'         // 1 slide
  ]
}
```

4. ✅ **Wire templates to database via Context API** (already working)

**Timeline:** 1 week for demo-ready state

#### **For Product (Post-Demo, 3-4 Weeks):**
1. 🔲 Build **Workflow Sessions** database system
2. 🔲 Create 4 new APIs (create, get, next, auto-create)
3. 🔲 Add execution tracking and analytics
4. 🔲 Ship as real product feature

---

## 📊 **Bluebird Customer Profile**

### **Basic Information:**
- **Company:** Bluebird Memorial Hospital
- **Domain:** bluebirdhealth.org
- **Industry:** Healthcare/Hospital System
- **Size:** Mid-size (180,000 patients/year)
- **Initial ARR:** $165,000
- **Final ARR:** $198,000 (20% expansion)
- **Contract Period:** October 10, 2024 - October 9, 2025 (365 days)
- **Account Plan:** Evolves from "manage" → "expand" → "invest"

### **Stakeholders (5-7 people):**
1. Dr. Sarah Martinez - Chief Medical Information Officer (Decision Maker, Champion)
2. James Chen - VP of IT Operations (Decision Maker)
3. Dr. Rebecca Torres - Director of Clinical Systems (Influencer, Power User)
4. Michael Williams - CFO (Decision Maker, Budget Authority)
5. Lisa Anderson - IT Project Manager (Influencer)
6. David Thompson - Data Analytics Manager (User, Technical Champion)
7. Emily Rodriguez - Nursing Informatics Lead (User, Clinical Champion)

### **Intelligence Journey (Quarterly Highlights):**

**Q1 (Oct-Dec 2024): Onboarding & Stabilization**
- Month 1 (330 days): Health 68, Risk 35, Opportunity 45 - Implementation challenges
- Month 2 (300 days): Health 72, Risk 28, Opportunity 55 - System stabilizing
- Month 3 (270 days): Health 78, Risk 22, Opportunity 65 - Strong adoption

**Q2 (Jan-Mar 2025): Growth & Concerns**
- Month 4 (240 days): Health 82, Risk 18, Opportunity 75 - Peak performance
- Month 5 (210 days): Health 75, Risk 28, Opportunity 70 - Budget concerns
- Month 6 (180 days): Health 72, Risk 32, Opportunity 65 - Competitive evaluation

**Q3 (Apr-Jun 2025): Strategic Planning**
- Month 7 (150 days): Health 78, Risk 22, Opportunity 80 - QBR success
- Month 8 (120 days): Health 85, Risk 15, Opportunity 88 - Expansion proposal
- Month 9 (90 days): Health 80, Risk 20, Opportunity 85 - Budget approval wait

**Q4 (Jul-Sep 2025): Renewal Execution**
- Month 10 (60 days): Health 78, Risk 25, Opportunity 82 - Negotiation
- Month 11 (30 days): Health 75, Risk 28, Opportunity 80 - Signature delays
- Month 12 (15 days): Health 72, Risk 35, Opportunity 75 - Executive escalation
- Week 52 (5 days): Health 70, Risk 40, Opportunity 70 - Payment urgent
- Day 365: Health 88, Risk 12, Opportunity 92 - **SUCCESS!**

### **Financial Journey:**
- Q1 2024 (baseline): $155K ARR
- Q4 2024 (contract start): $165K ARR
- Q2 2025: $165K ARR (stable, discussions begin)
- Q3 2025: $180K ARR (mid-year expansion +$15K, ED department adds system)
- Renewal (Q4 2025): $198K ARR (+20% expansion, enterprise features)

### **Usage Metrics:**
- Initial: 28 users, 65% utilization, 4 departments
- Growth: 28 → 32 → 38 → 45 users over year
- Utilization: 65% → 75% → 82% → 88%
- Feature adoption: 50% → 70% → 85% → 92%
- Departments: 4 → 5 → 7 (ED, Nursing, Labs, Radiology, Admin, Clinical Informatics, Quality)

### **Key Events:**
- Month 3: ED department successful pilot
- Month 6: Labs & Radiology adoption + $15K mid-year expansion
- Month 8: Clinical Informatics goes live, expansion proposal
- Month 10: Quality department pilot, negotiations begin
- Month 11: CFO signature delays
- Month 12 (Day 350): Executive escalation triggered
- Week 52: Payment processing urgent
- Day 363: Payment cleared
- Day 365: Renewal secured!

---

## 🔧 **Backend Work Required**

### **Phase 1: Database Records (Week 1)**

**Files to Create:**
1. `BLUEBIRD_CUSTOMER_SEED.sql` - Customer master + stakeholders
2. `BLUEBIRD_INTELLIGENCE_JOURNEY.sql` - 12 monthly intelligence snapshots
3. `BLUEBIRD_FINANCIALS.sql` - 4 quarterly financial records
4. `BLUEBIRD_USAGE.sql` - 6-8 bimonthly usage metrics
5. `BLUEBIRD_ENGAGEMENT.sql` - 8-10 key engagement events
6. `BLUEBIRD_WORKFLOWS.sql` - 3-5 workflow executions
7. `BLUEBIRD_TASKS.sql` - 15-20 tasks across workflows
8. `BLUEBIRD_ARTIFACTS.sql` - 15-20 AI-generated artifacts

**Approach:**
- Use UUIDs for consistent cross-references
- Link via foreign keys
- Ensure chronological consistency
- Realistic data values (no obvious mocks)

### **Workflow Executions to Create (3-5 key workflows):**

1. **Prepare Workflow (180 days out):**
   - Triggered by competitive evaluation concerns
   - Artifacts: Strategic Assessment, Value Demo Plan, Competitive Analysis
   - Duration: 3 slides

2. **Account Planning Workflow (120 days out):**
   - Expansion opportunity identified
   - Artifacts: Account Plan, Expansion Proposal, ROI Analysis
   - Duration: 3 slides (optional - may combine with Prepare)

3. **Critical Workflow (15 days out):**
   - CFO signature delays, executive escalation
   - Artifacts: Critical Status Assessment, Escalation Brief, Signature Plan
   - Duration: 3 slides
   - **This is your Thursday scenario example!**

4. **Emergency Workflow (5 days out):**
   - Payment processing urgent
   - Artifacts: Emergency Status Check, Final Push Plan, Payment Coordination
   - Duration: 2 slides

5. **Success Summary (Day 365):**
   - Renewal secured
   - Artifacts: Success Report, Post-Mortem, Next Year Plan
   - Duration: 1 slide

### **Phase 2: Workflow Sessions System (Week 2-3, Post-Demo)**

**New Tables:**
```sql
CREATE TABLE workflow_sessions (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES profiles(id),
  session_title TEXT,
  session_type TEXT, -- 'manual', 'auto_grouped', 'demo'
  priority_score INT,
  status TEXT, -- 'pending', 'in_progress', 'completed'
  current_workflow_index INT DEFAULT 0,
  total_workflows INT,
  config JSONB,
  created_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE workflow_session_items (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES workflow_sessions(id) ON DELETE CASCADE,
  workflow_execution_id UUID REFERENCES workflow_executions(id),
  sequence_order INT NOT NULL,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id, sequence_order)
);
```

**New APIs:**
1. `POST /api/workflows/sessions` - Create session
2. `GET /api/workflows/sessions/[id]` - Get session status
3. `POST /api/workflows/sessions/[id]/next` - Advance to next workflow
4. `POST /api/workflows/sessions/auto-create` - Auto-create from queue

---

## 🎯 **Frontend Work Required**

### **Template Creation (Frontend Engineer):**

Create 3-4 templates for Bluebird, each with slides:

**Template 1: `bluebird-prepare-180`**
- Slide 1: Initial assessment - competitive concerns
- Slide 2: Value demonstration planning
- Slide 3: Strategic next steps

**Template 2: `bluebird-critical-15`**
- Slide 1: Critical status assessment
- Slide 2: Executive escalation brief
- Slide 3: Signature collection plan

**Template 3: `bluebird-emergency-5`**
- Slide 1: Emergency status check
- Slide 2: Final push - payment coordination

**Template 4: `bluebird-success`**
- Slide 1: Renewal success summary

### **Template Group:**
```typescript
'bluebird-year-in-life': {
  id: 'bluebird-year-in-life',
  name: 'Bluebird Memorial Hospital - Year in Life',
  description: 'Complete 365-day renewal journey for mid-size hospital',
  templates: [
    'bluebird-prepare-180',
    'bluebird-critical-15',
    'bluebird-emergency-5',
    'bluebird-success'
  ],
  tags: ['healthcare', 'hospital', 'demo', 'bluebird']
}
```

### **Launch URL:**
```
/dashboard?templateGroup=bluebird-year-in-life
```

---

## 📝 **Development Sequence**

### **Week 1 (Backend Focus):**
- **Day 1-2:** Create Bluebird customer and stakeholders
- **Day 2-3:** Create intelligence journey (12 snapshots)
- **Day 3-4:** Create financials, usage, engagement data
- **Day 4-5:** Create workflow executions, tasks, artifacts
- **Day 5:** Test Context API with Bluebird data

### **Week 1 (Frontend Focus):**
- **Day 1-2:** Create template 1 (Prepare workflow)
- **Day 2-3:** Create template 2 (Critical workflow)
- **Day 3-4:** Create template 3 (Emergency workflow)
- **Day 4:** Create template 4 (Success summary)
- **Day 5:** Create template group, test full sequence

### **Week 2 (Integration & Polish):**
- **Day 1-2:** Test end-to-end demo flow
- **Day 2-3:** Polish transitions, artifacts, narratives
- **Day 3-4:** Practice demo timing (hit 20-minute target)
- **Day 4-5:** Bug fixes, refinements

### **Week 3-4 (Post-Demo - Optional):**
- Build Workflow Sessions system
- Migrate from frontend template groups to database sessions
- Add analytics, tracking, progress indicators

---

## 💡 **Key Decisions Made**

1. ✅ **Use existing template group system for demo** (works today, no rebuild needed)
2. ✅ **Build workflow sessions as product feature post-demo** (2-3 weeks)
3. ✅ **Focus on 3-5 workflows, not 9** (20-minute constraint)
4. ✅ **Create realistic data journey with ups/downs** (not linear growth)
5. ✅ **Leverage existing Context API and helper functions** (already working)
6. ✅ **Build chronologically - one customer at a time** (iterative approach)

---

## 📚 **Key Documentation References**

**Existing Demos:**
- `automation/BLUESOFT_DEMO_INSTRUCTIONS.md` - Complete setup guide
- `automation/BLUESOFT_DEMO_COMPLETE.md` - What was built for Bluesoft
- `automation/BLUESOFT_WORKFLOW_PLAN.md` - Workflow and artifact mapping

**Backend Architecture:**
- `automation/DEVELOPER_BRIEFING.md` - System overview
- `automation/DATABASE_WORKFLOW_SYSTEM.md` - Schema details
- `automation/BACKEND-MVP-PROJECT-PLAN.md` - API status and roadmap
- `renubu/DATABASE_SYSTEM_GUIDE.md` - Database guide

**Frontend System:**
- `src/components/artifacts/workflows/config/templateGroups.ts` - Template groups
- `src/components/artifacts/workflows/config/slideTemplates.ts` - Slide builders
- `src/components/artifacts/workflows/components/TemplateGroupManager.tsx` - UI

**APIs:**
- `automation/CHAT_API_GUIDE.md` - Chat system
- `automation/WORKFLOW_QUEUE_API.md` - Queue system
- `src/app/api/workflows/context/route.ts` - Context API (reads intelligence data)

---

## ❓ **Open Questions for Next Session**

1. **Stakeholder Count:** 5 or 7 stakeholders? (5 is manageable, 7 gives more options)
2. **Workflow Count:** 3, 4, or 5 workflows in the sequence? (Depends on 20-min timing)
3. **Mid-Year Expansion:** Show as separate event or embed in narrative?
4. **Engagement Events:** Which specific QBRs/meetings to highlight?
5. **Artifact Detail Level:** How much content in each artifact? (Summary vs full detail)
6. **Session Analytics:** Track what metrics post-demo? (Completion rates, timing, etc.)
7. **Database Location:** Single customer ID for Bluebird or multiple for testing?

---

## 🚀 **Next Steps When Resuming**

1. **Review this document** - Refresh on decisions and architecture
2. **Decide on open questions** - Finalize stakeholder count, workflow count, etc.
3. **Start with Customer Master** - Create `BLUEBIRD_CUSTOMER_SEED.sql`
4. **Build chronologically** - Intelligence → Financials → Usage → Engagement
5. **Coordinate with frontend** - Share customer UUID for template integration
6. **Test incrementally** - Verify Context API returns correct data after each step

---

## 📊 **Success Metrics**

**Demo Ready When:**
- ✅ Bluebird customer exists in database
- ✅ Context API returns full customer intelligence
- ✅ 3-5 workflow executions with artifacts
- ✅ Template group launches successfully
- ✅ Can complete full demo in 20 minutes
- ✅ Narrative flows logically with transitions
- ✅ Data shows realistic progression (not obviously fake)

**Post-Demo Success:**
- ✅ Workflow sessions system built
- ✅ Real CSMs can use it for live work
- ✅ Session analytics dashboard
- ✅ Can track completion rates, timing, patterns

---

**Last Updated:** January 2025
**Status:** Planning Complete - Ready for Implementation
**Next Session:** Review and begin database record creation
