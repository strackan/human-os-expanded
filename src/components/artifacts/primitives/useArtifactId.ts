/**
 * useArtifactId Hook
 *
 * Generates consistent, debuggable IDs for artifact elements.
 *
 * Pattern: [element]-[artifact-id]-[section]-[element-id]
 *
 * @example
 * const { getId, getDataAttrs } = useArtifactId('pricing-analysis', 'pricing');
 *
 * <div
 *   id={getId('header')}
 *   {...getDataAttrs('header')}
 * >
 *   // Results in:
 *   // id="artifact-pricing-analysis-header"
 *   // data-artifact-id="pricing-analysis"
 *   // data-artifact-variant="pricing"
 *   // data-artifact-section="header"
 * </div>
 */

import { useMemo, useCallback } from 'react';
import type { ArtifactVariant } from './artifact.tokens';

export interface UseArtifactIdOptions {
  /** Unique identifier for this artifact instance */
  artifactId: string;
  /** Visual variant of the artifact */
  variant?: ArtifactVariant;
  /** Optional prefix override (defaults to 'artifact') */
  prefix?: string;
}

export interface UseArtifactIdReturn {
  /** Root ID for the artifact container */
  rootId: string;
  /** Get ID for a specific section/element */
  getId: (section: string, elementId?: string) => string;
  /** Get data attributes for debugging */
  getDataAttrs: (section: string) => Record<string, string>;
  /** Get all props (id + data attributes) for an element */
  getIdProps: (section: string, elementId?: string) => {
    id: string;
    'data-artifact-id': string;
    'data-artifact-variant'?: string;
    'data-artifact-section': string;
    'data-artifact-element'?: string;
  };
}

/**
 * Hook for generating artifact IDs and data attributes
 */
export function useArtifactId(options: UseArtifactIdOptions): UseArtifactIdReturn {
  const { artifactId, variant, prefix = 'artifact' } = options;

  // Root ID for the container
  const rootId = useMemo(() => {
    return `${prefix}-${artifactId}`;
  }, [prefix, artifactId]);

  // Generate ID for a section/element
  const getId = useCallback(
    (section: string, elementId?: string): string => {
      if (elementId) {
        return `${prefix}-${artifactId}-${section}-${elementId}`;
      }
      return `${prefix}-${artifactId}-${section}`;
    },
    [prefix, artifactId]
  );

  // Generate data attributes for debugging
  const getDataAttrs = useCallback(
    (section: string): Record<string, string> => {
      const attrs: Record<string, string> = {
        'data-artifact-id': artifactId,
        'data-artifact-section': section,
      };

      if (variant) {
        attrs['data-artifact-variant'] = variant;
      }

      return attrs;
    },
    [artifactId, variant]
  );

  // Get all ID-related props for an element
  const getIdProps = useCallback(
    (
      section: string,
      elementId?: string
    ): {
      id: string;
      'data-artifact-id': string;
      'data-artifact-variant'?: string;
      'data-artifact-section': string;
      'data-artifact-element'?: string;
    } => {
      const props: any = {
        id: getId(section, elementId),
        'data-artifact-id': artifactId,
        'data-artifact-section': section,
      };

      if (variant) {
        props['data-artifact-variant'] = variant;
      }

      if (elementId) {
        props['data-artifact-element'] = elementId;
      }

      return props;
    },
    [getId, artifactId, variant]
  );

  return {
    rootId,
    getId,
    getDataAttrs,
    getIdProps,
  };
}

/**
 * Standalone function for generating IDs without hook
 * Useful for static components or server components
 */
export function generateArtifactId(
  artifactId: string,
  section: string,
  elementId?: string,
  prefix: string = 'artifact'
): string {
  if (elementId) {
    return `${prefix}-${artifactId}-${section}-${elementId}`;
  }
  return `${prefix}-${artifactId}-${section}`;
}

export default useArtifactId;
