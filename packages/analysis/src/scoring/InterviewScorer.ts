/**
 * Interview Scorer
 *
 * Scores interview transcripts across 11 dimensions:
 * IQ, Personality, Motivation, Work History, Passions,
 * Culture Fit, Technical, GTM, EQ, Empathy, Self-Awareness
 *
 * Combines emotion analysis with competency signal detection
 * to produce comprehensive interview assessments.
 */

import type {
  InterviewDimension,
  DimensionScore,
  InterviewScore,
  InterviewTier,
  TextEmotionAnalysis,
  CompetencySignal,
  DetectedSignal,
  CompetencyProfile,
  ScoringOptions,
  Lexicon,
} from '../types/index.js';
import { EmotionAnalyzer } from '../core/EmotionAnalyzer.js';
import { COMPETENCY_LEXICON, type CompetencyLexicon } from '../lexicons/competency-lexicon.js';

// =============================================================================
// DIMENSION WEIGHTS & MAPPINGS
// =============================================================================

/**
 * Default weights for each dimension in overall score calculation
 */
const DEFAULT_DIMENSION_WEIGHTS: Record<InterviewDimension, number> = {
  iq: 1.0,
  personality: 0.9,
  motivation: 1.0,
  work_history: 0.9,
  passions: 0.7,
  culture_fit: 0.8,
  technical: 1.0,
  gtm: 0.8,
  eq: 0.9,
  empathy: 0.8,
  self_awareness: 0.9,
};

/**
 * Maps competency signals to interview dimensions
 */
const SIGNAL_TO_DIMENSION: Record<CompetencySignal, InterviewDimension[]> = {
  leadership: ['work_history', 'personality', 'eq'],
  technical: ['technical', 'iq'],
  communication: ['personality', 'eq', 'gtm'],
  problem_solving: ['iq', 'technical'],
  accountability: ['personality', 'work_history', 'self_awareness'],
  growth_mindset: ['self_awareness', 'motivation'],
  collaboration: ['culture_fit', 'eq', 'empathy'],
  confidence: ['personality', 'gtm'],
  stress_response: ['eq', 'personality'],
};

/**
 * Tier thresholds based on overall score
 */
const TIER_THRESHOLDS: { tier: InterviewTier; minScore: number }[] = [
  { tier: 'top_1%', minScore: 8.5 },
  { tier: 'strong', minScore: 7.0 },
  { tier: 'moderate', minScore: 5.5 },
  { tier: 'weak', minScore: 4.0 },
  { tier: 'pass', minScore: 0 },
];

/**
 * Red flag keywords that indicate problems
 */
