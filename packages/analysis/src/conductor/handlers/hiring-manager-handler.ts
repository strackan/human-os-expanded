/**
 * Hiring Manager Report Handler
 *
 * Detailed internal report with full assessment data for hiring decisions.
 * Contains behavioral insights, risk assessment, and probing questions.
 */

import type {
  AssessmentResult,
  AssessmentHandler,
  CompetencyRating,
} from '../types.js';

import type { InterviewDimension } from '../../types/index.js';
import {
  scoreToRating,
  tierToRecommendation,
  formatDimensionName,
  formatArchetypeName,
  formatTierDisplay,
  generateNextSteps,
} from './utils.js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Hiring Manager Report - Full internal details
 */
export interface HiringManagerReport {
  candidateName: string;
  assessmentDate: string;
  overallScore: string;
  tier: string;
  recommendation: string;

  // Quick summary section
  summary: {
    headline: string;
    archetype: string;
    topStrengths: string[];
    concerns: string[];
  };

  // Detailed dimension breakdown
  dimensionDetails: Array<{
    name: string;
    score: string;
    rating: CompetencyRating;
    signals: string[];
    notes: string;
  }>;

  // Behavioral patterns
  behavioralInsights: {
    communicationStyle: string;
    problemSolvingApproach: string;
    teamworkIndicators: string;
    leadershipPotential: string;
  };

  // Risk assessment
  risks: {
    cultureFitRisk: string;
    performanceRisk: string;
    retentionRisk: string;
    redFlags: string[];
  };

  // Interview highlights
  notableQuotes: string[];

