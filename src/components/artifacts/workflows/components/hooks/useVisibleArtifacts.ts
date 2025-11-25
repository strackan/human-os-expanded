import { useMemo } from 'react';
import { ArtifactsConfig } from '../../config/WorkflowConfig';

interface UseVisibleArtifactsProps {
  config: ArtifactsConfig;
  visibleArtifacts?: Set<string>;
}

/**
 * useVisibleArtifacts Hook
 *
 * Filters artifact sections based on visibility settings.
 * Supports both static (config-based) and dynamic (Set-based) visibility.
 */
export function useVisibleArtifacts({ config, visibleArtifacts }: UseVisibleArtifactsProps) {
  const visibleSections = useMemo(() => {
    return config.sections.filter(s => {
      // If visibleArtifacts is provided AND has items (dynamic mode), use it to filter
      if (visibleArtifacts !== undefined && visibleArtifacts.size > 0) {
        return visibleArtifacts.has(s.id);
      }
      // Otherwise, use the default visibility from config
      return s.visible;
    });
  }, [config.sections, visibleArtifacts]);

  return visibleSections;
}
