/**
 * Good Hang Scorer
 *
 * Extends the InterviewScorer to support Good Hang's 14-dimension system:
 * - 11 core dimensions from InterviewScorer
 * - 3 additional: organization, executive_leadership, ai_readiness
 *
 * Features:
 * - Category-based scoring (Technical, Emotional, Creative)
 * - 0-100 raw scale with 0-10 normalized scores
 * - Good Hang tier system (top_1, benched, passed)
 * - Badge evaluation support
 */

import type {
  GoodHangDimension,
  GoodHangDimensionScore,
  GoodHangScore,
  GoodHangCategoryScores,
  GoodHangTier,
  GoodHangScoringOptions,
  TextEmotionAnalysis,
  CompetencyProfile,
  CompetencySignal,
  Lexicon,
  GOODHANG_DIMENSIONS,
} from '../types/index.js';
import { InterviewScorer } from './InterviewScorer.js';
import { EmotionAnalyzer } from '../core/EmotionAnalyzer.js';
import { COMPETENCY_LEXICON, type CompetencyLexicon } from '../lexicons/competency-lexicon.js';

// =============================================================================
// GOOD HANG DIMENSION WEIGHTS & MAPPINGS
// =============================================================================

/**
 * Default weights for each dimension in overall score calculation
 */
const GOODHANG_DIMENSION_WEIGHTS: Record<GoodHangDimension, number> = {
  // Core dimensions
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
  // Good Hang additions
  organization: 0.8,
  executive_leadership: 0.9,
  ai_readiness: 1.0,
};

/**
 * Good Hang tier thresholds (0-10 scale)
 */
const GOODHANG_TIER_THRESHOLDS: { tier: GoodHangTier; minScore: number }[] = [
  { tier: 'top_1', minScore: 8.5 },
  { tier: 'benched', minScore: 7.0 },
  { tier: 'passed', minScore: 0 },
];

/**
 * AI Readiness keywords for scoring
 */
const AI_READINESS_KEYWORDS: Record<string, { boost: number; signal: string }> = {
  'prompt engineering': { boost: 1.0, signal: 'Prompt engineering knowledge' },
  'chatgpt': { boost: 0.5, signal: 'Uses ChatGPT' },
  'claude': { boost: 0.5, signal: 'Uses Claude' },
  'gpt-4': { boost: 0.6, signal: 'Familiar with GPT-4' },
  'llm': { boost: 0.7, signal: 'LLM awareness' },
  'ai agent': { boost: 0.8, signal: 'AI agent knowledge' },
  'automation': { boost: 0.4, signal: 'Automation focus' },
  'api': { boost: 0.4, signal: 'API familiarity' },
  'copilot': { boost: 0.5, signal: 'Uses Copilot' },
  'fine-tuning': { boost: 0.8, signal: 'Advanced AI knowledge' },
  'embeddings': { boost: 0.7, signal: 'Vector embeddings knowledge' },
  'rag': { boost: 0.8, signal: 'RAG architecture knowledge' },
  'mcp': { boost: 0.9, signal: 'MCP protocol knowledge' },
  'langchain': { boost: 0.7, signal: 'LangChain familiarity' },
};

/**
 * Organization keywords for scoring
 */
const ORGANIZATION_KEYWORDS: Record<string, { boost: number; signal: string }> = {
  'prioritize': { boost: 0.5, signal: 'Prioritization skills' },
  'organized': { boost: 0.5, signal: 'Self-organization' },
  'system': { boost: 0.3, signal: 'Systems thinking' },
  'process': { boost: 0.4, signal: 'Process orientation' },
  'framework': { boost: 0.5, signal: 'Framework usage' },
  'playbook': { boost: 0.5, signal: 'Playbook development' },
  'template': { boost: 0.3, signal: 'Template usage' },
  'documentation': { boost: 0.4, signal: 'Documentation habits' },
  'tracking': { boost: 0.4, signal: 'Progress tracking' },
  'metrics': { boost: 0.5, signal: 'Metrics-driven' },
  'kpi': { boost: 0.5, signal: 'KPI awareness' },
  'dashboard': { boost: 0.4, signal: 'Dashboard usage' },
  'quarterly': { boost: 0.4, signal: 'Planning cadence' },
  'roadmap': { boost: 0.5, signal: 'Roadmap planning' },
};

