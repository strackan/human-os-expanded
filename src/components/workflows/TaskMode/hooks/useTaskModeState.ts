import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { ChatMessage } from '@/components/workflows/sections/ChatRenderer';
import { getWorkflowConfig } from '@/config/workflows';
import { useWorkflowContext } from '@/lib/data-providers';
import { useToast } from '@/components/ui/ToastProvider';
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence';
import { fromSerializableMessage } from '@/lib/persistence/types';

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
  executionId?: string; // For state persistence
  userId?: string; // For state persistence
  onClose: (completed?: boolean) => void;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };
  prefetchedGreeting?: string; // LLM greeting prefetched during launch
}

export function useTaskModeState({
  workflowId,
  customerId,
  customerName,
  executionId,
  userId,
  onClose,
  sequenceInfo,
  prefetchedGreeting
}: UseTaskModeStateProps) {
  // Debug: Log props on every render
  console.log('[useTaskModeState] Received props:', {
    workflowId,
    customerId,
    executionId,
    prefetchedGreeting: prefetchedGreeting ? prefetchedGreeting.substring(0, 30) + '...' : null,
  });

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
  const [skippedSlides, setSkippedSlides] = useState<Set<number>>(new Set());
  const [snoozedSlides, setSnoozedSlides] = useState<Set<number>>(new Set());
  const [workflowState, setWorkflowState] = useState<Record<string, any>>({});

  // Get current slide from config
  const currentSlide = config?.slides?.[currentSlideIndex] ?? null;
  const slides = config?.slides || [];

  // ============================================================
  // UI STATE
  // ============================================================

  const [_greetingText, _setGreetingText] = useState('');
  const [_showButtons, _setShowButtons] = useState(false);
  const [_metricsExpanded, setMetricsExpanded] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50);
  const [_isResizing, _setIsResizing] = useState(false);
  // Reserved for future use
  void _greetingText; void _setGreetingText;
  void _showButtons; void _setShowButtons;
  void _metricsExpanded;
  void _isResizing; void _setIsResizing;
  const [isArtifactResizing, setIsArtifactResizing] = useState(false);
  const [showPlaysDropdown, setShowPlaysDropdown] = useState(false);
  const [showMetricsSlideup, setShowMetricsSlideup] = useState(false);
  const [stepActionMenu, setStepActionMenu] = useState<number | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    type: 'skip' | 'snooze' | null;
    stepIndex: number | null;
  }>({ type: null, stepIndex: null });
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);

  // LLM Prefetch state for splash slide
  const prefetchedGreetingRef = useRef<{ text: string; ready: boolean } | null>(null);
  const prefetchPromiseRef = useRef<Promise<void> | null>(null);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  // ============================================================
  // CHAT STATE
  // ============================================================

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // STATE PERSISTENCE
  // ============================================================

  // Track whether we're currently restoring state (to prevent auto-save during restore)
  const [isRestoringState, setIsRestoringState] = useState(true);
  const hasRestoredRef = useRef(false);

  // Persistence hook
  const {
    loadState,
    saveState,
    saveStateImmediate,
    isReady: isPersistenceReady,
  } = useWorkflowPersistence({
    executionId,
    userId,
    enabled: !!executionId && !!userId,
  });

  // Restore state on mount (when persistence is ready)
  useEffect(() => {
    if (!isPersistenceReady || hasRestoredRef.current) {
      return;
    }

    const restoreState = async () => {
      console.log('[useTaskModeState] Attempting to restore saved state...');
      const savedState = await loadState();

      if (savedState) {
        console.log('[useTaskModeState] Restoring saved state:', {
          slideIndex: savedState.currentSlideIndex,
          completedCount: savedState.completedSlides.length,
          messageCount: savedState.chatMessages.length,
        });

        // Restore navigation state
        setCurrentSlideIndex(savedState.currentSlideIndex);
        setCompletedSlides(new Set(savedState.completedSlides));
        setSkippedSlides(new Set(savedState.skippedSlides));

        // Restore workflow data
        setWorkflowState(savedState.workflowData || {});

        // Restore chat messages (convert from serializable format)
        if (savedState.chatMessages && savedState.chatMessages.length > 0) {
          const restoredMessages = savedState.chatMessages.map(fromSerializableMessage);
          setChatMessages(restoredMessages);
        }

        // Restore branch state
        setCurrentBranch(savedState.currentBranch);

        // Note: "Resuming your progress..." toast is shown in TaskModeFullscreen
        // when detecting resumable execution, so we don't show a duplicate here
      } else {
        console.log('[useTaskModeState] No saved state found, starting fresh');
      }

      hasRestoredRef.current = true;
      setIsRestoringState(false);
    };

    restoreState();
  }, [isPersistenceReady, loadState, showToast]);

  // Auto-save when state changes (debounced via persistence service)
  useEffect(() => {
    // Don't save while restoring or if persistence isn't ready
    if (isRestoringState || !isPersistenceReady) {
      return;
    }

    // Don't save if we haven't actually loaded yet
    if (!hasRestoredRef.current) {
      return;
    }

    console.log('[useTaskModeState] Auto-saving state...');
    saveState({
      currentSlideIndex,
      completedSlides,
      skippedSlides,
      workflowState,
      chatMessages,
      currentBranch,
    });
  }, [
    currentSlideIndex,
    completedSlides,
    skippedSlides,
    workflowState,
    chatMessages,
    currentBranch,
    isRestoringState,
    isPersistenceReady,
    saveState,
  ]);

  // ============================================================
  // NAVIGATION HANDLERS
  // ============================================================

  // Helper: Get the next non-snoozed/non-skipped slide
  const getNextAvailableSlide = useCallback(() => {
    let nextIndex = currentSlideIndex + 1;
    while (nextIndex < slides.length && (skippedSlides.has(nextIndex) || snoozedSlides.has(nextIndex))) {
      nextIndex++;
    }
    return nextIndex < slides.length ? { index: nextIndex, slide: slides[nextIndex] } : null;
  }, [currentSlideIndex, slides, skippedSlides, snoozedSlides]);

  // Helper: Get the previous non-snoozed/non-skipped slide
  const getPreviousAvailableSlide = useCallback(() => {
    let prevIndex = currentSlideIndex - 1;
    while (prevIndex >= 0 && (skippedSlides.has(prevIndex) || snoozedSlides.has(prevIndex))) {
      prevIndex--;
    }
    return prevIndex >= 0 ? { index: prevIndex, slide: slides[prevIndex] } : null;
  }, [currentSlideIndex, slides, skippedSlides, snoozedSlides]);

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      // Find the next slide that hasn't been skipped or snoozed
      let nextIndex = currentSlideIndex + 1;
      while (nextIndex < slides.length && (skippedSlides.has(nextIndex) || snoozedSlides.has(nextIndex))) {
        nextIndex++;
      }

      // If we found a valid slide, navigate to it
      if (nextIndex < slides.length) {
        setCompletedSlides(prev => new Set(prev).add(nextIndex));
        setCurrentSlideIndex(nextIndex);
        setMetricsExpanded(false);
      } else {
        // All remaining slides are skipped/snoozed, complete the workflow
        showToast({
          message: 'Workflow complete!',
          type: 'success',
          icon: 'check',
          duration: 3000
        });
        setTimeout(() => onClose(true), 100);
      }
    } else {
      // Already at the last slide, complete workflow
      setCompletedSlides(prev => new Set(prev).add(currentSlideIndex));
      setMetricsExpanded(false);
    }
  }, [currentSlideIndex, slides.length, skippedSlides, snoozedSlides, showToast, onClose]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      // Find the previous slide that hasn't been skipped or snoozed
      let prevIndex = currentSlideIndex - 1;
      while (prevIndex >= 0 && (skippedSlides.has(prevIndex) || snoozedSlides.has(prevIndex))) {
        prevIndex--;
      }

      // If we found a valid previous slide, navigate to it
      if (prevIndex >= 0) {
        setCurrentSlideIndex(prevIndex);
      }
    }
  }, [currentSlideIndex, skippedSlides, snoozedSlides]);

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
    // Open the snooze modal to configure triggers
    console.log('[useTaskModeState] handleSnooze called - opening modal');
    setIsSnoozeModalOpen(true);
  }, []);

  const closeSnoozeModal = useCallback(() => {
    console.log('[useTaskModeState] closeSnoozeModal called');
    setIsSnoozeModalOpen(false);
  }, []);

  const handleEscalate = useCallback(() => {
    // Open the escalate modal to configure escalation
    console.log('[useTaskModeState] handleEscalate called - opening modal');
    setIsEscalateModalOpen(true);
  }, []);

  const closeEscalateModal = useCallback(() => {
    console.log('[useTaskModeState] closeEscalateModal called');
    setIsEscalateModalOpen(false);
  }, []);

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

  const handleClose = useCallback(async () => {
    // Force save state before closing
    if (isPersistenceReady && hasRestoredRef.current) {
      console.log('[useTaskModeState] Force saving before close...');
      await saveStateImmediate({
        currentSlideIndex,
        completedSlides,
        skippedSlides,
        workflowState,
        chatMessages,
        currentBranch,
      });
    }
    onClose();
  }, [
    onClose,
    isPersistenceReady,
    saveStateImmediate,
    currentSlideIndex,
    completedSlides,
    skippedSlides,
    workflowState,
    chatMessages,
    currentBranch,
  ]);

  const skipStep = useCallback((stepIndex: number) => {
    console.log('[TaskMode] Skip step:', stepIndex);
    setSkippedSlides(prev => new Set(prev).add(stepIndex));
    setConfirmationModal({ type: null, stepIndex: null });

    // Show toast confirmation
    showToast({
      message: `Step "${slides[stepIndex]?.title || `#${stepIndex + 1}`}" skipped!`,
      type: 'success',
      icon: 'check',
      duration: 3000
    });

    // If we're on the skipped step, advance to next
    if (currentSlideIndex === stepIndex) {
      goToNextSlide();
    }
  }, [slides, showToast, currentSlideIndex, goToNextSlide]);

  const snoozeStep = useCallback((stepIndex: number) => {
    console.log('[TaskMode] Snooze step:', stepIndex);
    setSnoozedSlides(prev => new Set(prev).add(stepIndex));
    setConfirmationModal({ type: null, stepIndex: null });

    // Show toast confirmation
    showToast({
      message: `Step "${slides[stepIndex]?.title || `#${stepIndex + 1}`}" snoozed! I'll remind you later.`,
      type: 'info',
      icon: 'clock',
      duration: 3000
    });

    // If we're on the snoozed step, advance to next
    if (currentSlideIndex === stepIndex) {
      goToNextSlide();
    }
  }, [slides, showToast, currentSlideIndex, goToNextSlide]);

  // ============================================================
  // CHAT HANDLERS
  // ============================================================

  const handleBranchNavigation = useCallback((branchName: string, value?: any) => {
    // Get branch from current slide
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
  }, [currentSlide, config]);

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
          console.log('[useTaskModeState] closeWorkflow action triggered - calling onClose(true) for confetti');
          onClose(true); // Pass true to trigger confetti on completion
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

        case 'triggerConfetti':
          console.log('[Action] Triggering confetti');
          // Confetti is triggered via the confetti library
          if (typeof window !== 'undefined') {
            import('canvas-confetti').then(confettiModule => {
              const confetti = confettiModule.default || confettiModule;
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
            });
          }
          break;

        case 'prefetchLLM':
          console.log('[Action] Starting LLM prefetch');
          // Start the LLM fetch in the background
          if (!prefetchPromiseRef.current) {
            prefetchPromiseRef.current = fetchGreetingFromAPI({
              customerName: customerName || (config as any)?.customer || 'Customer',
              workflowPurpose: (config as any)?.type || 'renewal_preparation',
            }).then(response => {
              prefetchedGreetingRef.current = { text: response.text, ready: true };
              console.log('[Action] LLM prefetch complete');
            }).catch(error => {
              console.error('[Action] LLM prefetch failed:', error);
              prefetchedGreetingRef.current = { text: "Let's get started!", ready: true };
            });
          }
          break;

        case 'nextSlideWhenReady':
          console.log('[Action] Waiting for LLM then advancing');
          // Wait for prefetch to complete (with timeout), then advance
          const waitForPrefetch = async () => {
            const startTime = Date.now();
            const maxWait = 10000; // 10 second timeout (LLM calls can take 5-8s)
            const minDelay = 1500; // Minimum 1.5s for nice UX

            // Wait for prefetch to complete or timeout
            while (!prefetchedGreetingRef.current?.ready && Date.now() - startTime < maxWait) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Ensure minimum delay for good UX
            const elapsed = Date.now() - startTime;
            if (elapsed < minDelay) {
              await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
            }

            console.log('[Action] Advancing to next slide');
            goToNextSlide();
          };
          waitForPrefetch();
          break;

        default:
          console.warn('[Action] Unknown action:', action);
      }
    }
  }, [goToNextSlide, goToPreviousSlide, handleComplete, onClose, config, customerName]);

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
    console.log('[useTaskModeState] handleButtonClick called with value:', buttonValue);

    // Handle common actions first
    if (buttonValue === 'snooze') {
      console.log('[useTaskModeState] Button value is "snooze" - calling handleSnooze');
      handleSnooze();
      return;
    } else if (buttonValue === 'skip') {
      handleSkip();
      return;
    }

    // Check current branch's nextBranches first (for buttons within branch flows)
    if (currentBranch && currentSlide?.chat?.branches?.[currentBranch]?.nextBranches) {
      const branchNextBranches = currentSlide.chat.branches[currentBranch].nextBranches;
      const nextBranch = branchNextBranches?.[buttonValue];
      if (nextBranch) {
        console.log('[useTaskModeState] Branch nextBranches - navigating to:', nextBranch);
        handleBranchNavigation(nextBranch);
        return;
      }
    }

    // Check currentSlide initialMessage.nextBranches for branch navigation
    if (currentSlide?.chat?.initialMessage?.nextBranches) {
      const nextBranch = currentSlide.chat.initialMessage.nextBranches[buttonValue];
      if (nextBranch) {
        console.log('[useTaskModeState] Slide initialMessage - navigating to branch:', nextBranch);
        handleBranchNavigation(nextBranch);
        return;
      }
    }

    // Legacy: 'start' navigates to next slide
    if (buttonValue === 'start') {
      goToNextSlide();
    }
  }, [goToNextSlide, handleSnooze, handleSkip, currentSlide, currentBranch, handleBranchNavigation]);

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

  // Track previous slide index to detect slide changes
  const prevSlideIndexRef = useRef<number>(-1);

  // Initialize/update chat messages when slide changes (CONTINUOUS CHAT)
  useEffect(() => {
    if (!currentSlide) return;

    // Check if this is actually a new slide (not just a re-render)
    const isNewSlide = prevSlideIndexRef.current !== currentSlideIndex;
    const isFirstSlide = currentSlideIndex === 0 && prevSlideIndexRef.current === -1;

    if (!isNewSlide && !isFirstSlide) {
      return; // No slide change, don't modify chat
    }

    // Update the ref for next comparison
    prevSlideIndexRef.current = currentSlideIndex;

    // Reset branch state for new slide
    setCurrentBranch(null);

    // Add initial message if present
    if (currentSlide.chat?.initialMessage) {
      // Check if this is the greeting slide (or first slide with LLM generation) and we have a prefetched greeting
      const isGreetingSlide = currentSlide.id === 'greeting' || currentSlide.chat?.generateInitialMessage;

      // Check for external prefetched greeting (from DashboardClient) OR internal prefetch ref
      const hasExternalPrefetch = prefetchedGreeting && currentSlideIndex === 0;
      const hasInternalPrefetch = prefetchedGreetingRef.current?.ready && prefetchedGreetingRef.current?.text;
      const hasPrefetchedGreeting = hasExternalPrefetch || hasInternalPrefetch;

      // Debug logging for prefetch
      console.log('[Chat Init] Slide:', currentSlide.id, 'Index:', currentSlideIndex, 'isNewSlide:', isNewSlide);
      console.log('[Chat Init] isGreetingSlide:', isGreetingSlide, 'hasExternalPrefetch:', hasExternalPrefetch);
      console.log('[Chat Init] prefetchedGreeting prop:', prefetchedGreeting ? prefetchedGreeting.substring(0, 50) + '...' : 'null');

      // Use prefetched greeting if available for greeting slide, otherwise use config text
      let messageText = currentSlide.chat.initialMessage.text;
      if (isGreetingSlide && hasPrefetchedGreeting) {
        if (hasExternalPrefetch) {
          messageText = prefetchedGreeting!;
          console.log('[Chat Init] Using external prefetched LLM greeting');
        } else if (hasInternalPrefetch) {
          messageText = prefetchedGreetingRef.current!.text;
          console.log('[Chat Init] Using internal prefetched LLM greeting');
        }
      }

      // Default buttons for greeting slide if none provided
      const defaultGreetingButtons = [
        {
          label: "Let's Begin",
          value: 'start',
          'label-background': 'bg-blue-600',
          'label-text': 'text-white'
        },
        {
          label: 'Snooze',
          value: 'snooze',
          'label-background': 'bg-gray-500',
          'label-text': 'text-white'
        },
      ];

      // Use slide buttons, or default buttons for first slide (greeting)
      const messageButtons = currentSlide.chat.initialMessage.buttons
        || (isFirstSlide ? defaultGreetingButtons : undefined);

      const initialMessage: ChatMessage = {
        id: `ai-initial-${currentSlideIndex}-${Date.now()}`,
        text: messageText,
        sender: 'ai',
        timestamp: new Date(),
        component: currentSlide.chat.initialMessage.component,
        buttons: messageButtons
      };

      // For the first slide, start fresh. For subsequent slides, append to existing chat.
      if (isFirstSlide) {
        // First slide - start with empty chat, then add message
        if (!hasPrefetchedGreeting) {
          // Apply typing animation delay if no prefetch
          setTimeout(() => {
            setChatMessages([initialMessage]);
          }, 500);
        } else {
          setChatMessages([initialMessage]);
        }
      } else {
        // Subsequent slides - add a divider and the new slide's message (CONTINUOUS CHAT)
        const dividerMessage: ChatMessage = {
          id: `divider-${currentSlideIndex}-${Date.now()}`,
          text: `───── ${currentSlide.title || currentSlide.label || 'Next Step'} ─────`,
          sender: 'system',
          timestamp: new Date(),
          isDivider: true,
        };

        setChatMessages(prev => [...prev, dividerMessage, initialMessage]);
      }

      // Set initial branch if component present
      if (currentSlide.chat.initialMessage.component) {
        setCurrentBranch('initial');
      }

      // Clear internal prefetched greeting after use
      if (isGreetingSlide && hasInternalPrefetch) {
        prefetchedGreetingRef.current = null;
      }
    }
  }, [currentSlideIndex, currentSlide, prefetchedGreeting, customer, customerName, chatMessages.length]);

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

  // Debug: Log snooze modal state changes
  useEffect(() => {
    console.log('[useTaskModeState] isSnoozeModalOpen changed to:', isSnoozeModalOpen);
  }, [isSnoozeModalOpen]);

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
    skippedSlides,
    snoozedSlides,
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
    getNextAvailableSlide,
    getPreviousAvailableSlide,

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

    // Snooze Modal
    isSnoozeModalOpen,
    closeSnoozeModal,

    // Escalate Modal
    isEscalateModalOpen,
    handleEscalate,
    closeEscalateModal,

    // Direct state setters for syncing with external sources
    setSnoozedSlides,
    setSkippedSlides,
  };
}
