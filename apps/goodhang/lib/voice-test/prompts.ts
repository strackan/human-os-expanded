/**
 * Voice Test Prompts Library
 *
 * System prompts for voice test content generation and commandments synthesis.
 * Uses VoicePack for discovery-based loading of all voice files.
 */

import type { VoicePack } from '@/lib/voice-pack';
import type { ContentType, ContentStyle, VoiceFeedback, GenerationAttempt } from './types';

// =============================================================================
// CONTENT GENERATION PROMPTS
// =============================================================================

export interface VoiceContext {
  tone?: string;
  style?: string;
  characteristics?: string[];
  examples?: string[];
  personaFingerprint?: {
    self_deprecation: number;
    directness: number;
    warmth: number;
    intellectual_signaling: number;
    comfort_with_sincerity: number;
    absurdism_tolerance: number;
    format_awareness: number;
    vulnerability_as_tool: number;
  };
}

export interface PreviousAttempt {
  content: string;
  rating: number;
  feedback: VoiceFeedback;
}

export function getGenerationSystemPrompt(
  contentType: ContentType,
  style: ContentStyle,
  voiceContext: VoiceContext,
  pack?: VoicePack | undefined,
): string {
  const styleGuidance = getStyleGuidance(contentType, style);
  const hasVoicePack = pack && (pack.digest || pack.files.length > 0);

  // When we have a voice pack, build a rich prompt from discovered files
  if (hasVoicePack) {
    return buildVoicePackPrompt(pack, styleGuidance, voiceContext);
  }

  // Fallback: metadata-only prompt (no voice files available)
  const voiceDescription = buildVoiceDescription(voiceContext);

  return `You are a skilled content writer who captures the authentic voice of the person you're writing for.

${voiceDescription}

${styleGuidance}

CRITICAL RULES:
1. Write EXACTLY as this person would write - not how they "should" write
2. Capture their actual vocabulary, sentence patterns, and quirks
3. Match their level of formality/informality
4. Use their characteristic phrases and expressions
5. Do NOT sanitize or professionalize their voice
6. Do NOT add corporate jargon unless they naturally use it
7. Match their typical post length and structure

OUTPUT:
- Return ONLY the content, no explanations or meta-commentary
- Do not include quotation marks around the content
- Do not say things like "Here's a post..." - just write the post`;
}

