'use client';

/**
 * TaskModeFullscreen - Refactored Version
 *
 * Main orchestrator component that:
 * 1. Uses useTaskModeState hook for all state management
 * 2. Provides TaskModeContext to child components
 * 3. Composes child components (Header, Chat, Artifacts, Modals)
 *
 * This is the new modular architecture replacing the monolithic TaskModeFullscreen-v3.
 */

import React, { useEffect } from 'react';
import TaskModeContext, { TaskModeContextValue } from './TaskModeContext';
import { useTaskModeState } from './hooks/useTaskModeState';

// TODO: Import child components when extracted
// import TaskModeHeader from './components/TaskModeHeader';
// import TaskModeChatPanel from './components/TaskModeChatPanel';
// import TaskModeArtifactPanel from './components/TaskModeArtifactPanel';
// import TaskModeModals from './components/TaskModeModals';

// Temporary: Import sections from original location
import WorkflowHeader from '@/components/workflows/sections/WorkflowHeader';
import WorkflowStepProgress from '@/components/workflows/sections/WorkflowStepProgress';
import ChatRenderer from '@/components/workflows/sections/ChatRenderer';
import ArtifactRenderer from '@/components/workflows/renderers/ArtifactRenderer';
import { CustomerMetrics } from '@/components/workflows/CustomerMetrics';
import WorkflowSequencePanel from '@/components/workflows/WorkflowSequencePanel';
import { getWorkflowSequence } from '@/config/workflowSequences';
import { Mic, Paperclip } from 'lucide-react';

interface TaskModeFullscreenProps {
  workflowId: string;
  workflowTitle: string;
  customerId: string;
  customerName: string;
  onClose: (completed?: boolean) => void;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };
}