  // Action items
  nextSteps: string[];
  interviewQuestions: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateHeadline(
  name: string,
  tier: AssessmentResult['tier'],
  archetype: AssessmentResult['archetype']['primary']
): string {
  const archetypeName = formatArchetypeName(archetype);
  switch (tier) {
    case 'top_1%':
      return `${name} is an exceptional ${archetypeName} candidate who stands out significantly`;
    case 'strong':
      return `${name} shows strong potential as a ${archetypeName}`;
    case 'moderate':
      return `${name} demonstrates moderate fit for ${archetypeName} roles`;
    case 'weak':
      return `${name} shows gaps that may limit effectiveness as a ${archetypeName}`;
    case 'pass':
      return `${name} does not currently meet ${archetypeName} requirements`;
  }
}

function generateDimensionNotes(dim: InterviewDimension, score: number): string {
  if (score >= 8) return 'Clear strength. Consider leveraging in role design.';
  if (score >= 6) return 'Solid foundation. Meets expectations.';
  if (score >= 4) return 'Room for development. May need support.';
  return 'Significant gap. Probe further if proceeding.';
}

function deriveCommunicationStyle(
  emotions: AssessmentResult['emotions'],
  competencies: AssessmentResult['competencies']
): string {
  const commScore = competencies.signals.communication || 0;
  const confidenceScore = competencies.signals.confidence || 0;

  if (commScore > 0.7 && confidenceScore > 0.7) {
    return 'Direct and confident communicator who expresses ideas clearly';
  } else if (commScore > 0.7) {
    return 'Clear communicator who structures thoughts well';
  } else if (confidenceScore > 0.7) {
    return 'Confident in expression, may benefit from more structure';
  }
  return 'Communication style was moderate; may develop with experience';
}

function deriveProblemSolving(
  dimensions: AssessmentResult['dimensions'],
  competencies: AssessmentResult['competencies']
): string {
  const iq = dimensions.iq.score;
  const psScore = competencies.signals.problem_solving || 0;

  if (iq >= 8 && psScore > 0.7) {
    return 'Systematic and analytical; tackles complex problems methodically';
  } else if (iq >= 6) {
    return 'Capable problem solver with room to develop deeper analytical skills';
  }
  return 'May need guidance on complex problem-solving; strengths lie elsewhere';
}

function deriveTeamwork(
  dimensions: AssessmentResult['dimensions'],
  competencies: AssessmentResult['competencies']
): string {
  const empathy = dimensions.empathy.score;
  const collabScore = competencies.signals.collaboration || 0;

  if (empathy >= 8 && collabScore > 0.7) {
    return 'Strong team orientation; naturally collaborative and empathetic';
  } else if (empathy >= 6 || collabScore > 0.5) {
    return 'Works well with others; can contribute to team dynamics';
  }
  return 'More individually focused; team integration may need attention';
}

function deriveLeadership(
  dimensions: AssessmentResult['dimensions'],
  competencies: AssessmentResult['competencies']
): string {
  const leadership = competencies.signals.leadership || 0;
  const selfAwareness = dimensions.self_awareness.score;

  if (leadership > 0.7 && selfAwareness >= 7) {
    return 'High potential; shows both influence skills and self-awareness';
  } else if (leadership > 0.5) {
    return 'Emerging leadership capacity; could develop with right opportunities';
  }
  return 'Currently more of an individual contributor profile';
}

function getQuestionForDimension(dim: InterviewDimension): string {
  const questions: Record<InterviewDimension, string> = {
    iq: 'Walk me through a complex problem you solved. How did you break it down?',
    personality: 'How would your colleagues describe your working style?',
    motivation: 'What specifically draws you to this opportunity vs. staying put?',
    work_history: 'Tell me about the progression in your career. What drove each move?',
    passions: 'Outside of work requirements, what do you find yourself drawn to learning about?',
    culture_fit: 'Describe your ideal team environment. What makes you thrive?',
    technical: 'Can you dive deeper into the technical decisions you made on your key project?',
    gtm: 'How have you thought about the business impact of your technical decisions?',
    eq: 'Tell me about a time you had to navigate a sensitive situation with stakeholders.',
    empathy: 'How do you typically handle disagreements with teammates?',
    self_awareness: 'What feedback have you received that was hard to hear but ultimately valuable?',
  };
  return questions[dim];
}

function generateProbingQuestions(
  dimensions: AssessmentResult['dimensions'],
  redFlags: string[]
): string[] {
  const questions: string[] = [];

  // Add questions based on low dimensions
  const sortedDims = Object.entries(dimensions).sort((a, b) => a[1].score - b[1].score);

  for (const [dim, data] of sortedDims.slice(0, 2)) {
    if (data.score < 5) {
      questions.push(getQuestionForDimension(dim as InterviewDimension));
    }
  }

  // Add questions based on red flags
  if (redFlags.some((f) => f.toLowerCase().includes('accountab'))) {
    questions.push('Tell me about a time when a project failed. What was your role in that failure?');
  }
  if (redFlags.some((f) => f.toLowerCase().includes('team') || f.toLowerCase().includes('collab'))) {
    questions.push(
      'Describe a situation where you had to work with someone you disagreed with. How did you handle it?'
    );
  }

  return questions.slice(0, 4);
}

function extractNotableQuotes(result: AssessmentResult): string[] {
  // Extract some candidate quotes from transcript (taking snippets)
  const candidateEntries = result.transcript.filter((e) => e.speaker === 'candidate');
  const quotes: string[] = [];

  for (const entry of candidateEntries) {
    // Look for quotable phrases (first 100 chars of substantive responses)
    if (entry.text.length > 50) {
      const quote = entry.text.slice(0, 100) + (entry.text.length > 100 ? '...' : '');
      quotes.push(`"${quote}"`);
      if (quotes.length >= 3) break;
    }
  }

  return quotes;
}

// =============================================================================
// HANDLER EXPORT
// =============================================================================

export const hiringManagerHandler: AssessmentHandler<HiringManagerReport> = {
  name: 'Hiring Manager Report',
  description: 'Detailed internal report with full assessment data for hiring decisions',

  format(result: AssessmentResult): HiringManagerReport {
    const {
      candidateName,
      dimensions,
      overallScore,
      tier,
      archetype,
      greenFlags,
      redFlags,
      emotions,
      competencies,
      completedAt,
    } = result;

    // Build dimension details
    const dimensionDetails = Object.entries(dimensions).map(([dim, data]) => {
      const dimKey = dim as InterviewDimension;
      return {
        name: formatDimensionName(dimKey),
        score: `${data.score.toFixed(1)}/10`,
        rating: scoreToRating(data.score),
        signals: data.signals.slice(0, 3),
        notes: generateDimensionNotes(dimKey, data.score),
      };
    });

    // Sort by score to show strengths first
    dimensionDetails.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

    // Derive communication style from emotions and competencies
    const communicationStyle = deriveCommunicationStyle(emotions, competencies);
    const problemSolvingApproach = deriveProblemSolving(dimensions, competencies);
    const teamworkIndicators = deriveTeamwork(dimensions, competencies);
    const leadershipPotential = deriveLeadership(dimensions, competencies);

    // Risk assessment
    const cultureFitRisk =
      dimensions.culture_fit.score < 5 ? 'High' : dimensions.culture_fit.score < 7 ? 'Moderate' : 'Low';
    const performanceRisk = overallScore < 5 ? 'High' : overallScore < 7 ? 'Moderate' : 'Low';
    const retentionRisk =
      dimensions.motivation.score < 5 ? 'High' : dimensions.motivation.score < 7 ? 'Moderate' : 'Low';

    // Generate probing questions based on weak areas
    const interviewQuestions = generateProbingQuestions(dimensions, redFlags);

    return {
      candidateName,
      assessmentDate: completedAt.toLocaleDateString(),
      overallScore: `${overallScore.toFixed(1)}/10`,
      tier: formatTierDisplay(tier),
      recommendation: tierToRecommendation(tier),

      summary: {
        headline: generateHeadline(candidateName, tier, archetype.primary),
        archetype: formatArchetypeName(archetype.primary),
        topStrengths: greenFlags.slice(0, 4),
        concerns: redFlags.slice(0, 4),
      },

      dimensionDetails,

      behavioralInsights: {
        communicationStyle,
        problemSolvingApproach,
        teamworkIndicators,
        leadershipPotential,
      },

      risks: {
        cultureFitRisk,
        performanceRisk,
        retentionRisk,
        redFlags,
      },

      notableQuotes: extractNotableQuotes(result),
      nextSteps: generateNextSteps(tierToRecommendation(tier), tier, archetype.confidence),
      interviewQuestions,
    };
  },
};
