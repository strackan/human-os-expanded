'use client';

/**
 * StepChatPanel - Container for all collapsible step containers
 *
 * Features:
 * - Scrollable list of step containers
 * - Resizable width (280-450px)
 * - Drag handle for resizing
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { StepContainer } from './StepContainer';
import type { StepChatPanelProps } from '../../types/step-chat';
import { DEFAULT_STEP_CHAT_LAYOUT } from '../../types/step-chat';

export function StepChatPanel({
  stepGroups,
  currentStepIndex,
  onExpandStep,
  onCollapseStep,
  onTogglePin,
  onTitleChange,
  onSendMessage,
  onButtonClick,
  onBranchNavigation,
  onComponentValueChange,
  // Props reserved for future use (input moved to StepContainer)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chatInputValue: _chatInputValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChatInputChange: _onChatInputChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chatInputRef: _chatInputRef,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isGeneratingLLM: _isGeneratingLLM,
  panelWidth,
  onPanelWidthChange,
  actionContext,
  onActionSuccess,
}: StepChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const { minWidth, maxWidth } = DEFAULT_STEP_CHAT_LAYOUT;

  // Handle resize dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      onPanelWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, onPanelWidthChange]);

  // Scroll to current step on mount or when it changes
  useEffect(() => {
    const currentStepElement = panelRef.current?.querySelector(
      `[data-step-index="${currentStepIndex}"]`
    );
    if (currentStepElement) {
      currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStepIndex]);

  return (
    <div
      ref={panelRef}
      className="flex h-full bg-white border-r border-gray-200"
      style={{ width: panelWidth }}
    >
      {/* Steps container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Steps</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {stepGroups.filter((s) => s.status === 'success').length} of {stepGroups.length} complete
          </p>
        </div>

        {/* Scrollable steps list */}
        <div className="flex-1 overflow-y-auto">
          {stepGroups.map((step) => (
            <div key={step.stepIndex} data-step-index={step.stepIndex}>
              <StepContainer
                step={step}
                isCurrentStep={step.stepIndex === currentStepIndex}
                onExpand={() => onExpandStep(step.stepIndex)}
                onCollapse={() => onCollapseStep(step.stepIndex)}
                onPin={() => onTogglePin(step.stepIndex)}
                onUnpin={() => onTogglePin(step.stepIndex)}
                onTitleChange={(title) => onTitleChange(step.stepIndex, title)}
                onSendMessage={onSendMessage}
                onButtonClick={onButtonClick}
                onBranchNavigation={onBranchNavigation}
                onComponentValueChange={onComponentValueChange}
                actionContext={actionContext}
                onActionSuccess={onActionSuccess}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Resize handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className={`w-1 flex-shrink-0 cursor-col-resize flex items-center justify-center
                    hover:bg-blue-200 transition-colors group
                    ${isResizing ? 'bg-blue-300' : 'bg-gray-100'}`}
      >
        <div
          className={`opacity-0 group-hover:opacity-100 transition-opacity
                      ${isResizing ? 'opacity-100' : ''}`}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

export default StepChatPanel;
