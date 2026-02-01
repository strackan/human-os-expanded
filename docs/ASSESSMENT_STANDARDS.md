# Human-OS Assessment & Analysis Module Standards

## Overview

This document standardizes naming conventions for all question sets, assessments, and analysis pipelines across the Human-OS ecosystem.

---

## QUESTIONNAIRES (User-Facing Assessments)

### Questionnaire 1: Personality Assessment (GoodHang Social)
**Purpose**: Social matching, D&D character generation
**Output**: Character profile, 6 attributes, compatibility signals

| Module | ID | Questions | Focus |
|--------|-----|-----------|-------|
| **Set A** | Life Story | 4 | McAdams narrative identity (turning point, happiest memory, difficult time, redemption) |
| **Set B** | Inner Self | 3 | Core identity (failed someone, stripped-away self, simple thing that matters) |
| **Set C** | Connection | 3 | Relational style (relationship needs, intellectual gap, happiness barrier) |

**File**: `apps/goodhang/lib/assessment/core-questions.json`
**Total**: 10 questions, ~20 minutes

---

### Questionnaire 2: Work Assessment (Hiring/Skills)
**Purpose**: Skills evaluation, tier ranking, archetype classification
**Output**: Dimension scores, tier (Top 1%/Strong/Moderate/Weak/Pass), archetype

| Module | ID | Questions | Focus |
|--------|-----|-----------|-------|
| **Set D** | Core CS Assessment | 12+ | Background, EQ/Empathy, Technical, Strategic, Communication |
| **Set E** | AI Readiness Specialty | 7 | Prompt engineering, AI literacy, tool usage |
| **Set F** | GTM Specialty | 4 | Sales strategy, expansion, prioritization |

**File**: `apps/goodhang/lib/assessment/questions.json`
**Total**: 23+ questions, ~25 minutes

---

### Questionnaire 3: Founder-OS Baseline (Executive Support)
**Purpose**: Establish workstyle, crisis patterns, cognitive profile for AI Chief of Staff
**Output**: Ten Commandments (protocols, crisis playbooks, decision frameworks)

| Module | ID | Questions | Focus |
|--------|-----|-----------|-------|
| **Question E** | Personality Baseline | 31 | Decision-making, energy patterns, communication, crisis, work style, motivation |
| **FOS Interview** | Consolidated Interview | 12 | Story, identity, work/AI preferences |

**Question E Sections** (E01-E31):
- E01-E04: Decision-Making Under Stress → DECISION_MAKING.md
- E05-E09: Energy & Cognitive Patterns → ENERGY_PATTERNS.md
- E10: Structure Preferences → CONVERSATION_PROTOCOLS.md
- E11-E14: Communication Preferences → SUPPORT_CALIBRATION.md
- E15-E19: Crisis & Recovery → AVOIDANCE_PATTERNS.md, RECOVERY_PROTOCOLS.md
- E20-E24: Work Style & Support → WORK_STYLE.md
- E25-E28: Rapport & AI Preferences → SUPPORT_CALIBRATION.md
- E29-E31: Motivation Drivers → ENERGY_PATTERNS.md, WORK_STYLE.md, SUPPORT_CALIBRATION.md

**FOS Consolidated Interview Sections** (fos-interview-a1 to c5):
- Section A (a1-a4): Your Story → profile
- Section B (b1-b3): Who You Are → profile
- Section C (c1-c5): Work & AI → fingerprint, guardrails, voice

**Total**: 31 Question E + 12 FOS Interview = 43 questions, ~60 minutes

---

## CHALLENGES (Supplementary Assessments)

| Challenge | ID | Purpose | Format |
|-----------|-----|---------|--------|
| **Lightning Round** | LR-1 | Cognitive speed, pattern recognition | 15 questions, 2 min, 150+ question pool |
| **Absurdist Finale** | AF-1 | Creative thinking, problem-solving style | 1 required + 10 optional, open-ended |

**Files**:
- `apps/goodhang/lib/assessment/lightning-round-questions.json`
- `apps/goodhang/lib/assessment/absurdist-questions.json`

---

## TEN COMMANDMENTS PIPELINE (Voice-OS Generation)

**Purpose**: Create personalized voice packs for content generation
**Input**: Public content corpus + clarification interview
**Output**: Ten Commandments (structured voice documentation)

| Stage | Agent | Purpose | Input → Output |
|-------|-------|---------|----------------|
| **Stage 1** | Scraper | Corpus collection | Public URLs → Raw content |
| **Stage 2** | Analyst | Pattern extraction | Raw content → Initial voice patterns |
| **Stage 3** | Sculptor | Clarification interview | Patterns + Person → Corrected/validated patterns |
| **Stage 4** | Polisher | Final synthesis | Validated patterns → Ten Commandments |

