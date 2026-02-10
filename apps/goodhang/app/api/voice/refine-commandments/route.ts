/**
 * POST /api/voice/refine-commandments
 *
 * Refine Voice OS Ten Commandments based on calibration feedback.
 * Takes the existing commandments and the feedback from content sample edits,
 * and adjusts the commandments to better match the user's authentic voice.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import type { VoiceOsExtractionResult } from '@/lib/assessment/types';
import { VoiceRefineCommandmentsSchema } from '@/lib/voice/schemas';
import { extractAndValidate } from '@/lib/shared/llm-json';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// CORS headers for desktop app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface SampleFeedback {
  edited: boolean;
  originalContent: string;
  editedContent: string;
  whatDidntWork: string;
  whatWouldHelp: string;
}

interface RefineCommandmentsRequest {
  session_id: string;
  voice_os: VoiceOsExtractionResult;
  sample_feedback: Record<string, SampleFeedback>;
}

interface RefineCommandmentsResponse {
  refined_voice_os: VoiceOsExtractionResult;
  adjustments_made: string[];
}

// System prompt for refining Voice OS commandments
const REFINE_SYSTEM_PROMPT = `You are refining Voice OS commandments based on user feedback from content calibration samples.

The user reviewed 3 generated content samples (thought leadership post, personal story post, connection request) and provided feedback on what felt off and what instructions would have helped.

Your job is to ADJUST the existing Voice OS commandments to better capture their authentic voice. Do NOT completely rewrite - make targeted refinements based on the specific feedback.

## Input

1. Current Voice OS Commandments (10 sections)
2. Feedback for each sample:
   - Whether they edited it
   - Original vs edited content (if edited)
   - What didn't quite work / felt off
   - What instruction would have prevented the issue

## Output

Return a JSON object with:
1. refined_voice_os: The updated Voice OS commandments (same structure)
2. adjustments_made: Array of 3-5 specific changes you made based on the feedback

## Refinement Guidelines

1. **Be surgical** - Only change what the feedback indicates. Preserve what worked.
2. **Add specifics** - If feedback says "too formal", add specific patterns to avoid/use
3. **Use their words** - If they edited content, note the vocabulary/style they prefer
4. **Pattern recognition** - Look for themes across all 3 samples
5. **Commandment priority** - Focus on WRITING_ENGINE, SIGNATURE_MOVES, and GUARDRAILS sections most

## Example Adjustments

Feedback: "Too formal, missing my usual humor"
→ Add to writing_engine.always_rules: "Use casual humor and self-deprecation"
→ Add to guardrails.no: "Overly formal or stiff professional language"

Feedback: "Needs shorter sentences"
→ Update writing_engine.always_rules: "Keep sentences punchy - average 8-12 words"

Feedback: "Missing my signature sign-off"
→ Add to endings: new pattern with their specific closing style`;

function buildRefinePrompt(
  currentVoiceOs: VoiceOsExtractionResult,
  sampleFeedback: Record<string, SampleFeedback>
): string {
  let feedbackSection = '';

  for (const [sampleId, feedback] of Object.entries(sampleFeedback)) {
    feedbackSection += `
### ${sampleId.replace('_', ' ').toUpperCase()}

**Edited:** ${feedback.edited ? 'Yes' : 'No'}
`;

    if (feedback.edited) {
      feedbackSection += `
**Original Content:**
${feedback.originalContent}

**User's Edited Version:**
${feedback.editedContent}
`;
    }

    if (feedback.whatDidntWork) {
      feedbackSection += `
**What Didn't Work / Felt Off:**
${feedback.whatDidntWork}
`;
    }

    if (feedback.whatWouldHelp) {
      feedbackSection += `
**Instruction That Would Have Helped:**
${feedback.whatWouldHelp}
`;
    }

    feedbackSection += '\n---\n';
  }

  return `${REFINE_SYSTEM_PROMPT}

---

# Current Voice OS Commandments

\`\`\`json
${JSON.stringify(currentVoiceOs, null, 2)}
\`\`\`

---

# Calibration Feedback

${feedbackSection}

---

# Your Task

Analyze the feedback and refine the Voice OS commandments accordingly.

1. Identify patterns in the feedback (what consistently felt off)
2. Make targeted adjustments to relevant commandment sections
3. Preserve everything that wasn't flagged as problematic
4. Document the specific changes you made

Return valid JSON with this structure:
{
  "refined_voice_os": { ... },
  "adjustments_made": ["specific change 1", "specific change 2", ...]
}

Return ONLY the JSON, no additional text.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefineCommandmentsRequest = await request.json();
    const { session_id, voice_os, sample_feedback } = body;

    if (!session_id || !voice_os) {
      return NextResponse.json(
        { error: 'session_id and voice_os are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if any feedback was actually provided
    const hasFeedback = Object.values(sample_feedback || {}).some(
      f => f.edited || f.whatDidntWork || f.whatWouldHelp
    );

    if (!hasFeedback) {
      // No feedback provided - return original commandments unchanged
      console.log('[voice/refine-commandments] No feedback provided, returning original');
      return NextResponse.json(
        {
          refined_voice_os: voice_os,
          adjustments_made: [],
        } as RefineCommandmentsResponse,
        { headers: corsHeaders }
      );
    }

    console.log('[voice/refine-commandments] Refining commandments for session:', session_id);

    // Generate refined commandments using Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        { role: 'user', content: buildRefinePrompt(voice_os, sample_feedback) }
      ],
    });

    // Extract content from response
    const firstBlock = response.content[0];
    const responseText = firstBlock && firstBlock.type === 'text'
      ? firstBlock.text.trim()
      : '';

    if (!responseText) {
      console.error('[voice/refine-commandments] Empty response from LLM');
      return NextResponse.json(
        { error: 'Failed to refine commandments' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse and validate JSON response
    const validated = extractAndValidate(responseText, VoiceRefineCommandmentsSchema);
    let result: RefineCommandmentsResponse;
    if (!validated.success) {
      console.error('[voice/refine-commandments] Zod validation failed, falling back to manual parse:', validated.error);
      // Fallback to manual extraction for resilience
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        result = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('[voice/refine-commandments] Manual parse also failed:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse refined commandments' },
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      result = validated.data as unknown as RefineCommandmentsResponse;
    }

    // Update session with refined Voice OS (optional - for persistence)
    try {
      const supabase = getHumanOSAdminClient();
      await supabase
        .from('sculptor_sessions')
        .update({
          metadata: {
            voice_os_refined: result.refined_voice_os,
            voice_calibration_feedback: sample_feedback,
            voice_calibration_adjustments: result.adjustments_made,
          }
        })
        .eq('id', session_id);
    } catch (dbError) {
      console.error('[voice/refine-commandments] Failed to persist to DB:', dbError);
      // Don't fail the request - return the result anyway
    }

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error('[voice/refine-commandments] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
