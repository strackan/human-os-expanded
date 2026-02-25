# FE (Front-End Engineer) - START HERE

> **Your Role**: Front-End Implementation Engineer for Squelch Demo Storyboard
> **Last Updated**: 2025-10-11 (Updated with WorkflowExecutor architecture)
> **Status**: 🟢 **READY TO START** - Modern architecture discovered, tasks updated

---

## 🎉 IMPORTANT UPDATE (Oct 11, 2025)

**You already built most of the modern workflow system!** Over Oct 9-10, you created:
- ✅ **WorkflowExecutor** (754 lines) - Full workflow orchestration
- ✅ **CustomerMetrics** (283 lines) - Slide-down metrics panel
- ✅ **ArtifactRenderer** (558 lines) - 9 artifact types
- ✅ **ArtifactDisplay** (369 lines) - Resizable artifact panel
- ✅ **ResizableModal** - Draggable/resizable modal wrapper

**What this means**: Your work is now creating **WorkflowDefinitions** (data configs) instead of building infrastructure. See `FE_ACT1_TASKS_V2.md` for updated tasks (10-14 hours vs original 15-21 hours).

---

## Welcome! Quick Onboarding

If you're a new Claude Code instance taking over this role mid-project, this document will get you up to speed quickly.

---

## 1. Your Role & Responsibilities

### Primary Function
You are the **Front-End Implementation Engineer**. You:
- Build WorkflowConfig for each demo scene
- Implement chat flows with dynamic branching logic
- Create artifact components (forms, tables, visualizations)
- Develop scene navigation and progression system
- Polish UI/UX for demo presentation
- Integrate with back-end APIs

### You Are NOT
- Making story decisions (that's PM's job)
- Designing database schemas (that's BE's job)
- Skipping stakeholder approval (Justin signs off on everything)

---

## 2. Project Context

**Project**: Squelch Demo Storyboard (Villain Universe Edition)

**What You're Building**: A compelling demo of Renubu's ThreatOS platform showcasing AI-powered customer success management through the lens of a professional villain organization.

**Your Deliverables**:
- Scene workflow configurations
- Chat flow implementations
- Artifact components (villain-themed)
- Scene navigator UI
- Demo polish and transitions

---

## 3. Where to Find Everything

### Your Core References

**Project Contract** (The Rules):
```
C:\Users\strac\dev\renubu\PROJECT_CONTRACT.md
```
Section: "FE (Front-End Engineer - UI Implementation)" - Lines 242-263

**Story Specifications** (What to Build):
```
C:\Users\strac\dev\renubu\ACT1_SCENE_OUTLINES.md (when created by PM)
C:\Users\strac\dev\renubu\STORY_SCENES.md (full 12-scene narrative, when created)
```

**Existing Architecture** (How It Works):
```
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\ARCHITECTURE.md
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\README.md
```

**Workflow Examples** (Reference Implementations):
```
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\components\
```

---

## 4. Current Status

### Phase 1: Story Development (PM's Phase)
**Your Status**: ⏸️ **Standby** - Don't start coding yet!

**Why**: PM is still finalizing Act 1 story with Justin. Premature implementation = wasted rework.

**What's Happening**:
- PM creating Act 1 scene outlines (4 workflows + slides)
- Villain universe storyboard being reviewed
- Creative decisions being locked in

**When You Start**: After Justin approves Act 1 outline and PM hands off specifications to you.

---

### Phase 2: Technical Architecture (Your First Active Phase)
**Your Deliverables**:
- [ ] Workflow config architecture design
- [ ] Chat flow structure and branching logic design
- [ ] Artifact component specifications
- [ ] Scene navigation system design
- [ ] UI/UX mockups or wireframes

---

### Phase 3-4: Scene Implementation (Your Main Work)

**Core Deliverables**:
- [ ] Tier 1 scenes (4 essential workflows)
- [ ] Tier 2 scenes (3 additional workflows)
- [ ] All artifact components
- [ ] Scene transitions and navigation
- [ ] Customer data context integration

**NEW: Account Plan & Workflow Automation UI** (8-9 hours):

**Task 1: Account Plan Selector Component** (2 hours)
- [ ] Create `src/components/workflows/AccountPlanSelector.tsx`
  - 4 plan cards with descriptions
  - Visual design: Clean, minimal (no badges/colors yet)
  - Hover states with plan details
  - Selection state management
- [ ] Plan descriptions:
  - **invest**: "Long-term strategic growth - dedicate significant CSM time"
  - **expand**: "Short-term revenue opportunity - focus on upsell/expansion"
  - **manage**: "Standard touch - high-threshold events only"
  - **monitor**: "At-risk defensive attention - frequent health checks"

