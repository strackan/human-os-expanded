/**
 * Unified Synthesis Prompt
 *
 * Combines ALL sources (Sculptor, FOS Interview, Question E, Voice Calibration)
 * to generate the complete 20 Commandments + Executive Report in a single LLM call.
 */

import type {
  ExecutiveReport,
  CharacterProfile,
  FounderOsExtractionResult,
  VoiceOsExtractionResult,
  Attributes,
  AssessmentSignals,
  MatchingProfile,
} from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface SynthesisInput {
  // Session context
  session_id: string;
  user_id: string;
  entity_slug: string;

  // Collected data from thick client
  fos_interview_answers: Record<string, string>; // a1-c5 (12 questions)
  question_e_answers: Record<string, string>; // E01-E24 (0-24 questions)
  voice_calibration_feedback: Record<
    string,
    {
      edited: boolean;
      originalContent: string;
      editedContent?: string;
      whatDidntWork?: string;
      whatWouldHelp?: string;
    }
  >;

  // Pre-existing data from Sculptor pipeline
  sculptor_transcript?: string; // Full conversation from Sculptor session
  corpus_summary?: string; // CORPUS_SUMMARY.md content
  gap_analysis?: string; // GAP_ANALYSIS.md content (pre-sculptor)
  gap_analysis_final?: string; // GAP_ANALYSIS_FINAL.md content (post-sculptor)
  persona_fingerprint?: PersonaFingerprint; // 8-dimension voice calibration

  // Optional: existing commandments to refine rather than regenerate
  existing_founder_os?: FounderOsExtractionResult;
  existing_voice_os?: VoiceOsExtractionResult;
}

export interface PersonaFingerprint {
  self_deprecation: number; // 0-10
  directness: number;
  warmth: number;
  intellectual_signaling: number;
  comfort_with_sincerity: number;
  absurdism_tolerance: number;
  format_awareness: number;
  vulnerability_as_tool: number;
}

export interface SynthesisOutput {
  executive_report: ExecutiveReport;
  character_profile: CharacterProfile;
  attributes: Attributes;
  signals: AssessmentSignals;
  matching: MatchingProfile;
  founder_os: FounderOsExtractionResult;
  voice_os: VoiceOsExtractionResult;
  summary: string;
}

// =============================================================================
// PROMPT BUILDER
// =============================================================================

