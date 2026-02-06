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

### Executive Report
\`\`\`typescript
{
  summary: string; // 2-3 paragraph executive summary
  workStyle: {
    approach: string; // e.g., "Sprint-based intensity with recovery cycles"
    strengths: string[]; // 3-5 core work strengths
  };
  communication: {
    style: string; // e.g., "Direct and energetic"
    preferences: string[]; // 3-5 key preferences
  };
  keyInsights: string[]; // 4-6 key insights about this person
  personality: Array<{
    trait: string;
    description: string;
    insight: string;
  }>; // 4-6 traits with explanations
  voice: {
    tone: string;
    style: string;
    characteristics: string[];
    examples?: string[];
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
1. CONVERSATION_PROTOCOLS - Communication style, energy modes, red flags
2. CRISIS_PROTOCOLS - Overwhelm response, historical resilience, what NOT to do
3. CURRENT_STATE - Core identity, energy indicators, priorities
4. STRATEGIC_THOUGHT_PARTNER - Decision frameworks, strengths, blind spots
5. DECISION_MAKING - Style under load, paralysis triggers, support preferences
6. ENERGY_PATTERNS - Energizers, drains, optimal conditions
7. WORK_STYLE - Support methods, priority presentation, autonomy level
8. AVOIDANCE_PATTERNS - Stuck indicators, avoidance behaviors, interventions
9. RECOVERY_PROTOCOLS - Reset methods, timeline, support needs
10. SUPPORT_CALIBRATION - State signals, mode triggers, rapport style

### Voice OS 10 Commandments
1. VOICE - Always/never patterns, vocabulary fingerprint, rhythm
2. THEMES - Core beliefs, current focus, values
3. GUARDRAILS - Topics/tones to avoid, sacred cows, hard NOs
4. STORIES - Key narratives, story themes, vulnerability level
5. ANECDOTES - Brief examples, proof points, personal references
6. OPENINGS - Hook styles, greeting patterns, tone openers
7. MIDDLES - Argument structures, evidence patterns, transitions
8. ENDINGS - Closing patterns, CTA style, mic-drop lines
9. BLENDS - Content types, format preferences, mixing patterns
10. EXAMPLES - Sample thought leadership, story, connection message

## Output Format

Return a single JSON object with all sections. Use the exact structure below:

\`\`\`json
{
  "executive_report": {
    "summary": "2-3 paragraph executive summary...",
    "workStyle": {
      "approach": "...",
      "strengths": ["...", "..."]
    },
    "communication": {
      "style": "...",
      "preferences": ["...", "..."]
    },
    "keyInsights": ["...", "...", "..."],
    "personality": [
      { "trait": "...", "description": "...", "insight": "..." }
    ],
    "voice": {
      "tone": "...",
      "style": "...",
      "characteristics": ["..."],
      "examples": ["..."]
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
    "commandments": { /* 10 commandments */ },
    "summary": { "core_identity": "...", "support_philosophy": "...", "key_insight": "..." }
  },
  "voice_os": {
    "commandments": { /* 10 commandments */ },
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
7. **Stay actionable** - Commandments should be specific enough to guide AI behavior, not generic platitudes`;

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
