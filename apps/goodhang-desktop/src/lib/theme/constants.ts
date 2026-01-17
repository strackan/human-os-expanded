/**
 * Theme Constants
 *
 * Configuration for the remote theme system.
 */

// =============================================================================
// REMOTE THEME CONFIGURATION
// =============================================================================

/**
 * Base URL for fetching remote theme files
 */
export const THEME_BASE_URL = import.meta.env.VITE_THEME_BASE_URL || 'https://goodhang.com/styles';

/**
 * Available theme files that can be fetched remotely
 */
export const THEME_FILES = {
  tokens: 'tokens.css',
  overrides: 'theme-overrides.css',
} as const;

/**
 * Cache key prefix for localStorage
 */
export const THEME_CACHE_PREFIX = 'gh-theme-cache-';

/**
 * How long to cache remote themes (in milliseconds)
 * Default: 1 hour
 */
export const THEME_CACHE_TTL = 60 * 60 * 1000;

/**
 * Timeout for fetching remote themes (in milliseconds)
 */
export const THEME_FETCH_TIMEOUT = 5000;

// =============================================================================
// THEME VARIANTS
// =============================================================================

export type ThemeVariant = 'default' | 'founder-os' | 'goodhang';

export interface ThemeConfig {
  variant: ThemeVariant;
  remoteUrl?: string;
  enableRemote: boolean;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  variant: 'default',
  enableRemote: true,
};

// =============================================================================
// CSS VARIABLE MAPPINGS
// =============================================================================

/**
 * Maps semantic names to CSS variable names for type safety
 */
export const CSS_VARS = {
  // Brand
  brandPurple500: '--color-brand-purple-500',
  brandPurple600: '--color-brand-purple-600',

  // Dark theme
  dark700: '--color-dark-700',
  dark800: '--color-dark-800',
  dark900: '--color-dark-900',

  // Semantic
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
  info: '--color-info',

  // Progress
  progressComplete: '--color-progress-complete',
  progressPartial: '--color-progress-partial',
  progressPending: '--color-progress-pending',

  // Text
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  textMuted: '--color-text-muted',

  // Animation
  animationFast: '--animation-fast',
  animationNormal: '--animation-normal',
  animationSlow: '--animation-slow',
} as const;

/**
 * Get a CSS variable value
 */
export function getCssVar(name: keyof typeof CSS_VARS): string {
  return `var(${CSS_VARS[name]})`;
}

/**
 * Get computed CSS variable value from DOM
 */
export function getComputedCssVar(name: keyof typeof CSS_VARS): string {
  return getComputedStyle(document.documentElement).getPropertyValue(CSS_VARS[name]).trim();
}

/**
 * Set a CSS variable value
 */
export function setCssVar(name: keyof typeof CSS_VARS, value: string): void {
  document.documentElement.style.setProperty(CSS_VARS[name], value);
}
