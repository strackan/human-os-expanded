// Claude Scoring Prompt for Good Hang V3 Assessment
// Deep psychological assessment with D&D-style character generation

export const SCORING_SYSTEM_PROMPT = `You are scoring a Good Hang personality assessment based on McAdams' Life Story Interview and deep psychological frameworks. Your job is to analyze narrative responses and generate a D&D-style character profile.

## Philosophy

These questions bypass surface-level self-presentation and reveal authentic character through:
- **Narrative identity**: How they tell their life story reveals who they are
- **Vulnerability**: Willingness to share struggle and failure
- **Self-awareness**: Understanding their own patterns and limitations
- **Values**: What truly matters, revealed through specifics

## Scoring Guidelines

For each response, score 0-10 based on:
- **Depth**: How deeply did they go? Surface platitudes vs genuine excavation
- **Specificity**: Concrete memories/examples vs vague generalities
- **Vulnerability**: Willingness to share difficult truths about themselves
- **Self-awareness**: Insight into their own patterns, not just what happened but WHY

### Score Rubric
| Score | Description |
|-------|-------------|
| 9-10 | Exceptional vulnerability, specific memories, genuine insight into self, emotionally resonant |
| 7-8 | Strong answer with real specificity, shows genuine reflection |
| 5-6 | Adequate, somewhat specific, but stays safe or surface-level |
| 3-4 | Vague, generic, avoids vulnerability, gives "right" answer |
| 1-2 | Deflects, dismisses, or gives performative non-answer |

**CRITICAL**: Reward authentic struggle over polished answers. "I don't know, but..." followed by genuine exploration scores higher than confident platitudes.

## Attributes (derive signals 1-10)

| Code | Attribute | What It Measures |
|------|-----------|------------------|
| INT | Intelligence | Curiosity, complexity of thought, ability to hold nuance |
| WIS | Wisdom | Self-awareness, emotional intelligence, insight into human nature |
| CHA | Charisma | Social/emotional openness, connection capacity, presence |
| CON | Constitution | Resilience, consistency, ability to endure difficulty |
| STR | Strength | Assertiveness, agency, willingness to confront hard truths |
| DEX | Dexterity | Adaptability, flexibility, comfort with change/ambiguity |

## Question-to-Attribute Mapping

| Question ID | Primary | Secondary | What It Reveals |
|-------------|---------|-----------|-----------------|
| a1-turning-point | WIS | INT | Growth capacity, meaning-making, insight depth |
| a2-happiest-memory | CHA | WIS | Values (achievement vs connection vs freedom), emotional access |
| a3-difficult-time | CON | STR | Resilience style, coping mechanisms, honesty about struggle |
| a4-redemption | WIS | DEX | Optimism/pessimism lens, meaning-making, adaptability |
| b1-failed-someone | WIS | CHA | Accountability, guilt capacity, moral seriousness |
| b2-core-identity | CON | STR | Self-knowledge depth, what they hold onto |
| b3-simple-thing | WIS | CON | Values through specifics, what they notice/cherish |
| c1-relationship-need | CHA | CON | Attachment style, emotional honesty, vulnerability |
| c2-intellectual-gap | WIS | CON | Honesty about hypocrisy, where willpower fails |
| c3-happiness-barrier | WIS | STR | Self-knowledge, relationship to happiness, agency |

## Alignment Detection (from narrative patterns)

### Order Axis (Lawful ↔ Chaotic)
Detect from HOW they tell their stories:

**Lawful signals:**
- Stories emphasize duty, commitment, structure
- Values consistency and follow-through
- Guilt about breaking commitments
- Prefers stability, routine, clear roles

**Chaotic signals:**
- Stories emphasize freedom, spontaneity, breaking convention
- Values authenticity over consistency
- Comfortable with rule-breaking for good reasons
- Prefers flexibility, improvisation, fluid roles

**Neutral:**
- Balance of both, context-dependent

### Moral Axis (Good ↔ Evil)
Detect from their orientation toward others:

**Good signals:**
- Concern for others' wellbeing in stories
- Genuine guilt about failing others (b1)
- Relational needs involve giving, not just receiving
- Happiness barriers involve concern for impact on others

**Evil (self-interested) signals:**
- Stories center primarily on personal achievement
- Limited remorse about impact on others
- Relational needs are transactional
- Happiness barriers are purely personal

**Neutral:**
- Balance of self and others, pragmatic

Note: Most people are Neutral on moral axis. Strong Good or Evil signals are notable.

## Red Flags to Note

- **Deflection**: "I can't think of one" to vulnerability questions
- **Humble-bragging**: "My weakness is I care too much"
- **Performance**: Answers feel crafted for impression
- **Blame-shifting**: Failures are always external
- **Platitudes**: Generic wisdom without personal specifics
- **Toxic positivity**: Cannot acknowledge difficulty or negative emotions

## Green Flags (score higher)

- **"I don't know, but..."**: Genuine exploration of uncertainty
- **Specific sensory details**: Shows they're accessing real memory
- **Contradictions acknowledged**: "Part of me thinks X, but..."
- **Uncomfortable truths**: Shares things that don't make them look good
- **Questions turned inward**: Uses question to genuinely reflect

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "question_scores": {
    "a1-turning-point": {
      "score": 8,
      "attribute_signals": {"WIS": 4, "INT": 2},
      "alignment_signals": {"order": "neutral", "moral": "good"},
      "extracted_themes": ["growth", "loss", "transformation"],
      "vulnerability_level": "high",
      "notes": "Specific memory of father's death, shows clear before/after shift in worldview"
    }
  },
  "attributes": {
    "INT": 7,
    "WIS": 9,
    "CHA": 6,
    "CON": 7,
    "STR": 5,
    "DEX": 6
  },
  "alignment_scores": {
    "order": {"lawful": 1, "neutral": 3, "chaotic": 2},
    "moral": {"good": 4, "neutral": 2, "evil": 0}
  },
  "signals": {
    "enneagram_hint": "4w5",
    "attachment_style": "anxious-secure",
    "resilience_pattern": "meaning-making",
    "interest_vectors": ["philosophy", "relationships", "self-understanding"],
    "social_energy": "selective_introvert",
    "relationship_style": "depth_seeking"
  },
  "matching": {
    "ideal_group_size": "2-4",
    "connection_style": "emotional_depth",
    "energy_pattern": "slow_build",
    "good_match_with": ["reflective types", "emotionally available", "curious minds"],
    "avoid_match_with": ["surface-level connectors", "emotionally avoidant", "hyperactive social"]
  },
  "tagline_elements": {
    "core_essence": "thoughtful seeker",
    "relational_style": "deep connector",
    "life_orientation": "meaning-focused"
  },
  "overall_vulnerability_score": 7,
  "authenticity_assessment": "High - answers feel genuine, includes uncomfortable truths"
}
\`\`\`

## Important Notes

1. **Narrative patterns matter** - HOW they tell stories reveals as much as WHAT they say
2. **Weight vulnerability** - Willingness to share struggle is a strong WIS/CHA signal
3. **Extract attachment signals** - Relationship question (c1) reveals attachment style
4. **Note resilience style** - From difficult time (a3): do they endure, reframe, seek support, or take action?
5. **Watch the gap** - c2 (intellectual gap) reveals where their values and behavior diverge
6. **Happiness orientation** - c3 reveals if barriers are internal (WIS) or external (blaming)
7. **Track emotional access** - Can they access and articulate emotions, or do they intellectualize?`;

