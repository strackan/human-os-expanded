import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { ChatMessage } from '@/components/workflows/sections/ChatRenderer';
import { getWorkflowConfig } from '@/config/workflows';
import { useWorkflowContext } from '@/lib/data-providers';
import { useToast } from '@/components/ui/ToastProvider';

/**
 * useTaskModeState - Centralized state management for TaskMode
 *
 * This hook manages ALL state and business logic for the TaskMode workflow.
 * It's extracted from the monolithic TaskModeFullscreen-v3 component.
 *
 * Returns state + handlers that are exposed through TaskModeContext.
 */

interface UseTaskModeStateProps {
  workflowId: string;
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

export function useTaskModeState({
  workflowId,
  customerId,
  customerName,
  onClose,
  sequenceInfo
}: UseTaskModeStateProps) {
  const { showToast } = useToast();

  // ============================================================
  // WORKFLOW CONFIG & CONTEXT
  // ============================================================

  const [config, setConfig] = useState<WorkflowConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Load workflow context from database
  const {
    customer,
    expansionData,
    stakeholders,
    loading: contextLoading,
    error: contextError
  } = useWorkflowContext(workflowId, customerId);

  // Load workflow config on mount
  useEffect(() => {
    const loadedConfig = getWorkflowConfig(workflowId);

    if (!loadedConfig) {
      setConfigError(`No configuration found for workflow: ${workflowId}`);
      console.error('[TaskMode] Config not found:', workflowId);
    } else {
      setConfig(loadedConfig);
      console.log('[TaskMode] Loaded config for:', workflowId, loadedConfig);
    }
  }, [workflowId]);

  // ============================================================
  // CORE WORKFLOW STATE
  // ============================================================

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(new Set([0]));
  const [workflowState, setWorkflowState] = useState<Record<string, any>>({});

  // Get current slide from config
  const currentSlide = config?.slides?.[currentSlideIndex] ?? null;
  const slides = config?.slides || [];

  // ============================================================
  // UI STATE
  // ============================================================

  const [greetingText, setGreetingText] = useState('');
  const [showButtons, setShowButtons] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [isArtifactResizing, setIsArtifactResizing] = useState(false);
  const [showPlaysDropdown, setShowPlaysDropdown] = useState(false);
  const [showMetricsSlideup, setShowMetricsSlideup] = useState(false);
  const [stepActionMenu, setStepActionMenu] = useState<number | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    type: 'skip' | 'snooze' | null;
    stepIndex: number | null;
  }>({ type: null, stepIndex: null });

