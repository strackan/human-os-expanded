/**
 * Sculptor Gap Final Edge Function
 *
 * Post-Sculptor processing pipeline:
 * 1. Fetches completed Sculptor session conversation
 * 2. Compares against Question E questions (E01-E28)
 * 3. Generates GAP_ANALYSIS_FINAL.md with unanswered questions
 * 4. Scores user on 8 persona dimensions
 * 5. Stores results to Supabase storage
 *
 * Triggers: Called when SESSION_COMPLETE marker is detected
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const STORAGE_BUCKET = "human-os";

interface GapFinalRequest {
  session_id: string;
}

interface Question {
  slug: string;
  text: string;
  category: string;
  subcategory: string;
  description?: string;
  domain?: string;
}

interface QuestionAnalysis {
  slug: string;
  answered: boolean;
  evidence?: string;
  confidence: number;
}

interface PersonaFingerprint {
  self_deprecation: number;
  directness: number;
  warmth: number;
  intellectual_signaling: number;
  comfort_with_sincerity: number;
  absurdism_tolerance: number;
  format_awareness: number;
  vulnerability_as_tool: number;
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
// Gap Analysis
// =============================================================================

const GAP_ANALYSIS_SYSTEM = `You are analyzing a conversation to determine which assessment questions were already answered.

For each question provided, determine if the conversation contains sufficient information to answer it.
Return JSON with this structure:
{
  "analysis": [
    {
      "slug": "E01",
      "answered": true/false,
      "evidence": "Brief quote or summary of relevant conversation",
      "confidence": 0.0-1.0
    }
  ]
}

Be generous - if the conversation touched on the topic even indirectly, mark it as answered.
Only mark as unanswered if there's truly no relevant information.`;

function extractJson(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();

  // Handle ```json ... ``` blocks
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }

  // Find JSON object boundaries
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  return cleaned;
}

async function analyzeGapQuestions(
  conversation: string,
  questions: Question[]
): Promise<QuestionAnalysis[]> {
  const questionList = questions
    .map((q) => `- [${q.slug}] ${q.text}`)
    .join("\n");

  const prompt = `Analyze this conversation to determine which questions were answered:

CONVERSATION:
${conversation}

---

QUESTIONS TO CHECK:
${questionList}

Return your analysis as JSON (no markdown, just raw JSON):`;

  console.log(`[analyzeGapQuestions] Analyzing ${questions.length} questions against ${conversation.length} chars of conversation`);

  const response = await callClaude(GAP_ANALYSIS_SYSTEM, prompt);
  console.log(`[analyzeGapQuestions] Got response of ${response.length} chars`);

  try {
    const cleaned = extractJson(response);
    console.log(`[analyzeGapQuestions] Cleaned JSON: ${cleaned.substring(0, 200)}...`);
    const parsed = JSON.parse(cleaned);
    const analysis = parsed.analysis || [];
    console.log(`[analyzeGapQuestions] Parsed ${analysis.length} question analyses`);
    return analysis;
  } catch (e) {
    console.error("[analyzeGapQuestions] Failed to parse response:", e);
    console.error("[analyzeGapQuestions] Raw response (first 500 chars):", response.substring(0, 500));
    return questions.map((q) => ({
      slug: q.slug,
      answered: false,
      confidence: 0,
    }));
  }
}

// =============================================================================
// Persona Scoring
// =============================================================================

const PERSONA_SCORING_SYSTEM = `You are analyzing a conversation to score the user's personality on 8 dimensions.
Each dimension should be scored 0-10 based on how the user communicates in the conversation.

Return JSON with this exact structure:
{
  "fingerprint": {
    "self_deprecation": 0-10,
    "directness": 0-10,
    "warmth": 0-10,
    "intellectual_signaling": 0-10,
    "comfort_with_sincerity": 0-10,
    "absurdism_tolerance": 0-10,
    "format_awareness": 0-10,
    "vulnerability_as_tool": 0-10
  },
  "reasoning": {
    "self_deprecation": "Brief explanation",
    "directness": "Brief explanation",
    ...
  }
}

Dimension definitions:
- self_deprecation: Do they make fun of themselves? (10 = very self-deprecating, 0 = never)
- directness: How blunt vs diplomatic? (10 = very direct, 0 = very diplomatic)
- warmth: Emotional temperature (10 = very warm, 0 = cold/distant)
- intellectual_signaling: Do they lead with intelligence? (10 = frequently, 0 = never)
- comfort_with_sincerity: Can they be genuine without awkwardness? (10 = very comfortable, 0 = uncomfortable)
- absurdism_tolerance: Comfort with weird/playful tangents (10 = embraces, 0 = dislikes)
- format_awareness: Are they meta about the interaction? (10 = very meta, 0 = not at all)
- vulnerability_as_tool: Do they use their own weakness to connect? (10 = frequently, 0 = never)`;

async function scorePersona(conversation: string): Promise<{ fingerprint: PersonaFingerprint; reasoning: Record<string, string> }> {
  const prompt = `Analyze the USER's personality in this conversation (not the interviewer):

CONVERSATION:
${conversation}

Score the USER on the 8 dimensions. Return JSON (no markdown, just raw JSON):`;

  console.log(`[scorePersona] Scoring persona for ${conversation.length} chars of conversation`);

  const response = await callClaude(PERSONA_SCORING_SYSTEM, prompt);
  console.log(`[scorePersona] Got response of ${response.length} chars`);

  try {
    const cleaned = extractJson(response);
    console.log(`[scorePersona] Cleaned JSON: ${cleaned.substring(0, 200)}...`);
    const parsed = JSON.parse(cleaned);
    console.log(`[scorePersona] Parsed fingerprint:`, parsed.fingerprint);
    return parsed;
  } catch (e) {
    console.error("[scorePersona] Failed to parse response:", e);
    console.error("[scorePersona] Raw response (first 500 chars):", response.substring(0, 500));
    // Return neutral scores
    return {
      fingerprint: {
        self_deprecation: 5,
        directness: 5,
        warmth: 5,
        intellectual_signaling: 5,
        comfort_with_sincerity: 5,
        absurdism_tolerance: 5,
        format_awareness: 5,
        vulnerability_as_tool: 5,
      },
      reasoning: {},
    };
  }
}

// =============================================================================
// Tier 2 Voice File Generation (DEV)
// =============================================================================

interface Tier2VoiceFiles {
  themes: string;
  guardrails: string;
  stories: string;
  anecdotes: string;
  context: string;
}

async function loadStorageFile(
  supabase: ReturnType<typeof createServiceClient>,
  path: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path);

    if (error || !data) return null;
    return await data.text();
  } catch {
    return null;
  }
}

async function loadTier1Files(
  supabase: ReturnType<typeof createServiceClient>,
  entitySlug: string
): Promise<Record<string, string | null>> {
  const [digest, writingEngine, openings, middles, endings, examples] = await Promise.all([
    loadStorageFile(supabase, `contexts/${entitySlug}/DIGEST.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/01_WRITING_ENGINE.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/06_OPENINGS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/07_MIDDLES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/08_ENDINGS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/10_EXAMPLES.md`),
  ]);

  return { digest, writingEngine, openings, middles, endings, examples };
}

const TIER2_SYSTEM = `You are a voice architect. Given a sculptor interview transcript, corpus data, Tier 1 voice files, and persona fingerprint scores, generate 5 voice files that capture the person's themes, guardrails, stories, anecdotes, and daily context.

These are DEV versions — they will be refined after voice calibration feedback.

Output a JSON object with these keys: themes, guardrails, stories, anecdotes, context.
Each value should be a complete markdown document.`;

function buildTier2Prompt(
  entityName: string,
  conversation: string,
  personaFingerprint: PersonaFingerprint,
  tier1Files: Record<string, string | null>
): string {
  let prompt = `Generate 5 Tier 2 DEV voice files for ${entityName}.

## SCULPTOR INTERVIEW TRANSCRIPT:
${conversation}

## PERSONA FINGERPRINT:
${JSON.stringify(personaFingerprint, null, 2)}

`;

  if (tier1Files.digest) {
    prompt += `## TIER 1: DIGEST\n${tier1Files.digest}\n\n`;
  }
  if (tier1Files.writingEngine) {
    prompt += `## TIER 1: WRITING ENGINE\n${tier1Files.writingEngine}\n\n`;
  }
  if (tier1Files.openings) {
    prompt += `## TIER 1: OPENINGS\n${tier1Files.openings}\n\n`;
  }

  prompt += `---

Generate a JSON object with these 5 files:

1. "themes" — 02_THEMES.md:
---
status: "dev"
---
<!-- DEV: Generated from sculptor session. Subject to revision after voice calibration. -->
# THEMES: ${entityName}

Sections:
- Core Beliefs: Ranked by conviction strength, with evidence from sculptor + corpus
- Recurring Themes: Topics they return to — with frequency and emotional charge
- Values Hierarchy: What they prioritize when values conflict
- Internal Tensions: Contradictions they hold (e.g., values authenticity but curates image)
- Hot Buttons: Topics that trigger strong reactions (positive or negative)

2. "guardrails" — 03_GUARDRAILS.md:
---
status: "dev"
---
<!-- DEV: Generated from sculptor session. Subject to revision after voice calibration. -->
# GUARDRAILS: ${entityName}

Sections:
- Topics to Avoid: Subjects they explicitly don't want to discuss publicly
- Tones to Avoid: Vocal registers that don't fit (e.g., preachy, corporate, whiny)
- Sacred Cows: Things they hold so dear that misrepresenting them is a dealbreaker
- Hard NOs: Absolute lines that must never be crossed
- Corrections from Sculptor: Any time they corrected the interviewer or pushed back — these are the HIGHEST priority signals
- Sensitivity Notes: Areas requiring extra care

3. "stories" — 04_STORIES.md:
---
status: "dev"
---
<!-- DEV: Generated from sculptor session. Subject to revision after voice calibration. -->
# STORIES: ${entityName}

Extended narratives extracted from sculptor + corpus. For each story:
- Title
- Summary (2-3 sentences)
- Core Quote (best line from their telling)
- Emotional Tone (what emotions drive this story)
- Tags (themes, values, contexts where this story fits)
- Full narrative (as told by them, preserving their voice)

Include 5-10 stories.

4. "anecdotes" — 05_ANECDOTES.md:
---
status: "dev"
---
<!-- DEV: Generated from sculptor session. Subject to revision after voice calibration. -->
# ANECDOTES: ${entityName}

Brief examples, proof points, one-liners. For each:
- Summary (1 sentence)
- Quote (their exact words or close paraphrase)
- Illustrates (what theme/value/point this supports)
- Context (when to use this)

Include 10-20 anecdotes.

5. "context" — CONTEXT.md:
---
status: "dev"
---
<!-- DEV: Generated from sculptor session. Subject to revision after voice calibration. -->
# CONTEXT: ${entityName}

Condensed day-to-day reference — smaller than DIGEST. Sections:
- Key Identity: Who they are in 2-3 sentences
- Current Priorities: What they're focused on right now
- Communication Style: Quick reference for tone, vocabulary, rhythm
- Decision Framework: How they make decisions (gut vs data, fast vs deliberate)
- Relationship Approach: How they connect with people
- Content Strategy: What they want to be known for

Return valid JSON with these 5 keys. Each value is a complete markdown string.`;

  return prompt;
}

async function generateTier2VoiceFiles(
  entityName: string,
  conversation: string,
  personaFingerprint: PersonaFingerprint,
  tier1Files: Record<string, string | null>
): Promise<Tier2VoiceFiles> {
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
      system: TIER2_SYSTEM,
      messages: [{ role: "user", content: buildTier2Prompt(entityName, conversation, personaFingerprint, tier1Files) }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (tier2): ${error}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  const cleaned = extractJson(text);
  const parsed = JSON.parse(cleaned);

  return {
    themes: parsed.themes,
    guardrails: parsed.guardrails,
    stories: parsed.stories,
    anecdotes: parsed.anecdotes,
    context: parsed.context,
  };
}

async function uploadTier2Files(
  supabase: ReturnType<typeof createServiceClient>,
  entitySlug: string,
  tier2: Tier2VoiceFiles
): Promise<boolean> {
  const uploads = await Promise.all([
    uploadToStorage(supabase, `contexts/${entitySlug}/voice/02_THEMES.md`, tier2.themes),
    uploadToStorage(supabase, `contexts/${entitySlug}/voice/03_GUARDRAILS.md`, tier2.guardrails),
    uploadToStorage(supabase, `contexts/${entitySlug}/voice/04_STORIES.md`, tier2.stories),
    uploadToStorage(supabase, `contexts/${entitySlug}/voice/05_ANECDOTES.md`, tier2.anecdotes),
    uploadToStorage(supabase, `contexts/${entitySlug}/voice/CONTEXT.md`, tier2.context),
  ]);

  return uploads.every((u) => u);
}

// =============================================================================
// Document Generation
// =============================================================================

function generateGapAnalysisFinal(
  entityName: string,
  analysis: QuestionAnalysis[],
  questions: Question[]
): string {
  const unanswered = analysis.filter((a) => !a.answered);
  const answered = analysis.filter((a) => a.answered);

  const questionMap = new Map(questions.map((q) => [q.slug, q]));

  // Count by domain
  const domainCounts = {
    core: { total: 0, answered: 0 },
    fos: { total: 0, answered: 0 },
  };

  for (const q of questions) {
    const domain = q.domain || 'fos';
    if (domain in domainCounts) {
      domainCounts[domain as keyof typeof domainCounts].total++;
      const isAnswered = analysis.find((a) => a.slug === q.slug)?.answered;
      if (isAnswered) {
        domainCounts[domain as keyof typeof domainCounts].answered++;
      }
    }
  }

  let md = `# GAP ANALYSIS FINAL: ${entityName}

Post-Sculptor extraction targets. Only questions NOT answered during the Sculptor interview.

**Generated:** ${new Date().toISOString()}
**Methodology:** Analyzed Sculptor conversation against full question bank (CORE + FOS domains)

---

## Summary

- **Total Questions:** ${analysis.length}
- **Answered in Sculptor:** ${answered.length} (${Math.round((answered.length / analysis.length) * 100)}%)
- **Outstanding:** ${unanswered.length}

### By Domain

| Domain | Total | Answered | Outstanding |
|--------|-------|----------|-------------|
| CORE | ${domainCounts.core.total} | ${domainCounts.core.answered} | ${domainCounts.core.total - domainCounts.core.answered} |
| FOS | ${domainCounts.fos.total} | ${domainCounts.fos.answered} | ${domainCounts.fos.total - domainCounts.fos.answered} |

---

`;

  if (unanswered.length === 0) {
    md += `## Outstanding Questions

**None!** All topics were covered during the Sculptor interview.

---

`;
  } else {
    md += `## Outstanding Questions

| # | Domain | Question | Category | Priority |
|---|--------|----------|----------|----------|
`;

    for (const item of unanswered) {
      const q = questionMap.get(item.slug);
      if (q) {
        const domain = (q.domain || 'fos').toUpperCase();
        md += `| ${item.slug} | ${domain} | ${q.text} | ${q.subcategory} | ${item.confidence < 0.3 ? 'High' : 'Medium'} |
`;
      }
    }

    md += `
---

`;
  }

  md += `## Already Answered (Do Not Ask)

| Topic | Domain | Evidence |
|-------|--------|----------|
`;

  for (const item of answered) {
    const q = questionMap.get(item.slug);
    if (q && item.evidence) {
      const domain = (q.domain || 'fos').toUpperCase();
      md += `| ${q.subcategory}: ${item.slug} | ${domain} | ${item.evidence.substring(0, 100)}... |
`;
    }
  }

  md += `
---

## Completion Tracking

- **Outstanding Questions:** ${unanswered.length}
- **Answered:** ${answered.length}
- **Completion:** ${Math.round((answered.length / analysis.length) * 100)}%
`;

  return md;
}

// =============================================================================
// Storage Operations
// =============================================================================

async function uploadToStorage(
  supabase: ReturnType<typeof createServiceClient>,
  path: string,
  content: string,
  contentType = "text/markdown"
): Promise<boolean> {
  const blob = new Blob([content], { type: contentType });

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.error(`Error uploading ${path}:`, error);
    return false;
  }

  return true;
}

// =============================================================================
// Transcript Generation
// =============================================================================

function generateTranscriptMarkdown(
  entityName: string,
  entitySlug: string,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  let md = `# Sculptor Transcript: ${entityName}

**Entity:** ${entitySlug}
**Generated:** ${new Date().toISOString()}
**Messages:** ${conversationHistory.length}

---

`;

  for (const msg of conversationHistory) {
    const label = msg.role === "user" ? entityName.toUpperCase() : "SCULPTOR";
    md += `## ${label}\n\n${msg.content}\n\n---\n\n`;
  }

  return md;
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
    const body: GapFinalRequest = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return errorResponse("Missing required field: session_id");
    }

    const supabase = createServiceClient();

    // Step 1: Fetch the sculptor session
    console.log(`[sculptor-gap-final] Fetching session ${session_id}...`);
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
    const conversationHistory = session.metadata?.conversation_history || [];

    if (conversationHistory.length === 0) {
      return errorResponse("Session has no conversation history");
    }

    // Format conversation for analysis
    const conversation = conversationHistory
      .map((msg: { role: string; content: string }) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    // Step 1b: Generate and upload SCULPTOR_TRANSCRIPT.md
    console.log("[sculptor-gap-final] Generating SCULPTOR_TRANSCRIPT.md...");
    const transcriptMd = generateTranscriptMarkdown(entityName, entitySlug, conversationHistory);
    const transcriptUploaded = await uploadToStorage(
      supabase,
      `contexts/${entitySlug}/SCULPTOR_TRANSCRIPT.md`,
      transcriptMd
    );
    console.log(`[sculptor-gap-final] Transcript upload: ${transcriptUploaded ? "OK" : "FAILED"}`);

    // Step 2: Fetch all relevant questions (FOS + CORE domains)
    console.log("[sculptor-gap-final] Fetching all FOS and CORE questions...");
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("slug, text, category, subcategory, description, domain")
      .in("domain", ["fos", "core"])
      .order("domain")
      .order("slug");

    if (questionsError || !questions || questions.length === 0) {
      return errorResponse("Failed to fetch questions from FOS/CORE domains");
    }

    // Step 3: Analyze which questions were answered
    console.log(`[sculptor-gap-final] Analyzing ${questions.length} questions against conversation...`);
    const gapAnalysis = await analyzeGapQuestions(conversation, questions);

    // Step 4: Score persona dimensions + load Tier 1 files in parallel
    console.log("[sculptor-gap-final] Scoring persona + loading Tier 1 files...");
    const [personaResult, tier1Files] = await Promise.all([
      scorePersona(conversation),
      loadTier1Files(supabase, entitySlug),
    ]);

    // Step 4b: Generate Tier 2 DEV voice files (uses persona + tier1 + conversation)
    console.log("[sculptor-gap-final] Generating Tier 2 DEV voice files...");
    let tier2Files: Tier2VoiceFiles | null = null;
    try {
      tier2Files = await generateTier2VoiceFiles(
        entityName,
        conversation,
        personaResult.fingerprint,
        tier1Files
      );
    } catch (err) {
      console.error("[sculptor-gap-final] Tier 2 generation failed (non-fatal):", err);
    }

    // Step 4c: Upload Tier 2 files if generated
    let tier2Uploaded = false;
    if (tier2Files) {
      console.log("[sculptor-gap-final] Uploading Tier 2 voice files...");
      tier2Uploaded = await uploadTier2Files(supabase, entitySlug, tier2Files);
      console.log(`[sculptor-gap-final] Tier 2 upload: ${tier2Uploaded ? "OK" : "FAILED"}`);
    }

    // Step 5: Generate GAP_ANALYSIS_FINAL.md
    console.log("[sculptor-gap-final] Generating GAP_ANALYSIS_FINAL.md...");
    const gapAnalysisFinalMd = generateGapAnalysisFinal(entityName, gapAnalysis, questions);

    // Step 6: Upload to storage
    console.log("[sculptor-gap-final] Uploading to storage...");
    const uploadSuccess = await uploadToStorage(
      supabase,
      `contexts/${entitySlug}/GAP_ANALYSIS_FINAL.md`,
      gapAnalysisFinalMd
    );

    if (!uploadSuccess) {
      return errorResponse("Failed to upload GAP_ANALYSIS_FINAL.md to storage");
    }

    // Step 6b: Generate and upload E_QUESTIONS_OUTSTANDING.json
    // This is what the tutorial's /api/tutorial/gap-final endpoint reads
    const outstandingQuestions = gapAnalysis
      .filter((a) => !a.answered)
      .map((a) => {
        const q = questions.find((q) => q.slug === a.slug);
        return {
          id: a.slug,
          section: q?.subcategory || q?.category || "unknown",
          text: q?.text || "",
        };
      });

    const eQuestionsJson = {
      entity: entitySlug,
      generated: new Date().toISOString(),
      total_questions: questions.length,
      questions_answered: gapAnalysis.filter((a) => a.answered).length,
      questions_outstanding: outstandingQuestions.length,
      outstanding: outstandingQuestions,
    };

    const jsonUploaded = await uploadToStorage(
      supabase,
      `contexts/${entitySlug}/E_QUESTIONS_OUTSTANDING.json`,
      JSON.stringify(eQuestionsJson, null, 2),
      "application/json"
    );
    console.log(`[sculptor-gap-final] E_QUESTIONS_OUTSTANDING.json upload: ${jsonUploaded ? "OK" : "FAILED"}`);

    // Step 7: Update session metadata with persona scores + tier2 status
    const { error: updateError } = await supabase
      .from("sculptor_sessions")
      .update({
        metadata: {
          ...session.metadata,
          persona_fingerprint: personaResult.fingerprint,
          persona_reasoning: personaResult.reasoning,
          gap_analysis_generated: new Date().toISOString(),
          tier2_voice_files_generated: tier2Uploaded ? new Date().toISOString() : null,
        },
      })
      .eq("id", session_id);

    if (updateError) {
      console.error("Failed to update session metadata:", updateError);
    }

    // Step 8: Return results
    return jsonResponse({
      status: "complete",
      entity_slug: entitySlug,
      session_id,
      outstanding_questions: outstandingQuestions,
      questions_answered: gapAnalysis.filter((a) => a.answered).length,
      questions_total: questions.length,
      persona_fingerprint: personaResult.fingerprint,
      gap_analysis_path: `contexts/${entitySlug}/GAP_ANALYSIS_FINAL.md`,
      transcript_path: `contexts/${entitySlug}/SCULPTOR_TRANSCRIPT.md`,
      e_questions_path: `contexts/${entitySlug}/E_QUESTIONS_OUTSTANDING.json`,
      tier2_generated: tier2Uploaded,
      tier2_files: tier2Uploaded ? [
        `contexts/${entitySlug}/voice/02_THEMES.md`,
        `contexts/${entitySlug}/voice/03_GUARDRAILS.md`,
        `contexts/${entitySlug}/voice/04_STORIES.md`,
        `contexts/${entitySlug}/voice/05_ANECDOTES.md`,
        `contexts/${entitySlug}/voice/CONTEXT.md`,
      ] : [],
    });
  } catch (error) {
    console.error("[sculptor-gap-final] Error:", error);
    return errorResponse(`Internal error: ${error.message}`, 500);
  }
});
