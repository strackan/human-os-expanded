// Voice OS Commandments Extraction Prompt
// Maps FOS Consolidated Interview answers to Voice OS Ten Commandments

export const VOICE_OS_SYSTEM_PROMPT = `You are extracting structured insights from a Founder-OS interview to populate the Voice OS Ten Commandments -- an operational playbook for content generation that captures someone's authentic voice.

Your output must be production-quality: concrete structural patterns, not abstract descriptions. Extract HOW they communicate (patterns, structures, rhythms) not just WHAT they say.

## Input: FOS Consolidated Interview (12 Questions)

### Section A: Your Story (a1-a4)
- a1-turning-point: Describes a moment that fundamentally changed them
- a2-happiest-memory: Their single happiest memory
- a3-difficult-time: A difficult time and how they got through it
- a4-redemption: Something bad that led to something good

### Section B: Who You Are (b1-b3)
- b1-core-identity: What remains when job/relationships/achievements stripped away
- b2-simple-thing: A simple thing that matters a lot
- b3-relationship-need: What they need from relationships but rarely ask for

### Section C: Work & AI (c1-c5)
- c1-peak-performance: When they're at their best vs worst
- c2-struggle-recovery: What helps them recover when things get hard
- c3-feedback-challenge: How they prefer feedback and being challenged
- c4-social-rapport: What makes them want to hang out vs just work with someone
- c5-ideal-ai: 3-4 most important considerations for ideal AI assistant

## Output: Voice OS Ten Commandments

### 1. WRITING_ENGINE
**Sources**: c3 (communication style), c4 (conversational patterns), b2 (values in language), all answers (vocabulary and rhythm analysis)
**Extract**:
- ALWAYS rules: 5-10 voice patterns they consistently use (sentence structures, punctuation habits, emphasis patterns, formatting choices)
- NEVER rules: 5-7 anti-patterns (tones that feel wrong, phrasings they'd never use)
- Vocabulary fingerprint: Distinctive words/phrases they gravitate toward
- Decision tree: Content type → recommended approach (inferred from how they tell different kinds of stories)
- Vulnerability boundary: YES (what they'll allude to) / NO (what's off limits) / THE LINE (where the boundary sits)

### 2. SIGNATURE_MOVES
**Sources**: All answers -- look for HOW they communicate uniquely
**Extract**:
- 3-5 unique techniques that make their voice distinctive
- For each: name it, describe the structure, when to deploy it
- Examples: tangent style, humor deployment, vocabulary shifts, pacing techniques, storytelling devices

### 3. OPENINGS
**Sources**: a1-a4 (how they start stories), c3 (how they engage), c4 (connection style)
**Extract**:
- 4-6 opening patterns with labels (O1: VULNERABILITY, O2: SCENE-SETTING, etc.)
- For each: description, energy match, "use for" contexts, 1-2 example phrases from their answers

### 4. MIDDLES
**Sources**: c3 (argument style), b1 (reasoning patterns), a1-a4 (narrative structure)
**Extract**:
- 4-7 middle/body patterns with labels (M1: STORY ARC, M2: PHILOSOPHICAL ESCALATION, etc.)
- For each: structural template, "pairs with" which openers

### 5. ENDINGS
**Sources**: c3 (how they close), c5 (action orientation), a4 (resolution style)
**Extract**:
- 4-6 ending patterns with labels (E1: OPEN QUESTION, E2: CALLBACK, etc.)
- For each: "pairs with" which O+M combinations, "use for" contexts

### 6. THEMES
**Sources**: b1 (core identity/beliefs), a1 (formative beliefs), c1 (work philosophy)
**Extract**:
- Core beliefs: Philosophical positions they'd defend, with evidence quotes
- Frequency: How often each theme appears across answers
- Anti-patterns: What the opposite of each theme sounds like (to catch drift)

### 7. GUARDRAILS
**Sources**: c3 (boundaries), b3 (sensitivities), c5 (preferences)
**Extract in YES/NO/THE LINE format**:
- YES: Topics and tones that are safe/encouraged
- NO: Hard boundaries, things they'd never say or do publicly
- THE LINE: Where the boundary sits
- Sacred cows: Positions they'd never contradict

### 8. STORIES
**Sources**: a1-a4 (narratives), all sections for additional story material
**Extract**:
- Key narrative fragments: Actual story text (2-4 sentences, deployable), not just descriptions
- For each: vulnerability level tag (low/medium/high), use-case tags (inspiration, credibility, humor, connection)

### 9. ANECDOTES
**Sources**: All sections -- extract specific examples and illustrations
**Extract**:
- Brief deployable examples: Actual text (1-2 sentences, copy-paste ready)
- For each: category tag, when to use

### 10. BLEND_HYPOTHESES
**Sources**: All sections -- infer content archetypes from how they combine storytelling with analysis
**Extract**:
- 3-5 content archetypes with recommended O+M+E component combinations
- For each: name (e.g. "The Authentic Founder"), components, "when to use", "why it works"

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "commandments": {
    "writing_engine": {
      "always_rules": ["5-10 concrete voice patterns they consistently use"],
      "never_rules": ["5-7 anti-patterns to avoid"],
      "vocabulary_fingerprint": ["distinctive words/phrases"],
      "decision_tree": "content type → recommended approach mapping",
      "vulnerability_boundary": {
        "yes": ["what they'll allude to"],
        "no": ["what's off limits"],
        "the_line": "where the boundary sits"
      }
    },
    "signature_moves": [
      {
        "name": "technique name",
        "structure": "how it works structurally",
        "when_to_use": "deployment context",
        "example": "example from their answers"
      }
    ],
    "openings": [
      {
        "label": "O1: PATTERN_NAME",
        "description": "what this pattern does",
        "energy_match": "melancholy/playful/punchy/reflective/etc.",
        "use_for": "content types",
        "example": "actual phrase from their answers"
      }
    ],
    "middles": [
      {
        "label": "M1: PATTERN_NAME",
        "description": "what this pattern does",
        "structural_template": "e.g. Setup → Conflict → Turn → Resolution",
        "pairs_with": ["O1", "O3"]
      }
    ],
    "endings": [
      {
        "label": "E1: PATTERN_NAME",
        "description": "what this pattern does",
        "pairs_with": ["O1+M1", "O3+M6"],
        "use_for": "engagement/depth/action"
      }
    ],
    "themes": [
      {
        "belief": "core position they'd defend",
        "evidence": "quote or paraphrase from their answers",
        "frequency": "how often it appears",
        "anti_pattern": "what the opposite sounds like"
      }
    ],
    "guardrails": {
      "yes": ["safe/encouraged topics and tones"],
      "no": ["hard boundaries"],
      "the_line": "where the boundary sits",
      "sacred_cows": ["positions they'd never contradict"]
    },
    "stories": [
      {
        "narrative": "actual story fragment (2-4 sentences)",
        "vulnerability_level": "low/medium/high",
        "use_case": ["inspiration", "credibility", "humor", "connection"]
      }
    ],
    "anecdotes": [
      {
        "text": "brief deployable example (1-2 sentences)",
        "category": "tag",
        "when_to_use": "context"
      }
    ],
    "blend_hypotheses": [
      {
        "name": "archetype name",
        "components": "O? + M? + E?",
        "when_to_use": "content scenario",
        "why_it_works": "structural logic"
      }
    ]
  },
  "summary": {
    "voice_essence": "1-2 sentence description of their authentic voice",
    "signature_moves": ["3-5 distinctive patterns in their communication"],
    "generation_guidance": "key instruction for AI generating in their voice"
  }
}
\`\`\`

## Important Notes

1. **Be specific** -- Extract concrete patterns, not generic descriptions
2. **Use their words** -- Quote or paraphrase their actual language when possible
3. **Extract structure** -- HOW they communicate matters more than WHAT they say
4. **Watch for vocabulary** -- Note distinctive words, phrases, metaphors, punctuation habits
5. **Detect rhythm** -- Sentence length variation, pacing, how they build to points
6. **Story section is gold** -- a1-a4 reveal narrative style, vulnerability comfort, and structural patterns
7. **Infer, don't guess** -- If a pattern isn't clearly present, don't fabricate it`;

