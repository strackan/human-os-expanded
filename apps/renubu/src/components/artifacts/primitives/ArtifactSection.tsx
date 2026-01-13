/**
 * ArtifactSection - Content section with optional title and border
 *
 * Provides:
 * - Bordered/borderless sections
 * - Optional section title
 * - Configurable padding
 * - Background variants
 */

import React from 'react';
import { SECTION_STYLES, SPACING } from './artifact.tokens';

export type SectionVariant = 'default' | 'highlighted' | 'elevated' | 'transparent';
export type SectionPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ArtifactSectionProps {
  /** Section content */
  children: React.ReactNode;
  /** Section title */
  title?: string;
  /** Title size */
  titleSize?: 'sm' | 'base' | 'lg';
  /** Visual variant */
  variant?: SectionVariant;
  /** Padding size */
  padding?: SectionPadding;
  /** Additional CSS classes */
  className?: string;
  /** Debug section ID */
  sectionId?: string;
  /** Collapse bottom margin */
  noMargin?: boolean;
}

const TITLE_SIZES = {
  sm: 'text-sm font-medium text-gray-700',
  base: 'text-base font-medium text-gray-800',
  lg: 'text-lg font-semibold text-gray-900',
};

const PADDING_MAP: Record<SectionPadding, string> = {
  none: '',
  xs: SPACING.xs,
  sm: SPACING.sm,
  md: SPACING.md,
  lg: SPACING.lg,
  xl: SPACING.xl,
};

export const ArtifactSection = React.memo(function ArtifactSection({
  children,
  title,
  titleSize = 'base',
  variant = 'default',
  padding = 'md',
  className = '',
  sectionId,
  noMargin = false,
}: ArtifactSectionProps) {
  const sectionStyle = SECTION_STYLES[variant] || SECTION_STYLES.default;
  const paddingStyle = PADDING_MAP[padding];
  const marginStyle = noMargin ? '' : 'mb-4';

  return (
    <div
      id={sectionId}
      className={`${sectionStyle} ${paddingStyle} ${marginStyle} ${className}`}
    >
      {title && (
        <h4 className={`${TITLE_SIZES[titleSize]} mb-3`}>{title}</h4>
      )}
      {children}
    </div>
  );
});

ArtifactSection.displayName = 'ArtifactSection';
export default ArtifactSection;
