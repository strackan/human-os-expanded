import { useState, useCallback } from 'react';

/**
 * useModalState - Manages all modal open/close state
 *
 * Manages:
 * - Workflow-level snooze modal
 * - Workflow-level escalate/review modal
 * - Step-level modals (snooze, skip, review)
 * - Confirmation modals
 *
 * Extracted from useTaskModeState.ts (lines 97-103)
 */

export function useModalState() {
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [showMetricsSlideup, setShowMetricsSlideup] = useState(false);
  const [showPlaysDropdown, setShowPlaysDropdown] = useState(false);
  const [stepActionMenu, setStepActionMenu] = useState<number | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    type: 'skip' | 'snooze' | null;
    stepIndex: number | null;
  }>({ type: null, stepIndex: null });

  // Workflow-level modal handlers
  const handleSnooze = useCallback(() => {
    console.log('[useModalState] handleSnooze called - opening modal');
    setIsSnoozeModalOpen(true);
  }, []);

  const closeSnoozeModal = useCallback(() => {
    console.log('[useModalState] closeSnoozeModal called');
    setIsSnoozeModalOpen(false);
  }, []);

  const handleEscalate = useCallback(() => {
    console.log('[useModalState] handleEscalate called - opening modal');
    setIsEscalateModalOpen(true);
  }, []);

  const closeEscalateModal = useCallback(() => {
    console.log('[useModalState] closeEscalateModal called');
    setIsEscalateModalOpen(false);
  }, []);

  // UI toggle handlers
  const toggleMetricsSlideup = useCallback((show: boolean) => {
    setShowMetricsSlideup(show);
  }, []);

  const togglePlaysDropdown = useCallback((show: boolean) => {
    setShowPlaysDropdown(show);
  }, []);

  return {
    // State
    isSnoozeModalOpen,
    isEscalateModalOpen,
    showMetricsSlideup,
    showPlaysDropdown,
    stepActionMenu,
    confirmationModal,

    // Handlers
    handleSnooze,
    closeSnoozeModal,
    handleEscalate,
    closeEscalateModal,
    toggleMetricsSlideup,
    togglePlaysDropdown,
    setStepActionMenu,
    setConfirmationModal,
  };
}
