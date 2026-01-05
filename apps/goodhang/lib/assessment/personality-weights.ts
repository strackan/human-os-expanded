// Personality-Based Score Adjustments
// Applies MBTI-based weighting to dimension scores

import { PersonalityType, AssessmentDimensions, ScoringDimension } from './types';

/**
 * Personality weight multipliers for each MBTI type
 * Values > 1.0 indicate natural strengths
 * Values < 1.0 indicate natural challenges
 * Values around 1.0 indicate neutral
 */
export const PERSONALITY_WEIGHTS: Record<PersonalityType, Partial<Record<ScoringDimension, number>>> = {
  // Analysts (NT types)
  'INTJ': {
    iq: 1.05,
    technical: 1.1,
    organization: 1.05,
    ai_readiness: 1.05,
    empathy: 0.95,
    personality: 0.95,
    gtm: 1.0,
  },
  'INTP': {
    iq: 1.1,
    technical: 1.05,
    ai_readiness: 1.1,
    organization: 0.95,
    empathy: 0.90,
    executive_leadership: 0.90,
    gtm: 0.95,
  },
  'ENTJ': {
    executive_leadership: 1.1,
    gtm: 1.1,
    organization: 1.05,
    iq: 1.05,
    empathy: 0.95,
    self_awareness: 0.95,
  },
  'ENTP': {
    iq: 1.05,
    ai_readiness: 1.05,
    motivation: 1.05,
    organization: 0.90,
    empathy: 0.95,
  },

  // Diplomats (NF types)
  'INFJ': {
    empathy: 1.1,
    self_awareness: 1.1,
    eq: 1.05,
    culture_fit: 1.05,
    technical: 0.95,
    gtm: 0.95,
  },
  'INFP': {
    empathy: 1.15,
    self_awareness: 1.1,
    passions: 1.1,
    culture_fit: 1.05,
    technical: 0.90,
    executive_leadership: 0.85,
    gtm: 0.90,
  },
  'ENFJ': {
    eq: 1.1,
    empathy: 1.1,
    executive_leadership: 1.05,
    personality: 1.05,
    technical: 0.95,
    iq: 0.95,
  },
  'ENFP': {
    empathy: 1.05,
    eq: 1.05,
    passions: 1.1,
    motivation: 1.1,
    culture_fit: 1.05,
    technical: 0.90,
    organization: 0.85,
  },

  // Sentinels (SJ types)
  'ISTJ': {
    organization: 1.15,
    work_history: 1.1,
    technical: 1.05,
    motivation: 1.05,
    ai_readiness: 0.95,
    passions: 0.90,
  },
  'ISFJ': {
    empathy: 1.1,
    organization: 1.05,
    work_history: 1.05,
    culture_fit: 1.05,
    technical: 0.95,
    executive_leadership: 0.90,
  },
  'ESTJ': {
    executive_leadership: 1.1,
    organization: 1.1,
    gtm: 1.05,
    work_history: 1.05,
    empathy: 0.95,
    self_awareness: 0.95,
  },
  'ESFJ': {
    eq: 1.1,
    empathy: 1.1,
    culture_fit: 1.1,
    organization: 1.05,
    technical: 0.90,
    iq: 0.95,
  },

  // Explorers (SP types)
  'ISTP': {
    technical: 1.15,
    iq: 1.05,
    ai_readiness: 1.05,
    empathy: 0.90,
    personality: 0.90,
    executive_leadership: 0.85,
  },
  'ISFP': {
    empathy: 1.05,
    passions: 1.1,
    culture_fit: 1.05,
    technical: 0.90,
    organization: 0.85,
    executive_leadership: 0.85,
  },
  'ESTP': {
    gtm: 1.1,
    motivation: 1.05,
    personality: 1.05,
    organization: 0.90,
    self_awareness: 0.90,
  },
  'ESFP': {
    eq: 1.05,
    personality: 1.1,
    passions: 1.1,
    culture_fit: 1.05,
    technical: 0.85,
    organization: 0.85,
    iq: 0.95,
  },
};

/**
 * Applies personality-based weights to dimension scores
 *
 * NOTE: In Phase 2, we're NOT applying weights to final scores.
 * This function is provided for future use or analysis purposes.
 * The scoring system uses hard grading based on raw evidence.
 *
 * @param scores - Original dimension scores
 * @param personalityType - MBTI type
 * @returns Weighted dimension scores (clamped to 0-100)
 */
