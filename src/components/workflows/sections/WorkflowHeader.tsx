'use client';

/**
 * WorkflowHeader Component
 *
 * Renders the workflow header with title, customer name, and icon controls:
 * - Workflow action buttons (Snooze, Skip, Escalate)
 * - Escalate button
 * - Plays/Sequence dropdown toggle
 * - Metrics toggle
 * - Artifacts toggle
 * - Close button
 */

import React from 'react';
import { X, OctagonX } from 'lucide-react';
import WorkflowActionButtons from '@/components/workflows/WorkflowActionButtons';

interface WorkflowHeaderProps {
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
  };
  onEscalate: () => void;
  onTogglePlays: () => void;
  onToggleMetrics: () => void;
  onToggleArtifacts: () => void;
  onClose: () => void;
  onRestart?: () => void;
  onWorkflowAction?: (actionType: string) => void;
}

export default function WorkflowHeader({
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
  onClose,
  onRestart,
  onWorkflowAction
}: WorkflowHeaderProps) {
  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white" id="workflow-header">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Title and Customer */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{workflowTitle}</h2>
          <p className="text-sm text-gray-600">{customerName}</p>
        </div>

        {/* Center: Workflow Action Buttons */}
        {executionId && userId && onWorkflowAction && (
          <div className="flex-1 flex justify-center">
            <WorkflowActionButtons
              executionId={executionId}
              userId={userId}
              currentStatus={workflowStatus || 'in_progress'}
              onActionComplete={onWorkflowAction}
              className="mx-4"
            />
          </div>
        )}

        {/* Right: Icon Controls */}
        <div className="flex items-center gap-4" id="workflow-icon-controls">
          {/* Escalate Icon */}
          <button
            onClick={onEscalate}
            className="text-gray-500 hover:text-blue-600 hover:scale-110 transition-all p-2 hover:bg-blue-50 rounded-lg"
            title="Escalate to manager"
          >
            <i className="fa-solid fa-user-tie-hair text-xl"></i>
          </button>

          {/* Plays/Sequence Dropdown Toggle */}
          {sequenceInfo && (
            <button
              onClick={onTogglePlays}
              className="text-gray-500 hover:text-blue-600 hover:scale-110 transition-all p-2 hover:bg-blue-50 rounded-lg"
              title="View workflow sequence"
            >
              <i className="fa-light fa-football text-xl"></i>
            </button>
          )}

          {/* Metrics Toggle */}
          <button
            onClick={onToggleMetrics}
            className="text-gray-500 hover:text-blue-600 hover:scale-110 transition-all p-2 hover:bg-blue-50 rounded-lg"
            title="View customer metrics"
          >
            <i className="fa-light fa-chart-simple text-xl"></i>
          </button>

          {/* Restart Button */}
          {onRestart && (
            <button
              onClick={onRestart}
              className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
              title="Restart workflow from beginning"
            >
              <OctagonX className="w-5 h-5" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