export default function TaskModeFullscreen(props: TaskModeFullscreenProps) {
  const {
    workflowId,
    workflowTitle,
    customerId,
    customerName,
    onClose,
    sequenceInfo
  } = props;

  // Get all state and handlers from the hook
  const state = useTaskModeState({
    workflowId,
    customerId,
    customerName,
    onClose,
    sequenceInfo
  });

  // Resize handling effect (must be before early returns)
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    state.setIsArtifactResizing(true);
  };

  useEffect(() => {
    if (!state.isArtifactResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
      const constrainedWidth = Math.min(Math.max(newWidth, 30), 70);
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

  // Build the context value
  const contextValue: TaskModeContextValue = {
    // State
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

    // Navigation
    goToNextSlide: state.goToNextSlide,
    goToPreviousSlide: state.goToPreviousSlide,
    goToSlide: state.goToSlide,

    // Chat routes
    sendMessage: state.sendMessage,
    handleButtonClick: state.handleButtonClick,
    handleBranchNavigation: state.handleBranchNavigation,
    setChatInputValue: state.setChatInputValue,
    handleComponentValueChange: state.handleComponentValueChange,

    // Artifact routes
    toggleArtifacts: state.toggleArtifacts,
    updateWorkflowState: state.updateWorkflowState,
    setArtifactsPanelWidth: state.setArtifactsPanelWidth,
    setIsArtifactResizing: state.setIsArtifactResizing,

    // Header routes
    toggleMetricsSlideup: state.toggleMetricsSlideup,
    togglePlaysDropdown: state.togglePlaysDropdown,
    setStepActionMenu: state.setStepActionMenu,

    // Lifecycle
    handleComplete: state.handleComplete,
    handleSnooze: state.handleSnooze,
    handleSkip: state.handleSkip,
    handleClose: state.handleClose,
    skipStep: state.skipStep,
    snoozeStep: state.snoozeStep
  };

  // Loading state
  if (!state.config && !state.configError) {
    return (
      <div className="fixed inset-0 z-50 bg-[#2D1271] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading workflow configuration...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.configError || !state.config) {
    return (
      <div className="fixed inset-0 z-50 bg-[#2D1271] flex items-center justify-center p-8">
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

  // Render chat content helper
  const renderChatContent = () => {
    if (!state.currentSlide) return null;

    const handleChatButtonClick = (buttonValue: string) => {
      // Check for nextBranches in current branch first
      if (state.currentBranch && state.currentSlide?.chat?.branches) {
        const branch = state.currentSlide.chat.branches[state.currentBranch];
        if (branch && 'nextBranches' in branch && branch.nextBranches && branch.nextBranches[buttonValue]) {
          state.handleBranchNavigation(branch.nextBranches[buttonValue]);
          return;
        }
      }

      // Then check initial message nextBranches
      const initialMessage = state.currentSlide?.chat?.initialMessage;
      if (initialMessage?.nextBranches && initialMessage.nextBranches[buttonValue]) {
        state.handleBranchNavigation(initialMessage.nextBranches[buttonValue]);
      } else {
        state.handleButtonClick(buttonValue);
      }
    };

    return (
      <ChatRenderer
        currentSlide={state.currentSlide}
        chatMessages={state.chatMessages}
        workflowState={state.workflowState}
        customerName={customerName}
        onSendMessage={state.sendMessage}
        onBranchNavigation={state.handleBranchNavigation}
        onComponentValueChange={state.handleComponentValueChange}
        onButtonClick={handleChatButtonClick}
      />
    );
  };

  // Render artifact helper
  const renderArtifact = () => {
    if (!state.currentSlide?.artifacts?.sections || state.currentSlide.artifacts.sections.length === 0) {
      return null;
    }

    const section = state.currentSlide.artifacts.sections[0];

    return (
      <ArtifactRenderer
        slide={state.currentSlide}
        section={section}
        customerName={customerName}
        workflowState={state.workflowState}
        customer={state.customer}
        expansionData={state.expansionData}
        stakeholders={state.stakeholders || []}
        sequenceInfo={sequenceInfo}
        onNext={state.goToNextSlide}
        onBack={state.goToPreviousSlide}
        onClose={onClose}
        onComplete={state.handleComplete}
        onUpdateState={state.updateWorkflowState}
      />
    );
  };

  return (
    <TaskModeContext.Provider value={contextValue}>
      <div className="fixed inset-0 z-50 bg-[#2D1271] flex items-center justify-center p-8">
        {/* Workstation Container */}
        <div className="relative w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Plays Dropdown Panel */}
          {state.showPlaysDropdown && sequenceInfo && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={() => state.togglePlaysDropdown(false)}
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

          {/* Header */}
          <WorkflowHeader
            workflowTitle={workflowTitle}
            customerName={customerName}
            currentSlideIndex={state.currentSlideIndex}
            showArtifacts={state.showArtifacts}
            sequenceInfo={sequenceInfo}
            onEscalate={() => console.log('Escalate')}
            onTogglePlays={() => state.togglePlaysDropdown(!state.showPlaysDropdown)}
            onToggleMetrics={() => state.toggleMetricsSlideup(true)}
            onToggleArtifacts={() => state.toggleArtifacts(!state.showArtifacts)}
            onClose={state.handleClose}
          />

          {/* Progress Bar */}
          <WorkflowStepProgress
            slides={state.slides}
            currentSlideIndex={state.currentSlideIndex}
            completedSlides={state.completedSlides}
            stepActionMenu={state.stepActionMenu}
            onStepClick={state.goToSlide}
            onToggleStepActionMenu={state.setStepActionMenu}
            onSnoozeStep={(index) => {
              state.setConfirmationModal({ type: 'snooze', stepIndex: index });
              state.setStepActionMenu(null);
            }}
            onSkipStep={(index) => {
              state.setConfirmationModal({ type: 'skip', stepIndex: index });
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
              <div className="flex-1 overflow-y-auto">
                {state.contextLoading ? (
                  <div className="flex items-center justify-center p-12 h-full">
                    <div className="text-center">
                      <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600">Loading workflow data...</p>
                    </div>
                  </div>
                ) : state.contextError ? (
                  <div className="flex items-center justify-center p-12 h-full">
                    <div className="max-w-md text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-600 text-2xl">⚠</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Workflow Data</h3>
                      <p className="text-gray-600">{state.contextError.message}</p>
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
                    ref={state.chatInputRef}
                    type="text"
                    value={state.chatInputValue}
                    onChange={(e) => state.setChatInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && state.chatInputValue.trim()) {
                        state.sendMessage(state.chatInputValue.trim());
                        state.setChatInputValue('');
                      }
                    }}
                    placeholder={state.config.chat?.placeholder || 'Type a message...'}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={() => {
                      if (state.chatInputValue.trim()) {
                        state.sendMessage(state.chatInputValue.trim());
                        state.setChatInputValue('');
                      }
                    }}
                    disabled={!state.chatInputValue.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
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
                {renderArtifact()}
              </div>
            )}
          </div>

          {/* Metrics Slide-Up Overlay */}
          {state.showMetricsSlideup && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fade-in"
                onClick={() => state.toggleMetricsSlideup(false)}
              />
              <div
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 animate-slide-up"
                style={{ height: '30vh' }}
              >
                <CustomerMetrics
                  customerId={customerId}
                  isOpen={true}
                  onToggle={() => state.toggleMetricsSlideup(false)}
                />
              </div>
            </>
          )}

          {/* Skip/Snooze Confirmation Modal */}
          {state.confirmationModal.type && state.confirmationModal.stepIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {state.confirmationModal.type === 'skip' ? 'Skip This Step?' : 'Snooze This Step?'}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {state.confirmationModal.type === 'skip'
                    ? `Are you sure you want to skip "${state.slides[state.confirmationModal.stepIndex]?.label}"? This step will be removed from your workflow.`
                    : `Are you sure you want to snooze "${state.slides[state.confirmationModal.stepIndex]?.label}"? It will reappear in your next workflow session.`}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => state.setConfirmationModal({ type: null, stepIndex: null })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (state.confirmationModal.type === 'skip') {
                        state.skipStep(state.confirmationModal.stepIndex!);
                      } else {
                        state.snoozeStep(state.confirmationModal.stepIndex!);
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      state.confirmationModal.type === 'skip'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {state.confirmationModal.type === 'skip' ? 'Skip Step' : 'Snooze Step'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TaskModeContext.Provider>
  );
}