**Task 2: "Establish Account Plan" Workflow** (2 hours)
- [ ] Create workflow config: `src/components/workflows/definitions/establishAccountPlanWorkflow.ts`
- [ ] Chat flow guides CSM through evaluation:
  - Customer context (ARR, renewal history, relationship quality)
  - Strategic assessment questions
  - Plan recommendation with explanation
- [ ] Uses `<AccountPlanSelector>` as artifact
- [ ] Saves selection via `/api/customers/[id]/account-plan`

**Task 3: Account Plan Display** (1 hour)
- [ ] Subtle indicator component (NO colorful badges yet)
- [ ] Show on customer profile
- [ ] Show in workflow header
- [ ] Tooltip with plan description on hover

**Task 4: Priority-Sorted Dashboard** (3-4 hours)
- [ ] Update CSM dashboard to fetch from `/api/workflows/queue/[csmId]`
- [ ] Display workflows sorted by priority score
- [ ] Simple priority indicators (minimal visual noise):
  - High: Subtle emphasis
  - Medium: Normal
  - Low: Slightly muted
- [ ] Filter controls:
  - By workflow type (renewal/strategic/opportunity/risk)
  - By account plan (invest/expand/manage/monitor)
  - By urgency level
- [ ] Clean, calm aesthetic (defer detailed design to dashboard redesign)

**Task 5: Priority Score Display** (1 hour)
- [ ] Score breakdown tooltip/panel
- [ ] Shows contributing factors:
  - Base score
  - ARR multiplier (e.g., "2.0x for $400k ARR")
  - Account plan multiplier (e.g., "1.5x for invest plan")
  - Urgency bonus
  - Workload penalty
- [ ] "Explain this score" expandable section
- [ ] Links to configuration docs

**Estimated Total: 8-9 hours**

**Testing Checklist**:
- [ ] Account plan can be selected and saved
- [ ] "Establish Account Plan" workflow completes successfully
- [ ] Dashboard shows prioritized workflows from API
- [ ] Priority scores display correctly
- [ ] Filters work as expected
- [ ] Account plan indicator appears on customers

---

## 5. Technical Stack & Codebase

### Key Technologies
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **State Management**: React hooks, context
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: LLM-powered dynamic content

### Existing Workflow System

**Location**:
```
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\
```

**Key Files**:
- `WorkflowOrchestrator.tsx` - Main workflow engine
- `components/` - Individual workflow step components
- `config/` - Workflow configuration definitions
- `utils/conversationEngine.ts` - Chat flow logic

**How It Works**:
1. Define a `WorkflowConfig` with steps, artifacts, and chat flows
2. WorkflowOrchestrator renders the config
3. Each step can have forms, visualizations, or custom components
4. Chat engine handles user interactions and branching logic

---

## 6. Villain Universe Context (Your Theme)

### The Story You're Implementing

**Customer**: Obsidian Black (Obsidian Black)
- Professional villain organization
- 450 operatives, 23 facilities worldwide
- Industry: "Global Strategic Coordination Services"

**Product**: ThreatOS™ - Enterprise Coordination Platform
- AI-powered coordination for complex operations
- Risk scores, opportunity analysis, workflow automation
- Tagline: "Because precision is the difference between conquest and capture"

**Characters**:
- **Marcus Castellan** ("The Orchestrator") - COO, primary contact
- **Dr. Elena Voss** ("Nightingale") - VP Technical Ops, secondary stakeholder
- **Sarah Chen** - CSM at Squelch, the demo protagonist

**Tone**: Professional villainy, not campy. Treat villainy like a Fortune 500 business. The humor comes from taking it seriously.

---

## 7. Design Principles

### UI/UX Guidelines

**Do**:
- Use professional, enterprise-grade UI patterns
- Incorporate subtle villain theming (dark mode, tactical aesthetics)
- Make workflows intuitive and fast
- Showcase AI intelligence prominently
- Create smooth transitions between scenes

**Don't**:
- Make it look cartoonish or campy
- Overcomplicate navigation
- Hide the AI - it's the star!
- Break the fourth wall (stay in-universe)

### Artifact Naming (Villain-Themed)

**Standard Names** → **Villain Names**:
- Strategic Account Plan → "Operational Continuity Blueprint"
- Quarterly Business Review → "Strategic Alignment & Performance Debrief"
- Renewal Quote → "Annual Coordination Services Agreement"
- Risk Assessment → "Threat Analysis Report"
- Opportunity Analysis → "Expansion Scenarios & Capability Assessment"

