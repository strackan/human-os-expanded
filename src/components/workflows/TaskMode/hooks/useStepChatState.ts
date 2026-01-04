/**
 * useStepChatState - Groups chat messages by step for collapsible display
 *
 * This hook wraps the existing useChatState and adds:
 * - Step-grouped message structure (StepChatGroup[])
 * - Custom title management per step
 * - Integration with useStepExpansionState
 *
 * Maintains backward compatibility by exposing both flat messages
 * and grouped structure.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import type { ChatMessage } from '@/components/workflows/sections/ChatRenderer';
import type {
  StepChatGroup,
  StepStatus,
  UseStepChatStateReturn,
} from '../types/step-chat';
import { useStepExpansionState } from './useStepExpansionState';

interface UseStepChatStateProps {
  /** All workflow slides */
  slides: WorkflowSlide[];

  /** Current slide index */
  currentSlideIndex: number;

  /** Flat chat messages array (from useChatState) */
  chatMessages: ChatMessage[];

  /** Completed slide indices */
  completedSlides: Set<number>;

  /** Skipped slide indices */
  skippedSlides: Set<number>;

  /** Snoozed slide indices */
  snoozedSlides: Set<number>;

  /** Auto-collapse delay in ms */
  autoCollapseDelay?: number;
}

/**
 * Determine step status from sets
 */
function getStepStatus(
  stepIndex: number,
  currentStepIndex: number,
  completedSlides: Set<number>,
  skippedSlides: Set<number>,
  snoozedSlides: Set<number>
): StepStatus {
  // Current step is always 'active' - this takes priority
  if (stepIndex === currentStepIndex) return 'active';
  // Past steps
  if (completedSlides.has(stepIndex)) return 'success';
  if (snoozedSlides.has(stepIndex)) return 'snoozed';
  if (skippedSlides.has(stepIndex)) return 'snoozed'; // Treat skipped same as snoozed visually
  if (stepIndex < currentStepIndex) return 'success'; // Past steps default to success
  return 'pending';
}

/**
 * Group messages by slide index
 *
 * Messages are associated with slides via:
 * 1. slideId field on the message
 * 2. Slide separators (isSlideSeparator=true)
 * 3. Position relative to separators
 */
function groupMessagesBySlide(
  messages: ChatMessage[],
  slides: WorkflowSlide[]
): Record<number, ChatMessage[]> {
  const groups: Record<number, ChatMessage[]> = {};

  // Initialize empty groups for all slides
  slides.forEach((_, index) => {
    groups[index] = [];
  });

  let currentSlideIndex = 0;

  for (const message of messages) {
    // Slide separators mark transitions
    if (message.isSlideSeparator || message.isDivider) {
      // Find the slide index by matching the separator's slideId or slideNumber
      const slideIndex = slides.findIndex(
        (s) => s.id === message.slideId || s.slideNumber === (message as { slideNumber?: number }).slideNumber
      );
      if (slideIndex >= 0) {
        currentSlideIndex = slideIndex;
      }
      // Don't include separators in grouped messages (they're implicit now)
      continue;
    }

    // Associate message with current slide
    if (!groups[currentSlideIndex]) {
      groups[currentSlideIndex] = [];
    }
    groups[currentSlideIndex].push(message);
  }

  return groups;
}

export function useStepChatState({
  slides,
  currentSlideIndex,
  chatMessages,
  completedSlides,
  skippedSlides,
  snoozedSlides,
  autoCollapseDelay = 1500,
}: UseStepChatStateProps): UseStepChatStateReturn {
  // Custom titles keyed by step index
  const [customTitles, setCustomTitles] = useState<Record<number, string>>({});

  // Track when steps complete for auto-collapse
  const prevCompletedRef = useRef<Set<number>>(new Set());

  // Use expansion state hook
  const expansionState = useStepExpansionState({
    totalSteps: slides.length,
    currentStepIndex: currentSlideIndex,
    autoCollapseDelay,
  });

  // Group messages by slide
  const messagesBySlide = useMemo(
    () => groupMessagesBySlide(chatMessages, slides),
    [chatMessages, slides]
  );

  // Build step groups
  const stepGroups = useMemo<StepChatGroup[]>(() => {
    return slides.map((slide, index) => {
      const status = getStepStatus(
        index,
        currentSlideIndex,
        completedSlides,
        skippedSlides,
        snoozedSlides
      );

      return {
        stepIndex: index,
        slideId: slide.id || `slide-${index}`,
        slideTitle: slide.title || slide.label || `Step ${index + 1}`,
        slideLabel: slide.label,
        llmTitle: undefined, // Can be set by LLM later
        customTitle: customTitles[index],
        status,
        expansionState: expansionState.getExpansionState(index),
        messages: messagesBySlide[index] || [],
        activatedAt: status === 'active' ? new Date() : undefined,
        completedAt: status === 'success' ? new Date() : undefined,
      };
    });
  }, [
    slides,
    currentSlideIndex,
    completedSlides,
    skippedSlides,
    snoozedSlides,
    customTitles,
    expansionState,
    messagesBySlide,
  ]);

  // Trigger auto-collapse when steps complete
  useEffect(() => {
    const newlyCompleted = [...completedSlides].filter(
      (idx) => !prevCompletedRef.current.has(idx)
    );

    newlyCompleted.forEach((stepIndex) => {
      expansionState.setStepCompleted(stepIndex);
    });

    prevCompletedRef.current = new Set(completedSlides);
  }, [completedSlides, expansionState]);

  // Set custom title for a step
  const setCustomTitle = useCallback((stepIndex: number, title: string) => {
    setCustomTitles((prev) => ({
      ...prev,
      [stepIndex]: title,
    }));
  }, []);

  // Get current step group
  const currentStepGroup = useMemo(
    () => stepGroups.find((g) => g.stepIndex === currentSlideIndex),
    [stepGroups, currentSlideIndex]
  );

  return {
    stepGroups,
    customTitles,
    setCustomTitle,
    currentStepGroup,
    // Delegate expansion state
    expansionStates: expansionState.expansionStates,
    expandStep: expansionState.expandStep,
    collapseStep: expansionState.collapseStep,
    togglePin: expansionState.togglePin,
  };
}

export default useStepChatState;
