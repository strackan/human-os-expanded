/**
 * LLM Assessment Schema & Validation
 *
 * Claude provides semantic evaluation, algorithm validates for bias
 * and quantifies the assessment against transcript evidence.
 *
 * Flow:
 * 1. Claude observes during interview
 * 2. Claude submits LLMAssessment with scores and observations
 * 3. Algorithm validates against transcript evidence
 * 4. Bias-adjusted final scores produced
 */

import { z } from 'zod';
import type { InterviewDimension, DimensionScore, CandidateArchetype, InterviewTier } from '../types/index.js';
import type { AssessmentResult, TranscriptEntry } from './types.js';
import { ATTRIBUTES } from './attributes.js';
import { scoreInterview, classifyArchetype, interviewScorer } from '../scoring/index.js';
import { analyzeTextEmotion } from '../core/index.js';

// =============================================================================
// LLM ASSESSMENT SCHEMA
// =============================================================================

/**
 * Schema for Claude's assessment submission
 */
export const LLMAssessmentSchema = z.object({
  // Dimension scores (Claude's semantic evaluation)
  dimensions: z.object({
    iq: z.number().min(0).max(10).describe('Cognitive ability, problem-solving, analytical thinking'),
    personality: z.number().min(0).max(10).describe('Communication style, presence, authenticity'),
    motivation: z.number().min(0).max(10).describe('Drive, energy, commitment to goals'),
    work_history: z.number().min(0).max(10).describe('Track record, accomplishments, growth'),
    passions: z.number().min(0).max(10).describe('Interests, curiosity, what energizes them'),
    culture_fit: z.number().min(0).max(10).describe('Values alignment, team dynamics, adaptability'),
    technical: z.number().min(0).max(10).describe('Technical knowledge, skills, depth'),
    gtm: z.number().min(0).max(10).describe('Go-to-market sense, commercial awareness'),
    eq: z.number().min(0).max(10).describe('Emotional intelligence, empathy, self-regulation'),
    empathy: z.number().min(0).max(10).describe('Understanding others, perspective-taking'),
    self_awareness: z.number().min(0).max(10).describe('Self-knowledge, growth mindset, blind spots'),
  }),

  // Archetype classification
  archetype: z.object({
    primary: z.enum([
      'technical_builder',
      'gtm_operator',
      'creative_strategist',
      'execution_machine',
      'generalist_orchestrator',
      'domain_expert',
    ]).describe('Primary candidate archetype'),
    confidence: z.number().min(0).max(1).describe('Confidence in classification (0-1)'),
    reasoning: z.string().describe('Why this archetype fits'),
  }),

  // Observed attributes (what Claude saw evidence for)
  observedAttributes: z.array(z.object({
    attributeId: z.string(),
    confidence: z.number().min(0).max(1),
    evidence: z.string().describe('Quote or observation supporting this'),
  })),

  // Flags
  greenFlags: z.array(z.string()).describe('Positive signals observed'),
  redFlags: z.array(z.string()).describe('Concerning signals observed'),

  // Overall assessment
  overallImpression: z.string().describe('1-2 sentence summary of the candidate'),
  recommendedTier: z.enum(['top_1%', 'strong', 'moderate', 'weak', 'pass']),

  // Voice Profile (feeds into 10 Commandments system)
  voiceProfile: z.object({
    // THEMES - Core topics they gravitate toward
    themes: z.array(z.string()).describe('3-5 recurring themes or topics they care about deeply'),

    // VOICE - Communication style
    voice: z.object({
      tone: z.enum(['formal', 'casual', 'technical', 'storytelling', 'analytical', 'inspirational']),
      pace: z.enum(['fast', 'measured', 'deliberate']),
      vocabulary: z.enum(['simple', 'sophisticated', 'jargon-heavy', 'mixed']),
      style: z.string().describe('2-3 sentence description of their communication style'),
    }),

    // GUARDRAILS - Values and boundaries
    guardrails: z.array(z.string()).describe('What they won\'t compromise on, red lines, core values'),

    // STORIES - Significant narratives they shared
    stories: z.array(z.object({
      title: z.string().describe('Brief title for the story'),
      summary: z.string().describe('1-2 sentence summary'),
      theme: z.string().describe('What this story reveals about them'),
    })).describe('Key stories or experiences they shared'),

    // ANECDOTES - Shorter memorable moments
    anecdotes: z.array(z.string()).describe('Brief memorable quotes or moments from the conversation'),

    // BLENDS - Unique combinations that define them
    blends: z.array(z.string()).describe('Unique combinations of traits or interests (e.g., "engineer + philosopher")'),

    // Personality signals for identity profile
    personalitySignals: z.object({
      energySource: z.enum(['introvert', 'extrovert', 'ambivert']),
      decisionStyle: z.enum(['analytical', 'intuitive', 'collaborative', 'decisive']),
      workStyle: z.enum(['structured', 'flexible', 'hybrid']),
      conflictApproach: z.enum(['direct', 'diplomatic', 'avoidant', 'mediator']),
    }),
  }).optional().describe('Voice and personality signals for identity system'),
});

