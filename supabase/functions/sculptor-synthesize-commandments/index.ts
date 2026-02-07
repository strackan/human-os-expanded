/**
 * Sculptor Synthesize Commandments Edge Function (v2)
 *
 * Post-Sculptor processing that generates the complete Human OS:
 * 1. Loads definitions from Renubu API (commandments, question sets, registries)
 * 2. Phase 1: Extracts registry items (stories, anecdotes, events, people)
 * 3. Phase 2: Generates commandments that REFERENCE registry items
 * 4. Analyzes gaps and maps to question sets
 * 5. Produces GAP_ANALYSIS_FINAL.md with minimal targeted questions
 *
 * Philosophy: The Sculptor session (1hr conversation) should provide 80%+ of what's needed.
 * Questions are boring - minimize them. Only ask what's truly missing.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const RENUBU_API_URL = Deno.env.get("RENUBU_API_URL") || "https://renubu.vercel.app";
const STORAGE_BUCKET = "human-os";

// =============================================================================
// TYPES
// =============================================================================

interface SynthesizeRequest {
  session_id: string;
}

interface CommandmentDef {
  name: string;
  description: string;
  category: "voice" | "founder-os";
  mustInclude: string[];
  mayInclude: string[];
  mustNotInclude: string[];
  populatedBy: string[];
}

interface QuestionDef {
  id: string;
  section: string;
  text: string;
  populatesFiles: string[];
}

interface QuestionSet {
  id: string;
  name: string;
  questions: QuestionDef[];
}

interface HumanOsDefinitions {
  commandments: {
    voice: CommandmentDef[];
    founder: CommandmentDef[];
  };
  registries: Array<{ name: string; idPrefix: string; fields: string[]; usedIn: string[] }>;
  questionSets: QuestionSet[];
}

interface ExtractedRegistry {
  stories: Array<{ id: string; title: string; summary: string; core_quote: string; emotional_tone: string; tags: string[]; used_in: string[]; confidence: string }>;
  anecdotes: Array<{ id: string; summary: string; quote?: string; illustrates: string; tags: string[]; used_in: string[]; confidence: string }>;
  events: Array<{ id: string; date_range: string; summary: string; impact: string; tags: string[]; used_in: string[]; confidence: string }>;
  people: Array<{ id: string; name: string; relationship: string; context: string; can_reference: boolean; reference_rules?: string; tags: string[] }>;
  corrections: Array<{ id?: string; original: string; corrected_to: string; quote?: string; affects: string[] }>;
  parking_lot: Array<{ id: string; topic: string; priority: string; context: string; follow_up_questions?: string[] }>;
}

interface CommandmentFile {
  name: string;
  path: string;
  category: "voice" | "founder-os" | "registry";
  content: string;
  completeness: number;
  gaps: string[];
}

interface GapQuestion {
  id: string;
  source: string;
  text: string;
  fills_gaps: string[];
  priority: "high" | "medium" | "low";
}

interface SourceDocuments {
  sculptorTranscript: string;
  corpusSummary: string;
  digest: string | null;
}

// =============================================================================
// LOAD DEFINITIONS FROM RENUBU
// =============================================================================

async function loadDefinitionsFromRenubu(): Promise<HumanOsDefinitions> {
  try {
    const response = await fetch(`${RENUBU_API_URL}/api/human-os/definitions`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn("[synthesize] Could not load from Renubu, using fallback:", e);
  }

  // Fallback definitions if Renubu is unavailable
  return getFallbackDefinitions();
}

function getFallbackDefinitions(): HumanOsDefinitions {
  // Minimal fallback - should match renubu definitions
  return {
    commandments: {
      voice: [
        { name: "VOICE.md", description: "Always/never rules, signature phrases, rhythm patterns", category: "voice", mustInclude: ["tone_baseline", "signature_phrases"], mayInclude: [], mustNotInclude: [], populatedBy: ["voice_test_1", "voice_test_2", "voice_test_3"] },
        { name: "THEMES.md", description: "Core beliefs, recurring habits, internal tensions, values", category: "voice", mustInclude: ["core_beliefs", "values_hierarchy"], mayInclude: [], mustNotInclude: [], populatedBy: ["a1", "b1", "b2"] },
        { name: "GUARDRAILS.md", description: "Topics to avoid, tones to avoid, sacred cows, hard NOs", category: "voice", mustInclude: ["never_mention", "sacred_topics"], mayInclude: [], mustNotInclude: [], populatedBy: ["sculptor_corrections"] },
        { name: "OPENINGS.md", description: "Opening hook patterns, first-line strategies", category: "voice", mustInclude: ["hook_types"], mayInclude: [], mustNotInclude: [], populatedBy: ["corpus_analysis"] },
        { name: "MIDDLES.md", description: "Argument structures, evidence patterns, transitions", category: "voice", mustInclude: ["argument_patterns"], mayInclude: [], mustNotInclude: [], populatedBy: ["corpus_analysis"] },
        { name: "ENDINGS.md", description: "Closing patterns, CTA styles, mic-drop lines", category: "voice", mustInclude: ["closing_patterns"], mayInclude: [], mustNotInclude: [], populatedBy: ["corpus_analysis"] },
        { name: "BLENDS.md", description: "Content type recipes, format preferences", category: "voice", mustInclude: ["content_type_preferences"], mayInclude: [], mustNotInclude: [], populatedBy: ["corpus_analysis"] },
        { name: "EXAMPLES.md", description: "Reference outputs across formats", category: "voice", mustInclude: ["thought_leadership_sample"], mayInclude: [], mustNotInclude: [], populatedBy: ["voice_test_1", "voice_test_2", "voice_test_3"] },
      ],
      founder: [
        { name: "CONVERSATION_PROTOCOLS.md", description: "How to interact - tone, length, when to ask vs decide", category: "founder-os", mustInclude: ["tone_baseline", "decision_matrix"], mayInclude: [], mustNotInclude: [], populatedBy: ["E11", "E12", "E13", "E14", "c3", "c4"] },
        { name: "CRISIS_PROTOCOLS.md", description: "Emergency response, what to do when things go wrong", category: "founder-os", mustInclude: ["crisis_indicators", "escalation_triggers"], mayInclude: [], mustNotInclude: [], populatedBy: ["E15", "E16", "E17", "E18", "E19", "a3", "a4"] },
        { name: "CURRENT_STATE.md", description: "Live context, current priorities, active projects", category: "founder-os", mustInclude: ["active_projects"], mayInclude: [], mustNotInclude: [], populatedBy: ["context_building"] },
        { name: "STRATEGIC_THOUGHT_PARTNER.md", description: "Decision frameworks, how to help think through problems", category: "founder-os", mustInclude: ["decision_frameworks"], mayInclude: [], mustNotInclude: [], populatedBy: ["a1", "a4", "E01", "E02", "E03"] },
        { name: "DECISION_MAKING.md", description: "Decision patterns, what drains vs energizes decisions", category: "founder-os", mustInclude: ["decision_style"], mayInclude: [], mustNotInclude: [], populatedBy: ["E01", "E02", "E03", "E04"] },
        { name: "ENERGY_PATTERNS.md", description: "What energizes/drains, optimal conditions, physical realities", category: "founder-os", mustInclude: ["peak_times", "energy_drains"], mayInclude: [], mustNotInclude: [], populatedBy: ["E05", "E06", "E09", "E10", "c1"] },
        { name: "WORK_STYLE.md", description: "Support preferences, how they like to be helped", category: "founder-os", mustInclude: ["support_methods"], mayInclude: [], mustNotInclude: [], populatedBy: ["E20", "E21", "E22", "E23", "E24", "c5"] },
        { name: "AVOIDANCE_PATTERNS.md", description: "Stuck indicators, avoidance behaviors, intervention methods", category: "founder-os", mustInclude: ["stuck_indicators"], mayInclude: [], mustNotInclude: [], populatedBy: ["E07", "E08", "E15"] },
        { name: "RECOVERY_PROTOCOLS.md", description: "Reset methods, timeline, what helps restore", category: "founder-os", mustInclude: ["reset_methods"], mayInclude: [], mustNotInclude: [], populatedBy: ["E16", "E17", "E18", "E19", "c2"] },
        { name: "SUPPORT_CALIBRATION.md", description: "Meta-calibration, how support needs change by state", category: "founder-os", mustInclude: ["state_signals"], mayInclude: [], mustNotInclude: [], populatedBy: ["c3", "c4", "c5", "b3"] },
      ],
    },
    registries: [
      { name: "STORIES.registry.md", idPrefix: "S", fields: ["summary", "core_quote", "emotional_tone", "tags", "used_in"], usedIn: ["THEMES.md", "CRISIS_PROTOCOLS.md"] },
      { name: "ANECDOTES.registry.md", idPrefix: "A", fields: ["summary", "quote", "illustrates", "tags", "used_in"], usedIn: ["VOICE.md", "EXAMPLES.md"] },
      { name: "EVENTS.registry.md", idPrefix: "EV", fields: ["date_range", "summary", "impact", "tags", "used_in"], usedIn: ["THEMES.md"] },
      { name: "PEOPLE.registry.md", idPrefix: "P", fields: ["relationship", "context", "can_reference", "tags"], usedIn: ["GUARDRAILS.md"] },
      { name: "PARKING_LOT.md", idPrefix: "PL", fields: ["topic", "priority", "context", "follow_up_by"], usedIn: [] },
    ],
    questionSets: [],
  };
}

// =============================================================================
// CLAUDE API
// =============================================================================

async function callClaude(systemPrompt: string, userPrompt: string, maxTokens = 8192): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// =============================================================================
// PHASE 1: REGISTRY EXTRACTION
// =============================================================================

const REGISTRY_EXTRACTION_SYSTEM = `You are extracting structured personality data from a Sculptor conversation.

Your task is to identify and catalog:
1. STORIES - Extended narratives (3+ sentences) with emotional arcs
2. ANECDOTES - Brief examples, proof points, one-liners
3. EVENTS - Key life moments with dates/timeframes
4. PEOPLE - Important relationships and contexts
5. CORRECTIONS - Things the person explicitly corrected or clarified (HIGHEST VALUE)
6. PARKING LOT - Topics mentioned but not explored

## CRITICAL: Field Population Rules
- EVERY field must have actual content - NO empty strings, NO "N/A", NO placeholders
- If you cannot find content for a field, DO NOT include that item
- Quality over quantity: 3 complete items beats 8 incomplete ones

## How to Find CORRECTIONS (Most Valuable Data)
Corrections occur when the person clarifies a misconception. Look for:
- Tables with "Topic | Clarification" headers in the transcript
- "What Changed" or "Corrections" sections
- Q&A where person pushes back: "Actually...", "Nah...", "Not quite..."
- "I'm not X, I'm Y" patterns
- Anything that updates or contradicts prior assumptions

Example corrections patterns:
- Q: "Sobriety is an identity marker?" A: "nah im not sober. still smoke weed. still love tequila"
  → id: "C01", original: "sobriety as identity marker", corrected_to: "not sober - uses weed and tequila", quote: "nah im not sober. still smoke weed. still love tequila", affects: ["THEMES.md", "GUARDRAILS.md"]
- Q: "Pipeline 12:1?" A: "10-1 for me"
  → id: "C02", original: "12:1 pipeline ratio", corrected_to: "10:1 pipeline ratio", quote: "pipeline to quota ratio for me is 10-1", affects: ["VOICE.md"]

## How to Find STORIES
Stories are extended narratives with:
- A beginning, middle, emotional arc (usually 3+ paragraphs)
- Personal investment in telling it
- Specific details (places, times, feelings)
- A lesson or transformation

## How to Find PEOPLE
Everyone mentioned by name or relationship:
- Family members (wife, ex-wife, kids)
- Mentors and colleagues
- Rules about referencing them (e.g., "don't mention ex-wife")

## Output Format
Return valid JSON (no markdown code blocks). Only include items where ALL required fields are populated.`;

async function extractRegistries(sources: SourceDocuments, entityName: string): Promise<ExtractedRegistry> {
  const prompt = `Extract structured personality data for ${entityName} from this Sculptor conversation.

## SOURCE MATERIAL

=== SCULPTOR TRANSCRIPT ===
${sources.sculptorTranscript}

=== CORPUS SUMMARY ===
${sources.corpusSummary}

${sources.digest ? `=== DIGEST ===\n${sources.digest}` : ""}

---

## EXTRACTION PRIORITIES (in order)

### 1. CORRECTIONS (Highest Value)
Scan the ENTIRE transcript for corrections. Look for:
- Tables with "Topic | Clarification" headers
- "What Changed" sections
- Q&A where person pushes back: "Actually...", "Nah...", "Not quite..."
- "I'm not X" statements

For EACH correction found, you MUST provide:
- id: "C01", "C02", etc.
- original: What was assumed (e.g., "sobriety as identity marker")
- corrected_to: The truth (e.g., "not sober - uses weed and tequila")
- quote: Their exact words (e.g., "nah im not sober. still smoke weed")
- affects: Which files ["THEMES.md", "GUARDRAILS.md"]

### 2. STORIES - Extended narratives with emotional investment
### 3. PEOPLE - Everyone mentioned by name or relationship
### 4. ANECDOTES - Brief proof points
### 5. EVENTS - Key moments with timeframes
### 6. PARKING_LOT - Unexplored topics

Return valid JSON with these arrays: stories[], anecdotes[], events[], people[], corrections[], parking_lot[]

IMPORTANT: Every field must have real content. No "N/A", no empty strings.`;

  const response = await callClaude(REGISTRY_EXTRACTION_SYSTEM, prompt);

  try {
    let cleaned = response.trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    const parsed = JSON.parse(cleaned);

    // Validate and filter out items with empty/N/A fields
    const isValidCorrection = (c: ExtractedRegistry["corrections"][0]) =>
      c.original && c.original !== "N/A" && c.original.trim() !== "" &&
      c.corrected_to && c.corrected_to !== "N/A" && c.corrected_to.trim() !== "";

    const isValidStory = (s: ExtractedRegistry["stories"][0]) =>
      s.title && s.title !== "N/A" && s.summary && s.summary.length > 20;

    const isValidPerson = (p: ExtractedRegistry["people"][0]) =>
      p.name && p.name !== "N/A" && p.relationship && p.relationship !== "N/A";

    return {
      stories: (parsed.stories || []).filter(isValidStory),
      anecdotes: parsed.anecdotes || [],
      events: parsed.events || [],
      people: (parsed.people || []).filter(isValidPerson),
      corrections: (parsed.corrections || []).filter(isValidCorrection),
      parking_lot: parsed.parking_lot || [],
    };
  } catch (e) {
    console.error("[synthesize] Failed to parse registry extraction:", e);
    return { stories: [], anecdotes: [], events: [], people: [], corrections: [], parking_lot: [] };
  }
}

function generateRegistryMarkdown(registry: ExtractedRegistry, entitySlug: string): CommandmentFile[] {
  const files: CommandmentFile[] = [];
  const now = new Date().toISOString();

  // STORIES.registry.md
  if (registry.stories.length > 0) {
    let content = `---
title: Stories Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Stories Registry

Canonical stories with IDs for reference across commandment files.

`;
    for (const story of registry.stories) {
      content += `## ${story.id}: ${story.title}
- **Summary:** ${story.summary}
- **Core Quote:** "${story.core_quote}"
- **Emotional Tone:** ${story.emotional_tone}
- **Tags:** ${story.tags.join(", ")}
- **Used In:** ${story.used_in.join(", ")}
- **Confidence:** ${story.confidence}

`;
    }
    files.push({ name: "STORIES.registry.md", path: `contexts/${entitySlug}/registry/STORIES.registry.md`, category: "registry", content, completeness: 90, gaps: [] });
  }

  // ANECDOTES.registry.md
  if (registry.anecdotes.length > 0) {
    let content = `---
title: Anecdotes Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Anecdotes Registry

Brief examples and proof points for reference.

`;
    for (const anecdote of registry.anecdotes) {
      content += `## ${anecdote.id}
- **Summary:** ${anecdote.summary}
${anecdote.quote ? `- **Quote:** "${anecdote.quote}"` : ""}
- **Illustrates:** ${anecdote.illustrates}
- **Tags:** ${anecdote.tags.join(", ")}
- **Confidence:** ${anecdote.confidence}

`;
    }
    files.push({ name: "ANECDOTES.registry.md", path: `contexts/${entitySlug}/registry/ANECDOTES.registry.md`, category: "registry", content, completeness: 90, gaps: [] });
  }

  // EVENTS.registry.md
  if (registry.events.length > 0) {
    let content = `---
title: Events Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Events Registry

Key life events with dates/timeframes.

`;
    for (const event of registry.events) {
      content += `## ${event.id}
- **Date Range:** ${event.date_range}
- **Summary:** ${event.summary}
- **Impact:** ${event.impact}
- **Tags:** ${event.tags.join(", ")}
- **Confidence:** ${event.confidence}

`;
    }
    files.push({ name: "EVENTS.registry.md", path: `contexts/${entitySlug}/registry/EVENTS.registry.md`, category: "registry", content, completeness: 90, gaps: [] });
  }

  // PEOPLE.registry.md
  if (registry.people.length > 0) {
    let content = `---
title: People Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# People Registry

Important relationships and reference rules.

`;
    for (const person of registry.people) {
      content += `## ${person.id}: ${person.name}
- **Relationship:** ${person.relationship}
- **Context:** ${person.context}
- **Can Reference:** ${person.can_reference ? "Yes" : "No"}
${person.reference_rules ? `- **Reference Rules:** ${person.reference_rules}` : ""}
- **Tags:** ${person.tags.join(", ")}

`;
    }
    files.push({ name: "PEOPLE.registry.md", path: `contexts/${entitySlug}/registry/PEOPLE.registry.md`, category: "registry", content, completeness: 90, gaps: [] });
  }

  // CORRECTIONS.registry.md
  if (registry.corrections.length > 0) {
    let content = `---
title: Corrections Registry
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Corrections Registry

Explicit corrections from the person - HIGH CONFIDENCE data.

`;
    registry.corrections.forEach((correction, idx) => {
      const correctionId = correction.id || `C${String(idx + 1).padStart(2, "0")}`;
      content += `## ${correctionId}
- **Original:** ${correction.original}
- **Corrected To:** ${correction.corrected_to}
${correction.quote ? `- **Quote:** "${correction.quote}"` : ""}
- **Affects:** ${(correction.affects || []).join(", ")}

`;
    });
    files.push({ name: "CORRECTIONS.registry.md", path: `contexts/${entitySlug}/registry/CORRECTIONS.registry.md`, category: "registry", content, completeness: 95, gaps: [] });
  }

  // PARKING_LOT.md
  if (registry.parking_lot.length > 0) {
    let content = `---
title: Parking Lot
type: registry
entity: ${entitySlug}
generated: "${now}"
---

# Parking Lot

Topics mentioned but not fully explored. Follow up later.

`;
    for (const item of registry.parking_lot) {
      content += `## ${item.id}: ${item.topic}
- **Priority:** ${item.priority}
- **Context:** ${item.context}
${item.follow_up_questions ? `- **Follow-up Questions:**\n${item.follow_up_questions.map(q => `  - ${q}`).join("\n")}` : ""}

`;
    }
    files.push({ name: "PARKING_LOT.md", path: `contexts/${entitySlug}/registry/PARKING_LOT.md`, category: "registry", content, completeness: 80, gaps: [] });
  }

  return files;
}

// =============================================================================
// PHASE 2: COMMANDMENT GENERATION (WITH REFERENCES)
// =============================================================================

const COMMANDMENT_SYSTEM_PROMPT = `You are generating a commandment file from pre-extracted personality data.

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

Output ONLY the markdown content. No preamble.`;

async function generateCommandment(
  commandmentDef: CommandmentDef,
  extractedData: ExtractedRegistry,
  sources: SourceDocuments,
  entitySlug: string,
  entityName: string
): Promise<CommandmentFile> {
  const prompt = `Generate the ${commandmentDef.name} commandment file for ${entityName}.

## FILE SPECIFICATIONS
- Name: ${commandmentDef.name}
- Purpose: ${commandmentDef.description}
- Category: ${commandmentDef.category === "voice" ? "Voice OS (content generation)" : "Founder OS (executive assistant)"}

## BOUNDARY RULES
MUST include: ${commandmentDef.mustInclude.join(", ")}
MAY include: ${commandmentDef.mayInclude.join(", ")}
MUST NOT include: ${commandmentDef.mustNotInclude.join(", ")}
Can be populated by questions: ${commandmentDef.populatedBy.join(", ")}

## EXTRACTED REGISTRY DATA
${JSON.stringify(extractedData, null, 2)}

## RAW SOURCE (for additional context)
=== SCULPTOR TRANSCRIPT (excerpt) ===
${sources.sculptorTranscript.substring(0, 8000)}

---

Generate ${commandmentDef.name} with YAML frontmatter, rich content using registry references [S01], [A03], etc., and a "Gaps Requiring Input" section at the end.`;

  const content = await callClaude(COMMANDMENT_SYSTEM_PROMPT, prompt);

  // Analyze completeness
  const gapMatches = content.match(/\[GAP[:\s][^\]]*\]/g) || [];
  const gaps = gapMatches.map(g => g.replace(/\[GAP[:\s]*/, "").replace(/\]$/, ""));
  const hasSubstantialContent = content.length > 2000;
  const gapPenalty = gaps.length * 10;
  const completeness = Math.max(0, Math.min(100, hasSubstantialContent ? 90 - gapPenalty : 50 - gapPenalty));

  return {
    name: commandmentDef.name,
    path: `contexts/${entitySlug}/${commandmentDef.category}/${commandmentDef.name}`,
    category: commandmentDef.category,
    content,
    completeness,
    gaps,
  };
}

