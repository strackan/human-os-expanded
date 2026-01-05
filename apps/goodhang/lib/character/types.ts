/**
 * D&D Character System - Constants and Helper Functions
 *
 * This file contains the mapping logic for converting assessment results
 * into Race, Class, and Alignment. The actual assessment questions are
 * defined separately (see PAUSE point in implementation plan).
 */

import type {
  CharacterRace,
  CharacterClass,
  CharacterAlignment,
  ClassBranch,
} from '@/lib/types/database';

// ============================================================
// ATTRIBUTE TYPES
// ============================================================

export type AttributeName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export interface AttributeScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// ============================================================
// RACE DEFINITIONS
// ============================================================

export interface RaceDefinition {
  id: CharacterRace;
  name: string;
  tagline: string;
  emoji: string;
  bonuses: Partial<Record<AttributeName, number>>;
  secondaryPattern: [AttributeName, AttributeName]; // The two secondary attributes that trigger this race
  description: string;
}

export const RACE_DEFINITIONS: Record<CharacterRace, RaceDefinition> = {
  human: {
    id: 'human',
    name: 'Human',
    tagline: 'Versatile generalist, adaptable to any role',
    emoji: '🌍',
    bonuses: { intelligence: 1, charisma: 1 },
    secondaryPattern: ['intelligence', 'charisma'], // Fallback when no clear pattern
    description: 'Jack of all trades, master of potential. Can excel at anything with enough focus.',
  },
  elf: {
    id: 'elf',
    name: 'Elf',
    tagline: 'Graceful and perceptive, sees what others miss',
    emoji: '🌙',
    bonuses: { dexterity: 2, wisdom: 1 },
    secondaryPattern: ['dexterity', 'wisdom'],
    description: 'Elegant problem-solvers with deep insight. Measured, thoughtful, graceful under pressure.',
  },
  dwarf: {
    id: 'dwarf',
    name: 'Dwarf',
    tagline: 'Sturdy and traditional, unshakeable foundation',
    emoji: '⛰️',
    bonuses: { constitution: 2, strength: 1 },
    secondaryPattern: ['constitution', 'strength'],
    description: 'Grounded, reliable, follows through always. Builds to last, not for speed.',
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    tagline: 'Powerful and intense, direct action taker',
    emoji: '⚔️',
    bonuses: { strength: 2, charisma: 1 },
    secondaryPattern: ['strength', 'charisma'],
    description: 'High energy, forceful, gets shit done. Direct communication, no BS.',
  },
  halfling: {
    id: 'halfling',
    name: 'Halfling',
    tagline: 'Nimble and charming, everyone\'s favorite',
    emoji: '🍀',
    bonuses: { dexterity: 2, charisma: 1 },
    secondaryPattern: ['dexterity', 'charisma'],
    description: 'Likeable, adaptable, relationship-focused. Gets by on charm and cleverness.',
  },
  dragonborn: {
    id: 'dragonborn',
    name: 'Dragonborn',
    tagline: 'Bold and commanding, natural leader',
    emoji: '🐉',
    bonuses: { charisma: 2, strength: 1 },
    secondaryPattern: ['charisma', 'strength'],
    description: 'Natural presence, commands respect. Confident, bold, takes charge.',
  },
};

// ============================================================
// CLASS DEFINITIONS
// ============================================================

export interface ClassDefinition {
  id: CharacterClass;
  name: string;
  branch: ClassBranch;
  alignment: CharacterAlignment;
  tagline: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  enneagramMatches: number[]; // Best matching Enneagram types
}

// Map primary attribute to class branch
export const ATTRIBUTE_TO_BRANCH: Record<AttributeName, ClassBranch> = {
  strength: 'fighter',
  dexterity: 'rogue',
  constitution: 'ranger',
  intelligence: 'wizard',
  wisdom: 'cleric',
  charisma: 'bard',
};

// Map branch + alignment to specific class
export const BRANCH_ALIGNMENT_TO_CLASS: Record<ClassBranch, Record<CharacterAlignment, CharacterClass>> = {
  fighter: {
    LG: 'paladin',
    NG: 'guardian',
    CG: 'berserker',
    LN: 'soldier',
    TN: 'mercenary',
    CN: 'barbarian',
    LE: 'warlord',
    NE: 'bounty_hunter',
    CE: 'raider',
  },
  rogue: {
    LG: 'scout',
    NG: 'agent',
    CG: 'swashbuckler',
    LN: 'spy',
    TN: 'thief',
    CN: 'trickster',
    LE: 'assassin',
    NE: 'freelancer',
    CE: 'poacher',
  },
  ranger: {
    LG: 'warden',
    NG: 'pathfinder',
    CG: 'wanderer',
    LN: 'sentinel',
    TN: 'survivalist',
    CN: 'nomad',
    LE: 'tracker',
    NE: 'scavenger',
    CE: 'outcast',
  },
  wizard: {
    LG: 'sage',
    NG: 'enchanter',
    CG: 'alchemist',
    LN: 'lorekeeper',
    TN: 'artificer',
    CN: 'illusionist',
    LE: 'necromancer',
    NE: 'warlock',
    CE: 'maverick',
  },
  cleric: {
    LG: 'priest',
    NG: 'healer',
    CG: 'shaman',
    LN: 'judge',
    TN: 'druid',
    CN: 'oracle',
    LE: 'inquisitor',
    NE: 'cult_leader',
    CE: 'heretic',
  },
  bard: {
    LG: 'herald',
    NG: 'minstrel',
    CG: 'troubadour',
    LN: 'diplomat',
    TN: 'performer',
    CN: 'fool',
    LE: 'propagandist',
    NE: 'charlatan',
    CE: 'provocateur',
  },
};

