/**
 * Artifact Design Tokens
 *
 * Centralized styling tokens for consistent artifact appearance.
 * All artifact primitives pull from these tokens.
 */

export type ArtifactVariant =
  | 'default'
  | 'primary'
  | 'contract'
  | 'pricing'
  | 'health'
  | 'opportunity'
  | 'risk'
  | 'email'
  | 'report'
  | 'contacts'
  | 'summary';

export interface ArtifactVariantStyles {
  header: string;
  headerText: string;
  border: string;
  accent: string;
  icon: string;
}

/**
 * Variant-specific styling tokens
 */
export const ARTIFACT_VARIANTS: Record<ArtifactVariant, ArtifactVariantStyles> = {
  default: {
    header: 'bg-gradient-to-r from-gray-50 to-slate-50',
    headerText: 'text-gray-900',
    border: 'border-gray-200',
    accent: 'bg-gray-600',
    icon: 'text-white',
  },
  primary: {
    header: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    headerText: 'text-blue-900',
    border: 'border-blue-200',
    accent: 'bg-blue-600',
    icon: 'text-white',
  },
  contract: {
    header: 'bg-gradient-to-r from-indigo-50 to-blue-50',
    headerText: 'text-indigo-900',
    border: 'border-indigo-200',
    accent: 'bg-indigo-600',
    icon: 'text-white',
  },
  pricing: {
    header: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    headerText: 'text-blue-900',
    border: 'border-blue-200',
    accent: 'bg-blue-600',
    icon: 'text-white',
  },
  health: {
    header: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    headerText: 'text-emerald-900',
    border: 'border-emerald-200',
    accent: 'bg-emerald-600',
    icon: 'text-white',
  },
  opportunity: {
    header: 'bg-gradient-to-r from-amber-50 to-orange-50',
    headerText: 'text-amber-900',
    border: 'border-amber-200',
    accent: 'bg-amber-600',
    icon: 'text-white',
  },
  risk: {
    header: 'bg-gradient-to-r from-red-50 to-rose-50',
    headerText: 'text-red-900',
    border: 'border-red-200',
    accent: 'bg-red-600',
    icon: 'text-white',
  },
  email: {
    header: 'bg-gradient-to-r from-slate-50 to-gray-50',
    headerText: 'text-slate-900',
    border: 'border-slate-200',
    accent: 'bg-slate-700',
    icon: 'text-white',
  },
  report: {
    header: 'bg-gradient-to-r from-violet-50 to-purple-50',
    headerText: 'text-violet-900',
    border: 'border-violet-200',
    accent: 'bg-violet-600',
    icon: 'text-white',
  },
  contacts: {
    header: 'bg-gradient-to-r from-cyan-50 to-sky-50',
    headerText: 'text-cyan-900',
    border: 'border-cyan-200',
    accent: 'bg-cyan-600',
    icon: 'text-white',
  },
  summary: {
    header: 'bg-gradient-to-r from-slate-50 to-gray-50',
    headerText: 'text-slate-900',
    border: 'border-slate-200',
    accent: 'bg-slate-600',
    icon: 'text-white',
  },
};

/**
 * Section styling tokens
 */
export const SECTION_STYLES = {
  default: 'bg-white border border-gray-200 rounded-lg',
  highlighted: 'bg-gray-50 border border-gray-200 rounded-lg',
  elevated: 'bg-white border border-gray-200 rounded-lg shadow-sm',
  transparent: 'bg-transparent border-0',
};

/**
 * Status badge styling
 */
export const STATUS_BADGES = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
};

/**
 * Spacing scale
 */
export const SPACING = {
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

/**
 * Font sizes
 */
export const TEXT_SIZES = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

/**
 * Get variant styles with fallback to default
 */
export function getVariantStyles(variant?: ArtifactVariant): ArtifactVariantStyles {
  return ARTIFACT_VARIANTS[variant || 'default'] || ARTIFACT_VARIANTS.default;
}
