/**
 * ArtifactContainer - Root wrapper for all artifacts
 *
 * Provides:
 * - Consistent border/shadow styling
 * - Variant-based theming
 * - Debug IDs for inspection
 * - Loading and error states
 */

import React from 'react';
import { getVariantStyles, type ArtifactVariant } from './artifact.tokens';
import { useArtifactId } from './useArtifactId';

export interface ArtifactContainerProps {
  /** Unique ID for this artifact instance */
  artifactId: string;
  /** Visual variant */
  variant?: ArtifactVariant;
  /** Child components */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Render function for loading state */
  loadingContent?: React.ReactNode;
  /** Render function for error state */
  errorContent?: React.ReactNode;
}

export const ArtifactContainer = React.memo(function ArtifactContainer({
  artifactId,
  variant = 'default',
  children,
  className = '',
  isLoading = false,
  error,
  loadingContent,
  errorContent,
}: ArtifactContainerProps) {
  const styles = getVariantStyles(variant);
  const { rootId, getDataAttrs } = useArtifactId({ artifactId, variant });

  // Error state
  if (error) {
    return (
      <div
        id={rootId}
        {...getDataAttrs('root')}
        className={`bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden ${className}`}
      >
        {errorContent || (
          <div className="p-6 text-center">
            <div className="text-red-600 font-medium mb-2">Error Loading Artifact</div>
            <div className="text-sm text-red-500">{error}</div>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        id={rootId}
        {...getDataAttrs('root')}
        className={`bg-white rounded-lg border ${styles.border} shadow-sm overflow-hidden ${className}`}
      >
        {loadingContent || (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id={rootId}
      {...getDataAttrs('root')}
      data-artifact-variant={variant}
      className={`bg-white rounded-lg border ${styles.border} shadow-sm overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
});

ArtifactContainer.displayName = 'ArtifactContainer';
export default ArtifactContainer;
