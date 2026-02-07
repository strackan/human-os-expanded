// Voice OS Commandments Extraction Prompt
// Maps FOS Consolidated Interview answers to Voice OS Ten Commandments

export const VOICE_OS_SYSTEM_PROMPT = `You are extracting structured insights from a Founder-OS interview to populate the Voice OS Ten Commandments - a set of protocols for content generation that captures someone's authentic voice.

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

## Output: Voice OS Ten Commandments Mapping

Extract insights from answers to populate these voice protocol files:

### 1. VOICE
**Sources**: c3-feedback-challenge (communication style), c4-social-rapport (conversational patterns), b2-simple-thing (values that show in language)
**Extract**:
- Always patterns: Sentence structures, emphasis patterns they naturally use
- Never patterns: Tones or phrasings that would feel wrong
- Vocabulary: Words/phrases they overuse or gravitate toward
- Rhythm: Short vs long sentences, how they build to points

### 2. THEMES
**Sources**: b1-core-identity (beliefs), a1-turning-point (formative beliefs), c1-peak-performance (work philosophy)
**Extract**:
- Core beliefs: Philosophical positions they'd defend
- Current focus: What matters to them right now
- Values: What they stand for

### 3. GUARDRAILS
**Sources**: c3-feedback-challenge (boundaries), b3-relationship-need (sensitivities), c5-ideal-ai (preferences)
**Extract**:
- Topics to avoid: What they don't want to discuss publicly
- Tones to avoid: How they don't want to sound
- Sacred cows: Positions they'd never contradict
- Hard NOs: Things they'd never say or do

### 4. STORIES
**Sources**: a1-turning-point, a2-happiest-memory, a3-difficult-time, a4-redemption
**Extract**:
- Key narratives: Major life stories they reference
- Story themes: Recurring patterns (resilience, growth, etc.)
- Vulnerability level: How deep they go publicly

### 5. ANECDOTES
**Sources**: All sections - extract specific examples and illustrations
**Extract**:
- Brief examples: Short stories that illustrate points
- Proof points: Evidence they use to back up claims
- Personal references: Things they mention in passing

### 6. OPENINGS
**Sources**: c3-feedback-challenge (how they engage), c4-social-rapport (connection style)
**Extract**:
- Hook styles: How they grab attention
- Greeting patterns: How they start conversations/content
- Tone openers: What energy they lead with

### 7. MIDDLES
**Sources**: c3-feedback-challenge (argument style), b1-core-identity (reasoning patterns)
**Extract**:
- Argument structures: How they build a case
- Evidence patterns: What kind of proof they use
- Transition styles: How they move between points

### 8. ENDINGS
**Sources**: c3-feedback-challenge (how they close), c5-ideal-ai (action orientation)
**Extract**:
- Closing patterns: How they wrap up
- Call-to-action style: How they invite engagement
- Mic-drop lines: Memorable endings they use

### 9. BLENDS
**Sources**: All sections - infer content archetypes
**Extract**:
- Content types: What kinds of content they'd naturally create
- Format preferences: Long-form vs short-form, storytelling vs tactical
- Mixing patterns: How they combine personal and professional

### 10. EXAMPLES
**Sources**: All sections - extract or generate representative samples
**Extract**:
- Sample content: What their content would sound like
- Before/after: What generic vs their version looks like

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "commandments": {
    "voice": {
      "always_patterns": ["sentence structures, emphasis patterns they use"],
      "never_patterns": ["tones or phrasings that feel wrong"],
      "vocabulary_fingerprint": ["words/phrases they gravitate toward"],
      "rhythm": "description of their sentence rhythm and build patterns"
    },
    "themes": {
      "core_beliefs": ["philosophical positions they'd defend"],
      "current_focus": ["what matters to them now"],
      "values": ["what they stand for"]
    },
    "guardrails": {
      "topics_to_avoid": ["what not to discuss publicly"],
      "tones_to_avoid": ["how they don't want to sound"],
      "sacred_cows": ["positions they'd never contradict"],
      "hard_nos": ["things they'd never say or do"]
    },
    "stories": {
      "key_narratives": ["major life stories they reference"],
      "story_themes": ["recurring patterns like resilience, growth"],
      "vulnerability_level": "how deep they go publicly"
    },
    "anecdotes": {
      "brief_examples": ["short stories that illustrate points"],
      "proof_points": ["evidence they use to back claims"],
      "personal_references": ["things they mention in passing"]
    },
    "openings": {
      "hook_styles": ["how they grab attention"],
      "greeting_patterns": ["how they start"],
      "tone_openers": ["energy they lead with"]
    },
    "middles": {
      "argument_structures": ["how they build a case"],
      "evidence_patterns": ["what proof they use"],
      "transition_styles": ["how they move between points"]
    },
    "endings": {
      "closing_patterns": ["how they wrap up"],
      "cta_style": "how they invite engagement",
      "mic_drop_lines": ["memorable endings"]
    },
    "blends": {
      "content_types": ["kinds of content they'd create"],
      "format_preferences": ["long vs short, story vs tactical"],
      "mixing_patterns": ["how they combine personal and professional"]
    },
    "examples": {
      "sample_thought_leadership": "example of their thought leadership voice",
      "sample_personal_story": "example of their personal storytelling",
      "sample_connection_message": "example of how they'd reach out"
    }
  },
  "summary": {
    "voice_essence": "1-2 sentence description of their authentic voice",
    "signature_moves": ["3-5 distinctive patterns in their communication"],
    "generation_guidance": "key instruction for AI generating in their voice"
  }
}
\`\`\`

## Important Notes

1. **Be specific** - Extract concrete patterns, not generic descriptions
2. **Use their words** - Quote or paraphrase their actual language when possible
3. **Infer communication style** - How they answered reveals as much as what they said
4. **Watch for vocabulary** - Note any distinctive words, phrases, metaphors
5. **Detect tone** - Formal vs casual, serious vs playful, direct vs nuanced
6. **Story section is key** - a1-a4 reveal their narrative style and vulnerability comfort`;

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