**Output Files** (Voice-OS Ten Commandments):
```
contexts/{entity}/voice/
├── VOICE.md          # Always/never rules, signature phrases
├── THEMES.md         # Beliefs, habits, tensions
├── GUARDRAILS.md     # Sacred cows, hard NOs, evolution
├── STORIES.md        # Defining narratives
├── ANECDOTES.md      # Short memorable examples
├── OPENINGS.md       # Opening patterns
├── MIDDLES.md        # Argument structures
├── ENDINGS.md        # Closing patterns, CTAs
├── BLENDS.md         # Content recipes
└── EXAMPLES.md       # Reference outputs
```

---

## FOUNDER-OS TEN COMMANDMENTS (Support Documentation)

**Purpose**: Create personalized support protocols for AI Chief of Staff
**Input**: Question E (E01-E31) + FOS Consolidated Interview + Sculptor Session
**Output**: Ten Commandments (structured support documentation)

| # | File | Purpose | Primary Questions |
|---|------|---------|-------------------|
| 1 | CONVERSATION_PROTOCOLS.md | How to interact, energy modes, red flags | E10-E14, fos-interview-c3 |
| 2 | CRISIS_PROTOCOLS.md | Acute overwhelm patterns, emergency response | E08, E15, E17, E19 |
| 3 | CURRENT_STATE.md | Living doc of priorities, energy, context | E05, E18 |
| 4 | STRATEGIC_THOUGHT_PARTNER.md | Decision frameworks, strengths/weaknesses | E01-E04 |
| 5 | DECISION_MAKING.md | How they make decisions under stress | E01-E04, fos-interview-c1 |
| 6 | ENERGY_PATTERNS.md | Cognitive/physical energy, optimal conditions | E05-E09, E29, fos-interview-c1 |
| 7 | WORK_STYLE.md | How to support effectively, priorities | E20-E24, E30, fos-interview-c1 |
| 8 | AVOIDANCE_PATTERNS.md | What "stuck" looks like, interventions | E07, E15-E16, fos-interview-c2 |
| 9 | RECOVERY_PROTOCOLS.md | Reset/restoration beyond crisis | E16-E19, fos-interview-c2 |
| 10 | SUPPORT_CALIBRATION.md | Meta: state detection + mode switching | E11-E14, E31, fos-interview-c3-c5 |

**Output Files** (Founder-OS Ten Commandments):
```
contexts/{entity}/founder-os/
├── CONVERSATION_PROTOCOLS.md  # How to interact
├── CRISIS_PROTOCOLS.md        # Emergency response
├── CURRENT_STATE.md           # Live context
├── STRATEGIC_THOUGHT_PARTNER.md # Decision frameworks
├── DECISION_MAKING.md         # Decision patterns
├── ENERGY_PATTERNS.md         # Energy management
├── WORK_STYLE.md              # Support preferences
├── AVOIDANCE_PATTERNS.md      # Stuck patterns
├── RECOVERY_PROTOCOLS.md      # Reset protocols
└── SUPPORT_CALIBRATION.md     # Meta-calibration
```

**Templates**: `contexts/_base/templates/`

---

## CONDUCTOR SYSTEM (Immersive Interview Engine)

**Purpose**: Natural language interview for work assessment
**Location**: `packages/analysis/src/conductor/`

| Scene | Character | Purpose | Max Exchanges |
|-------|-----------|---------|---------------|
| Scene 1 | Earl (Elevator) | Warmup, social calibration, first impression | 3 |
| Scene 2 | Maria (Reception) | Goals, interests, communication style | 3 |
| Scene 3 | Interviewer (Office) | Deep dive across all dimensions | Open |

**Output**: Transcript, dimension scores (11), archetype, tier, recommendation

---

## FOUNDER-OS PROTOCOLS (Instantiated Support)

**Purpose**: Personalized AI Chief of Staff configuration
**Location**: `contexts/{entity}/founder-os/`

See **FOUNDER-OS TEN COMMANDMENTS** section above for full file list.

**Core Files** (Original 4):
| Protocol | Purpose |
|----------|---------|
| CONVERSATION_PROTOCOLS.md | How to interact, energy modes, red flags |
| CRISIS_PROTOCOLS.md | Overwhelm patterns, recovery support |
| CURRENT_STATE.md | Living doc of priorities, energy, filters |
| STRATEGIC_THOUGHT_PARTNER.md | Decision frameworks, strengths/weaknesses |