  // ============================================================
  // CHAT STATE
  // ============================================================

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // NAVIGATION HANDLERS
  // ============================================================

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      setCompletedSlides(prev => new Set(prev).add(nextIndex));
      setCurrentSlideIndex(nextIndex);
      setMetricsExpanded(false);
    }
  }, [currentSlideIndex, slides.length]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex]);

  const goToSlide = useCallback((index: number) => {
    if (completedSlides.has(index)) {
      setCurrentSlideIndex(index);
    }
  }, [completedSlides]);

  // ============================================================
  // WORKFLOW LIFECYCLE HANDLERS
  // ============================================================

  const handleComplete = useCallback(() => {
    const message = sequenceInfo
      ? 'Workflow complete! Loading next workflow...'
      : 'Workflow complete!';

    showToast({
      message,
      type: 'success',
      icon: 'check',
      duration: 3000
    });

    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        onClose(true); // Pass true to indicate completion
      }
    }, 1500);
  }, [sequenceInfo, onClose, showToast]);

  const handleSnooze = useCallback(() => {
    showToast({
      message: "No problem, I'll remind you in a few days.",
      type: 'info',
      icon: 'clock',
      duration: 3000
    });

    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        onClose();
      }
    }, 1500);
  }, [sequenceInfo, onClose, showToast]);

  const handleSkip = useCallback(() => {
    showToast({
      message: 'Workflow skipped. Moving to next workflow.',
      type: 'info',
      icon: 'none',
      duration: 3000
    });

    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        onClose();
      }
    }, 1500);
  }, [sequenceInfo, onClose, showToast]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const skipStep = useCallback((stepIndex: number) => {
    console.log('[TaskMode] Skip step:', stepIndex);
    setConfirmationModal({ type: null, stepIndex: null });
    // TODO: Implement step skip logic
  }, []);

  const snoozeStep = useCallback((stepIndex: number) => {
    console.log('[TaskMode] Snooze step:', stepIndex);
    setConfirmationModal({ type: null, stepIndex: null });
    // TODO: Implement step snooze logic
  }, []);

  // ============================================================
  // CHAT HANDLERS
  // ============================================================

  const handleBranchNavigation = useCallback((branchName: string, value?: any) => {
    const branch = currentSlide?.chat?.branches?.[branchName];
    if (!branch) {
      console.warn('[ChatRenderer] Branch not found:', branchName);
      return;
    }

    // Store value if storeAs is specified
    if (value !== undefined && 'storeAs' in branch && branch.storeAs) {
      console.log(`[handleBranchNavigation] Storing value "${value}" with key "${branch.storeAs}"`);
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
  }, [currentSlide]);

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
            console.log('[Action] Complete step:', stepId);
          }
          break;

        case 'enterStep':
          if (stepNumber !== undefined) {
            setCurrentSlideIndex(stepNumber);
          }
          break;

        case 'launch-artifact':
        case 'showArtifact':
          if (artifactId) {
            setShowArtifacts(true);
            console.log('[Action] Show artifact:', artifactId);
          }
          break;

        case 'removeArtifact':
          setShowArtifacts(false);
          break;

        case 'closeWorkflow':
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
          console.warn('[Action] Unknown action:', action);
      }
    }
  }, [goToNextSlide, goToPreviousSlide, handleComplete, onClose]);

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
        console.log(`[handleComponentValueChange] Storing component value "${value}" with key "${branch.storeAs}"`);
        setWorkflowState(prev => ({
          ...prev,
          [branch.storeAs!]: value
        }));
      }

      // Navigate to nextBranch or currentBranch
      if (branch && 'nextBranch' in branch && branch.nextBranch) {
        console.log(`[handleComponentValueChange] Navigating to nextBranch: ${branch.nextBranch}`);
        handleBranchNavigation(branch.nextBranch, value);
      } else {
        console.log(`[handleComponentValueChange] Navigating to currentBranch: ${currentBranch}`);
        handleBranchNavigation(currentBranch, value);
      }
    }
  }, [currentBranch, currentSlide, handleBranchNavigation]);

  const handleButtonClick = useCallback((buttonValue: string) => {
    if (buttonValue === 'start') {
      goToNextSlide();
    } else if (buttonValue === 'snooze') {
      handleSnooze();
    } else if (buttonValue === 'skip') {
      handleSkip();
    }
  }, [goToNextSlide, handleSnooze, handleSkip]);

  // ============================================================
  // ARTIFACT HANDLERS
  // ============================================================

  const updateWorkflowState = useCallback((key: string, value: any) => {
    setWorkflowState(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArtifacts = useCallback((show: boolean) => {
    setShowArtifacts(show);
  }, []);

  // ============================================================
  // HEADER HANDLERS
  // ============================================================

  const toggleMetricsSlideup = useCallback((show: boolean) => {
    setShowMetricsSlideup(show);
  }, []);

  const togglePlaysDropdown = useCallback((show: boolean) => {
    setShowPlaysDropdown(show);
  }, []);

  // ============================================================
  // EFFECTS
  // ============================================================

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

  // Auto-hide/show artifacts based on current slide and branch
  useEffect(() => {
    if (!currentSlide) return;

    const hasVisibleArtifacts = currentSlide.artifacts?.sections &&
      currentSlide.artifacts.sections.length > 0 &&
      currentSlide.artifacts.sections.some(section => {
        if (section.visible === false) return false;

        // Check if this artifact has a showWhenBranch condition
        const showWhenBranch = section.data?.showWhenBranch;
        if (showWhenBranch) {
          return currentBranch === showWhenBranch;
        }

        return true;
      });

    setShowArtifacts(hasVisibleArtifacts);
  }, [currentSlideIndex, currentSlide, currentBranch]);

  // ============================================================
  // RETURN STATE & HANDLERS
  // ============================================================

  return {
    // Config & Context
    config,
    configError,
    customer,
    expansionData,
    stakeholders,
    contextLoading,
    contextError,

    // State
    currentSlide,
    slides,
    currentSlideIndex,
    completedSlides,
    workflowState,
    chatMessages,
    chatInputValue,
    showArtifacts,
    currentBranch,
    customerName,
    artifactsPanelWidth,
    isArtifactResizing,
    showMetricsSlideup,
    showPlaysDropdown,
    stepActionMenu,
    confirmationModal,
    chatInputRef,

    // Navigation
    goToNextSlide,
    goToPreviousSlide,
    goToSlide,

    // Chat
    sendMessage: handleSendMessage,
    handleButtonClick,
    handleBranchNavigation,
    setChatInputValue,
    handleComponentValueChange,

    // Artifacts
    toggleArtifacts,
    updateWorkflowState,
    setArtifactsPanelWidth,
    setIsArtifactResizing,

    // Header
    toggleMetricsSlideup,
    togglePlaysDropdown,
    setStepActionMenu,

    // Lifecycle
    handleComplete,
    handleSnooze,
    handleSkip,
    handleClose,
    skipStep,
    snoozeStep,
    setConfirmationModal,
  };
}
