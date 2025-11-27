import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '@/components/workflows/sections/ChatRenderer';
import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

/**
 * Fetch LLM-generated greeting from server API
 */
async function fetchGreetingFromAPI(params: {
  customerName: string;
  workflowPurpose?: string;
  slideId?: string;
  fallbackGreeting?: string;
}): Promise<{ text: string; toolsUsed: string[]; tokensUsed: number }> {
  const response = await fetch('/api/workflows/greeting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Greeting API failed: ${response.status}`);
  }

  return response.json();
}

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
  customerName: string;
  workflowPurpose?: string;
}

export function useChatState({
  currentSlide,
  currentSlideIndex,
  setWorkflowState,
  goToNextSlide,
  goToPreviousSlide,
  onClose,
  handleComplete,
  customerName,
  workflowPurpose = 'renewal_preparation',
}: UseChatStateProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingLLM, setIsGeneratingLLM] = useState(false);

  // Track the last slide index to detect slide changes
  const lastSlideIndexRef = useRef<number>(currentSlideIndex);

  // Execute branch actions - MUST be defined before handleBranchNavigation
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
            console.log('[useChatState] Enter step:', stepNumber);
          }
          break;

        case 'launch-artifact':
        case 'showArtifact':
          if (artifactId) {
            console.log('[useChatState] Show artifact:', artifactId);
          }
          break;

        case 'removeArtifact':
          console.log('[useChatState] Remove artifact');
          break;

        case 'closeWorkflow':
          console.log('[useChatState] closeWorkflow action triggered - calling onClose()');
          onClose();
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

  // Branch navigation handler - async to support LLM calls on button click
  const handleBranchNavigation = useCallback(async (branchName: string, value?: any) => {
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

    // Check if this is the "proceed" branch on greeting slide with LLM enabled
    // This is the "Let's Begin" button - trigger LLM here instead of on page load
    const isGreetingProceed = branchName === 'proceed' &&
                              currentSlide?.id === 'greeting' &&
                              currentSlide?.chat?.generateInitialMessage;

    if (isGreetingProceed && customerName) {
      console.log('[useChatState] "Let\'s Begin" clicked - triggering LLM greeting for:', customerName);
      setIsGeneratingLLM(true);

      // Show loading message immediately
      const loadingMessage: ChatMessage = {
        id: `ai-loading-${Date.now()}`,
        text: `Let me review ${customerName}'s account...`,
        sender: 'ai',
        timestamp: new Date(),
        isLoading: true,
      };
      setChatMessages(prev => [...prev, loadingMessage]);

      try {
        // Call LLM API with INTEL tools
        const generated = await fetchGreetingFromAPI({
          customerName,
          workflowPurpose,
          slideId: currentSlide.id,
          fallbackGreeting: branch.response,
        });

        console.log('[useChatState] LLM generated:', generated.text);
        console.log('[useChatState] Tools used:', generated.toolsUsed);

        // Replace loading message with LLM response
        setChatMessages(prev => {
          const withoutLoading = prev.filter(m => !m.isLoading);
          return [...withoutLoading, {
            id: `ai-${Date.now()}-llm`,
            text: generated.text,
            sender: 'ai',
            timestamp: new Date(),
            buttons: branch.buttons,
          }];
        });
      } catch (error) {
        console.error('[useChatState] LLM greeting failed:', error);
        // Fall back to static response
        setChatMessages(prev => {
          const withoutLoading = prev.filter(m => !m.isLoading);
          return [...withoutLoading, {
            id: `ai-${Date.now()}-fallback`,
            text: branch.response,
            sender: 'ai',
            timestamp: new Date(),
            buttons: branch.buttons,
          }];
        });
      } finally {
        setIsGeneratingLLM(false);
      }

      setCurrentBranch(branchName);

      // Execute branch actions after LLM response
      if (branch.actions) {
        executeBranchActions(branch.actions, branch.artifactId, branch.stepId, branch.stepNumber);
      }

      return; // Don't continue with normal branch handling
    }

    // Normal branch handling (non-LLM)
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
  }, [currentSlide, setWorkflowState, customerName, workflowPurpose, executeBranchActions]);

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
  // Shows STATIC greeting on page load - LLM is triggered by "Let's Begin" button click (no hydration issues)
  useEffect(() => {
    if (!currentSlide) return;

    const slideChanged = lastSlideIndexRef.current !== currentSlideIndex;
    const isFirstSlide = currentSlideIndex === 0;

    // Reset branch for new slide
    setCurrentBranch(null);

    // DEBUG: Log slide config to see what we're getting
    console.log('[useChatState] DEBUG - currentSlide:', {
      id: currentSlide.id,
      slideIndex: currentSlideIndex,
      isFirstSlide,
      hasChat: !!currentSlide.chat,
      generateInitialMessage: currentSlide.chat?.generateInitialMessage,
      customerName,
      note: 'LLM greeting will be triggered on "Let\'s Begin" button click, not page load',
    });

    // Build new messages for this slide transition (synchronous - no LLM call on page load)
    const buildMessages = () => {
      let newMessages: ChatMessage[] = [];

      // If this is a slide change (not initial load), preserve history
      if (slideChanged && chatMessages.length > 0 && !isFirstSlide) {
        // Mark all existing messages as historical
        const historicalMessages = chatMessages.map(msg => ({
          ...msg,
          isHistorical: true,
          // Remove buttons from historical messages to prevent interaction
          buttons: undefined,
          // Remove components from historical messages
          component: undefined,
        }));

        // Add a separator between slides
        const separator: ChatMessage = {
          id: `separator-${currentSlideIndex}`,
          text: currentSlide.title || currentSlide.label || `Step ${currentSlideIndex + 1}`,
          sender: 'ai',
          timestamp: new Date(),
          isSlideSeparator: true,
          slideId: currentSlide.id,
        };

        newMessages = [...historicalMessages, separator];
      }

      // Add initial message for new slide - ALWAYS use static text (no LLM on page load)
      // LLM greeting is triggered when user clicks "Let's Begin" button
      if (currentSlide.chat?.initialMessage) {
        const initialMessage: ChatMessage = {
          id: `ai-initial-${currentSlideIndex}`,
          text: currentSlide.chat.initialMessage.text, // Always static - LLM on button click
          sender: 'ai',
          timestamp: new Date(),
          component: currentSlide.chat.initialMessage.component,
          buttons: currentSlide.chat.initialMessage.buttons,
          slideId: currentSlide.id,
        };

        // For first slide, show with delay
        if (isFirstSlide && newMessages.length === 0) {
          setTimeout(() => {
            setChatMessages([initialMessage]);
          }, 500);
          return; // Exit early, will be set by timeout
        }

        newMessages = [...newMessages, initialMessage];
      }

      setChatMessages(newMessages);
    };

    // Execute the message builder (synchronous now - no async LLM call)
    buildMessages();

    // Update the last slide index tracker
    lastSlideIndexRef.current = currentSlideIndex;

    // Set initial branch if component present
    if (currentSlide.chat?.initialMessage?.component) {
      setCurrentBranch('initial');
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
    isGeneratingLLM,
    setChatInputValue,
    handleBranchNavigation,
    handleSendMessage,
    handleComponentValueChange,
  };
}
