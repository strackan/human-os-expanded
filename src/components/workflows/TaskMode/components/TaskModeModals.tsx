'use client';

/**
 * TaskModeModals - All modal dialogs for TaskMode
 *
 * This component renders all 10 modal types:
 * - Step-level: Snooze, Skip, Review
 * - Workflow-level: Snooze (with triggers), Review (with triggers)
 * - Review workflow: Approval, Rejection, Resubmit
 * - History: Rejection timeline
 *
 * Extracted from TaskModeFullscreen.tsx (lines 1012-1146)
 */

import React from 'react';
import { X } from 'lucide-react';
import { StepSnoozeModal, StepSkipModal, StepReviewModal } from '@/components/workflows/StepActionModals';
import { EnhancedSnoozeModal } from '@/components/workflows/EnhancedSnoozeModal';
import { EnhancedReviewModal } from '@/components/workflows/EnhancedReviewModal';
import { ReviewApprovalModal } from '@/components/workflows/ReviewApprovalModal';
import { ResubmitConfirmationModal } from '@/components/workflows/ResubmitConfirmationModal';
import { RejectionHistoryTimeline } from '@/components/workflows/RejectionHistoryTimeline';
import type { WakeTrigger, TriggerLogic } from '@/types/wake-triggers';
import type { ReviewTrigger, ReviewRejectionHistory } from '@/types/review-triggers';
import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

export interface TaskModeModalsProps {
  // Step-level modal state
  showStepSnoozeModal: number | null;
  showStepSkipModal: number | null;
  showStepReviewModal: number | null;
  onCloseStepSnooze: () => void;
  onCloseStepSkip: () => void;
  onCloseStepReview: () => void;
  onStepSnoozeSuccess: () => Promise<void>;
  onStepSkipSuccess: () => Promise<void>;
  onStepReviewSuccess: () => Promise<void>;

  // Workflow-level modal state
  isSnoozeModalOpen: boolean;
  isEscalateModalOpen: boolean;
  onCloseSnoozeModal: () => void;
  onCloseEscalateModal: () => void;
  onWorkflowSnooze: (triggers: WakeTrigger[], logic?: TriggerLogic) => Promise<void>;
  onWorkflowReview: (triggers: ReviewTrigger[], reviewerId: string, logic?: TriggerLogic, reason?: string) => Promise<void>;

  // Review approval modal state
  showReviewApprovalModal: boolean;
  onCloseReviewApprovalModal: () => void;
  onApproveWorkflowReview: (comments?: string) => Promise<void>;
  onRequestWorkflowChanges: (comments: string) => Promise<void>;
  onRejectWorkflowReview: (reason: string | undefined, comments: string) => Promise<void>;

  // Rejection state
  showResubmitModal: boolean;
  showRejectionHistoryModal: boolean;
  onCloseResubmitModal: () => void;
  onCloseRejectionHistoryModal: () => void;
  onResubmitWorkflow: (notes?: string) => Promise<void>;

  // Data props
  executionId?: string;
  userId?: string;
  slides: WorkflowSlide[];
  workflowTitle?: string;
  workflowReviewerData: any | null;
  workflowRejectionData: any | null;
  rejectionHistory: ReviewRejectionHistory;
}

export default function TaskModeModals(props: TaskModeModalsProps) {
  const {
    // Step-level modals
    showStepSnoozeModal,
    showStepSkipModal,
    showStepReviewModal,
    onCloseStepSnooze,
    onCloseStepSkip,
    onCloseStepReview,
    onStepSnoozeSuccess,
    onStepSkipSuccess,
    onStepReviewSuccess,

    // Workflow-level modals
    isSnoozeModalOpen,
    isEscalateModalOpen,
    onCloseSnoozeModal,
    onCloseEscalateModal,
    onWorkflowSnooze,
    onWorkflowReview,

    // Review approval modal
    showReviewApprovalModal,
    onCloseReviewApprovalModal,
    onApproveWorkflowReview,
    onRequestWorkflowChanges,
    onRejectWorkflowReview,

    // Rejection modals
    showResubmitModal,
    showRejectionHistoryModal,
    onCloseResubmitModal,
    onCloseRejectionHistoryModal,
    onResubmitWorkflow,

    // Data
    executionId,
    userId,
    slides,
    workflowTitle,
    workflowReviewerData,
    workflowRejectionData,
    rejectionHistory,
  } = props;

  return (
    <>
      {/* Step-level Snooze Modal */}
      {showStepSnoozeModal !== null && executionId && userId && (
        <StepSnoozeModal
          executionId={executionId}
          userId={userId}
          stepIndex={showStepSnoozeModal}
          stepId={slides[showStepSnoozeModal]?.id || `step-${showStepSnoozeModal}`}
          stepLabel={slides[showStepSnoozeModal]?.label || `Step ${showStepSnoozeModal + 1}`}
          onClose={onCloseStepSnooze}
          onSuccess={onStepSnoozeSuccess}
        />
      )}

      {/* Step-level Skip Modal */}
      {showStepSkipModal !== null && executionId && userId && (
        <StepSkipModal
          executionId={executionId}
          userId={userId}
          stepIndex={showStepSkipModal}
          stepId={slides[showStepSkipModal]?.id || `step-${showStepSkipModal}`}
          stepLabel={slides[showStepSkipModal]?.label || `Step ${showStepSkipModal + 1}`}
          onClose={onCloseStepSkip}
          onSuccess={onStepSkipSuccess}
        />
      )}

      {/* Step-level Review Modal */}
      {showStepReviewModal !== null && executionId && userId && (
        <StepReviewModal
          executionId={executionId}
          userId={userId}
          stepIndex={showStepReviewModal}
          stepId={slides[showStepReviewModal]?.id || `step-${showStepReviewModal}`}
          stepLabel={slides[showStepReviewModal]?.label || `Step ${showStepReviewModal + 1}`}
          onClose={onCloseStepReview}
          onSuccess={onStepReviewSuccess}
        />
      )}

      {/* Workflow-level Snooze Modal with Triggers */}
      {executionId && (
        <EnhancedSnoozeModal
          workflowId={executionId}
          isOpen={isSnoozeModalOpen}
          onClose={onCloseSnoozeModal}
          onSnooze={onWorkflowSnooze}
        />
      )}

      {/* Workflow-level Review Modal with Triggers */}
      {executionId && (
        <EnhancedReviewModal
          workflowId={executionId}
          isOpen={isEscalateModalOpen}
          onClose={onCloseEscalateModal}
          onReview={onWorkflowReview}
        />
      )}

      {/* Review Approval Modal (Enhanced with Rejection - Phase 1.4) */}
      <ReviewApprovalModal
        isOpen={showReviewApprovalModal}
        onClose={onCloseReviewApprovalModal}
        onApprove={onApproveWorkflowReview}
        onRequestChanges={onRequestWorkflowChanges}
        onReject={onRejectWorkflowReview}
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
          onClose={onCloseResubmitModal}
          onConfirm={onResubmitWorkflow}
          reviewerName={workflowRejectionData.reviewerName}
          iteration={workflowRejectionData.iteration + 1}
        />
      )}

      {/* Rejection History Modal (Phase 1.4) */}
      {showRejectionHistoryModal && rejectionHistory.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={onCloseRejectionHistoryModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <RejectionHistoryTimeline history={rejectionHistory} />
          </div>
        </div>
      )}
    </>
  );
}
