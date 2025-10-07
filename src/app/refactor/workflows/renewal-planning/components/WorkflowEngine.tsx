'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowConfig } from '../configs/types';
import { ChatPanel, Message, Button } from './ChatPanel';
import { ArtifactPanel, Artifact } from './ArtifactPanel';
import { injectVariables, injectVariablesIntoObject } from '../utils/VariableInjector';
import { executeActions, ActionContext, ActionCallbacks } from '../utils/ActionHandler';

/**
 * WorkflowEngine Component
 *
 * The core engine that interprets workflow configs and renders the UI.
 * Handles:
 * - Config interpretation
 * - Variable injection
 * - Chat flow management
 * - Action execution
 * - Artifact display
 *
 * Phase 2: Config-driven workflow system
 * - Reads workflow config
 * - No hardcoded workflow logic
 * - Works with any config structure
 */

interface WorkflowEngineProps {
  config: WorkflowConfig;
  variables: any; // Customer data and context
  currentStepIndex: number; // Controlled from parent
  onStepChange: (index: number) => void; // Callback to notify parent
  executionId: string | null; // Phase 3.2: Workflow execution tracking
}

export function WorkflowEngine({
  config,
  variables,
  currentStepIndex,
  onStepChange,
  executionId
}: WorkflowEngineProps) {

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [buttons, setButtons] = useState<Button[]>([]);

  // Artifact state
  const [visibleArtifactId, setVisibleArtifactId] = useState<string | null>(null);

  // Current branch (tracks which branch we're in)
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);

  // Get current step
  const currentStep = config.steps[currentStepIndex];

  // Phase 3.2: Send progress event to backend
  const sendProgressEvent = async (params: {
    stepId: string;
    stepIndex: number;
    stepTitle: string;
    stepType?: string;
    branchValue?: string;
    action?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!executionId) {
      console.warn('No executionId - skipping progress tracking');
      return;
    }

    try {
      const response = await fetch(`/api/workflows/executions/${executionId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send progress event:', errorData.error);
        return;
      }

      const data = await response.json();
      console.log('Progress event sent:', data);
      return data;

    } catch (error) {
      console.error('Error sending progress event:', error);
    }
  };

  // Initialize with initial message when step changes
  useEffect(() => {
    if (!currentStep) return;

    // Inject variables into initial message
    const initialText = injectVariables(
      currentStep.chat.initialMessage.text,
      variables
    );

    // Set initial message
    setMessages([
      {
        id: 1,
        role: 'ai',
        text: initialText
      }
    ]);

    // Set initial buttons
    setButtons(currentStep.chat.initialMessage.buttons);

    // Reset branch and artifact
    setCurrentBranch(null);
    setVisibleArtifactId(null);
  }, [currentStepIndex, config]);

  // Handle button click
  const handleButtonClick = async (value: string) => {
    const branch = currentStep.chat.branches[value];

    if (!branch) {
      console.warn(`Branch '${value}' not found in config`);
      return;
    }

    // Phase 3.2: Send progress event (record branch selection)
    await sendProgressEvent({
      stepId: currentStep.id,
      stepIndex: currentStepIndex,
      stepTitle: currentStep.title,
      stepType: currentStep.type,
      branchValue: value,
      action: 'recordBranch'
    });

    // Add user message (use button label as message text)
    const buttonLabel = buttons.find((b) => b.value === value)?.label || value;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'user',
        text: buttonLabel
      }
    ]);

    // Add AI response after short delay
    setTimeout(() => {
      const responseText = injectVariables(branch.response, variables);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: responseText
        }
      ]);

      // Execute actions
      if (branch.actions && branch.actions.length > 0) {
        const actionContext: ActionContext = {
          artifactId: branch.artifactId,
          data: branch
        };

        const actionCallbacks: ActionCallbacks = {
          onShowArtifact: (artifactId) => {
            setVisibleArtifactId(artifactId);
          },
          onHideArtifact: () => {
            setVisibleArtifactId(null);
          },
          onNextStep: async () => {
            // Phase 3.2: Send completion event
            await sendProgressEvent({
              stepId: currentStep.id,
              stepIndex: currentStepIndex,
              stepTitle: currentStep.title,
              stepType: currentStep.type,
              action: 'completeStep'
            });

            // Move to next step if available
            if (currentStepIndex < config.steps.length - 1) {
              onStepChange(currentStepIndex + 1);
            }
          },
          onPreviousStep: () => {
            // Move to previous step if available
            if (currentStepIndex > 0) {
              onStepChange(currentStepIndex - 1);
            }
          }
        };

        executeActions(branch.actions, actionContext, actionCallbacks);
      }

      // Update buttons to branch's buttons
      setButtons(branch.buttons || []);
      setCurrentBranch(value);
    }, 300);
  };

  // Get current artifact to display
  const getCurrentArtifact = (): Artifact | null => {
    if (!visibleArtifactId) return null;

    const artifactConfig = currentStep.artifacts.find(
      (a) => a.id === visibleArtifactId
    );

    if (!artifactConfig) return null;

    // Inject variables into artifact
    return {
      title: injectVariables(artifactConfig.title, variables),
      type: artifactConfig.type as 'contract' | 'email' | 'checklist',
      data: injectVariablesIntoObject(artifactConfig.data, variables)
    };
  };

  const currentArtifact = getCurrentArtifact();

  return (
    <div className="flex h-full">
      {/* Left: Chat Panel */}
      <div className="w-1/2">
        <ChatPanel
          messages={messages}
          buttons={buttons}
          onButtonClick={handleButtonClick}
        />
      </div>

      {/* Right: Artifact Panel */}
      <div className="w-1/2">
        <ArtifactPanel artifact={currentArtifact} visible={!!currentArtifact} />
      </div>
    </div>
  );
}