// Human-readable class names
export const CLASS_DISPLAY_NAMES: Record<CharacterClass, string> = {
  // Fighter
  paladin: 'Paladin',
  guardian: 'Guardian',
  berserker: 'Berserker',
  soldier: 'Soldier',
  mercenary: 'Mercenary',
  barbarian: 'Barbarian',
  warlord: 'Warlord',
  bounty_hunter: 'Bounty Hunter',
  raider: 'Raider',
  // Rogue
  scout: 'Scout',
  agent: 'Agent',
  swashbuckler: 'Swashbuckler',
  spy: 'Spy',
  thief: 'Thief',
  trickster: 'Trickster',
  assassin: 'Assassin',
  freelancer: 'Freelancer',
  poacher: 'Poacher',
  // Ranger
  warden: 'Warden',
  pathfinder: 'Pathfinder',
  wanderer: 'Wanderer',
  sentinel: 'Sentinel',
  survivalist: 'Survivalist',
  nomad: 'Nomad',
  tracker: 'Tracker',
  scavenger: 'Scavenger',
  outcast: 'Outcast',
  // Wizard
  sage: 'Sage',
  enchanter: 'Enchanter',
  alchemist: 'Alchemist',
  lorekeeper: 'Lorekeeper',
  artificer: 'Artificer',
  illusionist: 'Illusionist',
  necromancer: 'Necromancer',
  warlock: 'Warlock',
  maverick: 'Maverick',
  // Cleric
  priest: 'Priest',
  healer: 'Healer',
  shaman: 'Shaman',
  judge: 'Judge',
  druid: 'Druid',
  oracle: 'Oracle',
  inquisitor: 'Inquisitor',
  cult_leader: 'Cult Leader',
  heretic: 'Heretic',
  // Bard
  herald: 'Herald',
  minstrel: 'Minstrel',
  troubadour: 'Troubadour',
  diplomat: 'Diplomat',
  performer: 'Performer',
  fool: 'Fool',
  propagandist: 'Propagandist',
  charlatan: 'Charlatan',
  provocateur: 'Provocateur',
};

// ============================================================
// ALIGNMENT DEFINITIONS
// ============================================================

export interface AlignmentDefinition {
  id: CharacterAlignment;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  orderAxis: 'lawful' | 'neutral' | 'chaotic';
  moralAxis: 'good' | 'neutral' | 'evil';
}

export const ALIGNMENT_DEFINITIONS: Record<CharacterAlignment, AlignmentDefinition> = {
  LG: {
    id: 'LG',
    name: 'Lawful Good',
    shortName: 'The Protector',
    tagline: 'Structured help',
    description: 'Follows rules and systems to help others. Believes structure enables the greatest good.',
    orderAxis: 'lawful',
    moralAxis: 'good',
  },
  NG: {
    id: 'NG',
    name: 'Neutral Good',
    shortName: 'The Helper',
    tagline: 'Pragmatic help',
    description: 'Does what\'s needed to help others, whether that means following rules or bending them.',
    orderAxis: 'neutral',
    moralAxis: 'good',
  },
  CG: {
    id: 'CG',
    name: 'Chaotic Good',
    shortName: 'The Rebel',
    tagline: 'Unconventional help',
    description: 'Breaks rules when they get in the way of helping people. Values freedom and compassion.',
    orderAxis: 'chaotic',
    moralAxis: 'good',
  },
  LN: {
    id: 'LN',
    name: 'Lawful Neutral',
    shortName: 'The Judge',
    tagline: 'By the book',
    description: 'Follows rules and systems above all else. Believes order is more important than good or evil.',
    orderAxis: 'lawful',
    moralAxis: 'neutral',
  },
  TN: {
    id: 'TN',
    name: 'True Neutral',
    shortName: 'The Survivor',
    tagline: 'Balanced',
    description: 'Adapts to circumstances without strong allegiance to order or chaos, self or others.',
    orderAxis: 'neutral',
    moralAxis: 'neutral',
  },
  CN: {
    id: 'CN',
    name: 'Chaotic Neutral',
    shortName: 'The Trickster',
    tagline: 'Unpredictable',
    description: 'Values personal freedom above all else. Does whatever seems interesting or useful in the moment.',
    orderAxis: 'chaotic',
    moralAxis: 'neutral',
  },
  LE: {
    id: 'LE',
    name: 'Lawful Evil',
    shortName: 'The Tyrant',
    tagline: 'Structured gain',
    description: 'Uses rules and systems to advance personal interests. Games systems for advantage.',
    orderAxis: 'lawful',
    moralAxis: 'evil',
  },
  NE: {
    id: 'NE',
    name: 'Neutral Evil',
    shortName: 'The Mercenary',
    tagline: 'Pragmatic gain',
    description: 'Does whatever it takes to get ahead. Follows rules or breaks them based on what\'s useful.',
    orderAxis: 'neutral',
    moralAxis: 'evil',
  },
  CE: {
    id: 'CE',
    name: 'Chaotic Evil',
    shortName: 'The Outlaw',
    tagline: 'Chaotic gain',
    description: 'Prioritizes personal freedom and personal gain. Rules are suggestions at best.',
    orderAxis: 'chaotic',
    moralAxis: 'evil',
  },
};