// =============================================================================
// GAP ANALYSIS
// =============================================================================

const GAP_ANALYSIS_SYSTEM = `You are analyzing commandment files to determine minimal questions needed.

Philosophy:
- Questions are boring. Minimize them ruthlessly.
- The Sculptor session should have captured 80%+ of what's needed.
- Only ask questions that will MATERIALLY improve the commandments.

Output JSON with:
{
  "summary": { "total_commandments": 18, "average_completeness": 75, "files_needing_attention": ["CRISIS_PROTOCOLS.md"] },
  "gaps_by_file": { "CRISIS_PROTOCOLS.md": [{ "gap_id": "CR-G01", "description": "...", "can_be_filled_by": ["E08"], "priority": "high" }] },
  "questions_to_ask": [{ "id": "E08", "source": "question-e", "text": "What does your overwhelm spiral look like?", "fills_gaps": ["CR-G01"], "priority": "high" }],
  "questions_to_skip": { "E01": "Covered in sculptor" }
}`;

async function analyzeGapsAndGenerateQuestions(
  commandments: CommandmentFile[],
  definitions: HumanOsDefinitions,
  entityName: string
): Promise<{ questions: GapQuestion[]; summary: Record<string, unknown>; gapsByFile: Record<string, unknown[]> }> {
  const filesSummary = commandments.map(c => ({
    name: c.name,
    category: c.category,
    completeness: c.completeness,
    gaps: c.gaps,
  }));

  const prompt = `Analyze these commandment files for ${entityName} and determine the MINIMAL questions needed.

## COMMANDMENT FILES GENERATED
${JSON.stringify(filesSummary, null, 2)}

## AVAILABLE QUESTION SETS
${JSON.stringify(definitions.questionSets, null, 2)}

---

For each gap, identify which question(s) could fill it. Be ruthless about minimizing questions.
Return your analysis as JSON.`;

  const response = await callClaude(GAP_ANALYSIS_SYSTEM, prompt);

  try {
    let cleaned = response.trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    const parsed = JSON.parse(cleaned);
    return {
      questions: parsed.questions_to_ask || [],
      summary: parsed.summary || {},
      gapsByFile: parsed.gaps_by_file || {},
    };
  } catch (e) {
    console.error("[synthesize] Failed to parse gap analysis:", e);
    return { questions: [], summary: { error: "Parse failed" }, gapsByFile: {} };
  }
}

