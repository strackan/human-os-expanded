# Human-OS Onboarding Pipeline

## Overview

This document describes the complete onboarding flow for Human-OS, from initial corpus collection through thick client onboarding. The pipeline transforms raw content (LinkedIn posts, writing samples) into personalized Ten Commandments documentation that powers both Voice-OS (content generation) and Founder-OS (AI Chief of Staff).

**Related Documentation:**
- `docs/ASSESSMENT_STANDARDS.md` - Question set definitions, scoring systems
- `docs/training/SCULPTOR_ONBOARDING.md` - Sculptor session details

---

## The Full Onboarding Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HUMAN-OS ONBOARDING PIPELINE                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  STAGE 1     │     │  STAGE 2     │     │  STAGE 3     │
│  Corpus      │────▶│  Auditor     │────▶│  Sculptor    │
│  Collection  │     │  Analysis    │     │  Session     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
  LinkedIn Posts      CORPUS_SUMMARY.md    SCULPTOR_TRANSCRIPT.md
  Manual Text         GAP_ANALYSIS.md      Conversation History
  Profile Data        sculptor_session      Corrections/Validations


┌──────────────┐     ┌──────────────────────────────────────────────┐
│  STAGE 4     │     │  STAGE 5: Thick Client                       │
│  Gap Final   │────▶│  ┌────────────┬───────────┬────────────────┐ │
│  Analysis    │     │  │ Tutorial   │ Question E │ Voice Testing  │ │
└──────────────┘     │  │ Interview  │ Assessment │ (3 content)    │ │
       │             │  └────────────┴───────────┴────────────────┘ │
       ▼             └──────────────────────────────────────────────┘
  GAP_ANALYSIS_FINAL.md         │
  Outstanding Questions         ▼
  Persona Fingerprint     VOICE-OS Ten Commandments (10 files)
                          FOUNDER-OS Ten Commandments (10 files)
                          Identity Files (3 files)