export type LLMAssessment = z.infer<typeof LLMAssessmentSchema>;

// =============================================================================
// BIAS DETECTION & VALIDATION
// =============================================================================

interface ValidationResult {
  isValid: boolean;
  biasWarnings: string[];
  adjustedScores: Record<InterviewDimension, number>;
  confidenceAdjustment: number;  // -1 to +1 adjustment factor
}

/**
 * Validate Claude's assessment against transcript evidence
 */
export function validateAssessment(
  llmAssessment: LLMAssessment,
  transcript: TranscriptEntry[]
): ValidationResult {
  const biasWarnings: string[] = [];
  const adjustedScores = { ...llmAssessment.dimensions } as Record<InterviewDimension, number>;

  // Aggregate transcript for algorithmic analysis
  const candidateText = transcript
    .filter(e => e.speaker === 'candidate')
    .map(e => e.text)
    .join(' ');

  // Get algorithmic baseline scores
  const algorithmicScore = scoreInterview(candidateText, { includeFlags: true });

  // Compare Claude's scores to algorithmic baseline
  const BIAS_THRESHOLD = 2.5; // Flag if Claude differs by more than 2.5 points

  for (const [dim, llmScore] of Object.entries(llmAssessment.dimensions)) {
    const algoScore = algorithmicScore.dimensions[dim as InterviewDimension]?.score || 5;
    const diff = llmScore - algoScore;

    if (Math.abs(diff) > BIAS_THRESHOLD) {
      if (diff > BIAS_THRESHOLD) {
        biasWarnings.push(`${dim}: Claude scored ${llmScore.toFixed(1)}, algorithm scored ${algoScore.toFixed(1)} - potential positive bias`);
        // Adjust toward algorithm (blend 70% Claude, 30% algorithm when biased)
        adjustedScores[dim as InterviewDimension] = llmScore * 0.7 + algoScore * 0.3;
      } else {
        biasWarnings.push(`${dim}: Claude scored ${llmScore.toFixed(1)}, algorithm scored ${algoScore.toFixed(1)} - potential negative bias`);
        adjustedScores[dim as InterviewDimension] = llmScore * 0.7 + algoScore * 0.3;
      }
    }
  }

  // Check for red flag consistency
  const algoRedFlags = algorithmicScore.redFlags;
  const llmRedFlags = llmAssessment.redFlags;

  // If algorithm detected red flags Claude missed, add warning
  for (const flag of algoRedFlags) {
    const flagWords = flag.toLowerCase().split(' ');
    const llmHasRelated = llmRedFlags.some(f =>
      flagWords.some(w => f.toLowerCase().includes(w))
    );
    if (!llmHasRelated) {
      biasWarnings.push(`Algorithm detected "${flag}" but Claude didn't flag it`);
    }
  }

  // Check for green flag inflation
  if (llmAssessment.greenFlags.length > 5 && algoRedFlags.length > 2) {
    biasWarnings.push('Claude may be overlooking red flags in favor of green flags');
  }

  // Calculate confidence adjustment based on agreement
  const agreementScores = Object.entries(llmAssessment.dimensions).map(([dim, score]) => {
    const algoScore = algorithmicScore.dimensions[dim as InterviewDimension]?.score || 5;
    return 1 - Math.abs(score - algoScore) / 10;
  });
  const avgAgreement = agreementScores.reduce((a, b) => a + b, 0) / agreementScores.length;
  const confidenceAdjustment = (avgAgreement - 0.5) * 2; // Scale to -1 to +1

  return {
    isValid: biasWarnings.length === 0,
    biasWarnings,
    adjustedScores,
    confidenceAdjustment,
  };
}

