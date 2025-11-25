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
 *
 * Two modes:
 * - Standard (default): Shows all artifacts with visible: true
 * - Dynamic (future): LLM-driven visibility via visibleArtifacts Set
 *
 * For now, we default to standard mode - just use the visible property.
 * Dynamic mode will be implemented later for AI-driven workflows.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useVisibleArtifacts({ config, visibleArtifacts }: UseVisibleArtifactsProps) {
  const visibleSections = useMemo(() => {
    console.log('[useVisibleArtifacts] config.sections:', config.sections);
    // Standard mode: show all artifacts with visible: true
    // The visibleArtifacts Set is reserved for future dynamic mode
    // where LLM controls what artifacts appear based on conversation
    const filtered = config.sections.filter(s => s.visible);
    console.log('[useVisibleArtifacts] filtered sections:', filtered);
    return filtered;
  }, [config.sections]);

  return visibleSections;
}