function generateGapFinalMarkdown(
  entitySlug: string,
  entityName: string,
  commandments: CommandmentFile[],
  questions: GapQuestion[],
  gapsByFile: Record<string, unknown[]>,
  summary: Record<string, unknown>
): string {
  const voiceFiles = commandments.filter(c => c.category === "voice");
  const founderFiles = commandments.filter(c => c.category === "founder-os");
  const registryFiles = commandments.filter(c => c.category === "registry");

  const avgVoiceCompleteness = voiceFiles.length > 0 ? Math.round(voiceFiles.reduce((s, f) => s + f.completeness, 0) / voiceFiles.length) : 0;
  const avgFounderCompleteness = founderFiles.length > 0 ? Math.round(founderFiles.reduce((s, f) => s + f.completeness, 0) / founderFiles.length) : 0;

  let md = `---
title: Gap Analysis Final
type: analysis
entity: ${entitySlug}
version: "2.0"
generated: "${new Date().toISOString()}"
methodology: "Sculptor transcript → Registry extraction → Commandment generation → Gap analysis"
---

# GAP ANALYSIS FINAL: ${entityName}

This document contains the minimal questions needed to complete the Human OS setup.

---

## Summary

- **Registry Files:** ${registryFiles.length}
- **Voice OS Files:** ${voiceFiles.length} (avg ${avgVoiceCompleteness}% complete)
- **Founder OS Files:** ${founderFiles.length} (avg ${avgFounderCompleteness}% complete)
- **Questions Needed:** ${questions.length}

---

## Per-Document Gaps

`;

  for (const [fileName, gaps] of Object.entries(gapsByFile)) {
    if (Array.isArray(gaps) && gaps.length > 0) {
      md += `### ${fileName}\n\n`;
      md += `| Gap ID | Description | Can Be Filled By | Priority |\n`;
      md += `|--------|-------------|------------------|----------|\n`;
      for (const gap of gaps as Array<{ gap_id?: string; description?: string; can_be_filled_by?: string[]; priority?: string }>) {
        md += `| ${gap.gap_id || "?"} | ${gap.description || "?"} | ${(gap.can_be_filled_by || []).join(", ")} | ${gap.priority || "medium"} |\n`;
      }
      md += "\n";
    }
  }

  md += `---

## Questions to Ask (${questions.length} total)

`;

  if (questions.length === 0) {
    md += `**None required!** The Sculptor session captured everything needed.\n`;
  } else {
    md += `| ID | Source | Question | Fills Gaps | Priority |\n`;
    md += `|----|--------|----------|------------|----------|\n`;
    for (const q of questions) {
      md += `| ${q.id} | ${q.source} | ${q.text.substring(0, 50)}... | ${q.fills_gaps.join(", ")} | ${q.priority} |\n`;
    }
  }

  md += `
---

## Files Generated

### Registry
${registryFiles.map(f => `- \`${f.path}\``).join("\n")}

