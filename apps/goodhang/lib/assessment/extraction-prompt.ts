/**
 * Extraction Prompt System
 *
 * Two-phase extraction:
 * 1. Phase 1: Extract shared assets (stories, anecdotes, events, people) into registries
 * 2. Phase 2: Generate commandments that REFERENCE registry items (no duplication)
 */

import type { CommandmentDef, QuestionDef } from './types';

// =============================================================================
// PHASE 1: REGISTRY EXTRACTION
// =============================================================================

export const REGISTRY_EXTRACTION_SYSTEM = `You are extracting structured personality data from a Sculptor conversation.

Your task is to identify and catalog:
1. STORIES - Extended narratives (3+ sentences) with emotional arcs
2. ANECDOTES - Brief examples, proof points, one-liners
3. EVENTS - Key life moments with dates/timeframes
4. PEOPLE - Important relationships and contexts
5. CORRECTIONS - Things the person explicitly corrected or clarified (HIGH VALUE)
6. PARKING LOT - Topics mentioned but not explored

## CRITICAL: Field Population Rules
- EVERY field must have actual content - NO empty strings, NO "N/A", NO placeholders
- If you cannot find content for a field, DO NOT include that item
- Quality over quantity: 3 complete items beats 8 incomplete ones

## How to Find CORRECTIONS (Most Valuable Data)
Corrections occur when the person clarifies a misconception. Look for:
- "Actually..." / "Not quite..." / "Nah, it's more like..."
- "I'm not X, I'm Y" patterns
- Questions where they push back: "Is X true?" -> "No, that's wrong"
- Explicit correction tables in the transcript
- "Clarification" sections

Example corrections in transcripts:
- Q: "Sobriety is an identity marker?" A: "nah im not sober. still smoke weed. still love tequila"
  → Original: "sobriety as identity marker", Corrected: "not sober - uses weed and tequila", Affects: THEMES.md
- Q: "Pipeline 12:1?" A: "10-1 for me"
  → Original: "12:1 pipeline ratio", Corrected: "10:1 pipeline ratio", Affects: VOICE.md

## How to Find STORIES
Stories are extended narratives with:
- A beginning, middle, emotional arc
- Personal investment in telling it
- Specific details (places, times, feelings)
- A lesson or transformation

Example story extraction:
{
  "id": "S01",
  "title": "The Four-Year Medical Crisis",
  "summary": "At 23, severe ulcerative colitis led to 4 years in hospitals, 9 surgeries, opioid dependency, and brutal withdrawal. This fundamentally rewired how Scott thinks about fear and risk.",
  "core_quote": "There is nothing heroic about this. Nothing inspiring. It was ugly.",
  "emotional_tone": "matter-of-fact, unflinching, teaching",
  "tags": ["health", "survival", "perspective"],
  "used_in": ["THEMES.md", "CRISIS_PROTOCOLS.md", "RECOVERY_PROTOCOLS.md"],
  "confidence": "high"
}

## How to Find ANECDOTES
Anecdotes are brief proof points - usually 1-2 sentences:
- "Like the time I..."
- References to specific moments without full story
- One-liners that illustrate a point

Example anecdote extraction:
{
  "id": "A01",
  "summary": "First sale came at 9pm on a Friday, cold-calling Hawaii from desperation",
  "quote": "I was convinced I would be fired if I didnt close a deal",
  "illustrates": "Desperation as motivation, doing what others won't",
  "tags": ["sales", "hustle", "early_career"],
  "used_in": ["VOICE.md", "WORK_STYLE.md"],
  "confidence": "high"
}

## How to Find PEOPLE
Look for names, relationships, and rules about referencing them:
- Mentors, partners, family members
- "Don't mention X" or "Only reference Y generally"
- Relationships with context about how they influenced the person

Example people extraction:
{
  "id": "P01",
  "name": "Mike Lindstrom",
  "relationship": "Only mentor",
  "context": "The 'double your rate' guy - gave pivotal career advice",
  "can_reference": true,
  "reference_rules": "Can reference the advice, full credit",
  "tags": ["mentor", "career"]
}

## Output Format
Return valid JSON. ONLY include items where ALL required fields are populated:

{
  "stories": [...],
  "anecdotes": [...],
  "events": [...],
  "people": [...],
  "corrections": [
    {
      "id": "C01",
      "original": "REQUIRED: What was assumed or stated incorrectly",
      "corrected_to": "REQUIRED: The actual truth they clarified",
      "quote": "REQUIRED: Their exact words when correcting",
      "affects": ["REQUIRED: Which files this impacts"]
    }
  ],
  "parking_lot": [...]
}`;

