// Subliminal Message Generation
// Extracted from components/GlitchIntroV2.tsx

import { SEED_WORDS, RANDOM_WORDS } from '@/lib/constants/glitchIntroConfig';

/**
 * Generate random subliminal message for CHAOS phase
 * Returns either a combination of seed/random words or a single random word
 */
export function generateSubliminalMessage(): string {
  const useSeed = Math.random() > 0.3; // 70% chance to use seed word

  if (useSeed) {
    const numWords = Math.random() > 0.5 ? 2 : 3;
    const words = [];

    for (let i = 0; i < numWords; i++) {
      if (Math.random() > 0.4) {
        words.push(SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)]);
      } else {
        words.push(RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)]);
      }
    }

    return words.join(' ');
  } else {
    // Pure random
    return RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)] || '';
  }
}