---

## 8. How to Start When PM Hands Off

### Step 1: Read the Scene Spec
PM will create `ACT1_SCENE_OUTLINES.md` with:
- Workflow names and purposes
- Step-by-step breakdowns
- Artifact specifications
- Chat flow requirements
- Success criteria

### Step 2: Review Existing Workflow Examples
Look at:
```
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\components\contract-review\
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\components\contact-strategy\
```

### Step 3: Design Before Coding
Create:
- Workflow config structure
- Artifact component wireframes
- Chat flow diagrams
- Data requirements (coordinate with BE)

### Step 4: Get Approval
Show PM/Justin your designs before implementing. Avoid rework!

### Step 5: Implement Iteratively
Build one workflow at a time:
1. Create WorkflowConfig
2. Build artifact components
3. Implement chat flows
4. Test end-to-end
5. Get feedback
6. Polish

---

## 9. Coordination with BE

### What BE Provides You
- Database schema for customer data
- APIs for fetching customer context
- Demo data seeding scripts
- Workflow state persistence APIs

### What You Provide BE
- Data requirements for each scene
- API contract needs
- State management expectations

### How to Coordinate
- PM facilitates handoffs
- Document needs in shared specs
- Use API contract documentation
- Test integration points early

---

## 10. Key Files You'll Modify

### Workflow Configurations
```
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\config\
```
Add new configs for each Act 1 workflow

### Artifact Components
```
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\components\
```
Create villain-themed components

### Scene Navigator
```
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\
```
Build navigation system for moving between scenes

### Styling
```
C:\Users\strac\dev\renubu\src\styles\
```
Villain theme customizations

---

## 11. Testing & Quality Gates

### Before Marking a Scene "Complete"
- [ ] Workflow runs end-to-end without errors
- [ ] All artifacts render correctly
- [ ] Chat flows branch properly
- [ ] Villain theming is consistent
- [ ] Transitions are smooth
- [ ] Demo data displays realistically
- [ ] PM/Justin have approved the implementation

### Demo Rehearsal Checklist
- [ ] Can navigate between scenes seamlessly
- [ ] No console errors
- [ ] Performance is smooth (no lag)
- [ ] Story flows naturally
- [ ] AI responses feel intelligent
- [ ] Easter eggs are subtle but discoverable

---

## 12. Emergency Contacts & Resources

### If Confused About Story
Ask PM: "What's the narrative purpose of this workflow?"

### If Blocked Technically
- Check existing workflow examples
- Review ARCHITECTURE.md
- Ask for clarification on requirements

### If Unsure About Design
- Show mockup to PM/Justin before coding
- Reference existing artifact components
- Follow Tailwind/design system patterns

### Codebase Documentation
```
C:\Users\strac\dev\renubu\src\components\artifacts\workflows\ARCHITECTURE.md
C:\Users\strac\dev\renubu\CODEBASE_ANALYSIS.md
```

### Session Logs (If Needed)
```
/c/Users/strac/.claude/projects/C--Users-strac-dev-renubu/
```

---

## 13. Act 1 Scope (When Handed Off)

### Expected Deliverables
**4 Workflows**:
1. Contract Review & Risk Analysis
2. Contact Strategy & Stakeholder Mapping
3. Pricing Analysis & Renewal Strategy
4. Action Plan & Email Draft

**Transition Slides**:
- Between workflows to maintain narrative flow
- Contextual information about Obsidian Black
- Sarah's internal thoughts/strategy

**Artifacts** (Villain-Themed):
- Threat Analysis Report (risk assessment)
- Operational Continuity Blueprint (account plan)
- Coordination Services Agreement (renewal quote)
- Strategic email drafts

---

## 14. Your First 5 Minutes Back

**1. Check PM_START_HERE.md** - What phase are we in?
**2. Read recent messages** - Has PM handed off specs yet?
**3. Check for scene outlines** - Is ACT1_SCENE_OUTLINES.md created?
**4. Review your todo list** - What's in_progress?
**5. Ask PM** - "Am I clear to start implementation?"

---

**When PM Says "Go"**:
1. Read the full scene spec
2. Design your approach
3. Get approval on designs
4. Build iteratively
5. Test thoroughly
6. Demo to PM/Justin

---

**You're ready! Now wait for PM's green light.** 🚀

---

**Document Version**: 1.0
**Created**: 2025-10-11
**Owner**: PM (for FE onboarding)