// =============================================================================
// HYBRID ASSESSMENT BUILDER
// =============================================================================

/**
 * Build final assessment from Claude's evaluation + algorithmic validation
 */
export function buildHybridAssessment(
  candidateName: string,
  transcript: TranscriptEntry[],
  llmAssessment: LLMAssessment,
  startedAt: Date
): { assessment: AssessmentResult; validation: ValidationResult } {
  const now = new Date();
  const durationMs = now.getTime() - startedAt.getTime();

  // Validate Claude's assessment
  const validation = validateAssessment(llmAssessment, transcript);

  // Build dimension scores with adjustments
  const dimensions: Record<InterviewDimension, DimensionScore> = {} as any;
  for (const [dim, score] of Object.entries(validation.adjustedScores)) {
    dimensions[dim as InterviewDimension] = {
      dimension: dim as InterviewDimension,
      score,
      signals: [],  // Filled by algorithm
      confidence: llmAssessment.archetype.confidence * (1 + validation.confidenceAdjustment * 0.2),
    };
  }

  // Get transcript text for additional analysis
  const candidateText = transcript
    .filter(e => e.speaker === 'candidate')
    .map(e => e.text)
    .join(' ');

  // Get competency profile from algorithm
  const competencyProfile = interviewScorer.detectCompetencySignals(candidateText);

  // Validate archetype against algorithmic classification
  const algoArchetype = classifyArchetype(dimensions, competencyProfile);

  // Use Claude's archetype if confidence is high, otherwise blend
  const finalArchetype = llmAssessment.archetype.confidence >= 0.7
    ? llmAssessment.archetype.primary
    : algoArchetype.primary;

  // Analyze emotions
  const emotionAnalysis = analyzeTextEmotion(candidateText);

  // Calculate overall score
  const overallScore = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0) / 11;

  // Determine tier (blend Claude's recommendation with score-based)
  const scoreTier: InterviewTier =
    overallScore >= 8.5 ? 'top_1%' :
    overallScore >= 7 ? 'strong' :
    overallScore >= 5 ? 'moderate' :
    overallScore >= 3 ? 'weak' : 'pass';

  // If Claude and algorithm agree on tier, use it; otherwise use score-based
  const finalTier = llmAssessment.recommendedTier === scoreTier
    ? scoreTier
    : scoreTier;  // Prefer score-based for consistency

  // Merge flags (Claude's flags + any algorithm-detected ones Claude missed)
  const algorithmicScore = scoreInterview(candidateText, { includeFlags: true });
  const greenFlags = [...new Set([...llmAssessment.greenFlags, ...algorithmicScore.greenFlags])];
  const redFlags = [...new Set([...llmAssessment.redFlags, ...algorithmicScore.redFlags])];

  const assessment: AssessmentResult = {
    candidateName,
    transcript,
    dimensions,
    competencies: competencyProfile,
    emotions: emotionAnalysis,
    archetype: {
      primary: finalArchetype as CandidateArchetype,
      secondary: algoArchetype.secondary,
      confidence: Math.min(
        llmAssessment.archetype.confidence,
        algoArchetype.primaryScore
      ) * (1 + validation.confidenceAdjustment * 0.1),
      allScores: algoArchetype.allScores,
    },
    tier: finalTier,
    overallScore,
    greenFlags,
    redFlags,
    completedAt: now,
    durationMs,
  };

  return { assessment, validation };
}

