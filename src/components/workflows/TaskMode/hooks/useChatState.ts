import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '@/components/workflows/sections/ChatRenderer';
import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * useChatState - Manages chat messages, branches, and conversation flow
 *
 * Manages:
 * - Chat message history
 * - Conversation branch navigation
 * - Chat input value
 * - Message sending/receiving
 * - Component value changes
 *
 * Extracted from useTaskModeState.ts (lines 105-511)
 */

interface UseChatStateProps {
  currentSlide: WorkflowSlide | null;
  currentSlideIndex: number;
  workflowState: Record<string, any>;
  setWorkflowState: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  goToNextSlide: () => void;
  goToPreviousSlide: () => void;
  onClose: () => void;
  handleComplete: () => void;
}

export function useChatState({
  currentSlide,
  currentSlideIndex,
  setWorkflowState,
  goToNextSlide,
  goToPreviousSlide,
  onClose,
  handleComplete,
}: UseChatStateProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Branch navigation handler
  const handleBranchNavigation = useCallback((branchName: string, value?: any) => {
    const branch = currentSlide?.chat?.branches?.[branchName];
    if (!branch) {
      console.warn('[useChatState] Branch not found:', branchName);
      return;
    }

    // Store value if storeAs is specified
    if (value !== undefined && 'storeAs' in branch && branch.storeAs) {
      console.log(`[useChatState] Storing value "${value}" with key "${branch.storeAs}"`);
      setWorkflowState(prev => ({
        ...prev,
        [branch.storeAs!]: value
      }));
    }

    // Add AI response message
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}-${branchName}`,
      text: branch.response,
      sender: 'ai',
      timestamp: new Date(),
      component: branch.component,
      buttons: branch.buttons
    };

    // Apply delay if specified
    if (branch.predelay) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, aiMessage]);
      }, branch.predelay * 1000);
    } else {
      setChatMessages(prev => [...prev, aiMessage]);
    }

    setCurrentBranch(branchName);

    // Execute branch actions
    if (branch.actions) {
      executeBranchActions(branch.actions, branch.artifactId, branch.stepId, branch.stepNumber);
    }

    // Auto-advance to next branch if specified
    if (branch.autoAdvance) {
      const nextBranch = typeof branch.autoAdvance === 'string' ? branch.autoAdvance : branch.nextBranch;
      if (nextBranch) {
        const delay = branch.delay || 1;
        setTimeout(() => {
          handleBranchNavigation(nextBranch);
        }, delay * 1000);
      }
    }
  }, [currentSlide, setWorkflowState]);

  // Execute branch actions
  const executeBranchActions = useCallback((
    actions: string[],
    artifactId?: string,
    stepId?: string,
    stepNumber?: number
  ) => {
    for (const action of actions) {
      switch (action) {
        case 'nextSlide':
        case 'goToNextSlide':
          goToNextSlide();
          break;

        case 'previousSlide':
        case 'goToPreviousSlide':
          goToPreviousSlide();
          break;

        case 'completeStep':
          if (stepId) {
            console.log('[useChatState] Complete step:', stepId);
          }
          break;

        case 'enterStep':
          if (stepNumber !== undefined) {
            // Note: Would need setCurrentSlideIndex from parent
            console.log('[useChatState] Enter step:', stepNumber);
          }
          break;

        case 'launch-artifact':
        case 'showArtifact':
          if (artifactId) {
            // Note: Would need setShowArtifacts from parent
            console.log('[useChatState] Show artifact:', artifactId);
          }
          break;

        case 'removeArtifact':
          // Note: Would need setShowArtifacts from parent
          console.log('[useChatState] Remove artifact');
          break;

        case 'closeWorkflow':
          console.log('[useChatState] closeWorkflow action triggered - calling onClose(true) for confetti');
          onClose(true);
          break;

        case 'exitTaskMode':
          onClose();
          break;

        case 'nextCustomer':
          handleComplete();
          break;

        case 'resetChat':
          setChatMessages([]);
          setCurrentBranch(null);
          break;

        default:
          console.warn('[useChatState] Unknown action:', action);
      }
    }
  }, [goToNextSlide, goToPreviousSlide, handleComplete, onClose]);

  // Send message handler
  const handleSendMessage = useCallback((message: string) => {
    // Add user message to history
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Config-driven text response routing
    if (currentBranch && currentSlide?.chat?.branches) {
      const branch = currentSlide.chat.branches[currentBranch];

      if ('nextBranchOnText' in branch && branch.nextBranchOnText) {
        handleBranchNavigation(branch.nextBranchOnText, message);
        return;
      }
    }

    // Check for userTriggers pattern matching
    if (currentSlide?.chat?.userTriggers) {
      for (const [pattern, branchName] of Object.entries(currentSlide.chat.userTriggers)) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(message)) {
          handleBranchNavigation(branchName, message);
          return;
        }
      }
    }

    // If no trigger matched, show default message
    if (currentSlide?.chat?.defaultMessage) {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: currentSlide.chat.defaultMessage,
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }
  }, [currentBranch, currentSlide, handleBranchNavigation]);

  // Component value change handler
  const handleComponentValueChange = useCallback((componentId: string, value: any) => {
    // Format the value for display
    let displayValue = value;
    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else if (typeof value === 'object') {
      displayValue = JSON.stringify(value);
    } else {
      displayValue = String(value);
    }

    // Add user's submitted value as a message
    const userMessage: ChatMessage = {
      id: `user-component-${Date.now()}`,
      text: displayValue,
      sender: 'user',
      timestamp: new Date(),
      componentValue: value
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Handle branch navigation
    if (currentBranch) {
      const branch = currentSlide?.chat?.branches?.[currentBranch];

      // Store value if storeAs is specified
      if (branch && 'storeAs' in branch && branch.storeAs) {
        console.log(`[useChatState] Storing component value "${value}" with key "${branch.storeAs}"`);
        setWorkflowState(prev => ({
          ...prev,
          [branch.storeAs!]: value
        }));
      }

      // Navigate to nextBranch or currentBranch
      if (branch && 'nextBranch' in branch && branch.nextBranch) {
        console.log(`[useChatState] Navigating to nextBranch: ${branch.nextBranch}`);
        handleBranchNavigation(branch.nextBranch, value);
      } else {
        console.log(`[useChatState] Navigating to currentBranch: ${currentBranch}`);
        handleBranchNavigation(currentBranch, value);
      }
    }
  }, [currentBranch, currentSlide, handleBranchNavigation, setWorkflowState]);

  // Initialize chat messages when slide changes
  useEffect(() => {
    if (!currentSlide) return;

    // Reset chat for new slide
    setChatMessages([]);
    setCurrentBranch(null);

    // Add initial message if present
    if (currentSlide.chat?.initialMessage) {
      const initialMessage: ChatMessage = {
        id: `ai-initial-${currentSlideIndex}`,
        text: currentSlide.chat.initialMessage.text,
        sender: 'ai',
        timestamp: new Date(),
        component: currentSlide.chat.initialMessage.component,
        buttons: currentSlide.chat.initialMessage.buttons
      };

      // Apply typing animation delay for first slide only
      if (currentSlideIndex === 0) {
        setTimeout(() => {
          setChatMessages([initialMessage]);
        }, 500);
      } else {
        setChatMessages([initialMessage]);
      }

      // Set initial branch if component present
      if (currentSlide.chat.initialMessage.component) {
        setCurrentBranch('initial');
      }
    }
  }, [currentSlideIndex, currentSlide]);

  // Auto-focus input when new messages expect text response
  useEffect(() => {
    if (chatMessages.length === 0) return;

    const lastMessage = chatMessages[chatMessages.length - 1];

    // Focus input if last message is from AI and doesn't have a component or buttons
    const needsTextInput = lastMessage.sender === 'ai' &&
                          !lastMessage.component &&
                          !lastMessage.buttons;

    if (needsTextInput && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [chatMessages]);

  return {
    chatMessages,
    currentBranch,
    chatInputValue,
    chatInputRef,
    setChatInputValue,
    handleBranchNavigation,
    handleSendMessage,
    handleComponentValueChange,
  };
}
