/**
 * ArtifactAlert - Status/warning/info alerts
 *
 * Provides:
 * - Multiple severity levels
 * - Optional icon
 * - Optional title
 * - Consistent styling
 */

import React from 'react';
import { STATUS_BADGES } from './artifact.tokens';

export type AlertSeverity = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface ArtifactAlertProps {
  /** Alert severity */
  severity?: AlertSeverity;
  /** Optional title */
  title?: string;
  /** Alert content */
  children: React.ReactNode;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Debug section ID */
  sectionId?: string;
  /** Compact styling */
  compact?: boolean;
}

const SEVERITY_ICONS: Record<AlertSeverity, React.ReactNode> = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  neutral: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export const ArtifactAlert = React.memo(function ArtifactAlert({
  severity = 'info',
  title,
  children,
  icon,
  className = '',
  sectionId,
  compact = false,
}: ArtifactAlertProps) {
  const badgeStyle = STATUS_BADGES[severity] || STATUS_BADGES.neutral;
  const displayIcon = icon ?? SEVERITY_ICONS[severity];
  const padding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      id={sectionId}
      className={`${badgeStyle} rounded-lg border ${padding} ${className}`}
      role="alert"
    >
      <div className="flex gap-3">
        {displayIcon && (
          <div className="flex-shrink-0 mt-0.5">{displayIcon}</div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium mb-1">{title}</div>
          )}
          <div className={`${compact ? 'text-xs' : 'text-sm'}`}>{children}</div>
        </div>
      </div>
    </div>
  );
});

ArtifactAlert.displayName = 'ArtifactAlert';
export default ArtifactAlert;
