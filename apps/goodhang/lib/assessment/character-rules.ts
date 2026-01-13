// D&D Character Generation Rules for Good Hang
// Based on attribute scores and alignment signals

import type {
  Attributes,
  AttributeCode,
  Alignment,
  OrderAxis,
  MoralAxis,
  Race,
  CharacterClass,
  AlignmentScores,
} from './types';

// Determine alignment from accumulated signals
export function determineAlignment(scores: AlignmentScores): Alignment {
  // Determine order axis (Lawful/Neutral/Chaotic)
  let orderAxis: OrderAxis;
  if (scores.order.lawful > scores.order.chaotic && scores.order.lawful > scores.order.neutral) {
    orderAxis = 'Lawful';
  } else if (scores.order.chaotic > scores.order.lawful && scores.order.chaotic > scores.order.neutral) {
    orderAxis = 'Chaotic';
  } else {
    orderAxis = 'Neutral';
  }

  // Determine moral axis (Good/Neutral/Evil)
  let moralAxis: MoralAxis;
  if (scores.moral.good > scores.moral.evil && scores.moral.good > scores.moral.neutral) {
    moralAxis = 'Good';
  } else if (scores.moral.evil > scores.moral.good && scores.moral.evil > scores.moral.neutral) {
    moralAxis = 'Evil';
  } else {
    moralAxis = 'Neutral';
  }

  // Combine into alignment
  if (orderAxis === 'Neutral' && moralAxis === 'Neutral') {
    return 'True Neutral';
  }
  return `${orderAxis} ${moralAxis}` as Alignment;
}

// Get the median of all attributes
function getMedian(attrs: Attributes): number {
  const values = Object.values(attrs).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0
    ? values[mid]
    : (values[mid - 1] + values[mid]) / 2;
}

// Find the highest attribute
function getHighestAttribute(attrs: Attributes): AttributeCode {
  let highest: AttributeCode = 'INT';
  let highestValue = attrs.INT;

  for (const [key, value] of Object.entries(attrs) as [AttributeCode, number][]) {
    if (value > highestValue) {
      highest = key;
      highestValue = value;
    }
  }
  return highest;
}

// Check if an attribute is below median
function isBelowMedian(value: number, median: number): boolean {
  return value < median;
}

// Check if an attribute is above median
function isAboveMedian(value: number, median: number): boolean {
  return value > median;
}

// Check if attributes are balanced (no single dominant)
function isBalanced(attrs: Attributes): boolean {
  const values = Object.values(attrs);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return max - min <= 2; // Within 2 points of each other
}

// Determine race based on attribute pattern
export function determineRace(attrs: Attributes): { race: Race; modifiers: Partial<Attributes> } {
  const median = getMedian(attrs);
  const highest = getHighestAttribute(attrs);

  // Human: Balanced, no single dominant
  if (isBalanced(attrs)) {
    return {
      race: 'Human',
      modifiers: { INT: 1, WIS: 1, CHA: 1, CON: 1, STR: 1, DEX: 1 },
    };
  }

  // Elven: INT highest, CHA below median
  if (highest === 'INT' && isBelowMedian(attrs.CHA, median)) {
    return {
      race: 'Elven',
      modifiers: { INT: 2, WIS: 1, CHA: -1 },
    };
  }

  // Half-Orc: CHA highest, STR above median
  if (highest === 'CHA' && isAboveMedian(attrs.STR, median)) {
    return {
      race: 'Half-Orc',
      modifiers: { CHA: 2, STR: 1, INT: -1 },
    };
  }

  // Tiefling: DEX highest, CON below median
  if (highest === 'DEX' && isBelowMedian(attrs.CON, median)) {
    return {
      race: 'Tiefling',
      modifiers: { DEX: 2, INT: 1, CON: -2 },
    };
  }

  // Dwarven: CON highest
  if (highest === 'CON') {
    return {
      race: 'Dwarven',
      modifiers: { CON: 2, WIS: 1, DEX: -1 },
    };
  }

  // Halfling: WIS highest, STR below median
  if (highest === 'WIS' && isBelowMedian(attrs.STR, median)) {
    return {
      race: 'Halfling',
      modifiers: { WIS: 2, DEX: 1, STR: -1 },
    };
  }

  // Default fallback based on highest attribute
  // Note: CON is already handled above, remaining cases are for
  // attributes that didn't match secondary conditions
  if (highest === 'INT') {
    return { race: 'Elven', modifiers: { INT: 2, WIS: 1, CHA: -1 } };
  }
  if (highest === 'WIS') {
    return { race: 'Halfling', modifiers: { WIS: 2, DEX: 1, STR: -1 } };
  }
  if (highest === 'CHA') {
    return { race: 'Half-Orc', modifiers: { CHA: 2, STR: 1, INT: -1 } };
  }
  if (highest === 'STR') {
    return { race: 'Half-Orc', modifiers: { CHA: 2, STR: 1, INT: -1 } };
  }
  if (highest === 'DEX') {
    return { race: 'Tiefling', modifiers: { DEX: 2, INT: 1, CON: -2 } };
  }

  // Final default
  return { race: 'Human', modifiers: { INT: 1, WIS: 1, CHA: 1, CON: 1, STR: 1, DEX: 1 } };
}