function buildVoicePackPrompt(
  pack: VoicePack,
  styleGuidance: string,
  voiceContext: VoiceContext,
): string {
  let prompt = `You are writing content as a specific person. You have their complete voice operating system below -- use it. Write EXACTLY as they would write.

${styleGuidance}

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

  // Organized by role -- same order as generate-samples for consistency
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

  // Persona fingerprint from session metadata (complements voice files)
  if (voiceContext.personaFingerprint) {
    const pf = voiceContext.personaFingerprint;
    prompt += `## PERSONALITY DIMENSIONS (0-10 scale — calibrate tone intensity)

- Self-Deprecation: ${pf.self_deprecation}/10
- Directness: ${pf.directness}/10
- Warmth: ${pf.warmth}/10
- Intellectual Signaling: ${pf.intellectual_signaling}/10
- Comfort with Sincerity: ${pf.comfort_with_sincerity}/10
- Absurdism Tolerance: ${pf.absurdism_tolerance}/10
- Format Awareness: ${pf.format_awareness}/10
- Vulnerability as Tool: ${pf.vulnerability_as_tool}/10

`;
  }

  // Flavor elements and transitions detection
  const writingEngine = pack.byRole.writing_engine;
  if (writingEngine) {
    const hasFlavorElements = writingEngine.content.includes('FLAVOR ELEMENTS') || writingEngine.content.includes('F1:');
    const hasTransitions = writingEngine.content.includes('TRANSITIONS') || writingEngine.content.includes('T1:');

    if (hasFlavorElements) {
      prompt += `## FLAVOR ELEMENTS
The WRITING_ENGINE contains flavor elements. Sprinkle these throughout:
- Self-deprecation style, parenthetical asides, vocabulary whiplash
- Strategic profanity for rhythm (not gratuitous)
- Spacing as pacing (visual rhythm on the page)

`;
    }

    if (hasTransitions) {
      prompt += `## TRANSITIONS
The WRITING_ENGINE contains transition types. Use these to glue sections:
- Pivot transitions ("But here's the thing...")
- Zoom transitions ("Let's get specific.")
- Parenthetical transitions ("(Quick tangent: ...)")

`;
    }
  }

  // Blend selection guidance
  if (pack.byRole.blends) {
    prompt += `## BLEND SELECTION
A blend recipe file is available above. Select a PROVEN blend recipe that matches the content type, or use an EXPERIMENTAL blend.

`;
  }

  prompt += `## CRITICAL RULES
- Write as this specific person would write -- not a generic professional
- Match their vocabulary, sentence rhythm, and personality dimensions
- Apply ALL "always" patterns from the writing rules
- Avoid ALL "never" patterns (no corporate jargon, no em dashes, no thought leader voice)
- Do NOT use em dashes -- use double hyphens (--) instead
- Use specific stories/anecdotes from the voice files when relevant
- Do NOT sanitize their voice or smooth out rough edges
- If flavor elements exist, deploy at least 2-3 per piece
- If blend recipes exist, select an appropriate blend

OUTPUT:
- Return ONLY the content, no explanations or meta-commentary
- Do not include quotation marks around the content
- Do not say things like "Here's a post..." - just write the post`;

  return prompt;
}

function buildVoiceDescription(voiceContext: VoiceContext): string {
  const parts: string[] = [];

  if (voiceContext.tone) {
    parts.push(`TONE: ${voiceContext.tone}`);
  }

  if (voiceContext.style) {
    parts.push(`STYLE: ${voiceContext.style}`);
  }

  if (voiceContext.characteristics && voiceContext.characteristics.length > 0) {
    parts.push(`CHARACTERISTICS:\n${voiceContext.characteristics.map(c => `- ${c}`).join('\n')}`);
  }

  if (voiceContext.examples && voiceContext.examples.length > 0) {
    parts.push(`EXAMPLE PHRASES/QUOTES FROM THIS PERSON:\n${voiceContext.examples.map(e => `- "${e}"`).join('\n')}`);
  }

  if (voiceContext.personaFingerprint) {
    const pf = voiceContext.personaFingerprint;
    parts.push(`PERSONA DIMENSIONS (0-10 scale):
- Self-deprecation: ${pf.self_deprecation} (${describeLevel(pf.self_deprecation, 'self-deprecating')})
- Directness: ${pf.directness} (${describeLevel(pf.directness, 'direct')})
- Warmth: ${pf.warmth} (${describeLevel(pf.warmth, 'warm')})
- Intellectual signaling: ${pf.intellectual_signaling} (${describeLevel(pf.intellectual_signaling, 'intellectual')})
- Comfort with sincerity: ${pf.comfort_with_sincerity} (${describeLevel(pf.comfort_with_sincerity, 'sincere')})
- Absurdism tolerance: ${pf.absurdism_tolerance} (${describeLevel(pf.absurdism_tolerance, 'absurdist')})
- Format awareness: ${pf.format_awareness} (${describeLevel(pf.format_awareness, 'format-conscious')})
- Vulnerability as tool: ${pf.vulnerability_as_tool} (${describeLevel(pf.vulnerability_as_tool, 'vulnerable')})`);
  }

  if (parts.length === 0) {
    return 'VOICE CONTEXT: Not yet established - write in a natural, conversational style.';
  }

  return `VOICE CONTEXT:\n${parts.join('\n\n')}`;
}

function describeLevel(value: number, trait: string): string {
  if (value <= 3) return `rarely ${trait}`;
  if (value <= 5) return `moderately ${trait}`;
  if (value <= 7) return `often ${trait}`;
  return `very ${trait}`;
}

function getStyleGuidance(contentType: ContentType, style: ContentStyle): string {
  const guides: Record<ContentType, Record<string, string>> = {
    linkedin_post: {
      salesy: `CONTENT TYPE: LinkedIn Post - Promotional/Salesy
GOAL: Promote a product, service, or offering while maintaining authenticity
STRUCTURE:
- Hook that grabs attention (question, bold statement, or story opener)
- Build interest with value or social proof
- Clear call-to-action
- Keep it punchy - LinkedIn favors scannable content
AVOID: Being overly corporate, generic buzzwords, feeling like an ad`,

      thought_leadership: `CONTENT TYPE: LinkedIn Post - Thought Leadership
GOAL: Share expertise, a hot take, or contrarian perspective
STRUCTURE:
- Lead with the insight or opinion
- Back it up with reasoning or experience
- Make it applicable/actionable for reader
- End with engagement hook (question or provocative statement)
AVOID: Being preachy, hedging too much, obvious takes`,

      introspective: `CONTENT TYPE: LinkedIn Post - Personal/Introspective
GOAL: Share a personal reflection, lesson learned, or vulnerable moment
STRUCTURE:
- Open with the moment or realization
- Share the context/story
- Extract the learning
- Connect to reader's potential experience
AVOID: Being performatively vulnerable, humble-bragging, making it a sermon`,
    },
    email: {
      professional: `CONTENT TYPE: Professional Email
GOAL: Clear, effective business communication
STRUCTURE:
- Clear subject line (include in your response)
- Brief context/purpose upfront
- Key information or ask
- Clear next steps
- Appropriate sign-off
TONE: Match their natural business voice, not forced formality`,

      casual: `CONTENT TYPE: Casual/Follow-up Email
GOAL: Maintain relationship, check in, or follow up naturally
STRUCTURE:
- Warm opener (reference to something specific)
- Purpose of reaching out
- Make it easy to respond
- Casual sign-off
TONE: Like texting a professional contact - warm but not sloppy`,
    },
    connection_request: {
      connection: `CONTENT TYPE: LinkedIn Connection Request
GOAL: Make a genuine connection, not a cold pitch
STRUCTURE:
- Reference something specific about them
- Why you want to connect (authentic reason)
- Keep it SHORT - max 300 characters ideally
AVOID: Pitching, being generic, "I'd love to add you to my network"`,
    },
    note: {
      meeting_prep: `CONTENT TYPE: Meeting Prep Notes
GOAL: Prepare for an effective meeting
STRUCTURE:
- Meeting objective/what success looks like
- Key topics to cover
- Questions to ask
- Any prep needed from others
TONE: Practical, actionable, can be informal`,
    },
  };

  return guides[contentType]?.[style] || 'Write naturally in this person\'s voice.';
}

export function getGenerationUserPrompt(
  userPrompt: string,
  previousAttempts: PreviousAttempt[]
): string {
  let prompt = `Write content based on this brief: ${userPrompt}`;

  if (previousAttempts.length > 0) {
    prompt += `\n\nPREVIOUS ATTEMPTS AND FEEDBACK:`;
    previousAttempts.forEach((attempt, index) => {
      prompt += `\n\n--- Attempt ${index + 1} (Rating: ${attempt.rating}/10) ---`;
      prompt += `\nContent: ${attempt.content}`;
      prompt += `\nFeedback:`;
      prompt += `\n- What didn't work: ${attempt.feedback.whatDidntWork}`;
      prompt += `\n- What a 10 looks like: ${attempt.feedback.whatTenLooksLike}`;
      prompt += `\n- Helpful instruction: ${attempt.feedback.helpfulInstruction}`;
    });
    prompt += `\n\nUSE THIS FEEDBACK to write a better version. Focus especially on what they said a "10 would look like".`;
  }

  return prompt;
}

