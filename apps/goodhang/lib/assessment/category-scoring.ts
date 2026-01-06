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
    technical: dimensions.technical ?? 0,
    ai_readiness: dimensions.ai_readiness ?? 0,
    organization: dimensions.organization ?? 0,
    iq: dimensions.iq ?? 0,
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
    eq: dimensions.eq ?? 0,
    empathy: dimensions.empathy ?? 0,
    self_awareness: dimensions.self_awareness ?? 0,
    executive_leadership: dimensions.executive_leadership ?? 0,
    gtm: dimensions.gtm ?? 0,
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
    passions: dimensions.passions ?? 0,
    culture_fit: dimensions.culture_fit ?? 0,
    personality: dimensions.personality ?? 0,
    motivation: dimensions.motivation ?? 0,
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
  const technical = categoryScores.technical?.overall ?? 0;
  const emotional = categoryScores.emotional?.overall ?? 0;
  const creative = categoryScores.creative?.overall ?? 0;

  return Math.round((technical + emotional + creative) / 3);
}

/**
 * Gets the strongest category for a candidate
 * Returns the category name with the highest overall score
 */
export function getStrongestCategory(categoryScores: CategoryScores): 'technical' | 'emotional' | 'creative' {
  const scores = {
    technical: categoryScores.technical?.overall ?? 0,
    emotional: categoryScores.emotional?.overall ?? 0,
    creative: categoryScores.creative?.overall ?? 0,
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
    technical: categoryScores.technical?.overall ?? 0,
    emotional: categoryScores.emotional?.overall ?? 0,
    creative: categoryScores.creative?.overall ?? 0,
  };

  const weakest = Object.entries(scores).sort(([, a], [, b]) => a - b)[0]?.[0];
  return (weakest ?? 'technical') as 'technical' | 'emotional' | 'creative';
}

/**
 * Checks if a candidate is "well-rounded" (all categories within 15 points)
 */
export function isWellRounded(categoryScores: CategoryScores): boolean {
  const scores = [
    categoryScores.technical?.overall ?? 0,
    categoryScores.emotional?.overall ?? 0,
    categoryScores.creative?.overall ?? 0,
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
  const techSubscores = categoryScores.technical?.subscores;
  const emoSubscores = categoryScores.emotional?.subscores;
  const creativeSubscores = categoryScores.creative?.subscores;

  if (techSubscores) {
    if ((techSubscores.technical ?? 0) < 50) gaps.push('Technical skills need development');
    if ((techSubscores.ai_readiness ?? 0) < 50) gaps.push('AI readiness is below average');
    if ((techSubscores.organization ?? 0) < 50) gaps.push('Organizational skills need work');
    if ((techSubscores.iq ?? 0) < 50) gaps.push('Problem-solving could be stronger');
  }

  if (emoSubscores) {
    if ((emoSubscores.eq ?? 0) < 50) gaps.push('Emotional intelligence needs development');
    if ((emoSubscores.empathy ?? 0) < 50) gaps.push('Empathy could be stronger');
    if ((emoSubscores.self_awareness ?? 0) < 50) gaps.push('Self-awareness needs improvement');
    if ((emoSubscores.executive_leadership ?? 0) < 50) gaps.push('Leadership skills underdeveloped');
    if ((emoSubscores.gtm ?? 0) < 50) gaps.push('Business acumen needs work');
  }

  if (creativeSubscores) {
    if ((creativeSubscores.passions ?? 0) < 50) gaps.push('Lacking clear passions or drive');
    if ((creativeSubscores.culture_fit ?? 0) < 50) gaps.push('Cultural fit concerns');
    if ((creativeSubscores.personality ?? 0) < 50) gaps.push('Communication style needs refinement');
    if ((creativeSubscores.motivation ?? 0) < 50) gaps.push('Motivation appears limited');
  }

  return {
    strongest: strongest.charAt(0).toUpperCase() + strongest.slice(1),
    weakest: weakest.charAt(0).toUpperCase() + weakest.slice(1),
    isBalanced,
    gaps,
  };
}
