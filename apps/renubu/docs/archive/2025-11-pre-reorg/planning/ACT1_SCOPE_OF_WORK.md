# Act 1: Scope of Work
## Squelch Demo - Villain Universe Edition

> **Purpose**: Define complete technical scope for Act 1 implementation
> **Duration**: 15 minutes (8 min slides + 7 min demo)
> **Deliverables**: PowerPoint deck + 4 working workflows + Dashboard + Database seeding
> **Target Completion**: [Phase 3 - Week 3-4]

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Story Context](#story-context)
3. [Slide Deck Requirements](#slide-deck-requirements)
4. [Dashboard Requirements](#dashboard-requirements)
5. [Workflow Requirements](#workflow-requirements)
6. [Backend Requirements](#backend-requirements)
7. [Frontend Requirements](#frontend-requirements)
8. [Infrastructure Requirements](#infrastructure-requirements)
9. [Data Seeding Requirements](#data-seeding-requirements)
10. [FE/BE Work Breakdown](#febe-work-breakdown)

---

## Executive Summary

**Act 1 Goal**: Introduce the problem, meet Sarah, show how Renubu helps her create a strategic plan for angry villain customer Obsidian Black using 4 core workflows.

**Format**: Hybrid presentation (PowerPoint + Live Demo)
- 8 minutes: PowerPoint slides (context + architecture)
- 7 minutes: Live demo (dashboard + 4 workflows)
- Pause points for Q&A built in

**Villain Universe Theme**:
- Customer: **Obsidian Black (Obsidian Black)** - professional villain enterprise
- Contact: **Marcus Castellan** ("The Orchestrator") - COO, angry but professional
- Secondary: **Dr. Elena Voss** ("Nightingale") - VP Technical Ops, evaluating competitors
- Product: **ThreatOS™** - Enterprise Coordination Platform for "complex multi-stakeholder operations"
- Tone: Professional villainy (Fortune 500 meets world domination), NOT campy

---

## Story Context

### The Setup (From Villain Universe Storyboard)

**Squelch** (the vendor):
- Makes ThreatOS™ for villain organizations
- Sarah Chen is their CSM
- Growing fast, under pressure

**Obsidian Black** (the customer):
- 450 operatives, 23 facilities worldwide
- $850K ARR (potential $2.5M with expansion)
- Industry: "Global Strategic Coordination Services"
- Angry because: Operation Blackout failure ($850K loss), 87-day communication gap, support turnover

**Marcus Castellan**:
- COO at Obsidian Black
- Calm, strategic, intimidating through professionalism
- Sends "The Proving Ground" email (Year Two is Sarah's chance to prove herself)

**Dr. Elena Voss**:
- VP of Technical Operations (new, 6 months)
- Evaluating ALL vendors (risk + opportunity)
- Launching $1.7M "Global Synchronization Initiative"

**The Crisis**: Last year's renewal went poorly. Platform latency caused Operation Blackout to fail (47-second delay = $850K loss). Sarah's predecessor left, creating 87-day silence. Marcus is giving Sarah ONE more year to prove Squelch.

---

## Slide Deck Requirements

### Slide 1: The Challenge
**Duration:** 60 seconds

**Visual Content**:
- Title: "The Scaling Challenge"
- Obsidian Black growth chart (operations increasing, success rate declining)
- Pain points shown: Platform failures, support turnover, communication gaps
- Result metric: "Success Rate: 94.4% (down from 97.1%)"

**Speaker Goals**:
- Establish relatable villain enterprise growth story
- Surface familiar pain points (scaling challenges apply to villains too!)
- Set up "success creates new problems" theme

---

### Slide 2: Meet Sarah
**Duration:** 45 seconds

**Visual Content**:
- Professional photo of Sarah Chen
- Stats card:
  - Senior CSM, Squelch
  - Portfolio: Obsidian Black + other villain enterprises
  - Known for: "Strategic partnership, operational excellence"

**Speaker Goals**:
- Make Sarah relatable (she's the hero)
- Establish credibility
- Hint that even great CSMs struggle with demanding clients

---

### Slide 3: The Breaking Point
**Duration:** 60 seconds

**Visual Content**:
- Email mockup from Marcus Castellan
- Subject: "Obsidian Black Renewal Discussion - Year Two Expectations"
- Key quote: "This year is your proving ground"
- Context box: "$850K customer, renewal at risk"

**Speaker Goals**:
- Create tension (stakes are real)
- Show this isn't about bad CSM, it's about operational failure
- Set up "something must change" moment

---

### Slide 4: The Response
**Duration:** 90 seconds

**Visual Content**:
- Title: "Squelch Invests in Renubu"
- Tagline: "AI-Powered Workflow Orchestration for CS Teams"
- Three value props:
  - Prioritize what matters (cut through 700 potential actions to the 10 that count)
  - Automate the noise (AI handles routine coordination)
  - Execute flawlessly (never miss a critical touchpoint)

**Speaker Goals**:
- Position Renubu as the solution
- Keep it high-level (details coming next)
- Transition to "how it works"

---

### Slide 5: How Renubu Works (Architecture)
**Duration:** 2 minutes

**Visual Content**:
- Architecture diagram showing:
  - Data inputs (CRM, usage data, support tickets, contract terms)
  - AI Intelligence Layer (risk detection, opportunity scoring, workflow prioritization)
  - Workflow Orchestration (strategic planning, risk mitigation, executive engagement, renewal prep)
  - CSM Interface (dashboard, task queue, guided workflows)

**Key Points**:
- "At any moment, there could be 700 different actions across a CSM's portfolio"
- "Renubu identifies the 10 most critical for today"
- "Based on: Risk, opportunity, timing, relationship health"

**Speaker Goals**:
- Make AI feel smart but not magical
- Show technical sophistication (this isn't just task management)
- Build credibility before demo

**🛑 PAUSE FOR QUESTIONS** (2-3 minutes)
- How does it integrate with existing tools?
- Where does the data come from?
- How customizable are workflows?

---

## Dashboard Requirements

### Landing Page (Post-Login)

**Visual Elements**:
1. **Header**:
   - "Welcome back, Sarah"
   - Date: [Demo date]
   - ThreatOS platform branding (subtle villain aesthetic)

2. **Task Queue (Center Focus)**:
   - **Primary Task Card**:
     - Title: "Complete Strategic Account Plan - Obsidian Black"
     - Priority: HIGH (red/orange indicator)
     - Due: Today
     - Estimated Time: 25 minutes
     - Click to launch → Opens Workflow 1

3. **Customer Overview Panel (Right Side)**:
   - Obsidian Black Profile Card:
     - Name: Obsidian Black
     - ARR: $850,000
     - Health Score: 4.2/10 (at-risk, red indicator)
     - Opportunity Score: 8.7/10 (high potential, green indicator)
     - Renewal Date: April 15, 2026 (143 days away)
     - Primary Contact: Marcus Castellan (COO)

4. **Quick Stats (Top Bar)**:
   - Active Accounts: 45
   - Tasks Today: 1
   - Renewals (Next 90 Days): 3
   - At-Risk Accounts: 7

**Interaction Flow**:
1. Sarah logs in (simple, clean)
2. Dashboard loads (smooth animation)
3. Single task displayed (not overwhelming)
4. Click task card → Launches Workflow 1 modal

**Design Notes**:
- Clean, modern UI (enterprise-grade)
- Subtle villain theming (dark mode colors, tactical aesthetics)
- NO cartoonish elements
- Professional and credible

---

## Workflow Requirements

### Workflow 1: Strategic Account Planning
**Duration:** 4 minutes
**Purpose:** Sarah creates a year-long plan to rebuild Obsidian Black relationship

**Workflow Steps**:

**Step 1: Contract Intelligence Review**
- **Artifact**: "Annual Coordination Services Agreement" (contract summary)
- **Data Displayed**:
  - Renewal Date: April 15, 2026 (143 days)
  - Current ARR: $850,000
  - Contract Term: Annual
  - Auto-Renewal: No (manual approval required)
  - SLA Terms: 99.5% uptime during "operational windows"
- **AI Insight**:
  > "ALERT: Obsidian Black's contract does not auto-renew. Current relationship health (4.2/10) suggests renewal is at significant risk."

**Step 2: Performance History Analysis**
- **Artifact**: "Operational Incident Log" (timeline of failures)
- **Data Displayed**:
  - Oct 2024: Operation Blackout failure (47-sec latency, $850K cost impact)
  - Jun-Sep 2024: 87-day communication gap (predecessor left, no outreach)
  - Q2-Q4 2024: 4 different support liaisons (Obsidian Black had to re-explain requirements)
- **AI Insight**:
  > "Obsidian Black experienced 3 critical service failures in past 12 months. Most severe: Operation Blackout directly cost Obsidian Black $850K and damaged trust."

**Step 3: Risk Score Calculation**
- **Artifact**: "Threat Analysis Report" (health score breakdown)
- **Overall Health Score**: 4.2/10 (High Risk)
- **Component Scores**:
  - Product Performance: 3.1/10
  - Relationship Strength: 4.8/10
  - Strategic Alignment: 5.2/10
  - Support Quality: 3.5/10
  - Executive Sponsorship: 6.0/10
- **AI Insight**:
  > "CHURN PROBABILITY: 68%. Without intervention, renewal is unlikely."

**Step 4: Chat Flow - Strategic Response**
- **AI Prompt**: "What's your biggest concern about this account?"
- **Sarah's Options** (branching):
  1. "I'm worried we can't fix technical issues in time"
  2. "I don't know Elena Voss at all—she could tank this"
  3. "143 days isn't enough time to rebuild trust"
  4. "What if Marcus has already decided to leave?"
- **Demo Path**: Sarah selects #2
- **AI Response**:
  > "Astute concern. Dr. Voss is evaluating all vendors and launching a $1.7M initiative. Priority: Establish relationship within 7 days."

**Step 5: Account Plan Generation**
- **Artifact**: "Operational Continuity Blueprint" (strategic plan)
- **Generated Plan**:
  - **Phase 1 (Days 1-7)**: Immediate response
    - Respond to Marcus's email (Day 1)
    - Intro outreach to Elena (Day 3)
    - Schedule Marcus call (Day 5)
  - **Phase 2 (Days 8-30)**: Trust rebuilding
    - Elena discovery call
    - Deliver "Accountability Report" (what went wrong + fixes)
    - Propose dedicated liaison
    - Schedule Q1 QBR
  - **Phase 3 (Days 31-90)**: Roadmap positioning
    - Demo timezone automation prototype
    - Expansion proposal
    - Q1 QBR execution
    - Renewal negotiation kickoff
- **AI Summary**:
  > "If you execute this plan, renewal probability increases from 32% to 78%."

**Exit State**: Plan approved, tasks scheduled throughout year

---

### Workflow 2: Risk Detection & Mitigation
**Duration:** 2-3 minutes
**Purpose:** Demonstrate proactive risk catching (support ticket spike)

**Workflow Steps**:

**Step 1: Risk Alert**
- **Trigger**: Dashboard shows urgent task
  - "⚠️ Urgent: Support Ticket Spike - Obsidian Black"
  - Detected: 2 hours ago
  - Priority: High

**Step 2: Context Analysis**
- **Artifact**: "Operational Incident Log"
- **Data Displayed**:
  - 5 support tickets in 2 weeks (3x normal rate)
  - Themes: Performance issues, confusion about features
  - Sentiment analysis: Frustration detected
- **AI Insight**:
  > "Obsidian Black submitted 5 tickets in past 2 weeks. Sentiment analysis shows frustration. Recommend proactive check-in call before escalation."

**Step 3: Action Recommendation**
- **Artifact**: Call prep materials
  - Ticket summary
  - Suggested talking points
  - Draft email: "I noticed you've hit some bumps..."
- **Sarah Action**: Click "Schedule call"
- **AI Confirmation**:
  > "Call scheduled for tomorrow 2pm. Email sent. I'll prep briefing doc before the call."

---

### Workflow 3: Opportunity Detection
**Duration:** 2-3 minutes
**Purpose:** Show AI catching expansion opportunities (Elena's initiative)

**Workflow Steps**:

**Step 1: Opportunity Alert**
- **Trigger**: Dashboard task
  - "💡 Opportunity: New Initiative Detected - Obsidian Black"
  - Detected: This morning
  - Priority: Medium

**Step 2: Context Analysis**
- **Artifact**: "Expansion Scenarios & Capability Assessment"
- **Data Displayed**:
  - Dr. Elena Voss launching "Global Synchronization Initiative"
  - Potential value: $1.7M incremental ARR
  - Key requirement: Timezone-intelligent scheduling (current roadmap gap!)
  - Competitors: Elena reached out to VectorSync and OmniCoord
- **AI Insight**:
  > "Elena's evaluation is driven by ONE feature: timezone automation. If Squelch commits to Q1 2026 delivery, you neutralize competitive threat."

**Step 3: Action Recommendation**
- **Artifact**: Expansion proposal draft
  - Current package: $850K
  - Expansion package: +$1.7M (takes Obsidian Black to $2.55M total ARR)
  - Commitment required: Deliver timezone feature by March 2026
- **Sarah Action**: Click "Schedule Elena intro call"
- **AI Confirmation**:
  > "Intro email drafted. Positioning you as strategic partner, not vendor. Send?"

---

### Workflow 4: Executive Engagement Planning
**Duration:** 2 minutes
**Purpose:** Show strategic plan execution (QBR prep)

**Workflow Steps**:

**Step 1: Scheduled Touchpoint**
- **Trigger**: Dashboard task (from strategic plan)
  - "📋 Scheduled: Executive Engagement - Obsidian Black"
  - From: Strategic Account Plan (Month 7)
  - Due: This week

**Step 2: QBR Preparation**
- **Artifact**: "Strategic Alignment & Performance Debrief" (auto-generated QBR deck)
- **Data Displayed**:
  - Metrics: Response time improved, usage up, NPS increased
  - Risk caught: Support ticket spike (proactively resolved)
  - Opportunity pursued: Elena's initiative (in discussion)
  - Forward-looking: Renewal preview (on track)
- **AI Insight**:
  > "All tasks from your strategic plan are on schedule. This QBR demonstrates accountability and progress."

**Step 3: Meeting Scheduling**
- Sarah reviews deck, makes minor edits
- Schedules meeting with Marcus
- **AI Confirmation**:
  > "QBR scheduled for next Tuesday. Deck finalized. You're ready."

---

## Backend Requirements

### Database Schema (Obsidian Black Demo Data)

**Tables to Seed**:

1. **customers**
   ```sql
   {
     customer_id: "aco-001",
     name: "Obsidian Black",
     industry: "Global Strategic Coordination Services",
     operatives: 450,
     facilities: 23,
     arr: 1500000,
     renewal_date: "2026-04-15",
     health_score: 4.2,
     opportunity_score: 8.7
   }
   ```

2. **contacts**
   ```sql
   -- Marcus Castellan
   {
     contact_id: "aco-marcus",
     customer_id: "aco-001",
     name: "Marcus Castellan",
     title: "Chief Operating Officer",
     villain_designation: "The Orchestrator",
     engagement_level: "high",
     satisfaction: "low",
     last_contact: "2025-09-12"
   }

   -- Dr. Elena Voss
   {
     contact_id: "aco-elena",
     customer_id: "aco-001",
     name: "Dr. Elena Voss",
     title: "VP of Technical Operations",
     villain_designation: "Nightingale",
     engagement_level: "medium",
     is_evaluating_competitors: true,
     initiative_value: 1700000
   }
   ```

3. **operations** (Villain "projects")
   ```sql
   {
     operation_id: "op-blackout",
     customer_id: "aco-001",
     name: "Operation Blackout",
     status: "failed",
     failure_reason: "Platform latency (47-second delay)",
     cost_impact: 1500000,
     quarter: "Q4 2024"
   }
   ```

4. **support_tickets**
   ```sql
   {
     ticket_id: "4728",
     customer_id: "aco-001",
     subject: "Operative Smith can't access Phase 3 coordination documents",
     category: "permissions_error",
     priority: "high",
     resolution_time_hours: 72,
     sentiment: "frustrated"
   }
   ```

5. **contract_terms**
   ```sql
   {
     contract_id: "aco-contract-2025",
     customer_id: "aco-001",
     start_date: "2025-04-15",
     end_date: "2026-04-15",
     arr: 1500000,
     auto_renew: false,
     sla_uptime: 99.5,
     status: "active"
   }
   ```

### API Endpoints Required

**Customer Context API**:
- `GET /api/customers/aco` → Returns full Obsidian Black profile
- `GET /api/customers/aco/contacts` → Returns Marcus + Elena
- `GET /api/customers/aco/operations` → Returns Operation Blackout history
- `GET /api/customers/aco/health` → Returns risk/opportunity scores

**Workflow State API**:
- `POST /api/workflows/start` → Initializes workflow session
- `PUT /api/workflows/{id}/step` → Saves step progress
- `GET /api/workflows/{id}/context` → Retrieves customer context for workflow

**AI Insights API** (can be mocked for demo):
- `POST /api/ai/risk-analysis` → Returns risk breakdown
- `POST /api/ai/opportunity-analysis` → Returns expansion scenarios
- `POST /api/ai/email-draft` → Generates personalized email

---

## Frontend Requirements

### Components to Build/Modify

**Dashboard**:
- `TaskQueueDashboard.tsx` - Main landing page
- `CustomerProfileCard.tsx` - Obsidian Black profile display
- `HealthScoreIndicator.tsx` - Visual health/opportunity scores
- `TaskCard.tsx` - Clickable task launcher

**Workflows**:
- `StrategicPlanningWorkflow.tsx` - Workflow 1
- `RiskDetectionWorkflow.tsx` - Workflow 2
- `OpportunityWorkflow.tsx` - Workflow 3
- `ExecutiveEngagementWorkflow.tsx` - Workflow 4

**Artifacts**:
- `ContractIntelligenceArtifact.tsx` - Contract summary display
- `IncidentLogArtifact.tsx` - Timeline of failures
- `ThreatAnalysisReportArtifact.tsx` - Health score breakdown
- `AccountPlanArtifact.tsx` - Strategic plan display
- `QBRDeckArtifact.tsx` - Auto-generated QBR

**Shared**:
- `VillainThemedLayout.tsx` - Villain universe styling wrapper
- `AIInsightPanel.tsx` - AI response formatting

---

## Infrastructure Requirements

### Workflow Chaining System
**Requirement**: Ability to link multiple workflows into a "scene" that can be navigated sequentially or via timeline

**Implementation**:
1. `SceneConfig.ts` - Define scene structure:
   ```typescript
   interface SceneConfig {
     sceneId: string;
     name: string;
     workflows: WorkflowConfig[];
     transitionSlides?: SlideConfig[];
     timeline_date?: Date;
   }
   ```

2. `SceneNavigator.tsx` - Component for navigating between scenes
   - Forward/Back buttons
   - Scene progress indicator
   - Timeline view (optional)

3. `WorkflowChain.tsx` - Orchestrates workflow sequence within a scene

### Timeline Navigation (Optional for Act 1, Required for Full Demo)
**Requirement**: Visual timeline showing key dates, allowing jump to specific moments in the story

**Implementation** (Phase 2+):
1. Timeline component with 12-month view
2. Key dates marked (Operation Blackout, Communication Gap, Renewal Date)
3. Click date → Jump to relevant scene/workflow

**For Act 1**: Not required, but architecture should support it

---

## Data Seeding Requirements

### Seed Script Structure
```sql
-- seed_act1_villain_universe.sql

-- 1. Customer Organization
INSERT INTO customers (customer_id, name, industry, ...) VALUES (...);

-- 2. Contacts
INSERT INTO contacts (contact_id, customer_id, name, ...) VALUES (...);

-- 3. Historical Operations
INSERT INTO operations (operation_id, customer_id, name, ...) VALUES (...);

-- 4. Support Tickets
INSERT INTO support_tickets (ticket_id, customer_id, ...) VALUES (...);

-- 5. Contract Terms
INSERT INTO contract_terms (contract_id, customer_id, ...) VALUES (...);

-- 6. Strategic Plan (pre-seeded for demo continuity)
INSERT INTO strategic_plans (plan_id, customer_id, ...) VALUES (...);
```

### Demo Data Characteristics
- **Realistic**: Metrics and timelines feel plausible
- **Compelling**: Data tells a story (health declining, opportunity increasing)
- **Villain-themed**: Operation names, ticket subjects, terminology
- **Reusable**: Easy to swap for different "industries" (healthcare variant later)

---

## FE/BE Work Breakdown

### Front-End Engineer Scope

**Phase 1: Dashboard (2-3 hours)**
- [ ] Build TaskQueueDashboard.tsx
- [ ] Build CustomerProfileCard.tsx with Obsidian Black data
- [ ] Implement HealthScoreIndicator.tsx
- [ ] Integrate with backend customer API
- [ ] Test: Dashboard loads, task launches Workflow 1

**Phase 2: Workflow 1 - Strategic Planning (4-5 hours)**
- [ ] Build StrategicPlanningWorkflow.tsx with 5 steps
- [ ] Create ContractIntelligenceArtifact.tsx
- [ ] Create IncidentLogArtifact.tsx
- [ ] Create ThreatAnalysisReportArtifact.tsx
- [ ] Create AccountPlanArtifact.tsx
- [ ] Implement chat branching logic
- [ ] Test: Full workflow end-to-end

**Phase 3: Workflows 2-4 (6-8 hours)**
- [ ] Build RiskDetectionWorkflow.tsx
- [ ] Build OpportunityWorkflow.tsx
- [ ] Build ExecutiveEngagementWorkflow.tsx
- [ ] Create QBRDeckArtifact.tsx
- [ ] Test: All workflows function independently

**Phase 4: Scene Integration (2-3 hours)**
- [ ] Implement scene navigation (basic)
- [ ] Add workflow chaining (dashboard → W1 → W2 → W3 → W4)
- [ ] Polish transitions
- [ ] Test: Full Act 1 flow

**Phase 5: Villain Theming (1-2 hours)**
- [ ] Apply villain aesthetic (dark mode, tactical colors)
- [ ] Update artifact naming
- [ ] Add subtle villain references
- [ ] Test: Tone is professional, not campy

**Total FE Estimate**: 15-21 hours

---

### Back-End Engineer Scope

**Phase 1: Database Schema (2-3 hours)**
- [ ] Design Obsidian Black demo data schema
- [ ] Create migration scripts
- [ ] Document schema structure
- [ ] Review with FE for API contract alignment

**Phase 2: Data Seeding (3-4 hours)**
- [ ] Write seed script for Obsidian Black organization
- [ ] Seed Marcus Castellan contact
- [ ] Seed Dr. Elena Voss contact
- [ ] Seed Operation Blackout history
- [ ] Seed support tickets (realistic villain themes)
- [ ] Seed contract terms
- [ ] Test: All data loads correctly

**Phase 3: Customer Context API (4-5 hours)**
- [ ] Build `/api/customers/aco` endpoint
- [ ] Build `/api/customers/aco/contacts` endpoint
- [ ] Build `/api/customers/aco/operations` endpoint
- [ ] Build `/api/customers/aco/health` endpoint
- [ ] Test: FE can fetch all required data

**Phase 4: Workflow State API (3-4 hours)**
- [ ] Build workflow session management
- [ ] Build step progress persistence
- [ ] Build context retrieval
- [ ] Test: Workflows can save/resume state

**Phase 5: AI Insights (Mock or Real) (2-3 hours)**
- [ ] Build risk analysis endpoint (can return pre-written responses)
- [ ] Build opportunity analysis endpoint
- [ ] Build email drafting endpoint
- [ ] Test: AI responses feel intelligent

**Total BE Estimate**: 14-19 hours

---

## Definition of Done (Act 1)

### Acceptance Criteria

**Slide Deck**:
- [ ] 5 slides created with approved content
- [ ] Professional design (not campy)
- [ ] Villain theme subtle but present
- [ ] Transitions smooth, speaker notes included

**Dashboard**:
- [ ] Loads cleanly post-login
- [ ] Shows Obsidian Black profile with correct data
- [ ] Displays 1 task (Strategic Planning)
- [ ] Clicking task launches Workflow 1
- [ ] Health/opportunity scores visible

**Workflow 1** (Strategic Planning):
- [ ] All 5 steps render correctly
- [ ] Chat branching works
- [ ] Artifacts display Obsidian Black data
- [ ] Account plan generates properly
- [ ] Exit state: Plan approved

**Workflow 2** (Risk Detection):
- [ ] Support ticket spike detected
- [ ] Context analysis shows correct data
- [ ] Action recommendation provided
- [ ] Exit state: Call scheduled

**Workflow 3** (Opportunity):
- [ ] Elena's initiative detected
- [ ] Expansion proposal generated
- [ ] Competitive threat noted
- [ ] Exit state: Intro call scheduled

**Workflow 4** (Executive Engagement):
- [ ] QBR deck auto-generated
- [ ] Shows progress from strategic plan
- [ ] Exit state: Meeting scheduled

**Integration**:
- [ ] Dashboard → W1 → W2 → W3 → W4 flows smoothly
- [ ] No console errors
- [ ] Performance acceptable for live demo
- [ ] Villain tone consistent throughout

**Demo Readiness**:
- [ ] Sales engineer can run full Act 1 (15 min) without assistance
- [ ] Pause points clearly marked
- [ ] Can reset demo state easily
- [ ] All data is fictional (no real customer info)

---

## Timeline

**Week 1** (Phase 2): Technical Architecture
- BE: Schema design + seeding strategy
- FE: Dashboard mockups + workflow config design
- PM: Slide deck content outline

**Week 2-3** (Phase 3): Tier 1 Implementation
- BE: Database seeded, APIs built
- FE: Dashboard + Workflow 1 complete
- PM: Slide deck finalized

**Week 3-4** (Phase 3 continued): Complete Act 1
- BE: Mock AI endpoints, state persistence
- FE: Workflows 2-4 complete, scene integration
- PM: Full Act 1 rehearsal + feedback

**Week 4** (Phase 3 Sign-Off):
- Full Act 1 demo to Justin
- Refinements based on feedback
- Sign-off before moving to Act 2

---

## Open Questions / Decisions Needed

1. **Slide Deck Ownership**: Should PM create slides or just provide content for designer?
2. **AI Response Strategy**: Mock responses (pre-written) or real LLM integration for Act 1?
3. **Timeline Navigation**: Build basic version now or defer to Act 2?
4. **State Persistence**: Should demo workflows save state or reset each time?
5. **Mobile Responsive**: Desktop-only for demo, or make responsive?

---

**Document Version**: 1.0
**Created**: 2025-10-11
**Owner**: PM (Master Storyteller & Project Coordinator)
**Status**: Ready for Justin's review and FE/BE handoff