// =============================================================================
// COMMANDMENTS GENERATION PROMPTS
// =============================================================================

export function getCommandmentsSystemPrompt(): string {
  return `You are an expert voice analyst who synthesizes feedback into clear, actionable writing guidelines.

Your task is to analyze voice test feedback and create the "10 Commandments" - definitive rules for writing in this person's voice.

OUTPUT FORMAT (JSON):
{
  "commandments": [
    {
      "number": 1,
      "title": "Short memorable title",
      "description": "Clear explanation of the rule",
      "examples": ["Example phrase or technique"],
      "contentTypes": ["linkedin_post", "email"]
    }
  ],
  "summary": "One paragraph summary of their voice"
}

COMMANDMENT CATEGORIES TO COVER:
1. WRITING_ENGINE - Decision tree (content type → approach), ALWAYS rules (5-10 voice patterns), NEVER rules (5-7 anti-patterns), vulnerability boundary (YES/NO/THE LINE)
2. SIGNATURE_MOVES - 3-5 unique techniques: name, structure, when to deploy (e.g. rabbit hole tangents, rug-pull endings, spacing as pacing)
3. OPENINGS - 4-6 opening patterns with labels (O1-O6), energy matches, "use for" contexts
4. MIDDLES - 4-7 middle patterns with labels (M1-M7), structural templates, pairing suggestions
5. ENDINGS - 4-6 ending patterns with labels (E1-E6), pairing suggestions
6. THEMES - Core beliefs with evidence quotes, frequency, anti-patterns
7. GUARDRAILS - YES/NO/THE LINE structure, sacred cows, hard NOs
8. STORIES - Key narratives with vulnerability level tags and use-case tags
9. ANECDOTES - Brief deployable examples with category tags
10. BLEND_HYPOTHESES - 3-5 content archetypes with O+M+E component combos

ANALYSIS APPROACH:
1. Highly rated content (9-10) → extract ALWAYS patterns, identify successful O+M+E combos
2. Feedback about what didn't work → extract NEVER patterns, identify failed blends
3. "What a 10 looks like" → signature moves, ideal blend descriptions
4. "Helpful instructions" → reveal preferences and structural patterns
5. Across content types → identify flavor elements (self-deprecation style, profanity patterns, parenthetical asides, vocabulary whiplash, spacing as pacing, etc.)

Be SPECIFIC and OPERATIONAL. Bad: "Be authentic". Good: "Open with a vulnerability pattern (O1) or provocative question (O5), never a generic greeting. Use double hyphens (--) not em dashes."`;
}

