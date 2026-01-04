'use client';

/**
 * TaskModeEncapsulated - Hybrid Component with Per-Slide Chat + Artifact Layout
 *
 * This component merges the best of:
 * - TaskModeFullscreen (V1): Resume detection, prefetched greeting
 * - TaskModeFullscreenV2: Modular architecture, child components
 * - TaskModeAdvanced: Side-by-side encapsulated chat + artifact per slide
 *
 * Key Features:
 * - TRUE side-by-side layout: Chat (50%) | Artifact (50%)
 * - Per-slide chat: Each slide has its own chat (not continuous)
 * - Artifacts always visible: No toggle, artifact panel always shown
 * - Resume detection: Checks for in-progress executions on mount
 * - All V2 features: Review/rejection, step states, modals, etc.
 *
 * Layout Modes:
 * - 'encapsulated' (default): 50/50 split, per-slide chat, artifacts always visible
 * - 'continuous': Original layout with toggleable artifacts and continuous chat
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import TaskModeContext, { TaskModeContextValue } from './TaskModeContext';
import { useTaskModeStateV2 } from './hooks/useTaskModeStateV2';
import TaskModeHeader from './components/TaskModeHeader';
import TaskModeProgressBar from './components/TaskModeProgressBar';
import TaskModeChatPanel from './components/TaskModeChatPanel';
import TaskModeArtifactPanel from './components/TaskModeArtifactPanel';
import TaskModeOverlays from './components/TaskModeOverlays';
import TaskModeModals from './components/TaskModeModals';
import { WorkflowStepActionService } from '@/lib/workflows/actions/WorkflowStepActionService';
import { WorkflowPersistenceService } from '@/lib/persistence/WorkflowPersistenceService';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import { snoozeWithTriggers, requestReviewWithTriggers } from '@/lib/api/workflow-triggers';
import { approveWorkflowReview, requestWorkflowChanges, rejectWorkflowReview, resubmitWorkflowForReview } from '@/lib/api/workflow-triggers';
import type { WakeTrigger, TriggerLogic } from '@/types/wake-triggers';
import type { ReviewTrigger, ReviewRejectionHistory } from '@/types/review-triggers';
import { useToast } from '@/components/ui/ToastProvider';
import Customer360SidePanel from '@/components/workflows/Customer360SidePanel';

// ============================================================
// TYPES
// ============================================================

type LayoutMode = 'encapsulated' | 'continuous';

interface TaskModeEncapsulatedProps {
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
  prefetchedGreeting?: string;
  layoutMode?: LayoutMode;
}

// ============================================================
// COMPONENT
// ============================================================

export default function TaskModeEncapsulated(props: TaskModeEncapsulatedProps) {
  const {
    workflowId,
    workflowTitle,
    customerId,
    customerName,
    executionId: propExecutionId,
    userId,
    workflowStatus,
    onClose,
    onWorkflowAction,
    sequenceInfo,
    // prefetchedGreeting - reserved for future use
    layoutMode = 'encapsulated',
  } = props;

  const { showToast } = useToast();

  // ============================================================
  // RESUME DETECTION WITH DIALOG
  // ============================================================

  const [effectiveExecutionId, setEffectiveExecutionId] = useState<string | undefined>(propExecutionId);
  const [isCheckingResume, setIsCheckingResume] = useState(!propExecutionId);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumableData, setResumableData] = useState<{
    executionId: string;
    slideIndex: number;
    savedAt: string;
  } | null>(null);
  const hasCheckedResumeRef = useRef(false);

  // Create a new workflow execution (defined before useEffect that uses it)
  const createNewExecution = useCallback(async () => {
    if (!userId) {
      console.error('[TaskModeEncapsulated] Cannot create execution - missing userId');
      setIsCheckingResume(false);
      return;
    }

    try {
      console.log('[TaskModeEncapsulated] Creating new workflow execution...');
      const result = await createWorkflowExecution({
        workflowConfigId: workflowId,
        workflowName: workflowTitle || 'Workflow',
        workflowType: 'renewal',
        customerId,
        userId,
        assignedCsmId: userId,
        totalSteps: 0,
      });

      if (result.success && result.executionId) {
        console.log('[TaskModeEncapsulated] Created new execution:', result.executionId);
        setEffectiveExecutionId(result.executionId);
      } else {
        console.error('[TaskModeEncapsulated] Failed to create execution:', result.error);
      }
    } catch (error) {
      console.error('[TaskModeEncapsulated] Error creating execution:', error);
    }

    setIsCheckingResume(false);
  }, [workflowId, workflowTitle, customerId, userId]);

  // Check for resumable execution on mount
  useEffect(() => {
    if (propExecutionId || hasCheckedResumeRef.current) {
      setIsCheckingResume(false);
      return;
    }

    hasCheckedResumeRef.current = true;

    const checkForResumable = async () => {
      if (!userId) {
        console.log('[TaskModeEncapsulated] No userId, skipping resume check');
        setIsCheckingResume(false);
        return;
      }

      try {
        // Use static method to check for resumable execution
        const resumable = await WorkflowPersistenceService.checkForResumable(
          workflowId,
          customerId,
          userId
        );

        if (resumable) {
          console.log('[TaskModeEncapsulated] Found resumable execution:', resumable.executionId);
          // Show dialog instead of auto-resuming
          setResumableData({
            executionId: resumable.executionId,
            slideIndex: resumable.snapshot.currentSlideIndex,
            savedAt: resumable.snapshot.savedAt,
          });
          setShowResumeDialog(true);
          setIsCheckingResume(false);
        } else {
          // No resumable - create new execution
          await createNewExecution();
        }
      } catch (error) {
        console.error('[TaskModeEncapsulated] Resume check failed:', error);
        await createNewExecution();
      }
    };

    checkForResumable();
  }, [workflowId, customerId, userId, propExecutionId, createNewExecution]);

  // Handle resume choice
  const handleResumeWorkflow = () => {
    if (resumableData) {
      setEffectiveExecutionId(resumableData.executionId);
      showToast({
        message: 'Resuming your progress...',
        type: 'info',
        icon: 'check',
        duration: 2000,
      });
    }
    setShowResumeDialog(false);
    setResumableData(null);
  };

  // Handle start fresh choice
  const handleStartFresh = async () => {
    setShowResumeDialog(false);
    setResumableData(null);
    setIsCheckingResume(true);
    await createNewExecution();
  };

  // ============================================================
  // STATE FROM V2 HOOKS
  // ============================================================

  const state = useTaskModeStateV2({
    workflowId,
    customerId,
    customerName,
    onClose,
    sequenceInfo,
  });

  // ============================================================
  // LAYOUT STATE
  // ============================================================

  const isEncapsulated = layoutMode === 'encapsulated';

  // In encapsulated mode, artifacts are always visible at 50%
  // In continuous mode, use the existing toggle behavior
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(isEncapsulated ? 50 : 45);
  const [isArtifactResizing, setIsArtifactResizing] = useState(false);
  const showArtifacts = isEncapsulated ? true : state.showArtifacts;

  // Customer 360 panel
  const [showCustomer360, setShowCustomer360] = useState(false);

  // ============================================================
  // STEP & WORKFLOW STATE (from database)
  // ============================================================

  const [stepStates, setStepStates] = useState<Record<number, any>>({});
  const [stepExecutions, setStepExecutions] = useState<Record<number, any>>({});
  const [workflowReviewStatus, setWorkflowReviewStatus] = useState<string | null>(null);
  const [reviewBlockerMessage, setReviewBlockerMessage] = useState<string | null>(null);
  const [workflowReviewerData, setWorkflowReviewerData] = useState<any>(null);
  const [workflowRejectionData, setWorkflowRejectionData] = useState<any>(null);
  const [rejectionHistory, setRejectionHistory] = useState<ReviewRejectionHistory>([]);

  // Modal states
  const [showStepSnoozeModal, setShowStepSnoozeModal] = useState<number | null>(null);
  const [showStepSkipModal, setShowStepSkipModal] = useState<number | null>(null);
  const [showStepReviewModal, setShowStepReviewModal] = useState<number | null>(null);
  const [showReviewApprovalModal, setShowReviewApprovalModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showRejectionHistoryModal, setShowRejectionHistoryModal] = useState(false);

  // ============================================================
  // DATABASE LOADERS
  // ============================================================

  const reloadStepStates = useCallback(async () => {
    if (effectiveExecutionId) {
      const service = new WorkflowStepActionService();
      const result = await service.getStepStates(effectiveExecutionId);
      if (result.success && result.states) {
        const stateMap: Record<number, any> = {};
        result.states.forEach((s: any) => {
          stateMap[s.step_index] = s;
        });
        setStepStates(stateMap);
      }
    }
  }, [effectiveExecutionId]);

  const reloadStepExecutions = useCallback(async () => {
    if (effectiveExecutionId) {
      const service = new WorkflowStepActionService();
      const supabase = (service as any).supabase;
      const { data, error } = await supabase
        .from('workflow_step_executions')
        .select('step_index, review_status, review_required_from, profiles!workflow_step_executions_review_required_from_fkey(full_name)')
        .eq('workflow_execution_id', effectiveExecutionId);

      if (!error && data) {
        const executionMap: Record<number, any> = {};
        data.forEach((execution: any) => {
          executionMap[execution.step_index] = execution;
        });
        setStepExecutions(executionMap);
      }
    }
  }, [effectiveExecutionId]);

  const reloadWorkflowReviewStatus = useCallback(async () => {
    if (effectiveExecutionId && userId) {
      const service = new WorkflowStepActionService();
      const supabase = (service as any).supabase;
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('review_status, reviewer_id, review_requested_at, review_reason, assigned_csm_id, review_iteration, review_rejection_history, profiles!workflow_executions_reviewer_id_fkey(full_name), requester:profiles!workflow_executions_assigned_csm_id_fkey(full_name)')
        .eq('id', effectiveExecutionId)
        .single();

      if (!error && data) {
        setWorkflowReviewStatus(data.review_status);
        setRejectionHistory(data.review_rejection_history || []);

        const isCurrentUserReviewer = data.reviewer_id === userId;
        const isCurrentUserOwner = data.assigned_csm_id === userId;

        if (data.review_status === 'rejected' && isCurrentUserOwner) {
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
            setWorkflowReviewerData({
              requestedBy: data.requester?.full_name || 'Unknown',
              reason: data.review_reason,
              reviewerId: data.reviewer_id,
              reviewIteration: data.review_iteration || 1,
              rejectionHistory: data.review_rejection_history,
            });
            setReviewBlockerMessage(null);
            setWorkflowRejectionData(null);
          } else {
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
  }, [effectiveExecutionId, userId]);

  useEffect(() => {
    if (effectiveExecutionId) {
      reloadStepStates();
      reloadStepExecutions();
      reloadWorkflowReviewStatus();
    }
  }, [effectiveExecutionId, reloadStepStates, reloadStepExecutions, reloadWorkflowReviewStatus]);

  // Sync snoozed/skipped slides with database
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

    state.setSnoozedSlides(snoozedIndices);
    state.setSkippedSlides(skippedIndices);
  }, [stepStates, state.setSnoozedSlides, state.setSkippedSlides]);

  // ============================================================
  // WORKFLOW ACTION HANDLERS
  // ============================================================

  const handleWorkflowSnooze = async (triggers: WakeTrigger[], logic?: TriggerLogic) => {
    if (!effectiveExecutionId || !userId) return;

    try {
      const result = await snoozeWithTriggers(effectiveExecutionId, userId, triggers, logic);
      if (result.success) {
        state.closeSnoozeModal();
        const dateTrigger = triggers.find(t => t.type === 'date');
        const wakeDate = dateTrigger
          ? new Date((dateTrigger.config as any).date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : 'when conditions are met';

        showToast({
          message: `Workflow snoozed! I'll remind you on ${wakeDate}.`,
          type: 'success',
          icon: 'check',
          duration: 4000
        });

        setTimeout(() => onClose(), 1000);
      } else {
        showToast({ message: `Failed to snooze: ${result.error}`, type: 'error', duration: 5000 });
      }
    } catch (error) {
      console.error('[TaskModeEncapsulated] Error snoozing:', error);
      showToast({ message: 'Failed to snooze workflow', type: 'error', duration: 5000 });
    }
  };

  const handleWorkflowReview = async (triggers: ReviewTrigger[], reviewerId: string, logic?: TriggerLogic, reason?: string) => {
    if (!effectiveExecutionId) return;

    try {
      const result = await requestReviewWithTriggers(effectiveExecutionId, reviewerId, triggers, reason, logic);
      if (result.success) {
        state.closeEscalateModal();
        showToast({
          message: 'Review requested! Workflow will be blocked until approved.',
          type: 'success',
          icon: 'check',
          duration: 5000
        });
        await reloadWorkflowReviewStatus();
        setTimeout(() => onClose(), 1000);
      } else {
        showToast({ message: `Failed to request review: ${result.error}`, type: 'error', duration: 5000 });
      }
    } catch (error) {
      console.error('[TaskModeEncapsulated] Error requesting review:', error);
      showToast({ message: 'Failed to request review', type: 'error', duration: 5000 });
    }
  };

  const handleApproveWorkflowReview = async (comments?: string) => {
    if (!effectiveExecutionId) return;

    try {
      const result = await approveWorkflowReview(effectiveExecutionId, comments);
      if (result.success) {
        showToast({ message: 'Review approved!', type: 'success', icon: 'check', duration: 4000 });
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to approve review');
      }
    } catch (error: any) {
      showToast({ message: `Failed to approve: ${error.message}`, type: 'error', duration: 5000 });
      throw error;
    }
  };

  const handleRequestWorkflowChanges = async (comments: string) => {
    if (!effectiveExecutionId) return;

    try {
      const result = await requestWorkflowChanges(effectiveExecutionId, comments);
      if (result.success) {
        showToast({ message: 'Changes requested.', type: 'info', duration: 4000 });
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to request changes');
      }
    } catch (error: any) {
      showToast({ message: `Failed to request changes: ${error.message}`, type: 'error', duration: 5000 });
      throw error;
    }
  };

  const handleRejectWorkflowReview = async (reason: string | undefined, comments: string) => {
    if (!effectiveExecutionId) return;

    try {
      const result = await rejectWorkflowReview(effectiveExecutionId, reason, comments);
      if (result.success) {
        showToast({ message: 'Workflow rejected.', type: 'info', duration: 4000 });
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to reject review');
      }
    } catch (error: any) {
      showToast({ message: `Failed to reject: ${error.message}`, type: 'error', duration: 5000 });
      throw error;
    }
  };

  const handleResubmitWorkflow = async (notes?: string) => {
    if (!effectiveExecutionId) return;

    try {
      const result = await resubmitWorkflowForReview(effectiveExecutionId, notes);
      if (result.success) {
        showToast({ message: 'Workflow re-submitted!', type: 'success', icon: 'check', duration: 4000 });
        await reloadWorkflowReviewStatus();
        setShowResubmitModal(false);
      } else {
        throw new Error(result.error || 'Failed to resubmit');
      }
    } catch (error: any) {
      showToast({ message: `Failed to resubmit: ${error.message}`, type: 'error', duration: 5000 });
      throw error;
    }
  };

  const handleCompleteWithReviewCheck = () => {
    if (workflowReviewStatus === 'pending') {
      showToast({
        message: reviewBlockerMessage || 'Cannot complete: pending review',
        type: 'error',
        icon: 'alert',
        duration: 5000
      });
      return;
    }
    if (workflowReviewStatus === 'rejected') {
      showToast({
        message: 'Cannot complete: rejected. Please address feedback.',
        type: 'error',
        icon: 'alert',
        duration: 5000
      });
      return;
    }
    state.handleComplete();
  };

  // ============================================================
  // RESIZE HANDLER
  // ============================================================

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isEncapsulated) return; // Disable resize in encapsulated mode
    e.preventDefault();
    setIsArtifactResizing(true);
  };

  useEffect(() => {
    if (!isArtifactResizing || isEncapsulated) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
      const constrainedWidth = Math.min(Math.max(newWidth, 35), 60);
      setArtifactsPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsArtifactResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isArtifactResizing, isEncapsulated]);

  // ============================================================
  // DYNAMIC BUTTON LABELS
  // ============================================================

  const getNextButtonLabel = (originalLabel: string, buttonValue: string) => {
    const isNextButton = ['start', 'continue', 'next', 'proceed'].some(
      val => buttonValue.toLowerCase().includes(val) || originalLabel.toLowerCase().includes(val)
    );

    if (!isNextButton) return originalLabel;

    const nextAvailable = state.getNextAvailableSlide();
    if (nextAvailable?.slide?.previousButton) {
      return nextAvailable.slide.previousButton;
    }

    return originalLabel;
  };

  const getPreviousButtonLabel = (originalLabel: string, buttonValue: string) => {
    const isBackButton = ['back', 'previous'].some(
      val => buttonValue.toLowerCase().includes(val) || originalLabel.toLowerCase().includes(val)
    );

    if (!isBackButton) return originalLabel;

    const prevAvailable = state.getPreviousAvailableSlide();
    if (prevAvailable?.slide) {
      return prevAvailable.slide.label || originalLabel;
    }

    return originalLabel;
  };

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const contextValue: TaskModeContextValue = {
    currentSlide: state.currentSlide,
    slides: state.slides,
    currentSlideIndex: state.currentSlideIndex,
    workflowState: state.workflowState,
    chatMessages: state.chatMessages,
    showArtifacts,
    currentBranch: state.currentBranch,
    chatInputValue: state.chatInputValue,
    customerName,
    customer: state.customer,
    expansionData: state.expansionData,
    stakeholders: state.stakeholders ?? null,
    showMetricsSlideup: state.showMetricsSlideup,
    showPlaysDropdown: state.showPlaysDropdown,
    stepActionMenu: state.stepActionMenu,
    artifactsPanelWidth,
    isArtifactResizing,
    contextLoading: state.contextLoading,
    contextError: state.contextError,
    goToNextSlide: state.goToNextSlide,
    goToPreviousSlide: state.goToPreviousSlide,
    goToSlide: state.goToSlide,
    sendMessage: state.handleSendMessage,
    handleButtonClick: state.handleButtonClick,
    handleBranchNavigation: state.handleBranchNavigation,
    setChatInputValue: state.setChatInputValue,
    handleComponentValueChange: state.handleComponentValueChange,
    toggleArtifacts: isEncapsulated ? () => {} : state.toggleArtifacts,
    updateWorkflowState: state.updateWorkflowState,
    setArtifactsPanelWidth,
    setIsArtifactResizing,
    toggleMetricsSlideup: state.toggleMetricsSlideup,
    togglePlaysDropdown: state.togglePlaysDropdown,
    setStepActionMenu: state.setStepActionMenu,
    handleComplete: handleCompleteWithReviewCheck,
    handleSnooze: state.handleSnooze,
    handleSkip: state.handleSkip,
    handleClose: state.handleClose,
    skipStep: state.skipStep,
    snoozeStep: state.snoozeStep,
  };

  // ============================================================
  // LOADING STATES
  // ============================================================

  if (isCheckingResume) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center text-gray-700">
          <div className="inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Checking for in-progress workflow...</p>
        </div>
      </div>
    );
  }

  // Resume Dialog - shown when a resumable execution is found
  if (showResumeDialog && resumableData) {
    const savedDate = new Date(resumableData.savedAt);
    const formattedDate = savedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 backdrop-blur-sm flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Resume Previous Session?</h2>
            <p className="text-gray-600">
              You have an in-progress session from <span className="font-medium">{formattedDate}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Step {resumableData.slideIndex + 1} of this workflow
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleResumeWorkflow}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resume Where I Left Off
            </button>
            <button
              onClick={handleStartFresh}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  if (state.configError || !state.config) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 backdrop-blur-sm flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-700 mb-6">{state.configError || 'Unknown error loading workflow'}</p>
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

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <TaskModeContext.Provider value={contextValue}>
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 backdrop-blur-sm flex items-center justify-center p-8">
        <div className="relative w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Overlays */}
          <TaskModeOverlays
            showMetricsSlideup={state.showMetricsSlideup}
            customerId={customerId}
            onToggleMetrics={state.toggleMetricsSlideup}
            showPlaysDropdown={state.showPlaysDropdown}
            sequenceInfo={sequenceInfo}
            onTogglePlays={state.togglePlaysDropdown}
          />

          {/* Header */}
          <TaskModeHeader
            workflowTitle={workflowTitle || (state.config as any)?.workflowName || 'Workflow'}
            customerName={customerName}
            currentSlideIndex={state.currentSlideIndex}
            showArtifacts={showArtifacts}
            executionId={effectiveExecutionId}
            userId={userId}
            workflowStatus={workflowStatus}
            sequenceInfo={sequenceInfo}
            onEscalate={state.handleEscalate}
            onTogglePlays={() => state.togglePlaysDropdown(!state.showPlaysDropdown)}
            onToggleMetrics={() => state.toggleMetricsSlideup(true)}
            onToggleArtifacts={isEncapsulated ? () => {} : () => state.toggleArtifacts(!state.showArtifacts)}
            onToggleCustomer360={() => setShowCustomer360(!showCustomer360)}
            onClose={state.handleClose}
            onWorkflowAction={onWorkflowAction}
          />

          {/* Progress Bar */}
          <TaskModeProgressBar
            slides={state.slides}
            currentSlideIndex={state.currentSlideIndex}
            completedSlides={state.completedSlides}
            stepActionMenu={state.stepActionMenu}
            stepStates={stepStates}
            onStepClick={state.goToSlide}
            onToggleStepActionMenu={state.setStepActionMenu}
            onSnoozeStep={(index) => {
              setShowStepSnoozeModal(index);
              state.setStepActionMenu(null);
            }}
            onSkipStep={(index) => {
              setShowStepSkipModal(index);
              state.setStepActionMenu(null);
            }}
            onReviewStep={(index) => {
              setShowStepReviewModal(index);
              state.setStepActionMenu(null);
            }}
          />

          {/* Main Content Area - ENCAPSULATED LAYOUT */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Chat */}
            <div
              className="flex flex-col bg-white overflow-hidden"
              style={{ width: isEncapsulated ? '50%' : (showArtifacts ? `${100 - artifactsPanelWidth}%` : '100%') }}
            >
              <TaskModeChatPanel
                chatMessages={state.chatMessages}
                currentSlide={state.currentSlide}
                workflowState={state.workflowState}
                customerName={customerName}
                chatInputValue={state.chatInputValue}
                chatInputRef={state.chatInputRef}
                config={state.config}
                workflowReviewStatus={workflowReviewStatus}
                reviewBlockerMessage={reviewBlockerMessage}
                workflowReviewerData={workflowReviewerData}
                workflowRejectionData={workflowRejectionData}
                currentSlideIndex={state.currentSlideIndex}
                stepStates={stepStates}
                stepExecutions={stepExecutions}
                contextLoading={state.contextLoading}
                contextError={state.contextError}
                onSendMessage={state.handleSendMessage}
                onBranchNavigation={state.handleBranchNavigation}
                onComponentValueChange={state.handleComponentValueChange}
                onButtonClick={(buttonValue: string) => {
                  if (state.currentBranch && state.currentSlide?.chat?.branches) {
                    const branch = state.currentSlide.chat.branches[state.currentBranch];
                    if (branch && 'nextBranches' in branch && branch.nextBranches && branch.nextBranches[buttonValue]) {
                      state.handleBranchNavigation(branch.nextBranches[buttonValue]);
                      return;
                    }
                  }

                  const initialMessage = state.currentSlide?.chat?.initialMessage;
                  if (initialMessage?.nextBranches && initialMessage.nextBranches[buttonValue]) {
                    state.handleBranchNavigation(initialMessage.nextBranches[buttonValue]);
                  } else {
                    state.handleButtonClick(buttonValue);
                  }
                }}
                setChatInputValue={state.setChatInputValue}
                onShowReviewApprovalModal={() => setShowReviewApprovalModal(true)}
                onShowResubmitModal={() => setShowResubmitModal(true)}
                onShowRejectionHistoryModal={() => setShowRejectionHistoryModal(true)}
                getNextButtonLabel={getNextButtonLabel}
                getPreviousButtonLabel={getPreviousButtonLabel}
              />
            </div>

            {/* Resizable Divider - only in continuous mode */}
            {showArtifacts && !isEncapsulated && (
              <div
                onMouseDown={handleResizeStart}
                className={`w-3 bg-gray-200 hover:bg-blue-400 cursor-col-resize relative group flex-shrink-0 ${isArtifactResizing ? 'bg-blue-500' : ''}`}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-16 bg-gray-300 group-hover:bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-0.5 h-12 bg-white/50 rounded-full"></div>
                </div>
              </div>
            )}

            {/* Fixed Divider - in encapsulated mode */}
            {isEncapsulated && (
              <div className="w-px bg-gray-300 flex-shrink-0" />
            )}

            {/* Right Panel - Artifacts */}
            {showArtifacts && (
              <div
                className="bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden"
                style={{ width: isEncapsulated ? '50%' : `${artifactsPanelWidth}%` }}
              >
                <TaskModeArtifactPanel
                  currentSlide={state.currentSlide}
                  workflowState={state.workflowState}
                  customerName={customerName}
                  customer={state.customer}
                  expansionData={state.expansionData}
                  stakeholders={state.stakeholders}
                  sequenceInfo={sequenceInfo}
                  onNext={state.goToNextSlide}
                  onBack={state.goToPreviousSlide}
                  onClose={onClose}
                  onComplete={state.handleComplete}
                  onUpdateState={state.updateWorkflowState}
                />
              </div>
            )}
          </div>

          {/* Customer 360 Side Panel */}
          {showCustomer360 && (
            <Customer360SidePanel
              isOpen={showCustomer360}
              onToggle={() => setShowCustomer360(!showCustomer360)}
              workflowType="date"
              customerId={customerId}
              customerName={customerName}
            />
          )}

          {/* All Modals */}
          <TaskModeModals
            showStepSnoozeModal={showStepSnoozeModal}
            showStepSkipModal={showStepSkipModal}
            showStepReviewModal={showStepReviewModal}
            onCloseStepSnooze={() => setShowStepSnoozeModal(null)}
            onCloseStepSkip={() => setShowStepSkipModal(null)}
            onCloseStepReview={() => setShowStepReviewModal(null)}
            onStepSnoozeSuccess={async () => {
              setShowStepSnoozeModal(null);
              await reloadStepStates();
            }}
            onStepSkipSuccess={async () => {
              setShowStepSkipModal(null);
              await reloadStepStates();
            }}
            onStepReviewSuccess={async () => {
              setShowStepReviewModal(null);
              await reloadStepStates();
              await reloadStepExecutions();
            }}
            isSnoozeModalOpen={state.isSnoozeModalOpen}
            isEscalateModalOpen={state.isEscalateModalOpen}
            onCloseSnoozeModal={state.closeSnoozeModal}
            onCloseEscalateModal={state.closeEscalateModal}
            onWorkflowSnooze={handleWorkflowSnooze}
            onWorkflowReview={handleWorkflowReview}
            showReviewApprovalModal={showReviewApprovalModal}
            onCloseReviewApprovalModal={() => setShowReviewApprovalModal(false)}
            onApproveWorkflowReview={handleApproveWorkflowReview}
            onRequestWorkflowChanges={handleRequestWorkflowChanges}
            onRejectWorkflowReview={handleRejectWorkflowReview}
            showResubmitModal={showResubmitModal}
            showRejectionHistoryModal={showRejectionHistoryModal}
            onCloseResubmitModal={() => setShowResubmitModal(false)}
            onCloseRejectionHistoryModal={() => setShowRejectionHistoryModal(false)}
            onResubmitWorkflow={handleResubmitWorkflow}
            executionId={effectiveExecutionId}
            userId={userId}
            slides={state.slides}
            workflowTitle={workflowTitle}
            workflowReviewerData={workflowReviewerData}
            workflowRejectionData={workflowRejectionData}
            rejectionHistory={rejectionHistory}
          />
        </div>
      </div>
    </TaskModeContext.Provider>
  );
}
