/**
 * Reference Archetypes for Persona Constellation Matching
 *
 * Scored reference personas across 8 dimensions.
 * Used internally for voice calibration -- NOT user-facing labels.
 */

import type { PersonaFingerprint } from './configurePersona';

export interface Archetype {
  id: string;
  name: string;
  fingerprint: PersonaFingerprint;
  vibe: string;
  traitLabel: string; // e.g. "Colbert's knowing wink"
}

export interface ConstellationMatch {
  archetype: string;
  similarity: number; // 0-1
  traitMatch: string; // e.g. "Colbert's knowing wink"
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'conan',
    name: 'Conan O\'Brien',
    fingerprint: {
      self_deprecation: 9,
      directness: 5,
      warmth: 7,
      intellectual_signaling: 7,
      comfort_with_sincerity: 6,
      absurdism_tolerance: 10,
      format_awareness: 8,
      vulnerability_as_tool: 9,
    },
    vibe: 'Manic self-undermining genius with hidden warmth',
    traitLabel: 'Conan\'s self-deprecating absurdity',
  },
  {
    id: 'colbert',
    name: 'Stephen Colbert',
    fingerprint: {
      self_deprecation: 6,
      directness: 7,
      warmth: 6,
      intellectual_signaling: 9,
      comfort_with_sincerity: 8,
      absurdism_tolerance: 7,
      format_awareness: 10,
      vulnerability_as_tool: 5,
    },
    vibe: 'Sharp intellectual with a knowing wink',
    traitLabel: 'Colbert\'s knowing wink',
  },
  {
    id: 'brene',
    name: 'Brene Brown',
    fingerprint: {
      self_deprecation: 4,
      directness: 6,
      warmth: 10,
      intellectual_signaling: 7,
      comfort_with_sincerity: 10,
      absurdism_tolerance: 2,
      format_awareness: 3,
      vulnerability_as_tool: 10,
    },
    vibe: 'Research-backed vulnerability as superpower',
    traitLabel: 'Brene\'s grounded vulnerability',
  },
  {
    id: 'garyvee',
    name: 'Gary Vee',
    fingerprint: {
      self_deprecation: 2,
      directness: 10,
      warmth: 4,
      intellectual_signaling: 3,
      comfort_with_sincerity: 5,
      absurdism_tolerance: 3,
      format_awareness: 2,
      vulnerability_as_tool: 3,
    },
    vibe: 'Relentless urgency with buried care',
    traitLabel: 'Gary Vee\'s no-excuses directness',
  },
  {
    id: 'justin',
    name: 'Justin Strackany',
    fingerprint: {
      self_deprecation: 5,
      directness: 8,
      warmth: 6,
      intellectual_signaling: 6,
      comfort_with_sincerity: 7,
      absurdism_tolerance: 6,
      format_awareness: 5,
      vulnerability_as_tool: 6,
    },
    vibe: 'Intellectual contrarian with rabbit hole energy',
    traitLabel: 'Justin\'s contrarian tangents',
  },
  {
    id: 'tedlasso',
    name: 'Ted Lasso',
    fingerprint: {
      self_deprecation: 7,
      directness: 4,
      warmth: 10,
      intellectual_signaling: 3,
      comfort_with_sincerity: 9,
      absurdism_tolerance: 6,
      format_awareness: 2,
      vulnerability_as_tool: 7,
    },
    vibe: 'Radical optimism that lands harder than expected',
    traitLabel: 'Ted Lasso\'s disarming sincerity',
  },
  {
    id: 'bobross',
    name: 'Bob Ross',
    fingerprint: {
      self_deprecation: 3,
      directness: 3,
      warmth: 9,
      intellectual_signaling: 2,
      comfort_with_sincerity: 8,
      absurdism_tolerance: 2,
      format_awareness: 1,
      vulnerability_as_tool: 4,
    },
    vibe: 'Patient encouragement and happy accidents',
    traitLabel: 'Bob Ross\'s calm encouragement',
  },
  {
    id: 'mrrogers',
    name: 'Mr. Rogers',
    fingerprint: {
      self_deprecation: 2,
      directness: 5,
      warmth: 10,
      intellectual_signaling: 5,
      comfort_with_sincerity: 10,
      absurdism_tolerance: 1,
      format_awareness: 3,
      vulnerability_as_tool: 5,
    },
    vibe: 'Quiet power through radical acceptance',
    traitLabel: 'Mr. Rogers\' radical acceptance',
  },
  {
    id: 'estherperel',
    name: 'Esther Perel',
    fingerprint: {
      self_deprecation: 3,
      directness: 7,
      warmth: 6,
      intellectual_signaling: 9,
      comfort_with_sincerity: 7,
      absurdism_tolerance: 4,
      format_awareness: 5,
      vulnerability_as_tool: 8,
    },
    vibe: 'Intellectually seductive reframer',
    traitLabel: 'Esther Perel\'s therapeutic reframing',
  },
];

const DIMENSIONS: (keyof PersonaFingerprint)[] = [
  'self_deprecation',
  'directness',
  'warmth',
  'intellectual_signaling',
  'comfort_with_sincerity',
  'absurdism_tolerance',
  'format_awareness',
  'vulnerability_as_tool',
];

/**
 * Compute cosine similarity between two fingerprints (0-1)
 */
function cosineSimilarity(a: PersonaFingerprint, b: PersonaFingerprint): number {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const dim of DIMENSIONS) {
    dotProduct += a[dim] * b[dim];
    magA += a[dim] * a[dim];
    magB += b[dim] * b[dim];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Find the top N nearest archetypes to a given fingerprint.
 *
 * Returns archetype matches sorted by similarity (highest first).
 * Uses cosine similarity across all 8 dimensions.
 */
export function findNearestArchetypes(
  fingerprint: PersonaFingerprint,
  topN: number = 3,
): ConstellationMatch[] {
  const scored = ARCHETYPES.map((archetype) => ({
    archetype: archetype.name,
    similarity: cosineSimilarity(fingerprint, archetype.fingerprint),
    traitMatch: archetype.traitLabel,
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topN);
}

/**
 * Build a constellation description from nearest matches.
 *
 * Returns a human-readable string like:
 * "You've got Colbert's knowing wink, Brene's grounded vulnerability,
 *  and a touch of Justin's contrarian tangents"
 */
export function buildConstellationDescription(
  matches: ConstellationMatch[],
): string {
  if (matches.length === 0) return '';
  if (matches.length === 1) return `You've got ${matches[0]!.traitMatch}`;

  const parts = matches.map((m, i) => {
    if (i === 0) return m.traitMatch;
    if (i === matches.length - 1) return `a touch of ${m.traitMatch}`;
    return m.traitMatch;
  });

  if (parts.length === 2) {
    return `You've got ${parts[0]} and ${parts[1]}`;
  }

  return `You've got ${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}
