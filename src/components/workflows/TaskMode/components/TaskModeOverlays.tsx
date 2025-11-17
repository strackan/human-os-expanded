'use client';

/**
 * TaskModeOverlays - Overlay panels for metrics, plays, and sequence
 *
 * Displays:
 * - Metrics slide-up panel (customer metrics)
 * - Plays dropdown panel (workflow sequence navigation)
 *
 * Extracted from TaskModeFullscreen.tsx (lines 810-827 and 1012-1030)
 */

import React from 'react';
import { CustomerMetrics } from '@/components/workflows/CustomerMetrics';
import WorkflowSequencePanel from '@/components/workflows/WorkflowSequencePanel';
import { getWorkflowSequence } from '@/config/workflowSequences';

export interface TaskModeOverlaysProps {
  // Metrics panel
  showMetricsSlideup: boolean;
  customerId: string;
  onToggleMetrics: (show: boolean) => void;

  // Plays dropdown
  showPlaysDropdown: boolean;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };
  onTogglePlays: (show: boolean) => void;
}

export default function TaskModeOverlays(props: TaskModeOverlaysProps) {
  const {
    showMetricsSlideup,
    customerId,
    onToggleMetrics,
    showPlaysDropdown,
    sequenceInfo,
    onTogglePlays,
  } = props;

  return (
    <>
      {/* Plays Dropdown Panel */}
      {showPlaysDropdown && sequenceInfo && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => onTogglePlays(false)}
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

      {/* Metrics Slide-Up Overlay */}
      {showMetricsSlideup && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fade-in"
            onClick={() => onToggleMetrics(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 animate-slide-up"
            style={{ height: '30vh' }}
          >
            <CustomerMetrics
              customerId={customerId}
              isOpen={true}
              onToggle={() => onToggleMetrics(false)}
            />
          </div>
        </>
      )}
    </>
  );
}