// ============================================================
// TITLE THRESHOLDS (CS Score → Title Prefix)
// ============================================================

export interface TitleThreshold {
  minScore: number;
  prefix: string;
  description: string;
}

export const TITLE_THRESHOLDS: TitleThreshold[] = [
  { minScore: 95, prefix: 'Legendary', description: 'Top 1% - Exceptional across all dimensions' },
  { minScore: 90, prefix: 'Master', description: 'Top 5% - Expert level performance' },
  { minScore: 85, prefix: 'Expert', description: 'Top 10% - Highly skilled' },
  { minScore: 80, prefix: 'Adept', description: 'Top 20% - Strong performer' },
  { minScore: 75, prefix: 'Journeyman', description: 'Above average - Solid foundation' },
  { minScore: 70, prefix: 'Apprentice', description: 'Developing - Shows promise' },
  { minScore: 0, prefix: '', description: 'No title - Still learning' },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the title prefix based on CS assessment score
 */
export function getTitlePrefix(csScore: number | null | undefined): string {
  if (csScore == null) return '';
  const threshold = TITLE_THRESHOLDS.find(t => csScore >= t.minScore);
  return threshold?.prefix ?? '';
}

/**
 * Format the full display title: "Master Orcish Maverick"
 */
export function formatDisplayTitle(
  race: CharacterRace,
  characterClass: CharacterClass,
  csScore: number | null | undefined
): string {
  const prefix = getTitlePrefix(csScore);
  const className = CLASS_DISPLAY_NAMES[characterClass];

  // Convert race to adjective form for some races
  const raceAdjective = getRaceAdjective(race);

  if (prefix) {
    return `${prefix} ${raceAdjective} ${className}`;
  }
  return `${raceAdjective} ${className}`;
}

/**
 * Get the adjective form of a race name
 */
function getRaceAdjective(race: CharacterRace): string {
  const adjectives: Record<CharacterRace, string> = {
    human: 'Human',
    elf: 'Elven',
    dwarf: 'Dwarven',
    orc: 'Orcish',
    halfling: 'Halfling',
    dragonborn: 'Dragonborn',
  };
  return adjectives[race];
}

/**
 * Get the primary attribute from scores
 */
export function getPrimaryAttribute(scores: AttributeScores): AttributeName {
  const entries = Object.entries(scores) as [AttributeName, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  // Default to strength if somehow empty (shouldn't happen with valid AttributeScores)
  return sorted[0]?.[0] ?? 'strength';
}

/**
 * Get the class branch from primary attribute
 */
export function getClassBranch(primaryAttribute: AttributeName): ClassBranch {
  return ATTRIBUTE_TO_BRANCH[primaryAttribute];
}

/**
 * Get the specific class from branch and alignment
 */
export function getCharacterClass(branch: ClassBranch, alignment: CharacterAlignment): CharacterClass {
  return BRANCH_ALIGNMENT_TO_CLASS[branch][alignment];
}

/**
 * Determine race from secondary attribute pattern
 */
export function determineRace(scores: AttributeScores, primaryAttribute: AttributeName): CharacterRace {
  // Get top 2 non-primary attributes
  const entries = Object.entries(scores) as [AttributeName, number][];
  const secondary = entries
    .filter(([attr]) => attr !== primaryAttribute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const first = secondary[0];
  const second = secondary[1];

  // Need at least 2 secondary attributes to determine race
  if (!first || !second) {
    return 'human';
  }

  // If scores are too balanced, default to human
  if (Math.abs(first[1] - second[1]) < 2) {
    return 'human';
  }

  const secondaryPair = new Set([first[0], second[0]]);

  // Check each race's secondary pattern
  for (const [raceId, race] of Object.entries(RACE_DEFINITIONS)) {
    const pattern = new Set(race.secondaryPattern);
    if (setEquals(secondaryPair, pattern)) {
      return raceId as CharacterRace;
    }
  }

  // Fallback to human if no match
  return 'human';
}

/**
 * Check if two sets are equal
 */
function setEquals<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

/**
 * Generate a deterministic avatar seed from user ID and character data
 */
export function generateAvatarSeed(
  userId: string,
  race: CharacterRace,
  characterClass: CharacterClass,
  alignment: CharacterAlignment
): string {
  return `${userId}-${race}-${characterClass}-${alignment}`;
}
