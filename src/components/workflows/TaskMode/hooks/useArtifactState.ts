import { useState, useEffect } from 'react';
import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * useArtifactState - Manages artifact panel visibility and sizing
 *
 * Manages:
 * - Artifact panel visibility
 * - Artifact panel width
 * - Artifact panel resizing state
 * - Auto-show/hide based on slide configuration
 *
 * Extracted from useTaskModeState.ts (lines 84-612)
 */

interface UseArtifactStateProps {
  currentSlide: WorkflowSlide | null;
  currentSlideIndex: number;
  currentBranch: string | null;
}

export function useArtifactState({
  currentSlide,
  currentSlideIndex,
  currentBranch,
}: UseArtifactStateProps) {
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50);
  const [isArtifactResizing, setIsArtifactResizing] = useState(false);

  // Auto-hide/show artifacts based on current slide and branch
  useEffect(() => {
    if (!currentSlide) return;

    const hasVisibleArtifacts = currentSlide.artifacts?.sections &&
      currentSlide.artifacts.sections.length > 0 &&
      currentSlide.artifacts.sections.some(section => {
        if (section.visible === false) return false;

        // Check if this artifact has a showWhenBranch condition
        const showWhenBranch = section.data?.showWhenBranch;
        if (showWhenBranch) {
          return currentBranch === showWhenBranch;
        }

        return true;
      });

    setShowArtifacts(hasVisibleArtifacts);
  }, [currentSlideIndex, currentSlide, currentBranch]);

  const toggleArtifacts = (show: boolean) => {
    setShowArtifacts(show);
  };

  return {
    showArtifacts,
    artifactsPanelWidth,
    isArtifactResizing,
    setShowArtifacts,
    setArtifactsPanelWidth,
    setIsArtifactResizing,
    toggleArtifacts,
  };
}
