/**
 * Style Utilities
 *
 * Helper functions for common styling patterns.
 */

// =============================================================================
// ANIMATION DELAYS
// =============================================================================

/**
 * Generate staggered animation delays for list items
 * @param index - Item index in the list
 * @param baseDelay - Base delay in seconds (default: 0.1)
 * @returns CSS style object with animationDelay
 */
export function staggerDelay(index: number, baseDelay = 0.1): { animationDelay: string } {
  return { animationDelay: `${index * baseDelay}s` };
}

/**
 * Animation delay presets for common patterns
 */
export const animationDelays = {
  /** Standard stagger (0.1s increments) */
  stagger: staggerDelay,
  /** Fast stagger (0.05s increments) */
  fast: (index: number) => staggerDelay(index, 0.05),
  /** Slow stagger (0.2s increments) */
  slow: (index: number) => staggerDelay(index, 0.2),
  /** Loading dots pattern */
  dots: (index: number) => staggerDelay(index, 0.1),
} as const;

// =============================================================================
// CONDITIONAL CLASS NAMES
// =============================================================================

type ClassValue = string | boolean | null | undefined;

/**
 * Simple class name concatenation with falsy filtering
 * @param classes - Class names or conditional values
 * @returns Combined class string
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}

// =============================================================================
// THEME COLORS
// =============================================================================

/**
 * Color configurations for different themes
 */
export const themeColors = {
  purple: {
    gradient: 'from-purple-600 to-blue-600',
    gradientHover: 'hover:from-purple-500 hover:to-blue-500',
    shadow: 'shadow-purple-500/50',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    bg: 'bg-purple-600',
    bgHover: 'hover:bg-purple-700',
  },
  blue: {
    gradient: 'from-blue-600 to-purple-600',
    gradientHover: 'hover:from-blue-500 hover:to-purple-500',
    shadow: 'shadow-blue-500/50',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    bg: 'bg-blue-600',
    bgHover: 'hover:bg-blue-700',
  },
  green: {
    gradient: 'from-green-600 to-emerald-600',
    gradientHover: 'hover:from-green-500 hover:to-emerald-500',
    shadow: 'shadow-green-500/50',
    border: 'border-green-500/30',
    text: 'text-green-400',
    bg: 'bg-green-600',
    bgHover: 'hover:bg-green-700',
  },
  orange: {
    gradient: 'from-orange-600 to-amber-600',
    gradientHover: 'hover:from-orange-500 hover:to-amber-500',
    shadow: 'shadow-orange-500/50',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    bg: 'bg-orange-600',
    bgHover: 'hover:bg-orange-700',
  },
} as const;

export type ThemeColor = keyof typeof themeColors;

// =============================================================================
// PROGRESS COLORS
// =============================================================================

/**
 * Get color class based on progress percentage
 */
export function progressColor(progress: number): string {
  if (progress >= 100) return 'text-green-400';
  if (progress >= 75) return 'text-blue-400';
  if (progress >= 50) return 'text-yellow-400';
  if (progress >= 25) return 'text-orange-400';
  return 'text-gray-400';
}

/**
 * Get rating color based on value (1-10 scale)
 */
export function ratingColor(rating: number): string {
  if (rating >= 9) return 'text-green-400';
  if (rating >= 7) return 'text-yellow-400';
  return 'text-red-400';
}

// =============================================================================
// CSS VARIABLE HELPERS
// =============================================================================

/**
 * Common CSS variables for the app
 * Use with tailwind's arbitrary value syntax: bg-[var(--color-progress-complete)]
 */
export const cssVariables = {
  colors: {
    progressComplete: '#22c55e', // green-500
    progressPartial: '#3b82f6', // blue-500
    progressPending: '#6b7280', // gray-500
  },
} as const;