### Voice OS
${voiceFiles.map(f => `- \`${f.path}\` (${f.completeness}%)`).join("\n")}

### Founder OS
${founderFiles.map(f => `- \`${f.path}\` (${f.completeness}%)`).join("\n")}

---

## Next Steps

1. User answers the ${questions.length} questions above (if any)
2. Answers are merged into commandments
3. User reviews and confirms final versions
4. Move to tool setup
`;

  return md;
}

// =============================================================================
// STORAGE
// =============================================================================

async function uploadToStorage(
  supabase: ReturnType<typeof createServiceClient>,
  path: string,
  content: string
): Promise<boolean> {
  const blob = new Blob([content], { type: "text/markdown" });

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    contentType: "text/markdown",
    upsert: true,
  });

  if (error) {
    console.error(`[synthesize] Error uploading ${path}:`, error);
    return false;
  }

  return true;
}

async function downloadFromStorage(
  supabase: ReturnType<typeof createServiceClient>,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);

  if (error || !data) {
    return null;
  }

  return await data.text();
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body: SynthesizeRequest = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return errorResponse("Missing required field: session_id");
    }

    const supabase = createServiceClient();

    // Step 1: Load definitions from Renubu
    console.log("[synthesize] Loading definitions from Renubu...");
    const definitions = await loadDefinitionsFromRenubu();

    // Step 2: Fetch session info
    console.log(`[synthesize] Fetching session ${session_id}...`);
    const { data: session, error: sessionError } = await supabase
      .from("sculptor_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return errorResponse(`Session not found: ${sessionError?.message || "unknown"}`);
    }

    const entitySlug = session.entity_slug;
    const entityName = session.entity_name;

    // Step 3: Fetch source documents
    console.log("[synthesize] Fetching source documents...");

    const sculptorTranscript = await downloadFromStorage(supabase, `contexts/${entitySlug}/SCULPTOR_TRANSCRIPT.md`);
    const corpusSummary = await downloadFromStorage(supabase, `contexts/${entitySlug}/CORPUS_SUMMARY.md`);
    const digest = await downloadFromStorage(supabase, `contexts/${entitySlug}/DIGEST.md`);

    if (!sculptorTranscript) {
      return errorResponse("SCULPTOR_TRANSCRIPT.md not found in storage");
    }

    if (!corpusSummary) {
      return errorResponse("CORPUS_SUMMARY.md not found in storage");
    }

    const sources: SourceDocuments = { sculptorTranscript, corpusSummary, digest };

    // Step 4: Phase 1 - Extract registries
    console.log("[synthesize] Phase 1: Extracting registries...");
    const extractedData = await extractRegistries(sources, entityName);
    const registryFiles = generateRegistryMarkdown(extractedData, entitySlug);

    console.log(`[synthesize]   Extracted: ${extractedData.stories.length} stories, ${extractedData.anecdotes.length} anecdotes, ${extractedData.events.length} events, ${extractedData.people.length} people, ${extractedData.corrections.length} corrections`);

    // Step 5: Phase 2 - Generate commandments with references
    console.log("[synthesize] Phase 2: Generating Voice OS commandments...");
    const voiceCommandments: CommandmentFile[] = [];
    for (const def of definitions.commandments.voice) {
      console.log(`[synthesize]   - ${def.name}...`);
      const file = await generateCommandment(def, extractedData, sources, entitySlug, entityName);
      voiceCommandments.push(file);
    }

    console.log("[synthesize] Phase 2: Generating Founder OS commandments...");
    const founderCommandments: CommandmentFile[] = [];
    for (const def of definitions.commandments.founder) {
      console.log(`[synthesize]   - ${def.name}...`);
      const file = await generateCommandment(def, extractedData, sources, entitySlug, entityName);
      founderCommandments.push(file);
    }

    const allCommandments = [...registryFiles, ...voiceCommandments, ...founderCommandments];

    // Step 6: Analyze gaps
    console.log("[synthesize] Analyzing gaps...");
    const { questions, summary, gapsByFile } = await analyzeGapsAndGenerateQuestions(allCommandments, definitions, entityName);

    // Step 7: Generate GAP_ANALYSIS_FINAL.md
    console.log("[synthesize] Generating GAP_ANALYSIS_FINAL.md...");
    const gapFinalContent = generateGapFinalMarkdown(entitySlug, entityName, allCommandments, questions, gapsByFile, summary);

    // Step 8: Upload all files
    console.log("[synthesize] Uploading files to storage...");

    let uploadSuccessCount = 0;
    let uploadFailCount = 0;

    for (const file of allCommandments) {
      const success = await uploadToStorage(supabase, file.path, file.content);
      if (success) uploadSuccessCount++;
      else uploadFailCount++;
    }

    const gapFinalSuccess = await uploadToStorage(supabase, `contexts/${entitySlug}/GAP_ANALYSIS_FINAL.md`, gapFinalContent);

    // Step 9: Update session metadata
    await supabase
      .from("sculptor_sessions")
      .update({
        metadata: {
          ...session.metadata,
          commandments_generated: new Date().toISOString(),
          commandment_completeness: {
            voice: voiceCommandments.length > 0 ? Math.round(voiceCommandments.reduce((s, f) => s + f.completeness, 0) / voiceCommandments.length) : 0,
            founder: founderCommandments.length > 0 ? Math.round(founderCommandments.reduce((s, f) => s + f.completeness, 0) / founderCommandments.length) : 0,
          },
          registry_items: {
            stories: extractedData.stories.length,
            anecdotes: extractedData.anecdotes.length,
            events: extractedData.events.length,
            people: extractedData.people.length,
            corrections: extractedData.corrections.length,
            parking_lot: extractedData.parking_lot.length,
          },
          tutorial_questions_count: questions.length,
        },
      })
      .eq("id", session_id);

    // Step 10: Return results
    return jsonResponse({
      status: "complete",
      entity_slug: entitySlug,
      session_id,
      files_generated: {
        registry: registryFiles.length,
        voice: voiceCommandments.length,
        founder: founderCommandments.length,
        total: allCommandments.length,
      },
      registry_items: {
        stories: extractedData.stories.length,
        anecdotes: extractedData.anecdotes.length,
        events: extractedData.events.length,
        people: extractedData.people.length,
        corrections: extractedData.corrections.length,
        parking_lot: extractedData.parking_lot.length,
      },
      files_uploaded: uploadSuccessCount,
      files_failed: uploadFailCount,
      completeness: {
        voice: voiceCommandments.length > 0 ? Math.round(voiceCommandments.reduce((s, f) => s + f.completeness, 0) / voiceCommandments.length) : 0,
        founder: founderCommandments.length > 0 ? Math.round(founderCommandments.reduce((s, f) => s + f.completeness, 0) / founderCommandments.length) : 0,
      },
      tutorial_questions: questions,
      tutorial_questions_count: questions.length,
      gap_analysis_path: `contexts/${entitySlug}/GAP_ANALYSIS_FINAL.md`,
    });

  } catch (error) {
    console.error("[synthesize] Error:", error);
    return errorResponse(`Internal error: ${(error as Error).message}`, 500);
  }
});
