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

    // Step 1: Generate CORPUS_SUMMARY.md
    console.log(`[sculptor-onboard] Generating corpus summary for ${entity_name}...`);
    const corpusSummary = await generateCorpusSummary(entity_name, corpus_raw);

    // Step 2: Fetch question bank
    console.log("[sculptor-onboard] Fetching question bank...");
    const questions = await fetchQuestionBank(supabase);
    if (questions.length === 0) {
      return errorResponse("No questions found in database");
    }

    // Step 3: Generate GAP_ANALYSIS.md
    console.log(`[sculptor-onboard] Generating gap analysis (${questions.length} questions)...`);
    const gapAnalysis = await generateGapAnalysis(entity_name, corpusSummary, questions);

    // Step 4: Upload files to storage
    console.log("[sculptor-onboard] Uploading to storage...");
    const uploads = await Promise.all([
      uploadToStorage(supabase, `${entity_slug}/corpus_raw.md`, corpus_raw),
      uploadToStorage(supabase, `${entity_slug}/CORPUS_SUMMARY.md`, corpusSummary),
      uploadToStorage(supabase, `${entity_slug}/GAP_ANALYSIS.md`, gapAnalysis),
    ]);

    if (uploads.some((u) => !u)) {
      return errorResponse("Failed to upload some files to storage");
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
        });
      }
    }

    // Step 6: Create sculptor session
    console.log("[sculptor-onboard] Creating sculptor session...");
    const session = await createSculptorSession(supabase, entity_slug, entity_name);

    if (!session) {
      return errorResponse("Failed to create sculptor session");
    }

    return jsonResponse({
      status: "complete",
      access_code: session.access_code,
      session_id: session.id,
      entity_slug,
      files_uploaded: [
        `${entity_slug}/corpus_raw.md`,
        `${entity_slug}/CORPUS_SUMMARY.md`,
        `${entity_slug}/GAP_ANALYSIS.md`,
      ],
      url: `https://goodhang-staging.vercel.app/sculptor/${session.access_code}`,
    });
  } catch (error) {
    console.error("[sculptor-onboard] Error:", error);
    return errorResponse(`Internal error: ${error.message}`, 500);
  }
});
