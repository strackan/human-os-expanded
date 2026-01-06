// Claude Scoring Prompt for Good Hang V2 Assessment
// D&D-style character generation

export const SCORING_SYSTEM_PROMPT = `You are scoring a Good Hang personality assessment. Your job is to analyze responses and generate a D&D-style character profile.

## Scoring Guidelines

For each response, score 0-10 based on:
- **Depth**: How thoroughly did they explore the question?
- **Specificity**: Did they give concrete examples vs vague generalities?
- **Self-awareness**: Do they show genuine insight into themselves?
- **Authenticity**: Does this feel real, not performative?

### Score Rubric
| Score | Description |
|-------|-------------|
| 9-10 | Exceptional depth, unique insight, specific examples, deeply self-aware |
| 7-8 | Strong answer, clear thinking, some specificity |
| 5-6 | Adequate, right direction, generic or surface-level |
| 3-4 | Weak, vague, no real examples |
| 1-2 | Doesn't engage with question, single sentence, dismissive |

**IMPORTANT**: There are no "right" answers. You're measuring HOW they think, not WHAT they think. Reward authenticity over "impressive" answers.

## Attributes (score signals 1-10)

| Code | Attribute | What It Measures |
|------|-----------|------------------|
| INT | Intelligence | Curiosity, learning, depth of thought |
| WIS | Wisdom | Self-awareness, emotional intelligence |
| CHA | Charisma | Social energy, presence |
| CON | Constitution | Consistency, follow-through, routine |
| STR | Strength | Assertiveness, drive, confrontation comfort |
| DEX | Dexterity | Adaptability, spontaneity, flexibility |

## Question-to-Attribute Mapping

| Question ID | Primary | Secondary |
|-------------|---------|-----------|
| a1-contrarian-belief | WIS | INT |
| a2-broke-rule | DEX | STR |
| a3-misunderstood | WIS | - |
| a4-dumb-hill | CHA | WIS |
| a5-10k-spend | STR | DEX |
| b1-talk-for-hours | INT | - |
| b2-ideal-saturday | CON | DEX |
| b3-friend-crisis | WIS | CHA |
| b4-party-dynamics | CHA | DEX |
| b5-rabbit-hole | INT | DEX |

## Alignment Detection

### Order Axis (Lawful ↔ Chaotic)
Primarily from a2-broke-rule and b2-ideal-saturday:

**a2-broke-rule signals:**
- Broke small rule reluctantly → Lawful (+2)
- Broke rule confidently with good reason → Neutral (+2)
- Broke rule gleefully, would do again → Chaotic (+2)

**b2-ideal-saturday signals:**
- Highly structured day → Lawful (+1)
- Loose structure → Neutral (+1)
- "No plan is the plan" → Chaotic (+1)

### Moral Axis (Good ↔ Evil)
Primarily from b3-friend-crisis and a5-10k-spend:

**b3-friend-crisis signals:**
- Feel it with them, empathy-first → Good (+2)
- Balance of feel + fix → Neutral (+2)
- Fix it / distract (action-oriented) → Neutral (+1)

**a5-10k-spend signals:**
- Spending includes others → Good (+1)
- Pure self-focused spending → Neutral (+1)

Note: "Evil" in D&D terms = self-interested, not malicious.

## Output Format

For the complete assessment, return a JSON object with this structure:

\`\`\`json
{
  "question_scores": {
    "a1-contrarian-belief": {
      "score": 8,
      "attribute_signals": {"WIS": 3, "INT": 2},
      "alignment_signal": null,
      "extracted_interests": ["philosophy", "contrarian thinking"],
      "notes": "Strong intellectual courage, well-reasoned position"
    }
  },
  "attributes": {
    "INT": 7,
    "WIS": 8,
    "CHA": 5,
    "CON": 6,
    "STR": 7,
    "DEX": 6
  },
  "alignment_scores": {
    "order": {"lawful": 1, "neutral": 2, "chaotic": 3},
    "moral": {"good": 4, "neutral": 2, "evil": 0}
  },
  "signals": {
    "enneagram_hint": "5w4",
    "interest_vectors": ["philosophy", "technology", "travel"],
    "social_energy": "selective_extrovert",
    "relationship_style": "depth_seeking"
  },
  "matching": {
    "ideal_group_size": "2-4",
    "connection_style": "intellectual",
    "energy_pattern": "flexible",
    "good_match_with": ["thinkers", "creatives", "adventurers"],
    "avoid_match_with": ["small-talk lovers", "rigid planners"]
  },
  "tagline_elements": {
    "core_trait": "curious thinker",
    "social_style": "selective connector",
    "passion": "exploring ideas"
  }
}
\`\`\`

## Important Notes

1. **Be consistent** - if someone scores high on INT in one question, that should influence your overall INT score
2. **Extract interests** - note specific topics, hobbies, passions mentioned for matching
3. **Note social patterns** - introvert/extrovert/ambivert signals, group size preferences
4. **Watch for flags** - generic answers, performative responses, lack of self-awareness
5. **Alignment is subtle** - most people will be some form of Neutral; strong Good/Evil or Lawful/Chaotic signals are notable`;

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

1. Score each question 0-10 based on depth, specificity, self-awareness, and authenticity
2. Extract attribute signals for each question based on the mapping
3. Detect alignment signals from relevant questions (a2, b2, b3, a5)
4. Identify interest vectors and social patterns
5. Generate matching preferences based on personality signals
6. Suggest tagline elements

Return your analysis as a valid JSON object following the output format specified above. Return ONLY the JSON, no additional text.`;
}

// Helper to format transcript for scoring
export function formatTranscriptForScoring(
  messages: Array<{ role: string; content: string }>
): string {
  let result = '';
  let currentQuestion = '';
  let questionId = '';

  // Map question text to IDs
  const questionIdMap: Record<string, string> = {
    "What's something you believe that most people disagree with?": 'a1-contrarian-belief',
    "Describe a time you broke a rule and were glad you did.": 'a2-broke-rule',
    "What do people misunderstand about you?": 'a3-misunderstood',
    "What's the dumbest hill you'd die on?": 'a4-dumb-hill',
    "If I gave you $10K right now that you HAD to spend on yourself in 48 hours, what would you do?": 'a5-10k-spend',
    "What could you talk about for hours without getting bored?": 'b1-talk-for-hours',
    "Describe your ideal Saturday -- from waking up to going to bed.": 'b2-ideal-saturday',
    "When a friend is going through something hard, what's your instinct -- fix it, feel it with them, or distract them?": 'b3-friend-crisis',
    "You're at a party where you only know one person. What do you do?": 'b4-party-dynamics',
    "What's the last rabbit hole you fell into?": 'b5-rabbit-hole',
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
