/**
 * Workflow Mode Context
 *
 * Central state distribution for the workflow mode layout.
 * Provides bidirectional data flow between WorkflowSidebar, ChatPanel,
 * WorkflowStepProgress, and other workflow components.
 *
 * Adapted from renubu's TaskModeContext pattern.
 */

import React, { createContext, useContext } from 'react';
import type { WorkflowModeContextValue } from '@/lib/types/workflow';

// =============================================================================
// CONTEXT
// =============================================================================

const WorkflowModeContext = createContext<WorkflowModeContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface WorkflowModeProviderProps {
  value: WorkflowModeContextValue;
  children: React.ReactNode;
}

/**
 * Provider component for workflow mode context.
 * Wraps the layout and provides state to all child components.
 */
export function WorkflowModeProvider({ value, children }: WorkflowModeProviderProps) {
  return (
    <WorkflowModeContext.Provider value={value}>
      {children}
    </WorkflowModeContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the full workflow mode context.
 * Must be used within a WorkflowModeProvider.
 */
export function useWorkflowMode(): WorkflowModeContextValue {
  const context = useContext(WorkflowModeContext);
  if (!context) {
    throw new Error('useWorkflowMode must be used within a WorkflowModeProvider');
  }
  return context;
}

/**
 * Hook to access workflow state only.
 * Useful for components that only need to read state.
 */
export function useWorkflowState() {
  const { workflowState, navigationState, loadingState } = useWorkflowMode();
  return { workflowState, navigationState, loadingState };
}

/**
 * Hook to access chat state and actions.
 * Useful for chat-related components.
 */
export function useWorkflowChat() {
  const { chatState, actions, messagesEndRef } = useWorkflowMode();
  return {
    ...chatState,
    sendMessage: actions.sendMessage,
    setInputValue: actions.setInputValue,
    clearMessages: actions.clearMessages,
    addAssistantMessage: actions.addAssistantMessage,
    handleQuickAction: actions.handleQuickAction,
    submitInlineComponent: actions.submitInlineComponent,
    messagesEndRef,
  };
}

/**
 * Hook to access navigation state and actions.
 * Useful for step progress components.
 */
export function useWorkflowNavigation() {
  const { navigationState, actions } = useWorkflowMode();
  return {
    ...navigationState,
    goToStep: actions.goToStep,
    goToNextStep: actions.goToNextStep,
    goToPreviousStep: actions.goToPreviousStep,
    getNextAvailableStep: actions.getNextAvailableStep,
    getPreviousAvailableStep: actions.getPreviousAvailableStep,
  };
}

/**
 * Hook to access step actions.
 * Useful for step indicator and action modal components.
 */
export function useWorkflowStepActions() {
  const { uiState, actions } = useWorkflowMode();
  return {
    stepActionMenu: uiState.stepActionMenu,
    activeModal: uiState.activeModal,
    completeStep: actions.completeStep,
    snoozeStep: actions.snoozeStep,
    skipStep: actions.skipStep,
    reopenStep: actions.reopenStep,
    openStepActionMenu: actions.openStepActionMenu,
    closeStepActionMenu: actions.closeStepActionMenu,
    openModal: actions.openModal,
    closeModal: actions.closeModal,
  };
}

/**
 * Hook to access UI state and actions.
 * Useful for layout components that handle resizing.
 */
export function useWorkflowUI() {
  const { uiState, actions, sidebarRef } = useWorkflowMode();
  return {
    ...uiState,
    toggleSidebar: actions.toggleSidebar,
    toggleArtifactPanel: actions.toggleArtifactPanel,
    setSidebarWidth: actions.setSidebarWidth,
    setArtifactPanelWidth: actions.setArtifactPanelWidth,
    sidebarRef,
  };
}

/**
 * Hook to access loading state and actions.
 * Useful for loading indicator components.
 */
export function useWorkflowLoading() {
  const { loadingState, actions } = useWorkflowMode();
  return {
    ...loadingState,
    startLoading: actions.startLoading,
    stopLoading: actions.stopLoading,
  };
}

/**
 * Hook to access persistence actions.
 * Useful for components that need manual save/load control.
 */
export function useWorkflowPersistence() {
  const { actions } = useWorkflowMode();
  return {
    saveState: actions.saveState,
    loadState: actions.loadState,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { WorkflowModeContext };
export type { WorkflowModeProviderProps };