```

---

## Stage 1: Corpus Collection (LinkedIn App + Manual)

**Purpose:** Gather raw content corpus - the user's authentic voice and publicly shared ideas.

### Sources

| Source | Destination | Description |
|--------|-------------|-------------|
| LinkedIn Scraper (Chrome Extension) | `gft.contacts`, `gft.li_posts` | Automated profile and post collection |
| Manual Text Input | Local files | Newsletters, emails, transcripts, writing samples |
| Profile Data | `gft.contacts` | LinkedIn headline, about, experience |

### Key Code

- `apps/founder-os/mcp/src/tools/gft-ingestion.ts` - LinkedIn profile ingestion
- Database: `gft.li_posts` (posts), `gft.li_post_engagements` (engagement data)
- Database: `gft.contacts` (profile data)

### Output

Raw corpus text (unstructured)

---

## Stage 1b: Corpus Files Created

The auditor creates these corpus documentation files:

| File | Location | Purpose | Size |
|------|----------|---------|------|
| `corpus_raw.md` | Local | Full dump of all scraped content | Large (~55K words) |
| `CONTEXT.md` | Local | Structured biographical details | Medium |
| `DIGEST.md` | Local | Analyzed corpus with identity statement | ~6K words |
| `CORPUS_SUMMARY.md` | Supabase Storage | Short summary for sculptor injection | ~2-3K words |

### Naming Convention

- `corpus_raw.md` - Unprocessed dump (equivalent to "corpus_transcript")
- `DIGEST.md` - Detailed analysis (equivalent to "corpus_abridged")
- `CORPUS_SUMMARY.md` - Short version for sculptor context window

---

## Stage 2: Auditor Analysis (Pre-Sculptor)

**Purpose:** Analyze corpus against Ten Commandments structure, identify gaps, generate Sculptor interview targets.

### Edge Function

`supabase/functions/sculptor-onboard/index.ts`

### Process

1. Takes raw corpus input (LinkedIn posts, other text)
2. Calls Claude to generate `CORPUS_SUMMARY.md` - structured identity snapshot
3. Fetches question bank from DB (CORE + FOS domains)
4. Scores corpus against questions, identifies what's answered vs. missing
5. Generates `GAP_ANALYSIS.md` - questions for Sculptor to explore
6. Creates `sculptor_session` record with access code (`sc_{entity_slug}`)

### API Endpoint

`POST /api/sculptor/onboard`

### Request

```typescript
interface OnboardRequest {
  entity_slug: string;
  entity_name: string;
  corpus_raw: string;
  skip_character_check?: boolean;
}
```

### Output Files

Uploaded to Supabase Storage:

```
contexts/{entity}/
├── CORPUS_SUMMARY.md   # What we know from corpus
└── GAP_ANALYSIS.md     # Questions to explore in Sculptor
```

### Response

```typescript
{
  status: "complete" | "pending_character",
  access_code: string,           // e.g., "sc_scott"
  session_id: string,
  entity_slug: string,
  files_uploaded: string[],
  url: string                    // Sculptor session URL
}
```

---

## Stage 3: Sculptor Session (NPC Interview)

**Purpose:** Conduct natural conversation to fill gaps and validate/correct corpus analysis.

### Key Code

- `apps/goodhang/lib/sculptor/SculptorService.ts` - Session management
- `apps/goodhang/app/api/sculptor/sessions/[sessionId]/messages/stream/route.ts` - Chat streaming
- `contexts/_shared/NPC_GROUND_RULES.md` - Character resilience rules
- `contexts/{entity}/CHARACTER.md` - NPC scene and personality

### Session Flow

1. User validates access code (`sc_entity_slug`)
2. System loads context: CHARACTER.md + CORPUS_SUMMARY.md + GAP_ANALYSIS.md
3. NPC conducts naturalistic interview (improvised conversation)
4. Conversation history stored in session metadata
5. Session completes when `<!-- SESSION_COMPLETE -->` marker detected

### System Prompt Composition (in order)

1. Base template (NPC principles, improvisation rules)
2. Ground rules (NPC_GROUND_RULES.md)
3. Character profile (CHARACTER.md) - [ENTITY_NAME] substituted
4. Corpus summary (CORPUS_SUMMARY.md) - "What We Know"
5. Gap analysis (GAP_ANALYSIS.md) - "Extraction Targets"

### Interview Mechanics

- Open → Explore → Pursue → Close flow
- Frame-breaking inoculation (handles meta questions)
- Character never breaks, acknowledges then pivots
- Captures responses with sequence tracking

### Output

- `SCULPTOR_TRANSCRIPT.md` - Full conversation record
- Session metadata with conversation history

---

## Stage 4: Gap Final Analysis (Post-Sculptor)

**Purpose:** Analyze completed Sculptor session against outstanding questions, score persona, identify remaining gaps for thick client.

### Edge Function

`supabase/functions/sculptor-gap-final/index.ts`

### Triggered By

- SESSION_COMPLETE marker in stream route
- POST to `/api/sculptor/sessions/[sessionId]/finalize`

### Process

1. Fetches completed conversation from session
2. Fetches CORE + FOS questions from database
3. Calls Claude to analyze each question: answered or not?
4. Scores user on 8 persona dimensions
5. Generates `GAP_ANALYSIS_FINAL.md` with structured output
6. Stores persona fingerprint in session metadata

### Request

```typescript
interface GapFinalRequest {
  session_id: string;
}
```

### Structured Output

```typescript
{
  status: "complete",
  entity_slug: string,
  session_id: string,
  outstanding_questions: Array<{
    slug: string,           // e.g., "E15"
    text: string,           // The question text
    category: string        // "decision-making", "energy", etc.
  }>,
  questions_answered: number,
  questions_total: number,
  persona_fingerprint: PersonaFingerprint,
  gap_analysis_path: string
}
```

### Persona Fingerprint (8 dimensions, 0-10 scale)

```typescript
interface PersonaFingerprint {
  self_deprecation: number;       // Self-deprecating humor usage
  directness: number;             // Blunt vs diplomatic
  warmth: number;                 // Emotional temperature
  intellectual_signaling: number; // Leading with intelligence
  comfort_with_sincerity: number; // Genuineness without awkwardness
  absurdism_tolerance: number;    // Comfort with weird/playful tangents
  format_awareness: number;       // Meta about interaction
  vulnerability_as_tool: number;  // Using weaknesses to connect
}
```

### GAP_ANALYSIS_FINAL.md Structure

```markdown
## Summary
- Questions answered: 85%
- Outstanding: 15%

