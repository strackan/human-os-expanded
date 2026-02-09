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

    if (error || !data) return null;
    return await data.text();
  } catch {
    return null;
  }
}

async function uploadStorageFile(
  supabase: SupabaseClient,
  filePath: string,
  content: string,
): Promise<boolean> {
  try {
    const blob = new Blob([content], { type: 'text/markdown' });
    const { error } = await supabase.storage
      .from('human-os')
      .upload(filePath, blob, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (error) {
      console.error(`[voice/finalize] Upload error for ${filePath}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[voice/finalize] Upload exception for ${filePath}:`, err);
    return false;
  }
}

interface AllVoiceFiles {
  // Tier 1
  digest: string | null;
  writingEngine: string | null;
  openings: string | null;
  middles: string | null;
  endings: string | null;
  examples: string | null;
  // Tier 2 DEV
  themes: string | null;
  guardrails: string | null;
  stories: string | null;
  anecdotes: string | null;
  context: string | null;
}

async function loadAllVoiceFiles(
  supabase: SupabaseClient,
  entitySlug: string,
): Promise<AllVoiceFiles> {
  const [
    digest, writingEngine, openings, middles, endings, examples,
    themes, guardrails, stories, anecdotes, context,
  ] = await Promise.all([
    loadStorageFile(supabase, `contexts/${entitySlug}/DIGEST.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/01_WRITING_ENGINE.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/06_OPENINGS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/07_MIDDLES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/08_ENDINGS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/10_EXAMPLES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/02_THEMES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/03_GUARDRAILS.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/04_STORIES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/05_ANECDOTES.md`),
    loadStorageFile(supabase, `contexts/${entitySlug}/voice/CONTEXT.md`),
  ]);

  return {
    digest, writingEngine, openings, middles, endings, examples,
    themes, guardrails, stories, anecdotes, context,
  };
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
  voiceFiles: AllVoiceFiles,
  feedback: Record<string, VoiceCalibrationSample>,
  personaFingerprint: Record<string, number> | null,
): Promise<{ themes: string; guardrails: string; stories: string; anecdotes: string }> {
  const feedbackText = formatFeedback(feedback);

  let context = '';
  if (voiceFiles.digest) context += `## DIGEST\n${voiceFiles.digest}\n\n`;
  if (voiceFiles.writingEngine) context += `## WRITING ENGINE\n${voiceFiles.writingEngine}\n\n`;
  if (voiceFiles.themes) context += `## CURRENT THEMES (DEV)\n${voiceFiles.themes}\n\n`;
  if (voiceFiles.guardrails) context += `## CURRENT GUARDRAILS (DEV)\n${voiceFiles.guardrails}\n\n`;
  if (voiceFiles.stories) context += `## CURRENT STORIES (DEV)\n${voiceFiles.stories}\n\n`;
  if (voiceFiles.anecdotes) context += `## CURRENT ANECDOTES (DEV)\n${voiceFiles.anecdotes}\n\n`;
  if (personaFingerprint) context += `## PERSONA FINGERPRINT\n${JSON.stringify(personaFingerprint, null, 2)}\n\n`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    system: `You are upgrading DEV voice files to RC (release candidate) quality by incorporating voice calibration feedback. The user tested voice samples and provided feedback on what worked and what didn't. Use this to refine the files into operational playbooks.

Output a JSON object with 4 keys: themes, guardrails, stories, anecdotes. Each value is a complete markdown document with status: "rc" in the frontmatter.

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
- Replace status: "dev" with status: "rc"
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
  voiceFiles: AllVoiceFiles,
  feedback: Record<string, VoiceCalibrationSample>,
): Promise<string> {
  const feedbackText = formatFeedback(feedback);

  let context = '';
  if (voiceFiles.openings) context += `## OPENINGS\n${voiceFiles.openings}\n\n`;
  if (voiceFiles.middles) context += `## MIDDLES\n${voiceFiles.middles}\n\n`;
  if (voiceFiles.endings) context += `## ENDINGS\n${voiceFiles.endings}\n\n`;
  if (voiceFiles.writingEngine) context += `## WRITING ENGINE\n${voiceFiles.writingEngine}\n\n`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    system: `You are a voice blend architect. Given Opening/Middle/Ending patterns and voice calibration feedback, generate a BLENDS recipe file -- an operational playbook of proven and experimental template combinations.

Your output should read like a decision-support document: "Want high engagement? Use these blends. Want shares? Use these."`,
    messages: [{
      role: 'user',
      content: `Generate 09_BLENDS.md for ${entityName}.

${context}

## VOICE CALIBRATION FEEDBACK
${feedbackText}

---

Generate a markdown document with this exact structure:

\`\`\`
---
status: "prod"
---
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
\`\`\`

Return ONLY the markdown content (not JSON).`,
    }],
  });

  const firstBlock = response.content[0];
  return firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
}