const RED_FLAG_KEYWORDS: Record<string, { penalty: number; flag: string }> = {
  // Blame-shifting
  'not my fault': { penalty: 0.5, flag: 'Avoids accountability' },
  'they didn\'t': { penalty: 0.3, flag: 'Blame-shifting language' },
  'wasn\'t my responsibility': { penalty: 0.5, flag: 'Avoids ownership' },
  'someone else': { penalty: 0.2, flag: 'Deflection' },
  'they were fine': { penalty: 0.3, flag: 'Dismissive of team' },
  'had to push them': { penalty: 0.4, flag: 'Poor collaboration' },
  'had to be the bad guy': { penalty: 0.4, flag: 'Adversarial approach' },
  'gold-plate': { penalty: 0.2, flag: 'Dismissive of quality' },

  // Manipulation/Extraction
  'between us': { penalty: 0.4, flag: 'Boundary issues' },
  'off the record': { penalty: 0.4, flag: 'Boundary issues' },
  'confidential': { penalty: 0.2, flag: 'Information seeking' },
  'secrets': { penalty: 0.4, flag: 'Inappropriate probing' },
  'dirt': { penalty: 0.5, flag: 'Unethical behavior' },
  'extract': { penalty: 0.3, flag: 'Manipulation signals' },
  'trade secrets': { penalty: 0.5, flag: 'Unethical information seeking' },

  // Ethics concerns
  'whatever it takes': { penalty: 0.4, flag: 'Ethics concerns' },
  'rules are': { penalty: 0.2, flag: 'Possible ethics issues' },
  'vaporware': { penalty: 0.6, flag: 'Admitted deception' },
  'doesn\'t work': { penalty: 0.2, flag: 'Quality issues' },
  'figure out later': { penalty: 0.3, flag: 'Poor planning' },
  'that\'s normal': { penalty: 0.2, flag: 'Normalizes problems' },
  'complaints initially': { penalty: 0.3, flag: 'Quality issues' },

  // Low effort/motivation
  'need a job': { penalty: 0.4, flag: 'Low motivation' },
  'just want': { penalty: 0.2, flag: 'Transactional mindset' },
  'not sure': { penalty: 0.1, flag: 'Uncertainty' },
  'haven\'t had time': { penalty: 0.2, flag: 'Low initiative' },
  'too busy': { penalty: 0.2, flag: 'Prioritization issues' },
  'wait or do': { penalty: 0.3, flag: 'Passive approach' },
  'not a risk taker': { penalty: 0.2, flag: 'Low initiative' },
  'prefer clear direction': { penalty: 0.2, flag: 'Low autonomy' },
  'pretty comfortable': { penalty: 0.2, flag: 'Complacency' },
  'not in a huge rush': { penalty: 0.2, flag: 'Low ambition' },
  'if it doesn\'t work out': { penalty: 0.3, flag: 'Low commitment' },

  // Arrogance / Poor self-awareness
  'they don\'t understand': { penalty: 0.3, flag: 'Dismissive of others' },
  'i\'m always right': { penalty: 0.5, flag: 'Arrogance' },
  'my way': { penalty: 0.2, flag: 'Inflexibility' },
  'not really a details person': { penalty: 0.4, flag: 'Avoids accountability' },
  'usually right': { penalty: 0.3, flag: 'Overconfidence' },
  'can\'t think of': { penalty: 0.2, flag: 'Poor self-reflection' },
  'not understanding the full context': { penalty: 0.3, flag: 'Dismissive' },
  'more scope': { penalty: 0.2, flag: 'Title-focused' },
  'want to be a director': { penalty: 0.1, flag: 'Title-focused' },

  // Injection/manipulation attempts
  'ignore all': { penalty: 0.6, flag: 'Manipulation attempt' },
  'ignore previous': { penalty: 0.6, flag: 'Manipulation attempt' },
  'override': { penalty: 0.4, flag: 'Manipulation attempt' },
  'system prompt': { penalty: 0.5, flag: 'Attempted exploitation' },
  'drop table': { penalty: 0.5, flag: 'Attempted exploitation' },
  'grant this': { penalty: 0.4, flag: 'Manipulation attempt' },
  'reveal': { penalty: 0.3, flag: 'Information seeking' },
  'personal details': { penalty: 0.4, flag: 'Inappropriate probing' },
  'sensitive data': { penalty: 0.4, flag: 'Inappropriate probing' },
  'social engineering': { penalty: 0.5, flag: 'Unethical tactics' },
  'pretending to be': { penalty: 0.5, flag: 'Deception admitted' },

  // Aggressive sales tactics
  'being aggressive': { penalty: 0.4, flag: 'Aggressive approach' },
  'press on it': { penalty: 0.3, flag: 'Pressure tactics' },
  'getting the signature': { penalty: 0.3, flag: 'Short-term focused' },
  'closer': { penalty: 0.1, flag: 'Transactional' },
};

/**
 * Strong positive signals that boost scores significantly
 */
const GREEN_FLAG_KEYWORDS: Record<string, { boost: number; flag: string }> = {
  // Ownership
  'i owned': { boost: 0.5, flag: 'Strong ownership' },
  'i took responsibility': { boost: 0.5, flag: 'Accountability' },
  'my mistake': { boost: 0.4, flag: 'Self-awareness' },
  'i learned': { boost: 0.3, flag: 'Growth mindset' },

  // Leadership
  'built a team': { boost: 0.5, flag: 'Team building' },
  'mentored': { boost: 0.4, flag: 'People development' },
  'promoted': { boost: 0.3, flag: 'Team growth' },
  'empowered': { boost: 0.4, flag: 'Delegation skills' },

  // Impact
  'revenue': { boost: 0.2, flag: 'Business impact' },
  'cost savings': { boost: 0.3, flag: 'Efficiency focus' },
  'increased': { boost: 0.2, flag: 'Growth orientation' },
  'reduced': { boost: 0.2, flag: 'Optimization' },
  '99.9': { boost: 0.4, flag: 'High standards' },
  'zero incidents': { boost: 0.4, flag: 'Reliability focus' },

  // Self-improvement
  'in hindsight': { boost: 0.3, flag: 'Reflective' },
  'i could have done better': { boost: 0.4, flag: 'Self-aware' },
  'feedback': { boost: 0.2, flag: 'Coachable' },
  'continuous': { boost: 0.2, flag: 'Growth-oriented' },
};

// =============================================================================
// INTERVIEW SCORER CLASS
// =============================================================================