## Outstanding Questions

| # | Domain | Question | Category | Priority |
|---|--------|----------|----------|----------|
| E15 | fos | What does "stuck" look like for you? | avoidance | 1 |
| E16 | fos | What helps you get unstuck? | recovery | 1 |

## Already Answered (Don't Ask Again)

| # | Domain | Question | Evidence |
|---|--------|----------|----------|
| E01 | fos | When you're overwhelmed... | "I just pick one thing..." |
```

---

## Stage 5: Thick Client Onboarding (User Registration + Validation)

**Purpose:** User answers remaining questions, validates voice, completes setup.

### Key Code

- `apps/goodhang-desktop/src/routes/founder-os/onboarding.tsx` - Stage controller
- `apps/goodhang-desktop/src/routes/founder-os/tutorial.tsx` - Interview flow
- `apps/goodhang-desktop/src/routes/founder-os/question-e.tsx` - Question E assessment
- `apps/goodhang-desktop/src/routes/founder-os/voice-test.tsx` - Voice validation

### Stage Progression

```
intro → sculpting → renubu → polishing → ready

Stage 1: The Sculptor Interview (identity clarification)
Stage 2: Question E Personality Baseline (24-31 questions)
Stage 3: Identity Profile (finalize from answers)
Stage 4: Onboarding Call (human touch)
```

### Substages

#### 5a. Tutorial Interview

- Reviews executive report from Sculptor + gap_final
- Shows tabs: status, personality, voice, character
- Allows inline editing/confirmation
- Can request full assessment if updates needed

#### 5b. Question E Assessment

- Loads outstanding questions from gap_final
- Skips already-answered questions
- Groups by section: Decision-Making, Energy, Communication, Crisis, Work Style
- One question at a time with typeform-style UX
- Saves each answer: `POST /api/questions/answer`

#### 5c. Voice Testing

Tests AI voice across 3 content types:

1. **LinkedIn Thought Leadership** - expertise voice
2. **LinkedIn Personal Story** - vulnerability voice
3. **Connection Request** - interpersonal warmth

Rating loop: if <9, collects feedback:
- What didn't work
- What a 10 would look like
- Helpful instruction for improvement

Generates "Ten Commandments" for voice.

### Question E Categories (E01-E31)

| Section | Questions | Populates |
|---------|-----------|-----------|
| Decision-Making Under Stress | E01-E04 | DECISION_MAKING.md |
| Energy & Cognitive Patterns | E05-E09, E29 | ENERGY_PATTERNS.md |
| Communication Preferences | E10-E14 | CONVERSATION_PROTOCOLS.md, SUPPORT_CALIBRATION.md |
| Crisis & Recovery | E15-E19 | AVOIDANCE_PATTERNS.md, RECOVERY_PROTOCOLS.md |
| Work Style & Support | E20-E24, E30 | WORK_STYLE.md |
| Motivation Drivers | E29-E31 | ENERGY_PATTERNS.md, WORK_STYLE.md, SUPPORT_CALIBRATION.md |

---

## Database Schema Summary

### Sessions

| Table | Purpose |
|-------|---------|
| `sculptor_sessions` | Interview sessions with access codes |
| `sculptor_responses` | Captured responses (sequence, scene, question) |
| `sculptor_templates` | NPC templates (system prompts) |

### Questions

| Table | Purpose |
|-------|---------|
| `questions` | Normalized question bank (slug, domain, text, options) |
| `question_sets` | Workflow templates (which questions when) |
| `question_set_questions` | Junction table |
| `entity_answers` | What we've learned (value_text, value_choice, value_numeric) |
| `entity_dimensions` | Computed D-series fingerprint |

### Corpus

| Table | Purpose |
|-------|---------|
| `gft.contacts` | LinkedIn profile data |
| `gft.li_posts` | LinkedIn posts |
| `context_files` | Registry of markdown files in storage |

### Storage

**Bucket:** `contexts` (Supabase)
**Path:** `{entity_slug}/{filename}`

---

## File Locations

### Files in Supabase Storage (per entity)

```
contexts/{entity}/
├── CHARACTER.md           # NPC character for sculptor
├── CORPUS_SUMMARY.md      # Short summary for sculptor injection
├── GAP_ANALYSIS.md        # Pre-sculptor gaps to explore
└── GAP_ANALYSIS_FINAL.md  # Post-sculptor outstanding questions
```

### Files in Local Repo (per entity)

```
contexts/{entity}/
├── corpus_raw.md          # Full dump of scraped content
├── CONTEXT.md             # Structured biographical details
├── DIGEST.md              # Analyzed corpus (~6K words)
├── CORPUS_SUMMARY.md      # Mirror of storage version
├── SCULPTOR_TRANSCRIPT.md # Full sculptor conversation
├── START_HERE.md          # Entry point with file index
└── GAP_ANALYSIS.md        # Mirror of storage version
```

---

## Output Files (Ten Commandments)

### Voice-OS (10 files)

```
contexts/{entity}/voice/
├── VOICE.md       # Always/never rules, signature phrases
├── THEMES.md      # Beliefs, habits, tensions
├── GUARDRAILS.md  # Sacred cows, hard NOs
├── STORIES.md     # Defining narratives
├── ANECDOTES.md   # Short examples
├── OPENINGS.md    # Opening patterns
├── MIDDLES.md     # Argument structures
├── ENDINGS.md     # Closing patterns
├── BLENDS.md      # Content recipes
└── EXAMPLES.md    # Reference outputs
```

### Founder-OS (10 files)

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

### Identity Files (3 files)

```
contexts/{entity}/identity/
├── core.md              # North star, unfair advantage, values
├── cognitive-profile.md # Work patterns, energy, neurodivergent patterns
└── communication.md     # Communication preferences, what they hate
```

---

## Question Flow Clarification

### Two Separate Question Sets

| Set | Questions | Asked To | Purpose |
|-----|-----------|----------|---------|
| **FOS Consolidated Interview** | 12 (a1-c5) | ALL users | Deep identity interview - always asked |
| **Question E** | 31 (E01-E31) | Selectively | Personality baseline - skip answered ones |

### How gap_final Impacts the Flow

1. **gap_final analyzes Sculptor conversation against Question E (E01-E31)**
2. Produces `outstanding_questions` = E questions NOT answered during Sculptor
3. In thick client, Question E assessment **skips** questions already answered
4. The 12 FOS interview questions are **always asked** (not affected by gap_final)

### Flow Example

```
Sculptor Session → gap_final → Outstanding: E15, E16, E19 (3 questions)
                                             ↓
            Thick Client → FOS Interview (12 questions, always)
                        → Question E (only E15, E16, E19 - skips 28 already answered)
                        → Voice Testing (updates existing Voice-OS files)
