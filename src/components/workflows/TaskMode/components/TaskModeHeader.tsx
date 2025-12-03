'use client';

/**
 * TaskModeHeader - Top navigation and controls for TaskMode
 *
 * Displays:
 * - Workflow title and customer name
 * - Action buttons (Plays, Metrics, Artifacts, Escalate, Close)
 * - Sequence navigation (if applicable)
 *
 * Extracted from TaskModeFullscreen.tsx (lines 830-845)
 */

import React from 'react';
import WorkflowHeader from '@/components/workflows/sections/WorkflowHeader';

export interface TaskModeHeaderProps {
  workflowTitle: string;
  customerName: string;
  currentSlideIndex: number;
  showArtifacts: boolean;
  executionId?: string;
  userId?: string;
  workflowStatus?: string;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };

  // Handlers
  onEscalate: () => void;
  onTogglePlays: () => void;
  onToggleMetrics: () => void;
  onToggleArtifacts: () => void;
  onToggleCustomer360?: () => void;
  onClose: () => void;
  onRestart?: () => void;
  onWorkflowAction?: (actionType: string) => void;
  onSnooze?: () => void;
  onSkip?: () => void;
}

export default function TaskModeHeader(props: TaskModeHeaderProps) {
  const {
    workflowTitle,
    customerName,
    currentSlideIndex,
    showArtifacts,
    executionId,
    userId,
    workflowStatus,
    sequenceInfo,
    onEscalate,
    onTogglePlays,
    onToggleMetrics,
    onToggleArtifacts,
    onToggleCustomer360,
    onClose,
    onRestart,
    onWorkflowAction,
    onSnooze,
    onSkip,
  } = props;

  return (
    <WorkflowHeader
      workflowTitle={workflowTitle}
      customerName={customerName}
      currentSlideIndex={currentSlideIndex}
      showArtifacts={showArtifacts}
      sequenceInfo={sequenceInfo}
      executionId={executionId}
      userId={userId}
      workflowStatus={workflowStatus}
      onEscalate={onEscalate}
      onTogglePlays={onTogglePlays}
      onToggleMetrics={onToggleMetrics}
      onToggleArtifacts={onToggleArtifacts}
      onToggleCustomer360={onToggleCustomer360}
      onClose={onClose}
      onRestart={onRestart}
      onWorkflowAction={onWorkflowAction}
      onSnooze={onSnooze}
      onSkip={onSkip}
    />
  );
}
