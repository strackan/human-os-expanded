'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type {
  UseWorkflowModeStateOptions, UseWorkflowModeStateReturn, WorkflowState, WorkflowStep,
  WorkflowMessage, WorkflowChatState, WorkflowLoadingState, WorkflowNavigationState,
  WorkflowUIState, WorkflowModeActions, StepActionType,
} from '../workflow-types';
import type { QuickAction, LoadingStage } from '../types';

const DEFAULT_SIDEBAR_WIDTH = 380;
const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_ARTIFACT_WIDTH = 500;

const DEFAULT_LOADING_STAGES: LoadingStage[] = [
  { message: 'Processing...', duration: 800 },
  { message: 'Almost there...', duration: 600 },
];

export function useWorkflowModeState(options: UseWorkflowModeStateOptions): UseWorkflowModeStateReturn {
  const {
    workflowId, steps: initialSteps, initialStepIndex = 0,
    onStepComplete, onStepChange, onWorkflowComplete, onMessage, onReset, onInitialize,
    persistenceKey = 'workflow-mode', autoSave = true, autoSaveDelay = 500,
  } = options;

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const hasRestoredRef = useRef(false);
  const hasCalledInitializeRef = useRef(false);
  const wasStateRestoredRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State - Steps
  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [completedStepIndices, setCompletedStepIndices] = useState<Set<number>>(new Set());
  const [skippedStepIndices, setSkippedStepIndices] = useState<Set<number>>(new Set());
  const [snoozedStepIndices, setSnoozedStepIndices] = useState<Set<number>>(new Set());
  const [workflowData, setWorkflowData] = useState<Record<string, unknown>>({});

  // State - Chat
  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);

  // State - Loading
  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>(DEFAULT_LOADING_STAGES);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const loadingAbortRef = useRef(false);

  // State - UI
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [artifactPanelWidth, setArtifactPanelWidth] = useState(DEFAULT_ARTIFACT_WIDTH);
  const [artifactPanelCollapsed, setArtifactPanelCollapsed] = useState(true);
  const [isResizing] = useState(false);
  const [stepActionMenu, setStepActionMenu] = useState<{ stepId: string | null; action: StepActionType | null }>({ stepId: null, action: null });
  const [activeModal, setActiveModal] = useState<'snooze' | 'skip' | null>(null);

  // State - Initialization
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Computed
  const currentStep = useMemo(() => steps[currentStepIndex] ?? null, [steps, currentStepIndex]);

  const navigationState: WorkflowNavigationState = useMemo(() => ({
    currentStepIndex, currentStep,
    canGoBack: currentStepIndex > 0, canGoForward: currentStepIndex < steps.length - 1,
    completedStepIndices, skippedStepIndices, snoozedStepIndices,
  }), [currentStepIndex, currentStep, steps.length, completedStepIndices, skippedStepIndices, snoozedStepIndices]);

  const chatState: WorkflowChatState = useMemo(() => ({
    messages, inputValue, isLoading, isStreaming, quickActions,
  }), [messages, inputValue, isLoading, isStreaming, quickActions]);

  const loadingProgress = useMemo(() => loadingActive ? ((loadingStage + 1) / loadingStages.length) * 100 : 0, [loadingActive, loadingStage, loadingStages.length]);

  const loadingState: WorkflowLoadingState = useMemo(() => ({
    isActive: loadingActive, currentStage: loadingStage, currentMessage: loadingMessage, progress: loadingProgress, stages: loadingStages,
  }), [loadingActive, loadingStage, loadingMessage, loadingProgress, loadingStages]);

  const uiState: WorkflowUIState = useMemo(() => ({
    sidebarWidth, sidebarCollapsed, artifactPanelWidth, artifactPanelCollapsed, isResizing, stepActionMenu, activeModal,
  }), [sidebarWidth, sidebarCollapsed, artifactPanelWidth, artifactPanelCollapsed, isResizing, stepActionMenu, activeModal]);

  const workflowState: WorkflowState | null = useMemo(() => {
    if (!isInitialized) return null;
    return { workflowId, executionId: `${workflowId}-${Date.now()}`, currentStepIndex, steps, chatMessages: messages, workflowData, startedAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString(), status: 'in_progress' };
  }, [isInitialized, workflowId, currentStepIndex, steps, messages, workflowData]);

  // Helpers
  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

  const getNextAvailableStep = useCallback((): number | null => {
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
      if (!snoozedStepIndices.has(i) && !skippedStepIndices.has(i)) return i;
    }
    return null;
  }, [currentStepIndex, steps.length, snoozedStepIndices, skippedStepIndices]);

  const getPreviousAvailableStep = useCallback((): number | null => {
    for (let i = currentStepIndex - 1; i >= 0; i--) {
      if (!snoozedStepIndices.has(i) && !skippedStepIndices.has(i)) return i;
    }
    return null;
  }, [currentStepIndex, snoozedStepIndices, skippedStepIndices]);

  // Navigation
  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return;
    const previousIndex = currentStepIndex;
    setCurrentStepIndex(index);
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === index ? 'in_progress' : completedStepIndices.has(i) ? 'completed' : skippedStepIndices.has(i) ? 'skipped' : snoozedStepIndices.has(i) ? 'snoozed' : i < index ? 'pending' : step.required && i > index ? 'locked' : step.status,
    })));
    const targetStep = steps[index];
    if (targetStep && index !== previousIndex) {
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString(), isStepDivider: true }]);
    }
    onStepChange?.(previousIndex, index);
    scrollToBottom();
  }, [currentStepIndex, steps, completedStepIndices, skippedStepIndices, snoozedStepIndices, onStepChange, scrollToBottom]);

  const goToNextStep = useCallback(() => { const next = getNextAvailableStep(); if (next !== null) goToStep(next); }, [getNextAvailableStep, goToStep]);
  const goToPreviousStep = useCallback(() => { const prev = getPreviousAvailableStep(); if (prev !== null) goToStep(prev); }, [getPreviousAvailableStep, goToStep]);

  // Step actions
  const completeStep = useCallback((stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;
    setCompletedStepIndices(prev => new Set([...prev, stepIndex]));
    setSteps(prev => prev.map((step, i) => i === stepIndex ? { ...step, status: 'completed' } : step));
    const step = steps[stepIndex];
    if (step?.completionKey) localStorage.setItem(step.completionKey, new Date().toISOString());
    onStepComplete?.(stepId);
    const requiredSteps = steps.filter(s => s.required);
    const allRequiredComplete = requiredSteps.every(s => completedStepIndices.has(steps.indexOf(s)) || s.id === stepId);
    if (allRequiredComplete) onWorkflowComplete?.();
  }, [steps, completedStepIndices, onStepComplete, onWorkflowComplete]);

  const snoozeStep = useCallback((stepId: string, until: Date, reason?: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;
    setSnoozedStepIndices(prev => new Set([...prev, stepIndex]));
    setSteps(prev => prev.map((step, i) => i === stepIndex ? { ...step, status: 'snoozed', snoozeConfig: { snoozedAt: new Date().toISOString(), snoozedUntil: until.toISOString(), reason } } : step));
    if (stepIndex === currentStepIndex) goToNextStep();
  }, [steps, currentStepIndex, goToNextStep]);

  const skipStep = useCallback((stepId: string, reason: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;
    setSkippedStepIndices(prev => new Set([...prev, stepIndex]));
    setSteps(prev => prev.map((step, i) => i === stepIndex ? { ...step, status: 'skipped', skipConfig: { skippedAt: new Date().toISOString(), reason } } : step));
    if (stepIndex === currentStepIndex) goToNextStep();
  }, [steps, currentStepIndex, goToNextStep]);

  const reopenStep = useCallback((stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;
    setCompletedStepIndices(prev => { const next = new Set(prev); next.delete(stepIndex); return next; });
    setSkippedStepIndices(prev => { const next = new Set(prev); next.delete(stepIndex); return next; });
    setSnoozedStepIndices(prev => { const next = new Set(prev); next.delete(stepIndex); return next; });
    setSteps(prev => prev.map((step, i) => i === stepIndex ? { ...step, status: 'pending', snoozeConfig: undefined, skipConfig: undefined } : step));
  }, [steps]);

  // Chat actions
  const addAssistantMessage = useCallback((content: string, messageQuickActions?: QuickAction[]) => {
    setMessages(prev => [...prev, { role: 'assistant', content, timestamp: new Date().toISOString() }]);
    if (messageQuickActions) setQuickActions(messageQuickActions);
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  const sendMessage = useCallback(async (content: string, metadata?: Record<string, unknown>) => {
    if (!content.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: content.trim(), timestamp: new Date().toISOString(), metadata }]);
    setInputValue('');
    setQuickActions([]);
    setIsLoading(true);
    try {
      if (onMessage) {
        const response = await onMessage({ role: 'user', content: content.trim(), timestamp: new Date().toISOString(), metadata });
        if (response) {
          if (typeof response === 'string') addAssistantMessage(response);
          else addAssistantMessage(response.content, response.quickActions);
        }
      }
    } catch (err) {
      console.error('[useWorkflowModeState] Error:', err);
      addAssistantMessage('Something went wrong. Please try again.');
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [onMessage, addAssistantMessage]);

  const clearMessages = useCallback(() => { setMessages([]); setQuickActions([]); }, []);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setQuickActions([]);
    sendMessage(action.label, { actionValue: action.value });
  }, [sendMessage]);

  const submitInlineComponent = useCallback((id: string, value: unknown) => {
    setWorkflowData(prev => ({ ...prev, [id]: value }));
  }, []);

  // UI actions
  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);
  const toggleArtifactPanel = useCallback(() => setArtifactPanelCollapsed(prev => !prev), []);
  const handleSetSidebarWidth = useCallback((width: number) => setSidebarWidth(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width))), []);
  const handleSetArtifactPanelWidth = useCallback((width: number) => setArtifactPanelWidth(Math.max(0, width)), []);
  const openStepActionMenu = useCallback((stepId: string, action: StepActionType) => setStepActionMenu({ stepId, action }), []);
  const closeStepActionMenu = useCallback(() => setStepActionMenu({ stepId: null, action: null }), []);
  const openModal = useCallback((modal: 'snooze' | 'skip') => setActiveModal(modal), []);
  const closeModal = useCallback(() => { setActiveModal(null); closeStepActionMenu(); }, [closeStepActionMenu]);

  // Loading actions
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
    if (!loadingAbortRef.current) { setLoadingActive(false); setLoadingStage(0); setLoadingMessage(''); }
  }, [loadingStages]);

  const stopLoading = useCallback(() => { loadingAbortRef.current = true; setLoadingActive(false); setLoadingStage(0); setLoadingMessage(''); }, []);

  // Persistence
  const saveState = useCallback(async () => {
    if (!isInitialized || !workflowState) return;
    try { localStorage.setItem(`${persistenceKey}-${workflowId}`, JSON.stringify({ state: workflowState, savedAt: new Date().toISOString(), version: 1 })); } catch (err) { console.error('[useWorkflowModeState] Error saving:', err); }
  }, [isInitialized, workflowState, persistenceKey, workflowId]);

  const loadState = useCallback(async (): Promise<WorkflowState | null> => {
    try { const saved = localStorage.getItem(`${persistenceKey}-${workflowId}`); if (!saved) return null; return JSON.parse(saved).state || null; } catch { return null; }
  }, [persistenceKey, workflowId]);

  // Initialize on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const init = async () => {
      setIsRestoringState(true);
      try {
        const savedState = await loadState();
        if (savedState && savedState.status === 'in_progress') {
          wasStateRestoredRef.current = true;
          setCurrentStepIndex(savedState.currentStepIndex);
          setSteps(savedState.steps);
          setMessages(savedState.chatMessages);
          setWorkflowData(savedState.workflowData);
          const completed = new Set<number>(); const skipped = new Set<number>(); const snoozed = new Set<number>();
          savedState.steps.forEach((step, i) => { if (step.status === 'completed') completed.add(i); if (step.status === 'skipped') skipped.add(i); if (step.status === 'snoozed') snoozed.add(i); });
          setCompletedStepIndices(completed); setSkippedStepIndices(skipped); setSnoozedStepIndices(snoozed);
        } else {
          setSteps(prev => prev.map((step, i) => ({ ...step, status: i === 0 ? 'in_progress' : step.status })));
        }
      } catch (err) { console.error('[useWorkflowModeState] Init error:', err); setError(err instanceof Error ? err : new Error('Initialization failed')); } finally { setIsRestoringState(false); setIsInitialized(true); }
    };
    init();
  }, [loadState]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !isInitialized || isRestoringState) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => { saveState(); }, autoSaveDelay);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [autoSave, isInitialized, isRestoringState, autoSaveDelay, saveState, currentStepIndex, messages, workflowData]);

  // Auto-scroll
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Sync steps from parent
  useEffect(() => {
    if (!isInitialized || isRestoringState) return;
    const hasStatusChanges = initialSteps.some((newStep, i) => { const cur = steps[i]; return cur && newStep.status !== cur.status; });
    if (hasStatusChanges) {
      setSteps(initialSteps);
      const newCurrentIndex = initialSteps.findIndex(s => s.status === 'in_progress');
      if (newCurrentIndex !== -1 && newCurrentIndex !== currentStepIndex) setCurrentStepIndex(newCurrentIndex);
    }
  }, [initialSteps, isInitialized, isRestoringState, steps, currentStepIndex]);

  const actions: WorkflowModeActions = useMemo(() => ({
    goToStep, goToNextStep, goToPreviousStep, getNextAvailableStep, getPreviousAvailableStep,
    completeStep, snoozeStep, skipStep, reopenStep,
    sendMessage, setInputValue, clearMessages, addAssistantMessage, handleQuickAction, submitInlineComponent,
    toggleSidebar, toggleArtifactPanel, setSidebarWidth: handleSetSidebarWidth, setArtifactPanelWidth: handleSetArtifactPanelWidth,
    openStepActionMenu, closeStepActionMenu, openModal, closeModal,
    startLoading, stopLoading, saveState, loadState,
  }), [goToStep, goToNextStep, goToPreviousStep, getNextAvailableStep, getPreviousAvailableStep, completeStep, snoozeStep, skipStep, reopenStep, sendMessage, setInputValue, clearMessages, addAssistantMessage, handleQuickAction, submitInlineComponent, toggleSidebar, toggleArtifactPanel, handleSetSidebarWidth, handleSetArtifactPanelWidth, openStepActionMenu, closeStepActionMenu, openModal, closeModal, startLoading, stopLoading, saveState, loadState]);

  // Call onInitialize
  useEffect(() => {
    if (isInitialized && !hasCalledInitializeRef.current && !wasStateRestoredRef.current && onInitialize) {
      hasCalledInitializeRef.current = true;
      onInitialize(actions);
    }
  }, [isInitialized, onInitialize, actions]);

  return { workflowState, chatState, loadingState, navigationState, uiState, actions, onReset, messagesEndRef, sidebarRef, chatInputRef, isInitialized, isRestoringState, error };
}
