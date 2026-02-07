// Founder OS Commandments Extraction Prompt
// Maps FOS Consolidated Interview answers to Ten Commandments

export const FOUNDER_OS_SYSTEM_PROMPT = `You are extracting structured insights from a Founder-OS interview to populate the Ten Commandments - a set of protocols for an AI Chief of Staff.

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

## Output: Ten Commandments Mapping

Extract insights from answers to populate these protocol files:

### 1. CONVERSATION_PROTOCOLS
**Sources**: c3-feedback-challenge, c4-social-rapport
**Extract**:
- Communication style preferences
- Energy modes (high/low engagement)
- Red flags in conversation
- What makes communication effective

### 2. CRISIS_PROTOCOLS
**Sources**: a3-difficult-time, a4-redemption, c2-struggle-recovery
**Extract**:
- How they respond to acute overwhelm
- Emergency response patterns
- Historical resilience examples
- What NOT to do during crisis

### 3. CURRENT_STATE
**Sources**: b1-core-identity, c1-peak-performance
**Extract**:
- Core identity markers
- Current energy state indicators
- What's most important right now
- Active priorities

### 4. STRATEGIC_THOUGHT_PARTNER
**Sources**: a1-turning-point, a4-redemption
**Extract**:
- Decision frameworks from pivotal moments
- How they've made major life decisions
- Strengths revealed through transitions
- Blind spots or areas needing support

### 5. DECISION_MAKING
**Sources**: c1-peak-performance, a1-turning-point
**Extract**:
- Decision style under load
- What triggers decision paralysis
- Preferred support for decisions
- High-stakes vs low-stakes approach

### 6. ENERGY_PATTERNS
**Sources**: c1-peak-performance, c2-struggle-recovery
**Extract**:
- What energizes vs drains them
- Optimal conditions for focus
- Energy recovery patterns
- Warning signs of depletion

### 7. WORK_STYLE
**Sources**: c1-peak-performance, c5-ideal-ai
**Extract**:
- How to support effectively
- Priority presentation preferences
- Autonomy vs guidance balance
- Collaboration preferences

### 8. AVOIDANCE_PATTERNS
**Sources**: c2-struggle-recovery, a3-difficult-time
**Extract**:
- What "stuck" looks like
- Common avoidance behaviors
- Procrastination triggers
- Effective intervention methods

### 9. RECOVERY_PROTOCOLS
**Sources**: c2-struggle-recovery, a3-difficult-time, a4-redemption
**Extract**:
- Reset and restoration methods
- What actually helps (not performative)
- Recovery timeline patterns
- Support vs space needs

### 10. SUPPORT_CALIBRATION
**Sources**: c3-feedback-challenge, c4-social-rapport, c5-ideal-ai, b3-relationship-need
**Extract**:
- Meta: state detection signals
- Mode switching triggers
- Rapport calibration
- Ideal support characteristics

## Output Format

Return a JSON object with this structure:

\`\`\`json
{
  "commandments": {
    "conversation_protocols": {
      "communication_style": "string - preferred communication style",
      "energy_modes": ["high energy behaviors", "low energy behaviors"],
      "red_flags": ["things that shut down communication"],
      "effective_patterns": ["what works in conversation"]
    },
    "crisis_protocols": {
      "overwhelm_response": "string - how they typically respond to crisis",
      "historical_resilience": "string - example from their stories",
      "emergency_support": ["what helps during crisis"],
      "what_not_to_do": ["things to avoid during crisis"]
    },
    "current_state": {
      "core_identity": "string - who they are at their core",
      "energy_indicators": ["signs of current state"],
      "priorities": ["what matters most"]
    },
    "strategic_thought_partner": {
      "decision_frameworks": ["how they approach major decisions"],
      "strengths": ["revealed strengths from transitions"],
      "blind_spots": ["areas needing support"]
    },
    "decision_making": {
      "style_under_load": "string - how they decide under pressure",
      "paralysis_triggers": ["what causes decision paralysis"],
      "support_preferences": ["how to help with decisions"],
      "high_vs_low_stakes": "string - difference in approach"
    },
    "energy_patterns": {
      "energizers": ["what gives them energy"],
      "drains": ["what depletes them"],
      "optimal_conditions": ["best environment for focus"],
      "depletion_signals": ["warning signs"]
    },
    "work_style": {
      "support_methods": ["how to support effectively"],
      "priority_presentation": "string - how to present priorities",
      "autonomy_level": "string - guidance vs autonomy preference",
      "collaboration_preferences": ["how they like to work with others"]
    },
    "avoidance_patterns": {
      "stuck_indicators": ["what stuck looks like"],
      "avoidance_behaviors": ["common avoidance patterns"],
      "triggers": ["what triggers avoidance"],
      "interventions": ["what helps when stuck"]
    },
    "recovery_protocols": {
      "reset_methods": ["actual recovery techniques"],
      "timeline": "string - typical recovery timeline",
      "support_needs": "string - support vs space preference",
      "what_helps": ["specific things that help recovery"]
    },
    "support_calibration": {
      "state_signals": ["how to detect their state"],
      "mode_triggers": ["what triggers mode switches"],
      "rapport_style": "string - what builds rapport",
      "ideal_support": ["characteristics of ideal support"]
    }
  },
  "summary": {
    "core_identity": "string - 1-2 sentence core identity summary",
    "support_philosophy": "string - how they want to be supported",
    "key_insight": "string - most important thing to know"
  }
}
\`\`\`

## Important Notes

1. **Be specific** - Extract concrete, actionable insights, not generic advice
2. **Use their words** - Quote or paraphrase their actual responses when possible
3. **Infer thoughtfully** - Connect dots across questions, but don't over-assume
4. **Prioritize c1-c5** - Work & AI section is most directly relevant
5. **Story context matters** - a1-a4 reveals resilience and decision patterns
6. **Identity anchors** - b1-b3 reveals core values and relationship needs`;

import type { FounderOsExtractionResult } from './types';

// Re-export types for consumers that import from this file
export type { FounderOsCommandments, FounderOsSummary, FounderOsExtractionResult } from './types';

export function buildFounderOsPrompt(transcript: Array<{ role: string; content: string }>): string {
  // Format the transcript for extraction
  const transcriptText = formatTranscriptForFounderOs(transcript);

  return `${FOUNDER_OS_SYSTEM_PROMPT}

---

# Interview Transcript

${transcriptText}

---

# Your Task

Analyze the interview responses and extract structured insights for each of the Ten Commandments.

1. Read each answer carefully
2. Map relevant insights to the appropriate commandment files
3. Use specific language from their answers when possible
4. Generate the JSON output following the format above

Return ONLY the JSON, no additional text.`;
}

// Helper to format transcript for Founder OS extraction
function formatTranscriptForFounderOs(
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

// Parse Founder OS extraction response
export function parseFounderOsResponse(response: string): FounderOsExtractionResult {
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
    console.error('Failed to parse Founder OS response:', error);
    throw new Error('Invalid Founder OS response format');
  }
}
