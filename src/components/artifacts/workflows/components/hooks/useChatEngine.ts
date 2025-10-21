import { useState, useEffect, useRef, useCallback } from 'react';
import { ConversationEngine, ConversationAction } from '../../utils/conversationEngine';
import { VariableContext } from '../../utils/variableSubstitution';
import { ChatConfig, WorkflowConfig } from '../../config/WorkflowConfig';
import { Message } from './useChatMessages';

interface UseChatEngineProps {
  config: ChatConfig;
  user: any;
  workflowConfig?: WorkflowConfig;
  sidePanelConfig?: any;
  slideKey?: string | number;
  onArtifactAction?: (action: ConversationAction) => void;
  onAddMessage: (message: Message) => void;
}

/**
 * useChatEngine Hook
 *
 * Manages the conversation engine lifecycle:
 * - Engine initialization with variable context
 * - Initial message handling
 * - Branch navigation
 * - Engine reset
 */
export function useChatEngine({
  config,
  user,
  workflowConfig,
  sidePanelConfig,
  slideKey,
  onArtifactAction,
  onAddMessage
}: UseChatEngineProps) {
  const [conversationEngine, setConversationEngine] = useState<ConversationEngine | null>(null);
  const initialMessageShownRef = useRef(false);

  // Initialize conversation engine when in dynamic mode
  useEffect(() => {
    console.log('useChatEngine: useEffect TRIGGERED');

    // Reset initialMessage tracking when slide changes
    initialMessageShownRef.current = false;

    console.log('useChatEngine: Initializing with config:', {
      mode: config.mode,
      hasDynamicFlow: !!config.dynamicFlow,
      hasUser: !!user,
      customerName: workflowConfig?.customer?.name,
      slideKey: slideKey,
      initialMessageShown: initialMessageShownRef.current,
      configKeys: Object.keys(config),
      dynamicFlowKeys: config.dynamicFlow ? Object.keys(config.dynamicFlow) : 'NO DYNAMIC FLOW'
    });

    if (config.mode === 'dynamic' && config.dynamicFlow) {
      // Guard: Wait for user auth to complete before initializing
      if (!user) {
        console.log('useChatEngine: Waiting for user authentication to complete...');
        return;
      }

      // Create variable context from user and workflow config
      const variableContext: VariableContext = {
        user: user,
        customer: workflowConfig ? {
          name: workflowConfig.customer.name,
          primaryContact: workflowConfig.customerOverview?.metrics?.primaryContact,
          arr: workflowConfig.customerOverview?.metrics?.arr,
          renewalDate: workflowConfig.customerOverview?.metrics?.renewalDate,
          ...workflowConfig.customerOverview
        } : undefined
      };

      console.log('useChatEngine: Creating ConversationEngine with variableContext:', variableContext);
      const engine = new ConversationEngine(config.dynamicFlow, (action) => {
        console.log('useChatEngine: Action callback triggered:', action);
        if (onArtifactAction) {
          onArtifactAction(action);
        }
      }, variableContext);
      setConversationEngine(engine);

      // Show initial message ONLY if not already shown for this slide
      const initialMessage = engine.getInitialMessage();
      console.log('useChatEngine: getInitialMessage result:', {
        hasInitialMessage: !!initialMessage,
        initialMessageText: initialMessage?.text,
        startsWith: config.dynamicFlow.startsWith,
        hasFlowInitialMessage: !!config.dynamicFlow.initialMessage
      });

      if (initialMessage && !initialMessageShownRef.current) {
        console.log('useChatEngine: Showing initialMessage for first time (Step 0)');
        initialMessageShownRef.current = true;
        // Add initial message via callback
        setTimeout(() => {
          onAddMessage({
            id: Date.now(),
            text: initialMessage.text,
            sender: 'ai',
            timestamp: new Date(),
            type: initialMessage.buttons ? 'buttons' : 'text',
            buttons: initialMessage.buttons
          });
        }, 500);
      } else if (!initialMessage && !initialMessageShownRef.current && sidePanelConfig?.steps?.[0]) {
        // No initialMessage (Step 0) - auto-advance to Step 1's branch
        console.log('useChatEngine: No initialMessage, auto-advancing to Step 1:', sidePanelConfig.steps[0].workflowBranch);
        initialMessageShownRef.current = true;

        setTimeout(() => {
          const step1Branch = sidePanelConfig.steps[0].workflowBranch;
          const response = engine.processBranch(step1Branch);

          if (response) {
            onAddMessage({
              id: Date.now(),
              text: response.text,
              sender: 'ai',
              timestamp: new Date(),
              type: response.buttons ? 'buttons' : 'text',
              buttons: response.buttons
            });
          }
        }, 500);
      }
    }
  }, [config.mode, config.dynamicFlow, user, workflowConfig, sidePanelConfig, slideKey, onArtifactAction, onAddMessage]);

  const resetEngine = useCallback(() => {
    console.log('useChatEngine: Resetting engine');
    if (conversationEngine) {
      conversationEngine.reset();
    }
  }, [conversationEngine]);

  const navigateToBranch = useCallback((branchId: string, showResponseCallback: (response: any, onArtifactAction?: (action: any) => void) => void) => {
    console.log('useChatEngine: Navigating to branch:', branchId);
    console.log('useChatEngine: conversationEngine available?', !!conversationEngine);
    if (conversationEngine) {
      console.log('useChatEngine: Processing branch with conversationEngine');
      const response = conversationEngine.processBranch(branchId);
      console.log('useChatEngine: Branch response:', response);
      if (response) {
        console.log('useChatEngine: Calling showResponse with:', { text: response.text, hasButtons: !!response.buttons, actions: response.actions });
        showResponseCallback(response, onArtifactAction);
      } else {
        console.error('useChatEngine: No response from processBranch for branchId:', branchId);
      }
    } else {
      console.error('useChatEngine: conversationEngine not available for navigateToBranch');
    }
  }, [conversationEngine, onArtifactAction]);

  const processBranch = useCallback((branchId: string) => {
    if (conversationEngine) {
      return conversationEngine.processBranch(branchId);
    }
    return null;
  }, [conversationEngine]);

  return {
    conversationEngine,
    resetEngine,
    navigateToBranch,
    processBranch
  };
}
