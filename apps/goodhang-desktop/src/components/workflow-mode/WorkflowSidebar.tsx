/**
 * Workflow Sidebar Component
 *
 * Unified left panel containing step progress, chat messages, and input.
 * Replaces SetupSidebar with a wider, more feature-rich implementation.
 */

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  useWorkflowMode,
  useWorkflowUI,
  useWorkflowChat,
  useWorkflowStepActions,
} from '@/lib/contexts';
import { ChatInput } from '@/components/chat';
import { ChatPanel } from './ChatPanel';
import { ProgressFooter } from './ProgressFooter';
import { StepActionModals } from './StepActionModals';
import { LAYOUT_CONFIG } from '@/lib/config';
import type { WorkflowSidebarProps, WorkflowStep } from '@/lib/types/workflow';

// =============================================================================
// RESIZE HANDLE
// =============================================================================

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  onResizeEnd: () => void;
}

function ResizeHandle({ onResize, onResizeEnd }: ResizeHandleProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = moveEvent.clientX - startX.current;
        startX.current = moveEvent.clientX;
        onResize(delta);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        onResizeEnd();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onResize, onResizeEnd]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors group"
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 -mr-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-6 bg-blue-500 rounded-full" />
      </div>
    </div>
  );
}

// =============================================================================
// STEP LIST HEADER
// =============================================================================

interface StepListHeaderProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
}

function StepListHeader({ steps, currentStepIndex }: StepListHeaderProps) {
  const activeStep = steps[currentStepIndex];
  const completedSteps = steps.slice(0, currentStepIndex);

  return (
    <div className="border-b border-gh-dark-700 p-3">
      {/* Completed steps - compact horizontal chips */}
      {completedSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {completedSteps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 rounded text-xs text-green-400"
              title={step.label}
            >
              <Check className="w-3 h-3" />
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Active step - expanded with description */}
      {activeStep && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium text-white">
            {currentStepIndex + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">{activeStep.label}</div>
            {activeStep.description && (
              <div className="text-xs text-gray-400">{activeStep.description}</div>
            )}
          </div>
          {/* Step counter */}
          <span className="text-xs text-gray-500">
            {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// UPCOMING STEPS FOOTER
// =============================================================================

interface UpcomingStepsFooterProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
}

function UpcomingStepsFooter({ steps, currentStepIndex }: UpcomingStepsFooterProps) {
  const upcomingSteps = steps.slice(currentStepIndex + 1);

  if (upcomingSteps.length === 0) return null;

  return (
    <div className="border-t border-gh-dark-700 p-3">
      <div className="text-xs text-gray-500 mb-2">Up next</div>
      <div className="space-y-1">
        {upcomingSteps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center gap-2 px-2 py-1 text-gray-500"
          >
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gh-dark-600 flex items-center justify-center text-xs">
              {currentStepIndex + 2 + index}
            </div>
            <span className="text-sm">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WorkflowSidebar({ className, expandToFill = false }: WorkflowSidebarProps) {
  const { workflowState, onReset } = useWorkflowMode();
  const {
    sidebarWidth,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarWidth,
    sidebarRef,
  } = useWorkflowUI();

  const {
    inputValue,
    isLoading,
    setInputValue,
    sendMessage,
  } = useWorkflowChat();

  const {
    stepActionMenu,
    activeModal,
    snoozeStep,
    skipStep,
    closeModal,
  } = useWorkflowStepActions();

  const steps = workflowState?.steps ?? [];

  // Calculate progress
  const requiredSteps = steps.filter((s) => s.required);
  const completedRequired = requiredSteps.filter((s) => s.status === 'completed').length;
  const progress = requiredSteps.length > 0
    ? (completedRequired / requiredSteps.length) * 100
    : 0;
  const canUnlock = requiredSteps.every((s) => s.status === 'completed');

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
    }
  }, [inputValue, isLoading, sendMessage]);

  const handleResize = useCallback(
    (delta: number) => {
      setSidebarWidth(sidebarWidth + delta);
    },
    [sidebarWidth, setSidebarWidth]
  );

  const handleSnoozeConfirm = useCallback(
    (until: Date, reason?: string) => {
      if (stepActionMenu.stepId) {
        snoozeStep(stepActionMenu.stepId, until, reason);
      }
    },
    [stepActionMenu.stepId, snoozeStep]
  );

  const handleSkipConfirm = useCallback(
    (reason: string) => {
      if (stepActionMenu.stepId) {
        skipStep(stepActionMenu.stepId, reason);
      }
    },
    [stepActionMenu.stepId, skipStep]
  );

  // Get current step index for the header
  const currentStepIndex = steps.findIndex(s => s.status === 'in_progress');

  // Determine width: expand to fill, collapsed, or fixed width
  const getWidth = () => {
    if (sidebarCollapsed) return LAYOUT_CONFIG.sidebar.collapsedWidth;
    if (expandToFill) return '100%';
    return sidebarWidth;
  };

  return (
    <>
      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{
          width: getWidth(),
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={`relative h-full bg-gh-dark-800 border-r border-gh-dark-700 flex flex-col overflow-hidden ${className ?? ''}`}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-gh-dark-700 border border-gh-dark-600 rounded-r-lg flex items-center justify-center hover:bg-gh-dark-600 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Collapsed state */}
        {sidebarCollapsed && (
          <div className="flex-1 flex flex-col items-center py-4 gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed'
                    ? 'bg-green-500'
                    : step.status === 'in_progress'
                    ? 'bg-blue-500'
                    : 'bg-gh-dark-600'
                }`}
                title={step.label}
              >
                <span className="text-xs text-white">{index + 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expanded state */}
        {!sidebarCollapsed && (
          <>
            {/* Header with step list */}
            <div className="flex-shrink-0">
              <StepListHeader
                steps={steps}
                currentStepIndex={currentStepIndex >= 0 ? currentStepIndex : 0}
              />
            </div>

            {/* Chat panel - this is the ONLY scrollable area */}
            <ChatPanel className="flex-1 min-h-0 overflow-y-auto" />

            {/* Chat input - fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gh-dark-700">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                disabled={isLoading}
                placeholder="Type your message..."
                sendButtonColor="blue"
              />
            </div>

            {/* Upcoming steps - shows what's next */}
            <div className="flex-shrink-0">
              <UpcomingStepsFooter
                steps={steps}
                currentStepIndex={currentStepIndex >= 0 ? currentStepIndex : 0}
              />
            </div>

            {/* Progress footer - fixed at bottom */}
            <div className="flex-shrink-0">
              <ProgressFooter
                progress={progress}
                canUnlock={canUnlock}
                onReset={onReset}
              />
            </div>

            {/* Resize handle */}
            <ResizeHandle
              onResize={handleResize}
              onResizeEnd={() => {}}
            />
          </>
        )}
      </motion.div>

      {/* Action modals */}
      <StepActionModals
        isSnoozeOpen={activeModal === 'snooze'}
        isSkipOpen={activeModal === 'skip'}
        stepId={stepActionMenu.stepId}
        onSnoozeConfirm={handleSnoozeConfirm}
        onSkipConfirm={handleSkipConfirm}
        onClose={closeModal}
      />
    </>
  );
}

export default WorkflowSidebar;