**Extended Files** (Added for Ten Commandments parity):
| Protocol | Purpose |
|----------|---------|
| DECISION_MAKING.md | Decision patterns under stress/overwhelm |
| ENERGY_PATTERNS.md | Cognitive/physical energy, optimal conditions |
| WORK_STYLE.md | How to support effectively, priority presentation |
| AVOIDANCE_PATTERNS.md | What "stuck" looks like, intervention methods |
| RECOVERY_PROTOCOLS.md | Reset/restoration beyond crisis |
| SUPPORT_CALIBRATION.md | Meta: state detection + mode switching |

**Identity Files** (`contexts/{entity}/identity/`):
- `core.md` - North star, unfair advantage, two-context model
- `cognitive-profile.md` - ADHD/neurodivergent patterns
- `communication.md` - Preferences, values, response style

---

## MASTER INDEX

### By Product

| Product | Questionnaires | Purpose |
|---------|---------------|---------|
| **GoodHang** | Q1 (A/B/C) + LR + AF | Social matching |
| **Renubu/Hiring** | Q2 (D/E/F) + Conductor | Work assessment |
| **Founder-OS** | Q3 (G) + Ten Commandments | Executive support |

### By Letter Code

| Code | Name | Questions | Product |
|------|------|-----------|---------|
| A | Life Story | 4 | GoodHang |
| B | Inner Self | 3 | GoodHang |
| C | Connection | 3 | GoodHang |
| D | Core CS Assessment | 12+ | Renubu |
| E | AI Readiness | 7 | Renubu |
| F | GTM Specialty | 4 | Renubu |
| G/E | Personality Baseline + FOS Interview | 31+12 | Founder-OS |

### Supplementary

| Code | Name | Type |
|------|------|------|
| LR | Lightning Round | Challenge |
| AF | Absurdist Finale | Challenge |
| TC-V | Voice-OS Ten Commandments | Voice Pipeline |
| TC-F | Founder-OS Ten Commandments | Support Pipeline |
| CD | Conductor | Interview Engine |

---

## FILE LOCATIONS

```
apps/goodhang/lib/assessment/
├── core-questions.json      # Q1: Sets A, B, C
├── questions.json           # Q2: Sets D, E, F
├── lightning-round-questions.json  # LR
└── absurdist-questions.json        # AF

contexts/_base/templates/
├── DECISION_MAKING.md       # Founder-OS template
├── ENERGY_PATTERNS.md       # Founder-OS template
├── WORK_STYLE.md            # Founder-OS template
├── AVOIDANCE_PATTERNS.md    # Founder-OS template
├── RECOVERY_PROTOCOLS.md    # Founder-OS template
└── SUPPORT_CALIBRATION.md   # Founder-OS template

contexts/{entity}/
├── voice/                   # Voice-OS Ten Commandments
│   ├── VOICE.md ... EXAMPLES.md (10 files)
├── founder-os/              # Founder-OS Ten Commandments
│   ├── CONVERSATION_PROTOCOLS.md
│   ├── CRISIS_PROTOCOLS.md
│   ├── CURRENT_STATE.md
│   ├── STRATEGIC_THOUGHT_PARTNER.md
│   ├── DECISION_MAKING.md
│   ├── ENERGY_PATTERNS.md
│   ├── WORK_STYLE.md
│   ├── AVOIDANCE_PATTERNS.md
│   ├── RECOVERY_PROTOCOLS.md
│   └── SUPPORT_CALIBRATION.md
└── identity/                # Baseline profiles

packages/analysis/src/
├── conductor/               # CD: Interview engine
└── scoring/                 # Dimension scoring
```

---

## SCORING SYSTEMS

### Questionnaire 1 (Personality)
- **Attributes**: INT, WIS, CHA, CON, STR, DEX (1-10)
- **Alignment**: 9-point grid (Lawful/Neutral/Chaotic × Good/Neutral/Evil)
- **Output**: D&D character (race, class, title)

### Questionnaire 2 (Work)
- **Dimensions**: IQ, EQ, Empathy, Self-Awareness, Technical, AI Readiness, GTM, Personality, Motivation, Work History, Passions, Culture Fit
- **Tier**: Top 1%, Strong, Moderate, Weak, Pass
- **Archetype**: Technical Builder, GTM Operator, Creative Strategist, Execution Machine, Generalist Orchestrator, Domain Expert

### Questionnaire 3 (Founder-OS)
- **Output**: Ten Commandments protocol files, not scores
- **Updates**: All 10 Founder-OS files + identity files

---

## VERSION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-08 | 1.0 | Initial standardization |
| 2026-02-01 | 1.1 | Added Founder-OS Ten Commandments (6 new files), E29-E31 motivation questions, FOS Consolidated Interview reference |
