'use client';

/**
 * TaskModeArtifactPanel - Right panel for displaying workflow artifacts
 *
 * Displays:
 * - Artifact content (forms, documents, visualizations)
 * - Dynamic artifact rendering based on slide configuration
 *
 * Extracted from TaskModeFullscreen.tsx (lines 1002-1008)
 */

import React from 'react';
import ArtifactRenderer from '@/components/workflows/renderers/ArtifactRenderer';
import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

export interface TaskModeArtifactPanelProps {
  currentSlide: WorkflowSlide | null;
  workflowState: Record<string, any>;
  customerName: string;
  customer: any | null;
  expansionData: any | null;
  stakeholders: any[] | null | undefined;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };

  // Handlers
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onComplete: () => void;
  onUpdateState: (key: string, value: any) => void;
}

export default function TaskModeArtifactPanel(props: TaskModeArtifactPanelProps) {
  const {
    currentSlide,
    workflowState,
    customerName,
    customer,
    expansionData,
    stakeholders,
    sequenceInfo,
    onNext,
    onBack,
    onClose,
    onComplete,
    onUpdateState,
  } = props;

  if (!currentSlide?.artifacts?.sections || currentSlide.artifacts.sections.length === 0) {
    return null;
  }

  const section = currentSlide.artifacts.sections[0];

  return (
    <ArtifactRenderer
      slide={currentSlide}
      section={section}
      customerName={customerName}
      workflowState={workflowState}
      customer={customer}
      expansionData={expansionData}
      stakeholders={stakeholders || []}
      sequenceInfo={sequenceInfo}
      onNext={onNext}
      onBack={onBack}
      onClose={onClose}
      onComplete={onComplete}
      onUpdateState={onUpdateState}
    />
  );
}
