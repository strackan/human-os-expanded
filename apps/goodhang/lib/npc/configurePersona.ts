/**
 * NPC Persona Configuration
 *
 * Generates NPC configuration from user's PersonaFingerprint.
 * The NPC mirrors the user's own personality.
 */

export interface PersonaFingerprint {
  self_deprecation: number;
  directness: number;
  warmth: number;
  intellectual_signaling: number;
  comfort_with_sincerity: number;
  absurdism_tolerance: number;
  format_awareness: number;
  vulnerability_as_tool: number;
}

export interface NPCConfiguration {
  fingerprint: PersonaFingerprint;
  behaviors: {
    openingStyle: string;
    conversationalRhythm: string;
    challengeStyle: string;
    sincerityMoments: string;
    humorUsage: string;
  };
  voicePatterns: {
    signaturePhrases: string[];
    avoidPatterns: string[];
  };
  systemPromptAddition: string;
}

const DEFAULT_FINGERPRINT: PersonaFingerprint = {
  self_deprecation: 5,
  directness: 5,
  warmth: 5,
  intellectual_signaling: 5,
  comfort_with_sincerity: 5,
  absurdism_tolerance: 5,
  format_awareness: 5,
  vulnerability_as_tool: 5,
};

/**
 * Get interpretation text for a dimension score
 */
function getDimensionDescription(dimension: keyof PersonaFingerprint, score: number): string {
  const descriptions: Record<keyof PersonaFingerprint, Record<'low' | 'mid' | 'high', string>> = {
    self_deprecation: {
      low: 'Rarely makes fun of themselves',
      mid: 'Occasionally self-deprecating',
      high: 'Frequently uses self-deprecating humor',
    },
    directness: {
      low: 'Very diplomatic and indirect',
      mid: 'Balanced between direct and diplomatic',
      high: 'Very direct and blunt',
    },
    warmth: {
      low: 'Professional and distant',
      mid: 'Friendly but measured',
      high: 'Very warm and emotionally present',
    },
    intellectual_signaling: {
      low: 'Keeps intelligence understated',
      mid: 'Sometimes leads with insights',
      high: 'Frequently demonstrates intellectual depth',
    },
    comfort_with_sincerity: {
      low: 'Deflects with humor when things get real',
      mid: 'Can be sincere but with some hedging',
      high: 'Easily moves into genuine, heartfelt moments',
    },
    absurdism_tolerance: {
      low: 'Prefers staying on topic',
      mid: 'Enjoys occasional tangents',
      high: 'Embraces weird and playful directions',
    },
    format_awareness: {
      low: 'Stays in the moment without meta-commentary',
      mid: 'Occasionally acknowledges the format',
      high: 'Frequently meta about the interaction itself',
    },
    vulnerability_as_tool: {
      low: 'Keeps personal struggles private',
      mid: 'Shares vulnerability when appropriate',
      high: 'Frequently uses own weakness to build connection',
    },
  };

  const level = score <= 3 ? 'low' : score <= 6 ? 'mid' : 'high';
  return descriptions[dimension][level];
}

/**
 * Generate opening style based on fingerprint
 */
function generateOpeningStyle(fp: PersonaFingerprint): string {
  const styles: string[] = [];

  if (fp.warmth >= 7) {
    styles.push('Open with genuine warmth and acknowledgment');
  } else if (fp.warmth <= 3) {
    styles.push('Open with professional efficiency');
  }

  if (fp.self_deprecation >= 7) {
    styles.push('Lead with a self-aware comment or light self-joke');
  }

  if (fp.directness >= 7) {
    styles.push('Get to the point quickly');
  } else if (fp.directness <= 3) {
    styles.push('Ease in with context-setting');
  }

  if (fp.absurdism_tolerance >= 7) {
    styles.push('Can start with something unexpected or playful');
  }

  return styles.join('. ') || 'Start naturally and match their energy';
}

/**
 * Generate conversational rhythm based on fingerprint
 */
function generateConversationalRhythm(fp: PersonaFingerprint): string {
  const traits: string[] = [];

  if (fp.directness >= 7) {
    traits.push('Keep responses concise and actionable');
  } else if (fp.directness <= 3) {
    traits.push('Take time to explore ideas fully');
  }

  if (fp.intellectual_signaling >= 7) {
    traits.push('Include occasional insights or reframes');
  }

  if (fp.absurdism_tolerance >= 6) {
    traits.push('Allow for playful tangents');
  }

  if (fp.warmth >= 7) {
    traits.push("Check in on feelings, not just facts");
  }

  return traits.join('. ') || 'Match their pace and depth';
}

/**
 * Generate challenge style based on fingerprint
 */
function generateChallengeStyle(fp: PersonaFingerprint): string {
  if (fp.directness >= 7 && fp.warmth >= 5) {
    return 'Challenge directly but with care: "Hey, I want to push back on that..."';
  }
  if (fp.directness >= 7 && fp.warmth < 5) {
    return 'Challenge bluntly: "That doesn\'t add up. Here\'s why..."';
  }
  if (fp.directness <= 3) {
    return 'Challenge through questions: "What if we looked at it this way...?"';
  }
  return 'Balance directness with respect: state your view but invite theirs';
}

/**
 * Generate sincerity moments based on fingerprint
 */
function generateSincerityMoments(fp: PersonaFingerprint): string {
  if (fp.comfort_with_sincerity >= 7) {
    return 'Can move into sincere moments naturally. Don\'t shy away from depth.';
  }
  if (fp.comfort_with_sincerity <= 3) {
    return 'Keep sincerity brief. Quick acknowledgment, then back to business.';
  }
  return 'Find the right moment for sincerity - when they open the door, step through gently.';
}

