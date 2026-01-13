'use client';

/**
 * TaskModeProgressBar - Step navigation and progress indicator
 *
 * Displays:
 * - Visual progress bar showing all workflow steps
 * - Current step highlighting
 * - Step action menu (snooze, skip, review)
 * - Step status indicators (completed, snoozed, skipped)
 *
 * Extracted from TaskModeFullscreen.tsx (lines 847-870)
 */

import React from 'react';
import WorkflowStepProgress from '@/components/workflows/sections/WorkflowStepProgress';
import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

export interface TaskModeProgressBarProps {
  slides: WorkflowSlide[];
  currentSlideIndex: number;
  completedSlides: Set<number>;
  stepActionMenu: number | null;
  stepStates: Record<number, any>;

  // Handlers
  onStepClick: (index: number) => void;
  onToggleStepActionMenu: (index: number | null) => void;
  onSnoozeStep: (index: number) => void;
  onSkipStep: (index: number) => void;
  onReviewStep: (index: number) => void;
}

export default function TaskModeProgressBar(props: TaskModeProgressBarProps) {
  const {
    slides,
    currentSlideIndex,
    completedSlides,
    stepActionMenu,
    stepStates,
    onStepClick,
    onToggleStepActionMenu,
    onSnoozeStep,
    onSkipStep,
    onReviewStep,
  } = props;

  return (
    <WorkflowStepProgress
      slides={slides}
      currentSlideIndex={currentSlideIndex}
      completedSlides={completedSlides}
      stepActionMenu={stepActionMenu}
      stepStates={stepStates}
      onStepClick={onStepClick}
      onToggleStepActionMenu={onToggleStepActionMenu}
      onSnoozeStep={onSnoozeStep}
      onSkipStep={onSkipStep}
      onReviewStep={onReviewStep}
    />
  );
}
