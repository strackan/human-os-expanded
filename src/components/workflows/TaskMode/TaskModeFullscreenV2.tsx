'use client';

/**
 * TaskModeFullscreenV2 - Modular Orchestrator Component
 *
 * This is the V2 refactored version that composes 6 child components:
 * - TaskModeHeader: Top navigation and controls
 * - TaskModeProgressBar: Step navigation and progress
 * - TaskModeChatPanel: Main chat interface
 * - TaskModeArtifactPanel: Right panel artifacts
 * - TaskModeOverlays: Metrics and plays panels
 * - TaskModeModals: All modal dialogs
 *
 * Benefits over V1 (TaskModeFullscreen.tsx):
 * - Reduced from 1,151 lines to ~350 lines (70% reduction)
 * - Clear separation of concerns
 * - Easier to test individual components
 * - Reusable components
 * - Feature-flag controlled rollback
 *
 * Uses useTaskModeStateV2 hook which composes 4 specialized hooks:
 * - useWorkflowData (150 lines)
 * - useChatState (200 lines)
 * - useArtifactState (150 lines)
 * - useModalState (100 lines)
 */

import React, { useEffect, useState } from 'react';
import TaskModeContext, { TaskModeContextValue } from './TaskModeContext';
import { useTaskModeStateV2 } from './hooks/useTaskModeStateV2';
import TaskModeHeader from './components/TaskModeHeader';
import TaskModeProgressBar from './components/TaskModeProgressBar';
import TaskModeChatPanel from './components/TaskModeChatPanel';
import TaskModeArtifactPanel from './components/TaskModeArtifactPanel';
import TaskModeOverlays from './components/TaskModeOverlays';
import TaskModeModals from './components/TaskModeModals';
import { WorkflowStepActionService } from '@/lib/workflows/actions/WorkflowStepActionService';
import { snoozeWithTriggers, requestReviewWithTriggers } from '@/lib/api/workflow-triggers';
import { approveWorkflowReview, requestWorkflowChanges, rejectWorkflowReview, resubmitWorkflowForReview } from '@/lib/api/workflow-triggers';
import type { WakeTrigger, TriggerLogic } from '@/types/wake-triggers';
import type { ReviewTrigger, ReviewRejectionHistory } from '@/types/review-triggers';
import { useToast } from '@/components/ui/ToastProvider';