/**
 * Executive Leadership keywords for scoring
 */
const EXECUTIVE_LEADERSHIP_KEYWORDS: Record<string, { boost: number; signal: string }> = {
  'executive': { boost: 0.5, signal: 'Executive experience' },
  'c-suite': { boost: 0.6, signal: 'C-suite exposure' },
  'board': { boost: 0.6, signal: 'Board experience' },
  'strategic': { boost: 0.5, signal: 'Strategic thinking' },
  'vision': { boost: 0.4, signal: 'Visionary' },
  'stakeholder': { boost: 0.5, signal: 'Stakeholder management' },
  'influence': { boost: 0.4, signal: 'Influence skills' },
  'sponsor': { boost: 0.5, signal: 'Executive sponsorship' },
  'alignment': { boost: 0.4, signal: 'Alignment focus' },
  'escalation': { boost: 0.3, signal: 'Escalation handling' },
  'presentation': { boost: 0.3, signal: 'Presentation skills' },
  'leadership': { boost: 0.4, signal: 'Leadership language' },
  'transformation': { boost: 0.5, signal: 'Transformation experience' },
  'budget': { boost: 0.4, signal: 'Budget responsibility' },
};

// =============================================================================
// GOOD HANG SCORER CLASS
// =============================================================================

export class GoodHangScorer {
  private coreScorer: InterviewScorer;
  private emotionAnalyzer: EmotionAnalyzer;
  private dimensionWeights: Record<GoodHangDimension, number>;

  constructor(options?: {
    customEmotionLexicon?: Lexicon;
    customCompetencyLexicon?: CompetencyLexicon;
    dimensionWeights?: Partial<Record<GoodHangDimension, number>>;
  }) {
    this.coreScorer = new InterviewScorer({
      customEmotionLexicon: options?.customEmotionLexicon,
      customCompetencyLexicon: options?.customCompetencyLexicon,
    });
    this.emotionAnalyzer = new EmotionAnalyzer(options?.customEmotionLexicon);
    this.dimensionWeights = {
      ...GOODHANG_DIMENSION_WEIGHTS,
      ...options?.dimensionWeights,
    };
  }