export const SYNTHESIS_SYSTEM_PROMPT = `You are synthesizing a comprehensive profile from multiple sources to create the complete Human OS for a founder.

Your task is to generate:
1. **Executive Report** - Status summary, personality traits, voice profile
2. **Character Profile** - D&D-style character (alignment, race, class, attributes)
3. **Founder OS** - 10 commandments for AI Chief of Staff support
4. **Voice OS** - 10 commandments for AI content generation in their voice

## Source Priority (Most → Least Weight)
1. **FOS Interview Answers** (a1-c5) - Direct recent answers, highest signal
2. **Question E Answers** (E01-E24) - Personality baseline, high signal
3. **Voice Calibration Feedback** - What worked/didn't in content samples
4. **Sculptor Transcript** - Rich conversational data, corrections, stories
5. **Corpus Summary** - Background from LinkedIn, writing samples
6. **Gap Analysis** - System understanding of knowledge gaps

## Output Sections

### Executive Report (Personal Assessment)
This is the foundational document that introduces who this person is. It should read like a briefing document for anyone who needs to understand and work with them effectively.

\`\`\`typescript
{
  // Basic identity
  name: string; // Their name (from entity_slug or inferred from content)
  tagline: string; // 1-liner that captures their essence, e.g., "Resilient builder who turns setbacks into fuel"

  // Overall personality (2-3 paragraphs)
  summary: string; // Comprehensive personality overview - who they are, what drives them, how they show up

  // Strengths (what they're great at)
  strengths: Array<{
    strength: string; // e.g., "Resilience under pressure"
    description: string; // How this shows up, with examples from their answers
  }>; // 4-6 core strengths

  // Challenges (areas that can be difficult)
  challenges: Array<{
    challenge: string; // e.g., "Decision paralysis when overwhelmed"
    description: string; // How this manifests, what triggers it
    coping: string; // How they overcome or manage this challenge
  }>; // 3-5 key challenges with coping strategies

  // Work style
  workStyle: {
    approach: string; // e.g., "Sprint-based intensity with recovery cycles"
    optimalConditions: string[]; // 3-4 conditions when they do their best work
  };

  // Communication style
  communication: {
    style: string; // e.g., "Direct, warm, and no-BS"
    preferences: string[]; // 3-5 key preferences for how to interact with them
  };

  // Key insights (the most important things to know)
  keyInsights: string[]; // 4-6 crucial insights about this person

  // Voice profile (how they communicate)
  voice: {
    tone: string; // Overall tone
    style: string; // Writing/speaking style
    characteristics: string[]; // 3-5 distinctive characteristics
  };
}
\`\`\`

### Character Profile (D&D Style)
\`\`\`typescript
{
  tagline: string; // 1-liner character description
  alignment: 'Lawful Good' | 'Neutral Good' | 'Chaotic Good' | 'Lawful Neutral' | 'True Neutral' | 'Chaotic Neutral' | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil';
  race: 'Elven' | 'Half-Orc' | 'Tiefling' | 'Dwarven' | 'Human' | 'Halfling';
  class: 'Paladin' | 'Wizard' | 'Bard' | 'Rogue' | 'Ranger' | 'Sorcerer' | 'Artificer' | 'Barbarian' | 'Cleric';
}
\`\`\`

### Attributes (1-10 scale)
- INT: Curiosity, learning, depth of thought
- WIS: Self-awareness, emotional intelligence
- CHA: Social energy, presence
- CON: Consistency, follow-through, routine
- STR: Assertiveness, drive, confrontation comfort
- DEX: Adaptability, spontaneity, flexibility

### Founder OS 10 Commandments
Each commandment should be **100-200 words** - a full paragraph with specific, actionable guidance. Include concrete examples from their answers when possible. Write in second person ("You prefer...", "When you're overwhelmed...").

1. **CURRENT_STATE** - Who they are at their core right now. Core identity markers, what's most important to them, current priorities and energy state. What defines them when everything else is stripped away.

2. **STRATEGIC_THOUGHT_PARTNER** - How to help them think through decisions. Their decision-making frameworks, how they've navigated pivotal moments, strengths revealed through transitions, blind spots that need support.

3. **DECISION_MAKING** - Their decision style under pressure. What triggers paralysis, how they prefer to be supported during decisions, high-stakes vs low-stakes approach differences.

4. **ENERGY_PATTERNS** - What energizes vs drains them. Optimal conditions for focus, energy recovery patterns, warning signs of depletion, physical/health factors that affect energy.

5. **AVOIDANCE_PATTERNS** - What "stuck" looks like for them. Common avoidance behaviors, procrastination triggers, how to recognize when they're avoiding something important.

6. **RECOVERY_PROTOCOLS** - How they reset and restore. What actually helps (not performative wellness), recovery timeline patterns, whether they need support or space.

7. **ACCOUNTABILITY_FRAMEWORK** - How they prefer to be held accountable. What kind of check-ins work, how to push back without triggering defensiveness, deadline relationship.

8. **EMOTIONAL_SUPPORT** - What they need emotionally but rarely ask for. Boundaries around emotional topics, how to provide support without being patronizing.

9. **WORK_STYLE** - How to support their work effectively. Priority presentation preferences, autonomy vs guidance balance, collaboration preferences, optimal meeting/communication cadence.

10. **CONVERSATION_PROTOCOLS** - How to communicate with them. Preferred tone and length, what energy modes look like (high/low), red flags that shut down communication, topics to navigate carefully.

### Voice OS 10 Commandments
Each commandment should be **100-200 words** - a full paragraph with specific, operational patterns and examples. Quote their actual language when possible. Write as guidance for an AI generating content in their voice. These should be playbook-quality -- concrete enough that an AI system can follow them mechanically.

1. **WRITING_ENGINE** - The decision tree and rules. When they're asked to write: content type → recommended blend/approach. ALWAYS rules (5-10 voice patterns they consistently use -- e.g. parenthetical asides, double hyphens, specific vocabulary). NEVER rules (5-7 anti-patterns -- e.g. corporate jargon, em dashes, thought leader voice). Vulnerability boundary: YES (what they'll allude to), NO (what's off-limits), THE LINE (where the boundary sits).

2. **SIGNATURE_MOVES** - 3-5 unique techniques that make their voice distinctive. For each: name it, describe the structure, when to deploy it. Examples: rabbit hole tangents (gateway word → shocking backstory → callback), rug-pull endings (build serious → subvert), spacing as pacing (visual rhythm on the page), vocabulary whiplash (high register → low in same sentence).

3. **OPENINGS** - 4-6 opening patterns extracted from how they actually start content. For each: label (e.g. O1: VULNERABILITY), description, energy match (melancholy/playful/punchy/etc.), "use for" contexts. Include 1-2 real examples from their answers or corpus.

4. **MIDDLES** - 4-7 middle/body patterns. For each: label (e.g. M1: STORY ARC), description, structural template (e.g. "Setup → Conflict → Turn → Resolution"), "pairs with" which openers. Not just abstract categories -- operational templates.

5. **ENDINGS** - 4-6 ending patterns. For each: label (e.g. E1: OPEN QUESTION), description, "pairs with" which O+M combinations, "use for" (engagement/depth/action/etc.).

6. **THEMES** - Core beliefs with evidence. For each theme: what they'd defend, evidence quotes, how frequently it appears, anti-pattern (what the opposite sounds like). Not just topic labels -- positions with proof.

7. **GUARDRAILS** - YES/NO/THE LINE structure. YES: topics and tones that are safe/encouraged. NO: hard boundaries, things they'd never say publicly. THE LINE: where the boundary sits (e.g. "refer to the mess, don't be IN the mess while writing"). Sacred cows they'd never contradict.

8. **STORIES** - Key narratives ready to deploy. For each: the actual story fragment (2-4 sentences minimum, not just a description), vulnerability level tag (low/medium/high), use-case tags (inspiration, credibility, humor, connection).

9. **ANECDOTES** - Brief deployable examples. For each: the actual example text (1-2 sentences, copy-paste ready), category tag, when to use. These are the proof points and illustrations they reach for.

10. **BLEND_HYPOTHESES** - 3-5 content archetypes with recommended O+M+E component combinations. For each: name (e.g. "The Authentic Founder"), components (O1+M1+E2), "when to use", "why it works" (1 sentence on structural logic).

## Output Format

Return a single JSON object with all sections. Use the exact structure below:

\`\`\`json
{
  "executive_report": {
    "name": "Their name",
    "tagline": "1-liner that captures their essence",
    "summary": "2-3 paragraph comprehensive personality overview...",
    "strengths": [
      { "strength": "Resilience", "description": "How this shows up with examples..." },
      { "strength": "Direct communication", "description": "..." }
    ],
    "challenges": [
      { "challenge": "Decision paralysis", "description": "How it manifests...", "coping": "How they overcome it..." }
    ],
    "workStyle": {
      "approach": "Sprint-based intensity with recovery cycles",
      "optimalConditions": ["condition 1", "condition 2"]
    },
    "communication": {
      "style": "Direct, warm, and no-BS",
      "preferences": ["preference 1", "preference 2"]
    },
    "keyInsights": ["insight 1", "insight 2", "insight 3"],
    "voice": {
      "tone": "...",
      "style": "...",
      "characteristics": ["..."]
    }
  },
  "character_profile": {
    "tagline": "...",
    "alignment": "...",
    "race": "...",
    "class": "..."
  },
  "attributes": {
    "INT": 7, "WIS": 8, "CHA": 6, "CON": 5, "STR": 7, "DEX": 6
  },
  "signals": {
    "enneagram_hint": "...",
    "interest_vectors": ["..."],
    "social_energy": "...",
    "relationship_style": "..."
  },
  "matching": {
    "ideal_group_size": "...",
    "connection_style": "...",
    "energy_pattern": "...",
    "good_match_with": ["..."],
    "avoid_match_with": ["..."]
  },
  "founder_os": {
    "commandments": {
      "CURRENT_STATE": "100-200 word paragraph about who they are at their core...",
      "STRATEGIC_THOUGHT_PARTNER": "100-200 word paragraph about how to help them think through decisions...",
      "DECISION_MAKING": "100-200 word paragraph about their decision style under pressure...",
      "ENERGY_PATTERNS": "100-200 word paragraph about what energizes vs drains them...",
      "AVOIDANCE_PATTERNS": "100-200 word paragraph about what stuck looks like for them...",
      "RECOVERY_PROTOCOLS": "100-200 word paragraph about how they reset and restore...",
      "ACCOUNTABILITY_FRAMEWORK": "100-200 word paragraph about how they prefer accountability...",
      "EMOTIONAL_SUPPORT": "100-200 word paragraph about emotional needs and boundaries...",
      "WORK_STYLE": "100-200 word paragraph about how to support their work...",
      "CONVERSATION_PROTOCOLS": "100-200 word paragraph about how to communicate with them..."
    },
    "summary": { "core_identity": "...", "support_philosophy": "...", "key_insight": "..." }
  },
  "voice_os": {
    "commandments": {
      "WRITING_ENGINE": "100-200 word paragraph: decision tree, ALWAYS rules, NEVER rules, vulnerability boundary...",
      "SIGNATURE_MOVES": "100-200 word paragraph: 3-5 unique techniques with structure and when-to-use...",
      "OPENINGS": "100-200 word paragraph: 4-6 opening patterns with labels, examples, energy matches...",
      "MIDDLES": "100-200 word paragraph: 4-7 middle patterns with labels, structural templates, pairing suggestions...",
      "ENDINGS": "100-200 word paragraph: 4-6 ending patterns with labels, pairing suggestions...",
      "THEMES": "100-200 word paragraph: core beliefs with evidence, frequency, anti-patterns...",
      "GUARDRAILS": "100-200 word paragraph: YES/NO/THE LINE structure, sacred cows, hard NOs...",
      "STORIES": "100-200 word paragraph: key narratives with vulnerability tags, use-case tags...",
      "ANECDOTES": "100-200 word paragraph: brief deployable examples with category tags...",
      "BLEND_HYPOTHESES": "100-200 word paragraph: 3-5 content archetypes with O+M+E combos..."
    },
    "summary": { "voice_essence": "...", "signature_moves": ["..."], "generation_guidance": "..." }
  },
  "summary": "300-500 word personality summary..."
}
\`\`\`

## Important Notes

1. **NEW DATA OVERRIDES OLD** - FOS Interview and Question E answers are the TRUTH. If they contradict corpus or Sculptor assumptions, the new answers win. The person just told you directly - believe them.
2. **Be specific** - Use concrete examples and language from their actual answers, not generic descriptions
3. **Cross-reference** - Connect insights across sources, but always anchor to the interview answers
4. **Corpus is background** - Use corpus for context only. It's public-facing, often sanitized. Private interview answers reveal the real person.
5. **Sculptor corrections matter** - If Sculptor transcript corrects corpus assumptions, use corrections
6. **Voice feedback is gold** - Their edits and "what didn't work" comments are direct calibration signals
7. **COMMANDMENTS MUST BE SUBSTANTIAL** - Each commandment should be 100-200 words, a full paragraph with specific guidance. Not bullet points or brief phrases - write complete, actionable paragraphs that an AI could follow.
8. **Quote their language** - Use their actual words and phrases when possible. If they said "I need people to just listen, not fix", quote that.
9. **Write in second person** - Address the person directly: "You prefer...", "When you're overwhelmed...", "Your communication style is..."`;

