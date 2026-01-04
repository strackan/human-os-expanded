/**
 * ChatStep Component
 *
 * Phase 3G: Chat Integration UI
 * Workflow step that provides chat interface for LLM interaction
 */

'use client';

import React from 'react';
import { StepComponentProps } from '../StepRenderer';
import { ChatPanel } from '../chat';

interface ChatStepProps extends StepComponentProps {
  systemPrompt?: string;
  workflowId?: string;
  stepId?: string;
}

export const ChatStep: React.FC<ChatStepProps> = ({
  executionId,
  data = {},
  onDataChange,
  onComplete,
  systemPrompt = 'You are a helpful CSM assistant. Help the user with their workflow tasks.'
}) => {
  // Extract workflow and step IDs from data or use defaults
  const workflowId = data.workflowId || 'default-workflow';
  const stepId = data.stepId || 'chat-step';

  // For now, use executionId as both workflow and step execution IDs
  // In production, these would come from the workflow execution context
  const workflowExecutionId = data.workflowExecutionId || executionId;
  const stepExecutionId = data.stepExecutionId || `${executionId}-chat`;

  return (
    <div className="h-[600px] flex flex-col">
      {/* Chat Panel */}
      <ChatPanel
        workflowExecutionId={workflowExecutionId}
        stepExecutionId={stepExecutionId}
        workflowId={workflowId}
        stepId={stepId}
        systemPrompt={systemPrompt}
        className="flex-1"
      />

      {/* Complete Button (optional - can be removed if chat is the entire step) */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
        >
          Complete Step
        </button>
      </div>
    </div>
  );
};
