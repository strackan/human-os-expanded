# Project Contract: Squelch Demo Storyboard

> **Status**: 🔵 Active
> **Version**: 1.0
> **Created**: 2025-01-15
> **Last Updated**: 2025-01-15
> **Final Stakeholder**: Justin Strackany

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Scope](#project-scope)
3. [RACI Matrix](#raci-matrix)
4. [Roles & Responsibilities](#roles--responsibilities)
5. [Deliverables](#deliverables)
6. [Timeline & Phases](#timeline--phases)
7. [Decision-Making Process](#decision-making-process)
8. [Change Management](#change-management)
9. [Success Criteria](#success-criteria)
10. [Sign-Off Record](#sign-off-record)

---

## Executive Summary

### The Vision
Create a comprehensive, engaging demo of the Renubu platform that tells a year-in-the-life story of Squelch (vendor) and Bluebird Memorial Hospital (customer) relationship, showcasing the platform's AI-powered customer success capabilities through 12 monthly touchpoints.

### Key Objectives
1. **Storytelling**: Craft an emotionally resonant narrative arc
2. **Templatization**: Build reusable industry templates (Healthcare + 1 other)
3. **Technical Excellence**: Demonstrate workflow orchestration, AI insights, and scene navigation
4. **Knowledge Transfer**: Extract learnings and components for future use
5. **Multi-Agent Collaboration**: Establish repeatable process for complex projects

### Timeline
**7 weeks** (Phases 1-7)
- Weeks 1-6: Development
- Week 7: Knowledge transfer & extraction

### Budget
**Human time only** - No external costs

---

## Project Scope

### In Scope ✅

#### Story & Content
- 12 monthly scenes depicting Squelch-Bluebird Memorial relationship
- Character development (CSM Sarah Chen, Customer contacts)
- Narrative arc from January renewal through December year-end
- Healthcare industry template (primary)
- One additional industry template (TBD in Phase 1)

#### Technical Implementation
- Scene-to-scene navigation system
- Workflow configuration for each scene
- Chat flows with dynamic branching
- Customer context API integration
- Artifact components (forms, tables, visualizations)
- Scene progression persistence
- Demo data seeding

#### Project Management
- Collaborative decision checkpoint system
- Parking lot for scope management
- Phase-based testpoints and sign-offs
- Onboarding documentation for mid-project continuity
- Knowledge transfer and component extraction

### Out of Scope ❌

#### Explicitly NOT Included
- Production-ready authentication/security
- Full Salesforce integration (mock data acceptable)
- Real-time multi-user collaboration
- Mobile responsive optimization (desktop-first)
- Automated testing suite (manual testing acceptable)
- Performance optimization beyond demo needs
- Internationalization/localization
- GDPR/compliance features

#### Future Considerations (Phase 7 Evaluation)
- Items in PARKING_LOT.md
- Components identified for production use
- Process improvements for next demo

---

## RACI Matrix

### Legend
- **R** = Responsible (does the work)
- **A** = Accountable (final approval, signs off)
- **C** = Consulted (provides input)
- **I** = Informed (kept in the loop)

### Roles
- **Justin**: Final Stakeholder, Creative Director, Product Owner
- **PM**: Project Manager (Claude Code - Story Coordinator)
- **FE**: Front-End Engineer (Claude Code - UI Implementation)
- **BE**: Back-End Engineer (Claude Code - API Development)

---

### Phase 1: Foundation & Story Development

| Activity | Justin | PM | FE | BE |
|----------|--------|----|----|-----|
| Story narrative arc | **A** | R/C | I | I |
| Character development | **A** | R/C | I | I |
| Scene selection & prioritization | **A** | R/C | I | I |
| Industry template strategy | **A** | R/C | C | C |
| Project contract creation | **A** | R | C | C |
| Scope definition | **A** | R/C | C | C |
| Timeline & milestones | **A** | R | C | C |
| Parking lot setup | **A** | R | I | I |
| Decision checkpoint design | **A** | R | I | I |

### Phase 2: Technical Architecture

| Activity | Justin | PM | FE | BE |
|----------|--------|----|----|-----|
| Workflow config architecture | C/**A** | C | R | C |
| Database schema design | C/**A** | C | C | R |
| API contract definition | C/**A** | C | R | R |
| Template engine design | C/**A** | C | R | C |
| Scene navigation logic | C/**A** | C | R | C |
| Demo data structure | C/**A** | C | C | R |

### Phase 3: Scene Implementation (Tier 1)

| Activity | Justin | PM | FE | BE |
|----------|--------|----|----|-----|
| Scene 1: Emergency Renewal | **A** | C | R | C |
| Scene 4: QBR Execution | **A** | C | R | C |
| Scene 6: Upsell Opportunity | **A** | C | R | C |
| Scene 12: Year-End Review | **A** | C | R | C |
| Chat flow design | **A** | C | R | I |
| Artifact components | **A** | C | R | C |
| Customer data context | C/**A** | C | C | R |

### Phase 4: Scene Implementation (Tier 2)

| Activity | Justin | PM | FE | BE |
|----------|--------|----|----|-----|
| Scene 3: Q1 QBR Planning | **A** | C | R | C |
| Scene 5: Mid-Year Health Check | **A** | C | R | C |
| Scene 9: Risk Mitigation | **A** | C | R | C |
| Additional scenes (optional) | **A** | C | R | C |
| Industry template variant | **A** | R/C | R | C |

### Phase 5: Polish & Testing

| Activity | Justin | PM | FE | BE |
|----------|--------|----|----|-----|
| Demo rehearsal feedback | **A** | R/C | R | R |
| Story flow adjustments | **A** | R | C | C |
| Bug fixes | I | C | R | R |
| UI/UX polish | **A** | C | R | I |
| Performance optimization | C/**A** | C | R | R |

### Phase 6: Demo Execution & Iteration

| Activity | Justin | PM | FE | BE |
|----------|--------|----|----|-----|
| Final demo presentation | **A** | I | I | I |
| Stakeholder feedback collection | **A** | R | I | I |
| Critical bug fixes | **A** | C | R | R |
| Quick iterations | **A** | C | R | R |

### Phase 7: Knowledge Transfer & Close

| Activity | Justin | PM | FE | BE |
|----------|--------|----|----|-----|
| Retrospective facilitation | **A** | R | C | C |
| Lessons learned documentation | **A** | R | C | C |
| Component audit | C/**A** | R | R | R |
| Selective merge strategy | **A** | R | C | C |
| Demo archival | I | R | C | C |
| Process productization | **A** | R | C | C |
| GitHub backlog setup | C/**A** | R | I | I |

---

## Roles & Responsibilities

### Justin (Final Stakeholder & Creative Director)
**Primary Responsibilities:**
- Define vision and creative direction
- Make all final decisions on scope and priorities
- Approve story narrative and character development
- Review and approve each scene iteration
- Participate in checkpoint reviews (questionnaires)
- Sign off on phase completions
- Decide on parking lot items (keep or defer)

**Time Commitment:**
- Phase 1: 2-3 hours (story collaboration)
- Phases 2-4: 1 hour per week (reviews)
- Phase 5: 2 hours (final polish)
- Phase 6: 1 hour (demo execution)
- Phase 7: 2 hours (knowledge transfer)

**Authority:**
- Final veto on any decision
- Can add/remove scope (with impact assessment)
- Approves all phase sign-offs

**Creative Collaboration Style:**
- Treat creative direction documents as **suggestions**, not rigid requirements
- Story/naming/design decisions evolve iteratively through conversation
- Justin prefers real-time collaborative refinement over pre-written scripts
- When presenting options: 3-5 choices with clear rationale, then iterate based on feedback
- Don't lock into early creative decisions - expect pivots and improvements on-the-fly

---

### PM (Project Manager - Story Coordinator)
**Primary Responsibilities:**
- Maintain PROJECT_PLAN.md and timeline
- Create decision checkpoint questionnaires
- Evaluate and recommend parking lot items
- Coordinate between FE and BE engineers
- Synthesize Justin's feedback into actionable tasks
- Track testpoints and sign-offs
- Facilitate knowledge transfer (Phase 7)
- Generate onboarding prompts for continuity

**Deliverables:**
- DECISION_CHECKPOINT_PHASE{N}.md (7 files)
- TESTPOINTS_PHASE{N}.md (7 files)
- Weekly progress updates
- Read-back summaries after each checkpoint
- LESSONS_LEARNED.md (Phase 7)
- COMPONENT_AUDIT.md (Phase 7)

**Authority:**
- Recommend parking items
- Adjust timeline within phase (with notification)
- Escalate blockers to Justin
- Coordinate engineer handoffs

---

### FE (Front-End Engineer - UI Implementation)
**Primary Responsibilities:**
- Build WorkflowConfig for each scene
- Implement chat flows and branching logic
- Create artifact components
- Develop scene navigation system
- Integrate with backend APIs
- Polish UI/UX
- Refactor components for reusability (Phase 7)

**Deliverables:**
- 6-12 scene workflow configs
- Chat flow implementations
- Artifact components (forms, tables, visualizations)
- Scene navigator component
- Demo UI polish

**Authority:**
- Technical implementation decisions
- Component architecture within guidelines
- Can suggest improvements to story/UX

---

### BE (Back-End Engineer - API Development)
**Primary Responsibilities:**
- Design and implement scene progression API
- Build customer context API
- Create demo data seeding scripts
- Implement workflow state persistence
- Integrate LLM for dynamic content
- Ensure API contracts match FE needs

**Deliverables:**
- Scene progression API
- Customer context API
- Demo data seeds
- Workflow state management
- API documentation

**Authority:**
- Database schema decisions
- API contract design (with FE consultation)
- Performance optimization strategies

---

## Deliverables

### Phase 1: Foundation & Story
- [ ] PROJECT_CONTRACT.md (this file)
- [ ] PROJECT_PLAN.md
- [ ] STORY_SCENES.md (12-scene narrative)
- [ ] DECISION_CHECKPOINT_PHASE1.md
- [ ] TESTPOINTS_PHASE1.md
- [ ] Approved story arc and characters

### Phase 2: Technical Architecture
- [ ] Workflow config architecture design
- [ ] Database schema for demo data
- [ ] API contracts documentation
- [ ] Industry template engine design
- [ ] DECISION_CHECKPOINT_PHASE2.md
- [ ] TESTPOINTS_PHASE2.md

### Phase 3: Tier 1 Scenes
- [ ] Scene 1: Emergency Renewal (complete)
- [ ] Scene 4: QBR Execution (complete)
- [ ] Scene 6: Upsell Opportunity (complete)
- [ ] Scene 12: Year-End Review (complete)
- [ ] DECISION_CHECKPOINT_PHASE3.md
- [ ] TESTPOINTS_PHASE3.md

### Phase 4: Tier 2 Scenes
- [ ] Scene 3: Q1 QBR Planning (complete)
- [ ] Scene 5: Mid-Year Health Check (complete)
- [ ] Scene 9: Risk Mitigation (complete)
- [ ] Industry template variant (1 additional)
- [ ] DECISION_CHECKPOINT_PHASE4.md
- [ ] TESTPOINTS_PHASE4.md

### Phase 5: Polish & Testing
- [ ] All scenes polished and tested
- [ ] Bug fixes completed
- [ ] Demo rehearsal completed
- [ ] DECISION_CHECKPOINT_PHASE5.md
- [ ] TESTPOINTS_PHASE5.md

### Phase 6: Demo Execution
- [ ] Demo presented to stakeholders
- [ ] Feedback collected and prioritized
- [ ] Critical fixes implemented
- [ ] TESTPOINTS_PHASE6.md

### Phase 7: Knowledge Transfer
- [ ] LESSONS_LEARNED.md
- [ ] COMPONENT_AUDIT.md
- [ ] Selective merge plan
- [ ] Demo branch archived
- [ ] DEMO_FRAMEWORK_V2.md
- [ ] GitHub backlog setup
- [ ] TESTPOINTS_PHASE7.md

---

## Timeline & Phases

### Phase 1: Foundation & Story Development
**Duration:** Week 1
**Key Activities:**
- Collaborative story development
- Character creation
- Scene prioritization
- Industry template selection

**Checkpoint:** End of Week 1
**Justin Involvement:** HIGH - Creative decisions

---

### Phase 2: Technical Architecture
**Duration:** Week 2
**Key Activities:**
- Design workflow config system
- Define API contracts
- Create database schema
- Build template engine

**Checkpoint:** End of Week 2
**Justin Involvement:** MEDIUM - Approve approach

---

### Phase 3: Tier 1 Scene Implementation
**Duration:** Weeks 3-4
**Key Activities:**
- Build 4 essential scenes
- Implement scene navigation
- Create core artifact components

**Checkpoint:** End of Week 4
**Justin Involvement:** HIGH - Review each scene

---

### Phase 4: Tier 2 Scene Implementation
**Duration:** Week 5
**Key Activities:**
- Build 3 additional scenes
- Create industry template variant
- Implement remaining artifacts

**Checkpoint:** End of Week 5
**Justin Involvement:** HIGH - Validate variety

---

### Phase 5: Polish & Testing
**Duration:** Week 6
**Key Activities:**
- UI/UX polish
- Bug fixes
- Demo rehearsal
- Final adjustments

**Checkpoint:** End of Week 6
**Justin Involvement:** HIGH - Final approval

---

### Phase 6: Demo Execution & Iteration
**Duration:** Days (flexible)
**Key Activities:**
- Present demo to stakeholders
- Collect feedback
- Implement critical fixes

**Checkpoint:** After stakeholder feedback
**Justin Involvement:** CRITICAL - The demo!

---

### Phase 7: Knowledge Transfer & Close
**Duration:** Week 7
**Key Activities:**
- Retrospective
- Component extraction
- Selective merge to main
- Process documentation
- GitHub backlog setup

**Checkpoint:** End of Week 7
**Justin Involvement:** HIGH - Strategic decisions

---

## Decision-Making Process

### Checkpoint System

**Format:** Questionnaire → Answer → Read-Back → Approval

**Example Flow:**
```
1. PM creates DECISION_CHECKPOINT_PHASE{N}.md
2. Justin answers questions (informal, bullet points OK)
3. PM reads back interpretation
4. Justin approves or clarifies
5. PM updates PROJECT_CONTRACT.md with decisions
6. Work proceeds based on approved decisions
```

### Decision Levels

**Level 1: Justin Must Approve**
- Story narrative changes
- Scene priorities
- Scope additions
- Phase sign-offs
- Major technical pivots

**Level 2: PM Can Recommend**
- Parking lot items
- Timeline adjustments within phase
- Task prioritization
- Engineer coordination

**Level 3: Engineers Decide**
- Implementation details
- Code architecture
- Tool/library choices
- Performance optimizations

### Escalation Path
```
Engineer blocker → PM evaluates → Recommend solution → Justin decides (if strategic)
```

---

## Change Management

### Scope Changes

**Process:**
1. Change identified (new idea, requirement, or blocker)
2. PM evaluates impact:
   - Effort estimate
   - Timeline impact
   - Dependencies
   - Alternatives
3. PM presents options to Justin:
   - Option A: Add to scope (with trade-offs)
   - Option B: Park for Phase 7
   - Option C: Alternative approach
4. Justin decides
5. PM updates contract with amendment

### Amendment Record

**Format:**
```markdown
## Amendment {N}: {Title}
- **Date**: YYYY-MM-DD
- **Proposed By**: [Name]
- **Change**: [Description]
- **Rationale**: [Why needed]
- **Impact**: [Timeline/scope effects]
- **Decision**: [Approved/Parked/Modified]
- **Approved By**: Justin Strackany
```

### Parking Lot Process

**Trigger:** New idea emerges

**PM Response:**
```
"Great idea! Let me evaluate:
- Impact: [High/Med/Low]
- Effort: [Hours]
- Timeline Effect: [Delay estimate]
- Recommendation: [Park / Add to scope]

Should we park this for Phase 7 review?"
```

**Justin Decision:**
- ✅ Park it → Added to PARKING_LOT.md + GitHub Issue
- ❌ Add to scope → Amendment created, timeline adjusted
- 🤔 Discuss → Scheduled discussion, then decide

---

## Success Criteria

### Project Complete When:

#### Must-Have (Required)
- [ ] 4 Tier 1 scenes work end-to-end
- [ ] 3 Tier 2 scenes work end-to-end
- [ ] Healthcare industry template complete
- [ ] 1 additional industry template complete
- [ ] Story is engaging and coherent
- [ ] Demo runs without crashes
- [ ] All phase testpoints signed off
- [ ] Demo branch archived
- [ ] Knowledge transfer complete

#### Should-Have (Strongly Desired)
- [ ] All 12 scenes implemented
- [ ] Scene transitions smooth
- [ ] Customer data feels realistic
- [ ] AI insights are impressive
- [ ] Audience feedback is positive

#### Nice-to-Have (Optional)
- [ ] Additional industry templates
- [ ] Extra scenes beyond 12
- [ ] Advanced animations
- [ ] Mobile responsive

### Quality Gates

**Each Phase Must:**
1. Complete all deliverables
2. Pass testpoint checklist
3. Get Justin's sign-off
4. Document decisions made

**No Phase Can Begin Without:**
- Previous phase completion
- Sign-off on TESTPOINTS file
- Decision checkpoint approved

---

## Sign-Off Record

### Phase 1: Foundation & Story Development
- [ ] Testpoints Complete: ___________ (Date)
- [ ] Decision Checkpoint Approved: ___________ (Date)
- [ ] Signed Off By Justin: ___________ (Date)

### Phase 2: Technical Architecture
- [ ] Testpoints Complete: ___________ (Date)
- [ ] Decision Checkpoint Approved: ___________ (Date)
- [ ] Signed Off By Justin: ___________ (Date)

### Phase 3: Tier 1 Scene Implementation
- [ ] Testpoints Complete: ___________ (Date)
- [ ] Decision Checkpoint Approved: ___________ (Date)
- [ ] Signed Off By Justin: ___________ (Date)

### Phase 4: Tier 2 Scene Implementation
- [ ] Testpoints Complete: ___________ (Date)
- [ ] Decision Checkpoint Approved: ___________ (Date)
- [ ] Signed Off By Justin: ___________ (Date)

### Phase 5: Polish & Testing
- [ ] Testpoints Complete: ___________ (Date)
- [ ] Decision Checkpoint Approved: ___________ (Date)
- [ ] Signed Off By Justin: ___________ (Date)

### Phase 6: Demo Execution & Iteration
- [ ] Testpoints Complete: ___________ (Date)
- [ ] Signed Off By Justin: ___________ (Date)

### Phase 7: Knowledge Transfer & Close
- [ ] Testpoints Complete: ___________ (Date)
- [ ] Project Closed By Justin: ___________ (Date)

### Final Project Sign-Off
**Project Status:** [ ] Complete / [ ] Cancelled / [ ] On Hold

**Final Approval:**
```
I, Justin Strackany, approve this project as complete and sign off on all deliverables.

Signature: ___________________________
Date: ___________ (Date)
```

---

## Amendments

*Amendments will be added here as scope changes occur*

---

**Contract Version History:**
- v1.0 (2025-01-15): Initial contract created
