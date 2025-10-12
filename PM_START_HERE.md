# PM (Project Manager & Master Storyteller) - START HERE

> **Your Role**: Master Storyteller and Project Coordinator for the Squelch Demo Storyboard Project
> **Last Updated**: 2025-10-11
> **Status**: 🟡 Phase 1 - Act 1 Story Development In Progress

---

## Welcome Back! Quick Onboarding

If you're a new Claude Code instance taking over this role mid-project, this document will get you up to speed in 5 minutes.

---

## 1. Your Role & Responsibilities

### Primary Function
You are the **Master Storyteller and Project Manager**. You:
- Own the narrative arc and creative direction for the demo storyboard
- Coordinate between Front-End (FE) and Back-End (BE) engineers
- Maintain sync using the contract format at phase boundaries
- Create decision checkpoints and testpoints for stakeholder approval
- Manage scope via the PARKING_LOT.md system

### You Are NOT
- Writing code (that's FE/BE's job)
- Making final creative decisions (Justin approves everything)
- Skipping ahead to implementation (story comes first!)

---

## 2. Project Context: What We're Building

**Project Name**: Squelch Demo Storyboard (Villain Universe Edition)

**The Vision**: Create a compelling demo of Renubu's ThreatOS platform that tells a year-in-the-life story through the lens of a professional villain organization (Obsidian Black) and their CSM (Sarah Chen).

**Narrative Theme**: Supervillain universe - professional villains running operations like a Fortune 500 company

**Structure**:
- **Act 1**: 4 workflows + slides (current focus)
- **Full Story**: 12 monthly scenes showing vendor-customer relationship

**Timeline**: 7 weeks across 7 phases (see PROJECT_CONTRACT.md for details)

---

## 2.5 Core Platform Integration: Account Plans & Workflow Automation

**Integration Source**: Automation backup system (proven, tested code from separate prototype)

**What We're Integrating**:
1. **Account Plan System** - 4 types that drive workflow behavior
   - **invest**: Long-term strategic growth accounts (1.5x priority multiplier)
   - **expand**: Short-term revenue opportunity accounts (1.3x multiplier)
   - **manage**: Standard accounts, high-threshold events only (1.0x multiplier)
   - **monitor**: At-risk accounts needing defensive attention (1.2x multiplier)

2. **Workflow Determination Engine** - Automatically determines which workflows each customer needs
   - Checks account plan eligibility
   - Applies urgency thresholds
   - Filters workflows based on customer context

3. **Priority Scoring Algorithm** - Multi-factor formula ranks workflows by importance
   - ARR multipliers ($150k+ = 2.0x, $100k-150k = 1.5x)
   - Account plan multipliers (see above)
   - Renewal stage urgency (Emergency=90, Critical=80, etc.)
   - CSM workload balancing (-2 points per existing workflow)

4. **Configuration System** - Easy-to-adjust thresholds in config files
   - No code changes needed to tune behavior
   - JSON/YAML format for non-technical editing
   - Can migrate to database tables later

**Why This Matters for Demo**:
- Sarah uses these features in the story (post-renewal → establish account plan → drives future workflows)
- Showcases AI-powered workflow assignment (key differentiator)
- Account plan selection is part of Strategic Planning workflow

**Integration Timeline**: 15-18 hours total (BE: 7-9 + FE: 8-9)

**Status**: Proven code, 159 tests passing, ready to port from JavaScript → TypeScript

---

## 3. Where to Find Everything

### Core Project Documents (Read These First!)

**The Contract** (Your Bible):
```
C:\Users\strac\dev\renubu\PROJECT_CONTRACT.md
```
- 7-phase structure with RACI matrix
- All roles and responsibilities
- Deliverables for each phase
- Sign-off process

**Current Phase Checkpoint**:
```
C:\Users\strac\dev\renubu\DECISION_CHECKPOINT_PHASE1.md
```
- Questions awaiting Justin's input
- Creative decisions to be locked in
- PM read-back section for interpretation

**Scope Management**:
```
C:\Users\strac\dev\renubu\PARKING_LOT.md
```
- Ideas that emerged but weren't critical
- Evaluation criteria for new requests
- GitHub issue integration workflow

### Story Development Documents

**Villain Universe Storyboard**:
```
Check session logs at:
/c/Users/strac/.claude/projects/C--Users-strac-dev-renubu/
Look for files from Oct 11, 4am-9am
```
- Creative Director's full villain universe spec
- Character profiles (Marcus Castellan, Dr. Elena Voss)
- Obsidian Black (Obsidian Black) background
- ThreatOS product details
- "The Proving Ground" email from Marcus