export function getCommandmentsUserPrompt(allAttempts: GenerationAttempt[]): string {
  const attemptsByType: Record<string, GenerationAttempt[]> = {};

  allAttempts.forEach(attempt => {
    if (!attemptsByType[attempt.contentTypeId]) {
      attemptsByType[attempt.contentTypeId] = [];
    }
    attemptsByType[attempt.contentTypeId]!.push(attempt);
  });

  let prompt = `Analyze these voice test results and generate the 10 Commandments:\n`;

  Object.entries(attemptsByType).forEach(([contentTypeId, attempts]) => {
    prompt += `\n\n=== ${contentTypeId.toUpperCase()} ===`;
    attempts.forEach((attempt, index) => {
      prompt += `\n\n--- Attempt ${index + 1} ---`;
      prompt += `\nPrompt: ${attempt.userPrompt}`;
      prompt += `\nGenerated: ${attempt.generatedContent}`;
      prompt += `\nRating: ${attempt.rating}/10`;
      if (attempt.feedback) {
        prompt += `\nFeedback:`;
        prompt += `\n  - What didn't work: ${attempt.feedback.whatDidntWork}`;
        prompt += `\n  - What a 10 looks like: ${attempt.feedback.whatTenLooksLike}`;
        prompt += `\n  - Helpful instruction: ${attempt.feedback.helpfulInstruction}`;
      }
    });
  });

  prompt += `\n\nSynthesize these results into the 10 Commandments. Focus on:
1. Patterns in what rated 9-10
2. Patterns in what they said a "10 looks like"
3. Explicit "never do this" from feedback
4. Patterns in helpful instructions

Return valid JSON matching the format specified.`;

  return prompt;
}

// =============================================================================
// TYPES (re-exported for convenience)
// =============================================================================

export type { ContentType, ContentStyle, VoiceFeedback, GenerationAttempt };