async function generateStartHere(
  anthropic: Anthropic,
  entityName: string,
  voiceFiles: AllVoiceFiles,
): Promise<string> {
  let fileList = '';
  if (voiceFiles.digest) fileList += '- DIGEST.md: Identity, beliefs, voice patterns\n';
  if (voiceFiles.writingEngine) fileList += '- 01_WRITING_ENGINE.md: Decision tree, ALWAYS/NEVER rules\n';
  if (voiceFiles.openings) fileList += '- 06_OPENINGS.md: Opening patterns (O1-O6+)\n';
  if (voiceFiles.middles) fileList += '- 07_MIDDLES.md: Middle patterns (M1-M7+)\n';
  if (voiceFiles.endings) fileList += '- 08_ENDINGS.md: Ending patterns (E1-E6+)\n';
  if (voiceFiles.examples) fileList += '- 10_EXAMPLES.md: Annotated corpus samples\n';

  let context = '';
  if (voiceFiles.digest) context += voiceFiles.digest.substring(0, 2000) + '\n\n';
  if (voiceFiles.writingEngine) context += voiceFiles.writingEngine.substring(0, 1500) + '\n\n';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: `You are generating the master routing document for an AI voice system. This is the FIRST file an AI reads before writing content as this person.

It must be a quick-reference card -- NOT a wall of text. Think cheat sheet, not manual. An AI agent should be able to scan this in 5 seconds and know exactly where to go.

The system works if the person says "Does this land right?" not "Use template C."`,
    messages: [{
      role: 'user',
      content: `Generate 00_START_HERE.md for ${entityName}.

## Available Files
${fileList}
- 02_THEMES.md: Core beliefs with evidence, frequency, anti-patterns
- 03_GUARDRAILS.md: YES/NO/THE LINE structure, hard NOs
- 04_STORIES.md: Deployable narrative fragments with vulnerability tags
- 05_ANECDOTES.md: Brief examples with use-case tags
- 09_BLENDS.md: Proven O+M+E combinations with performance data
- CONTEXT.md: Day-to-day quick reference

## Key Context
${context}

---

Generate a markdown document with this structure:

\`\`\`
---
status: "prod"
---
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
\`\`\`

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

    // Load all existing voice files
    const voiceFiles = await loadAllVoiceFiles(supabase, entitySlug);

    const loadedCount = Object.values(voiceFiles).filter(Boolean).length;
    console.log('[voice/finalize] Loaded voice files:', loadedCount);

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    // Generate RC files, BLENDS, and START_HERE in parallel
    const [rcFiles, blendsContent, startHereContent] = await Promise.all([
      generateRCFiles(
        anthropic,
        session.metadata?.entity_name || entitySlug,
        voiceFiles,
        voice_calibration_feedback,
        personaFingerprint,
      ),
      generateBlends(
        anthropic,
        session.metadata?.entity_name || entitySlug,
        voiceFiles,
        voice_calibration_feedback,
      ),
      generateStartHere(
        anthropic,
        session.metadata?.entity_name || entitySlug,
        voiceFiles,
      ),
    ]);

    // Upload all finalized files
    console.log('[voice/finalize] Uploading finalized files...');
    const uploadResults = await Promise.all([
      uploadStorageFile(supabase, `contexts/${entitySlug}/voice/02_THEMES.md`, rcFiles.themes),
      uploadStorageFile(supabase, `contexts/${entitySlug}/voice/03_GUARDRAILS.md`, rcFiles.guardrails),
      uploadStorageFile(supabase, `contexts/${entitySlug}/voice/04_STORIES.md`, rcFiles.stories),
      uploadStorageFile(supabase, `contexts/${entitySlug}/voice/05_ANECDOTES.md`, rcFiles.anecdotes),
      uploadStorageFile(supabase, `contexts/${entitySlug}/voice/09_BLENDS.md`, blendsContent),
      uploadStorageFile(supabase, `contexts/${entitySlug}/voice/00_START_HERE.md`, startHereContent),
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
          voice_files_count: uploadedCount + loadedCount,
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
