'use client';

/**
 * TaskModeStepChat - v0-Style Collapsible Step Chat Layout
 *
 * Features:
 * - Collapsible step containers on the left (280-450px resizable)
 * - Artifact panel takes remaining space (focal point)
 * - No progress bar - steps ARE the progress indicator
 * - Auto-collapse on step completion
 * - Pin to keep steps expanded
 *
 * This replaces TaskModeEncapsulated when USE_STEP_CHAT_LAYOUT flag is enabled.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import TaskModeContext, { TaskModeContextValue } from './TaskModeContext';
import { useTaskModeStateV2 } from './hooks/useTaskModeStateV2';
import { useStepChatState } from './hooks/useStepChatState';
import TaskModeHeader from './components/TaskModeHeader';
import TaskModeArtifactPanel from './components/TaskModeArtifactPanel';
import TaskModeOverlays from './components/TaskModeOverlays';
import TaskModeModals from './components/TaskModeModals';
import { StepChatPanel } from './components/StepChatPanel';
import { DEFAULT_STEP_CHAT_LAYOUT } from './types/step-chat';
import { WorkflowStepActionService } from '@/lib/workflows/actions/WorkflowStepActionService';
import { WorkflowPersistenceService } from '@/lib/persistence/WorkflowPersistenceService';
import { createWorkflowExecution } from '@/lib/workflows/actions';
import { snoozeWithTriggers, requestReviewWithTriggers } from '@/lib/api/workflow-triggers';
import { approveWorkflowReview, requestWorkflowChanges, rejectWorkflowReview, resubmitWorkflowForReview } from '@/lib/api/workflow-triggers';
import type { WakeTrigger, TriggerLogic } from '@/types/wake-triggers';
import type { ReviewTrigger } from '@/types/review-triggers';
import { useToast } from '@/components/ui/ToastProvider';
import Customer360SidePanel from '@/components/workflows/Customer360SidePanel';

// ============================================================
// TYPES
// ============================================================

interface TaskModeStepChatProps {
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
}

// ============================================================
// COMPONENT
// ============================================================

export default function TaskModeStepChat(props: TaskModeStepChatProps) {
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
  } = props;

  const { showToast } = useToast();

  // ============================================================
  // PANEL WIDTH STATE
  // ============================================================
  const [stepPanelWidth, setStepPanelWidth] = useState(DEFAULT_STEP_CHAT_LAYOUT.defaultWidth);

  // ============================================================
  // RESUME DETECTION
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

  // Create new workflow execution
  const createNewExecution = useCallback(async () => {
    if (!userId) {
      console.error('[TaskModeStepChat] Cannot create execution - missing userId');
      setIsCheckingResume(false);
      return;
    }

    try {
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
        setEffectiveExecutionId(result.executionId);
      }
    } catch (error) {
      console.error('[TaskModeStepChat] Error creating execution:', error);
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
        setIsCheckingResume(false);
        return;
      }

      try {
        const resumeInfo = await WorkflowPersistenceService.getResumableExecution({
          workflowConfigId: workflowId,
          customerId,
          userId,
        });

        if (resumeInfo) {
          setResumableData(resumeInfo);
          setShowResumeDialog(true);
        } else {
          await createNewExecution();
        }
      } catch (error) {
        console.error('[TaskModeStepChat] Error checking for resumable:', error);
        await createNewExecution();
      }
    };

    checkForResumable();
  }, [propExecutionId, workflowId, customerId, userId, createNewExecution]);

  // Handle resume choice
  const handleResumeChoice = useCallback(async (shouldResume: boolean) => {
    setShowResumeDialog(false);
    if (shouldResume && resumableData) {
      setEffectiveExecutionId(resumableData.executionId);
      setIsCheckingResume(false);
    } else {
      await createNewExecution();
    }
  }, [resumableData, createNewExecution]);

  // ============================================================
  // STEP STATES (from database)
  // Note: stepStates and stepExecutions are loaded for future use
  // ============================================================
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stepStates, setStepStates] = useState<Record<number, { status: string; snooze_until?: string }>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stepExecutions, setStepExecutions] = useState<Record<number, unknown>>({});

  const reloadStepStates = useCallback(async () => {
    if (!effectiveExecutionId) return;
    try {
      const states = await WorkflowStepActionService.getStepStates(effectiveExecutionId);
      const statesMap: Record<number, { status: string; snooze_until?: string }> = {};
      states.forEach((s: { step_index: number; status: string; snooze_until?: string }) => {
        statesMap[s.step_index] = s;
      });
      setStepStates(statesMap);
    } catch (error) {
      console.error('[TaskModeStepChat] Error loading step states:', error);
    }
  }, [effectiveExecutionId]);

  const reloadStepExecutions = useCallback(async () => {
    if (!effectiveExecutionId) return;
    try {
      const executions = await WorkflowStepActionService.getStepExecutions(effectiveExecutionId);
      const execMap: Record<number, unknown> = {};
      executions.forEach((e: { step_index: number }) => {
        execMap[e.step_index] = e;
      });
      setStepExecutions(execMap);
    } catch (error) {
      console.error('[TaskModeStepChat] Error loading step executions:', error);
    }
  }, [effectiveExecutionId]);

  useEffect(() => {
    reloadStepStates();
    reloadStepExecutions();
  }, [reloadStepStates, reloadStepExecutions]);

  // ============================================================
  // CORE WORKFLOW STATE (from useTaskModeStateV2)
  // ============================================================
  const state = useTaskModeStateV2({
    workflowId,
    customerName,
    customerId,
    onClose,
    onComplete: () => {
      showToast('Workflow completed!', 'success');
      onClose(true);
    },
    executionId: effectiveExecutionId,
    workflowPurpose: 'renewal_preparation',
  });

  // ============================================================
  // STEP CHAT STATE (groups messages by step)
  // ============================================================
  const stepChatState = useStepChatState({
    slides: state.slides,
    currentSlideIndex: state.currentSlideIndex,
    chatMessages: state.chatMessages,
    completedSlides: state.completedSlides,
    skippedSlides: state.skippedSlides,
    snoozedSlides: state.snoozedSlides,
    autoCollapseDelay: 1500,
  });

  // ============================================================
  // MODAL STATES
  // ============================================================
  const [showStepSnoozeModal, setShowStepSnoozeModal] = useState<number | null>(null);
  const [showStepSkipModal, setShowStepSkipModal] = useState<number | null>(null);
  const [showStepReviewModal, setShowStepReviewModal] = useState<number | null>(null);
  const [showReviewApprovalModal, setShowReviewApprovalModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showRejectionHistoryModal, setShowRejectionHistoryModal] = useState(false);
  const [showCustomer360, setShowCustomer360] = useState(false);

  // Review/rejection data (placeholder - would come from API)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [workflowReviewStatus, setWorkflowReviewStatus] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [reviewBlockerMessage, setReviewBlockerMessage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [workflowReviewerData, setWorkflowReviewerData] = useState<unknown>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [workflowRejectionData, setWorkflowRejectionData] = useState<unknown>(null);

  // ============================================================
  // WORKFLOW ACTION HANDLERS
  // ============================================================
  const handleWorkflowSnooze = useCallback(async (params: {
    triggers: WakeTrigger[];
    logic: TriggerLogic;
  }) => {
    if (!effectiveExecutionId || !userId) return;
    try {
      await snoozeWithTriggers({
        executionId: effectiveExecutionId,
        userId,
        triggers: params.triggers,
        logic: params.logic,
      });
      showToast('Workflow snoozed', 'success');
      state.closeSnoozeModal();
      onClose(false);
    } catch (error) {
      console.error('[TaskModeStepChat] Error snoozing:', error);
      showToast('Failed to snooze workflow', 'error');
    }
  }, [effectiveExecutionId, userId, state, showToast, onClose]);

  const handleWorkflowReview = useCallback(async (params: {
    triggers: ReviewTrigger[];
    priority: string;
    assignedTo?: string;
    message?: string;
  }) => {
    if (!effectiveExecutionId || !userId) return;
    try {
      await requestReviewWithTriggers({
        executionId: effectiveExecutionId,
        userId,
        triggers: params.triggers,
        priority: params.priority,
        assignedTo: params.assignedTo,
        message: params.message,
      });
      showToast('Review requested', 'success');
      state.closeEscalateModal();
      onClose(false);
    } catch (error) {
      console.error('[TaskModeStepChat] Error requesting review:', error);
      showToast('Failed to request review', 'error');
    }
  }, [effectiveExecutionId, userId, state, showToast, onClose]);

  const handleApproveWorkflowReview = useCallback(async () => {
    if (!effectiveExecutionId || !userId) return;
    try {
      await approveWorkflowReview({ executionId: effectiveExecutionId, userId });
      showToast('Review approved', 'success');
      setShowReviewApprovalModal(false);
    } catch (error) {
      console.error('[TaskModeStepChat] Error approving:', error);
      showToast('Failed to approve', 'error');
    }
  }, [effectiveExecutionId, userId, showToast]);

  const handleRequestWorkflowChanges = useCallback(async (message: string) => {
    if (!effectiveExecutionId || !userId) return;
    try {
      await requestWorkflowChanges({ executionId: effectiveExecutionId, userId, message });
      showToast('Changes requested', 'success');
      setShowReviewApprovalModal(false);
    } catch (error) {
      console.error('[TaskModeStepChat] Error requesting changes:', error);
      showToast('Failed to request changes', 'error');
    }
  }, [effectiveExecutionId, userId, showToast]);

  const handleRejectWorkflowReview = useCallback(async (message: string) => {
    if (!effectiveExecutionId || !userId) return;
    try {
      await rejectWorkflowReview({ executionId: effectiveExecutionId, userId, message });
      showToast('Review rejected', 'success');
      setShowReviewApprovalModal(false);
    } catch (error) {
      console.error('[TaskModeStepChat] Error rejecting:', error);
      showToast('Failed to reject', 'error');
    }
  }, [effectiveExecutionId, userId, showToast]);

  const handleResubmitWorkflow = useCallback(async (message: string) => {
    if (!effectiveExecutionId || !userId) return;
    try {
      await resubmitWorkflowForReview({ executionId: effectiveExecutionId, userId, message });
      showToast('Resubmitted for review', 'success');
      setShowResubmitModal(false);
    } catch (error) {
      console.error('[TaskModeStepChat] Error resubmitting:', error);
      showToast('Failed to resubmit', 'error');
    }
  }, [effectiveExecutionId, userId, showToast]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  const contextValue: TaskModeContextValue = {
    currentSlide: state.currentSlide,
    chatMessages: state.chatMessages,
    workflowState: state.workflowState,
    customer: state.customer,
    expansionData: state.expansionData,
    stakeholders: state.stakeholders,
    updateWorkflowState: state.updateWorkflowState,
    goToNextSlide: state.goToNextSlide,
    goToPreviousSlide: state.goToPreviousSlide,
    handleComplete: state.handleComplete,
    currentSlideIndex: state.currentSlideIndex,
  };

  // ============================================================
  // LOADING STATES
  // ============================================================
  if (isCheckingResume) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center text-gray-700">
          <div className="inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p>Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (showResumeDialog && resumableData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Workflow?</h2>
          <p className="text-gray-600 mb-6">
            You have a saved workflow in progress from {new Date(resumableData.savedAt).toLocaleString()}.
            Would you like to continue where you left off?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleResumeChoice(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Start Fresh
            </button>
            <button
              onClick={() => handleResumeChoice(true)}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!state.config || state.contextLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center text-gray-700">
          <div className="inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p>Preparing workflow...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - STEP CHAT LAYOUT
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

          {/* Header - No Progress Bar */}
          <TaskModeHeader
            workflowTitle={workflowTitle || (state.config as any)?.workflowName || 'Workflow'}
            customerName={customerName}
            currentSlideIndex={state.currentSlideIndex}
            showArtifacts={true}
            executionId={effectiveExecutionId}
            userId={userId}
            workflowStatus={workflowStatus}
            sequenceInfo={sequenceInfo}
            onEscalate={state.handleEscalate}
            onTogglePlays={() => state.togglePlaysDropdown(!state.showPlaysDropdown)}
            onToggleMetrics={() => state.toggleMetricsSlideup(true)}
            onToggleArtifacts={() => {}}
            onToggleCustomer360={() => setShowCustomer360(!showCustomer360)}
            onClose={state.handleClose}
            onWorkflowAction={onWorkflowAction}
          />

          {/* Main Content - Step Chat + Artifact Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Step Chat Panel (collapsible steps) */}
            <StepChatPanel
              stepGroups={stepChatState.stepGroups}
              currentStepIndex={state.currentSlideIndex}
              onExpandStep={stepChatState.expandStep}
              onCollapseStep={stepChatState.collapseStep}
              onTogglePin={stepChatState.togglePin}
              onTitleChange={stepChatState.setCustomTitle}
              onSendMessage={state.handleSendMessage}
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
              onBranchNavigation={state.handleBranchNavigation}
              onComponentValueChange={state.handleComponentValueChange}
              chatInputValue={state.chatInputValue}
              onChatInputChange={state.setChatInputValue}
              chatInputRef={state.chatInputRef}
              isGeneratingLLM={state.isGeneratingLLM}
              panelWidth={stepPanelWidth}
              onPanelWidthChange={setStepPanelWidth}
            />

            {/* Right: Artifact Panel (focal point) */}
            <div className="flex-1 bg-gray-50 overflow-hidden">
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
            rejectionHistory={[]}
          />
        </div>
      </div>
    </TaskModeContext.Provider>
  );
}
