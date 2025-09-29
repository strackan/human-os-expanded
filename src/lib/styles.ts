import { cn } from './utils';

// Common layout patterns
export const layoutClasses = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',
  grid: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',
} as const;

// Common spacing patterns
export const spacingClasses = {
  section: 'space-y-6',
  card: 'space-y-4',
  list: 'space-y-2',
  inline: 'space-x-2',
} as const;

// Common text patterns
export const textClasses = {
  heading: {
    h1: 'text-3xl font-bold text-gray-900 sm:text-4xl',
    h2: 'text-2xl font-semibold text-gray-900 sm:text-3xl',
    h3: 'text-xl font-semibold text-gray-900 sm:text-2xl',
    h4: 'text-lg font-medium text-gray-900',
    h5: 'text-base font-medium text-gray-900',
    h6: 'text-sm font-medium text-gray-900',
  },
  body: {
    large: 'text-lg text-gray-700',
    base: 'text-base text-gray-700',
    small: 'text-sm text-gray-600',
    xs: 'text-xs text-gray-500',
  },
} as const;

// Common color patterns
export const colorClasses = {
  status: {
    success: 'text-success-600 bg-success-50 border-success-200',
    warning: 'text-warning-600 bg-warning-50 border-warning-200',
    danger: 'text-danger-600 bg-danger-50 border-danger-200',
    info: 'text-primary-600 bg-primary-50 border-primary-200',
  },
  background: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    accent: 'bg-primary-50',
  },
} as const;

// Common border patterns
export const borderClasses = {
  default: 'border border-gray-200',
  subtle: 'border border-gray-100',
  accent: 'border border-primary-200',
  none: 'border-0',
} as const;

// Common shadow patterns
export const shadowClasses = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  soft: 'shadow-soft',
  medium: 'shadow-medium',
  large: 'shadow-large',
} as const;

// Common rounded patterns
export const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  default: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const;

// Utility function to combine classes
export const combineClasses = (...classes: (string | undefined | null | false)[]) => {
  return cn(...classes.filter(Boolean));
};

// Common component variants
export const componentVariants = {
  button: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
  },
  card: {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-200 shadow-md',
    flat: 'bg-gray-50 border border-gray-100',
  },
  input: {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500',
    success: 'border-success-300 focus:border-success-500 focus:ring-success-500',
  },
} as const;

// Responsive utilities
export const responsiveClasses = {
  hidden: {
    mobile: 'hidden sm:block',
    tablet: 'hidden md:block',
    desktop: 'hidden lg:block',
  },
  visible: {
    mobile: 'block sm:hidden',
    tablet: 'block md:hidden',
    desktop: 'block lg:hidden',
  },
} as const;

// Animation utilities
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
} as const;

// Focus utilities
export const focusClasses = {
  default: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  button: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
  input: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
} as const; 