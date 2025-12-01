'use client';

/**
 * WorkflowHeader Component
 *
 * Renders the workflow header with title, customer name, and icon controls:
 * - Workflow management icons (Skip, Reassign/Escalate, Snooze)
 * - Customer 360 toggle
 * - Plays/Sequence dropdown toggle
 * - Metrics toggle
 * - Close button
 */

import React from 'react';
import { X, OctagonX, Clock, SkipForward, UserPlus, Users } from 'lucide-react';

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
  onToggleCustomer360?: () => void;
  onClose: () => void;
  onRestart?: () => void;
  onWorkflowAction?: (actionType: string) => void;
  onSnooze?: () => void;
  onSkip?: () => void;
}

export default function WorkflowHeader({
  workflowTitle,
  customerName,
  currentSlideIndex: _currentSlideIndex,
  showArtifacts: _showArtifacts,
  executionId,
  userId,
  workflowStatus,
  sequenceInfo,
  onEscalate,
  onTogglePlays,
  onToggleMetrics,
  onToggleArtifacts: _onToggleArtifacts,
  onToggleCustomer360,
  onClose,
  onRestart,
  onWorkflowAction: _onWorkflowAction,
  onSnooze,
  onSkip
}: WorkflowHeaderProps) {
  // Reserved for future use
  void _currentSlideIndex;
  void _showArtifacts;
  void _onToggleArtifacts;
  void _onWorkflowAction;
  const isTerminalState = ['completed', 'rejected', 'lost', 'skipped'].includes(workflowStatus || '');
  const isSnoozed = workflowStatus === 'snoozed';

  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white" id="workflow-header">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Title and Customer */}
        <div className="min-w-0 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{workflowTitle}</h2>
          <p className="text-sm text-gray-600 truncate">{customerName}</p>
        </div>

        {/* Center: Workflow Management Icons */}
        {executionId && userId && !isTerminalState && (
          <div className="flex items-center gap-1 mx-4">
            {/* Snooze Icon */}
            <button
              onClick={onSnooze}
              disabled={isSnoozed}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isSnoozed
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
              }`}
              title={isSnoozed ? 'Already snoozed' : 'Snooze workflow'}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Snooze</span>
            </button>

            {/* Skip Icon */}
            <button
              onClick={onSkip}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all"
              title="Skip workflow"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">Skip</span>
            </button>

            {/* Reassign/Escalate Icon */}
            <button
              onClick={onEscalate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
              title="Reassign to another user"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Reassign</span>
            </button>
          </div>
        )}

        {/* Right: Icon Controls */}
        <div className="flex items-center gap-2" id="workflow-icon-controls">
          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* Customer 360 Toggle */}
          {onToggleCustomer360 && (
            <button
              onClick={onToggleCustomer360}
              className="text-gray-500 hover:text-blue-600 hover:scale-110 transition-all p-2 hover:bg-blue-50 rounded-lg"
              title="Customer 360"
            >
              <Users className="w-5 h-5" />
            </button>
          )}

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
            title="Close workflow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