/**
 * Build the full synthesis prompt with all sources
 */
export function buildSynthesisPrompt(input: SynthesisInput): string {
  const sections: string[] = [];

  // Section 1: FOS Interview Answers (always present, highest priority)
  sections.push(formatFosInterviewAnswers(input.fos_interview_answers));

  // Section 2: Question E Answers (may be empty)
  if (input.question_e_answers && Object.keys(input.question_e_answers).length > 0) {
    sections.push(formatQuestionEAnswers(input.question_e_answers));
  }

  // Section 3: Voice Calibration Feedback
  if (input.voice_calibration_feedback && Object.keys(input.voice_calibration_feedback).length > 0) {
    sections.push(formatVoiceCalibrationFeedback(input.voice_calibration_feedback));
  }

  // Section 4: Sculptor Transcript (if available)
  if (input.sculptor_transcript) {
    sections.push(`## Sculptor Session Transcript

This is the full conversation from the Sculptor interview session. Pay attention to:
- Corrections of assumptions
- Stories and specific examples
- Language patterns and vocabulary
- Sensitivities mentioned

---

${input.sculptor_transcript}

---`);
  }

  // Section 5: Corpus Summary (if available)
  if (input.corpus_summary) {
    sections.push(`## Corpus Summary (LinkedIn, Writing Samples)

Background information from their public presence:

---

${input.corpus_summary}

---`);
  }

  // Section 6: Persona Fingerprint (if available)
  if (input.persona_fingerprint) {
    sections.push(formatPersonaFingerprint(input.persona_fingerprint));
  }

  // Section 7: Gap Analysis notes (if available)
  if (input.gap_analysis_final) {
    sections.push(`## Gap Analysis Notes

The following was noted as still missing or uncertain:

---

${input.gap_analysis_final}

---`);
  }

  return `${SYNTHESIS_SYSTEM_PROMPT}

---

# Available Sources

${sections.join('\n\n')}

---

# Your Task

Synthesize all available sources into the complete Human OS output.

**The interview answers ARE the person.** Everything else is supporting context.

1. **Ground in FOS Interview** - These 12 answers are the foundation. Use their exact words and examples.
2. **Layer Question E** - These fill operational gaps (how they work, what helps, what drains)
3. **Incorporate Voice Feedback** - Their edits show exactly how they want to sound
4. **Reference Sculptor for stories** - Rich narratives and corrections, but interview answers take precedence
5. **Corpus is wallpaper** - Background only. Public personas often differ from private reality.
6. **Generate all 20 commandments** - Specific, actionable, grounded in what they actually said

Return ONLY the JSON output, no additional text.`;
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

function formatFosInterviewAnswers(answers: Record<string, string>): string {
  const questionLabels: Record<string, string> = {
    'a1-turning-point': 'A1: Describe a moment that fundamentally changed you',
    'a2-happiest-memory': 'A2: Your single happiest memory',
    'a3-difficult-time': 'A3: A difficult time and how you got through it',
    'a4-redemption': 'A4: Something bad that led to something good',
    'b1-core-identity': "B1: What's the core 'you' when everything is stripped away",
    'b2-simple-thing': 'B2: A simple thing that matters a lot to you',
    'b3-relationship-need': 'B3: What you need from relationships but rarely ask for',
    'c1-peak-performance': "C1: When you're at your best vs worst",
    'c2-struggle-recovery': 'C2: What helps you recover when things get hard',
    'c3-feedback-challenge': 'C3: How you prefer feedback and being challenged',
    'c4-social-rapport': 'C4: What makes you want to hang out vs just work with someone',
    'c5-ideal-ai': 'C5: 3-4 most important considerations for ideal AI assistant',
  };

  let formatted = `## FOS Consolidated Interview Answers (12 Questions)

These are the direct, recent answers from the thick client interview. **Highest priority source.**

`;

  for (const [questionId, answer] of Object.entries(answers)) {
    const label = questionLabels[questionId] || questionId;
    formatted += `### ${label}\n\n${answer}\n\n`;
  }

  return formatted;
}

function formatQuestionEAnswers(answers: Record<string, string>): string {
  // New consolidated E01-E12 labels (from 24 → 12 consolidation)
  const questionLabels: Record<string, string> = {
    // Decision-Making
    E01: 'E01: Default response when having too many options',
    E02: 'E02: Preferred decision support style',
    E03: 'E03: What decision overwhelm looks like and what helps',
    // Energy & Focus
    E04: 'E04: When at your best (time of day, conditions)',
    E05: 'E05: What drains your energy faster than expected',
    // Communication
    E06: 'E06: Preferred working interaction style',
    E07: 'E07: Feedback that helps vs. frustrates, how to push back',
    // Crisis & Recovery
    E08: 'E08: Signs of being stuck or avoiding something',
    E09: 'E09: What helps you get unstuck',
    E10: 'E10: What you need when struggling',
    // Work Style
    E11: 'E11: How priorities should be presented',
    E12: 'E12: Relationship with deadlines',
  };

  let formatted = `## Question E Personality Baseline Answers

These answers fill gaps in founder-os documentation. They enable effective support, not just content generation.

`;

  for (const [questionId, answer] of Object.entries(answers)) {
    const label = questionLabels[questionId] || questionId;
    formatted += `### ${label}\n\n${answer}\n\n`;
  }

  return formatted;
}

function formatVoiceCalibrationFeedback(
  feedback: Record<
    string,
    {
      edited: boolean;
      originalContent: string;
      editedContent?: string;
      whatDidntWork?: string;
      whatWouldHelp?: string;
    }
  >
): string {
  let formatted = `## Voice Calibration Feedback

Feedback on AI-generated content samples. Use this to refine Voice OS commandments.

`;

  for (const [sampleType, data] of Object.entries(feedback)) {
    formatted += `### ${sampleType}\n\n`;

    if (data.edited && data.editedContent) {
      formatted += `**Original (didn't quite work):**\n${data.originalContent}\n\n`;
      formatted += `**Edited version (their voice):**\n${data.editedContent}\n\n`;
    } else {
      formatted += `**Sample (worked well):**\n${data.originalContent}\n\n`;
    }

    if (data.whatDidntWork) {
      formatted += `**What didn't work:** ${data.whatDidntWork}\n\n`;
    }

    if (data.whatWouldHelp) {
      formatted += `**What would help:** ${data.whatWouldHelp}\n\n`;
    }
  }

  return formatted;
}

function formatPersonaFingerprint(fingerprint: PersonaFingerprint): string {
  return `## Persona Fingerprint (Voice Calibration Scores)

8-dimension profile from Sculptor session:

| Dimension | Score (0-10) |
|-----------|--------------|
| Self-deprecation | ${fingerprint.self_deprecation} |
| Directness | ${fingerprint.directness} |
| Warmth | ${fingerprint.warmth} |
| Intellectual signaling | ${fingerprint.intellectual_signaling} |
| Comfort with sincerity | ${fingerprint.comfort_with_sincerity} |
| Absurdism tolerance | ${fingerprint.absurdism_tolerance} |
| Format awareness | ${fingerprint.format_awareness} |
| Vulnerability as tool | ${fingerprint.vulnerability_as_tool} |

Use these scores to calibrate Voice OS tone and style.`;
}

// =============================================================================
// RESPONSE PARSER
// =============================================================================

/**
 * Parse the synthesis response from Claude
 */
/**
 * Attempt to repair common JSON issues from LLM output
 */
function repairJson(jsonStr: string): string {
  let repaired = jsonStr;

  // Fix literal \n and \t sequences outside of string values (common LLM issue)
  // The LLM sometimes outputs {\n  "key" instead of actual newlines
  // We need to be careful to only convert these outside of string values
  repaired = convertEscapesOutsideStrings(repaired);

  // Remove trailing commas before ] or }
  repaired = repaired.replace(/,(\s*[\]\}])/g, '$1');

  return repaired;
}