export class InterviewScorer {
  private emotionAnalyzer: EmotionAnalyzer;
  private competencyLexicon: CompetencyLexicon;
  private dimensionWeights: Record<InterviewDimension, number>;

  constructor(options?: {
    customEmotionLexicon?: Lexicon;
    customCompetencyLexicon?: CompetencyLexicon;
    dimensionWeights?: Partial<Record<InterviewDimension, number>>;
  }) {
    this.emotionAnalyzer = new EmotionAnalyzer(options?.customEmotionLexicon);
    this.competencyLexicon = options?.customCompetencyLexicon || COMPETENCY_LEXICON;
    this.dimensionWeights = {
      ...DEFAULT_DIMENSION_WEIGHTS,
      ...options?.dimensionWeights,
    };
  }

  /**
   * Score an interview transcript
   */
  scoreInterview(transcript: string, options?: ScoringOptions): InterviewScore {
    // 1. Run emotion analysis
    const emotionalProfile = this.emotionAnalyzer.analyzeText(transcript);

    // 2. Detect competency signals
    const competencyProfile = this.detectCompetencySignals(transcript);

    // 3. Detect red and green flag keywords
    const { flagBoost, flagPenalty, detectedGreenFlags, detectedRedFlags } =
      this.detectFlagKeywords(transcript);

    // 4. Score each dimension
    const dimensions = this.scoreDimensions(
      transcript,
      emotionalProfile,
      competencyProfile,
      options
    );

    // 5. Calculate overall score with flag adjustments
    let { overallScore, overallConfidence } = this.calculateOverallScore(dimensions);

    // Apply flag adjustments
    overallScore = overallScore + flagBoost - flagPenalty;
    overallScore = Math.max(0, Math.min(10, overallScore));

    // 6. Determine tier
    const { tier, tierConfidence } = this.determineTier(overallScore, overallConfidence);

    // 7. Extract flags (combine dimension flags with keyword flags)
    const { greenFlags: dimGreenFlags, redFlags: dimRedFlags } = this.extractFlags(dimensions);
    const greenFlags = [...new Set([...dimGreenFlags, ...detectedGreenFlags])].slice(0, 5);
    const redFlags = [...new Set([...dimRedFlags, ...detectedRedFlags])].slice(0, 5);

    // 8. Generate summary
    const summary = this.generateSummary(dimensions, tier, emotionalProfile);

    return {
      dimensions,
      overallScore,
      overallConfidence,
      emotionalProfile,
      tier,
      tierConfidence,
      summary,
      greenFlags,
      redFlags,
    };
  }

  /**
   * Detect red and green flag keywords in transcript
   */
  private detectFlagKeywords(transcript: string): {
    flagBoost: number;
    flagPenalty: number;
    detectedGreenFlags: string[];
    detectedRedFlags: string[];
  } {
    const lowerTranscript = transcript.toLowerCase();
    let flagBoost = 0;
    let flagPenalty = 0;
    const detectedGreenFlags: string[] = [];
    const detectedRedFlags: string[] = [];

    // Check red flags
    for (const [keyword, { penalty, flag }] of Object.entries(RED_FLAG_KEYWORDS)) {
      if (lowerTranscript.includes(keyword)) {
        flagPenalty += penalty;
        if (!detectedRedFlags.includes(flag)) {
          detectedRedFlags.push(flag);
        }
      }
    }

    // Check green flags
    for (const [keyword, { boost, flag }] of Object.entries(GREEN_FLAG_KEYWORDS)) {
      if (lowerTranscript.includes(keyword)) {
        flagBoost += boost;
        if (!detectedGreenFlags.includes(flag)) {
          detectedGreenFlags.push(flag);
        }
      }
    }

    return { flagBoost, flagPenalty, detectedGreenFlags, detectedRedFlags };
  }