export function getRegistryExtractionPrompt(
  sources: {
    sculptorTranscript: string;
    corpusSummary: string;
    digest?: string | null;
  },
  entityName: string
): string {
  return `Extract structured personality data for ${entityName} from this Sculptor conversation.

## SOURCE MATERIAL

=== SCULPTOR TRANSCRIPT ===
${sources.sculptorTranscript}

=== CORPUS SUMMARY ===
${sources.corpusSummary}

${sources.digest ? `=== DIGEST ===\n${sources.digest}` : ''}

---

## EXTRACTION PRIORITIES (in order)

### 1. CORRECTIONS (Highest Value)
Scan the ENTIRE transcript for corrections. Common patterns:
- Tables with "Topic | Clarification" headers
- "What Changed" sections
- Q&A where person pushes back: "Actually...", "Nah...", "Not quite..."
- "I'm not X" statements

For EACH correction, you MUST provide:
- id: C01, C02, etc.
- original: What was assumed (e.g., "sobriety as identity marker")
- corrected_to: The truth (e.g., "not sober - uses weed and tequila")
- quote: Their exact words (e.g., "nah im not sober. still smoke weed. still love tequila")
- affects: Which files (e.g., ["THEMES.md", "GUARDRAILS.md"])

### 2. STORIES (Extended Narratives)
Look for paragraphs where they share personal experiences with:
- Emotional investment in the telling
- Specific details (dates, places, feelings)
- A transformation or lesson

### 3. PEOPLE (Relationships)
Everyone mentioned by name or relationship:
- Family members (wife, ex-wife, kids)
- Mentors and colleagues
- Rules about referencing them

### 4. ANECDOTES (Brief Examples)
Short references or one-liners that illustrate points.

### 5. EVENTS (Key Moments)
Specific life events with timeframes.

### 6. PARKING LOT (Unexplored Topics)
Things mentioned but not fully explored.

---

## VALIDATION RULES
- Every item MUST have all required fields populated with real content
- NO empty strings, NO "N/A", NO placeholders
- If a field can't be filled, don't include that item
- Minimum quality threshold: If a story has no quote, it's an anecdote

Return valid JSON matching the schema.`;
}

// =============================================================================
// EXTRACTION VALIDATION
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    stories: number;
    anecdotes: number;
    events: number;
    people: number;
    corrections: number;
    parking_lot: number;
  };
}

