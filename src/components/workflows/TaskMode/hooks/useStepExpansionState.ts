/**
 * useStepExpansionState - Manages step expansion/collapse state
 *
 * Handles:
 * - Expand/collapse individual steps
 * - Pin steps to prevent auto-collapse
 * - Auto-collapse on success after delay
 * - Scroll to active step
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ExpansionState,
  UseStepExpansionStateProps,
  UseStepExpansionStateReturn,
} from '../types/step-chat';

/** Default auto-collapse delay in milliseconds */
const DEFAULT_AUTO_COLLAPSE_DELAY = 1500;

export function useStepExpansionState({
  totalSteps,
  currentStepIndex,
  autoCollapseDelay = DEFAULT_AUTO_COLLAPSE_DELAY,
  onExpansionChange,
}: UseStepExpansionStateProps): UseStepExpansionStateReturn {
  // Track expansion state for each step
  // Default: current step is expanded, all others collapsed
  const [expansionStates, setExpansionStates] = useState<Record<number, ExpansionState>>(() => {
    const initial: Record<number, ExpansionState> = {};
    for (let i = 0; i < totalSteps; i++) {
      initial[i] = i === currentStepIndex ? 'expanded' : 'collapsed';
    }
    return initial;
  });

  // Track auto-collapse timers for cleanup
  const autoCollapseTimers = useRef<Record<number, NodeJS.Timeout>>({});

  // Previous step index for detecting changes
  const prevStepIndexRef = useRef(currentStepIndex);

  // Clean up timers on unmount
  useEffect(() => {
    const timers = autoCollapseTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // When current step changes, expand the new step
  useEffect(() => {
    if (prevStepIndexRef.current !== currentStepIndex) {
      // Expand new current step
      setExpansionStates((prev) => ({
        ...prev,
        [currentStepIndex]: 'expanded',
      }));
      onExpansionChange?.(currentStepIndex, 'expanded');
      prevStepIndexRef.current = currentStepIndex;
    }
  }, [currentStepIndex, onExpansionChange]);

  // Update total steps if it changes (e.g., dynamic workflows)
  useEffect(() => {
    setExpansionStates((prev) => {
      const updated = { ...prev };
      // Add any new steps as collapsed, but ensure current step is expanded
      for (let i = 0; i < totalSteps; i++) {
        if (updated[i] === undefined) {
          updated[i] = i === currentStepIndex ? 'expanded' : 'collapsed';
        }
      }
      // Always ensure current step is expanded (in case it was set before slides loaded)
      if (totalSteps > 0 && updated[currentStepIndex] === 'collapsed') {
        updated[currentStepIndex] = 'expanded';
      }
      return updated;
    });
  }, [totalSteps, currentStepIndex]);

  /**
   * Get expansion state for a step
   */
  const getExpansionState = useCallback(
    (stepIndex: number): ExpansionState => {
      return expansionStates[stepIndex] ?? 'collapsed';
    },
    [expansionStates]
  );

  /**
   * Check if a step is expanded (expanded or pinned)
   */
  const isStepExpanded = useCallback(
    (stepIndex: number): boolean => {
      const state = getExpansionState(stepIndex);
      return state === 'expanded' || state === 'pinned';
    },
    [getExpansionState]
  );

  /**
   * Check if a step is pinned
   */
  const isStepPinned = useCallback(
    (stepIndex: number): boolean => {
      return getExpansionState(stepIndex) === 'pinned';
    },
    [getExpansionState]
  );

  /**
   * Expand a step
   */
  const expandStep = useCallback(
    (stepIndex: number) => {
      // Clear any pending auto-collapse timer
      if (autoCollapseTimers.current[stepIndex]) {
        clearTimeout(autoCollapseTimers.current[stepIndex]);
        delete autoCollapseTimers.current[stepIndex];
      }

      setExpansionStates((prev) => ({
        ...prev,
        [stepIndex]: 'expanded',
      }));
      onExpansionChange?.(stepIndex, 'expanded');
    },
    [onExpansionChange]
  );

  /**
   * Collapse a step (only if not pinned)
   */
  const collapseStep = useCallback(
    (stepIndex: number) => {
      setExpansionStates((prev) => {
        // Don't collapse if pinned
        if (prev[stepIndex] === 'pinned') {
          return prev;
        }
        onExpansionChange?.(stepIndex, 'collapsed');
        return {
          ...prev,
          [stepIndex]: 'collapsed',
        };
      });
    },
    [onExpansionChange]
  );

  /**
   * Pin a step (prevents auto-collapse)
   */
  const pinStep = useCallback(
    (stepIndex: number) => {
      // Clear any pending auto-collapse timer
      if (autoCollapseTimers.current[stepIndex]) {
        clearTimeout(autoCollapseTimers.current[stepIndex]);
        delete autoCollapseTimers.current[stepIndex];
      }

      setExpansionStates((prev) => ({
        ...prev,
        [stepIndex]: 'pinned',
      }));
      onExpansionChange?.(stepIndex, 'pinned');
    },
    [onExpansionChange]
  );

  /**
   * Unpin a step (returns to expanded state)
   */
  const unpinStep = useCallback(
    (stepIndex: number) => {
      setExpansionStates((prev) => {
        if (prev[stepIndex] !== 'pinned') {
          return prev;
        }
        onExpansionChange?.(stepIndex, 'expanded');
        return {
          ...prev,
          [stepIndex]: 'expanded',
        };
      });
    },
    [onExpansionChange]
  );

  /**
   * Toggle pin state
   */
  const togglePin = useCallback(
    (stepIndex: number) => {
      if (isStepPinned(stepIndex)) {
        unpinStep(stepIndex);
      } else {
        pinStep(stepIndex);
      }
    },
    [isStepPinned, pinStep, unpinStep]
  );

  /**
   * Mark step as completed - triggers auto-collapse timer
   */
  const setStepCompleted = useCallback(
    (stepIndex: number) => {
      // Clear any existing timer
      if (autoCollapseTimers.current[stepIndex]) {
        clearTimeout(autoCollapseTimers.current[stepIndex]);
      }

      // Start auto-collapse timer (only if not pinned)
      autoCollapseTimers.current[stepIndex] = setTimeout(() => {
        setExpansionStates((prev) => {
          // Don't collapse if pinned
          if (prev[stepIndex] === 'pinned') {
            return prev;
          }
          onExpansionChange?.(stepIndex, 'collapsed');
          return {
            ...prev,
            [stepIndex]: 'collapsed',
          };
        });
        delete autoCollapseTimers.current[stepIndex];
      }, autoCollapseDelay);
    },
    [autoCollapseDelay, onExpansionChange]
  );

  return {
    expansionStates,
    expandStep,
    collapseStep,
    pinStep,
    unpinStep,
    togglePin,
    setStepCompleted,
    getExpansionState,
    isStepExpanded,
    isStepPinned,
  };
}

export default useStepExpansionState;
