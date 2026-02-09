/**
 * POST /api/voice/generate-samples
 *
 * Generate 3 voice content samples using discovery-based voice pack loading.
 * Loads ALL voice files from the user's voice directory via loadVoicePack(),
 * then organizes them by role for prompt construction.
 *
 * Falls back gracefully: corpus-rich users get 95% accuracy,
 * new users without corpus data fall back to interview-only generation.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import { loadVoicePack, type VoicePack } from '@/lib/voice-pack';

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

// =============================================================================
// PROMPT CONSTRUCTION
// =============================================================================

function buildSystemPrompt(opts: {
  pack: VoicePack;
  personaFingerprint: PersonaFingerprint | null;
  voiceContext: { tone?: string; style?: string; characteristics?: string[]; summary?: string };
}): string {
  const { pack, personaFingerprint, voiceContext } = opts;
  const hasCorpus = !!(pack.digest || pack.byRole.writing_engine);

  let prompt = `You are generating voice-calibrated content samples. Your job is to write as this specific person would write -- matching their exact patterns, vocabulary, rhythm, and personality.

You will generate 3 pieces of content:
1. THOUGHT LEADERSHIP - A LinkedIn post sharing expertise or a contrarian opinion (150-300 words)
2. PERSONAL STORY - A LinkedIn post reflecting on a personal experience or lesson (150-300 words)
3. CONNECTION REQUEST - A short LinkedIn connection request message (50-100 words)

`;

  // START_HERE as routing preamble
  if (pack.byRole.start_here) {
    prompt += `## OPERATING SYSTEM (START HERE)

${pack.byRole.start_here.content}

`;
  }

  // DIGEST as voice fingerprint
  if (pack.digest) {
    prompt += `## VOICE FINGERPRINT (from corpus analysis)

${pack.digest}

`;
  }

  // Organized by role
  const roleSections: { role: string; heading: string }[] = [
    { role: 'writing_engine', heading: 'WRITING RULES' },
    { role: 'openings', heading: 'OPENING PATTERNS' },
    { role: 'middles', heading: 'MIDDLE PATTERNS' },
    { role: 'endings', heading: 'ENDING PATTERNS' },
    { role: 'examples', heading: 'ANNOTATED EXAMPLES' },
    { role: 'blends', heading: 'BLEND RECIPES' },
    { role: 'themes', heading: 'THEMES' },
    { role: 'guardrails', heading: 'GUARDRAILS' },
    { role: 'stories', heading: 'KEY STORIES' },
    { role: 'anecdotes', heading: 'ANECDOTES' },
    { role: 'context', heading: 'CONTEXT' },
  ];

  const usedPaths = new Set<string>();
  if (pack.byRole.start_here) usedPaths.add(pack.byRole.start_here.path);

  for (const { role, heading } of roleSections) {
    const file = pack.byRole[role];
    if (file) {
      const isDev = file.frontmatter.status === 'dev';
      const qualifier = isDev ? ' (preliminary — subject to refinement)' : '';
      prompt += `## ${heading}${qualifier}

${file.content}

`;
      usedPaths.add(file.path);
    }
  }

  // Supplementary context: files that weren't matched to a known role
  const supplementary = pack.files.filter(f => !usedPaths.has(f.path));
  if (supplementary.length > 0) {
    prompt += `## SUPPLEMENTARY CONTEXT

`;
    for (const file of supplementary) {
      prompt += `### ${file.filename}
${file.content}

`;
    }
  }

  // Quantified voice profile
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

  // Fallback: basic voice context from executive_report (only if no corpus)
  if (!hasCorpus && voiceContext.tone) {
    prompt += `## VOICE PROFILE (from executive report)
Tone: ${voiceContext.tone}
Style: ${voiceContext.style ?? 'Natural'}
Characteristics: ${voiceContext.characteristics?.join(', ') ?? 'Authentic, clear'}
Summary: ${voiceContext.summary ?? 'Write naturally.'}

`;
  }

  // Flavor elements and transitions (when writing engine has them)
  const writingEngine = pack.byRole.writing_engine;
  if (writingEngine) {
    const hasFlavorElements = writingEngine.content.includes('FLAVOR ELEMENTS') || writingEngine.content.includes('F1:');
    const hasTransitions = writingEngine.content.includes('TRANSITIONS') || writingEngine.content.includes('T1:');

    if (hasFlavorElements) {
      prompt += `## FLAVOR ELEMENTS

The WRITING_ENGINE contains flavor elements (F1-F10). Sprinkle these throughout each sample:
- Self-deprecation style, parenthetical asides, vocabulary whiplash
- Strategic profanity for rhythm (not gratuitous)
- Spacing as pacing (visual rhythm on the page)
- Any signature moves like rabbit hole tangents or rug-pull endings

`;
    }

    if (hasTransitions) {
      prompt += `## TRANSITIONS

The WRITING_ENGINE contains transition types (T1-T4). Use these to glue sections together:
- Pivot transitions ("But here's the thing...")
- Zoom transitions ("Let's get specific.")
- Parenthetical transitions ("(Quick tangent: ...)")
- Time jump transitions ("Fast forward 6 months.")

`;
    }
  }

  // Blend recipe instructions
  if (pack.byRole.blends) {
    prompt += `## BLEND SELECTION

A blend recipe file is available above. For each sample, select a PROVEN blend recipe (if one matches the content type) or use an EXPERIMENTAL blend. Note which blend you used.

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
- Do NOT use em dashes -- use double hyphens (--) instead
- If blend recipes exist, select an appropriate blend for each sample type
- If flavor elements exist, explicitly deploy at least 2-3 per sample

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

  // Interview answers (SUPPLEMENTARY)
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
        } catch {
          console.warn('[voice/generate-samples] Failed to parse cached samples, generating fresh');
        }
      } else {
        console.log('[voice/generate-samples] No cached samples found, generating fresh');
      }
    }

    // Load voice pack (replaces loadCorpusData + loadVoiceCommandments)
    const pack = session.entity_slug
      ? await loadVoicePack(supabase, session.entity_slug)
      : { entitySlug: '', digest: null, files: [], byRole: {} } satisfies VoicePack;

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

    const hasCorpus = !!(pack.digest || pack.byRole.writing_engine);
    const hasStructuralTemplates = !!(pack.byRole.openings || pack.byRole.middles || pack.byRole.endings);
    const hasTier2 = !!(pack.byRole.themes || pack.byRole.guardrails || pack.byRole.stories || pack.byRole.anecdotes);

    console.log('[voice/generate-samples] Voice pack loaded:', {
      totalFiles: pack.files.length,
      roles: Object.keys(pack.byRole),
      hasDigest: !!pack.digest,
      hasCorpus,
      hasStructuralTemplates,
      hasTier2,
      personaFingerprint: !!personaFingerprint,
      answerCount: Object.keys(answers).length,
    });

    // Build prompts
    const systemPrompt = buildSystemPrompt({
      pack,
      personaFingerprint,
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