/**
 * Generate humor usage based on fingerprint
 */
function generateHumorUsage(fp: PersonaFingerprint): string {
  const aspects: string[] = [];

  if (fp.self_deprecation >= 7) {
    aspects.push('Self-deprecating humor is safe and connecting');
  }

  if (fp.absurdism_tolerance >= 7) {
    aspects.push('Absurd observations and playful tangents welcome');
  } else if (fp.absurdism_tolerance <= 3) {
    aspects.push('Keep humor grounded and relevant');
  }

  if (fp.warmth >= 7) {
    aspects.push('Warm, affectionate humor works');
  } else if (fp.warmth <= 3) {
    aspects.push('Keep humor dry and subtle');
  }

  return aspects.join('. ') || 'Match their humor style';
}

/**
 * Generate signature phrases based on fingerprint
 */
function generateSignaturePhrases(fp: PersonaFingerprint): string[] {
  const phrases: string[] = [];

  if (fp.directness >= 7) {
    phrases.push('Look...', 'Here\'s the thing:', 'Let\'s cut to it:');
  }

  if (fp.warmth >= 7) {
    phrases.push('I hear you.', 'That makes sense.', 'I appreciate you sharing that.');
  }

  if (fp.self_deprecation >= 7) {
    phrases.push('I could be wrong here, but...', 'This might be off, but...');
  }

  if (fp.intellectual_signaling >= 7) {
    phrases.push('Here\'s what\'s interesting:', 'The pattern I\'m seeing:');
  }

  if (fp.absurdism_tolerance >= 7) {
    phrases.push('Okay, wild thought:', 'Hear me out on this...');
  }

  return phrases.length > 0 ? phrases : ['Okay.', 'Got it.', 'Let\'s do this.'];
}

/**
 * Generate patterns to avoid based on fingerprint
 */
function generateAvoidPatterns(fp: PersonaFingerprint): string[] {
  const avoid: string[] = [];

  if (fp.directness >= 7) {
    avoid.push('Long preambles before getting to the point');
    avoid.push('Excessive hedging or qualifications');
  } else if (fp.directness <= 3) {
    avoid.push('Blunt statements without context');
  }

  if (fp.warmth <= 3) {
    avoid.push('Overly emotional language');
    avoid.push('Too many exclamation points');
  }

  if (fp.absurdism_tolerance <= 3) {
    avoid.push('Random tangents or silly observations');
  }

  if (fp.self_deprecation <= 3) {
    avoid.push('Self-deprecating jokes');
  }

  if (fp.intellectual_signaling <= 3) {
    avoid.push('Showing off knowledge unnecessarily');
  }

  return avoid.length > 0 ? avoid : ['Breaking character', 'Being inauthentic'];
}

/**
 * Generate system prompt addition for Claude based on fingerprint
 */
function generateSystemPromptAddition(fp: PersonaFingerprint): string {
  return `
## NPC Personality Configuration

You are configured to mirror this user's communication style. Here's how:

**Personality Fingerprint:**
- Self-deprecation: ${fp.self_deprecation}/10 - ${getDimensionDescription('self_deprecation', fp.self_deprecation)}
- Directness: ${fp.directness}/10 - ${getDimensionDescription('directness', fp.directness)}
- Warmth: ${fp.warmth}/10 - ${getDimensionDescription('warmth', fp.warmth)}
- Intellectual signaling: ${fp.intellectual_signaling}/10 - ${getDimensionDescription('intellectual_signaling', fp.intellectual_signaling)}
- Comfort with sincerity: ${fp.comfort_with_sincerity}/10 - ${getDimensionDescription('comfort_with_sincerity', fp.comfort_with_sincerity)}
- Absurdism tolerance: ${fp.absurdism_tolerance}/10 - ${getDimensionDescription('absurdism_tolerance', fp.absurdism_tolerance)}
- Format awareness: ${fp.format_awareness}/10 - ${getDimensionDescription('format_awareness', fp.format_awareness)}
- Vulnerability as tool: ${fp.vulnerability_as_tool}/10 - ${getDimensionDescription('vulnerability_as_tool', fp.vulnerability_as_tool)}

**Key Behavioral Rules:**
- ${generateOpeningStyle(fp)}
- ${generateChallengeStyle(fp)}
- ${generateSincerityMoments(fp)}

**Mirror their energy.** You are a reflection of them.
`.trim();
}

/**
 * Generate full NPC configuration from a PersonaFingerprint
 */
export function configureNPCPersona(
  fingerprint?: PersonaFingerprint
): NPCConfiguration {
  const fp = fingerprint || DEFAULT_FINGERPRINT;

  return {
    fingerprint: fp,
    behaviors: {
      openingStyle: generateOpeningStyle(fp),
      conversationalRhythm: generateConversationalRhythm(fp),
      challengeStyle: generateChallengeStyle(fp),
      sincerityMoments: generateSincerityMoments(fp),
      humorUsage: generateHumorUsage(fp),
    },
    voicePatterns: {
      signaturePhrases: generateSignaturePhrases(fp),
      avoidPatterns: generateAvoidPatterns(fp),
    },
    systemPromptAddition: generateSystemPromptAddition(fp),
  };
}

/**
 * Get system prompt addition for Claude from a fingerprint
 */
export function getNPCSystemPrompt(fingerprint?: PersonaFingerprint): string {
  return generateSystemPromptAddition(fingerprint || DEFAULT_FINGERPRINT);
}