  /**
   * Detect competency signals in text
   */
  detectCompetencySignals(text: string): CompetencyProfile {
    const words = this.tokenize(text);
    const detectedSignals: DetectedSignal[] = [];
    const seen = new Set<string>();

    // Check single words
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/^['-]+|['-]+$/g, '');
      if (this.competencyLexicon[cleanWord] && !seen.has(cleanWord)) {
        const entry = this.competencyLexicon[cleanWord];
        detectedSignals.push({
          signal: entry.signal,
          word: cleanWord,
          weight: entry.weight,
          context: entry.context,
        });
        seen.add(cleanWord);
      }
    }

    // Check bigrams and trigrams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`.toLowerCase();
      if (this.competencyLexicon[bigram] && !seen.has(bigram)) {
        const entry = this.competencyLexicon[bigram];
        detectedSignals.push({
          signal: entry.signal,
          word: bigram,
          weight: entry.weight,
          context: entry.context,
        });
        seen.add(bigram);
      }

      if (i < words.length - 2) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.toLowerCase();
        if (this.competencyLexicon[trigram] && !seen.has(trigram)) {
          const entry = this.competencyLexicon[trigram];
          detectedSignals.push({
            signal: entry.signal,
            word: trigram,
            weight: entry.weight,
            context: entry.context,
          });
          seen.add(trigram);
        }
      }
    }

    // Aggregate into signal scores
    const signals: Record<CompetencySignal, number> = {
      leadership: 0,
      technical: 0,
      communication: 0,
      problem_solving: 0,
      accountability: 0,
      growth_mindset: 0,
      collaboration: 0,
      confidence: 0,
      stress_response: 0,
    };

    for (const detected of detectedSignals) {
      signals[detected.signal] = Math.min(1, signals[detected.signal] + detected.weight * 0.35);
    }

    // Get top 3 signals
    const sortedSignals = Object.entries(signals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([signal]) => signal as CompetencySignal);

    return {
      signals,
      detectedSignals,
      dominantSignals: sortedSignals,
    };
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private scoreDimensions(
    transcript: string,
    emotionalProfile: TextEmotionAnalysis,
    competencyProfile: CompetencyProfile,
    options?: ScoringOptions
  ): Record<InterviewDimension, DimensionScore> {
    const dimensions: Partial<Record<InterviewDimension, DimensionScore>> = {};

    // Score each dimension based on signals and emotional profile
    const allDimensions: InterviewDimension[] = [
      'iq', 'personality', 'motivation', 'work_history', 'passions',
      'culture_fit', 'technical', 'gtm', 'eq', 'empathy', 'self_awareness'
    ];

    for (const dimension of allDimensions) {
      dimensions[dimension] = this.scoreSingleDimension(
        dimension,
        transcript,
        emotionalProfile,
        competencyProfile,
        options
      );
    }

    return dimensions as Record<InterviewDimension, DimensionScore>;
  }

  private scoreSingleDimension(
    dimension: InterviewDimension,
    transcript: string,
    emotionalProfile: TextEmotionAnalysis,
    competencyProfile: CompetencyProfile,
    options?: ScoringOptions
  ): DimensionScore {
    let baseScore = 5.0; // Start at neutral
    let confidence = 0.5;
    const signals: string[] = [];
    const greenFlags: string[] = [];
    const redFlags: string[] = [];

    // Find relevant competency signals for this dimension
    for (const [signal, dims] of Object.entries(SIGNAL_TO_DIMENSION)) {
      if (dims.includes(dimension)) {
        const signalScore = competencyProfile.signals[signal as CompetencySignal];
        if (signalScore > 0) {
          // Stronger signal impact: +3 points for max signal
          baseScore += signalScore * 3;
          confidence += signalScore * 0.15;
          signals.push(`${signal}: ${(signalScore * 10).toFixed(1)}`);

          if (signalScore > 0.5) {
            greenFlags.push(`Strong ${signal.replace('_', ' ')} signals`);
          }
        }
      }
    }

    // Apply emotional modifiers based on dimension
    baseScore = this.applyEmotionalModifiers(dimension, baseScore, emotionalProfile, signals);

    // Clamp score to 0-10
    const score = Math.max(0, Math.min(10, baseScore));
    confidence = Math.max(0.3, Math.min(1, confidence));

    return {
      dimension,
      score,
      confidence,
      signals,
      flags: options?.includeFlags ? { green: greenFlags, red: redFlags } : undefined,
    };
  }

  private applyEmotionalModifiers(
    dimension: InterviewDimension,
    baseScore: number,
    emotionalProfile: TextEmotionAnalysis,
    signals: string[]
  ): number {
    let score = baseScore;

    switch (dimension) {
      case 'motivation':
        // High anticipation/joy boosts motivation
        if (emotionalProfile.plutchikVector.anticipation > 0.5) {
          score += 1;
          signals.push('High anticipation detected');
        }
        if (emotionalProfile.plutchikVector.joy > 0.5) {
          score += 0.5;
          signals.push('Positive affect');
        }
        break;

      case 'eq':
      case 'empathy':
        // Trust signals boost EQ/empathy
        if (emotionalProfile.plutchikVector.trust > 0.5) {
          score += 1;
          signals.push('Trust signals present');
        }
        // High anger/disgust reduces EQ score
        if (emotionalProfile.plutchikVector.anger > 0.5) {
          score -= 1;
          signals.push('Elevated anger detected');
        }
        break;

      case 'self_awareness':
        // High emotional density suggests self-reflection
        if (emotionalProfile.emotionDensity > 0.05) {
          score += 0.5;
          signals.push('Rich emotional vocabulary');
        }
        break;

      case 'passions':
        // High arousal + joy indicates passion
        if (emotionalProfile.arousal > 0.6 && emotionalProfile.valence > 0.3) {
          score += 1;
          signals.push('High engagement detected');
        }
        break;

      case 'culture_fit':
        // High trust + collaboration signals
        if (emotionalProfile.plutchikVector.trust > 0.3) {
          score += 0.5;
          signals.push('Collaborative tone');
        }
        break;
    }

    return score;
  }

  private calculateOverallScore(
    dimensions: Record<InterviewDimension, DimensionScore>
  ): { overallScore: number; overallConfidence: number } {
    let weightedSum = 0;
    let totalWeight = 0;
    let confidenceSum = 0;

    for (const [dim, score] of Object.entries(dimensions)) {
      const weight = this.dimensionWeights[dim as InterviewDimension];
      weightedSum += score.score * weight;
      totalWeight += weight;
      confidenceSum += score.confidence;
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 5;
    const overallConfidence = confidenceSum / Object.keys(dimensions).length;

    return { overallScore, overallConfidence };
  }

  private determineTier(
    score: number,
    confidence: number
  ): { tier: InterviewTier; tierConfidence: number } {
    for (const { tier, minScore } of TIER_THRESHOLDS) {
      if (score >= minScore) {
        // Tier confidence is based on how close we are to the next threshold
        const tierConfidence = confidence * (1 - Math.abs(score - minScore - 1) * 0.1);
        return { tier, tierConfidence: Math.max(0.3, tierConfidence) };
      }
    }
    return { tier: 'pass', tierConfidence: confidence };
  }

  private extractFlags(
    dimensions: Record<InterviewDimension, DimensionScore>
  ): { greenFlags: string[]; redFlags: string[] } {
    const greenFlags: string[] = [];
    const redFlags: string[] = [];

    for (const [dim, score] of Object.entries(dimensions)) {
      if (score.score >= 8) {
        greenFlags.push(`Excellent ${dim.replace('_', ' ')}`);
      } else if (score.score <= 3) {
        redFlags.push(`Weak ${dim.replace('_', ' ')}`);
      }

      if (score.flags) {
        greenFlags.push(...score.flags.green);
        redFlags.push(...score.flags.red);
      }
    }

    return {
      greenFlags: [...new Set(greenFlags)].slice(0, 5),
      redFlags: [...new Set(redFlags)].slice(0, 5),
    };
  }

  private generateSummary(
    dimensions: Record<InterviewDimension, DimensionScore>,
    tier: InterviewTier,
    emotionalProfile: TextEmotionAnalysis
  ): string {
    const scores = Object.entries(dimensions)
      .sort(([, a], [, b]) => b.score - a.score);

    const topDimensions = scores.slice(0, 3).map(([d]) => d.replace('_', ' '));
    const weakDimensions = scores.filter(([, s]) => s.score < 5).map(([d]) => d.replace('_', ' '));

    const tierDescription = {
      'top_1%': 'Exceptional candidate',
      'strong': 'Strong candidate',
      'moderate': 'Moderate candidate',
      'weak': 'Below average candidate',
      'pass': 'Does not meet minimum criteria',
    };

    let summary = `${tierDescription[tier]}. `;
    summary += `Strongest areas: ${topDimensions.join(', ')}. `;

    if (weakDimensions.length > 0) {
      summary += `Areas needing development: ${weakDimensions.slice(0, 3).join(', ')}. `;
    }

    summary += `Dominant emotional tone: ${emotionalProfile.dominantEmotion}`;
    if (emotionalProfile.valence > 0.3) {
      summary += ' (positive)';
    } else if (emotionalProfile.valence < -0.3) {
      summary += ' (concerning)';
    }
    summary += '.';

    return summary;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/['']/g, "'")
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }
}

// =============================================================================
// SINGLETON & CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Default scorer instance
 */
export const interviewScorer = new InterviewScorer();

/**
 * Quick scoring function
 */
export function scoreInterview(transcript: string, options?: ScoringOptions): InterviewScore {
  return interviewScorer.scoreInterview(transcript, options);
}