// =============================================================================
// PROMPT FOR CLAUDE
// =============================================================================

/**
 * Generate the assessment prompt for Claude
 */
export function generateAssessmentPrompt(attributeSetId: string): string {
  return `
## Interview Assessment

Now that the interview is complete, provide your assessment using this schema:

\`\`\`json
{
  "dimensions": {
    "iq": <0-10>,           // Cognitive ability, problem-solving
    "personality": <0-10>,   // Communication, presence, authenticity
    "motivation": <0-10>,    // Drive, energy, commitment
    "work_history": <0-10>,  // Track record, accomplishments
    "passions": <0-10>,      // Interests, curiosity
    "culture_fit": <0-10>,   // Values alignment, team dynamics
    "technical": <0-10>,     // Technical knowledge and skills
    "gtm": <0-10>,           // Commercial awareness
    "eq": <0-10>,            // Emotional intelligence
    "empathy": <0-10>,       // Understanding others
    "self_awareness": <0-10> // Self-knowledge, growth mindset
  },
  "archetype": {
    "primary": "<technical_builder|gtm_operator|creative_strategist|execution_machine|generalist_orchestrator|domain_expert>",
    "confidence": <0-1>,
    "reasoning": "<why this archetype>"
  },
  "observedAttributes": [
    { "attributeId": "<id>", "confidence": <0-1>, "evidence": "<quote or observation>" }
  ],
  "greenFlags": ["<positive signal 1>", "<positive signal 2>"],
  "redFlags": ["<concerning signal 1>"],
  "overallImpression": "<1-2 sentence summary>",
  "recommendedTier": "<top_1%|strong|moderate|weak|pass>",
  "voiceProfile": {
    "themes": ["<recurring topic 1>", "<recurring topic 2>", "<recurring topic 3>"],
    "voice": {
      "tone": "<formal|casual|technical|storytelling|analytical|inspirational>",
      "pace": "<fast|measured|deliberate>",
      "vocabulary": "<simple|sophisticated|jargon-heavy|mixed>",
      "style": "<2-3 sentence description of their communication style>"
    },
    "guardrails": ["<value/red line 1>", "<value/red line 2>"],
    "stories": [
      { "title": "<story title>", "summary": "<1-2 sentences>", "theme": "<what it reveals>" }
    ],
    "anecdotes": ["<memorable quote or moment>"],
    "blends": ["<unique combination, e.g., 'engineer + philosopher'>"],
    "personalitySignals": {
      "energySource": "<introvert|extrovert|ambivert>",
      "decisionStyle": "<analytical|intuitive|collaborative|decisive>",
      "workStyle": "<structured|flexible|hybrid>",
      "conflictApproach": "<direct|diplomatic|avoidant|mediator>"
    }
  }
}
\`\`\`

**Scoring Guide:**
- 9-10: Exceptional, top 1% in this dimension
- 7-8: Strong, clearly above average
- 5-6: Moderate, meets expectations
- 3-4: Below average, concerning
- 0-2: Significant issues

**Voice Profile Guide:**
- **themes**: What topics did they keep returning to? What clearly matters to them?
- **voice**: How do they communicate? Fast-paced and casual, or measured and formal?
- **guardrails**: What values or principles did they express as non-negotiable?
- **stories**: What significant experiences or narratives did they share?
- **anecdotes**: Any memorable quotes or moments worth capturing?
- **blends**: What unique combinations define them? (e.g., "data scientist + artist")
- **personalitySignals**: Observable patterns in how they think and operate

**Be honest and calibrated.** Your assessment will be validated against transcript evidence.
`;
}