export function applyPersonalityWeights(
  scores: AssessmentDimensions,
  personalityType: PersonalityType
): AssessmentDimensions {
  const weights = PERSONALITY_WEIGHTS[personalityType];
  const weighted: AssessmentDimensions = { ...scores };

  // Apply weights to each dimension
  (Object.keys(weighted) as ScoringDimension[]).forEach((dimension) => {
    const weight = weights[dimension];
    if (weight !== undefined) {
      weighted[dimension] = Math.round(
        Math.max(0, Math.min(100, weighted[dimension] * weight))
      );
    }
  });

  return weighted;
}

/**
 * Gets expected strengths for a personality type
 * Returns dimensions where this type typically excels
 */
export function getPersonalityStrengths(personalityType: PersonalityType): ScoringDimension[] {
  const weights = PERSONALITY_WEIGHTS[personalityType];
  return Object.entries(weights)
    .filter(([, weight]) => weight >= 1.05)
    .map(([dimension]) => dimension as ScoringDimension);
}

/**
 * Gets expected challenges for a personality type
 * Returns dimensions where this type typically struggles
 */
export function getPersonalityChallenges(personalityType: PersonalityType): ScoringDimension[] {
  const weights = PERSONALITY_WEIGHTS[personalityType];
  return Object.entries(weights)
    .filter(([, weight]) => weight <= 0.95)
    .map(([dimension]) => dimension as ScoringDimension);
}

/**
 * Analyzes if scores match expected personality profile
 * Returns true if actual scores align with personality-based expectations
 */
export function scoresMatchPersonality(
  scores: AssessmentDimensions,
  personalityType: PersonalityType,
  _threshold: number = 5
): boolean {
  const expectedStrengths = getPersonalityStrengths(personalityType);
  const expectedChallenges = getPersonalityChallenges(personalityType);

  // Check if strengths are actually high
  const strengthsMatch = expectedStrengths.every(
    (dimension) => scores[dimension] >= 60
  );

  // Check if challenges are actually lower (but allow high achievers to overcome)
  const challengesReasonable = expectedChallenges.every(
    (dimension) => scores[dimension] <= 80 || scores[dimension] >= 85
  );

  return strengthsMatch || challengesReasonable;
}

/**
 * Generates personality-based insights
 */
export function generatePersonalityInsights(
  scores: AssessmentDimensions,
  personalityType: PersonalityType
): {
  expectedStrengths: string[];
  expectedChallenges: string[];
  unexpectedStrengths: string[];
  overcomeWeaknesses: string[];
} {
  const weights = PERSONALITY_WEIGHTS[personalityType];
  const expectedStrengths: string[] = [];
  const expectedChallenges: string[] = [];
  const unexpectedStrengths: string[] = [];
  const overcomeWeaknesses: string[] = [];

  (Object.keys(weights) as ScoringDimension[]).forEach((dimension) => {
    const weight = weights[dimension]!;
    const score = scores[dimension];

    if (weight >= 1.05 && score >= 70) {
      expectedStrengths.push(formatDimensionName(dimension));
    } else if (weight <= 0.95 && score < 60) {
      expectedChallenges.push(formatDimensionName(dimension));
    } else if (weight <= 0.95 && score >= 75) {
      // They overcame a natural weakness
      overcomeWeaknesses.push(formatDimensionName(dimension));
    } else if (weight >= 1.05 && score < 60) {
      // They're weak in an expected strength (potential concern)
      unexpectedStrengths.push(formatDimensionName(dimension));
    }
  });

  return {
    expectedStrengths,
    expectedChallenges,
    unexpectedStrengths,
    overcomeWeaknesses,
  };
}

/**
 * Helper to format dimension names for display
 */
function formatDimensionName(dimension: ScoringDimension): string {
  const nameMap: Record<ScoringDimension, string> = {
    iq: 'IQ',
    eq: 'EQ',
    empathy: 'Empathy',
    self_awareness: 'Self-Awareness',
    technical: 'Technical',
    ai_readiness: 'AI Readiness',
    gtm: 'GTM/Business Acumen',
    personality: 'Communication',
    motivation: 'Motivation',
    work_history: 'Work History',
    passions: 'Passions',
    culture_fit: 'Culture Fit',
    organization: 'Organization',
    executive_leadership: 'Executive Leadership',
  };

  return nameMap[dimension] || dimension;
}
