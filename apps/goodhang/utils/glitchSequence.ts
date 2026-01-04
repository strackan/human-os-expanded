/**
 * Glitch Sequence State Machine
 * Manages the timing and phases of the ARG-style intro
 */

export enum GlitchPhase {
  INITIAL = 'initial',           // Clean Brené Brown quote
  SOMETHING_WRONG = 'wrong',     // Subtle hints
  CORRUPTION = 'corruption',     // Spreading glitches
  CHAOS = 'chaos',               // Peak corruption
  RESOLUTION = 'resolution',     // CRT power-on reveal
  COMPLETE = 'complete'          // Final homepage state
}

export interface GlitchState {
  phase: GlitchPhase;
  elapsed: number;
  shouldShowFlash: boolean;
  flashImageIndex: number;
}

// Timing configuration (in milliseconds) - V2: Slower, more deliberate
export const GLITCH_TIMING = {
  INITIAL: 3000,           // 3s - Clean display with edge hints
  SOMETHING_WRONG: 4000,   // 4s - Background deteriorates
  CORRUPTION: 4000,        // 4s - Chaos spreads
  CHAOS: 2000,             // 2s - Peak corruption
  RESOLUTION: 2000,        // 2s - CRT reveal
  TOTAL: 15000,            // 15s total

  // Compressed version for return visits
  COMPRESSED: 2500         // 2.5s quick version
};

// Background image oscillation (full-screen TECH images only)
export const BACKGROUND_SCHEDULE = [
  { time: 3500, duration: 2000, type: 'tech' },
  { time: 5500, duration: 2000, type: 'tech' },
  { time: 7500, duration: 2000, type: 'tech' },
  { time: 9500, duration: 2000, type: 'tech' },
  { time: 11500, duration: 2000, type: 'tech' },
];

// Overlay image flashes (start with macabre horror, transition to social)
export const FLASH_SCHEDULE = [
  { time: 4200, duration: 500, type: 'macabre', zone: 'top-right' },
  { time: 5200, duration: 500, type: 'macabre', zone: 'bottom-left' },
  { time: 6200, duration: 500, type: 'macabre', zone: 'top-left' },
  { time: 7300, duration: 500, type: 'macabre', zone: 'bottom-right' },
  { time: 8400, duration: 450, type: 'macabre', zone: 'top-right' },
  { time: 9500, duration: 450, type: 'social', zone: 'bottom-left' },
  { time: 10600, duration: 450, type: 'social', zone: 'top-right' },
  { time: 11700, duration: 450, type: 'social', zone: 'bottom-right' },
  { time: 12800, duration: 450, type: 'social', zone: 'top-left' },
];

// Text corruption patterns
export const CORRUPTION_CHARS = [
  '█', '▓', '▒', '░', '▀', '▄', '▌', '▐', '■', '□',
  '0', '1', 'X', '/', '\\', '|', '-', '_', '~', '^',
  'Δ', 'Σ', 'Ω', '∆', '∑', '∏', '∫', '∂', '√', '∞'
];

/**
 * Get the current phase based on elapsed time
 */
export function getPhaseFromElapsed(elapsed: number): GlitchPhase {
  if (elapsed < GLITCH_TIMING.INITIAL) {
    return GlitchPhase.INITIAL;
  } else if (elapsed < GLITCH_TIMING.INITIAL + GLITCH_TIMING.SOMETHING_WRONG) {
    return GlitchPhase.SOMETHING_WRONG;
  } else if (elapsed < GLITCH_TIMING.INITIAL + GLITCH_TIMING.SOMETHING_WRONG + GLITCH_TIMING.CORRUPTION) {
    return GlitchPhase.CORRUPTION;
  } else if (elapsed < GLITCH_TIMING.TOTAL - GLITCH_TIMING.RESOLUTION) {
    return GlitchPhase.CHAOS;
  } else if (elapsed < GLITCH_TIMING.TOTAL) {
    return GlitchPhase.RESOLUTION;
  } else {
    return GlitchPhase.COMPLETE;
  }
}

/**
 * Check if a flash should be shown at the current time
 */
export function shouldShowFlash(elapsed: number): { show: boolean; type?: string; index: number } {
  const activeFlash = FLASH_SCHEDULE.find(
    (flash) => {
      const inWindow = elapsed >= flash.time && elapsed < flash.time + flash.duration;
      return inWindow;
    }
  );

  if (activeFlash) {
    const index = FLASH_SCHEDULE.indexOf(activeFlash);
    return { show: true, type: activeFlash.type, index };
  }

  return { show: false, index: -1 };
}

/**
 * Randomly corrupt a character in a string
 */
export function corruptCharacter(text: string, intensity: number = 0.1): string {
  const chars = text.split('');
  const numToCorrupt = Math.floor(chars.length * intensity);

  for (let i = 0; i < numToCorrupt; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    // Don't corrupt spaces
    if (chars[randomIndex] !== ' ') {
      chars[randomIndex] = CORRUPTION_CHARS[Math.floor(Math.random() * CORRUPTION_CHARS.length)] ?? '';
    }
  }

  return chars.join('');
}

/**
 * Visit tracking utilities
 */
export const visitTracking = {
  hasSeenGlitch(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('goodhang_seen_glitch') === 'true';
  },

  markGlitchSeen(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('goodhang_seen_glitch', 'true');
  },

  isCurrentSession(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('goodhang_session') === 'true';
  },

  markCurrentSession(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('goodhang_session', 'true');
  },

  shouldSkipGlitch(): boolean {
    // Check for emergency skip flag (from auto-refresh)
    if (typeof window !== 'undefined' && localStorage.getItem('goodhang_glitch_emergency_skip') === 'true') {
      return true;
    }
    return this.hasSeenGlitch() && this.isCurrentSession();
  },

  shouldUseCompressed(): boolean {
    return this.hasSeenGlitch() && !this.isCurrentSession();
  },

  clearEmergencySkip(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('goodhang_glitch_emergency_skip');
    }
  }
};

/**
 * Generate glitch intensity based on phase
 */
export function getGlitchIntensity(phase: GlitchPhase): number {
  switch (phase) {
    case GlitchPhase.INITIAL:
      return 0;
    case GlitchPhase.SOMETHING_WRONG:
      return 0.05;
    case GlitchPhase.CORRUPTION:
      return 0.3;
    case GlitchPhase.CHAOS:
      return 0.8;
    case GlitchPhase.RESOLUTION:
      return 0.4;
    default:
      return 0;
  }
}
