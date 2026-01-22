/**
 * Workflow Mode Type Definitions
 *
 * Types for the v0-style chat + artifact layout system.
 * Adapted from renubu's TaskMode patterns.
 */

import type { Message, QuickAction, LoadingStage } from './shared';

// =============================================================================
// STEP TYPES
// =============================================================================

/**
 * Status of a workflow step
 */
export type StepStatus =
  | 'pending'      // Not started
  | 'in_progress'  // Currently active
  | 'completed'    // Successfully completed
  | 'skipped'      // Skipped by user
  | 'snoozed'      // Postponed for later
  | 'locked';      // Not yet available

/**
 * Snooze configuration for a step
 */
export interface SnoozeConfig {
  snoozedAt: string;        // ISO timestamp
  snoozedUntil: string;     // ISO timestamp
  reason?: string;          // Optional reason
}

/**
 * Skip configuration for a step
 */
export interface SkipConfig {
  skippedAt: string;        // ISO timestamp
  reason: string;           // Required reason for skipping
}

/**
 * Individual step configuration
 */
export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  required: boolean;
  status: StepStatus;
  iconName?: string;           // lucide icon name
  completionKey?: string;      // localStorage key for completion marker
  snoozeConfig?: SnoozeConfig; // Present if snoozed
  skipConfig?: SkipConfig;     // Present if skipped
  artifacts?: string[];        // IDs of related artifacts
}

/**
 * Step action types available in the step menu
 */
export type StepActionType = 'snooze' | 'skip';

/**
 * Snooze duration presets
 */
export type SnoozeDuration = '1_day' | '3_days' | '1_week' | 'custom';

/**
 * Step action menu state
 */
export interface StepActionMenuState {
  stepId: string | null;
  action: StepActionType | null;
}

// =============================================================================
// CHAT TYPES
// =============================================================================

/**
 * Extended message with inline component support
 */
export interface WorkflowMessage extends Message {
  /** Inline component to render after the message */
  inlineComponent?: InlineComponentConfig;
  /** Whether this message marks a step boundary */
  isStepDivider?: boolean;
  /** Quick actions to show after this message */
  quickActions?: QuickAction[];
  /** Metadata for message processing (e.g., action values from quick actions) */
  metadata?: Record<string, unknown>;
}

/**
 * Types of inline components that can be embedded in chat
 */
export type InlineComponentType =
  | 'slider'
  | 'textarea'
  | 'input'
  | 'radio'
  | 'dropdown'
  | 'checkbox'
  | 'star-rating';

/**
 * Configuration for an inline component
 */
export interface InlineComponentConfig {
  type: InlineComponentType;
  id: string;
  label?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  defaultValue?: unknown;
  storeAs?: string;  // Key to store the value in workflow state
}

// =============================================================================
// WORKFLOW STATE
// =============================================================================

/**
 * Complete workflow state for persistence
 */
export interface WorkflowState {
  workflowId: string;
  executionId: string;
  currentStepIndex: number;
  steps: WorkflowStep[];
  chatMessages: WorkflowMessage[];
  workflowData: Record<string, unknown>;  // User inputs, stored values
  startedAt: string;
  lastUpdatedAt: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}

/**
 * Persisted state snapshot (for save/resume)
 */
export interface WorkflowStateSnapshot {
  state: WorkflowState;
  savedAt: string;
  version: number;
}

// =============================================================================
// UI STATE
// =============================================================================

/**
 * Sidebar width constraints
 */
export interface SidebarWidthConfig {
  min: number;     // 280px
  max: number;     // 450px
  default: number; // 340px
}

/**
 * Complete UI state for the workflow mode layout
 */
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

/**
 * Chat state subset for the context
 */
export interface WorkflowChatState {
  messages: WorkflowMessage[];
  inputValue: string;
  isLoading: boolean;
  isStreaming: boolean;
  quickActions: QuickAction[];
}

/**
 * Loading state with stages support
 */
export interface WorkflowLoadingState {
  isActive: boolean;
  currentStage: number;
  currentMessage: string;
  progress: number;
  stages: LoadingStage[];
}

/**
 * Navigation state
 */
export interface WorkflowNavigationState {
  currentStepIndex: number;
  currentStep: WorkflowStep | null;
  canGoBack: boolean;
  canGoForward: boolean;
  completedStepIndices: Set<number>;
  skippedStepIndices: Set<number>;
  snoozedStepIndices: Set<number>;
}

/**
 * Actions available through the context
 */
