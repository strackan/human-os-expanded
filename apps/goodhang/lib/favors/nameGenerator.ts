// Procedural name generator for Favor Tokens
// Generates unique ancient/mystical sounding names like "Gilla Macondi", "Thren Valorix"

// First name components
const FIRST_PREFIXES = [
  'Gal', 'Gil', 'Thren', 'Bex', 'Vor', 'Zir', 'Kael', 'Mira', 'Fen',
  'Dax', 'Lyra', 'Orn', 'Quil', 'Syl', 'Tav', 'Vel', 'Wren', 'Xan',
  'Yor', 'Zeph', 'Ael', 'Brin', 'Cael', 'Dren', 'Elix', 'Fyn',
  'Gwen', 'Hex', 'Iri', 'Jax', 'Kira', 'Lux', 'Nyx', 'Ren', 'Sol',
];

const FIRST_SUFFIXES = [
  'la', 'ra', 'na', 'wyn', 'ix', 'ax', 'on', 'en', 'ar', 'ir',
  'os', 'us', 'is', 'a', 'i', 'o', 'ian', 'iel', 'ius', 'ora',
];

// Last name components
const LAST_PREFIXES = [
  'Mac', 'Val', 'Sund', 'Dor', 'Cres', 'Mor', 'Zal', 'Kend', 'Rav',
  'Tor', 'Eld', 'Fal', 'Grim', 'Hol', 'Jas', 'Kel', 'Lor', 'Mar',
  'Nar', 'Orix', 'Pyr', 'Quen', 'Ral', 'Sar', 'Tal', 'Var', 'Wis',
  'Xen', 'Yar', 'Zan', 'Aer', 'Bel', 'Cor', 'Del', 'Eth', 'Fer',
];

const LAST_SUFFIXES = [
  'ondi', 'orix', 'dari', 'wen', 'ari', 'orn', 'eth', 'wyn', 'ion',
  'ius', 'ael', 'ier', 'and', 'ond', 'ith', 'oth', 'esh', 'ash',
  'ix', 'ax', 'ex', 'ox', 'is', 'os', 'us', 'an', 'en', 'in',
];

// Seeded random number generator for deterministic names
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return function() {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

function pickFromArray<T>(arr: T[], random: () => number): T {
  return arr[Math.floor(random() * arr.length)] as T;
}

/**
 * Generates a unique token name from a seed
 * The same seed will always produce the same name
 */
export function generateTokenName(seed: string): string {
  const random = seededRandom(seed);

  // Generate first name
  const firstPrefix = pickFromArray(FIRST_PREFIXES, random);
  const firstSuffix = pickFromArray(FIRST_SUFFIXES, random);
  const firstName = firstPrefix + firstSuffix;

  // Generate last name
  const lastPrefix = pickFromArray(LAST_PREFIXES, random);
  const lastSuffix = pickFromArray(LAST_SUFFIXES, random);
  const lastName = lastPrefix + lastSuffix;

  return `${firstName} ${lastName}`;
}

/**
 * Generates a unique seed for a new token
 * Combines timestamp with random bytes for uniqueness
 */
export function generateTokenSeed(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}

/**
 * Batch generates multiple unique names (for testing/preview)
 */
export function generateSampleNames(count: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const seed = generateTokenSeed() + i;
    names.push(generateTokenName(seed));
  }
  return names;
}