// Convert literal \n and \t to actual whitespace, but only outside of string values
function convertEscapesOutsideStrings(jsonStr: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;

  while (i < jsonStr.length) {
    const char = jsonStr[i]!;

    if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
      // Toggle string state on unescaped quotes
      inString = !inString;
      result.push(char);
      i++;
    } else if (!inString && char === '\\' && i + 1 < jsonStr.length) {
      // Outside strings: convert \n and \t to actual whitespace
      const nextChar = jsonStr[i + 1]!;
      if (nextChar === 'n') {
        result.push('\n');
        i += 2;
      } else if (nextChar === 't') {
        result.push('\t');
        i += 2;
      } else {
        result.push(char);
        i++;
      }
    } else {
      result.push(char);
      i++;
    }
  }

  return result.join('');
}

export function parseSynthesisResponse(response: string): SynthesisOutput {
  try {
    // Extract JSON from response (may have markdown code blocks)
    const jsonMatch =
      response.match(/```json\s*([\s\S]*?)\s*```/) ||
      response.match(/```\s*([\s\S]*?)\s*```/) ||
      response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    let jsonStr = jsonMatch[1] || jsonMatch[0];

    // First attempt: parse as-is
    try {
      const parsed = JSON.parse(jsonStr);
      return validateAndReturn(parsed);
    } catch (_firstError) {
      console.log('[parseSynthesisResponse] First parse failed, attempting repair...');

      // Second attempt: repair common issues
      jsonStr = repairJson(jsonStr);
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('[parseSynthesisResponse] Repair successful');
        return validateAndReturn(parsed);
      } catch (secondError) {
        // Log the problematic area
        const errorMatch = (secondError as Error).message.match(/position (\d+)/);
        if (errorMatch && errorMatch[1]) {
          const pos = parseInt(errorMatch[1]);
          console.error('[parseSynthesisResponse] Error near:', jsonStr.substring(Math.max(0, pos - 100), pos + 100));
        }
        throw secondError;
      }
    }
  } catch (error) {
    console.error('Failed to parse synthesis response:', error);
    throw new Error('Invalid synthesis response format');
  }
}

function validateAndReturn(parsed: unknown): SynthesisOutput {
  const obj = parsed as Record<string, unknown>;

  // Validate required fields
  if (!obj.executive_report) {
    throw new Error('Missing executive_report in response');
  }
  if (!obj.character_profile) {
    throw new Error('Missing character_profile in response');
  }
  if (!obj.founder_os) {
    throw new Error('Missing founder_os in response');
  }
  if (!obj.voice_os) {
    throw new Error('Missing voice_os in response');
  }

  return obj as unknown as SynthesisOutput;
}
