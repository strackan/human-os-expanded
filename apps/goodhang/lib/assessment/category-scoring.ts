// Category Scoring Utilities
// Calculates Technical, Emotional, and Creative category scores from 14 dimensions

import { AssessmentDimensions, CategoryScores } from './types';

/**
 * Calculates category scores from 14 dimension scores
 *
 * Categories:
 * - Technical: Technical, AI Readiness, Organization, IQ
 * - Emotional: EQ, Empathy, Self-Awareness, Executive Leadership, GTM
 * - Creative: Passions, Culture Fit, Personality, Motivation
 *
 * Each category has an overall score (average) and individual subscores
 */
export function calculateCategoryScores(dimensions: AssessmentDimensions): CategoryScores {
  // Technical Category
  // Subscores: technical, ai_readiness, organization, iq
  const technicalSubscores = {
    technical: dimensions.technical,
    ai_readiness: dimensions.ai_readiness,
    organization: dimensions.organization,
    iq: dimensions.iq,
  };

  const technicalOverall = Math.round(
    (technicalSubscores.technical +
      technicalSubscores.ai_readiness +
      technicalSubscores.organization +
      technicalSubscores.iq) / 4
  );

  // Emotional Category
  // Subscores: eq, empathy, self_awareness, executive_leadership, gtm
  const emotionalSubscores = {
    eq: dimensions.eq,
    empathy: dimensions.empathy,
    self_awareness: dimensions.self_awareness,
    executive_leadership: dimensions.executive_leadership,
    gtm: dimensions.gtm,
  };

  const emotionalOverall = Math.round(
    (emotionalSubscores.eq +
      emotionalSubscores.empathy +
      emotionalSubscores.self_awareness +
      emotionalSubscores.executive_leadership +
      emotionalSubscores.gtm) / 5
  );

  // Creative Category
  // Subscores: passions, culture_fit, personality, motivation
  const creativeSubscores = {
    passions: dimensions.passions,
    culture_fit: dimensions.culture_fit,
    personality: dimensions.personality,
    motivation: dimensions.motivation,
  };

  const creativeOverall = Math.round(
    (creativeSubscores.passions +
      creativeSubscores.culture_fit +
      creativeSubscores.personality +
      creativeSubscores.motivation) / 4
  );

  return {
    technical: {
      overall: technicalOverall,
      subscores: technicalSubscores,
    },
    emotional: {
      overall: emotionalOverall,
      subscores: emotionalSubscores,
    },
    creative: {
      overall: creativeOverall,
      subscores: creativeSubscores,
    },
  };
}

/**
 * Calculates overall score from category scores
 * Simple average of the three category scores
 */
export function calculateOverallScore(categoryScores: CategoryScores): number {
  return Math.round(
    (categoryScores.technical.overall +
      categoryScores.emotional.overall +
      categoryScores.creative.overall) / 3
  );
}

/**
 * Gets the strongest category for a candidate
 * Returns the category name with the highest overall score
 */
export function getStrongestCategory(categoryScores: CategoryScores): 'technical' | 'emotional' | 'creative' {
  const scores = {
    technical: categoryScores.technical.overall,
    emotional: categoryScores.emotional.overall,
    creative: categoryScores.creative.overall,
  };

  const sortedEntries = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const strongestEntry = sortedEntries[0];
  if (!strongestEntry) {
    return 'technical'; // fallback
  }
  const [strongest] = strongestEntry;
  return strongest as 'technical' | 'emotional' | 'creative';
}

/**
 * Gets the weakest category for a candidate
 * Returns the category name with the lowest overall score
 */
export function getWeakestCategory(categoryScores: CategoryScores): 'technical' | 'emotional' | 'creative' {
  const scores = {
    technical: categoryScores.technical.overall,
    emotional: categoryScores.emotional.overall,
    creative: categoryScores.creative.overall,
  };

  const weakest = Object.entries(scores).sort(([, a], [, b]) => a - b)[0]?.[0];
  return weakest as 'technical' | 'emotional' | 'creative';
}

/**
 * Checks if a candidate is "well-rounded" (all categories within 15 points)
 */
export function isWellRounded(categoryScores: CategoryScores): boolean {
  const scores = [
    categoryScores.technical.overall,
    categoryScores.emotional.overall,
    categoryScores.creative.overall,
  ];

  const max = Math.max(...scores);
  const min = Math.min(...scores);

  return (max - min) <= 15;
}

/**
 * Generates category-based insights
 */
export function generateCategoryInsights(categoryScores: CategoryScores): {
  strongest: string;
  weakest: string;
  isBalanced: boolean;
  gaps: string[];
} {
  const strongest = getStrongestCategory(categoryScores);
  const weakest = getWeakestCategory(categoryScores);
  const isBalanced = isWellRounded(categoryScores);

  const gaps: string[] = [];

  // Identify specific gaps (subscores < 50)
  if (categoryScores.technical.subscores.technical < 50) gaps.push('Technical skills need development');
  if (categoryScores.technical.subscores.ai_readiness < 50) gaps.push('AI readiness is below average');
  if (categoryScores.technical.subscores.organization < 50) gaps.push('Organizational skills need work');
  if (categoryScores.technical.subscores.iq < 50) gaps.push('Problem-solving could be stronger');

  if (categoryScores.emotional.subscores.eq < 50) gaps.push('Emotional intelligence needs development');
  if (categoryScores.emotional.subscores.empathy < 50) gaps.push('Empathy could be stronger');
  if (categoryScores.emotional.subscores.self_awareness < 50) gaps.push('Self-awareness needs improvement');
  if (categoryScores.emotional.subscores.executive_leadership < 50) gaps.push('Leadership skills underdeveloped');
  if (categoryScores.emotional.subscores.gtm < 50) gaps.push('Business acumen needs work');

  if (categoryScores.creative.subscores.passions < 50) gaps.push('Lacking clear passions or drive');
  if (categoryScores.creative.subscores.culture_fit < 50) gaps.push('Cultural fit concerns');
  if (categoryScores.creative.subscores.personality < 50) gaps.push('Communication style needs refinement');
  if (categoryScores.creative.subscores.motivation < 50) gaps.push('Motivation appears limited');

  return {
    strongest: strongest.charAt(0).toUpperCase() + strongest.slice(1),
    weakest: weakest.charAt(0).toUpperCase() + weakest.slice(1),
    isBalanced,
    gaps,
  };
}