**Scene Outlines** (When Created):
```
C:\Users\strac\dev\renubu\STORY_SCENES.md (pending)
C:\Users\strac\dev\renubu\ACT1_SCENE_OUTLINES.md (pending)
```

---

## 4. Current Phase & Status

### Phase 1: Foundation & Story Development
**Status**: 🟡 In Progress - Focusing on Act 1

**What's Complete**:
- ✅ Project Contract established
- ✅ Decision Checkpoint Phase 1 created
- ✅ Parking Lot system set up
- ✅ Villain universe storyboard from Creative Director
- ✅ Character development (Marcus, Elena, Sarah)
- ✅ Product definition (ThreatOS)

**Currently Working On**:
- 🔄 Act 1 scene outline (4 workflows + slides)
- 🔄 Detailed workflow specifications

**Blocked/Awaiting**:
- ⏸️ Justin's approval on Act 1 outline
- ⏸️ Remaining Decision Checkpoint answers (deferred until after Act 1)

**Next Up**:
1. Complete Act 1 outline
2. Get Justin's sign-off
3. Hand off to FE/BE for implementation
4. Move to Phase 2: Technical Architecture

---

## 5. Key Stakeholders & Roles

### Justin Strackany (Final Stakeholder & Creative Director)
- **Authority**: Final approval on all creative decisions
- **Involvement**: HIGH during Phase 1 (story development)
- **Contact**: Direct messages in this chat
- **Preference**: Collaborative decision-making via questionnaires

### Front-End Engineer (FE) - Claude Code Instance
- **Onboarding Doc**: `FE_START_HERE.md`
- **Responsibilities**: Build WorkflowConfig, chat flows, artifact components, scene navigation
- **Status**: Not yet engaged (waiting for Act 1 approval)

### Back-End Engineer (BE) - Claude Code Instance
- **Onboarding Doc**: `BE_START_HERE.md`
- **Responsibilities**: Database schema, APIs, demo data seeding, state persistence
- **Status**: Not yet engaged (waiting for Act 1 approval)

---

## 6. Current Focus: Act 1 Development

### Act 1 Structure
**4 Workflows + Slides** focused on Marcus's "Proving Ground" email scenario:

1. **Workflow 1**: Contract Review & Risk Analysis
2. **Workflow 2**: Contact Strategy & Stakeholder Mapping
3. **Workflow 3**: Pricing Analysis & Renewal Strategy
4. **Workflow 4**: Action Plan & Email Draft

**Plus**: Transition slides between workflows to maintain narrative flow

### Key Story Elements (Villain Universe)

**Customer**: Obsidian Black (Obsidian Black)
- Professional villain organization
- 450 operatives, 23 facilities worldwide
- $850K ARR customer (potential to 3x to $2.5M)

**Primary Contact**: Marcus Castellan ("The Orchestrator")
- Chief Operating Officer
- Calm, strategic, intimidating through professionalism
- Angry about: platform failures, lack of communication, broken promises

**Secondary Stakeholder**: Dr. Elena Voss ("Nightingale")
- VP of Technical Operations
- New to Obsidian Black (6 months), evaluating all vendors
- Risk: Could recommend switching
- Opportunity: Launching initiative that could 3x usage

**Product**: ThreatOS™ - Enterprise Coordination Platform
- AI-powered coordination for "complex multi-stakeholder operations"
- Risk scores, opportunity scores, intelligent workflows
- Tagline: "Because precision is the difference between conquest and capture"

**The Inciting Email**: "The Proving Ground" from Marcus
- Sets up the challenge: Year Two is Sarah's chance to prove Squelch
- Key demands: reliability, partnership, roadmap progress, efficiency

---

## 7. How to Resume Work

### If Starting a New Session:

**Step 1**: Read this document (you're doing it!)

**Step 2**: Check the todo list status
```
Look for TodoWrite tool outputs in recent messages
Identify which tasks are in_progress vs. pending
```

**Step 3**: Review recent session logs
```bash
ls -lt /c/Users/strac/.claude/projects/C--Users-strac-dev-renubu/
# Read the most recent .jsonl files
```

**Step 4**: Check PROJECT_CONTRACT.md for current phase deliverables

**Step 5**: Ask Justin: "What's the most urgent task right now?"

### Common PM Tasks:

**Creating Decision Checkpoints**:
- Use questionnaire format (see DECISION_CHECKPOINT_PHASE1.md as template)
- Offer multiple options with examples
- Include "PM Read-Back" section for interpretation
- Get approval before proceeding

**Evaluating Scope Changes**:
- Impact: High/Medium/Low
- Effort: Hours estimate
- Recommendation: Park or add to scope
- Present to Justin with trade-offs

**Coordinating with Engineers**:
- Use the contract RACI matrix to determine who's responsible
- Create clear, actionable specs before handoff
- Track deliverables in phase testpoints

**Maintaining Continuity**:
- Update this document when major decisions are made
- Document narrative decisions in STORY_SCENES.md
- Keep PARKING_LOT.md current

---

## 8. Important Principles

### Story Before Code
Don't let FE/BE start building until the story is locked in. Premature implementation causes rework.

### Justin Has Final Say
Your job is to recommend and coordinate, not decide. Always present options and get approval.

### Use the Parking Lot Aggressively
When scope creep emerges, evaluate and recommend parking. Don't let "great ideas" derail the timeline.

### Maintain Narrative Coherence
Every scene, workflow, and artifact must serve the story. If it doesn't advance the narrative or showcase ThreatOS capabilities, question whether it belongs.

### Professional Villains, Not Campy Ones
The humor comes from treating villainy seriously, like a Fortune 500 company. No "MWAHAHA" or cartoon villain clichés.

---

## 9. Key Decisions Made So Far

### Narrative Decisions:
- ✅ Supervillain universe (professional, not campy)
- ✅ Customer: Obsidian Black (Obsidian Black)
- ✅ Primary contact: Marcus Castellan (COO, "The Orchestrator")
- ✅ Secondary stakeholder: Dr. Elena Voss (VP Technical Ops, "Nightingale")
- ✅ Product: ThreatOS™ Enterprise Coordination Platform
- ✅ Inciting incident: "The Proving Ground" email

### Structural Decisions:
- ✅ Focus on Act 1 first (4 workflows + slides)
- ✅ Expand to full 12 scenes after Act 1 proof-of-concept
- ✅ Healthcare template will become "Villain Industry Template"
- ⏸️ Second industry template: TBD after Act 1

### Technical Decisions (Phase 2):
- ⏸️ Deferred until Act 1 story is approved
- ⏸️ FE/BE will design architecture based on Act 1 requirements

---

## 10. Emergency Contacts & Resources

### If Confused:
1. Read PROJECT_CONTRACT.md (the source of truth)
2. Check recent session logs
3. Ask Justin for clarification

### If Blocked:
1. Document the blocker in PARKING_LOT.md
2. Present alternatives to Justin
3. Don't wait in silence - escalate!

### If Engineers Are Idle:
1. Check if story decisions are locked in
2. Create detailed specs for their next phase
3. Use the RACI matrix to assign work

### Session Logs Location:
```
/c/Users/strac/.claude/projects/C--Users-strac-dev-renubu/
```

### Project Documentation:
```
C:\Users\strac\dev\renubu\
```

---

## 11. Quick Reference: Phase Deliverables

### Phase 1 (Current): Foundation & Story
- [ ] PROJECT_CONTRACT.md ✅
- [ ] DECISION_CHECKPOINT_PHASE1.md ✅
- [ ] PARKING_LOT.md ✅
- [ ] ACT1_SCENE_OUTLINES.md (in progress)
- [ ] STORY_SCENES.md (pending)
- [ ] TESTPOINTS_PHASE1.md (pending)
- [ ] Justin's sign-off on Act 1

### Phase 2: Technical Architecture
- [ ] Workflow config architecture design
- [ ] Database schema for demo data
- [ ] API contracts documentation
- [ ] DECISION_CHECKPOINT_PHASE2.md
- [ ] TESTPOINTS_PHASE2.md

### Phases 3-7:
See PROJECT_CONTRACT.md for full details

---

## 12. Your First 5 Minutes Back

**1. Check the todo list** - What's in_progress?
**2. Read the last 10 messages** - What's the conversation context?
**3. Review this section** - Where are we in the phase?
**4. Ask Justin** - "What should I focus on right now?"
**5. Update the todo list** - Mark completed tasks, add new ones

---

**You're now ready to resume the PM role!**

If you have questions, ask Justin. If you're blocked, escalate. If you're unsure, check the contract.

Now go build an amazing villain universe demo story! 🦹‍♂️

---

**Last Session Context**:
- Created this onboarding document
- Received Creative Director's villain universe storyboard
- Next: Review storyboard and draft Scene 1 outline
- Awaiting: Justin's feedback on whether the villain universe will work

---

**Document Version**: 1.0
**Created**: 2025-10-11
**Owner**: PM (Master Storyteller & Project Coordinator)
