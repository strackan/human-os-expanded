/**
 * Sculptor Onboard Edge Function
 *
 * Automates the corpus processing pipeline:
 * 1. Takes raw corpus input (LinkedIn dump, etc.)
 * 2. Generates CORPUS_SUMMARY.md using LLM
 * 3. Fetches question bank from DB
 * 4. Scores corpus and generates GAP_ANALYSIS.md
 * 5. Uploads files to storage
 * 6. Creates sculptor_session
 * 7. Returns access_code
 *
 * Note: CHARACTER.md is NOT generated here - that requires creative input.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CONTEXTS_BUCKET = "contexts";
const VOICE_BUCKET = "human-os";

interface OnboardRequest {
  entity_slug: string;
  entity_name: string;
  corpus_raw: string;
  // Optional: if CHARACTER.md already exists, skip that check
  skip_character_check?: boolean;
}

interface Question {
  slug: string;
  text: string;
  category: string;
  subcategory: string;
}

// =============================================================================
// LLM Calls
// =============================================================================

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
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
      max_tokens: 8192,
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
// Corpus Summary Generation
// =============================================================================

const CORPUS_SUMMARY_SYSTEM = `You are a profile synthesizer. Given raw data about a person (LinkedIn profile, posts, etc.), create a structured summary optimized for:
- NPC character design (understanding who they are)
- Gap analysis (identifying what we don't know)
- Conversation hooks (natural entry points)

Output ONLY the markdown content, no preamble.`;

const CORPUS_SUMMARY_TEMPLATE = `# CORPUS SUMMARY: {NAME}

Synthesized from raw input data.

---

## Identity Snapshot

- **Name:**
- **Location:**
- **Current Role:**
- **Background:**
- **Self-Description:**

---

## Professional Focus

### Primary Work
-

### Adjacent Roles
-

### Core Thesis
[What they believe about their domain]

---

## Thinking Patterns & Philosophy

### On [Their Domain]
-

### On Career & Identity
-

### On Personal Effectiveness
-

---

## Communication Style

### Voice Characteristics
-

### Recurring Phrases/Themes
-

---

## Key Relationships & Network

### Mentioned Collaborators
-

### Mentor Figures
-

---

## Personal Details

### Family
-

### Health/Wellness
-

### Origin
-

---

## Notable Quotes

> "Quote 1"

> "Quote 2"

> "Quote 3"
`;

async function generateCorpusSummary(entityName: string, corpusRaw: string): Promise<string> {
  const prompt = `Generate a CORPUS_SUMMARY.md for ${entityName} based on this raw data:

${corpusRaw}

Use this template structure:
${CORPUS_SUMMARY_TEMPLATE.replace("{NAME}", entityName)}

Fill in all sections based on what you find in the raw data. Leave sections empty with "Not in corpus" if no data available.`;

  return await callClaude(CORPUS_SUMMARY_SYSTEM, prompt);
}

// =============================================================================
// Tier 1 Voice File Generation
// =============================================================================

interface Tier1VoiceFiles {
  digest: string;
  writingEngine: string;
  openings: string;
  middles: string;
  endings: string;
  examples: string;
}

const TIER1_SYSTEM = `You are a voice pattern analyst. Given raw corpus data (LinkedIn posts, writing samples, etc.), extract detailed voice patterns, writing mechanics, and structural templates.

You will generate 6 separate voice files. Output them as a JSON object with these keys:
- digest
- writing_engine
- openings
- middles
- endings
- examples

Each value should be a complete markdown document. Be thorough and specific — cite actual patterns, phrases, and examples from the corpus.`;

function buildTier1Prompt(entityName: string, corpusRaw: string): string {
  return `Analyze this corpus for ${entityName} and generate 6 voice files:

CORPUS:
${corpusRaw}

---

Generate a JSON object with these 6 files:

1. "digest" — DIGEST.md (~3000-5000 words):
---
status: "tier1"
---
# DIGEST: ${entityName}

Sections:
- Identity Statement: Who they are in one paragraph
- Core Beliefs: 5-10 beliefs with evidence quotes from corpus
- Voice Patterns: Sentence rhythm (short vs long), signature moves (parenthetical asides, rhetorical questions, etc.), vocabulary tendencies
- Personality Dimensions: Warmth, directness, humor style, vulnerability level — with evidence
- Key Stories: Major narratives they return to
- Recurring Themes: Topics they circle back to repeatedly

2. "writing_engine" — 01_WRITING_ENGINE.md:
---
status: "tier1"
---
# WRITING ENGINE: ${entityName}

Sections:
- Decision Tree by Content Type: How they approach thought leadership vs personal story vs outreach
- ALWAYS Rules: Patterns they consistently use (with corpus evidence)
- NEVER Rules: Patterns they consistently avoid
- Vulnerability Boundary: How they handle personal disclosure (refer to the mess vs write from inside it)
- Sentence Mechanics: Average sentence length, punctuation habits, paragraph structure
- Vocabulary Profile: Formal vs casual ratio, industry jargon usage, signature phrases

3. "openings" — 06_OPENINGS.md:
---
status: "tier1"
---
# OPENINGS: ${entityName}

Categorize opening patterns found in corpus posts. For each pattern:
- Label (O1, O2, etc.)
- Name (e.g., "Vulnerability Hook", "Pattern Recognition", "Provocative Question")
- Description of the pattern
- 1-2 actual examples from corpus
- Energy match (high/medium/low)
- Best used for (thought leadership, personal story, etc.)

Find at least 4-6 distinct opening patterns.

4. "middles" — 07_MIDDLES.md:
---
status: "tier1"
---
# MIDDLES: ${entityName}

Same structure as openings but for middle/body patterns (M1, M2, etc.):
- Story Arc, Philosophical Escalation, List-That-Isn't-A-List, Analogy Bridge, Dialogue-Driven, etc.
- Actual examples from corpus
- Find at least 4-7 patterns.

5. "endings" — 08_ENDINGS.md:
---
status: "tier1"
---
# ENDINGS: ${entityName}

Same structure for ending patterns (E1, E2, etc.):
- Open Question, Callback, Practical Application, Philosophical Button, etc.
- Actual examples from corpus
- Find at least 4-6 patterns.

6. "examples" — 10_EXAMPLES.md:
---
status: "tier1"
---
# EXAMPLES: ${entityName}

3-5 actual representative samples from corpus. For each:
- Title
- The full text (or substantial excerpt)
- Annotation: Which O/M/E patterns it uses
- Why it's representative of their voice
- Energy level and tone

Return valid JSON with these 6 keys. Each value is a complete markdown string.`;
}

async function generateTier1VoiceFiles(entityName: string, corpusRaw: string): Promise<Tier1VoiceFiles> {
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
      max_tokens: 16384,
      system: TIER1_SYSTEM,
      messages: [{ role: "user", content: buildTier1Prompt(entityName, corpusRaw) }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (tier1): ${error}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  // Extract JSON from response
  let cleaned = text.trim();
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  const parsed = JSON.parse(cleaned);

  return {
    digest: parsed.digest,
    writingEngine: parsed.writing_engine,
    openings: parsed.openings,
    middles: parsed.middles,
    endings: parsed.endings,
    examples: parsed.examples,
  };
}

async function uploadToVoiceStorage(
  supabase: ReturnType<typeof createServiceClient>,
  path: string,
  content: string
): Promise<boolean> {
  const blob = new Blob([content], { type: "text/markdown" });

  const { error } = await supabase.storage.from(VOICE_BUCKET).upload(path, blob, {
    contentType: "text/markdown",
    upsert: true,
  });

  if (error) {
    console.error(`Error uploading voice file ${path}:`, error);
    return false;
  }

  return true;
}

async function uploadTier1Files(
  supabase: ReturnType<typeof createServiceClient>,
  entitySlug: string,
  tier1: Tier1VoiceFiles
): Promise<boolean> {
  const uploads = await Promise.all([
    uploadToVoiceStorage(supabase, `contexts/${entitySlug}/DIGEST.md`, tier1.digest),
    uploadToVoiceStorage(supabase, `contexts/${entitySlug}/voice/01_WRITING_ENGINE.md`, tier1.writingEngine),
    uploadToVoiceStorage(supabase, `contexts/${entitySlug}/voice/06_OPENINGS.md`, tier1.openings),
    uploadToVoiceStorage(supabase, `contexts/${entitySlug}/voice/07_MIDDLES.md`, tier1.middles),
    uploadToVoiceStorage(supabase, `contexts/${entitySlug}/voice/08_ENDINGS.md`, tier1.endings),
    uploadToVoiceStorage(supabase, `contexts/${entitySlug}/voice/10_EXAMPLES.md`, tier1.examples),
  ]);

  return uploads.every((u) => u);
}

// =============================================================================
// Gap Analysis Generation
// =============================================================================

const GAP_ANALYSIS_SYSTEM = `You are a gap analyzer for interview preparation. Given:
1. A corpus summary about a person
2. A list of standard questions we want answered

Determine which questions are ALREADY ANSWERED by the corpus and which remain UNANSWERED.

Output a GAP_ANALYSIS.md in scorecard format with ONLY the unanswered questions.
Questions that are answered should be listed in a separate "Already Answered" section.`;

async function generateGapAnalysis(
  entityName: string,
  corpusSummary: string,
  questions: Question[]
): Promise<string> {
  const questionList = questions
    .map((q) => `- [${q.slug}] ${q.text} (${q.category}/${q.subcategory})`)
    .join("\n");

  const prompt = `Analyze this corpus summary for ${entityName}:

${corpusSummary}

---

Against these standard questions:

${questionList}

---

Generate a GAP_ANALYSIS.md with:

1. **Corpus Coverage Summary** - Brief stats on what percentage of questions are answered
2. **Gap Questions** - Tables grouped by priority, with columns: #, Question, Status, Notes
   - Only include UNANSWERED questions
   - Number them S01, S02, etc.
3. **Already Answered by Corpus** - Table showing what NOT to ask, with evidence from corpus

Format:
\`\`\`markdown
# GAP ANALYSIS: ${entityName}

Sculptor extraction targets with numbered questions for tracking.
**Methodology:** Scored corpus against question bank. Only UNANSWERED questions listed below.

---

## Corpus Coverage Summary

[Stats here]

---

## Priority 1: [Category Name]

| # | Question | Status | Notes |
|---|----------|--------|-------|
| S01 | [Question text] | | [Why it's a gap] |

## Priority 2: [Category Name]

...

---

## Already Answered by Corpus (Do Not Ask)

| Topic | Corpus Evidence |
|-------|-----------------|
| [Topic] | [Brief evidence] |

---

## Completion Tracking

- **Total Gap Questions:** X
- **Answered:** 0
- **Completion:** 0%
\`\`\``;

  return await callClaude(GAP_ANALYSIS_SYSTEM, prompt);
}

// =============================================================================
// Database & Storage Operations
// =============================================================================

async function fetchQuestionBank(supabase: ReturnType<typeof createServiceClient>): Promise<Question[]> {
  // Fetch questions from CORE and FOS domains (most relevant for sculptor)
  const { data, error } = await supabase
    .from("questions")
    .select("slug, text, category, subcategory")
    .in("domain", ["core", "fos"])
    .order("slug");

  if (error) {
    console.error("Error fetching questions:", error);
    return [];
  }

  return data || [];
}

async function uploadToStorage(
  supabase: ReturnType<typeof createServiceClient>,
  path: string,
  content: string
): Promise<boolean> {
  const blob = new Blob([content], { type: "text/markdown" });

  const { error } = await supabase.storage.from(CONTEXTS_BUCKET).upload(path, blob, {
    contentType: "text/markdown",
    upsert: true,
  });

  if (error) {
    console.error(`Error uploading ${path}:`, error);
    return false;
  }

  return true;
}

async function createSculptorSession(
  supabase: ReturnType<typeof createServiceClient>,
  entitySlug: string,
  entityName: string
): Promise<{ access_code: string; id: string } | null> {
  // Get premier template
  const { data: template, error: templateError } = await supabase
    .from("sculptor_templates")
    .select("id")
    .eq("slug", "premier")
    .single();

  if (templateError || !template) {
    console.error("Premier template not found:", templateError);
    return null;
  }

  // Create session with entity_slug pattern access code
  const accessCode = `sc_${entitySlug}`;

  const { data: session, error: sessionError } = await supabase
    .from("sculptor_sessions")
    .insert({
      access_code: accessCode,
      entity_name: entityName,
      entity_slug: entitySlug,
      template_id: template.id,
      status: "active",
    })
    .select("id, access_code")
    .single();

  if (sessionError) {
    console.error("Error creating session:", sessionError);
    return null;
  }

  return session;
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body: OnboardRequest = await req.json();
    const { entity_slug, entity_name, corpus_raw, skip_character_check } = body;

    // Validate input
    if (!entity_slug || !entity_name || !corpus_raw) {
      return errorResponse("Missing required fields: entity_slug, entity_name, corpus_raw");
    }

    const supabase = createServiceClient();

    // Step 1: Generate CORPUS_SUMMARY.md + Tier 1 voice files in parallel
    // Both only need corpus_raw so they can run concurrently
    console.log(`[sculptor-onboard] Generating corpus summary + Tier 1 voice files for ${entity_name}...`);
    const [corpusSummary, tier1Files] = await Promise.all([
      generateCorpusSummary(entity_name, corpus_raw),
      generateTier1VoiceFiles(entity_name, corpus_raw).catch((err) => {
        console.error("[sculptor-onboard] Tier 1 generation failed (non-fatal):", err);
        return null;
      }),
    ]);

    // Step 2: Fetch question bank
    console.log("[sculptor-onboard] Fetching question bank...");
    const questions = await fetchQuestionBank(supabase);
    if (questions.length === 0) {
      return errorResponse("No questions found in database");
    }

    // Step 3: Generate GAP_ANALYSIS.md
    console.log(`[sculptor-onboard] Generating gap analysis (${questions.length} questions)...`);
    const gapAnalysis = await generateGapAnalysis(entity_name, corpusSummary, questions);

    // Step 4: Upload files to storage (corpus files + Tier 1 voice files)
    console.log("[sculptor-onboard] Uploading to storage...");
    const uploadPromises: Promise<boolean>[] = [
      uploadToStorage(supabase, `${entity_slug}/corpus_raw.md`, corpus_raw),
      uploadToStorage(supabase, `${entity_slug}/CORPUS_SUMMARY.md`, corpusSummary),
      uploadToStorage(supabase, `${entity_slug}/GAP_ANALYSIS.md`, gapAnalysis),
    ];

    // Upload Tier 1 voice files if generation succeeded
    if (tier1Files) {
      uploadPromises.push(uploadTier1Files(supabase, entity_slug, tier1Files));
    }

    const uploads = await Promise.all(uploadPromises);

    // Only fail on corpus file upload failures (first 3)
    if (uploads.slice(0, 3).some((u) => !u)) {
      return errorResponse("Failed to upload some files to storage");
    }

    const tier1Uploaded = tier1Files && uploads[3];
    if (tier1Files && !tier1Uploaded) {
      console.warn("[sculptor-onboard] Tier 1 voice files upload failed (non-fatal)");
    }

    // Step 5: Check if CHARACTER.md exists (required for session to work)
    if (!skip_character_check) {
      const { data: characterFile } = await supabase.storage
        .from(CONTEXTS_BUCKET)
        .download(`${entity_slug}/CHARACTER.md`);

      if (!characterFile) {
        return jsonResponse({
          status: "pending_character",
          message: "Corpus processed and uploaded. CHARACTER.md required to create session.",
          entity_slug,
          files_uploaded: [
            `${entity_slug}/corpus_raw.md`,
            `${entity_slug}/CORPUS_SUMMARY.md`,
            `${entity_slug}/GAP_ANALYSIS.md`,
          ],
          tier1_generated: !!tier1Uploaded,
        });
      }
    }

    // Step 6: Create sculptor session
    console.log("[sculptor-onboard] Creating sculptor session...");
    const session = await createSculptorSession(supabase, entity_slug, entity_name);

    if (!session) {
      return errorResponse("Failed to create sculptor session");
    }

    const filesUploaded = [
      `${entity_slug}/corpus_raw.md`,
      `${entity_slug}/CORPUS_SUMMARY.md`,
      `${entity_slug}/GAP_ANALYSIS.md`,
    ];

    if (tier1Uploaded) {
      filesUploaded.push(
        `contexts/${entity_slug}/DIGEST.md`,
        `contexts/${entity_slug}/voice/01_WRITING_ENGINE.md`,
        `contexts/${entity_slug}/voice/06_OPENINGS.md`,
        `contexts/${entity_slug}/voice/07_MIDDLES.md`,
        `contexts/${entity_slug}/voice/08_ENDINGS.md`,
        `contexts/${entity_slug}/voice/10_EXAMPLES.md`,
      );
    }

    return jsonResponse({
      status: "complete",
      access_code: session.access_code,
      session_id: session.id,
      entity_slug,
      files_uploaded: filesUploaded,
      tier1_generated: !!tier1Uploaded,
      url: `https://goodhang-staging.vercel.app/sculptor/${session.access_code}`,
    });
  } catch (error) {
    console.error("[sculptor-onboard] Error:", error);
    return errorResponse(`Internal error: ${error.message}`, 500);
  }
});