export function buildScoringPrompt(transcript: Array<{ role: string; content: string }>): string {
  // Convert transcript to readable format
  const transcriptText = formatTranscriptForScoring(transcript);

  return `${SCORING_SYSTEM_PROMPT}

---

# Assessment Transcript

${transcriptText}

---

# Your Task

Analyze each response according to the rubric above and generate the complete character profile.

1. Score each question 0-10 based on depth, specificity, vulnerability, and self-awareness
2. Extract attribute signals for each question based on the mapping
3. Detect alignment signals from narrative patterns across all responses
4. Identify attachment style, resilience pattern, and social energy
5. Generate matching preferences based on personality signals
6. Assess overall vulnerability and authenticity
7. Suggest tagline elements that capture their essence

Return your analysis as a valid JSON object following the output format specified above. Return ONLY the JSON, no additional text.`;
}

// Helper to format transcript for scoring
export function formatTranscriptForScoring(
  messages: Array<{ role: string; content: string }>
): string {
  let result = '';
  let currentQuestion = '';
  let questionId = '';

  // Map question text to IDs (V3 questions)
  const questionIdMap: Record<string, string> = {
    "Describe a moment or experience that fundamentally changed who you are or how you see the world.": 'a1-turning-point',
    "Tell me about your single happiest memory.": 'a2-happiest-memory',
    "Tell me about a difficult time in your life and how you got through it.": 'a3-difficult-time',
    "Tell me about something bad that happened to you that ultimately led to something good.": 'a4-redemption',
    "Tell me about a time you failed someone you care about.": 'b1-failed-someone',
    "If you stripped away your job, relationships, and achievements - what would remain? What's the core 'you'?": 'b2-core-identity',
    "What's a simple thing that matters a lot to you?": 'b3-simple-thing',
    "What do you need from close relationships that you rarely ask for directly?": 'c1-relationship-need',
    "What's something you believe in intellectually but can't fully commit to in practice?": 'c2-intellectual-gap',
    "What's really keeping you from being happy?": 'c3-happiness-barrier',
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

// Parse AI response into structured format
export function parseAssessmentResponse(response: string): Record<string, unknown> {
  try {
    // Extract JSON from response (may have markdown code blocks)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/) || response.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse assessment response:', error);
    throw new Error('Invalid assessment response format');
  }
}
