# Sculptor User Onboarding Process

This document describes the process for onboarding a new user to the Sculptor interview system.

---

## Overview

Each sculptor user requires:
1. **corpus_raw.md** - Raw data dump (LinkedIn, bios, notes)
2. **CORPUS_SUMMARY.md** - Synthesized profile (generated from raw)
3. **GAP_ANALYSIS.md** - Extraction targets and priority questions
4. **CHARACTER.md** - NPC character profile and scene setup
5. **Database session** - Entry in `sculptor_sessions` table
6. **Storage upload** - Files uploaded to Supabase storage bucket

---

## Directory Structure

```
contexts/{entity-slug}/
  corpus_raw.md        # Step 1: Raw input
  CORPUS_SUMMARY.md    # Step 2: Synthesized summary
  GAP_ANALYSIS.md      # Step 3: Extraction targets
  CHARACTER.md         # Step 4: NPC and scene
```

---

## Step 1: Collect Raw Corpus

### Input Sources
- LinkedIn profile JSON export
- Personal bio or about page
- Interview notes or transcripts
- Public posts/articles

### Output: `corpus_raw.md`

Save the raw data as markdown. Include:
- Profile information (name, location, headline)
- Work history
- Education
- About/bio text
- Recent posts (with engagement data if available)
- Any other relevant source material

**Location:** `contexts/{entity-slug}/corpus_raw.md`

---

## Step 2: Generate Corpus Summary

### Method: `raw-to-summary`

Transform raw corpus data into a structured summary optimized for:
- NPC character design (understanding who they are)
- Gap analysis (identifying what we don't know)
- Conversation hooks (natural entry points)

### Summary Structure

```markdown
# CORPUS SUMMARY: {Name}

## Identity Snapshot
- Name, location, current role
- Background/origin story
- Self-description or identity markers

## Professional Focus
- Primary work and responsibilities
- Core thesis or worldview
- Adjacent roles/activities

## Thinking Patterns & Philosophy
- How they approach their domain
- Recurring themes in their content
- Beliefs and values

## Communication Style
- Voice characteristics
- Recurring phrases
- Engagement patterns

## Key Relationships
- Mentioned collaborators
- Mentor figures
- Network characteristics

## Personal Details
- Family, health, hobbies
- Origin and journey

## Extraction Opportunities
- Professional deep dives (what we want to learn)
- Personal/philosophical areas
- Practical/tactical questions

## Notable Quotes
- 3-5 representative quotes that capture their voice
```

### Invocation

```bash
# Future: implement as script
pnpm run sculptor:raw-to-summary --entity amir-feizpour

# Current: manual process with Claude
# 1. Read corpus_raw.md
# 2. Generate summary following structure above
# 3. Save to CORPUS_SUMMARY.md
```

**Output:** `contexts/{entity-slug}/CORPUS_SUMMARY.md`

---

## Step 3: Create Gap Analysis

### Purpose
Identify what we DON'T know that would be valuable to extract through conversation.

### Structure

```markdown
# GAP ANALYSIS: {Name}

## Priority Questions (Top 5)
Questions that would unlock the most value if answered.

## Identity & Origin
- Questions about their journey, transitions, formative experiences

## Professional Depth
- Questions about their expertise, methodology, decision-making

## Relationships & Network
- Questions about key people, collaborations, influences

## Personal Philosophy
- Questions about values, beliefs, what drives them

## Tactical/Practical
- Questions about routines, systems, how they actually work
```

**Output:** `contexts/{entity-slug}/GAP_ANALYSIS.md`

---

## Step 4: Design Character & Scene

### Purpose
Create an NPC that will naturally elicit the information in GAP_ANALYSIS through organic conversation.

### Key Design Decisions
1. **Who is the NPC?** - Someone with a plausible reason to be curious
2. **What's the setting?** - Natural context for extended conversation
3. **What's the NPC's motivation?** - Why are they asking questions?
4. **What's the dynamic?** - Peer, mentee, stranger, colleague?

### Structure

```markdown
# CHARACTER: {NPC Name}

## Role Assignment
Clear instruction that the AI IS the NPC, talking TO the subject.

## Character Resilience
Reference to NPC_GROUND_RULES.md for inoculation.

## Character Profile
- Name, age, background
- Core traits and personality
- Situation and motivation

## Setting
- Location, time, atmosphere
- Physical environment details

## Scene Opening
Narrative setup that places both characters in the scene.

## Conversation Hooks
Natural questions and topics the NPC would raise.

## Easter Eggs
Optional reveals that deepen the NPC's character.

## Motivations
Surface goals vs. real goals table.

## Interaction Guidelines
What the NPC will/won't do.
```

**Output:** `contexts/{entity-slug}/CHARACTER.md`

---

## Step 5: Create Database Session

### SQL Template

```sql
INSERT INTO sculptor_sessions (
  access_code,
  entity_name,
  entity_slug,
  template_id,
  status
) VALUES (
  'sc_{entity-slug}',
  '{Full Name}',
  '{entity-slug}',
  (SELECT id FROM sculptor_templates WHERE slug = 'premier'),
  'active'
);
```

### Using Supabase MCP

```
mcp__supabase-humanos-staging__execute_sql
```

---

## Step 6: Upload to Storage

### Files to Upload
1. `_shared/NPC_GROUND_RULES.md` (if not already present)
2. `{entity-slug}/CHARACTER.md`
3. `{entity-slug}/CORPUS_SUMMARY.md`
4. `{entity-slug}/GAP_ANALYSIS.md`

### Storage Path
```
storage://contexts/{entity-slug}/{filename}
```

### Script (existing)
```bash
pnpm run upload-contexts
# or
npx ts-node scripts/upload-fixed-characters.ts
```

---

## Validation Checklist

- [ ] `corpus_raw.md` saved with source data
- [ ] `CORPUS_SUMMARY.md` synthesized and reviewed
- [ ] `GAP_ANALYSIS.md` created with priority questions
- [ ] `CHARACTER.md` designed with scene and NPC
- [ ] Database session created with correct `entity_slug`
- [ ] Files uploaded to Supabase storage
- [ ] Access code tested: `sc_{entity-slug}`

---

## Example: Amir Feizpour

```
contexts/amir-feizpour/
  corpus_raw.md        # LinkedIn JSON + posts
  CORPUS_SUMMARY.md    # Synthesized profile
  GAP_ANALYSIS.md      # TBD
  CHARACTER.md         # TBD - needs scene design
```

**Access Code:** `sc_amir-feizpour`
**Entity Slug:** `amir-feizpour`

---

## Related Files

- `contexts/_shared/NPC_GROUND_RULES.md` - Inoculation rules for all NPCs
- `scripts/upload-fixed-characters.ts` - Upload script
- `scripts/check-storage.ts` - Verify storage contents
- `supabase/migrations/078_sculptor_storage_context.sql` - Storage bucket setup