// Get top two attributes
function getTopTwoAttributes(attrs: Attributes): [AttributeCode, AttributeCode] {
  const sorted = (Object.entries(attrs) as [AttributeCode, number][])
    .sort(([, a], [, b]) => b - a);
  // Attributes will always have 6 entries, but TypeScript needs explicit checks
  const first = sorted[0]?.[0] ?? 'INT';
  const second = sorted[1]?.[0] ?? 'WIS';
  return [first, second];
}

// Determine class based on alignment and attributes
export function determineClass(alignment: Alignment, attrs: Attributes): CharacterClass {
  const [top1, top2] = getTopTwoAttributes(attrs);
  const topSet = new Set([top1, top2]);

  // Paladin: Lawful Good, STR + WIS
  if (alignment === 'Lawful Good' && topSet.has('STR') && topSet.has('WIS')) {
    return 'Paladin';
  }

  // Cleric: Any Good, WIS + CHA
  if (alignment.includes('Good') && topSet.has('WIS') && topSet.has('CHA')) {
    return 'Cleric';
  }

  // Wizard: Any Lawful, INT + WIS
  if (alignment.includes('Lawful') && topSet.has('INT') && topSet.has('WIS')) {
    return 'Wizard';
  }

  // Artificer: Lawful/Neutral (not Chaotic), INT + CON
  if (!alignment.includes('Chaotic') && topSet.has('INT') && topSet.has('CON')) {
    return 'Artificer';
  }

  // Bard: Any Good, CHA + DEX
  if (alignment.includes('Good') && topSet.has('CHA') && topSet.has('DEX')) {
    return 'Bard';
  }

  // Rogue: Chaotic or Neutral (not Good), DEX + INT
  if ((alignment.includes('Chaotic') || alignment.includes('Neutral')) &&
      !alignment.includes('Good') && topSet.has('DEX') && topSet.has('INT')) {
    return 'Rogue';
  }

  // Ranger: Any Neutral alignment, WIS + CON
  if (alignment.includes('Neutral') && topSet.has('WIS') && topSet.has('CON')) {
    return 'Ranger';
  }

  // Sorcerer: Any Chaotic, DEX + CHA
  if (alignment.includes('Chaotic') && topSet.has('DEX') && topSet.has('CHA')) {
    return 'Sorcerer';
  }

  // Barbarian: Chaotic, STR + CON
  if (alignment.includes('Chaotic') && topSet.has('STR') && topSet.has('CON')) {
    return 'Barbarian';
  }

  // Fallback logic based on top attribute
  switch (top1) {
    case 'INT':
      return alignment.includes('Chaotic') ? 'Rogue' : 'Wizard';
    case 'WIS':
      return alignment.includes('Good') ? 'Cleric' : 'Ranger';
    case 'CHA':
      return alignment.includes('Chaotic') ? 'Sorcerer' : 'Bard';
    case 'CON':
      return alignment.includes('Lawful') ? 'Artificer' : 'Ranger';
    case 'STR':
      return alignment.includes('Good') ? 'Paladin' : 'Barbarian';
    case 'DEX':
      return alignment.includes('Good') ? 'Bard' : 'Rogue';
    default:
      return 'Ranger'; // True neutral fallback
  }
}