```

---

## Key Edge Functions

| Function | Trigger | Input | Output |
|----------|---------|-------|--------|
| `sculptor-onboard` | Manual / API | corpus_raw + entity info | CORPUS_SUMMARY.md, GAP_ANALYSIS.md, session |
| `sculptor-gap-final` | SESSION_COMPLETE | session_id | GAP_ANALYSIS_FINAL.md, persona_fingerprint |

---

## Document Synthesis (Final Step)

After all data is collected, a **synthesis step** creates/updates all 20+ commandments.

### Data Sources for Synthesis

1. **Sculptor transcript/digest** - Stories, anecdotes, corrections, life details
2. **gap_final responses** - Outstanding Question E answers
3. **FOS Interview answers** - Core 12 identity questions
4. **Voice testing feedback** - Voice calibration data

### Synthesis Process

The 20 commandment documents should be populated by consulting ALL sources:

| Source | Populates |
|--------|-----------|
| Stories and anecdotes from Sculptor | STORIES.md, ANECDOTES.md |
| Voice corrections from Sculptor | VOICE.md, GUARDRAILS.md |
| Identity/values from FOS Interview | core.md, THEMES.md |
| Work patterns from Question E | Founder-OS protocols |
| Valuable info that doesn't fit neatly | memories.md, parking_lot.md |

### Key Insight

gap_final determines **which questions to ask**, but the **document synthesis** step pulls holistically from all collected information to ensure nothing valuable is lost.

---

## Voice Testing Updates Existing Files

Voice testing in thick client does NOT create new files. It:

1. Tests voice against 3 content types
2. Collects feedback on generated content
3. **Updates existing Voice-OS Ten Commandments** files:
   - VOICE.md, THEMES.md, GUARDRAILS.md, etc.

---

## Complete Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. CORPUS COLLECTION                                                     │
│    LinkedIn scraping + manual text → corpus_raw.md, DIGEST.md            │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. SCULPTOR SESSION                                                      │
│    NPC interview → SCULPTOR_TRANSCRIPT.md, corrections, stories          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. GAP_FINAL                                                             │
│    Analyze Sculptor vs Question E (E01-E31) → outstanding E questions    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. THICK CLIENT TUTORIAL                                                 │
│    ┌──────────────────────────────────────────────────────────────────┐ │
│    │ a) Core Assessment (12 FOS Interview questions) - ALWAYS         │ │
│    │ b) Voice Confirmation (3 content tests)                          │ │
│    │ c) Gap Questions (0-31 outstanding Question E)                   │ │
│    └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. DOCUMENT SYNTHESIS                                                    │
│    Consult ALL sources (Sculptor + FOS Interview + Question E + Voice)   │
│    Generate/update all 20 commandment documents + memories + parking lot │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. USER CONFIRMATION                                                     │
│    Review across tabs → edit → confirm → DONE                            │
│    All 20 commandments saved, ready to begin                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Cross-References

### Code Paths

| Component | Location |
|-----------|----------|
| LinkedIn ingestion | `apps/founder-os/mcp/src/tools/gft-ingestion.ts` |
| Sculptor onboard edge function | `supabase/functions/sculptor-onboard/index.ts` |
| Gap final edge function | `supabase/functions/sculptor-gap-final/index.ts` |
| Sculptor service | `apps/goodhang/lib/sculptor/SculptorService.ts` |
| Sculptor chat streaming | `apps/goodhang/app/api/sculptor/sessions/[sessionId]/messages/stream/route.ts` |
| Desktop onboarding | `apps/goodhang-desktop/src/routes/founder-os/onboarding.tsx` |
| Tutorial flow | `apps/goodhang-desktop/src/routes/founder-os/tutorial.tsx` |
| Question E assessment | `apps/goodhang-desktop/src/routes/founder-os/question-e.tsx` |
| Voice testing | `apps/goodhang-desktop/src/routes/founder-os/voice-test.tsx` |

### Related Documentation

| Document | Purpose |
|----------|---------|
| `docs/ASSESSMENT_STANDARDS.md` | Question set definitions, scoring systems |
| `docs/training/SCULPTOR_ONBOARDING.md` | Sculptor session details |
| `contexts/_shared/NPC_GROUND_RULES.md` | Character resilience rules |

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.0 | Initial documentation of full onboarding pipeline |
