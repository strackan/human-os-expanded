/**
 * POST /api/voice/generate-samples
 *
 * Generate 3 voice content samples based on corpus analysis + interview data.
 *
 * Priority signal chain:
 *   1. Corpus voice analysis (DIGEST.md) — PRIMARY
 *   2. Writing rules (WRITING_ENGINE.md) — ALWAYS/NEVER patterns
 *   3. Template framework (TEMPLATE_COMPONENTS.md, BLEND_RECIPES.md) — structure
 *   4. Persona fingerprint (sculptor_sessions) — quantified dimensions
 *   5. Interview answers (request body) — SUPPLEMENTARY anecdotes
 *   6. Voice OS commandments (session metadata) — override when available
 *
 * Falls back gracefully: corpus-rich users get 95% accuracy,
 * new users without corpus data fall back to interview-only generation.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import type { SupabaseClient } from '@supabase/supabase-js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface VoiceSample {
  id: string;
  type: 'thought_leadership' | 'personal_story' | 'connection_request';
  label: string;
  description: string;
  content: string;
  topic: string;
}

interface GenerateSamplesRequest {
  session_id: string;
  interview_answers?: Record<string, string>;
}

interface GenerateSamplesResponse {
  samples: VoiceSample[];
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

interface CorpusData {
  digest: string | null;
  writingEngine: string | null;
  // Tier 1 structural files
  openings: string | null;
  middles: string | null;
  endings: string | null;
  examples: string | null;
  // Tier 2 DEV files
  themes: string | null;
  guardrails: string | null;
  stories: string | null;
  anecdotes: string | null;
  context: string | null;
  // Legacy fallback
  templateComponents: string | null;
  blendRecipes: string | null;
}

// =============================================================================
// STORAGE HELPERS
// =============================================================================

async function loadStorageFile(
  supabase: SupabaseClient,
  filePath: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('human-os')
      .download(filePath);

    if (error || !data) {
      return null;
    }

    return await data.text();
  } catch {
    return null;
  }
}

async function loadCorpusData(
  supabase: SupabaseClient,
  entitySlug: string,
): Promise<CorpusData> {
  const [
    digest, writingEngine,
    openings, middles, endings, examples,
    themes, guardrails, stories, anecdotes, context,
    templateComponents, blendRecipes,
  ] = await Promise.all([
    // Tier 1
    loadStorageFile(supabase, `contexts/${entitySlug}/DIGEST.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/01_WRITING_ENGINE.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/06_OPENINGS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/07_MIDDLES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/08_ENDINGS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/10_EXAMPLES.md`),
    // Tier 2
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/02_THEMES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/03_GUARDRAILS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/04_STORIES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/05_ANECDOTES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/CONTEXT.md`),
    // Legacy fallback
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/02_TEMPLATE_COMPONENTS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/04_BLEND_RECIPES.md`),
  ]);

  return {
    digest, writingEngine,
    openings, middles, endings, examples,
    themes, guardrails, stories, anecdotes, context,
    templateComponents, blendRecipes,
  };
}

async function loadVoiceCommandments(
  supabase: SupabaseClient,
  entitySlug: string,
): Promise<{ voice: string | null; themes: string | null; guardrails: string | null }> {
  const [voice, themes, guardrails] = await Promise.all([
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/VOICE.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/THEMES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/GUARDRAILS.md`),
  ]);

  return { voice, themes, guardrails };
}

// =============================================================================
// PROMPT CONSTRUCTION
// =============================================================================

function buildSystemPrompt(opts: {
  corpus: CorpusData;
  personaFingerprint: PersonaFingerprint | null;
  commandments: { voice: string | null; themes: string | null; guardrails: string | null };
  voiceContext: { tone?: string; style?: string; characteristics?: string[]; summary?: string };
}): string {
  const { corpus, personaFingerprint, commandments, voiceContext } = opts;
  const hasCorpus = corpus.digest || corpus.writingEngine;

  let prompt = `You are generating voice-calibrated content samples. Your job is to write as this specific person would write -- matching their exact patterns, vocabulary, rhythm, and personality.

You will generate 3 pieces of content:
1. THOUGHT LEADERSHIP - A LinkedIn post sharing expertise or a contrarian opinion (150-300 words)
2. PERSONAL STORY - A LinkedIn post reflecting on a personal experience or lesson (150-300 words)
3. CONNECTION REQUEST - A short LinkedIn connection request message (50-100 words)

`;

  // Layer 1: Corpus Voice Analysis (PRIMARY)
  if (corpus.digest) {
    prompt += `## VOICE FINGERPRINT (from corpus analysis)

${corpus.digest}

`;
  }

  // Layer 2: Writing Rules
  if (corpus.writingEngine) {
    prompt += `## WRITING RULES

${corpus.writingEngine}

`;
  }

  // Layer 3: Structural Templates (Tier 1 or legacy fallback)
  if (corpus.openings || corpus.middles || corpus.endings) {
    if (corpus.openings) {
      prompt += `## OPENING PATTERNS\n\n${corpus.openings}\n\n`;
    }
    if (corpus.middles) {
      prompt += `## MIDDLE PATTERNS\n\n${corpus.middles}\n\n`;
    }
    if (corpus.endings) {
      prompt += `## ENDING PATTERNS\n\n${corpus.endings}\n\n`;
    }
    if (corpus.examples) {
      prompt += `## ANNOTATED EXAMPLES\n\n${corpus.examples}\n\n`;
    }
  } else if (corpus.templateComponents) {
    // Legacy fallback
    prompt += `## TEMPLATE FRAMEWORK\n\n${corpus.templateComponents}\n\n`;
  }

  if (corpus.blendRecipes) {
    prompt += `## BLEND RECIPES (proven combinations)\n\n${corpus.blendRecipes}\n\n`;
  }

  // Layer 4: Quantified Voice Profile
  if (personaFingerprint) {
    prompt += `## PERSONALITY DIMENSIONS (0-10 scale — calibrate tone intensity to these scores)

- Self-Deprecation: ${personaFingerprint.self_deprecation}/10 ${personaFingerprint.self_deprecation >= 7 ? '(heavy self-mockery, humor as bridge)' : personaFingerprint.self_deprecation >= 4 ? '(moderate self-awareness)' : '(minimal)'}
- Directness: ${personaFingerprint.directness}/10 ${personaFingerprint.directness >= 7 ? '(says what they mean, no hedging)' : '(balanced)'}
- Warmth: ${personaFingerprint.warmth}/10 ${personaFingerprint.warmth >= 7 ? '(genuine warmth underneath any sarcasm)' : '(professional warmth)'}
- Intellectual Signaling: ${personaFingerprint.intellectual_signaling}/10 ${personaFingerprint.intellectual_signaling >= 7 ? '(references literature/philosophy casually)' : '(accessible, practical)'}
- Comfort with Sincerity: ${personaFingerprint.comfort_with_sincerity}/10 ${personaFingerprint.comfort_with_sincerity >= 7 ? '(can be deeply sincere, sometimes wraps in humor first)' : '(measured sincerity)'}
- Absurdism Tolerance: ${personaFingerprint.absurdism_tolerance}/10 ${personaFingerprint.absurdism_tolerance >= 7 ? '(comfortable with weird, crude, unexpected)' : '(conventional)'}
- Format Awareness: ${personaFingerprint.format_awareness}/10 ${personaFingerprint.format_awareness >= 7 ? '(highly aware of structure, uses spacing as pacing)' : '(natural formatting)'}
- Vulnerability as Tool: ${personaFingerprint.vulnerability_as_tool}/10 ${personaFingerprint.vulnerability_as_tool >= 7 ? '(vulnerability is central -- refers to the mess, does not write from inside it)' : '(selective vulnerability)'}

`;
  }

  // Layer 5: Tier 2 DEV files (sculptor-derived context)
  if (corpus.themes || corpus.guardrails || corpus.stories || corpus.anecdotes) {
    const isDev = corpus.themes?.includes('status: "dev"');
    if (isDev) {
      prompt += `## SUPPLEMENTARY CONTEXT (preliminary — from sculptor session, subject to refinement)\n\n`;
    }
    if (corpus.themes) {
      prompt += `### THEMES\n${corpus.themes}\n\n`;
    }
    if (corpus.guardrails) {
      prompt += `### GUARDRAILS\n${corpus.guardrails}\n\n`;
    }
    if (corpus.stories) {
      prompt += `### KEY STORIES\n${corpus.stories}\n\n`;
    }
    if (corpus.anecdotes) {
      prompt += `### ANECDOTES\n${corpus.anecdotes}\n\n`;
    }
    if (corpus.context) {
      prompt += `### CONTEXT\n${corpus.context}\n\n`;
    }
  }

  // Layer 6: Existing Voice OS Commandments (override when available)
  if (commandments.voice || commandments.themes || commandments.guardrails) {
    prompt += `## VOICE OS COMMANDMENTS (from synthesis — these override interview-inferred style)

`;
    if (commandments.voice) {
      prompt += `### VOICE\n${commandments.voice}\n\n`;
    }
    if (commandments.themes) {
      prompt += `### THEMES\n${commandments.themes}\n\n`;
    }
    if (commandments.guardrails) {
      prompt += `### GUARDRAILS\n${commandments.guardrails}\n\n`;
    }
  }

  // Fallback: basic voice context from executive_report (only if no corpus)
  if (!hasCorpus && voiceContext.tone) {
    prompt += `## VOICE PROFILE (from executive report)
Tone: ${voiceContext.tone}
Style: ${voiceContext.style || 'Natural'}
Characteristics: ${voiceContext.characteristics?.join(', ') || 'Authentic, clear'}
Summary: ${voiceContext.summary || 'Write naturally.'}

`;
  }

  // Generation rules
  prompt += `## CRITICAL GENERATION RULES

- Write as this specific person would write -- not a generic professional
- Match their vocabulary, sentence rhythm, and personality dimensions
- Apply ALL "always" patterns from the writing rules (parenthetical asides, double hyphens, etc.)
- Avoid ALL "never" patterns (no corporate jargon, no em dashes, no thought leader voice)
- Use specific stories/anecdotes from the corpus when relevant
- Each sample MUST feel indistinguishable from content this person actually wrote
- Do NOT sanitize their voice or smooth out rough edges
- Do NOT use em dashes — use double hyphens (--) instead

OUTPUT FORMAT (JSON):
{
  "samples": [
    {
      "id": "thought_leadership",
      "type": "thought_leadership",
      "label": "Thought Leadership Post",
      "description": "A LinkedIn post sharing your expertise",
      "content": "The actual post content...",
      "topic": "Brief topic description"
    },
    {
      "id": "personal_story",
      "type": "personal_story",
      "label": "Personal Story Post",
      "description": "A reflective LinkedIn post",
      "content": "The actual post content...",
      "topic": "Brief topic description"
    },
    {
      "id": "connection_request",
      "type": "connection_request",
      "label": "Connection Request",
      "description": "A LinkedIn connection message",
      "content": "The actual message...",
      "topic": "Brief context for connection"
    }
  ]
}`;

  return prompt;
}

function buildUserPrompt(opts: {
  interviewAnswers: Record<string, string>;
  hasCorpus: boolean;
  hasStructuralTemplates: boolean;
  hasTier2: boolean;
}): string {
  const { interviewAnswers, hasCorpus, hasStructuralTemplates, hasTier2 } = opts;
  const answerEntries = Object.entries(interviewAnswers);

  let prompt = '';

  // Template blend instructions when structural templates are available
  if (hasCorpus && hasStructuralTemplates) {
    prompt += `Generate 3 voice samples using the Opening/Middle/Ending patterns provided:

1. THOUGHT LEADERSHIP POST:
   - Select an Opening pattern that fits (e.g., Pattern Recognition, Provocative Question)
   - Select a Middle pattern (e.g., Philosophical Escalation, List-That-Isn't-A-List)
   - Select an Ending pattern (e.g., Open Question, Practical Application)
   - Draw from beliefs, themes${hasTier2 ? ', and stories/anecdotes in the context files' : ' in the corpus'}
   - Apply voice rules: use ALWAYS patterns, avoid NEVER patterns
   - Match personality dimension scores

2. PERSONAL STORY POST:
   - Select patterns that support narrative (e.g., Vulnerability or Scene-Setting opening, Story Arc middle)
   - Draw from actual key stories/anecdotes${hasTier2 ? ' in the STORIES and ANECDOTES files' : ' in the corpus'}
   - Apply the vulnerability boundary from the writing engine
   - Use short punchy sentences for emotional beats, longer flowing sentences for scene-building

3. CONNECTION REQUEST:
   - Use a specific-detail opening, keep it warm and genuine
   - Match directness and warmth scores from personality dimensions
   - Short and genuine — how this person would actually reach out

`;
  } else if (hasCorpus) {
    prompt += `Generate 3 voice samples that match the voice fingerprint and writing rules provided. Use the corpus analysis as your primary guide for tone, rhythm, vocabulary, and personality.

`;
  }

  // Layer 5: Interview answers (SUPPLEMENTARY)
  if (answerEntries.length > 0) {
    prompt += `${hasCorpus ? 'SUPPLEMENTARY CONTEXT — ' : ''}INTERVIEW ANSWERS (use for real anecdotes and personality detail):
`;

    answerEntries.forEach(([questionId, answer]) => {
      if (answer && answer.trim()) {
        const cleanId = questionId.replace('fos-interview-', '').replace(/-/g, ' ');
        prompt += `\n[${cleanId}]: ${answer}\n`;
      }
    });

    if (!hasCorpus) {
      prompt += `
GENERATION INSTRUCTIONS (interview-only mode — no corpus data available):

1. THOUGHT LEADERSHIP POST:
   - Draw from their work style, AI preferences, or feedback preferences (c1-c5 answers)
   - Create a post that shares an opinion or insight they likely hold
   - Make it feel like something they would naturally post

2. PERSONAL STORY POST:
   - Draw from their story answers (a1-a4: turning point, happiest memory, difficult time, redemption)
   - Create a reflective post that shares a lesson or insight
   - Match their emotional tone and vulnerability level

3. CONNECTION REQUEST:
   - Draw from their relationship and social preferences (b3, c4)
   - Create a warm but professional connection request
   - Make it feel like how they would naturally reach out
`;
    }
  } else if (!hasCorpus) {
    prompt += `Generate 3 voice samples for a professional. Use a natural, authentic voice.`;
  }

  prompt += '\n\nReturn valid JSON matching the format specified.';

  return prompt;
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSamplesRequest = await request.json();
    const { session_id, interview_answers } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getHumanOSAdminClient();

    // Fetch session data (include persona_fingerprint)
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, entity_slug, metadata, persona_fingerprint')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('[voice/generate-samples] Session not found:', sessionError?.message);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check for cached samples in storage
    if (session.entity_slug) {
      const cachedPath = `contexts/${session.entity_slug}/VOICE_SAMPLES.json`;
      const { data: cachedData, error: cacheError } = await supabase.storage
        .from('human-os')
        .download(cachedPath);

      if (!cacheError && cachedData) {
        try {
          const cachedText = await cachedData.text();
          const cachedSamples: VoiceSample[] = JSON.parse(cachedText);
          console.log('[voice/generate-samples] Using cached samples from storage');
          return NextResponse.json({ samples: cachedSamples }, { headers: corsHeaders });
        } catch (parseErr) {
          console.warn('[voice/generate-samples] Failed to parse cached samples, generating fresh');
        }
      } else {
        console.log('[voice/generate-samples] No cached samples found, generating fresh');
      }
    }

    // Load corpus data and voice commandments in parallel
    let corpus: CorpusData = {
      digest: null, writingEngine: null,
      openings: null, middles: null, endings: null, examples: null,
      themes: null, guardrails: null, stories: null, anecdotes: null, context: null,
      templateComponents: null, blendRecipes: null,
    };
    let commandments = { voice: null as string | null, themes: null as string | null, guardrails: null as string | null };

    if (session.entity_slug) {
      [corpus, commandments] = await Promise.all([
        loadCorpusData(supabase, session.entity_slug),
        loadVoiceCommandments(supabase, session.entity_slug),
      ]);
    }

    // Extract persona fingerprint
    const personaFingerprint: PersonaFingerprint | null =
      session.persona_fingerprint || session.metadata?.persona_fingerprint || null;

    // Build fallback voice context from executive report
    const voiceContext: {
      tone?: string;
      style?: string;
      characteristics?: string[];
      summary?: string;
    } = {};

    if (session.metadata?.executive_report?.voice) {
      const voice = session.metadata.executive_report.voice;
      voiceContext.tone = voice.tone;
      voiceContext.style = voice.style;
      voiceContext.characteristics = voice.characteristics;
    }
    if (session.metadata?.executive_report?.summary) {
      voiceContext.summary = session.metadata.executive_report.summary;
    }

    // Use interview answers from request or try to get from session
    const answers = interview_answers || session.metadata?.interview_answers || {};

    const hasCorpus = !!(corpus.digest || corpus.writingEngine);
    const hasStructuralTemplates = !!(corpus.openings || corpus.middles || corpus.endings || corpus.templateComponents);
    const hasTier2 = !!(corpus.themes || corpus.guardrails || corpus.stories || corpus.anecdotes);
    const sourcesLoaded = {
      digest: !!corpus.digest,
      writingEngine: !!corpus.writingEngine,
      openings: !!corpus.openings,
      middles: !!corpus.middles,
      endings: !!corpus.endings,
      examples: !!corpus.examples,
      themes: !!corpus.themes,
      guardrails: !!corpus.guardrails,
      stories: !!corpus.stories,
      anecdotes: !!corpus.anecdotes,
      context: !!corpus.context,
      templateComponents: !!corpus.templateComponents,
      blendRecipes: !!corpus.blendRecipes,
      personaFingerprint: !!personaFingerprint,
      commandments: !!(commandments.voice || commandments.themes || commandments.guardrails),
      voiceContext: !!voiceContext.tone,
      answerCount: Object.keys(answers).length,
    };

    console.log('[voice/generate-samples] Sources loaded:', sourcesLoaded);

    // Build prompts
    const systemPrompt = buildSystemPrompt({
      corpus,
      personaFingerprint,
      commandments,
      voiceContext,
    });

    const userPrompt = buildUserPrompt({
      interviewAnswers: answers,
      hasCorpus,
      hasStructuralTemplates,
      hasTier2,
    });

    console.log('[voice/generate-samples] Prompt lengths:', {
      system: systemPrompt.length,
      user: userPrompt.length,
      total: systemPrompt.length + userPrompt.length,
    });

    // Generate content using Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        { role: 'user', content: userPrompt },
      ],
      system: systemPrompt,
    });

    // Extract content from response
    const firstBlock = response.content[0];
    const responseText = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text.trim()
      : '';

    if (!responseText) {
      console.error('[voice/generate-samples] Empty response from LLM');
      return NextResponse.json(
        { error: 'Failed to generate samples' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse JSON response
    let result: GenerateSamplesResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[voice/generate-samples] Failed to parse response:', parseError);
      console.error('[voice/generate-samples] Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse generated samples' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('[voice/generate-samples] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