// Apply race modifiers to base attributes
export function applyRaceModifiers(
  baseAttrs: Attributes,
  modifiers: Partial<Attributes>
): Attributes {
  const result = { ...baseAttrs };
  for (const [key, value] of Object.entries(modifiers) as [AttributeCode, number][]) {
    result[key] = Math.max(1, Math.min(10, result[key] + value)); // Clamp 1-10
  }
  return result;
}

// Generate a tagline based on class, race, and dominant traits
export function generateTagline(
  characterClass: CharacterClass,
  _race: Race,
  attrs: Attributes,
  interests: string[]
): string {
  const highest = getHighestAttribute(attrs);

  const classDescriptions: Record<CharacterClass, string> = {
    Paladin: 'principled protector',
    Wizard: 'curious scholar',
    Bard: 'natural connector',
    Rogue: 'clever operator',
    Ranger: 'quiet observer',
    Sorcerer: 'spontaneous spark',
    Artificer: 'methodical builder',
    Barbarian: 'force of nature',
    Cleric: 'empathic healer',
  };

  const attrFlavors: Record<AttributeCode, string> = {
    INT: 'with endless curiosity',
    WIS: 'with deep self-awareness',
    CHA: 'who lights up a room',
    CON: 'who shows up consistently',
    STR: 'who goes after what they want',
    DEX: 'who adapts to anything',
  };

  const baseDescription = classDescriptions[characterClass];
  const flavor = attrFlavors[highest];

  // Add interest flavor if available
  if (interests.length > 0) {
    const interest = interests[0];
    return `A ${baseDescription} ${flavor}, obsessed with ${interest}`;
  }

  return `A ${baseDescription} ${flavor}`;
}

// Class descriptions for UI
export const CLASS_DESCRIPTIONS: Record<CharacterClass, string> = {
  Paladin: 'The Protector - principled, strong, wise',
  Wizard: 'The Scholar - intellectual, methodical, wise',
  Bard: 'The Connector - charismatic, adaptable, social',
  Rogue: 'The Operator - clever, adaptable, independent',
  Ranger: 'The Observer - wise, consistent, grounded',
  Sorcerer: 'The Spark - spontaneous, charismatic, bold',
  Artificer: 'The Builder - intelligent, consistent, methodical',
  Barbarian: 'The Force - strong, consistent, direct',
  Cleric: 'The Healer - wise, charismatic, empathic',
};

// Race descriptions for UI
export const RACE_DESCRIPTIONS: Record<Race, string> = {
  Elven: 'Intellectual and introspective, values depth over breadth',
  'Half-Orc': 'Charismatic and strong, natural leader',
  Tiefling: 'Adaptable and clever, thrives in uncertainty',
  Dwarven: 'Consistent and grounded, values reliability',
  Human: 'Balanced and versatile, jack of all trades',
  Halfling: 'Wise and nimble, emotionally intelligent',
};

// Alignment descriptions for UI (reframing "Evil" as "Independent")
export const ALIGNMENT_DESCRIPTIONS: Record<Alignment, string> = {
  'Lawful Good': 'Principled helper - follows rules to do good',
  'Neutral Good': 'Flexible helper - does good however works',
  'Chaotic Good': 'Rebel with a cause - breaks rules for the greater good',
  'Lawful Neutral': 'Disciplined - values order and structure',
  'True Neutral': 'Balanced - adapts to situation',
  'Chaotic Neutral': 'Free spirit - follows their own path',
  'Lawful Evil': 'Strategic self-interest - works within systems',
  'Neutral Evil': 'Pragmatic self-interest - does what works',
  'Chaotic Evil': 'Unbound self-interest - rejects all constraints',
};
