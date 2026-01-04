'use client';

/**
 * StepContainer - Collapsible accordion item for a workflow step
 *
 * Contains:
 * - StepHeader (always visible)
 * - StepMessages (when expanded)
 * - StepInput (when expanded and active)
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { StepHeader } from './StepHeader';
import { StepMessages } from './StepMessages';
import { StepInput } from './StepInput';
import type { StepContainerProps } from '../../types/step-chat';

export function StepContainer({
  step,
  isCurrentStep,
  onExpand,
  onCollapse,
  onPin,
  onUnpin,
  onTitleChange,
  onSendMessage,
  onButtonClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBranchNavigation: _onBranchNavigation,
  onComponentValueChange,
  actionContext,
  onActionSuccess,
}: StepContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState('');

  const isExpanded = step.expansionState === 'expanded' || step.expansionState === 'pinned';
  const isPinned = step.expansionState === 'pinned';
  const isActive = step.status === 'active';

  // Auto-scroll to this container when it becomes the current step
  useEffect(() => {
    if (isCurrentStep && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isCurrentStep]);

  // Focus input when step becomes active and expanded
  useEffect(() => {
    if (isActive && isExpanded && inputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, isExpanded]);

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      onCollapse();
    } else {
      onExpand();
    }
  }, [isExpanded, onExpand, onCollapse]);

  const handleTogglePin = useCallback(() => {
    if (isPinned) {
      onUnpin();
    } else {
      onPin();
    }
  }, [isPinned, onPin, onUnpin]);

  const handleSendMessage = useCallback(() => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, onSendMessage]);

  // Determine border styling based on state
  const borderClass = isCurrentStep
    ? 'border-l-2 border-l-blue-400'
    : step.status === 'success'
    ? 'border-l-2 border-l-green-400'
    : step.status === 'snoozed'
    ? 'border-l-2 border-l-purple-300'
    : 'border-l-2 border-l-transparent';

  return (
    <div
      ref={contentRef}
      className={`border-b border-gray-100 ${borderClass} transition-colors`}
    >
      {/* Header - always visible */}
      <StepHeader
        step={step}
        isExpanded={isExpanded}
        isPinned={isPinned}
        onToggle={handleToggle}
        onTogglePin={handleTogglePin}
        onTitleChange={onTitleChange}
        isCurrentStep={isCurrentStep}
        actionContext={actionContext}
        onActionSuccess={onActionSuccess}
      />

      {/* Collapsible content */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          {/* Messages */}
          <StepMessages
            messages={step.messages}
            onButtonClick={onButtonClick}
            onComponentValueChange={onComponentValueChange}
            isActive={isActive}
          />

          {/* Input - only shown when this step is active */}
          {isActive && (
            <StepInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSendMessage}
              inputRef={inputRef}
              isGenerating={false} // TODO: Pass from props
              placeholder="Type a message..."
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default StepContainer;