export function validateExtraction(data: ExtractedRegistryData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate corrections (highest value)
  for (const c of data.corrections || []) {
    const cId = c.id || 'unknown';
    if (!c.original || c.original === 'N/A' || c.original.trim() === '') {
      errors.push(`Correction ${cId}: missing 'original' field`);
    }
    if (!c.corrected_to || c.corrected_to === 'N/A' || c.corrected_to.trim() === '') {
      errors.push(`Correction ${cId}: missing 'corrected_to' field`);
    }
    if (!c.affects || c.affects.length === 0) {
      warnings.push(`Correction ${cId}: missing 'affects' field`);
    }
  }

  // Validate stories
  for (const s of data.stories || []) {
    if (!s.title || s.title === 'N/A') {
      errors.push(`Story ${s.id}: missing title`);
    }
    if (!s.summary || s.summary.length < 20) {
      warnings.push(`Story ${s.id}: summary too short`);
    }
  }

  // Validate people
  for (const p of data.people || []) {
    if (!p.name || p.name === 'N/A') {
      errors.push(`Person ${p.id}: missing name`);
    }
    if (!p.relationship || p.relationship === 'N/A') {
      warnings.push(`Person ${p.id}: missing relationship`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      stories: (data.stories || []).length,
      anecdotes: (data.anecdotes || []).length,
      events: (data.events || []).length,
      people: (data.people || []).length,
      corrections: (data.corrections || []).length,
      parking_lot: (data.parking_lot || []).length,
    },
  };
}

// =============================================================================
// PHASE 2: COMMANDMENT GENERATION (WITH REFERENCES)
// =============================================================================

export const COMMANDMENT_SYSTEM_PROMPT = `You are generating a commandment file from pre-extracted personality data.

## Critical Rules
1. REFERENCE registry items by ID - do NOT duplicate full stories/anecdotes
2. Use [S01], [A03], [P02] format for references
3. Mark confidence levels on every substantive claim
4. Create explicit spaces for user additions

## Confidence Markers
- [SOLID] — Direct evidence from source material
- [INFERRED] — Reasonable inference, needs validation
- [PLACEHOLDER] — Minimal evidence, user should expand
- [GAP: description] — No evidence found, needs question

## Reference Format
When citing stories/anecdotes/events/people, use:
- **Evidence:** [S03: Hospital Realization] - "Nothing will ever be that hard again"
- **Related:** [A07], [P02: Richard Harris]

## Structure Requirements
1. YAML frontmatter with metadata
2. Rich content with references (not duplicated text)
3. "User Additions" sections (empty, clearly marked for input)
4. "Gaps" section listing what questions would help

Output ONLY the markdown content. No preamble.`;

export function getCommandmentGenerationPrompt(
  commandmentDef: CommandmentDef,
  extractedData: ExtractedRegistryData,
  entitySlug: string,
  entityName: string
): string {
  return `Generate the ${commandmentDef.name} commandment file for ${entityName}.

## FILE SPECIFICATIONS
- Name: ${commandmentDef.name}
- Purpose: ${commandmentDef.description}
- Category: ${commandmentDef.category === 'voice' ? 'Voice OS (content generation)' : 'Founder OS (executive assistant)'}

## BOUNDARY RULES
MUST include: ${commandmentDef.mustInclude.join(', ')}
MAY include: ${commandmentDef.mayInclude.join(', ')}
MUST NOT include: ${commandmentDef.mustNotInclude.join(', ')}
Can be populated by questions: ${commandmentDef.populatedBy.join(', ')}

## EXTRACTED REGISTRY DATA
${JSON.stringify(extractedData, null, 2)}

---

Generate ${commandmentDef.name} following this template:

\`\`\`markdown
---
title: ${commandmentDef.name.replace('.md', '')}
type: commandment
entity: ${entitySlug}
category: ${commandmentDef.category}
version: 1.0
generated: ${new Date().toISOString()}
completeness: [0-100 estimate]
---

# ${commandmentDef.name.replace('.md', '')}

## Overview
[2-3 sentence summary of what this file captures]

## [Main Content Sections - specific to this commandment type]

### [Section Name] [SOLID|INFERRED|PLACEHOLDER]

[Content with references like [S01], [A03], [P02]]

**Evidence:** [S03: Title] - "relevant quote"

---

## User Additions
<!-- Add your own observations, corrections, or elaborations below -->

### Additional Context
[Empty - user fills in]

### Corrections or Clarifications
[Empty - user fills in]

---

## Gaps Requiring Input
- [GAP-ID]: [Description] → Can be answered by: [Question IDs]
\`\`\`

Generate the complete file now.`;
}

// =============================================================================
// TYPES
// =============================================================================

export interface ExtractedRegistryData {
  stories: ExtractedStory[];
  anecdotes: ExtractedAnecdote[];
  events: ExtractedEvent[];
  people: ExtractedPerson[];
  corrections: ExtractedCorrection[];
  parking_lot: ParkingLotItem[];
}

export interface ExtractedStory {
  id: string;
  title: string;
  summary: string;
  core_quote: string;
  emotional_tone: string;
  tags: string[];
  used_in: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedAnecdote {
  id: string;
  summary: string;
  quote?: string;
  illustrates: string;
  tags: string[];
  used_in: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedEvent {
  id: string;
  date_range: string;
  summary: string;
  impact: string;
  tags: string[];
  used_in: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedPerson {
  id: string;
  name: string;
  relationship: string;
  context: string;
  can_reference: boolean;
  reference_rules?: string;
  tags: string[];
}

export interface ExtractedCorrection {
  id: string;
  original: string;
  corrected_to: string;
  quote?: string;
  affects: string[];
}

export interface ParkingLotItem {
  id: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  context: string;
  follow_up_questions?: string[];
}

// =============================================================================
// GAP ANALYSIS WITH QUESTION MAPPING
// =============================================================================

export const GAP_ANALYSIS_SYSTEM = `You are analyzing generated commandment files to determine minimal questions needed.

## Philosophy
- Questions are boring. Minimize them ruthlessly.
- The Sculptor session should have captured 80%+ of what's needed.
- Only ask questions that will MATERIALLY improve the commandments.

## Question Sources Available
- Question E (E01-E24): Personality baseline - work style, energy, communication
- FOS Interview (a1-c5): Identity questions - stories, beliefs, work patterns
- Voice Test (3 samples): Voice calibration - tone, humor, brevity

## Output Format
Return JSON with:
{
  "summary": {
    "total_commandments": 18,
    "average_completeness": 75,
    "files_needing_attention": ["CRISIS_PROTOCOLS.md", "ENERGY_PATTERNS.md"]
  },
  "gaps_by_file": {
    "CRISIS_PROTOCOLS.md": [
      {
        "gap_id": "CR-G01",
        "description": "Missing overwhelm spiral pattern",
        "can_be_filled_by": ["E08"],
        "priority": "high"
      }
    ]
  },
  "questions_to_ask": [
    {
      "id": "E08",
      "source": "question-e",
      "text": "What does your overwhelm spiral look like?",
      "fills_gaps": ["CR-G01", "AV-G02"],
      "priority": "high"
    }
  ],
  "questions_to_skip": {
    "E01": "Covered in sculptor - they described decision paralysis",
    "a1": "Full story captured about hospital experience"
  }
}`;

export function getGapAnalysisPrompt(
  commandmentSummaries: Array<{
    name: string;
    category: string;
    completeness: number;
    gaps: string[];
  }>,
  questionSets: Array<{
    id: string;
    name: string;
    questions: QuestionDef[];
  }>,
  entityName: string
): string {
  return `Analyze these commandment files for ${entityName} and determine the MINIMAL questions needed.

## COMMANDMENT FILES GENERATED
${JSON.stringify(commandmentSummaries, null, 2)}

## AVAILABLE QUESTION SETS
${JSON.stringify(questionSets, null, 2)}

---

For each gap in the commandment files:
1. Identify which question(s) could fill it
2. Check if the sculptor conversation already answered it (skip if so)
3. Prioritize based on impact to the commandment's purpose

Return your analysis as JSON.

Remember:
- Be ruthless about minimizing questions
- If a file is 70%+ complete, it's probably usable
- Voice gaps can often be filled by more corpus analysis
- Founder OS gaps are more critical for effective support`;
}