  /**
   * Score a Good Hang assessment transcript
   */
  scoreAssessment(
    transcript: string,
    sessionId: string,
    userId: string,
    options?: GoodHangScoringOptions
  ): GoodHangScore {
    // 1. Get core 11-dimension scores from InterviewScorer
    const coreScore = this.coreScorer.scoreInterview(transcript, {
      includeEmotional: true,
      includeCompetency: true,
      includeFlags: true,
    });

    // 2. Score the 3 additional Good Hang dimensions
    const competencyProfile = this.coreScorer.detectCompetencySignals(transcript);
    const additionalDimensions = this.scoreAdditionalDimensions(
      transcript,
      coreScore.emotionalProfile,
      competencyProfile
    );

    // 3. Combine all 14 dimensions
    const allDimensions = this.combineAllDimensions(coreScore.dimensions, additionalDimensions);

    // 4. Calculate category scores
    const categoryScores = this.calculateCategoryScores(allDimensions);

    // 5. Calculate overall score (0-10 normalized, 0-100 raw)
    const { overallScore, overallConfidence } = this.calculateOverallScore(allDimensions);
    const overallScoreRaw = overallScore * 10; // Convert to 0-100

    // 6. Determine tier
    const tier = this.determineTier(overallScore);

    // 7. Generate archetype (custom descriptor)
    const { archetype, archetypeConfidence } = this.classifyArchetype(allDimensions, categoryScores);

    // 8. Combine flags
    const greenFlags = [...coreScore.greenFlags];
    const redFlags = [...coreScore.redFlags];

    // Add dimension-specific flags
    for (const dim of Object.values(allDimensions)) {
      if (dim.score >= 8) {
        greenFlags.push(`Excellent ${dim.dimension.replace('_', ' ')}`);
      } else if (dim.score <= 3) {
        redFlags.push(`Weak ${dim.dimension.replace('_', ' ')}`);
      }
    }

    // 9. Generate summaries
    const publicSummary = this.generatePublicSummary(allDimensions, tier, archetype);
    const detailedSummary = this.generateDetailedSummary(allDimensions, categoryScores, tier);

    // 10. Generate recommendation and best-fit roles
    const { recommendation, bestFitRoles } = this.generateRecommendation(allDimensions, tier, archetype);

    return {
      sessionId,
      userId,
      dimensions: allDimensions,
      categoryScores,
      overallScore,
      overallScoreRaw,
      overallConfidence,
      emotionalProfile: coreScore.emotionalProfile,
      archetype,
      archetypeConfidence,
      tier,
      greenFlags: [...new Set(greenFlags)].slice(0, 5),
      redFlags: [...new Set(redFlags)].slice(0, 5),
      recommendation,
      bestFitRoles,
      badges: [], // Badges evaluated separately
      publicSummary,
      detailedSummary,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Score the 3 additional Good Hang dimensions
   */
  private scoreAdditionalDimensions(
    transcript: string,
    emotionalProfile: TextEmotionAnalysis,
    competencyProfile: CompetencyProfile
  ): Record<'organization' | 'executive_leadership' | 'ai_readiness', GoodHangDimensionScore> {
    const lowerTranscript = transcript.toLowerCase();

    return {
      ai_readiness: this.scoreAIReadiness(lowerTranscript, competencyProfile),
      organization: this.scoreOrganization(lowerTranscript, competencyProfile),
      executive_leadership: this.scoreExecutiveLeadership(lowerTranscript, emotionalProfile, competencyProfile),
    };
  }

  private scoreAIReadiness(
    lowerTranscript: string,
    competencyProfile: CompetencyProfile
  ): GoodHangDimensionScore {
    let score = 5.0;
    let confidence = 0.5;
    const signals: string[] = [];

    // Check AI readiness keywords
    for (const [keyword, { boost, signal }] of Object.entries(AI_READINESS_KEYWORDS)) {
      if (lowerTranscript.includes(keyword)) {
        score += boost;
        confidence += 0.05;
        signals.push(signal);
      }
    }

    // Technical competency contributes to AI readiness
    const techSignal = competencyProfile.signals.technical || 0;
    score += techSignal * 1.5;
    if (techSignal > 0.3) {
      signals.push('Technical foundation');
    }

    // Clamp and return
    score = Math.max(0, Math.min(10, score));
    confidence = Math.max(0.3, Math.min(1, confidence));

    return {
      dimension: 'ai_readiness',
      score,
      rawScore: score * 10,
      confidence,
      signals,
    };
  }

  private scoreOrganization(
    lowerTranscript: string,
    competencyProfile: CompetencyProfile
  ): GoodHangDimensionScore {
    let score = 5.0;
    let confidence = 0.5;
    const signals: string[] = [];

    // Check organization keywords
    for (const [keyword, { boost, signal }] of Object.entries(ORGANIZATION_KEYWORDS)) {
      if (lowerTranscript.includes(keyword)) {
        score += boost;
        confidence += 0.04;
        signals.push(signal);
      }
    }

    // Accountability and problem-solving contribute
    const accountabilitySignal = competencyProfile.signals.accountability || 0;
    const problemSolvingSignal = competencyProfile.signals.problem_solving || 0;
    score += (accountabilitySignal + problemSolvingSignal) * 1.0;

    if (accountabilitySignal > 0.3) signals.push('Accountability signals');
    if (problemSolvingSignal > 0.3) signals.push('Problem-solving approach');

    score = Math.max(0, Math.min(10, score));
    confidence = Math.max(0.3, Math.min(1, confidence));

    return {
      dimension: 'organization',
      score,
      rawScore: score * 10,
      confidence,
      signals,
    };
  }

  private scoreExecutiveLeadership(
    lowerTranscript: string,
    emotionalProfile: TextEmotionAnalysis,
    competencyProfile: CompetencyProfile
  ): GoodHangDimensionScore {
    let score = 5.0;
    let confidence = 0.5;
    const signals: string[] = [];

    // Check executive leadership keywords
    for (const [keyword, { boost, signal }] of Object.entries(EXECUTIVE_LEADERSHIP_KEYWORDS)) {
      if (lowerTranscript.includes(keyword)) {
        score += boost;
        confidence += 0.04;
        signals.push(signal);
      }
    }

    // Leadership and confidence signals contribute
    const leadershipSignal = competencyProfile.signals.leadership || 0;
    const confidenceSignal = competencyProfile.signals.confidence || 0;
    const communicationSignal = competencyProfile.signals.communication || 0;

    score += leadershipSignal * 2.0;
    score += confidenceSignal * 1.0;
    score += communicationSignal * 0.5;

    if (leadershipSignal > 0.3) signals.push('Leadership presence');
    if (confidenceSignal > 0.3) signals.push('Executive confidence');
    if (communicationSignal > 0.4) signals.push('Strong communication');

    // High dominance in emotional profile indicates executive presence
    if (emotionalProfile.dominance > 0.6) {
      score += 0.5;
      signals.push('High dominance profile');
    }

    score = Math.max(0, Math.min(10, score));
    confidence = Math.max(0.3, Math.min(1, confidence));

    return {
      dimension: 'executive_leadership',
      score,
      rawScore: score * 10,
      confidence,
      signals,
    };
  }

  /**
   * Combine core dimensions with additional dimensions
   */
  private combineAllDimensions(
    coreDimensions: Record<string, { dimension: string; score: number; confidence: number; signals: string[]; flags?: { green: string[]; red: string[] } }>,
    additionalDimensions: Record<'organization' | 'executive_leadership' | 'ai_readiness', GoodHangDimensionScore>
  ): Record<GoodHangDimension, GoodHangDimensionScore> {
    const combined: Partial<Record<GoodHangDimension, GoodHangDimensionScore>> = {};

    // Convert core dimensions to GoodHangDimensionScore format
    for (const [dim, score] of Object.entries(coreDimensions)) {
      combined[dim as GoodHangDimension] = {
        dimension: dim as GoodHangDimension,
        score: score.score,
        rawScore: score.score * 10,
        confidence: score.confidence,
        signals: score.signals,
        flags: score.flags,
      };
    }

    // Add additional dimensions
    Object.assign(combined, additionalDimensions);

    return combined as Record<GoodHangDimension, GoodHangDimensionScore>;
  }

  /**
   * Calculate Good Hang category scores
   */
  private calculateCategoryScores(
    dimensions: Record<GoodHangDimension, GoodHangDimensionScore>
  ): GoodHangCategoryScores {
    // Technical category
    const technicalSubscores = {
      technical: dimensions.technical.score,
      ai_readiness: dimensions.ai_readiness.score,
      organization: dimensions.organization.score,
      iq: dimensions.iq.score,
    };
    const technicalOverall = Object.values(technicalSubscores).reduce((a, b) => a + b, 0) / 4;

    // Emotional category
    const emotionalSubscores = {
      eq: dimensions.eq.score,
      empathy: dimensions.empathy.score,
      self_awareness: dimensions.self_awareness.score,
      executive_leadership: dimensions.executive_leadership.score,
      gtm: dimensions.gtm.score,
    };
    const emotionalOverall = Object.values(emotionalSubscores).reduce((a, b) => a + b, 0) / 5;

    // Creative category
    const creativeSubscores = {
      passions: dimensions.passions.score,
      culture_fit: dimensions.culture_fit.score,
      personality: dimensions.personality.score,
      motivation: dimensions.motivation.score,
    };
    const creativeOverall = Object.values(creativeSubscores).reduce((a, b) => a + b, 0) / 4;

    return {
      technical: { overall: technicalOverall, subscores: technicalSubscores },
      emotional: { overall: emotionalOverall, subscores: emotionalSubscores },
      creative: { overall: creativeOverall, subscores: creativeSubscores },
    };
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(
    dimensions: Record<GoodHangDimension, GoodHangDimensionScore>
  ): { overallScore: number; overallConfidence: number } {
    let weightedSum = 0;
    let totalWeight = 0;
    let confidenceSum = 0;
    let count = 0;

    for (const [dim, score] of Object.entries(dimensions)) {
      const weight = this.dimensionWeights[dim as GoodHangDimension];
      weightedSum += score.score * weight;
      totalWeight += weight;
      confidenceSum += score.confidence;
      count++;
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 5;
    const overallConfidence = count > 0 ? confidenceSum / count : 0.5;

    return { overallScore, overallConfidence };
  }

  /**
   * Determine Good Hang tier
   */
  private determineTier(score: number): GoodHangTier {
    for (const { tier, minScore } of GOODHANG_TIER_THRESHOLDS) {
      if (score >= minScore) {
        return tier;
      }
    }
    return 'passed';
  }

  /**
   * Classify archetype (custom Good Hang descriptor)
   */
  private classifyArchetype(
    dimensions: Record<GoodHangDimension, GoodHangDimensionScore>,
    categoryScores: GoodHangCategoryScores
  ): { archetype: string; archetypeConfidence: 'high' | 'medium' | 'low' } {
    const sortedDims = Object.entries(dimensions)
      .sort(([, a], [, b]) => b.score - a.score);

    const topDim = sortedDims[0][0] as GoodHangDimension;
    const secondDim = sortedDims[1][0] as GoodHangDimension;

    // Determine primary modifier
    const modifiers: Record<GoodHangDimension, string> = {
      iq: 'Strategic',
      eq: 'Emotionally Intelligent',
      empathy: 'Empathetic',
      self_awareness: 'Self-Aware',
      technical: 'Technical',
      ai_readiness: 'AI-Native',
      gtm: 'GTM',
      personality: 'Charismatic',
      motivation: 'Driven',
      work_history: 'Experienced',
      passions: 'Passionate',
      culture_fit: 'Culture-Aligned',
      organization: 'Organized',
      executive_leadership: 'Executive',
    };

    // Determine primary role
    const roles: Record<GoodHangDimension, string> = {
      iq: 'Analyst',
      eq: 'Leader',
      empathy: 'Connector',
      self_awareness: 'Coach',
      technical: 'Builder',
      ai_readiness: 'Innovator',
      gtm: 'Operator',
      personality: 'Influencer',
      motivation: 'Driver',
      work_history: 'Veteran',
      passions: 'Enthusiast',
      culture_fit: 'Collaborator',
      organization: 'Planner',
      executive_leadership: 'Strategist',
    };

    const archetype = `${modifiers[topDim]} ${roles[secondDim]}`;

    // Confidence based on score spread
    const topScore = sortedDims[0][1].score;
    const secondScore = sortedDims[1][1].score;
    const spread = topScore - secondScore;

    let archetypeConfidence: 'high' | 'medium' | 'low';
    if (spread > 1.5) {
      archetypeConfidence = 'high';
    } else if (spread > 0.5) {
      archetypeConfidence = 'medium';
    } else {
      archetypeConfidence = 'low';
    }

    return { archetype, archetypeConfidence };
  }

  /**
   * Generate public summary
   */
  private generatePublicSummary(
    dimensions: Record<GoodHangDimension, GoodHangDimensionScore>,
    tier: GoodHangTier,
    archetype: string
  ): string {
    const sortedDims = Object.entries(dimensions)
      .sort(([, a], [, b]) => b.score - a.score);

    const topThree = sortedDims.slice(0, 3).map(([d]) => d.replace('_', ' '));

    const tierDesc = {
      top_1: 'Exceptional candidate with standout capabilities',
      benched: 'Strong candidate with solid fundamentals',
      passed: 'Candidate with potential for growth',
    };

    return `${tierDesc[tier]}. Classified as a ${archetype}. Key strengths include ${topThree.join(', ')}.`;
  }

  /**
   * Generate detailed summary
   */
  private generateDetailedSummary(
    dimensions: Record<GoodHangDimension, GoodHangDimensionScore>,
    categoryScores: GoodHangCategoryScores,
    tier: GoodHangTier
  ): string {
    let summary = `## Assessment Summary\n\n`;
    summary += `**Tier:** ${tier.replace('_', ' ').toUpperCase()}\n\n`;

    summary += `### Category Scores\n`;
    summary += `- Technical: ${categoryScores.technical.overall.toFixed(1)}/10\n`;
    summary += `- Emotional: ${categoryScores.emotional.overall.toFixed(1)}/10\n`;
    summary += `- Creative: ${categoryScores.creative.overall.toFixed(1)}/10\n\n`;

    summary += `### Dimension Breakdown\n`;
    const sortedDims = Object.entries(dimensions)
      .sort(([, a], [, b]) => b.score - a.score);

    for (const [dim, score] of sortedDims) {
      const dimName = dim.replace('_', ' ');
      summary += `- ${dimName}: ${score.score.toFixed(1)}/10`;
      if (score.signals.length > 0) {
        summary += ` (${score.signals.slice(0, 2).join(', ')})`;
      }
      summary += '\n';
    }

    return summary;
  }

  /**
   * Generate recommendation and best-fit roles
   */
  private generateRecommendation(
    dimensions: Record<GoodHangDimension, GoodHangDimensionScore>,
    tier: GoodHangTier,
    archetype: string
  ): { recommendation: string; bestFitRoles: string[] } {
    const sortedDims = Object.entries(dimensions)
      .sort(([, a], [, b]) => b.score - a.score);

    const topDim = sortedDims[0][0] as GoodHangDimension;

    // Role mapping
    const rolesByStrength: Record<GoodHangDimension, string[]> = {
      iq: ['Strategy Consultant', 'Data Analyst', 'Product Manager'],
      eq: ['People Manager', 'HR Lead', 'Customer Success'],
      empathy: ['Customer Success', 'UX Researcher', 'Support Lead'],
      self_awareness: ['Executive Coach', 'Mentor', 'Team Lead'],
      technical: ['Engineer', 'Solutions Architect', 'Technical Lead'],
      ai_readiness: ['AI Product Manager', 'ML Engineer', 'AI Solutions Consultant'],
      gtm: ['Sales Lead', 'Marketing Manager', 'Growth Lead'],
      personality: ['Sales Rep', 'Brand Manager', 'Community Lead'],
      motivation: ['Startup Founder', 'Entrepreneur', 'Initiative Lead'],
      work_history: ['Senior Advisor', 'Consultant', 'Fractional Executive'],
      passions: ['Creator', 'Content Lead', 'Developer Advocate'],
      culture_fit: ['Culture Champion', 'Team Builder', 'Office Manager'],
      organization: ['Operations Manager', 'Project Manager', 'Chief of Staff'],
      executive_leadership: ['Executive', 'VP', 'Director'],
    };

    const bestFitRoles = rolesByStrength[topDim] || ['Generalist'];

    let recommendation: string;
    switch (tier) {
      case 'top_1':
        recommendation = `Highly recommend for senior roles. This ${archetype} demonstrates exceptional capabilities and should be fast-tracked.`;
        break;
      case 'benched':
        recommendation = `Solid candidate suitable for mid-level positions. This ${archetype} has strong fundamentals with room for growth.`;
        break;
      case 'passed':
        recommendation = `Consider for entry-level or associate positions. May benefit from mentorship and structured development.`;
        break;
    }

    return { recommendation, bestFitRoles };
  }
}

// =============================================================================
// SINGLETON & CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Default Good Hang scorer instance
 */
export const goodHangScorer = new GoodHangScorer();

/**
 * Quick scoring function
 */
export function scoreGoodHangAssessment(
  transcript: string,
  sessionId: string,
  userId: string,
  options?: GoodHangScoringOptions
): GoodHangScore {
  return goodHangScorer.scoreAssessment(transcript, sessionId, userId, options);
}