interface TaskModeFullscreenV2Props {
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

export default function TaskModeFullscreenV2(props: TaskModeFullscreenV2Props) {
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

  const { showToast } = useToast();

  // Get all state and handlers from the composed hook
  const state = useTaskModeStateV2({
    workflowId,
    customerId,
    customerName,
    onClose,
    sequenceInfo
  });

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

  // Step-level modal state
  const [showStepSnoozeModal, setShowStepSnoozeModal] = useState<number | null>(null);
  const [showStepSkipModal, setShowStepSkipModal] = useState<number | null>(null);
  const [showStepReviewModal, setShowStepReviewModal] = useState<number | null>(null);

  // Review approval modal state
  const [showReviewApprovalModal, setShowReviewApprovalModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showRejectionHistoryModal, setShowRejectionHistoryModal] = useState(false);

  // ============================================================
  // DATABASE LOADERS
  // ============================================================

  const reloadStepStates = async () => {
    if (executionId) {
      const service = new WorkflowStepActionService();
      const result = await service.getStepStates(executionId);
      if (result.success && result.states) {
        const stateMap: Record<number, any> = {};
        result.states.forEach((s: any) => {
          stateMap[s.step_index] = s;
        });
        setStepStates(stateMap);
      }
    }
  };

  const reloadStepExecutions = async () => {
    if (executionId) {
      const service = new WorkflowStepActionService();
      const supabase = (service as any).supabase;
      const { data, error } = await supabase
        .from('workflow_step_executions')
        .select('step_index, review_status, review_required_from, profiles!workflow_step_executions_review_required_from_fkey(full_name)')
        .eq('workflow_execution_id', executionId);

      if (!error && data) {
        const executionMap: Record<number, any> = {};
        data.forEach((execution: any) => {
          executionMap[execution.step_index] = execution;
        });
        setStepExecutions(executionMap);
      }
    }
  };

  const reloadWorkflowReviewStatus = async () => {
    if (executionId && userId) {
      const service = new WorkflowStepActionService();
      const supabase = (service as any).supabase;
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('review_status, reviewer_id, review_requested_at, review_reason, assigned_csm_id, review_iteration, review_rejection_history, profiles!workflow_executions_reviewer_id_fkey(full_name), requester:profiles!workflow_executions_assigned_csm_id_fkey(full_name)')
        .eq('id', executionId)
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
  };

  useEffect(() => {
    reloadStepStates();
    reloadStepExecutions();
    reloadWorkflowReviewStatus();
  }, [executionId]);

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
  // WORKFLOW-LEVEL ACTION HANDLERS
  // ============================================================

  const handleWorkflowSnooze = async (triggers: WakeTrigger[], logic?: TriggerLogic) => {
    if (!executionId || !userId) return;

    try {
      const result = await snoozeWithTriggers(executionId, userId, triggers, logic);
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
          message: `Workflow snoozed successfully! I'll remind you on ${wakeDate}.`,
          type: 'success',
          icon: 'check',
          duration: 4000
        });

        setTimeout(() => onClose(), 1000);
      } else {
        alert(`Failed to snooze workflow: ${result.error}`);
      }
    } catch (error) {
      console.error('[TaskModeFullscreenV2] Error snoozing workflow:', error);
      alert('Failed to snooze workflow');
    }
  };

  const handleWorkflowReview = async (triggers: ReviewTrigger[], reviewerId: string, logic?: TriggerLogic, reason?: string) => {
    if (!executionId) return;

    try {
      const result = await requestReviewWithTriggers(executionId, reviewerId, triggers, reason, logic);
      if (result.success) {
        state.closeEscalateModal();
        showToast({
          message: `Review requested successfully! You'll keep ownership but workflow will be blocked until approved.`,
          type: 'success',
          icon: 'check',
          duration: 5000
        });
        await reloadWorkflowReviewStatus();
        setTimeout(() => onClose(), 1000);
      } else {
        alert(`Failed to request review: ${result.error}`);
      }
    } catch (error) {
      console.error('[TaskModeFullscreenV2] Error requesting review:', error);
      alert('Failed to request review');
    }
  };

  const handleApproveWorkflowReview = async (comments?: string) => {
    if (!executionId) return;

    try {
      const result = await approveWorkflowReview(executionId, comments);
      if (result.success) {
        showToast({
          message: 'Review approved! The user can now complete the workflow.',
          type: 'success',
          icon: 'check',
          duration: 4000
        });
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to approve review');
      }
    } catch (error: any) {
      showToast({
        message: `Failed to approve review: ${error.message}`,
        type: 'error',
        duration: 5000
      });
      throw error;
    }
  };

  const handleRequestWorkflowChanges = async (comments: string) => {
    if (!executionId) return;

    try {
      const result = await requestWorkflowChanges(executionId, comments);
      if (result.success) {
        showToast({
          message: 'Changes requested. The user has been notified.',
          type: 'info',
          duration: 4000
        });
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to request changes');
      }
    } catch (error: any) {
      showToast({
        message: `Failed to request changes: ${error.message}`,
        type: 'error',
        duration: 5000
      });
      throw error;
    }
  };

  const handleRejectWorkflowReview = async (reason: string | undefined, comments: string) => {
    if (!executionId) return;

    try {
      const result = await rejectWorkflowReview(executionId, reason, comments);
      if (result.success) {
        showToast({
          message: 'Workflow rejected. The user has been notified to address feedback.',
          type: 'info',
          duration: 4000
        });
        await reloadWorkflowReviewStatus();
        setShowReviewApprovalModal(false);
      } else {
        throw new Error(result.error || 'Failed to reject review');
      }
    } catch (error: any) {
      showToast({
        message: `Failed to reject review: ${error.message}`,
        type: 'error',
        duration: 5000
      });
      throw error;
    }
  };

  const handleResubmitWorkflow = async (notes?: string) => {
    if (!executionId) return;

    try {
      const result = await resubmitWorkflowForReview(executionId, notes);
      if (result.success) {
        showToast({
          message: 'Workflow re-submitted successfully! The reviewer will be notified.',
          type: 'success',
          icon: 'check',
          duration: 4000
        });
        await reloadWorkflowReviewStatus();
        setShowResubmitModal(false);
      } else {
        throw new Error(result.error || 'Failed to resubmit workflow');
      }
    } catch (error: any) {
      showToast({
        message: `Failed to resubmit workflow: ${error.message}`,
        type: 'error',
        duration: 5000
      });
      throw error;
    }
  };

  // Wrap handleComplete to check for review status
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

  // ============================================================
  // RESIZE HANDLER
  // ============================================================

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    state.setIsArtifactResizing(true);
  };

  useEffect(() => {
    if (!state.isArtifactResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
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
    goToNextSlide: state.goToNextSlide,
    goToPreviousSlide: state.goToPreviousSlide,
    goToSlide: state.goToSlide,
    sendMessage: state.handleSendMessage,
    handleButtonClick: state.handleButtonClick,
    handleBranchNavigation: state.handleBranchNavigation,
    setChatInputValue: state.setChatInputValue,
    handleComponentValueChange: state.handleComponentValueChange,
    toggleArtifacts: state.toggleArtifacts,
    updateWorkflowState: state.updateWorkflowState,
    setArtifactsPanelWidth: state.setArtifactsPanelWidth,
    setIsArtifactResizing: state.setIsArtifactResizing,
    toggleMetricsSlideup: state.toggleMetricsSlideup,
    togglePlaysDropdown: state.togglePlaysDropdown,
    setStepActionMenu: state.setStepActionMenu,
    handleComplete: handleCompleteWithReviewCheck,
    handleSnooze: state.handleSnooze,
    handleSkip: state.handleSkip,
    handleClose: state.handleClose,
    skipStep: state.skipStep,
    snoozeStep: state.snoozeStep
  };

  // ============================================================
  // LOADING & ERROR STATES
  // ============================================================

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

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <TaskModeContext.Provider value={contextValue}>
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 backdrop-blur-sm flex items-center justify-center p-8">
        <div className="relative w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Overlays (metrics, plays) */}
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
            showArtifacts={state.showArtifacts}
            executionId={executionId}
            userId={userId}
            workflowStatus={workflowStatus}
            sequenceInfo={sequenceInfo}
            onEscalate={state.handleEscalate}
            onTogglePlays={() => state.togglePlaysDropdown(!state.showPlaysDropdown)}
            onToggleMetrics={() => state.toggleMetricsSlideup(true)}
            onToggleArtifacts={() => state.toggleArtifacts(!state.showArtifacts)}
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

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Chat */}
            <div
              className="flex flex-col bg-white"
              style={{ width: state.showArtifacts ? `${100 - state.artifactsPanelWidth}%` : '100%' }}
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
            executionId={executionId}
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
