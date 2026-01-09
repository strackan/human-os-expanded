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
**Output**: Protocols, crisis playbooks, decision frameworks

| Module | ID | Questions | Focus |
|--------|-----|-----------|-------|
| **Set G** | Gap Analysis / Personality Baseline | 24 | Decision-making, energy patterns, communication, crisis, work style |

**File**: `contexts/scott/GAP_ANALYSIS.md` (template)
**Total**: 24 questions, ~45 minutes

**Sections**:
- G1-G4: Decision-Making Under Stress
- G5-G10: Energy & Cognitive Patterns
- G11-G14: Communication Preferences
- G15-G19: Crisis & Recovery
- G20-G24: Work Style & Support

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

**Output Files** (Ten Commandments):
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

| Protocol | Purpose | Template |
|----------|---------|----------|
| CONVERSATION_PROTOCOLS.md | How to interact, energy modes, red flags | `_base/templates/` |
| CRISIS_PROTOCOLS.md | Overwhelm patterns, recovery support | `_base/templates/` |
| CURRENT_STATE.md | Living doc of priorities, energy, filters | `_base/templates/` |
| STRATEGIC_THOUGHT_PARTNER.md | Decision frameworks, strengths/weaknesses | `_base/templates/` |

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
| G | Gap Analysis / Baseline | 24 | Founder-OS |

### Supplementary

| Code | Name | Type |
|------|------|------|
| LR | Lightning Round | Challenge |
| AF | Absurdist Finale | Challenge |
| TC | Ten Commandments | Voice Pipeline |
| CD | Conductor | Interview Engine |

---

## FILE LOCATIONS

```
apps/goodhang/lib/assessment/
├── core-questions.json      # Q1: Sets A, B, C
├── questions.json           # Q2: Sets D, E, F
├── lightning-round-questions.json  # LR
└── absurdist-questions.json        # AF

contexts/{entity}/
├── GAP_ANALYSIS.md          # Q3: Set G (template in scott/)
├── voice/                   # Ten Commandments output
├── founder-os/              # Protocols
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
- **Output**: Protocol files, not scores
- **Updates**: CONVERSATION_PROTOCOLS, CRISIS_PROTOCOLS, CURRENT_STATE, identity files

---

## VERSION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-08 | 1.0 | Initial standardization |
