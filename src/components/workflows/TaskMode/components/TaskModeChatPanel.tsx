'use client';

/**
 * TaskModeChatPanel - Main chat interface for TaskMode
 *
 * Displays:
 * - Rejection alert banner (if workflow rejected)
 * - Review pending banner (if awaiting review)
 * - Review required banner (if user is reviewer)
 * - Chat messages and conversation flow
 * - Snoozed/review pending step overlays
 * - Chat input and send controls
 *
 * Extracted from TaskModeFullscreen.tsx (lines 875-987)
 */

import React from 'react';
import { Shield, Mic, Paperclip } from 'lucide-react';
import ChatRenderer from '@/components/workflows/sections/ChatRenderer';
import { RejectionAlertBanner } from '@/components/workflows/RejectionAlertBanner';
import type { ChatMessage } from '@/components/workflows/sections/ChatRenderer';
import type { WorkflowSlide, WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';

export interface TaskModeChatPanelProps {
  // Chat state
  chatMessages: ChatMessage[];
  currentSlide: WorkflowSlide | null;
  workflowState: Record<string, any>;
  customerName: string;
  chatInputValue: string;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  config: WorkflowConfig;

  // Review/rejection state
  workflowReviewStatus: string | null;
  reviewBlockerMessage: string | null;
  workflowReviewerData: any | null;
  workflowRejectionData: any | null;

  // Step state
  currentSlideIndex: number;
  stepStates: Record<number, any>;
  stepExecutions: Record<number, any>;

  // Loading/error states
  contextLoading: boolean;
  contextError: Error | null;

  // Handlers
  onSendMessage: (message: string) => void;
  onBranchNavigation: (branchId: string) => void;
  onComponentValueChange: (componentId: string, value: any) => void;
  onButtonClick: (buttonValue: string) => void;
  setChatInputValue: (value: string) => void;
  onShowReviewApprovalModal: () => void;
  onShowResubmitModal: () => void;
  onShowRejectionHistoryModal: () => void;

  // Dynamic label callbacks
  getNextButtonLabel: (originalLabel: string, buttonValue: string) => string;
  getPreviousButtonLabel: (originalLabel: string, buttonValue: string) => string;
}

export default function TaskModeChatPanel(props: TaskModeChatPanelProps) {
  const {
    chatMessages,
    currentSlide,
    workflowState,
    customerName,
    chatInputValue,
    chatInputRef,
    config,
    workflowReviewStatus,
    reviewBlockerMessage,
    workflowReviewerData,
    workflowRejectionData,
    currentSlideIndex,
    stepStates,
    stepExecutions,
    contextLoading,
    contextError,
    onSendMessage,
    onBranchNavigation,
    onComponentValueChange,
    onButtonClick,
    setChatInputValue,
    onShowReviewApprovalModal,
    onShowResubmitModal,
    onShowRejectionHistoryModal,
    getNextButtonLabel,
    getPreviousButtonLabel,
  } = props;

  // Check if current step is snoozed
  const currentStepState = stepStates[currentSlideIndex];
  const isCurrentStepSnoozed = currentStepState?.status === 'snoozed';
  const snoozeUntil = currentStepState?.snooze_until ? new Date(currentStepState.snooze_until) : null;

  // Check if current step has pending review
  const currentStepExecution = stepExecutions[currentSlideIndex];
  const isCurrentStepReviewPending = currentStepExecution?.review_status === 'pending';
  const stepReviewerName = currentStepExecution?.profiles?.full_name || 'the assigned reviewer';

  const renderChatContent = () => {
    if (!currentSlide) return null;

    return (
      <div className="relative h-full">
        <div className={isCurrentStepSnoozed || isCurrentStepReviewPending ? 'opacity-30 pointer-events-none' : ''}>
          <ChatRenderer
            currentSlide={currentSlide}
            chatMessages={chatMessages}
            workflowState={workflowState}
            customerName={customerName}
            onSendMessage={onSendMessage}
            onBranchNavigation={onBranchNavigation}
            onComponentValueChange={onComponentValueChange}
            onButtonClick={onButtonClick}
            getNextButtonLabel={getNextButtonLabel}
            getPreviousButtonLabel={getPreviousButtonLabel}
          />
        </div>

        {/* Snoozed Step Overlay */}
        {isCurrentStepSnoozed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center border-2 border-gray-300">
              <div className="text-6xl mb-4">💤</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Task Snoozed</h3>
              <p className="text-gray-600 mb-4">Check back later.</p>
              {snoozeUntil && (
                <p className="text-sm text-gray-500">
                  Snoozed until {snoozeUntil.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Review Pending Step Overlay */}
        {isCurrentStepReviewPending && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center border-2 border-blue-200">
              <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-blue-900 mb-2">Review Pending</h3>
              <p className="text-gray-600 mb-4">
                This step is awaiting review from {stepReviewerName}.
              </p>
              <p className="text-sm text-gray-500">
                You cannot complete this step until it has been approved.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Rejection Alert Banner (Phase 1.4) */}
      {workflowReviewStatus === 'rejected' && workflowRejectionData && (
        <RejectionAlertBanner
          reviewerName={workflowRejectionData.reviewerName}
          rejectedAt={workflowRejectionData.rejectedAt}
          reason={workflowRejectionData.reason}
          comments={workflowRejectionData.comments}
          iteration={workflowRejectionData.iteration}
          rejectionHistory={workflowRejectionData.rejectionHistory}
          onResubmit={onShowResubmitModal}
          onViewHistory={onShowRejectionHistoryModal}
        />
      )}

      {/* Review Pending Banner (for non-reviewers) */}
      {workflowReviewStatus === 'pending' && reviewBlockerMessage && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Review Pending</p>
              <p className="text-xs text-blue-700 mt-0.5">{reviewBlockerMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Review Required Banner (for reviewers) */}
      {workflowReviewStatus === 'pending' && workflowReviewerData && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Your Review Required</p>
              <p className="text-xs text-green-700 mt-0.5">
                {workflowReviewerData.requestedBy} is requesting your review of this workflow
              </p>
            </div>
            <button
              onClick={onShowReviewApprovalModal}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {contextLoading ? (
          <div className="flex items-center justify-center p-12 h-full">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading workflow data...</p>
            </div>
          </div>
        ) : contextError ? (
          <div className="flex items-center justify-center p-12 h-full">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-2xl">⚠</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Workflow Data</h3>
              <p className="text-gray-600">{contextError.message}</p>
            </div>
          </div>
        ) : (
          renderChatContent()
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Mic className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={chatInputRef}
            type="text"
            value={chatInputValue}
            onChange={(e) => setChatInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && chatInputValue.trim()) {
                onSendMessage(chatInputValue.trim());
                setChatInputValue('');
              }
            }}
            placeholder={config.chat?.placeholder || 'Type a message...'}
            className="flex-1 min-w-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={() => {
              if (chatInputValue.trim()) {
                onSendMessage(chatInputValue.trim());
                setChatInputValue('');
              }
            }}
            disabled={!chatInputValue.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
