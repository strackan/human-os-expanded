'use client';

/**
 * TaskModeFullscreen - Refactored Version
 *
 * Main orchestrator component that:
 * 1. Uses useTaskModeState hook for all state management
 * 2. Provides TaskModeContext to child components
 * 3. Composes child components (Header, Chat, Artifacts, Modals)
 *
 * This is the new modular architecture replacing the monolithic TaskModeFullscreen-v3.
 */

import React, { useEffect, useState } from 'react';
import TaskModeContext, { TaskModeContextValue } from './TaskModeContext';
import { useTaskModeState } from './hooks/useTaskModeState';

// TODO: Import child components when extracted
// import TaskModeHeader from './components/TaskModeHeader';
// import TaskModeChatPanel from './components/TaskModeChatPanel';
// import TaskModeArtifactPanel from './components/TaskModeArtifactPanel';
// import TaskModeModals from './components/TaskModeModals';

// Temporary: Import sections from original location
import WorkflowHeader from '@/components/workflows/sections/WorkflowHeader';
import WorkflowStepProgress from '@/components/workflows/sections/WorkflowStepProgress';
import ChatRenderer from '@/components/workflows/sections/ChatRenderer';
import ArtifactRenderer from '@/components/workflows/renderers/ArtifactRenderer';
import { CustomerMetrics } from '@/components/workflows/CustomerMetrics';
import WorkflowSequencePanel from '@/components/workflows/WorkflowSequencePanel';
import { getWorkflowSequence } from '@/config/workflowSequences';
import { Mic, Paperclip, Shield, X } from 'lucide-react';
import { StepSnoozeModal, StepSkipModal, StepReviewModal } from '@/components/workflows/StepActionModals';
import { WorkflowStepActionService } from '@/lib/workflows/actions/WorkflowStepActionService';
import { EnhancedSnoozeModal } from '@/components/workflows/EnhancedSnoozeModal';
import { EnhancedReviewModal } from '@/components/workflows/EnhancedReviewModal';
import { ReviewApprovalModal } from '@/components/workflows/ReviewApprovalModal';
import { RejectionAlertBanner } from '@/components/workflows/RejectionAlertBanner';
import { ResubmitConfirmationModal } from '@/components/workflows/ResubmitConfirmationModal';
import { RejectionHistoryTimeline } from '@/components/workflows/RejectionHistoryTimeline';
import { snoozeWithTriggers, requestReviewWithTriggers } from '@/lib/api/workflow-triggers';
import { approveWorkflowReview, requestWorkflowChanges, rejectWorkflowReview, resubmitWorkflowForReview } from '@/lib/api/workflow-triggers';
import type { WakeTrigger, TriggerLogic } from '@/types/wake-triggers';
import type { ReviewTrigger, ReviewRejectionHistory } from '@/types/review-triggers';
import { useToast } from '@/components/ui/ToastProvider';

interface TaskModeFullscreenProps {
  workflowId: string;
  workflowTitle?: string;
  customerId: string;
  customerName: string;
  executionId?: string;
  userId?: string;
  workflowStatus?: string;
  onClose: (completed?: boolean) => void;
  onWorkflowAction?: (actionType: string) => void;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };
}

