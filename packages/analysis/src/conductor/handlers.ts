/**
 * Interview Conductor Handlers
 *
 * Pluggable handlers that format raw AssessmentResult into different output formats.
 * Each handler transforms the same core assessment data into a specific presentation.
 */

import type {
  AssessmentResult,
  AssessmentHandler,
  DnDSheet,
  DnDStats,
  DnDClass,
  DnDRace,
  ProfessionalAssessment,
  CompetencyRating,
  HiringRecommendation,
} from './types.js';

import type { CandidateArchetype, InterviewTier, InterviewDimension } from '../types/index.js';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate the average of multiple values
 */
function avg(...values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a score (0-10) to a CompetencyRating
 */
function scoreToRating(score: number): CompetencyRating {
  if (score >= 9) return 'Exceptional';
  if (score >= 7) return 'Exceeds';
  if (score >= 5) return 'Meets';
  if (score >= 3) return 'Developing';
  return 'Below';
}

/**
 * Map archetype to D&D class
 */
function archetypeToClass(archetype: CandidateArchetype): DnDClass {
  const mapping: Record<CandidateArchetype, DnDClass> = {
    technical_builder: 'Artificer',
    gtm_operator: 'Bard',
    creative_strategist: 'Wizard',
    execution_machine: 'Fighter',
    generalist_orchestrator: 'Ranger',
    domain_expert: 'Cleric',
  };
  return mapping[archetype];
}

/**
 * Determine D&D race based on personality traits and scores
 *
 * Race represents the candidate's core nature/approach:
 * - Gnome: High curiosity, loves learning, tinkering mindset
 * - Dwarf: Resilient, deep expertise, steady and reliable
 * - Elf: Refined, strategic, long-term thinker
 * - Human: Adaptable, ambitious, versatile
 * - Half-Elf: Diplomatic, bridges gaps, charismatic communicator
 * - Tiefling: Unconventional thinker, unique perspective
 * - Halfling: Resourceful, optimistic, team player
 * - Dragonborn: Bold leader, commanding presence
 */
function determineRace(result: AssessmentResult): DnDRace {
  const { dimensions, competencies, archetype, emotions } = result;

  // Score each race based on matching traits
  const raceScores: Record<DnDRace, number> = {
    Gnome: 0,
    Dwarf: 0,
    Elf: 0,
    Human: 0,
    'Half-Elf': 0,
    Tiefling: 0,
    Halfling: 0,
    Dragonborn: 0,
  };

  // Gnome: Curiosity + learning + technical
  raceScores.Gnome +=
    (competencies.signals.growth_mindset || 0) * 3 +
    (dimensions.passions.score / 10) * 2 +
    (dimensions.technical.score / 10) * 1;

  // Dwarf: Resilience + expertise + steady work
  raceScores.Dwarf +=
    (competencies.signals.accountability || 0) * 3 +
    (dimensions.work_history.score / 10) * 2 +
    (dimensions.motivation.score / 10) * 1;

  // Elf: Strategic + refined + self-aware
  raceScores.Elf +=
    (dimensions.self_awareness.score / 10) * 3 +
    (dimensions.iq.score / 10) * 2 +
    (archetype.primary === 'creative_strategist' ? 2 : 0);

  // Human: Adaptable + ambitious + versatile
  raceScores.Human +=
    (dimensions.culture_fit.score / 10) * 2 +
    (archetype.primary === 'generalist_orchestrator' ? 2 : 0) +
    (dimensions.motivation.score / 10) * 1;

  // Half-Elf: Diplomatic + charismatic + bridges gaps
  raceScores['Half-Elf'] +=
    (competencies.signals.communication || 0) * 3 +
    (dimensions.empathy.score / 10) * 2 +
    (dimensions.personality.score / 10) * 1;

  // Tiefling: Unconventional + unique + provocative
  raceScores.Tiefling +=
    (archetype.primary === 'creative_strategist' ? 1.5 : 0) +
    (emotions.dominance > 0.6 ? 1 : 0) +
    (result.greenFlags.some(f => f.toLowerCase().includes('unique') || f.toLowerCase().includes('creative')) ? 2 : 0);

  // Halfling: Team player + optimistic + resourceful
  raceScores.Halfling +=
    (competencies.signals.collaboration || 0) * 3 +
    (emotions.valence > 0.5 ? 1.5 : 0) +
    (dimensions.empathy.score / 10) * 1;

  // Dragonborn: Leadership + confidence + bold
  raceScores.Dragonborn +=
    (competencies.signals.leadership || 0) * 3 +
    (competencies.signals.confidence || 0) * 2 +
    (archetype.primary === 'execution_machine' ? 1.5 : 0);

  // Archetype-based bonuses
  switch (archetype.primary) {
    case 'technical_builder':
      raceScores.Gnome += 1;
      raceScores.Dwarf += 0.5;
      break;
    case 'gtm_operator':
      raceScores['Half-Elf'] += 1;
      raceScores.Human += 0.5;
      break;
    case 'creative_strategist':
      raceScores.Elf += 1;
      raceScores.Tiefling += 0.5;
      break;
    case 'execution_machine':
      raceScores.Dwarf += 1;
      raceScores.Dragonborn += 0.5;
      break;
    case 'generalist_orchestrator':
      raceScores.Human += 1;
      raceScores['Half-Elf'] += 0.5;
      break;
    case 'domain_expert':
      raceScores.Elf += 1;
      raceScores.Dwarf += 0.5;
      break;
  }

  // Find highest scoring race
  const sortedRaces = Object.entries(raceScores)
    .sort(([, a], [, b]) => b - a);

  return sortedRaces[0][0] as DnDRace;
}

/**
 * Map tier to D&D level (1-20)
 */
function tierToLevel(tier: InterviewTier): number {
  const mapping: Record<InterviewTier, number> = {
    'top_1%': 20,
    strong: 15,
    moderate: 10,
    weak: 5,
    pass: 1,
  };
  return mapping[tier];
}

/**
 * Map tier to hiring recommendation
 */
function tierToRecommendation(tier: InterviewTier): HiringRecommendation {
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
function getCultureAlignment(score: number): 'Strong' | 'Moderate' | 'Weak' {
  if (score >= 7) return 'Strong';
  if (score >= 4) return 'Moderate';
  return 'Weak';
}

/**
 * Get role fit label from archetype confidence
 */
function getRoleFit(confidence: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (confidence >= 0.8) return 'Excellent';
  if (confidence >= 0.6) return 'Good';
  if (confidence >= 0.4) return 'Fair';
  return 'Poor';
}

/**
 * Get the bottom N dimensions by score
 */
function getBottomDimensions(
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
function formatDimensionName(dimension: InterviewDimension): string {
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
// D&D HANDLER
// =============================================================================

/**
 * D&D Character Sheet Handler
 *
 * Transforms assessment results into a fantasy RPG character sheet format.
 * Great for gamified presentations and making assessments more engaging.
 */
export const dndHandler: AssessmentHandler<DnDSheet> = {
  name: 'D&D Character Sheet',
  description: 'Formats assessment as a fantasy RPG character sheet with stats, class, and abilities',

  format(result: AssessmentResult): DnDSheet {
    const { dimensions, archetype, tier, competencies, greenFlags, redFlags, candidateName } = result;

    // Calculate D&D stats (scale 1-20, derived from 0-10 dimension scores)
    const stats: DnDStats = {
      STR: clamp(Math.round(avg(dimensions.gtm.score, dimensions.technical.score) * 2), 1, 20),
      DEX: clamp(Math.round(avg(dimensions.culture_fit.score, dimensions.empathy.score) * 2), 1, 20),
      CON: clamp(Math.round(avg(dimensions.motivation.score, dimensions.work_history.score) * 2), 1, 20),
      INT: clamp(Math.round(avg(dimensions.iq.score, dimensions.technical.score) * 2), 1, 20),
      WIS: clamp(Math.round(avg(dimensions.self_awareness.score, dimensions.eq.score) * 2), 1, 20),
      CHA: clamp(Math.round(avg(dimensions.personality.score, dimensions.empathy.score) * 2), 1, 20),
    };

    // Get top 3 competency signals as proficiencies
    const proficiencies = competencies.dominantSignals.slice(0, 3).map((signal) => {
      // Format signal name nicely
      return signal
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });

    // Determine race and class
    const race = determineRace(result);
    const className = archetypeToClass(archetype.primary);
    const level = tierToLevel(tier);

    // Generate backstory from assessment data
    const backstory = generateBackstory(candidateName, race, className, level, stats, proficiencies);

    return {
      name: candidateName,
      race,
      class: className,
      level,
      stats,
      proficiencies,
      traits: greenFlags.slice(0, 3),
      flaws: redFlags.slice(0, 2),
      backstory,
    };
  },
};

/**
 * Generate a short narrative backstory for the D&D sheet
 */
function generateBackstory(
  name: string,
  race: DnDRace,
  className: DnDClass,
  level: number,
  stats: DnDStats,
  proficiencies: string[]
): string {
  const classDescriptions: Record<DnDClass, string> = {
    Artificer: 'a master craftsperson who builds solutions from raw materials',
    Bard: 'a charismatic performer who wins hearts and closes deals',
    Wizard: 'a brilliant strategist who sees patterns others miss',
    Fighter: 'a disciplined warrior who executes with precision',
    Ranger: 'a versatile explorer who adapts to any terrain',
    Cleric: 'a devoted specialist who channels deep domain knowledge',
  };

  const raceDescriptions: Record<DnDRace, string> = {
    Gnome: 'With insatiable curiosity and a tinkerer\'s spirit',
    Dwarf: 'With steadfast resilience and master-craftsman dedication',
    Elf: 'With refined elegance and a strategist\'s patience',
    Human: 'With ambitious versatility and adaptive spirit',
    'Half-Elf': 'With diplomatic grace and bridge-building instincts',
    Tiefling: 'With unconventional thinking and bold perspective',
    Halfling: 'With optimistic resourcefulness and team-first mentality',
    Dragonborn: 'With commanding presence and bold leadership',
  };

  const levelDescriptor =
    level >= 15 ? 'legendary' : level >= 10 ? 'seasoned' : level >= 5 ? 'promising' : 'novice';

  // Find strongest stat
  const statEntries = Object.entries(stats) as [keyof DnDStats, number][];
  const strongestStat = statEntries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

  const statDescriptions: Record<keyof DnDStats, string> = {
    STR: 'possessing remarkable strength in execution',
    DEX: 'moving with grace through complex situations',
    CON: 'showing unwavering endurance and persistence',
    INT: 'wielding sharp intellect as their greatest weapon',
    WIS: 'guided by deep wisdom and self-knowledge',
    CHA: 'commanding attention in any room they enter',
  };

  const proficiencyText =
    proficiencies.length > 0
      ? `Trained in ${proficiencies.join(', ').toLowerCase()}, they`
      : 'They';

  return `${name} is a ${levelDescriptor} ${race} ${className}, ${classDescriptions[className]}. ${raceDescriptions[race]}, ${statDescriptions[strongestStat]}, ${proficiencyText} seek new challenges to prove their worth.`;
}

// =============================================================================
// PROFESSIONAL HANDLER
// =============================================================================

/**
 * Professional Assessment Handler
 *
 * Transforms assessment results into a traditional HR/recruiting format.
 * Suitable for formal reports and hiring committee reviews.
 */
export const professionalHandler: AssessmentHandler<ProfessionalAssessment> = {
  name: 'Professional Assessment',
  description: 'Formats assessment as a formal HR evaluation with ratings and recommendations',

  format(result: AssessmentResult): ProfessionalAssessment {
    const {
      candidateName,
      dimensions,
      overallScore,
      tier,
      archetype,
      greenFlags,
      completedAt,
    } = result;

    // Map each dimension to CompetencyRating
    const competencyLevels: Record<string, CompetencyRating> = {};
    for (const [dim, data] of Object.entries(dimensions)) {
      const formattedName = formatDimensionName(dim as InterviewDimension);
      competencyLevels[formattedName] = scoreToRating(data.score);
    }

    // Get bottom 3 dimensions as development areas
    const bottomDimensions = getBottomDimensions(dimensions, 3);
    const developmentAreas = bottomDimensions.map((dim) => {
      const score = dimensions[dim].score;
      const name = formatDimensionName(dim);
      if (score < 3) {
        return `${name}: Requires significant development`;
      } else if (score < 5) {
        return `${name}: Area for growth and coaching`;
      } else {
        return `${name}: Opportunity for further development`;
      }
    });

    // Generate professional summary
    const recommendation = tierToRecommendation(tier);
    const summary = generateProfessionalSummary(
      candidateName,
      overallScore,
      tier,
      archetype.primary,
      greenFlags
    );

    // Generate appropriate next steps based on recommendation
    const nextSteps = generateNextSteps(recommendation, tier, archetype.confidence);

    return {
      candidateName,
      assessmentDate: completedAt,
      overallRating: scoreToRating(overallScore),
      recommendation,
      competencyLevels,
      strengths: greenFlags,
      developmentAreas,
      cultureAlignment: getCultureAlignment(dimensions.culture_fit.score),
      rolefit: getRoleFit(archetype.confidence),
      summary,
      nextSteps,
    };
  },
};

/**
 * Generate a professional summary paragraph
 */
function generateProfessionalSummary(
  name: string,
  score: number,
  tier: InterviewTier,
  archetype: CandidateArchetype,
  strengths: string[]
): string {
  const archetypeDescriptions: Record<CandidateArchetype, string> = {
    technical_builder: 'technical problem-solving and building capabilities',
    gtm_operator: 'go-to-market execution and commercial acumen',
    creative_strategist: 'strategic thinking and creative problem-solving',
    execution_machine: 'operational excellence and consistent delivery',
    generalist_orchestrator: 'versatility and cross-functional collaboration',
    domain_expert: 'deep domain expertise and specialized knowledge',
  };

  const tierDescriptions: Record<InterviewTier, string> = {
    'top_1%': 'an exceptional candidate who demonstrates outstanding capabilities',
    strong: 'a strong candidate who exceeds expectations across key areas',
    moderate: 'a capable candidate who meets core requirements',
    weak: 'a candidate who shows potential but has significant gaps',
    pass: 'a candidate who does not meet the minimum requirements',
  };

  const strengthText =
    strengths.length > 0
      ? ` Key strengths include: ${strengths.slice(0, 2).join('; ')}.`
      : '';

  return `${name} is ${tierDescriptions[tier]}, with a primary profile in ${archetypeDescriptions[archetype]}. Overall assessment score: ${score.toFixed(1)}/10.${strengthText}`;
}

/**
 * Generate appropriate next steps based on recommendation
 */
function generateNextSteps(
  recommendation: HiringRecommendation,
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

// =============================================================================
// HIRING MANAGER REPORT
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
    const cultureFitRisk = dimensions.culture_fit.score < 5 ? 'High' : dimensions.culture_fit.score < 7 ? 'Moderate' : 'Low';
    const performanceRisk = overallScore < 5 ? 'High' : overallScore < 7 ? 'Moderate' : 'Low';
    const retentionRisk = dimensions.motivation.score < 5 ? 'High' : dimensions.motivation.score < 7 ? 'Moderate' : 'Low';

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

// =============================================================================
// CANDIDATE SUMMARY (Shareable)
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

export const candidateSummaryHandler: AssessmentHandler<CandidateSummary> = {
  name: 'Candidate Summary',
  description: 'Shareable summary for candidates that focuses on insights rather than scores',

  format(result: AssessmentResult): CandidateSummary {
    const {
      candidateName,
      dimensions,
      overallScore,
      tier,
      archetype,
      greenFlags,
      competencies,
    } = result;

    // Get top 3 dimensions as strengths
    const sortedDims = Object.entries(dimensions)
      .sort((a, b) => b[1].score - a[1].score);
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

// =============================================================================
// HELPER FUNCTIONS FOR NEW HANDLERS
// =============================================================================

function formatTierDisplay(tier: InterviewTier): string {
  const displays: Record<InterviewTier, string> = {
    'top_1%': 'Exceptional (Top 1%)',
    strong: 'Strong',
    moderate: 'Moderate',
    weak: 'Needs Development',
    pass: 'Below Threshold',
  };
  return displays[tier];
}

function formatArchetypeName(archetype: CandidateArchetype): string {
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

function generateHeadline(name: string, tier: InterviewTier, archetype: CandidateArchetype): string {
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

function deriveCommunicationStyle(emotions: AssessmentResult['emotions'], competencies: AssessmentResult['competencies']): string {
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

function deriveProblemSolving(dimensions: AssessmentResult['dimensions'], competencies: AssessmentResult['competencies']): string {
  const iq = dimensions.iq.score;
  const psScore = competencies.signals.problem_solving || 0;

  if (iq >= 8 && psScore > 0.7) {
    return 'Systematic and analytical; tackles complex problems methodically';
  } else if (iq >= 6) {
    return 'Capable problem solver with room to develop deeper analytical skills';
  }
  return 'May need guidance on complex problem-solving; strengths lie elsewhere';
}

function deriveTeamwork(dimensions: AssessmentResult['dimensions'], competencies: AssessmentResult['competencies']): string {
  const empathy = dimensions.empathy.score;
  const collabScore = competencies.signals.collaboration || 0;

  if (empathy >= 8 && collabScore > 0.7) {
    return 'Strong team orientation; naturally collaborative and empathetic';
  } else if (empathy >= 6 || collabScore > 0.5) {
    return 'Works well with others; can contribute to team dynamics';
  }
  return 'More individually focused; team integration may need attention';
}

function deriveLeadership(dimensions: AssessmentResult['dimensions'], competencies: AssessmentResult['competencies']): string {
  const leadership = competencies.signals.leadership || 0;
  const selfAwareness = dimensions.self_awareness.score;

  if (leadership > 0.7 && selfAwareness >= 7) {
    return 'High potential; shows both influence skills and self-awareness';
  } else if (leadership > 0.5) {
    return 'Emerging leadership capacity; could develop with right opportunities';
  }
  return 'Currently more of an individual contributor profile';
}

function generateProbingQuestions(dimensions: AssessmentResult['dimensions'], redFlags: string[]): string[] {
  const questions: string[] = [];

  // Add questions based on low dimensions
  const sortedDims = Object.entries(dimensions)
    .sort((a, b) => a[1].score - b[1].score);

  for (const [dim, data] of sortedDims.slice(0, 2)) {
    if (data.score < 5) {
      questions.push(getQuestionForDimension(dim as InterviewDimension));
    }
  }

  // Add questions based on red flags
  if (redFlags.some(f => f.toLowerCase().includes('accountab'))) {
    questions.push('Tell me about a time when a project failed. What was your role in that failure?');
  }
  if (redFlags.some(f => f.toLowerCase().includes('team') || f.toLowerCase().includes('collab'))) {
    questions.push('Describe a situation where you had to work with someone you disagreed with. How did you handle it?');
  }

  return questions.slice(0, 4);
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

function extractNotableQuotes(result: AssessmentResult): string[] {
  // Extract some candidate quotes from transcript (taking snippets)
  const candidateEntries = result.transcript.filter(e => e.speaker === 'candidate');
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

function getWorkStyleDescription(archetype: CandidateArchetype, competencies: AssessmentResult['competencies']): string {
  const base: Record<CandidateArchetype, string> = {
    technical_builder: 'You approach challenges as opportunities to build and create. Your strength lies in taking complex problems and crafting elegant solutions.',
    gtm_operator: 'You thrive in the space between product and customer. Your natural inclination is to bridge gaps and drive things forward.',
    creative_strategist: 'You see patterns others miss and enjoy designing solutions at a higher level. Strategic thinking comes naturally to you.',
    execution_machine: 'You get things done. Period. Your strength is turning plans into reality with discipline and consistency.',
    generalist_orchestrator: 'You\'re versatile and adaptive, comfortable switching contexts and connecting different pieces together.',
    domain_expert: 'You go deep. Your expertise in your area gives you credibility and the ability to solve specialized problems.',
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
// FORMAT HELPER
// =============================================================================

/**
 * Format an assessment result using a specific handler
 *
 * @param result - The raw assessment result
 * @param handler - The handler to use for formatting
 * @returns The formatted output in the handler's type
 */
export function formatResult<T>(result: AssessmentResult, handler: AssessmentHandler<T>): T {
  return handler.format(result);
}
