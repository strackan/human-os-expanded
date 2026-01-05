// CSS Class Name Generators
// Extracted from components/GlitchIntroV2.tsx

import { GlitchPhase } from '@/utils/glitchSequence';

/**
 * Get CSS class name for current phase
 */
export function getPhaseClass(phase: GlitchPhase): string {
  switch (phase) {
    case GlitchPhase.INITIAL:
      return 'phase-initial';
    case GlitchPhase.SOMETHING_WRONG:
      return 'phase-something-wrong';
    case GlitchPhase.CORRUPTION:
      return 'phase-corruption';
    case GlitchPhase.CHAOS:
      return 'phase-chaos';
    case GlitchPhase.RESOLUTION:
      return 'phase-resolution';
    default:
      return '';
  }
}

/**
 * Get CSS classes for quote text based on phase
 */
export function getTextClasses(phase: GlitchPhase): string {
  const classes = ['glitch-quote'];

  if (phase === GlitchPhase.CORRUPTION || phase === GlitchPhase.CHAOS) {
    classes.push('slow-rgb-drift');  // Slow, not rapid
  }

  if (phase === GlitchPhase.CHAOS) {
    classes.push('occasional-fragment');
  }

  return classes.join(' ');
}
