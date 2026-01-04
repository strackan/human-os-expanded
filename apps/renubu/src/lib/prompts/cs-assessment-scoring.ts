// AI Scoring Prompt for CS Assessment
// This prompt is sent to Claude to analyze interview responses and generate scores

import { SCORING_RUBRICS } from '../assessment/scoring-rubrics';

export function buildScoringPrompt(transcript: any[]): string {
  // Convert transcript to readable format
  const transcriptText = transcript
    .map((msg) => {
      if (msg.role === 'assistant') {
        return `QUESTION: ${msg.content}`;
      } else {
        return `ANSWER: ${msg.content}`;
      }
    })
    .join('\n\n');

  return `You are an expert CS (Customer Success) talent assessor. You've just conducted an interview with a CS professional. Based on the interview transcript below, you will score them across 12 dimensions and classify their archetype.

# Interview Transcript

${transcriptText}

---

# Your Task

Analyze the candidate's responses and provide a comprehensive assessment.

## 1. Dimensional Scores (0-100 for each)

Score each dimension based on the rubrics below. Be rigorous and evidence-based.

### IQ (Problem-Solving, Critical Thinking)
${formatRubric('iq')}

### Emotional Intelligence
${formatRubric('eq')}

### Empathy (Customer Focus)
${formatRubric('empathy')}

### Self-Awareness
${formatRubric('self_awareness')}

### Technical Aptitude
${formatRubric('technical')}

### AI Readiness
${formatRubric('ai_readiness')}

**For AI Readiness, evaluate their prompts against:**
- ✅ Context provided (who, what, why)
- ✅ Constraints specified (length, tone, format)
- ✅ Output format requested (structured, specific)
- ✅ Multi-step instructions (analyze then draft)
- ✅ Verification steps included
- ❌ Vague requests ("help me", "do this")
- ❌ No context or specificity

### GTM/Business Acumen
${formatRubric('gtm')}

### Communication/Personality
${formatRubric('personality')}

### Motivation
${formatRubric('motivation')}

### Work History
${formatRubric('work_history')}

### Passions/Energy
${formatRubric('passions')}

### Culture Fit
${formatRubric('culture_fit')}

## 2. Archetype Classification

Choose the archetype that best fits this candidate:

- **Technical Builder**: Strong technical skills, product-focused, systematic problem-solver
- **GTM Operator**: Sales-minded, revenue-focused, strategic account manager
- **Creative Strategist**: Innovation-driven, problem-solving, creative solutions
- **Execution Machine**: Process-driven, gets things done, reliable operator
- **Generalist Orchestrator**: Broad skills, coordinates well, jack-of-all-trades
- **Domain Expert**: Deep expertise in specific area (AI, enterprise, vertical)

## 3. Archetype Confidence

Rate your confidence in the archetype classification:
- **high**: Clear signals, strong evidence
- **medium**: Some signals, reasonable fit
- **low**: Ambiguous, could fit multiple archetypes

## 4. Overall Score

Calculate weighted average (0-100):
- IQ: 10%
- EQ: 10%
- Empathy: 10%
- Self-Awareness: 5%
- Technical: 10%
- AI Readiness: 15% (critical differentiator)
- GTM: 10%
- Personality: 10%
- Motivation: 5%
- Work History: 5%
- Passions: 5%
- Culture Fit: 5%

## 5. Red Flags

List any concerns or warning signs:
- Communication issues
- Lack of experience in critical areas
- Values misalignment
- Defensiveness or lack of self-awareness
- Technical gaps
- AI incompetency (critical for modern CS)

## 6. Green Flags

List strong positives:
- Unique skills or experiences
- Exceptional in specific areas
- Growth trajectory
- Strong cultural fit
- AI power user

## 7. Recommendation

Write 2-3 sentences summarizing:
- Overall assessment
- Best fit for this candidate
- Key strengths and growth areas

## 8. Best Fit Roles

List 2-3 specific role types they'd excel in based on their archetype and scores. Examples:
- "Technical Customer Success Manager for SaaS platform"
- "Enterprise CSM for complex B2B deals"
- "Implementation Specialist / Solutions Architect"
- "CS Operations / Strategy role"

---

# Output Format

Return ONLY valid JSON matching this structure:

\`\`\`json
{
  "dimensions": {
    "iq": 85,
    "eq": 78,
    "empathy": 82,
    "self_awareness": 75,
    "technical": 88,
    "ai_readiness": 92,
    "gtm": 80,
    "personality": 76,
    "motivation": 85,
    "work_history": 70,
    "passions": 80,
    "culture_fit": 88
  },
  "archetype": "Technical Builder",
  "archetype_confidence": "high",
  "overall_score": 83,
  "red_flags": ["Limited enterprise experience", "Could improve executive communication"],
  "green_flags": ["Exceptional AI prompt engineering", "Strong technical foundation", "High self-awareness"],
  "recommendation": "Strong technical CS professional with exceptional AI capabilities. Best suited for technical CSM roles with product-forward companies. Growth area: executive communication and strategic account planning.",
  "best_fit_roles": [
    "Technical Customer Success Manager for AI/ML platform",
    "Solutions Architect / Implementation Specialist",
    "Customer Success Engineer"
  ]
}
\`\`\`

**Important:**
- Be rigorous and evidence-based
- Don't inflate scores - be honest
- AI Readiness is critical - score prompt quality carefully
- Look for ACTUAL skills demonstrated, not just claimed
- Consider culture fit for a fast-paced, AI-forward CS team`;
}

function formatRubric(dimension: string): string {
  const rubric = SCORING_RUBRICS.find((r) => r.dimension === dimension);
  if (!rubric) return '';

  return rubric.scoreRanges
    .map(
      (range) => `
**${range.range}**
${range.indicators.map((i) => `- ${i}`).join('\n')}
`
    )
    .join('\n');
}

// Parse AI response into structured format
export function parseAssessmentResponse(response: string): any {
  try {
    // Extract JSON from response (may have markdown code blocks)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/{[\s\S]*}/);

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