export interface WorkflowModeActions {
  // Navigation
  goToStep: (index: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  getNextAvailableStep: () => number | null;
  getPreviousAvailableStep: () => number | null;

  // Step actions
  completeStep: (stepId: string) => void;
  snoozeStep: (stepId: string, until: Date, reason?: string) => void;
  skipStep: (stepId: string, reason: string) => void;
  reopenStep: (stepId: string) => void;

  // Chat
  sendMessage: (content: string) => Promise<void>;
  setInputValue: (value: string) => void;
  clearMessages: () => void;
  addAssistantMessage: (content: string, quickActions?: QuickAction[]) => void;
  handleQuickAction: (action: QuickAction) => void;

  // Inline components
  submitInlineComponent: (id: string, value: unknown) => void;

  // UI
  toggleSidebar: () => void;
  toggleArtifactPanel: () => void;
  setSidebarWidth: (width: number) => void;
  setArtifactPanelWidth: (width: number) => void;
  openStepActionMenu: (stepId: string, action: StepActionType) => void;
  closeStepActionMenu: () => void;
  openModal: (modal: 'snooze' | 'skip') => void;
  closeModal: () => void;

  // Loading
  startLoading: (stages?: LoadingStage[]) => Promise<void>;
  stopLoading: () => void;

  // Persistence
  saveState: () => Promise<void>;
  loadState: () => Promise<WorkflowState | null>;
}

/**
 * Complete context value
 */
export interface WorkflowModeContextValue {
  // State
  workflowState: WorkflowState | null;
  chatState: WorkflowChatState;
  loadingState: WorkflowLoadingState;
  navigationState: WorkflowNavigationState;
  uiState: WorkflowUIState;

  // Actions
  actions: WorkflowModeActions;

  // Callbacks from options
  onReset?: () => void;

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

// =============================================================================
// HOOK OPTIONS
// =============================================================================

/**
 * Response from onMessage handler
 */
export interface MessageResponse {
  content: string;
  quickActions?: QuickAction[];
}

/**
 * Options for useWorkflowModeState hook
 */
export interface UseWorkflowModeStateOptions {
  workflowId: string;
  steps: WorkflowStep[];
  initialStepIndex?: number;
  onStepComplete?: (stepId: string) => void;
  onStepChange?: (fromIndex: number, toIndex: number) => void;
  onWorkflowComplete?: () => void;
  onMessage?: (message: WorkflowMessage) => Promise<string | MessageResponse | null>;
  onReset?: () => void;       // Callback for reset button
  onInitialize?: (actions: WorkflowModeActions) => void;  // Called after initialization
  persistenceKey?: string;    // localStorage key prefix
  autoSave?: boolean;         // Auto-save state changes
  autoSaveDelay?: number;     // Debounce delay in ms
}

/**
 * Return type for useWorkflowModeState hook
 */
export interface UseWorkflowModeStateReturn extends WorkflowModeContextValue {
  isInitialized: boolean;
  isRestoringState: boolean;
  error: Error | null;
}

// =============================================================================
// PERSISTENCE TYPES
// =============================================================================

/**
 * Persistence service interface
 */
export interface WorkflowPersistenceService {
  save: (state: WorkflowState) => Promise<void>;
  load: (workflowId: string, executionId?: string) => Promise<WorkflowState | null>;
  findResumable: (workflowId: string) => Promise<WorkflowState | null>;
  delete: (executionId: string) => Promise<void>;
  sync: () => Promise<void>;
}

/**
 * Persistence options
 */
export interface WorkflowPersistenceOptions {
  localStorageKey: string;
  supabaseTable?: string;
  syncInterval?: number;  // ms between syncs
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for WorkflowModeLayout
 */
export interface WorkflowModeLayoutProps {
  children?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  artifactContent?: React.ReactNode;
  className?: string;
}

/**
 * Props for WorkflowSidebar
 */
export interface WorkflowSidebarProps {
  className?: string;
  /** When true, sidebar expands to fill available space (no fixed width) */
  expandToFill?: boolean;
}

/**
 * Props for ChatPanel
 */
export interface ChatPanelProps {
  className?: string;
  useMarkdown?: boolean;
}

/**
 * Props for WorkflowStepProgress
 */
export interface WorkflowStepProgressProps {
  className?: string;
  showActions?: boolean;  // Show snooze/skip on hover
}

/**
 * Props for StepIndicator
 */
export interface StepIndicatorProps {
  step: WorkflowStep;
  index: number;
  isActive: boolean;
  showConnector?: boolean;
  onClick?: () => void;
  onActionClick?: (action: StepActionType) => void;
}

/**
 * Props for StepActionModals
 */
export interface StepActionModalsProps {
  isSnoozeOpen: boolean;
  isSkipOpen: boolean;
  stepId: string | null;
  onSnoozeConfirm: (until: Date, reason?: string) => void;
  onSkipConfirm: (reason: string) => void;
  onClose: () => void;
}

/**
 * Props for ProgressFooter
 */
export interface ProgressFooterProps {
  progress: number;
  canUnlock: boolean;
  onUnlock?: () => void;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}

/**
 * Props for InlineComponent
 */
export interface InlineComponentProps {
  config: InlineComponentConfig;
  onSubmit: (value: unknown) => void;
  disabled?: boolean;
}

/**
 * Props for StagedLoadingIndicator
 */
export interface StagedLoadingIndicatorProps {
  stages: LoadingStage[];
  currentStage: number;
  progress: number;
  message: string;
  className?: string;
}
