/**
 * D&D Character Sheet Handler
 *
 * Transforms assessment results into a fantasy RPG character sheet format.
 * Great for gamified presentations and making assessments more engaging.
 */

import type {
  AssessmentResult,
  AssessmentHandler,
  DnDSheet,
  DnDStats,
  DnDClass,
  DnDRace,
} from '../types.js';

import type { CandidateArchetype, InterviewTier } from '../../types/index.js';
import { avg, clamp } from './utils.js';

// =============================================================================
// D&D MAPPING FUNCTIONS
// =============================================================================

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
 * Determine D&D race based on personality traits and scores
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
// D&D HANDLER
// =============================================================================

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
