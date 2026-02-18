/**
 * Workflow Mode Type Definitions
 *
 * Types for the v0-style chat + artifact layout system.
 * Ported from desktop app's workflow types.
 */

import type { Message, QuickAction, LoadingStage } from './types';

// =============================================================================
// STEP TYPES
// =============================================================================

export type StepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'snoozed'
  | 'locked';

export interface SnoozeConfig {
  snoozedAt: string;
  snoozedUntil: string;
  reason?: string | undefined;
}

export interface SkipConfig {
  skippedAt: string;
  reason: string;
}

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  status: StepStatus;
  iconName?: string | undefined;
  completionKey?: string | undefined;
  snoozeConfig?: SnoozeConfig | undefined;
  skipConfig?: SkipConfig | undefined;
  artifacts?: string[] | undefined;
}

export type StepActionType = 'snooze' | 'skip';

export interface StepActionMenuState {
  stepId: string | null;
  action: StepActionType | null;
}

// =============================================================================
// CHAT TYPES
// =============================================================================

export interface InlineComponentConfig {
  type: 'slider' | 'textarea' | 'input' | 'radio' | 'dropdown' | 'checkbox' | 'star-rating';
  id: string;
  label?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  defaultValue?: unknown;
  storeAs?: string;
}

export interface WorkflowMessage extends Message {
  inlineComponent?: InlineComponentConfig | undefined;
  isStepDivider?: boolean | undefined;
  quickActions?: QuickAction[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

// =============================================================================
// WORKFLOW STATE
// =============================================================================

export interface WorkflowState {
  workflowId: string;
  executionId: string;
  currentStepIndex: number;
  steps: WorkflowStep[];
  chatMessages: WorkflowMessage[];
  workflowData: Record<string, unknown>;
  startedAt: string;
  lastUpdatedAt: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}

// =============================================================================
// UI STATE
// =============================================================================

export interface WorkflowUIState {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  artifactPanelWidth: number;
  artifactPanelCollapsed: boolean;
  isResizing: boolean;
  stepActionMenu: StepActionMenuState;
  activeModal: 'snooze' | 'skip' | null;
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

export interface WorkflowChatState {
  messages: WorkflowMessage[];
  inputValue: string;
  isLoading: boolean;
  isStreaming: boolean;
  quickActions: QuickAction[];
}

export interface WorkflowLoadingState {
  isActive: boolean;
  currentStage: number;
  currentMessage: string;
  progress: number;
  stages: LoadingStage[];
}

export interface WorkflowNavigationState {
  currentStepIndex: number;
  currentStep: WorkflowStep | null;
  canGoBack: boolean;
  canGoForward: boolean;
  completedStepIndices: Set<number>;
  skippedStepIndices: Set<number>;
  snoozedStepIndices: Set<number>;
}

export interface WorkflowModeActions {
  goToStep: (index: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  getNextAvailableStep: () => number | null;
  getPreviousAvailableStep: () => number | null;
  completeStep: (stepId: string) => void;
  snoozeStep: (stepId: string, until: Date, reason?: string) => void;
  skipStep: (stepId: string, reason: string) => void;
  reopenStep: (stepId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  setInputValue: (value: string) => void;
  clearMessages: () => void;
  addAssistantMessage: (content: string, quickActions?: QuickAction[]) => void;
  handleQuickAction: (action: QuickAction) => void;
  submitInlineComponent: (id: string, value: unknown) => void;
  toggleSidebar: () => void;
  toggleArtifactPanel: () => void;
  setSidebarWidth: (width: number) => void;
  setArtifactPanelWidth: (width: number) => void;
  openStepActionMenu: (stepId: string, action: StepActionType) => void;
  closeStepActionMenu: () => void;
  openModal: (modal: 'snooze' | 'skip') => void;
  closeModal: () => void;
  startLoading: (stages?: LoadingStage[]) => Promise<void>;
  stopLoading: () => void;
  saveState: () => Promise<void>;
  loadState: () => Promise<WorkflowState | null>;
}

export interface WorkflowModeContextValue {
  workflowState: WorkflowState | null;
  chatState: WorkflowChatState;
  loadingState: WorkflowLoadingState;
  navigationState: WorkflowNavigationState;
  uiState: WorkflowUIState;
  actions: WorkflowModeActions;
  onReset?: (() => void) | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

// =============================================================================
// HOOK OPTIONS
// =============================================================================

export interface MessageResponse {
  content: string;
  quickActions?: QuickAction[] | undefined;
}

export interface UseWorkflowModeStateOptions {
  workflowId: string;
  steps: WorkflowStep[];
  initialStepIndex?: number;
  onStepComplete?: (stepId: string) => void;
  onStepChange?: (fromIndex: number, toIndex: number) => void;
  onWorkflowComplete?: () => void;
  onMessage?: (message: WorkflowMessage) => Promise<string | MessageResponse | null>;
  onReset?: () => void;
  onInitialize?: (actions: WorkflowModeActions) => void;
  persistenceKey?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseWorkflowModeStateReturn extends WorkflowModeContextValue {
  isInitialized: boolean;
  isRestoringState: boolean;
  error: Error | null;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface WorkflowModeLayoutProps {
  children?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  artifactContent?: React.ReactNode;
  className?: string;
  hideChatInput?: boolean;
}

export interface WorkflowSidebarProps {
  className?: string;
  expandToFill?: boolean;
  hideChatInput?: boolean;
}

export interface ChatPanelProps {
  className?: string;
  useMarkdown?: boolean;
}

export interface ArtifactPanelProps {
  children: React.ReactNode;
  showStepProgress?: boolean;
  className?: string;
}
