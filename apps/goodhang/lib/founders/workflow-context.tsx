'use client';

import React, { createContext, useContext } from 'react';
import type { WorkflowModeContextValue } from './workflow-types';

const WorkflowModeContext = createContext<WorkflowModeContextValue | null>(null);

interface WorkflowModeProviderProps {
  value: WorkflowModeContextValue;
  children: React.ReactNode;
}

export function WorkflowModeProvider({ value, children }: WorkflowModeProviderProps) {
  return <WorkflowModeContext.Provider value={value}>{children}</WorkflowModeContext.Provider>;
}

export function useWorkflowMode(): WorkflowModeContextValue {
  const context = useContext(WorkflowModeContext);
  if (!context) throw new Error('useWorkflowMode must be used within a WorkflowModeProvider');
  return context;
}

export function useWorkflowState() {
  const { workflowState, navigationState, loadingState } = useWorkflowMode();
  return { workflowState, navigationState, loadingState };
}

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

export function useWorkflowLoading() {
  const { loadingState, actions } = useWorkflowMode();
  return { ...loadingState, startLoading: actions.startLoading, stopLoading: actions.stopLoading };
}

export { WorkflowModeContext };
