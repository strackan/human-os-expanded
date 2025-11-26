import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { useWorkflowData } from './useWorkflowData';
import { useChatState } from './useChatState';
import { useArtifactState } from './useArtifactState';
import { useModalState } from './useModalState';

/**
 * useTaskModeStateV2 - Modular version that composes smaller hooks
 *
 * This is the V2 implementation that uses specialized hooks:
 * - useWorkflowData: Config and context loading
 * - useChatState: Chat messages and conversation flow
 * - useArtifactState: Artifact panel visibility and sizing
 * - useModalState: Modal open/close state
 *
 * Benefits:
 * - Each hook is focused and testable
 * - Reduced complexity (100 lines vs 701 lines)
 * - Easier to understand and maintain
 */

interface UseTaskModeStateV2Props {
  workflowId: string;
  customerId: string;
  customerName: string;
  onClose: (completed?: boolean) => void;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };
}

export function useTaskModeStateV2({
  workflowId,
  customerId,
  customerName,
  onClose,
  sequenceInfo
}: UseTaskModeStateV2Props) {
  const { showToast } = useToast();

  // ============================================================
  // CORE WORKFLOW STATE
  // ============================================================

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(new Set([0]));
  const [skippedSlides, setSkippedSlides] = useState<Set<number>>(new Set());
  const [snoozedSlides, setSnoozedSlides] = useState<Set<number>>(new Set());
  const [workflowState, setWorkflowState] = useState<Record<string, any>>({});

  // ============================================================
  // SPECIALIZED HOOKS
  // ============================================================

  // Load workflow config and context data
  const workflowData = useWorkflowData({ workflowId, customerId });
  const { slides } = workflowData;
  const currentSlide = slides?.[currentSlideIndex] ?? null;

  // Navigation helpers
  const getNextAvailableSlide = useCallback(() => {
    let nextIndex = currentSlideIndex + 1;
    while (nextIndex < slides.length && (skippedSlides.has(nextIndex) || snoozedSlides.has(nextIndex))) {
      nextIndex++;
    }
    return nextIndex < slides.length ? { index: nextIndex, slide: slides[nextIndex] } : null;
  }, [currentSlideIndex, slides, skippedSlides, snoozedSlides]);

  const getPreviousAvailableSlide = useCallback(() => {
    let prevIndex = currentSlideIndex - 1;
    while (prevIndex >= 0 && (skippedSlides.has(prevIndex) || snoozedSlides.has(prevIndex))) {
      prevIndex--;
    }
    return prevIndex >= 0 ? { index: prevIndex, slide: slides[prevIndex] } : null;
  }, [currentSlideIndex, slides, skippedSlides, snoozedSlides]);

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      let nextIndex = currentSlideIndex + 1;
      while (nextIndex < slides.length && (skippedSlides.has(nextIndex) || snoozedSlides.has(nextIndex))) {
        nextIndex++;
      }

      if (nextIndex < slides.length) {
        setCompletedSlides(prev => new Set(prev).add(nextIndex));
        setCurrentSlideIndex(nextIndex);
      } else {
        showToast({
          message: 'Workflow complete!',
          type: 'success',
          icon: 'check',
          duration: 3000
        });
        setTimeout(() => onClose(true), 100);
      }
    } else {
      setCompletedSlides(prev => new Set(prev).add(currentSlideIndex));
    }
  }, [currentSlideIndex, slides.length, skippedSlides, snoozedSlides, showToast, onClose]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      let prevIndex = currentSlideIndex - 1;
      while (prevIndex >= 0 && (skippedSlides.has(prevIndex) || snoozedSlides.has(prevIndex))) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        setCurrentSlideIndex(prevIndex);
      }
    }
  }, [currentSlideIndex, skippedSlides, snoozedSlides]);

  const goToSlide = useCallback((index: number) => {
    if (completedSlides.has(index)) {
      setCurrentSlideIndex(index);
    }
  }, [completedSlides]);

  const handleComplete = useCallback(() => {
    const message = sequenceInfo
      ? 'Workflow complete! Loading next workflow...'
      : 'Workflow complete!';

    showToast({
      message,
      type: 'success',
      icon: 'check',
      duration: 3000
    });

    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        onClose(true);
      }
    }, 1500);
  }, [sequenceInfo, onClose, showToast]);

  const handleSkip = useCallback(() => {
    showToast({
      message: 'Workflow skipped. Moving to next workflow.',
      type: 'info',
      icon: 'none',
      duration: 3000
    });

    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        onClose();
      }
    }, 1500);
  }, [sequenceInfo, onClose, showToast]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const skipStep = useCallback((stepIndex: number) => {
    console.log('[useTaskModeStateV2] Skip step:', stepIndex);
    setSkippedSlides(prev => new Set(prev).add(stepIndex));

    showToast({
      message: `Step "${slides[stepIndex]?.title || `#${stepIndex + 1}`}" skipped!`,
      type: 'success',
      icon: 'check',
      duration: 3000
    });

    if (currentSlideIndex === stepIndex) {
      goToNextSlide();
    }
  }, [slides, showToast, currentSlideIndex, goToNextSlide]);

  const snoozeStep = useCallback((stepIndex: number) => {
    console.log('[useTaskModeStateV2] Snooze step:', stepIndex);
    setSnoozedSlides(prev => new Set(prev).add(stepIndex));

    showToast({
      message: `Step "${slides[stepIndex]?.title || `#${stepIndex + 1}`}" snoozed! I'll remind you later.`,
      type: 'info',
      icon: 'clock',
      duration: 3000
    });

    if (currentSlideIndex === stepIndex) {
      goToNextSlide();
    }
  }, [slides, showToast, currentSlideIndex, goToNextSlide]);

  // Chat state management
  const chatState = useChatState({
    currentSlide,
    currentSlideIndex,
    workflowState,
    setWorkflowState,
    goToNextSlide,
    goToPreviousSlide,
    onClose,
    handleComplete,
    customerName,
    workflowPurpose: currentSlide?.stepMapping || 'renewal_preparation',
  });

  // Artifact state management
  const artifactState = useArtifactState({
    currentSlide,
    currentSlideIndex,
    currentBranch: chatState.currentBranch,
  });

  // Modal state management
  const modalState = useModalState();

  // Workflow state updater
  const updateWorkflowState = useCallback((key: string, value: any) => {
    setWorkflowState(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleButtonClick = useCallback((buttonValue: string) => {
    console.log('[useTaskModeStateV2] handleButtonClick called with value:', buttonValue);
    if (buttonValue === 'start' || buttonValue === 'continue') {
      console.log('[useTaskModeStateV2] Advancing to next slide');
      goToNextSlide();
    } else if (buttonValue === 'snooze') {
      console.log('[useTaskModeStateV2] Button value is "snooze" - calling handleSnooze');
      modalState.handleSnooze();
    } else if (buttonValue === 'skip') {
      handleSkip();
    }
  }, [goToNextSlide, modalState, handleSkip]);

  // ============================================================
  // RETURN COMPOSED STATE & HANDLERS
  // ============================================================

  return {
    // Workflow data
    ...workflowData,
    slides,

    // Core state
    currentSlide,
    currentSlideIndex,
    completedSlides,
    skippedSlides,
    snoozedSlides,
    workflowState,
    customerName,

    // Navigation
    goToNextSlide,
    goToPreviousSlide,
    goToSlide,
    getNextAvailableSlide,
    getPreviousAvailableSlide,

    // Chat state
    ...chatState,

    // Artifact state
    ...artifactState,

    // Modal state
    ...modalState,

    // Lifecycle
    handleComplete,
    handleSkip,
    handleClose,
    skipStep,
    snoozeStep,
    handleButtonClick,
    updateWorkflowState,

    // Direct state setters for syncing with external sources
    setSnoozedSlides,
    setSkippedSlides,
  };
}
