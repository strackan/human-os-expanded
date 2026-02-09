/**
 * POST /api/voice/regenerate-sample
 *
 * Regenerate a single voice sample using user feedback.
 * Takes the original content plus whatDidntWork / whatWouldHelp
 * and returns a rewritten version that applies the feedback.
 *
 * Uses loadVoicePack() for discovery-based voice context loading,
 * ensuring regenerated content stays in voice rather than drifting
 * toward generic -- and automatically picks up any new/custom files.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import { loadVoicePack } from '@/lib/voice-pack';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface RegenerateSampleRequest {
  session_id: string;
  sample: {
    id: string;
    type: string;
    label: string;
    content: string;
    topic: string;
  };
  feedback: {
    whatDidntWork: string;
    whatWouldHelp: string;
    editedContent?: string;
  };
  attempt_number: number;
}

interface RegenerateSampleResponse {
  regenerated_content: string;
  changes_made: string[];
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

function buildSystemPrompt(voiceContext: {
  digest: string | null;
  writingEngine: string | null;
  openings: string | null;
  middles: string | null;
  endings: string | null;
  guardrails: string | null;
  supplementary: { filename: string; content: string }[];
  personaFingerprint: PersonaFingerprint | null;
}): string {
  const { digest, writingEngine, openings, middles, endings, guardrails, supplementary, personaFingerprint } = voiceContext;
  const hasCorpus = !!(digest || writingEngine);

  let prompt = `You are rewriting a piece of LinkedIn content based on the user's specific feedback. Your job is to apply their instructions precisely while keeping the same topic, format, and approximate length.

`;

  if (digest) {
    prompt += `## VOICE FINGERPRINT (write in this person's voice)

${digest}

`;
  }

  if (writingEngine) {
    prompt += `## WRITING RULES

${writingEngine}

`;
  }

  if (openings || middles || endings) {
    if (openings) {
      prompt += `## OPENING PATTERNS\n${openings}\n\n`;
    }
    if (middles) {
      prompt += `## MIDDLE PATTERNS\n${middles}\n\n`;
    }
    if (endings) {
      prompt += `## ENDING PATTERNS\n${endings}\n\n`;
    }
  }

  if (guardrails) {
    prompt += `## GUARDRAILS\n${guardrails}\n\n`;
  }

  // Include supplementary context (extra files not matched to known roles)
  if (supplementary.length > 0) {
    prompt += `## SUPPLEMENTARY CONTEXT\n\n`;
    for (const file of supplementary) {
      prompt += `### ${file.filename}\n${file.content}\n\n`;
    }
  }

  if (personaFingerprint) {
    prompt += `## PERSONALITY DIMENSIONS (calibrate tone to these scores)

- Self-Deprecation: ${personaFingerprint.self_deprecation}/10
- Directness: ${personaFingerprint.directness}/10
- Warmth: ${personaFingerprint.warmth}/10
- Absurdism Tolerance: ${personaFingerprint.absurdism_tolerance}/10
- Vulnerability as Tool: ${personaFingerprint.vulnerability_as_tool}/10

`;
  }

  prompt += `## REWRITE RULES

- Apply the feedback instructions literally and precisely
- Keep the same topic and general structure
- Maintain approximately the same length (within 20%)`;

  if (hasCorpus) {
    prompt += `
- Stay in voice: apply ALWAYS patterns (parenthetical asides, double hyphens, self-deprecation, vocabulary whiplash)
- Avoid NEVER patterns (corporate jargon, em dashes, thought leader voice)
- The rewrite must still feel like content this person actually wrote`;
  } else {
    prompt += `
- Do NOT add generic corporate language`;
  }

  prompt += `
- Do NOT ignore any part of the feedback
- If the user provided a manual rewrite as a reference, use it as a guide for the tone and style they want -- but still produce a fresh version that incorporates ALL their feedback instructions

OUTPUT FORMAT (JSON):
{
  "regenerated_content": "The rewritten content...",
  "changes_made": ["Brief description of change 1", "Brief description of change 2"]
}`;

  return prompt;
}

function buildUserPrompt(request: RegenerateSampleRequest): string {
  const { sample, feedback, attempt_number } = request;

  let prompt = `Rewrite this ${sample.label} (${sample.topic}).

ORIGINAL CONTENT:
${sample.content}

USER FEEDBACK:`;

  if (feedback.whatDidntWork) {
    prompt += `\nWhat didn't work: ${feedback.whatDidntWork}`;
  }

  if (feedback.whatWouldHelp) {
    prompt += `\nWhat would help: ${feedback.whatWouldHelp}`;
  }

  if (feedback.editedContent && feedback.editedContent !== sample.content) {
    prompt += `\n\nREFERENCE REWRITE (use as a style/voice guide):
${feedback.editedContent}`;
  }

  if (attempt_number > 1) {
    prompt += `\n\nThis is attempt #${attempt_number}. The previous regeneration didn't fully satisfy the user. Pay extra attention to applying their feedback precisely.`;
  }

  prompt += '\n\nReturn valid JSON matching the format specified.';

  return prompt;
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: RegenerateSampleRequest = await request.json();
    const { session_id, sample, feedback, attempt_number } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!sample?.content) {
      return NextResponse.json(
        { error: 'sample with content is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!feedback?.whatDidntWork && !feedback?.whatWouldHelp) {
      return NextResponse.json(
        { error: 'At least one feedback field (whatDidntWork or whatWouldHelp) is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getHumanOSAdminClient();

    // Fetch session to get entity_slug and persona_fingerprint
    const { data: session } = await supabase
      .from('sculptor_sessions')
      .select('entity_slug, persona_fingerprint, metadata')
      .eq('id', session_id)
      .single();

    // Load voice context via discovery (graceful — works without it)
    let digest: string | null = null;
    let writingEngine: string | null = null;
    let openings: string | null = null;
    let middles: string | null = null;
    let endings: string | null = null;
    let guardrails: string | null = null;
    let supplementary: { filename: string; content: string }[] = [];
    let personaFingerprint: PersonaFingerprint | null = null;

    if (session?.entity_slug) {
      const pack = await loadVoicePack(supabase, session.entity_slug);

      digest = pack.digest;
      writingEngine = pack.byRole.writing_engine?.content ?? null;
      openings = pack.byRole.openings?.content ?? null;
      middles = pack.byRole.middles?.content ?? null;
      endings = pack.byRole.endings?.content ?? null;
      guardrails = pack.byRole.guardrails?.content ?? null;

      // Collect supplementary files (not matched to the roles we explicitly use)
      const usedRoles = new Set(['start_here', 'writing_engine', 'openings', 'middles', 'endings', 'guardrails']);
      supplementary = pack.files
        .filter(f => {
          const role = f.frontmatter.role as string | undefined;
          return !role || !usedRoles.has(role);
        })
        .map(f => ({ filename: f.filename, content: f.content }));
    }

    if (session) {
      personaFingerprint =
        session.persona_fingerprint || session.metadata?.persona_fingerprint || null;
    }

    const hasVoiceContext = !!(digest || writingEngine || personaFingerprint);

    console.log('[voice/regenerate-sample] Regenerating sample:', {
      session_id,
      sample_id: sample.id,
      sample_type: sample.type,
      attempt_number: attempt_number || 1,
      hasEditedContent: !!feedback.editedContent,
      hasVoiceContext,
      hasStructuralTemplates: !!(openings || middles || endings),
      hasGuardrails: !!guardrails,
      supplementaryFiles: supplementary.length,
    });

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const systemPrompt = buildSystemPrompt({
      digest,
      writingEngine,
      openings,
      middles,
      endings,
      guardrails,
      supplementary,
      personaFingerprint,
    });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250414',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: buildUserPrompt(body) },
      ],
    });

    const firstBlock = response.content[0];
    const responseText = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text.trim()
      : '';

    if (!responseText) {
      console.error('[voice/regenerate-sample] Empty response from LLM');
      return NextResponse.json(
        { error: 'Failed to regenerate sample' },
        { status: 500, headers: corsHeaders }
      );
    }

    let result: RegenerateSampleResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[voice/regenerate-sample] Failed to parse response:', parseError);
      console.error('[voice/regenerate-sample] Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse regenerated sample' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!result.regenerated_content) {
      return NextResponse.json(
        { error: 'No regenerated content in response' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('[voice/regenerate-sample] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
