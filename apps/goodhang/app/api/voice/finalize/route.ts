/**
 * POST /api/voice/finalize
 *
 * Tier 3 post-feedback synthesis: Takes voice calibration feedback and upgrades
 * DEV voice files to production quality. Also generates new files:
 * - RC versions of THEMES, GUARDRAILS, STORIES, ANECDOTES
 * - 09_BLENDS.md (blend hypotheses from voice test results)
 * - 00_START_HERE.md (master routing document)
 *
 * Called after voice calibration is complete (all 3 samples confirmed).
 * Uses loadVoicePack() for discovery-based loading, writes with frontmatter.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import {
  loadVoicePack,
  uploadStorageFile,
  buildFrontmatter,
  type VoicePack,
} from '@/lib/voice-pack';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface VoiceCalibrationSample {
  edited: boolean;
  originalContent: string;
  editedContent?: string;
  whatDidntWork?: string;
  whatWouldHelp?: string;
}

interface FinalizeRequest {
  session_id: string;
  voice_calibration_feedback: Record<string, VoiceCalibrationSample>;
}

// =============================================================================
// LLM CALLS
// =============================================================================

function formatFeedback(feedback: Record<string, VoiceCalibrationSample>): string {
  let result = '';
  for (const [sampleId, sample] of Object.entries(feedback)) {
    result += `### Sample: ${sampleId}\n`;
    result += `- Edited: ${sample.edited}\n`;
    if (sample.whatDidntWork) {
      result += `- What didn't work: ${sample.whatDidntWork}\n`;
    }
    if (sample.whatWouldHelp) {
      result += `- What would help: ${sample.whatWouldHelp}\n`;
    }
    if (sample.edited && sample.editedContent) {
      result += `- User's edited version:\n${sample.editedContent}\n`;
    }
    result += `- Original:\n${sample.originalContent}\n\n`;
  }
  return result;
}

async function generateRCFiles(
  anthropic: Anthropic,
  entityName: string,
  pack: VoicePack,
  feedback: Record<string, VoiceCalibrationSample>,
  personaFingerprint: Record<string, number> | null,
): Promise<{ themes: string; guardrails: string; stories: string; anecdotes: string }> {
  const feedbackText = formatFeedback(feedback);

  let context = '';
  if (pack.digest) context += `## DIGEST\n${pack.digest}\n\n`;
  if (pack.byRole.writing_engine) context += `## WRITING ENGINE\n${pack.byRole.writing_engine.content}\n\n`;
  if (pack.byRole.themes) context += `## CURRENT THEMES (DEV)\n${pack.byRole.themes.content}\n\n`;
  if (pack.byRole.guardrails) context += `## CURRENT GUARDRAILS (DEV)\n${pack.byRole.guardrails.content}\n\n`;
  if (pack.byRole.stories) context += `## CURRENT STORIES (DEV)\n${pack.byRole.stories.content}\n\n`;
  if (pack.byRole.anecdotes) context += `## CURRENT ANECDOTES (DEV)\n${pack.byRole.anecdotes.content}\n\n`;
  if (personaFingerprint) context += `## PERSONA FINGERPRINT\n${JSON.stringify(personaFingerprint, null, 2)}\n\n`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    system: `You are upgrading DEV voice files to RC (release candidate) quality by incorporating voice calibration feedback. The user tested voice samples and provided feedback on what worked and what didn't. Use this to refine the files into operational playbooks.

Output a JSON object with 4 keys: themes, guardrails, stories, anecdotes. Each value is a complete markdown document. Do NOT include frontmatter in the values -- it will be added programmatically.

Quality standard for each file:

**THEMES RC** -- Not just topic labels. Each theme needs:
- Core belief statement (what they'd defend)
- Evidence quotes from corpus/feedback that prove this theme
- Frequency indicator (how often this shows up)
- Anti-pattern (what the opposite of this theme sounds like -- to catch drift)

**GUARDRAILS RC** -- YES/NO/THE LINE structure:
- YES: Topics and tones that are safe/encouraged
- NO: Hard boundaries, things they'd never say or do publicly
- THE LINE: Where the boundary is -- "refer to the mess, don't be IN the mess"
- Sacred cows: Positions they'd never contradict

**STORIES RC** -- Full narrative excerpts ready to deploy:
- Each story with: title, the actual narrative text (2-4 sentences min), vulnerability level tag (low/medium/high), use-case tags (inspiration, credibility, humor, connection)
- Not just descriptions -- actual deployable story fragments

**ANECDOTES RC** -- Brief deployable examples with tags:
- Each anecdote: the actual example text (1-2 sentences), category tag, when to use
- These should be copy-paste ready, not descriptions of anecdotes`,
    messages: [{
      role: 'user',
      content: `Upgrade these DEV voice files to RC for ${entityName}.

${context}

## VOICE CALIBRATION FEEDBACK
${feedbackText}

---

Generate RC versions that incorporate the feedback. For each file:
- Refine content based on what worked/didn't in the voice samples
- If user edited a sample, use the edits as signal for voice preferences
- Make every entry operational and deployable -- not abstract descriptions

Return JSON with keys: themes, guardrails, stories, anecdotes`,
    }],
  });

  const firstBlock = response.content[0];
  const text = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in RC generation response');
  return JSON.parse(jsonMatch[0]);
}

async function generateBlends(
  anthropic: Anthropic,
  entityName: string,
  pack: VoicePack,
  feedback: Record<string, VoiceCalibrationSample>,
): Promise<string> {
  const feedbackText = formatFeedback(feedback);

  let context = '';
  if (pack.byRole.openings) context += `## OPENINGS\n${pack.byRole.openings.content}\n\n`;
  if (pack.byRole.middles) context += `## MIDDLES\n${pack.byRole.middles.content}\n\n`;
  if (pack.byRole.endings) context += `## ENDINGS\n${pack.byRole.endings.content}\n\n`;
  if (pack.byRole.writing_engine) context += `## WRITING ENGINE\n${pack.byRole.writing_engine.content}\n\n`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    system: `You are a voice blend architect. Given Opening/Middle/Ending patterns and voice calibration feedback, generate a BLENDS recipe file -- an operational playbook of proven and experimental template combinations.

Your output should read like a decision-support document: "Want high engagement? Use these blends. Want shares? Use these."

Do NOT include frontmatter (---/status/---) in your output. It will be added programmatically.`,
    messages: [{
      role: 'user',
      content: `Generate BLENDS content for ${entityName}.

${context}

## VOICE CALIBRATION FEEDBACK
${feedbackText}

---

Generate a markdown document with this structure:

# BLENDS: ${entityName}

## TOP 5 RECIPES

For each proven blend:
### N. [BLEND NAME] (e.g. "The Authentic Founder")
**Components:** O? (name) + M? (name) + E? (name)
**When to use:** [content types and scenarios]
**Energy match:** [melancholy/playful/punchy/reflective/etc.]
**Why it works:** [1-2 sentences on the structural logic]
**Estimated engagement:** [high comments / high shares / high saves]

## EXPERIMENTAL BLENDS (2-4)

For each:
### [BLEND NAME]
**Components:** O? + M? + E?
**Hypothesis:** [why this might work]
**Risk level:** [low/medium/high]
**Next test:** [suggested content topic to try it on]

## FAILED BLENDS (1-2)

For each:
### [BLEND NAME]
**Components:** O? + M? + E?
**Why it failed:** [what went wrong]
**Lesson:** [what to avoid next time]

## BLEND PERFORMANCE BY GOAL

**Want high engagement (comments)?** → [blend names]
**Want high reach (shares)?** → [blend names]
**Want relationship building?** → [blend names]
**Want thought leadership positioning?** → [blend names]

Return ONLY the markdown content (not JSON).`,
    }],
  });

  const firstBlock = response.content[0];
  return firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
}

async function generateStartHere(
  anthropic: Anthropic,
  entityName: string,
  pack: VoicePack,
): Promise<string> {
  // Build file list from discovered files
  let fileList = '';
  if (pack.digest) fileList += '- DIGEST.md: Identity, beliefs, voice patterns\n';
  for (const file of pack.files) {
    const role = file.frontmatter.role as string | undefined;
    if (role === 'start_here') continue; // Don't list START_HERE in its own file map
    fileList += `- ${file.filename}: ${role ?? 'supplementary context'}\n`;
  }

  let context = '';
  if (pack.digest) context += pack.digest.substring(0, 2000) + '\n\n';
  if (pack.byRole.writing_engine) context += pack.byRole.writing_engine.content.substring(0, 1500) + '\n\n';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: `You are generating the master routing document for an AI voice system. This is the FIRST file an AI reads before writing content as this person.

It must be a quick-reference card -- NOT a wall of text. Think cheat sheet, not manual. An AI agent should be able to scan this in 5 seconds and know exactly where to go.

The system works if the person says "Does this land right?" not "Use template C."

Do NOT include frontmatter (---/status/---) in your output. It will be added programmatically.`,
    messages: [{
      role: 'user',
      content: `Generate START_HERE content for ${entityName}.

## Available Files
${fileList}

## Key Context
${context}

---

Generate a markdown document with this structure:

# ${entityName.toUpperCase()} - OPERATING SYSTEM

**Quick Reference Card**

## The North Star
[Their core value in one line -- e.g. "Make Work Joyful"]

## Decision Routing
When writing content → Read 01_WRITING_ENGINE.md
When choosing structure → Read 06_OPENINGS + 07_MIDDLES + 08_ENDINGS
When stuck on a blend → Read 09_BLENDS.md
When checking boundaries → Read 03_GUARDRAILS.md
When needing a story → Read 04_STORIES.md + 05_ANECDOTES.md

## Top 3 ALWAYS Rules
[Extract from WRITING_ENGINE -- the 3 most critical voice patterns]

## Top 3 NEVER Rules
[Extract from WRITING_ENGINE -- the 3 most critical anti-patterns]

## File Map
[One-line description per file]

## System Check
System works if: [person] says "Does this land right?" not "Use template C"

Return ONLY the markdown content (not JSON).`,
    }],
  });

  const firstBlock = response.content[0];
  return firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: FinalizeRequest = await request.json();
    const { session_id, voice_calibration_feedback } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!voice_calibration_feedback || Object.keys(voice_calibration_feedback).length === 0) {
      return NextResponse.json(
        { error: 'voice_calibration_feedback is required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = getHumanOSAdminClient();

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('sculptor_sessions')
      .select('id, entity_slug, metadata, persona_fingerprint')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    const entitySlug = session.entity_slug;
    if (!entitySlug) {
      return NextResponse.json(
        { error: 'Session has no entity_slug' },
        { status: 400, headers: corsHeaders },
      );
    }

    const personaFingerprint =
      session.persona_fingerprint || session.metadata?.persona_fingerprint || null;

    console.log('[voice/finalize] Starting Tier 3 finalization for:', entitySlug);

    // Load all existing voice files via discovery
    const pack = await loadVoicePack(supabase, entitySlug);

    console.log('[voice/finalize] Voice pack loaded:', {
      totalFiles: pack.files.length,
      roles: Object.keys(pack.byRole),
      hasDigest: !!pack.digest,
    });

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    // Generate RC files, BLENDS, and START_HERE in parallel
    const [rcFiles, blendsBody, startHereBody] = await Promise.all([
      generateRCFiles(
        anthropic,
        session.metadata?.entity_name || entitySlug,
        pack,
        voice_calibration_feedback,
        personaFingerprint,
      ),
      generateBlends(
        anthropic,
        session.metadata?.entity_name || entitySlug,
        pack,
        voice_calibration_feedback,
      ),
      generateStartHere(
        anthropic,
        session.metadata?.entity_name || entitySlug,
        pack,
      ),
    ]);

    // Add frontmatter to generated content
    const prefix = `contexts/${entitySlug}/voice`;

    console.log('[voice/finalize] Uploading finalized files...');
    const uploadResults = await Promise.all([
      uploadStorageFile(supabase, `${prefix}/02_THEMES.md`,
        buildFrontmatter('rc', 'themes') + rcFiles.themes),
      uploadStorageFile(supabase, `${prefix}/03_GUARDRAILS.md`,
        buildFrontmatter('rc', 'guardrails') + rcFiles.guardrails),
      uploadStorageFile(supabase, `${prefix}/04_STORIES.md`,
        buildFrontmatter('rc', 'stories') + rcFiles.stories),
      uploadStorageFile(supabase, `${prefix}/05_ANECDOTES.md`,
        buildFrontmatter('rc', 'anecdotes') + rcFiles.anecdotes),
      uploadStorageFile(supabase, `${prefix}/09_BLENDS.md`,
        buildFrontmatter('prod', 'blends') + blendsBody),
      uploadStorageFile(supabase, `${prefix}/00_START_HERE.md`,
        buildFrontmatter('prod', 'start_here') + startHereBody),
    ]);

    const allUploaded = uploadResults.every(Boolean);
    const uploadedCount = uploadResults.filter(Boolean).length;

    console.log(`[voice/finalize] Uploaded ${uploadedCount}/${uploadResults.length} files`);

    // Update session metadata
    const { error: updateError } = await supabase
      .from('sculptor_sessions')
      .update({
        metadata: {
          ...session.metadata,
          voice_files_finalized: new Date().toISOString(),
          voice_files_count: uploadedCount + pack.files.length,
        },
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('[voice/finalize] Failed to update session metadata:', updateError);
    }

    // Invalidate cached voice samples so next generation uses new files
    await supabase.storage
      .from('human-os')
      .remove([`contexts/${entitySlug}/VOICE_SAMPLES.json`]);

    return NextResponse.json({
      status: allUploaded ? 'complete' : 'partial',
      files_uploaded: uploadedCount,
      files_total: uploadResults.length,
      entity_slug: entitySlug,
      finalized_at: new Date().toISOString(),
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[voice/finalize] Error:', error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500, headers: corsHeaders },
    );
  }
}
