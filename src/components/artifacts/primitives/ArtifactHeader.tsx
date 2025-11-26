/**
 * ArtifactHeader - Gradient header with icon, title, and actions
 *
 * Provides:
 * - Gradient background based on variant
 * - Icon box with accent color
 * - Title and subtitle
 * - Optional action buttons
 * - Optional badge/status indicator
 */

import React from 'react';
import { getVariantStyles, type ArtifactVariant } from './artifact.tokens';

export interface ArtifactHeaderProps {
  /** Header title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Visual variant */
  variant?: ArtifactVariant;
  /** Action buttons/elements */
  actions?: React.ReactNode;
  /** Status badge */
  badge?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Debug section ID */
  sectionId?: string;
}

export const ArtifactHeader = React.memo(function ArtifactHeader({
  title,
  subtitle,
  icon,
  variant = 'default',
  actions,
  badge,
  className = '',
  sectionId,
}: ArtifactHeaderProps) {
  const styles = getVariantStyles(variant);

  return (
    <div
      id={sectionId}
      className={`${styles.header} px-6 py-4 border-b ${styles.border} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={`w-10 h-10 rounded-lg ${styles.accent} flex items-center justify-center`}
            >
              <div className={styles.icon}>{icon}</div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-semibold ${styles.headerText}`}>{title}</h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
});

ArtifactHeader.displayName = 'ArtifactHeader';
export default ArtifactHeader;