export default function TaskModeFullscreen(props: TaskModeFullscreenProps) {
  const {
    workflowId,
    workflowTitle,
    customerId,
    customerName,
    executionId,
    userId,
    workflowStatus,
    onClose,
    onWorkflowAction,
    sequenceInfo
  } = props;

  // Toast notifications
  const { showToast } = useToast();

  // Get all state and handlers from the hook
  const state = useTaskModeState({
    workflowId,
    customerId,
    customerName,
    onClose,
    sequenceInfo
  });

  // Step-level action modal state
  const [showStepSnoozeModal, setShowStepSnoozeModal] = useState<number | null>(null);
  const [showStepSkipModal, setShowStepSkipModal] = useState<number | null>(null);
  const [showStepReviewModal, setShowStepReviewModal] = useState<number | null>(null);

  // Review approval modal state
  const [showReviewApprovalModal, setShowReviewApprovalModal] = useState(false);
  const [workflowReviewerData, setWorkflowReviewerData] = useState<any>(null);

  // Rejection state (Phase 1.4)
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showRejectionHistoryModal, setShowRejectionHistoryModal] = useState(false);
  const [workflowRejectionData, setWorkflowRejectionData] = useState<any>(null);
  const [rejectionHistory, setRejectionHistory] = useState<ReviewRejectionHistory>([]);

  // Debug: Log step snooze modal state changes
  useEffect(() => {
    console.log('[TaskModeFullscreen] showStepSnoozeModal changed to:', showStepSnoozeModal);
  }, [showStepSnoozeModal]);

  // Step states from database
  const [stepStates, setStepStates] = useState<Record<number, any>>({});

  // Step execution data (includes review status)
  const [stepExecutions, setStepExecutions] = useState<Record<number, any>>({});

  // Workflow review status
  const [workflowReviewStatus, setWorkflowReviewStatus] = useState<string | null>(null);
  const [reviewBlockerMessage, setReviewBlockerMessage] = useState<string | null>(null);

  // Function to load workflow review status
  const reloadWorkflowReviewStatus = async () => {
    if (executionId && userId) {
      console.log('[TaskModeFullscreen] Loading workflow review status for execution:', executionId);
      const service = new WorkflowStepActionService();
      const supabase = (service as any).supabase;

      const { data, error } = await supabase
        .from('workflow_executions')
        .select('review_status, reviewer_id, review_requested_at, review_reason, assigned_csm_id, review_iteration, review_rejection_history, profiles!workflow_executions_reviewer_id_fkey(full_name), requester:profiles!workflow_executions_assigned_csm_id_fkey(full_name)')
        .eq('id', executionId)
        .single();

      if (!error && data) {
        console.log('[TaskModeFullscreen] Workflow review status:', data);
        setWorkflowReviewStatus(data.review_status);
        setRejectionHistory(data.review_rejection_history || []);

        // Check if current user is the reviewer
        const isCurrentUserReviewer = data.reviewer_id === userId;
        const isCurrentUserOwner = data.assigned_csm_id === userId;

        if (data.review_status === 'rejected' && isCurrentUserOwner) {
          // Workflow is rejected - show rejection alert to owner
          const latestRejection = data.review_rejection_history?.length > 0
            ? data.review_rejection_history[data.review_rejection_history.length - 1]
            : null;

          setWorkflowRejectionData({
            reviewerName: data.profiles?.full_name || 'Reviewer',
            rejectedAt: latestRejection?.rejectedAt || new Date().toISOString(),
            reason: latestRejection?.reason,
            comments: latestRejection?.comments,
            iteration: data.review_iteration || 1,
            rejectionHistory: data.review_rejection_history,
          });
          setReviewBlockerMessage(null);
          setWorkflowReviewerData(null);
        } else if (data.review_status === 'pending') {
          const reviewerName = data.profiles?.full_name || 'the assigned reviewer';

          if (isCurrentUserReviewer) {
            // Current user is the reviewer - show approval UI
            setWorkflowReviewerData({
              requestedBy: data.requester?.full_name || 'Unknown',
              reason: data.review_reason,
              reviewerId: data.reviewer_id,
              reviewIteration: data.review_iteration || 1,
              rejectionHistory: data.review_rejection_history,
            });
            setReviewBlockerMessage(null); // Don't show blocker for reviewer
            setWorkflowRejectionData(null);
          } else {
            // Current user is not the reviewer - show blocker
            setReviewBlockerMessage(
              `This workflow is pending review from ${reviewerName}. You cannot complete it until the review is approved.`
            );
            setWorkflowReviewerData(null);
            setWorkflowRejectionData(null);
          }
        } else {
          setReviewBlockerMessage(null);
          setWorkflowReviewerData(null);
          setWorkflowRejectionData(null);
        }
      }
    }
  };

  // Function to load/reload step states
  const reloadStepStates = async () => {
    if (executionId) {
      console.log('[TaskModeFullscreen] Loading step states for execution:', executionId);
      const service = new WorkflowStepActionService();
      const result = await service.getStepStates(executionId);

      console.log('[TaskModeFullscreen] Step states result:', result);

      if (result.success && result.states) {
        // Convert array to map indexed by step_index
        const stateMap: Record<number, any> = {};
        result.states.forEach((state: any) => {
          stateMap[state.step_index] = state;
        });
        console.log('[TaskModeFullscreen] Step states map:', stateMap);
        setStepStates(stateMap);
      }
    }
  };

  // Function to load step execution data (includes review status)
  const reloadStepExecutions = async () => {
    if (executionId) {
      console.log('[TaskModeFullscreen] Loading step executions for execution:', executionId);
      const service = new WorkflowStepActionService();
      const supabase = (service as any).supabase;

      const { data, error } = await supabase
        .from('workflow_step_executions')
        .select('step_index, review_status, review_required_from, profiles!workflow_step_executions_review_required_from_fkey(full_name)')
        .eq('workflow_execution_id', executionId);

      if (!error && data) {
        console.log('[TaskModeFullscreen] Step executions result:', data);
        // Convert array to map indexed by step_index
        const executionMap: Record<number, any> = {};
        data.forEach((execution: any) => {
          executionMap[execution.step_index] = execution;
        });
        setStepExecutions(executionMap);
      }
    }
  };

  // Load step states, step executions, and workflow review status when executionId is available
  useEffect(() => {
    reloadStepStates();
    reloadStepExecutions();
    reloadWorkflowReviewStatus();
  }, [executionId]);

  // Sync snoozedSlides and skippedSlides Sets with database stepStates
  // This ensures navigation logic skips snoozed/skipped steps correctly
  useEffect(() => {
    const snoozedIndices = new Set<number>();
    const skippedIndices = new Set<number>();

    Object.entries(stepStates).forEach(([indexStr, stepState]) => {
      const index = parseInt(indexStr, 10);
      if (stepState.status === 'snoozed') {
        snoozedIndices.add(index);
      } else if (stepState.status === 'skipped') {
        skippedIndices.add(index);
      }
    });

    // Update the Sets in the hook state
    state.setSnoozedSlides(snoozedIndices);
    state.setSkippedSlides(skippedIndices);

    console.log('[TaskModeFullscreen] Synced step states - snoozed:', Array.from(snoozedIndices), 'skipped:', Array.from(skippedIndices));
  }, [stepStates, state.setSnoozedSlides, state.setSkippedSlides]);

  // Handle workflow-level snooze with triggers
  const handleWorkflowSnooze = async (triggers: WakeTrigger[], logic?: TriggerLogic) => {
    if (!executionId || !userId) {
      console.error('[TaskModeFullscreen] Cannot snooze: missing executionId or userId');
      return;
    }

    try {
      console.log('[TaskModeFullscreen] Snoozing workflow with triggers:', triggers, 'logic:', logic);
      console.log('[TaskModeFullscreen] Using executionId:', executionId, 'userId:', userId);
      const result = await snoozeWithTriggers(executionId, userId, triggers, logic);
      console.log('[TaskModeFullscreen] Snooze API response:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('[TaskModeFullscreen] Workflow snoozed successfully - should now have status=snoozed');
        state.closeSnoozeModal();

        // Format the wake date for display
        const dateTrigger = triggers.find(t => t.type === 'date');
        const wakeDate = dateTrigger
          ? new Date((dateTrigger.config as any).date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : 'when conditions are met';

        // Show success toast
        showToast({
          message: `Workflow snoozed successfully! I'll remind you on ${wakeDate}.`,
          type: 'success',
          icon: 'check',
          duration: 4000
        });

        // Close workflow after brief delay
        setTimeout(() => {
          onClose(); // Close the workflow
        }, 1000);
      } else {
        console.error('[TaskModeFullscreen] Failed to snooze workflow:', result.error);
        alert(`Failed to snooze workflow: ${result.error}`);
      }
    } catch (error) {
      console.error('[TaskModeFullscreen] Error snoozing workflow:', error);
      alert('Failed to snooze workflow');
    }
  };

  // Handle workflow-level review request with triggers
  const handleWorkflowReview = async (reviewerId: string, triggers: ReviewTrigger[], logic?: TriggerLogic, reason?: string) => {
    if (!executionId) {
      console.error('[TaskModeFullscreen] Cannot request review: missing executionId');
      return;
    }

    try {
      console.log('[TaskModeFullscreen] Requesting review with triggers:', triggers, 'logic:', logic, 'reviewer:', reviewerId);
      const result = await requestReviewWithTriggers(executionId, reviewerId, triggers, reason, logic);
      console.log('[TaskModeFullscreen] Review API response:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('[TaskModeFullscreen] Review requested successfully');
        state.closeEscalateModal();

        // Show success toast
        showToast({
          message: `Review requested successfully! You'll keep ownership but workflow will be blocked until approved.`,
          type: 'success',
          icon: 'check',
          duration: 5000
        });

        // Reload review status
        await reloadWorkflowReviewStatus();

        // Close workflow after brief delay
        setTimeout(() => {
          onClose(); // Close the workflow
        }, 1000);
      } else {
        console.error('[TaskModeFullscreen] Failed to request review:', result.error);
        alert(`Failed to request review: ${result.error}`);
      }
    } catch (error) {
      console.error('[TaskModeFullscreen] Error requesting review:', error);
      alert('Failed to request review');
    }
  };

  // Handle workflow review approval
  const handleApproveWorkflowReview = async (comments?: string) => {
    if (!executionId) {
      console.error('[TaskModeFullscreen] Cannot approve review: missing executionId');
      return;
    }

    try {
      console.log('[TaskModeFullscreen] Approving workflow review');
      const result = await approveWorkflowReview(executionId, comments);

      if (result.success) {
        console.log('[TaskModeFullscreen] Review approved successfully');
        showToast({
          message: 'Review approved! The user can now complete the workflow.',
          type: 'success',
          icon: 'check',
          duration: 4000
        });

        // Reload review status
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to approve review');
      }
    } catch (error: any) {
      console.error('[TaskModeFullscreen] Error approving review:', error);
      showToast({
        message: `Failed to approve review: ${error.message}`,
        type: 'error',
        duration: 5000
      });
      throw error;
    }
  };

  // Handle workflow review changes request
  const handleRequestWorkflowChanges = async (comments: string) => {
    if (!executionId) {
      console.error('[TaskModeFullscreen] Cannot request changes: missing executionId');
      return;
    }

    try {
      console.log('[TaskModeFullscreen] Requesting workflow changes');
      const result = await requestWorkflowChanges(executionId, comments);

      if (result.success) {
        console.log('[TaskModeFullscreen] Changes requested successfully');
        showToast({
          message: 'Changes requested. The user has been notified.',
          type: 'info',
          duration: 4000
        });

        // Reload review status
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to request changes');
      }
    } catch (error: any) {
      console.error('[TaskModeFullscreen] Error requesting changes:', error);
      showToast({
        message: `Failed to request changes: ${error.message}`,
        type: 'error',
        duration: 5000
      });
      throw error;
    }
  };

  // Handle workflow review rejection (Phase 1.4)
  const handleRejectWorkflowReview = async (reason: string | undefined, comments: string) => {
    if (!executionId) {
      console.error('[TaskModeFullscreen] Cannot reject review: missing executionId');
      return;
    }

    try {
      console.log('[TaskModeFullscreen] Rejecting workflow review');
      const result = await rejectWorkflowReview(executionId, reason, comments);

      if (result.success) {
        console.log('[TaskModeFullscreen] Review rejected successfully');
        showToast({
          message: 'Workflow rejected. The user has been notified to address feedback.',
          type: 'info',
          duration: 4000
        });

        // Reload review status
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to reject review');
      }
    } catch (error: any) {
      console.error('[TaskModeFullscreen] Error rejecting review:', error);
      showToast({
        message: `Failed to reject review: ${error.message}`,
        type: 'error',
        duration: 5000
      });
      throw error;
    }
  };

  // Handle workflow resubmission (Phase 1.4)
  const handleResubmitWorkflow = async (notes?: string) => {
    if (!executionId) {
      console.error('[TaskModeFullscreen] Cannot resubmit: missing executionId');
      return;
    }

    try {
      console.log('[TaskModeFullscreen] Resubmitting workflow for review');
      const result = await resubmitWorkflowForReview(executionId, notes);

      if (result.success) {
        console.log('[TaskModeFullscreen] Workflow resubmitted successfully');
        showToast({
          message: 'Workflow re-submitted successfully! The reviewer will be notified.',
          type: 'success',
          icon: 'check',
          duration: 4000
        });

        // Reload review status
        await reloadWorkflowReviewStatus();
        setShowResubmitModal(false);
      } else {
        throw new Error(result.error || 'Failed to resubmit workflow');
      }
    } catch (error: any) {
      console.error('[TaskModeFullscreen] Error resubmitting workflow:', error);
      showToast({
        message: `Failed to resubmit workflow: ${error.message}`,
        type: 'error',
        duration: 5000
      });
      throw error;
    }
  };

  // Resize handling effect (must be before early returns)
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    state.setIsArtifactResizing(true);
  };

  useEffect(() => {
    if (!state.isArtifactResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
      // Constrain artifact panel to 35-60% to ensure chat panel has at least 40% for input
      const constrainedWidth = Math.min(Math.max(newWidth, 35), 60);
      state.setArtifactsPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      state.setIsArtifactResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [state.isArtifactResizing, state.setArtifactsPanelWidth, state.setIsArtifactResizing]);

  // Wrap handleComplete to check for pending review or rejection (Phase 1.4)
  const handleCompleteWithReviewCheck = () => {
    if (workflowReviewStatus === 'pending') {
      showToast({
        message: reviewBlockerMessage || 'Cannot complete: workflow is pending review',
        type: 'error',
        icon: 'alert',
        duration: 5000
      });
      return;
    }
    if (workflowReviewStatus === 'rejected') {
      showToast({
        message: 'Cannot complete: workflow has been rejected. Please address feedback and re-submit.',
        type: 'error',
        icon: 'alert',
        duration: 5000
      });
      return;
    }
    state.handleComplete();
  };

  // Build the context value
  const contextValue: TaskModeContextValue = {
    // State
    currentSlide: state.currentSlide,
    slides: state.slides,
    currentSlideIndex: state.currentSlideIndex,
    workflowState: state.workflowState,
    chatMessages: state.chatMessages,
    showArtifacts: state.showArtifacts,
    currentBranch: state.currentBranch,
    chatInputValue: state.chatInputValue,
    customerName,
    customer: state.customer,
    expansionData: state.expansionData,
    stakeholders: state.stakeholders ?? null,
    showMetricsSlideup: state.showMetricsSlideup,
    showPlaysDropdown: state.showPlaysDropdown,
    stepActionMenu: state.stepActionMenu,
    artifactsPanelWidth: state.artifactsPanelWidth,
    isArtifactResizing: state.isArtifactResizing,
    contextLoading: state.contextLoading,
    contextError: state.contextError,

    // Navigation
    goToNextSlide: state.goToNextSlide,
    goToPreviousSlide: state.goToPreviousSlide,
    goToSlide: state.goToSlide,

    // Chat routes
    sendMessage: state.sendMessage,
    handleButtonClick: state.handleButtonClick,
    handleBranchNavigation: state.handleBranchNavigation,
    setChatInputValue: state.setChatInputValue,
    handleComponentValueChange: state.handleComponentValueChange,

    // Artifact routes
    toggleArtifacts: state.toggleArtifacts,
    updateWorkflowState: state.updateWorkflowState,
    setArtifactsPanelWidth: state.setArtifactsPanelWidth,
    setIsArtifactResizing: state.setIsArtifactResizing,

    // Header routes
    toggleMetricsSlideup: state.toggleMetricsSlideup,
    togglePlaysDropdown: state.togglePlaysDropdown,
    setStepActionMenu: state.setStepActionMenu,

    // Lifecycle
    handleComplete: handleCompleteWithReviewCheck,
    handleSnooze: state.handleSnooze,
    handleSkip: state.handleSkip,
    handleClose: state.handleClose,
    skipStep: state.skipStep,
    snoozeStep: state.snoozeStep
  };

  // Loading state
  if (!state.config && !state.configError) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center text-gray-700">
          <div className="inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading workflow configuration...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.configError || !state.config) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 backdrop-blur-sm flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-700 mb-6">{state.configError || 'Unknown error loading workflow configuration'}</p>
          <button
            onClick={() => onClose()}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Render chat content helper
  const renderChatContent = () => {
    if (!state.currentSlide) return null;

    const handleChatButtonClick = (buttonValue: string) => {
      // Check for nextBranches in current branch first
      if (state.currentBranch && state.currentSlide?.chat?.branches) {
        const branch = state.currentSlide.chat.branches[state.currentBranch];
        if (branch && 'nextBranches' in branch && branch.nextBranches && branch.nextBranches[buttonValue]) {
          state.handleBranchNavigation(branch.nextBranches[buttonValue]);
          return;
        }
      }

      // Then check initial message nextBranches
      const initialMessage = state.currentSlide?.chat?.initialMessage;
      if (initialMessage?.nextBranches && initialMessage.nextBranches[buttonValue]) {
        state.handleBranchNavigation(initialMessage.nextBranches[buttonValue]);
      } else {
        state.handleButtonClick(buttonValue);
      }
    };

    // Check if current step is snoozed
    const currentStepState = stepStates[state.currentSlideIndex];
    const isCurrentStepSnoozed = currentStepState?.status === 'snoozed';
    const snoozeUntil = currentStepState?.snooze_until ? new Date(currentStepState.snooze_until) : null;

    // Check if current step has pending review
    const currentStepExecution = stepExecutions[state.currentSlideIndex];
    const isCurrentStepReviewPending = currentStepExecution?.review_status === 'pending';
    const stepReviewerName = currentStepExecution?.profiles?.full_name || 'the assigned reviewer';

    // Callback to get dynamic button label based on next available slide
    const getNextButtonLabel = (originalLabel: string, buttonValue: string) => {
      // Only modify "next" buttons (start, continue, next, proceed)
      const isNextButton = ['start', 'continue', 'next', 'proceed'].some(
        val => buttonValue.toLowerCase().includes(val) || originalLabel.toLowerCase().includes(val)
      );

      if (!isNextButton) {
        return originalLabel; // Keep original label for non-next buttons (e.g., "Back", "Skip")
      }

      // Get the next available slide
      const nextAvailable = state.getNextAvailableSlide();

      // If next slide has a previousButton property, use it
      if (nextAvailable?.slide?.previousButton) {
        return nextAvailable.slide.previousButton;
      }

      // Otherwise return original label
      return originalLabel;
    };

    // Callback to get dynamic button label for "back" buttons based on previous available slide
    const getPreviousButtonLabel = (originalLabel: string, buttonValue: string) => {
      // Only modify "back" or "previous" buttons
      const isBackButton = ['back', 'previous'].some(
        val => buttonValue.toLowerCase().includes(val) || originalLabel.toLowerCase().includes(val)
      );

      if (!isBackButton) {
        return originalLabel; // Keep original label for non-back buttons
      }

      // Get the previous available slide (skipping snoozed/skipped steps)
      const prevAvailable = state.getPreviousAvailableSlide();

      // If there's a previous slide, use its label for the button
      if (prevAvailable?.slide) {
        // Use the slide's label, or "previousButton" if defined, or original label
        return prevAvailable.slide.label || originalLabel;
      }

      // Otherwise return original label
      return originalLabel;
    };

    return (
      <div className="relative h-full">
        <div className={isCurrentStepSnoozed || isCurrentStepReviewPending ? 'opacity-30 pointer-events-none' : ''}>
          <ChatRenderer
            currentSlide={state.currentSlide}
            chatMessages={state.chatMessages}
            workflowState={state.workflowState}
            customerName={customerName}
            onSendMessage={state.sendMessage}
            onBranchNavigation={state.handleBranchNavigation}
            onComponentValueChange={state.handleComponentValueChange}
            onButtonClick={handleChatButtonClick}
            getNextButtonLabel={getNextButtonLabel}
            getPreviousButtonLabel={getPreviousButtonLabel}
          />
        </div>

        {/* Snoozed Step Overlay */}
        {isCurrentStepSnoozed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center border-2 border-gray-300">
              <div className="text-6xl mb-4">💤</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Task Snoozed</h3>
              <p className="text-gray-600 mb-4">Check back later.</p>
              {snoozeUntil && (
                <p className="text-sm text-gray-700">
                  Snoozed until {snoozeUntil.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Review Pending Step Overlay */}
        {isCurrentStepReviewPending && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center border-2 border-blue-200">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-blue-900 mb-2">Review Pending</h3>
              <p className="text-gray-600 mb-4">
                This step is awaiting review from {stepReviewerName}.
              </p>
              <p className="text-sm text-gray-700">
                You cannot complete this step until it has been approved.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render artifact helper
  const renderArtifact = () => {
    if (!state.currentSlide?.artifacts?.sections || state.currentSlide.artifacts.sections.length === 0) {
      return null;
    }

    // Filter to only visible artifacts
    const visibleSections = state.currentSlide.artifacts.sections.filter((section: any) => section.visible !== false);

    if (visibleSections.length === 0) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <p className="text-gray-500 text-sm">No artifacts to display</p>
        </div>
      );
    }

    // Render all visible artifacts
    return (
      <div className="overflow-y-auto h-full p-6 space-y-6">
        {visibleSections.map((section: any, index: number) => (
          <ArtifactRenderer
            key={section.id || `artifact-${index}`}
            slide={state.currentSlide!}
            section={section}
            customerName={customerName}
            workflowState={state.workflowState}
            customer={state.customer}
            expansionData={state.expansionData}
            stakeholders={state.stakeholders || []}
            sequenceInfo={sequenceInfo}
            onNext={state.goToNextSlide}
            onBack={state.goToPreviousSlide}
            onClose={onClose}
            onComplete={state.handleComplete}
            onUpdateState={state.updateWorkflowState}
          />
        ))}
      </div>
    );
  };

  return (
    <TaskModeContext.Provider value={contextValue}>
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 backdrop-blur-sm flex items-center justify-center p-8">
        {/* Workstation Container */}
        <div className="relative w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Plays Dropdown Panel */}
          {state.showPlaysDropdown && sequenceInfo && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={() => state.togglePlaysDropdown(false)}
              />
              <div className="absolute top-16 left-0 right-0 z-50 px-4">
                <WorkflowSequencePanel
                  workflows={getWorkflowSequence(sequenceInfo.sequenceId)?.workflows || []}
                  currentIndex={sequenceInfo.currentIndex}
                  onSelectWorkflow={sequenceInfo.onJumpToWorkflow || (() => {})}
                  completedWorkflows={new Set()}
                  isDropdown={true}
                />
              </div>
            </>
          )}

          {/* Header */}
          <WorkflowHeader
            workflowTitle={workflowTitle || (state.config as any)?.workflowName || 'Workflow'}
            customerName={customerName}
            currentSlideIndex={state.currentSlideIndex}
            showArtifacts={state.showArtifacts}
            sequenceInfo={sequenceInfo}
            executionId={executionId}
            userId={userId}
            workflowStatus={workflowStatus}
            onEscalate={state.handleEscalate}
            onTogglePlays={() => state.togglePlaysDropdown(!state.showPlaysDropdown)}
            onToggleMetrics={() => state.toggleMetricsSlideup(true)}
            onToggleArtifacts={() => state.toggleArtifacts(!state.showArtifacts)}
            onClose={state.handleClose}
            onWorkflowAction={onWorkflowAction}
          />

          {/* Progress Bar */}
          <WorkflowStepProgress
            slides={state.slides}
            currentSlideIndex={state.currentSlideIndex}
            completedSlides={state.completedSlides}
            stepActionMenu={state.stepActionMenu}
            stepStates={stepStates}
            onStepClick={state.goToSlide}
            onToggleStepActionMenu={state.setStepActionMenu}
            onSnoozeStep={(index) => {
              console.log('[TaskModeFullscreen] onSnoozeStep called for index:', index);
              setShowStepSnoozeModal(index);
              state.setStepActionMenu(null);
            }}
            onSkipStep={(index) => {
              setShowStepSkipModal(index);
              state.setStepActionMenu(null);
            }}
            onReviewStep={(index) => {
              console.log('[TaskModeFullscreen] onReviewStep called for index:', index);
              setShowStepReviewModal(index);
              state.setStepActionMenu(null);
            }}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Chat */}
            <div
              className="flex flex-col bg-white"
              style={{ width: state.showArtifacts ? `${100 - state.artifactsPanelWidth}%` : '100%' }}
            >
              {/* Rejection Alert Banner (Phase 1.4) */}
              {workflowReviewStatus === 'rejected' && workflowRejectionData && (
                <RejectionAlertBanner
                  reviewerName={workflowRejectionData.reviewerName}
                  rejectedAt={workflowRejectionData.rejectedAt}
                  reason={workflowRejectionData.reason}
                  comments={workflowRejectionData.comments}
                  iteration={workflowRejectionData.iteration}
                  rejectionHistory={workflowRejectionData.rejectionHistory}
                  onResubmit={() => setShowResubmitModal(true)}
                  onViewHistory={() => setShowRejectionHistoryModal(true)}
                />
              )}

              {/* Review Pending Banner (for non-reviewers) */}
              {workflowReviewStatus === 'pending' && reviewBlockerMessage && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Review Pending</p>
                      <p className="text-xs text-blue-700 mt-0.5">{reviewBlockerMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Required Banner (for reviewers) */}
              {workflowReviewStatus === 'pending' && workflowReviewerData && (
                <div className="bg-green-50 border-b border-green-200 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">Your Review Required</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        {workflowReviewerData.requestedBy} is requesting your review of this workflow
                      </p>
                    </div>
                    <button
                      onClick={() => setShowReviewApprovalModal(true)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Review Now
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {state.contextLoading ? (
                  <div className="flex items-center justify-center p-12 h-full">
                    <div className="text-center">
                      <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600">Loading workflow data...</p>
                    </div>
                  </div>
                ) : state.contextError ? (
                  <div className="flex items-center justify-center p-12 h-full">
                    <div className="max-w-md text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-600 text-2xl">⚠</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Workflow Data</h3>
                      <p className="text-gray-600">{state.contextError.message}</p>
                    </div>
                  </div>
                ) : (
                  renderChatContent()
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-2 items-end max-w-4xl mx-auto">
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                    <Mic className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    ref={state.chatInputRef}
                    type="text"
                    value={state.chatInputValue}
                    onChange={(e) => state.setChatInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && state.chatInputValue.trim()) {
                        state.sendMessage(state.chatInputValue.trim());
                        state.setChatInputValue('');
                      }
                    }}
                    placeholder={state.config.chat?.placeholder || 'Type a message...'}
                    className="flex-1 min-w-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={() => {
                      if (state.chatInputValue.trim()) {
                        state.sendMessage(state.chatInputValue.trim());
                        state.setChatInputValue('');
                      }
                    }}
                    disabled={!state.chatInputValue.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Resizable Divider */}
            {state.showArtifacts && (
              <div
                onMouseDown={handleResizeStart}
                className={`w-3 bg-gray-200 hover:bg-blue-400 cursor-col-resize relative group flex-shrink-0 ${state.isArtifactResizing ? 'bg-blue-500' : ''}`}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-16 bg-gray-300 group-hover:bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-0.5 h-12 bg-white/50 rounded-full"></div>
                </div>
              </div>
            )}

            {/* Right Panel - Artifacts */}
            {state.showArtifacts && (
              <div
                className="bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden"
                style={{ width: `${state.artifactsPanelWidth}%` }}
              >
                {renderArtifact()}
              </div>
            )}
          </div>

          {/* Metrics Slide-Up Overlay */}
          {state.showMetricsSlideup && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fade-in"
                onClick={() => state.toggleMetricsSlideup(false)}
              />
              <div
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 animate-slide-up"
                style={{ height: '30vh' }}
              >
                <CustomerMetrics
                  customerId={customerId}
                  isOpen={true}
                  onToggle={() => state.toggleMetricsSlideup(false)}
                />
              </div>
            </>
          )}

          {/* Step-level Snooze Modal */}
          {showStepSnoozeModal !== null && executionId && userId && (
            <StepSnoozeModal
              executionId={executionId}
              userId={userId}
              stepIndex={showStepSnoozeModal}
              stepId={state.slides[showStepSnoozeModal]?.id || `step-${showStepSnoozeModal}`}
              stepLabel={state.slides[showStepSnoozeModal]?.label || `Step ${showStepSnoozeModal + 1}`}
              onClose={() => setShowStepSnoozeModal(null)}
              onSuccess={async () => {
                console.log('[TaskModeFullscreen] Step snoozed successfully, reloading states...');
                setShowStepSnoozeModal(null);
                await reloadStepStates();
              }}
            />
          )}

          {/* Step-level Skip Modal */}
          {showStepSkipModal !== null && executionId && userId && (
            <StepSkipModal
              executionId={executionId}
              userId={userId}
              stepIndex={showStepSkipModal}
              stepId={state.slides[showStepSkipModal]?.id || `step-${showStepSkipModal}`}
              stepLabel={state.slides[showStepSkipModal]?.label || `Step ${showStepSkipModal + 1}`}
              onClose={() => setShowStepSkipModal(null)}
              onSuccess={async () => {
                console.log('[TaskModeFullscreen] Step skipped successfully, reloading states...');
                setShowStepSkipModal(null);
                await reloadStepStates();
              }}
            />
          )}

          {/* Step-level Review Modal */}
          {showStepReviewModal !== null && executionId && userId && (
            <StepReviewModal
              executionId={executionId}
              userId={userId}
              stepIndex={showStepReviewModal}
              stepId={state.slides[showStepReviewModal]?.id || `step-${showStepReviewModal}`}
              stepLabel={state.slides[showStepReviewModal]?.label || `Step ${showStepReviewModal + 1}`}
              onClose={() => setShowStepReviewModal(null)}
              onSuccess={async () => {
                console.log('[TaskModeFullscreen] Step review requested successfully, reloading states...');
                setShowStepReviewModal(null);
                await reloadStepStates();
                await reloadStepExecutions();
              }}
            />
          )}

          {/* Workflow-level Snooze Modal with Triggers */}
          {(() => {
            console.log('[TaskModeFullscreen] Rendering snooze modal area - executionId:', executionId, 'isOpen:', state.isSnoozeModalOpen);
            return executionId ? (
              <EnhancedSnoozeModal
                workflowId={executionId}
                isOpen={state.isSnoozeModalOpen}
                onClose={state.closeSnoozeModal}
                onSnooze={handleWorkflowSnooze}
              />
            ) : null;
          })()}

          {/* Workflow-level Review Modal with Triggers */}
          {executionId && (
            <EnhancedReviewModal
              workflowId={executionId}
              isOpen={state.isEscalateModalOpen}
              onClose={state.closeEscalateModal}
              onReview={(triggers, reviewerId, logic, reason) => handleWorkflowReview(reviewerId, triggers, logic, reason)}
            />
          )}

          {/* Review Approval Modal (Enhanced with Rejection - Phase 1.4) */}
          <ReviewApprovalModal
            isOpen={showReviewApprovalModal}
            onClose={() => setShowReviewApprovalModal(false)}
            onApprove={handleApproveWorkflowReview}
            onRequestChanges={handleRequestWorkflowChanges}
            onReject={handleRejectWorkflowReview}
            workflowTitle={workflowTitle}
            requestedBy={workflowReviewerData?.requestedBy}
            reason={workflowReviewerData?.reason}
            reviewIteration={workflowReviewerData?.reviewIteration}
            rejectionHistory={workflowReviewerData?.rejectionHistory}
          />

          {/* Resubmit Confirmation Modal (Phase 1.4) */}
          {workflowRejectionData && (
            <ResubmitConfirmationModal
              isOpen={showResubmitModal}
              onClose={() => setShowResubmitModal(false)}
              onConfirm={handleResubmitWorkflow}
              reviewerName={workflowRejectionData.reviewerName}
              iteration={workflowRejectionData.iteration + 1}
            />
          )}

          {/* Rejection History Modal (Phase 1.4) */}
          {showRejectionHistoryModal && rejectionHistory.length > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowRejectionHistoryModal(false)}
                  className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <RejectionHistoryTimeline history={rejectionHistory} />
              </div>
            </div>
          )}
        </div>
      </div>
    </TaskModeContext.Provider>
  );
}
