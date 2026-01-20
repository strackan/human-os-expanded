import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { useWorkflowData } from './useWorkflowData';
import { useChatState } from './useChatState';
import { useArtifactState } from './useArtifactState';
import { useModalState } from './useModalState';
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence';
import { fromSerializableMessage } from '@/lib/persistence/types';

/**
 * useTaskModeStateV2 - Modular version that composes smaller hooks
 *
 * This is the V2 implementation that uses specialized hooks:
 * - useWorkflowData: Config and context loading
 * - useChatState: Chat messages and conversation flow
 * - useArtifactState: Artifact panel visibility and sizing
 * - useModalState: Modal open/close state
 * - useWorkflowPersistence: State persistence and resume (Bug 2 fix)
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
  executionId?: string; // For state persistence
  userId?: string; // For state persistence
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
  executionId,
  userId,
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
  // STATE PERSISTENCE (Bug 2 fix)
  // ============================================================

  // Track whether we're currently restoring state (to prevent auto-save during restore)
  const [isRestoringState, setIsRestoringState] = useState(true);
  const hasRestoredRef = useRef(false);

  // Persistence hook
  const {
    loadState,
    saveState,
    isReady: isPersistenceReady,
  } = useWorkflowPersistence({
    executionId,
    userId,
    enabled: !!executionId && !!userId,
  });

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

  // State for pending reopen confirmation
  const [pendingReopenSlide, setPendingReopenSlide] = useState<number | null>(null);

  const goToSlide = useCallback((index: number) => {
    // Allow navigation to any previous slide (not just completed)
    if (index < 0 || index >= slides.length) return;

    // If navigating to current slide, do nothing
    if (index === currentSlideIndex) return;

    // Can always navigate forward to completed slides
    if (index > currentSlideIndex && completedSlides.has(index)) {
      setCurrentSlideIndex(index);
      return;
    }

    // For previous slides that are completed, show confirmation
    if (index < currentSlideIndex && completedSlides.has(index)) {
      setPendingReopenSlide(index);
      return;
    }

    // For non-completed previous slides, navigate directly
    if (index < currentSlideIndex) {
      setCurrentSlideIndex(index);
    }
  }, [completedSlides, currentSlideIndex, slides.length]);

  // Confirm reopening a completed slide
  const confirmReopenSlide = useCallback(() => {
    if (pendingReopenSlide === null) return;

    // Mark the target slide and all subsequent slides as incomplete
    setCompletedSlides(prev => {
      const newCompleted = new Set(prev);
      for (let i = pendingReopenSlide; i < slides.length; i++) {
        newCompleted.delete(i);
      }
      // Keep slides before the target as completed
      return newCompleted;
    });

    // Navigate to the target slide
    setCurrentSlideIndex(pendingReopenSlide);
    setPendingReopenSlide(null);

    showToast({
      message: 'Step reopened. You can now make changes.',
      type: 'info',
      icon: 'none',
      duration: 3000
    });
  }, [pendingReopenSlide, slides.length, showToast]);

  // Cancel reopening
  const cancelReopenSlide = useCallback(() => {
    setPendingReopenSlide(null);
  }, []);

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
    customerId,  // Enables server-side LLM caching (24h TTL)
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
  // STATE PERSISTENCE EFFECTS (Bug 2 fix)
  // ============================================================

  // Restore state on mount (when persistence is ready)
  useEffect(() => {
    if (!isPersistenceReady || hasRestoredRef.current) {
      return;
    }

    const restoreState = async () => {
      console.log('[useTaskModeStateV2] Attempting to restore saved state...');
      const savedState = await loadState();

      if (savedState) {
        console.log('[useTaskModeStateV2] Restoring saved state:', {
          slideIndex: savedState.currentSlideIndex,
          completedCount: savedState.completedSlides.length,
          messageCount: savedState.chatMessages?.length || 0,
        });

        // Restore navigation state
        setCurrentSlideIndex(savedState.currentSlideIndex);
        setCompletedSlides(new Set(savedState.completedSlides));
        setSkippedSlides(new Set(savedState.skippedSlides));

        // Restore workflow data
        setWorkflowState(savedState.workflowData || {});

        // Restore chat messages (convert from serializable format)
        if (savedState.chatMessages && savedState.chatMessages.length > 0) {
          const restoredMessages = savedState.chatMessages.map(fromSerializableMessage);
          chatState.setChatMessages(restoredMessages);
        }

        // Restore branch state
        chatState.setCurrentBranch(savedState.currentBranch);
      } else {
        console.log('[useTaskModeStateV2] No saved state found, starting fresh');
      }

      hasRestoredRef.current = true;
      setIsRestoringState(false);
    };

    restoreState();
  }, [isPersistenceReady, loadState, chatState]);

  // Auto-save when state changes (debounced via persistence service)
  useEffect(() => {
    // Don't save while restoring or if persistence isn't ready
    if (isRestoringState || !isPersistenceReady) {
      return;
    }

    // Don't save if we haven't actually loaded yet
    if (!hasRestoredRef.current) {
      return;
    }

    console.log('[useTaskModeStateV2] Auto-saving state...');
    saveState({
      currentSlideIndex,
      completedSlides,
      skippedSlides,
      workflowState,
      chatMessages: chatState.chatMessages,
      currentBranch: chatState.currentBranch,
    });
  }, [
    currentSlideIndex,
    completedSlides,
    skippedSlides,
    workflowState,
    chatState.chatMessages,
    chatState.currentBranch,
    isRestoringState,
    isPersistenceReady,
    saveState,
  ]);

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

    // Step reopen (Bug 1 fix)
    pendingReopenSlide,
    confirmReopenSlide,
    cancelReopenSlide,
  };
}
