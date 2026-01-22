/**
 * useWorkflowModeState Hook
 *
 * Centralized state management for the workflow mode layout.
 * Handles navigation, chat, step actions, UI state, and persistence.
 *
 * Adapted from renubu's useTaskModeState pattern.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type {
  UseWorkflowModeStateOptions,
  UseWorkflowModeStateReturn,
  WorkflowState,
  WorkflowStep,
  WorkflowMessage,
  WorkflowChatState,
  WorkflowLoadingState,
  WorkflowNavigationState,
  WorkflowUIState,
  WorkflowModeActions,
  StepActionType,
} from '@/lib/types/workflow';
import type { QuickAction, LoadingStage } from '@/lib/types/shared';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SIDEBAR_WIDTH = 340;
const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 450;
const DEFAULT_ARTIFACT_WIDTH = 400;
const DEFAULT_LOADING_STAGES: LoadingStage[] = [
  { message: 'Processing...', duration: 800 },
  { message: 'Almost there...', duration: 600 },
];

// =============================================================================
// HOOK
// =============================================================================

export function useWorkflowModeState(
  options: UseWorkflowModeStateOptions
): UseWorkflowModeStateReturn {
  const {
    workflowId,
    steps: initialSteps,
    initialStepIndex = 0,
    onStepComplete,
    onStepChange,
    onWorkflowComplete,
    onMessage,
    onReset,
    onInitialize,
    persistenceKey = 'workflow-mode',
    autoSave = true,
    autoSaveDelay = 500,
  } = options;

  // =============================================================================
  // REFS
  // =============================================================================

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const hasRestoredRef = useRef(false);
  const hasCalledInitializeRef = useRef(false);
  const wasStateRestoredRef = useRef(false);  // Track if state was loaded from localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // =============================================================================
  // STATE - Steps
  // =============================================================================

  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [completedStepIndices, setCompletedStepIndices] = useState<Set<number>>(new Set());
  const [skippedStepIndices, setSkippedStepIndices] = useState<Set<number>>(new Set());
  const [snoozedStepIndices, setSnoozedStepIndices] = useState<Set<number>>(new Set());
  const [workflowData, setWorkflowData] = useState<Record<string, unknown>>({});

  // =============================================================================
  // STATE - Chat
  // =============================================================================

  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, _setIsStreaming] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);

  // =============================================================================
  // STATE - Loading
  // =============================================================================

  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>(DEFAULT_LOADING_STAGES);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const loadingAbortRef = useRef(false);

  // =============================================================================
  // STATE - UI
  // =============================================================================

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [artifactPanelWidth, setArtifactPanelWidth] = useState(DEFAULT_ARTIFACT_WIDTH);
  const [artifactPanelCollapsed, setArtifactPanelCollapsed] = useState(true);
  const [isResizing, _setIsResizing] = useState(false);
  const [stepActionMenu, setStepActionMenu] = useState<{
    stepId: string | null;
    action: StepActionType | null;
  }>({ stepId: null, action: null });
  const [activeModal, setActiveModal] = useState<'snooze' | 'skip' | null>(null);

  // =============================================================================
  // STATE - Initialization
  // =============================================================================

  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // =============================================================================
  // COMPUTED STATE
  // =============================================================================

  const currentStep = useMemo(() => steps[currentStepIndex] ?? null, [steps, currentStepIndex]);

  const navigationState: WorkflowNavigationState = useMemo(() => ({
    currentStepIndex,
    currentStep,
    canGoBack: currentStepIndex > 0,
    canGoForward: currentStepIndex < steps.length - 1,
    completedStepIndices,
    skippedStepIndices,
    snoozedStepIndices,
  }), [currentStepIndex, currentStep, steps.length, completedStepIndices, skippedStepIndices, snoozedStepIndices]);

  const chatState: WorkflowChatState = useMemo(() => ({
    messages,
    inputValue,
    isLoading,
    isStreaming,
    quickActions,
  }), [messages, inputValue, isLoading, isStreaming, quickActions]);

  const loadingProgress = useMemo(() => {
    if (!loadingActive) return 0;
    return ((loadingStage + 1) / loadingStages.length) * 100;
  }, [loadingActive, loadingStage, loadingStages.length]);

  const loadingState: WorkflowLoadingState = useMemo(() => ({
    isActive: loadingActive,
    currentStage: loadingStage,
    currentMessage: loadingMessage,
    progress: loadingProgress,
    stages: loadingStages,
  }), [loadingActive, loadingStage, loadingMessage, loadingProgress, loadingStages]);

  const uiState: WorkflowUIState = useMemo(() => ({
    sidebarWidth,
    sidebarCollapsed,
    artifactPanelWidth,
    artifactPanelCollapsed,
    isResizing,
    stepActionMenu,
    activeModal,
  }), [sidebarWidth, sidebarCollapsed, artifactPanelWidth, artifactPanelCollapsed, isResizing, stepActionMenu, activeModal]);

  const workflowState: WorkflowState | null = useMemo(() => {
    if (!isInitialized) return null;
    return {
      workflowId,
      executionId: `${workflowId}-${Date.now()}`,
      currentStepIndex,
      steps,
      chatMessages: messages,
      workflowData,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      status: 'in_progress',
    };
  }, [isInitialized, workflowId, currentStepIndex, steps, messages, workflowData]);

  // =============================================================================
  // HELPERS
  // =============================================================================

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const getNextAvailableStep = useCallback((): number | null => {
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
      if (!snoozedStepIndices.has(i) && !skippedStepIndices.has(i)) {
        return i;
      }
    }
    return null;
  }, [currentStepIndex, steps.length, snoozedStepIndices, skippedStepIndices]);

  const getPreviousAvailableStep = useCallback((): number | null => {
    for (let i = currentStepIndex - 1; i >= 0; i--) {
      if (!snoozedStepIndices.has(i) && !skippedStepIndices.has(i)) {
        return i;
      }
    }
    return null;
  }, [currentStepIndex, snoozedStepIndices, skippedStepIndices]);

  // =============================================================================
  // NAVIGATION ACTIONS
  // =============================================================================

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return;

    const previousIndex = currentStepIndex;
    setCurrentStepIndex(index);

    // Update step status
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === index ? 'in_progress' :
              completedStepIndices.has(i) ? 'completed' :
              skippedStepIndices.has(i) ? 'skipped' :
              snoozedStepIndices.has(i) ? 'snoozed' :
              i < index ? 'pending' :
              step.required && i > index ? 'locked' : step.status,
    })));

    // Add step divider message
    const targetStep = steps[index];
    if (targetStep && index !== previousIndex) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStepDivider: true,
      }]);
    }

    onStepChange?.(previousIndex, index);
    scrollToBottom();
  }, [currentStepIndex, steps, completedStepIndices, skippedStepIndices, snoozedStepIndices, onStepChange, scrollToBottom]);

  const goToNextStep = useCallback(() => {
    const next = getNextAvailableStep();
    if (next !== null) goToStep(next);
  }, [getNextAvailableStep, goToStep]);

  const goToPreviousStep = useCallback(() => {
    const prev = getPreviousAvailableStep();
    if (prev !== null) goToStep(prev);
  }, [getPreviousAvailableStep, goToStep]);

  // =============================================================================
  // STEP ACTIONS
  // =============================================================================

  const completeStep = useCallback((stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    setCompletedStepIndices(prev => new Set([...prev, stepIndex]));
    setSteps(prev => prev.map((step, i) =>
      i === stepIndex ? { ...step, status: 'completed' } : step
    ));

    // Store completion marker if defined
    const step = steps[stepIndex];
    if (step?.completionKey) {
      localStorage.setItem(step.completionKey, new Date().toISOString());
    }

    onStepComplete?.(stepId);

    // Check if workflow is complete
    const requiredSteps = steps.filter(s => s.required);
    const allRequiredComplete = requiredSteps.every(s =>
      completedStepIndices.has(steps.indexOf(s)) || s.id === stepId
    );
    if (allRequiredComplete) {
      onWorkflowComplete?.();
    }
  }, [steps, completedStepIndices, onStepComplete, onWorkflowComplete]);

  const snoozeStep = useCallback((stepId: string, until: Date, reason?: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    setSnoozedStepIndices(prev => new Set([...prev, stepIndex]));
    setSteps(prev => prev.map((step, i) =>
      i === stepIndex ? {
        ...step,
        status: 'snoozed',
        snoozeConfig: {
          snoozedAt: new Date().toISOString(),
          snoozedUntil: until.toISOString(),
          reason,
        },
      } : step
    ));

    // If current step is snoozed, move to next available
    if (stepIndex === currentStepIndex) {
      goToNextStep();
    }
  }, [steps, currentStepIndex, goToNextStep]);

  const skipStep = useCallback((stepId: string, reason: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    setSkippedStepIndices(prev => new Set([...prev, stepIndex]));
    setSteps(prev => prev.map((step, i) =>
      i === stepIndex ? {
        ...step,
        status: 'skipped',
        skipConfig: {
          skippedAt: new Date().toISOString(),
          reason,
        },
      } : step
    ));

    // If current step is skipped, move to next available
    if (stepIndex === currentStepIndex) {
      goToNextStep();
    }
  }, [steps, currentStepIndex, goToNextStep]);

  const reopenStep = useCallback((stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    setCompletedStepIndices(prev => {
      const next = new Set(prev);
      next.delete(stepIndex);
      return next;
    });
    setSkippedStepIndices(prev => {
      const next = new Set(prev);
      next.delete(stepIndex);
      return next;
    });
    setSnoozedStepIndices(prev => {
      const next = new Set(prev);
      next.delete(stepIndex);
      return next;
    });

    setSteps(prev => prev.map((step, i) =>
      i === stepIndex ? {
        ...step,
        status: 'pending',
        snoozeConfig: undefined,
        skipConfig: undefined,
      } : step
    ));
  }, [steps]);

  // =============================================================================
  // CHAT ACTIONS
  // =============================================================================

  const addAssistantMessage = useCallback((
    content: string,
    messageQuickActions?: QuickAction[]
  ) => {
    const newMessage: WorkflowMessage = {
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      // Don't attach quick actions to message - use global quick actions instead
      // to avoid duplicate display
    };
    setMessages(prev => [...prev, newMessage]);
    if (messageQuickActions) {
      setQuickActions(messageQuickActions);
    }
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  const sendMessage = useCallback(async (content: string, metadata?: Record<string, unknown>) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: WorkflowMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      metadata,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setQuickActions([]);
    setIsLoading(true);

    try {
      // Call the onMessage handler if provided
      if (onMessage) {
        const response = await onMessage(userMessage);
        if (response) {
          // Handle both string and MessageResponse types
          if (typeof response === 'string') {
            addAssistantMessage(response);
          } else {
            addAssistantMessage(response.content, response.quickActions);
          }
        }
      }
    } catch (err) {
      console.error('[useWorkflowModeState] Error sending message:', err);
      addAssistantMessage('Something went wrong. Please try again.');
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [onMessage, addAssistantMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setQuickActions([]);
  }, []);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setQuickActions([]);
    // Use label for display, pass value as metadata for processing
    sendMessage(action.label, { actionValue: action.value });
  }, [sendMessage]);

  const submitInlineComponent = useCallback((id: string, value: unknown) => {
    setWorkflowData(prev => ({
      ...prev,
      [id]: value,
    }));

    // Find the component config and store value if specified
    // This would be expanded based on actual component needs
    console.log('[useWorkflowModeState] Inline component submitted:', id, value);
  }, []);

  // =============================================================================
  // UI ACTIONS
  // =============================================================================

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleArtifactPanel = useCallback(() => {
    setArtifactPanelCollapsed(prev => !prev);
  }, []);

  const handleSetSidebarWidth = useCallback((width: number) => {
    setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width)));
  }, []);

  const handleSetArtifactPanelWidth = useCallback((width: number) => {
    setArtifactPanelWidth(Math.max(0, width));
  }, []);

  const openStepActionMenu = useCallback((stepId: string, action: StepActionType) => {
    setStepActionMenu({ stepId, action });
  }, []);

  const closeStepActionMenu = useCallback(() => {
    setStepActionMenu({ stepId: null, action: null });
  }, []);

  const openModal = useCallback((modal: 'snooze' | 'skip') => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    closeStepActionMenu();
  }, [closeStepActionMenu]);

  // =============================================================================
  // LOADING ACTIONS
  // =============================================================================

  const startLoading = useCallback(async (stages?: LoadingStage[]) => {
    const stagesToUse = stages || loadingStages;
    setLoadingStages(stagesToUse);
    loadingAbortRef.current = false;
    setLoadingActive(true);
    setLoadingStage(0);
    setLoadingMessage(stagesToUse[0]?.message || 'Loading...');

    for (let i = 0; i < stagesToUse.length; i++) {
      if (loadingAbortRef.current) break;

      const stage = stagesToUse[i];
      if (!stage) continue;

      setLoadingStage(i);
      setLoadingMessage(stage.message);

      await new Promise(resolve => setTimeout(resolve, stage.duration));
    }

    if (!loadingAbortRef.current) {
      setLoadingActive(false);
      setLoadingStage(0);
      setLoadingMessage('');
    }
  }, [loadingStages]);

  const stopLoading = useCallback(() => {
    loadingAbortRef.current = true;
    setLoadingActive(false);
    setLoadingStage(0);
    setLoadingMessage('');
  }, []);

  // =============================================================================
  // PERSISTENCE ACTIONS
  // =============================================================================

  const saveState = useCallback(async () => {
    if (!isInitialized || !workflowState) return;

    try {
      const snapshot = {
        state: workflowState,
        savedAt: new Date().toISOString(),
        version: 1,
      };
      localStorage.setItem(`${persistenceKey}-${workflowId}`, JSON.stringify(snapshot));
    } catch (err) {
      console.error('[useWorkflowModeState] Error saving state:', err);
    }
  }, [isInitialized, workflowState, persistenceKey, workflowId]);

  const loadState = useCallback(async (): Promise<WorkflowState | null> => {
    try {
      const saved = localStorage.getItem(`${persistenceKey}-${workflowId}`);
      if (!saved) return null;

      const snapshot = JSON.parse(saved);
      return snapshot.state || null;
    } catch (err) {
      console.error('[useWorkflowModeState] Error loading state:', err);
      return null;
    }
  }, [persistenceKey, workflowId]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initialize on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const init = async () => {
      setIsRestoringState(true);

      try {
        // Try to restore saved state
        const savedState = await loadState();
        if (savedState && savedState.status === 'in_progress') {
          // Mark that we restored state (skip onInitialize)
          wasStateRestoredRef.current = true;

          // Restore state
          setCurrentStepIndex(savedState.currentStepIndex);
          setSteps(savedState.steps);
          setMessages(savedState.chatMessages);
          setWorkflowData(savedState.workflowData);

          // Rebuild completed/skipped/snoozed sets
          const completed = new Set<number>();
          const skipped = new Set<number>();
          const snoozed = new Set<number>();
          savedState.steps.forEach((step, i) => {
            if (step.status === 'completed') completed.add(i);
            if (step.status === 'skipped') skipped.add(i);
            if (step.status === 'snoozed') snoozed.add(i);
          });
          setCompletedStepIndices(completed);
          setSkippedStepIndices(skipped);
          setSnoozedStepIndices(snoozed);
        } else {
          // Initialize with first step as in_progress
          setSteps(prev => prev.map((step, i) => ({
            ...step,
            status: i === 0 ? 'in_progress' : step.status,
          })));
        }
      } catch (err) {
        console.error('[useWorkflowModeState] Error during initialization:', err);
        setError(err instanceof Error ? err : new Error('Initialization failed'));
      } finally {
        setIsRestoringState(false);
        setIsInitialized(true);
      }
    };

    init();
  }, [loadState]);

  // Auto-save on state changes
  useEffect(() => {
    if (!autoSave || !isInitialized || isRestoringState) return;

    // Debounce saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveState();
    }, autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [autoSave, isInitialized, isRestoringState, autoSaveDelay, saveState, currentStepIndex, messages, workflowData]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // =============================================================================
  // ACTIONS OBJECT
  // =============================================================================

  const actions: WorkflowModeActions = useMemo(() => ({
    // Navigation
    goToStep,
    goToNextStep,
    goToPreviousStep,
    getNextAvailableStep,
    getPreviousAvailableStep,

    // Step actions
    completeStep,
    snoozeStep,
    skipStep,
    reopenStep,

    // Chat
    sendMessage,
    setInputValue,
    clearMessages,
    addAssistantMessage,
    handleQuickAction,
    submitInlineComponent,

    // UI
    toggleSidebar,
    toggleArtifactPanel,
    setSidebarWidth: handleSetSidebarWidth,
    setArtifactPanelWidth: handleSetArtifactPanelWidth,
    openStepActionMenu,
    closeStepActionMenu,
    openModal,
    closeModal,

    // Loading
    startLoading,
    stopLoading,

    // Persistence
    saveState,
    loadState,
  }), [
    goToStep, goToNextStep, goToPreviousStep, getNextAvailableStep, getPreviousAvailableStep,
    completeStep, snoozeStep, skipStep, reopenStep,
    sendMessage, setInputValue, clearMessages, addAssistantMessage, handleQuickAction, submitInlineComponent,
    toggleSidebar, toggleArtifactPanel, handleSetSidebarWidth, handleSetArtifactPanelWidth,
    openStepActionMenu, closeStepActionMenu, openModal, closeModal,
    startLoading, stopLoading,
    saveState, loadState,
  ]);

  // Call onInitialize after initialization is complete (only once, and only if state wasn't restored)
  useEffect(() => {
    if (isInitialized && !hasCalledInitializeRef.current && !wasStateRestoredRef.current && onInitialize) {
      hasCalledInitializeRef.current = true;
      onInitialize(actions);
    }
  }, [isInitialized, onInitialize, actions]);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    workflowState,
    chatState,
    loadingState,
    navigationState,
    uiState,

    // Actions
    actions,

    // Callbacks from options
    onReset,

    // Refs
    messagesEndRef,
    sidebarRef,
    chatInputRef,

    // Initialization state
    isInitialized,
    isRestoringState,
    error,
  };
}
