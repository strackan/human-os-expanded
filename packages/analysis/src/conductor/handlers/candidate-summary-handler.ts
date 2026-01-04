/**
 * Candidate Summary Handler
 *
 * Shareable summary for candidates that focuses on insights rather than scores.
 * Positive framing with constructive growth feedback.
 */

import type { AssessmentResult, AssessmentHandler } from '../types.js';

import type { CandidateArchetype, InterviewDimension } from '../../types/index.js';
import { formatArchetypeName } from './utils.js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Candidate Summary - Shareable with candidates
 * Focuses on strengths and growth areas without revealing scoring details
 */
export interface CandidateSummary {
  greeting: string;
  overallImpression: string;

  strengths: {
    headline: string;
    items: string[];
  };

  growthAreas: {
    headline: string;
    items: string[];
  };

  // Personality insights (non-judgmental)
  workStyle: {
    headline: string;
    description: string;
  };

  // What they bring to a team
  valueProposition: string;

  // Encouraging close
  closing: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatStrengthPositively(dim: InterviewDimension, score: number): string {
  const strengths: Record<InterviewDimension, string> = {
    iq: 'You approach problems thoughtfully and show strong analytical ability',
    personality: 'Your personality comes through authentically in how you communicate',
    motivation: 'Your drive and purpose are clear - you know what you want',
    work_history: 'Your experience shows a meaningful progression and real accomplishments',
    passions: 'Your genuine interests and enthusiasm are evident',
    culture_fit: 'You seem to understand what kind of environment brings out your best',
    technical: 'Your technical foundation is solid and you speak about it with confidence',
    gtm: 'You understand the business side and how work translates to impact',
    eq: 'You navigate interpersonal situations with awareness and skill',
    empathy: 'You demonstrate genuine care for understanding others',
    self_awareness: 'You show reflective thinking about your own growth and development',
  };
  return strengths[dim];
}

function formatGrowthConstructively(dim: InterviewDimension, score: number): string {
  const growth: Record<InterviewDimension, string> = {
    iq: 'Continuing to develop structured problem-solving approaches could strengthen your impact',
    personality: 'Finding more opportunities to let your authentic self show in professional settings',
    motivation: 'Getting clearer on what specifically drives you could help focus your path',
    work_history: 'Building a clearer narrative around your experience and its through-line',
    passions: 'Exploring what genuinely energizes you beyond day-to-day work',
    culture_fit: 'Developing clearer criteria for the environments where you do your best work',
    technical: 'Deepening technical expertise in your core areas of focus',
    gtm: 'Building stronger connections between your work and business outcomes',
    eq: 'Developing additional strategies for navigating complex interpersonal situations',
    empathy: 'Building practices to better understand and anticipate others\' perspectives',
    self_awareness: 'Creating more space for reflection on feedback and personal patterns',
  };
  return growth[dim];
}

function getWorkStyleDescription(
  archetype: CandidateArchetype,
  competencies: AssessmentResult['competencies']
): string {
  const base: Record<CandidateArchetype, string> = {
    technical_builder:
      'You approach challenges as opportunities to build and create. Your strength lies in taking complex problems and crafting elegant solutions.',
    gtm_operator:
      'You thrive in the space between product and customer. Your natural inclination is to bridge gaps and drive things forward.',
    creative_strategist:
      'You see patterns others miss and enjoy designing solutions at a higher level. Strategic thinking comes naturally to you.',
    execution_machine:
      'You get things done. Period. Your strength is turning plans into reality with discipline and consistency.',
    generalist_orchestrator:
      "You're versatile and adaptive, comfortable switching contexts and connecting different pieces together.",
    domain_expert:
      'You go deep. Your expertise in your area gives you credibility and the ability to solve specialized problems.',
  };

  let description = base[archetype];

  // Add flavor based on top competency signals
  const topSignal = competencies.dominantSignals[0];
  if (topSignal === 'leadership') {
    description += ' You also show natural leadership tendencies.';
  } else if (topSignal === 'collaboration') {
    description += ' Collaboration seems to energize you.';
  }

  return description;
}

function generateValueProposition(
  archetype: CandidateArchetype,
  topDimensions: InterviewDimension[],
  greenFlags: string[]
): string {
  const archetypeName = formatArchetypeName(archetype);

  if (greenFlags.length > 0) {
    return `As a ${archetypeName}, you bring ${greenFlags[0]?.toLowerCase() || 'unique perspective'}. Teams benefit from your approach, especially in situations requiring ${topDimensions[0]?.replace('_', ' ') || 'diverse skills'}.`;
  }

  return `Your ${archetypeName} profile suggests you'd contribute best in roles that leverage your natural inclinations and allow you to develop in areas that matter to you.`;
}

// =============================================================================
// HANDLER EXPORT
// =============================================================================

export const candidateSummaryHandler: AssessmentHandler<CandidateSummary> = {
  name: 'Candidate Summary',
  description: 'Shareable summary for candidates that focuses on insights rather than scores',

  format(result: AssessmentResult): CandidateSummary {
    const { candidateName, dimensions, overallScore, archetype, greenFlags, competencies } = result;

    // Get top 3 dimensions as strengths
    const sortedDims = Object.entries(dimensions).sort((a, b) => b[1].score - a[1].score);
    const topDims = sortedDims.slice(0, 3);
    const bottomDims = sortedDims.slice(-2);

    // Create positive framing for strengths
    const strengthItems = topDims.map(([dim, data]) => {
      return formatStrengthPositively(dim as InterviewDimension, data.score);
    });

    // Create constructive framing for growth areas
    const growthItems = bottomDims.map(([dim, data]) => {
      return formatGrowthConstructively(dim as InterviewDimension, data.score);
    });

    // Work style based on archetype
    const workStyleDescription = getWorkStyleDescription(archetype.primary, competencies);

    // Value proposition
    const valueProposition = generateValueProposition(
      archetype.primary,
      topDims.map(([d]) => d as InterviewDimension),
      greenFlags
    );

    // Appropriate greeting based on overall impression
    const isPositive = overallScore >= 6;

    return {
      greeting: `Hi ${candidateName.split(' ')[0]},`,

      overallImpression: isPositive
        ? `Thank you for the thoughtful conversation. Your experiences and perspectives came through clearly, and there's a lot to appreciate in how you approach your work.`
        : `Thank you for taking the time to speak with us. We appreciate you sharing your experiences and perspectives during our conversation.`,

      strengths: {
        headline: 'What Stood Out',
        items: strengthItems,
      },

      growthAreas: {
        headline: 'Areas for Growth',
        items: growthItems,
      },

      workStyle: {
        headline: 'Your Work Style',
        description: workStyleDescription,
      },

      valueProposition,

      closing: isPositive
        ? `You bring a genuine perspective to your work that organizations value. Whatever comes next, these strengths will serve you well.`
        : `Every conversation is a learning opportunity. We hope this feedback is helpful as you continue your journey.`,
    };
  },
};
