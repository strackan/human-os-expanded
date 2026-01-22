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
const CONTEXTS_BUCKET = "contexts";

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

    // Step 4: Score persona dimensions
    console.log("[sculptor-gap-final] Scoring persona dimensions...");
    const personaResult = await scorePersona(conversation);

    // Step 5: Generate GAP_ANALYSIS_FINAL.md
    console.log("[sculptor-gap-final] Generating GAP_ANALYSIS_FINAL.md...");
    const gapAnalysisFinalMd = generateGapAnalysisFinal(entityName, gapAnalysis, questions);

    // Step 6: Upload to storage
    console.log("[sculptor-gap-final] Uploading to storage...");
    const uploadSuccess = await uploadToStorage(
      supabase,
      `${entitySlug}/GAP_ANALYSIS_FINAL.md`,
      gapAnalysisFinalMd
    );

    if (!uploadSuccess) {
      return errorResponse("Failed to upload GAP_ANALYSIS_FINAL.md to storage");
    }

    // Step 7: Update session metadata with persona scores
    const { error: updateError } = await supabase
      .from("sculptor_sessions")
      .update({
        metadata: {
          ...session.metadata,
          persona_fingerprint: personaResult.fingerprint,
          persona_reasoning: personaResult.reasoning,
          gap_analysis_generated: new Date().toISOString(),
        },
      })
      .eq("id", session_id);

    if (updateError) {
      console.error("Failed to update session metadata:", updateError);
    }

    // Step 8: Return results
    const outstandingQuestions = gapAnalysis
      .filter((a) => !a.answered)
      .map((a) => {
        const q = questions.find((q) => q.slug === a.slug);
        return {
          slug: a.slug,
          text: q?.text || "",
          category: q?.subcategory || "",
        };
      });

    return jsonResponse({
      status: "complete",
      entity_slug: entitySlug,
      session_id,
      outstanding_questions: outstandingQuestions,
      questions_answered: gapAnalysis.filter((a) => a.answered).length,
      questions_total: questions.length,
      persona_fingerprint: personaResult.fingerprint,
      gap_analysis_path: `${entitySlug}/GAP_ANALYSIS_FINAL.md`,
    });
  } catch (error) {
    console.error("[sculptor-gap-final] Error:", error);
    return errorResponse(`Internal error: ${error.message}`, 500);
  }
});
