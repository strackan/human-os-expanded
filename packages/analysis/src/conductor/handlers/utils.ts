/**
 * Shared utilities for assessment handlers
 */

import type { CompetencyRating, AssessmentResult } from '../types.js';
import type { CandidateArchetype, InterviewTier, InterviewDimension } from '../../types/index.js';

// =============================================================================
// BASIC MATH UTILITIES
// =============================================================================

/**
 * Calculate the average of multiple values
 */
export function avg(...values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// =============================================================================
// SCORE CONVERSION UTILITIES
// =============================================================================

/**
 * Map a score (0-10) to a CompetencyRating
 */
export function scoreToRating(score: number): CompetencyRating {
  if (score >= 9) return 'Exceptional';
  if (score >= 7) return 'Exceeds';
  if (score >= 5) return 'Meets';
  if (score >= 3) return 'Developing';
  return 'Below';
}

/**
 * Map tier to hiring recommendation
 */
export function tierToRecommendation(tier: InterviewTier): 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire' {
  switch (tier) {
    case 'top_1%':
    case 'strong':
      return 'Strong Hire';
    case 'moderate':
      return 'Hire';
    case 'weak':
      return 'No Hire';
    case 'pass':
      return 'Strong No Hire';
  }
}

/**
 * Get culture alignment label from score
 */
export function getCultureAlignment(score: number): 'Strong' | 'Moderate' | 'Weak' {
  if (score >= 7) return 'Strong';
  if (score >= 4) return 'Moderate';
  return 'Weak';
}

/**
 * Get role fit label from archetype confidence
 */
export function getRoleFit(confidence: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (confidence >= 0.8) return 'Excellent';
  if (confidence >= 0.6) return 'Good';
  if (confidence >= 0.4) return 'Fair';
  return 'Poor';
}

// =============================================================================
// DIMENSION UTILITIES
// =============================================================================

/**
 * Get the bottom N dimensions by score
 */
export function getBottomDimensions(
  dimensions: Record<InterviewDimension, { score: number }>,
  n: number
): InterviewDimension[] {
  const entries = Object.entries(dimensions) as [InterviewDimension, { score: number }][];
  return entries
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, n)
    .map(([dim]) => dim);
}

/**
 * Format dimension name for display
 */
export function formatDimensionName(dimension: InterviewDimension): string {
  const names: Record<InterviewDimension, string> = {
    iq: 'Cognitive Ability',
    personality: 'Personality & Character',
    motivation: 'Motivation & Drive',
    work_history: 'Work History & Track Record',
    passions: 'Passions & Interests',
    culture_fit: 'Culture Fit',
    technical: 'Technical Skills',
    gtm: 'Go-to-Market Acumen',
    eq: 'Emotional Intelligence',
    empathy: 'Empathy',
    self_awareness: 'Self-Awareness',
  };
  return names[dimension];
}

// =============================================================================
// ARCHETYPE UTILITIES
// =============================================================================

/**
 * Format archetype name for display
 */
export function formatArchetypeName(archetype: CandidateArchetype): string {
  const names: Record<CandidateArchetype, string> = {
    technical_builder: 'Technical Builder',
    gtm_operator: 'GTM Operator',
    creative_strategist: 'Creative Strategist',
    execution_machine: 'Execution Machine',
    generalist_orchestrator: 'Generalist Orchestrator',
    domain_expert: 'Domain Expert',
  };
  return names[archetype];
}

/**
 * Format tier for display
 */
export function formatTierDisplay(tier: InterviewTier): string {
  const displays: Record<InterviewTier, string> = {
    'top_1%': 'Exceptional (Top 1%)',
    strong: 'Strong',
    moderate: 'Moderate',
    weak: 'Needs Development',
    pass: 'Below Threshold',
  };
  return displays[tier];
}

// =============================================================================
// NEXT STEPS GENERATOR
// =============================================================================

/**
 * Generate appropriate next steps based on recommendation
 */
export function generateNextSteps(
  recommendation: 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire',
  tier: InterviewTier,
  confidence: number
): string[] {
  switch (recommendation) {
    case 'Strong Hire':
      return [
        'Schedule final round with hiring manager',
        'Initiate reference checks',
        'Prepare offer package for fast-track approval',
        tier === 'top_1%' ? 'Consider for accelerated onboarding track' : 'Standard onboarding planning',
      ];

    case 'Hire':
      return [
        'Schedule technical deep-dive or case study',
        'Conduct peer interview for culture validation',
        'Complete reference checks',
        confidence < 0.6 ? 'Consider role alignment discussion' : 'Proceed with standard hiring process',
      ];

    case 'No Hire':
      return [
        'Send polite rejection with constructive feedback',
        'Consider for future opportunities if specific gaps are addressed',
        'Document assessment for talent pool records',
      ];

    case 'Strong No Hire':
      return [
        'Send standard rejection notice',
        'Document decision rationale for records',
        'No future consideration recommended at this time',
      ];
  }
}