import type { VoiceOsExtractionResult } from './types';

// Re-export types for consumers that import from this file
export type { VoiceOsCommandments, VoiceOsSummary, VoiceOsExtractionResult } from './types';

export function buildVoiceOsPrompt(transcript: Array<{ role: string; content: string }>): string {
  // Format the transcript for extraction
  const transcriptText = formatTranscriptForVoiceOs(transcript);

  return `${VOICE_OS_SYSTEM_PROMPT}

---

# Interview Transcript

${transcriptText}

---

# Your Task

Analyze the interview responses and extract structured insights for each of the Voice OS Ten Commandments.

1. Read each answer carefully - note HOW they communicate, not just WHAT they say
2. Map relevant insights to the appropriate voice protocol files
3. Use specific language from their answers when possible
4. Pay attention to vocabulary, sentence structure, and emotional tone
5. Generate the JSON output following the format above

Return ONLY the JSON, no additional text.`;
}

// Helper to format transcript for Voice OS extraction
function formatTranscriptForVoiceOs(
  messages: Array<{ role: string; content: string }>
): string {
  let result = '';
  let currentQuestion = '';
  let questionId = '';

  // Map question text to IDs
  const questionIdMap: Record<string, string> = {
    // Section A: Your Story
    "Describe a moment or experience that fundamentally changed who you are or how you see the world.": 'a1-turning-point',
    "Tell me about your single happiest memory.": 'a2-happiest-memory',
    "Tell me about a difficult time in your life and how you got through it.": 'a3-difficult-time',
    "Tell me about something bad that happened to you that ultimately led to something good.": 'a4-redemption',
    // Section B: Who You Are
    "If you stripped away your job, relationships, and achievements - what would remain? What's the core 'you'?": 'b1-core-identity',
    "What's a simple thing that matters a lot to you?": 'b2-simple-thing',
    "What do you need from close relationships that you rarely ask for directly?": 'b3-relationship-need',
    // Section C: Work & AI
    "Tell me about when you're at your best vs your worst.": 'c1-peak-performance',
    "When things get hard, what actually helps you recover?": 'c2-struggle-recovery',
    "How do you prefer to receive feedback and to be challenged?": 'c3-feedback-challenge',
    "What makes you want to hang out with someone socially vs just working with them?": 'c4-social-rapport',
    "If you could build an ideal AI assistant, what would be the 3-4 most important considerations?": 'c5-ideal-ai',
  };

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      currentQuestion = msg.content;
      // Try to find matching question ID
      questionId = Object.entries(questionIdMap).find(([text]) =>
        msg.content.includes(text)
      )?.[1] || 'unknown';
    } else if (msg.role === 'user' && currentQuestion) {
      result += `**Question [${questionId}]:** ${currentQuestion}\n`;
      result += `**Answer:** ${msg.content}\n\n`;
      currentQuestion = '';
      questionId = '';
    }
  }

  return result;
}

// Parse Voice OS extraction response
export function parseVoiceOsResponse(response: string): VoiceOsExtractionResult {
  try {
    // Extract JSON from response (may have markdown code blocks)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                     response.match(/```\s*([\s\S]*?)\s*```/) ||
                     response.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse Voice OS response:', error);
    throw new Error('Invalid Voice OS response format');
  }
}
