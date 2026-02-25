/**
 * Step Chat Types
 *
 * Type definitions for the v0-style collapsible step chat UI.
 * Each workflow step becomes a collapsible container with its own messages.
 */

import type { ChatMessage } from '@/components/workflows/sections/ChatRenderer';

// ============================================================================
// STEP STATUS & EXPANSION STATES
// ============================================================================

/**
 * Step status state machine
 *
 * pending  → Not yet reached (gray, collapsed)
 * active   → Currently working/awaiting input (blue pulse, expanded)
 * success  → Completed successfully (green check, auto-collapses after 1.5s)
 * error    → Failed with error (red X, expandable for details)
 * snoozed  → Deferred to later (purple clock, collapsed)
 */
export type StepStatus = 'pending' | 'active' | 'success' | 'error' | 'snoozed';

/**
 * Step expansion state
 *
 * collapsed → Only header visible
 * expanded  → Full messages + input visible
 * pinned    → Expanded and won't auto-collapse on success
 */
export type ExpansionState = 'collapsed' | 'expanded' | 'pinned';

// ============================================================================
// STEP DATA STRUCTURES
// ============================================================================

/**
 * Individual step with its grouped messages
 *
 * This represents a single collapsible accordion item containing all the
 * chat messages that belong to this step.
 */
export interface StepChatGroup {
  /** Index in the workflow slides array */
  stepIndex: number;

  /** Original slide ID from workflow config */
  slideId: string;

  /**
   * Title hierarchy (first non-empty wins):
   * 1. customTitle - User-edited title (double-click to edit)
   * 2. llmTitle - LLM-generated contextual title
   * 3. slideTitle - Default from workflow definition
   */
  slideTitle: string;
  llmTitle?: string;
  customTitle?: string;

  /** Current step status */
  status: StepStatus;

  /** Current expansion state */
  expansionState: ExpansionState;

  /** Messages belonging to this step */
  messages: ChatMessage[];

  /** Optional slide label (e.g., "Step 1", "Review") */
  slideLabel?: string;

  /** Timestamp when step became active */
  activatedAt?: Date;

  /** Timestamp when step completed */
  completedAt?: Date;

  /** Timestamp when step was snoozed */
  snoozedAt?: Date;

  /** Snooze details if applicable */
  snoozeDetails?: {
    until?: string;
    reason?: string;
  };
}

/**
 * Resolved display title for a step
 * Uses the hierarchy: customTitle > llmTitle > slideTitle
 */
export function getStepDisplayTitle(step: StepChatGroup): string {
  return step.customTitle || step.llmTitle || step.slideTitle;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for the individual StepContainer component
 */
export interface StepContainerProps {
  /** The step data */
  step: StepChatGroup;

  /** Whether this is the currently active step */
  isCurrentStep: boolean;

  /** Expand this step */
  onExpand: () => void;

  /** Collapse this step */
  onCollapse: () => void;

  /** Navigate to this step (for re-opening completed steps) */
  onNavigateToStep?: () => void;

  /** Pin/unpin this step (prevents auto-collapse) */
  onPin: () => void;
  onUnpin: () => void;

  /** Update custom title (from double-click edit) */
  onTitleChange: (title: string) => void;

  /** Send a message in this step */
  onSendMessage: (message: string) => void;

  /** Handle button click in chat */
  onButtonClick: (buttonValue: string) => void;

  /** Handle branch navigation */
  onBranchNavigation: (branchName: string, value?: unknown) => void;

  /** Handle inline component value change */
  onComponentValueChange: (componentId: string, value: unknown) => void;

  /** Execution context for step actions (snooze/skip) */
  actionContext?: StepActionContext;

  /** Callback when step action succeeds (snooze/skip) */
  onActionSuccess?: () => void;
}

/**
 * Props for the StepChatPanel container
 */
export interface StepChatPanelProps {
  /** All step groups */
  stepGroups: StepChatGroup[];

  /** Index of the current active step */
  currentStepIndex: number;

  /** Expand a specific step */
  onExpandStep: (stepIndex: number) => void;

  /** Collapse a specific step */
  onCollapseStep: (stepIndex: number) => void;

  /** Navigate to a specific step (for re-opening completed steps) */
  onNavigateToStep?: (stepIndex: number) => void;

  /** Toggle pin on a step */
  onTogglePin: (stepIndex: number) => void;

  /** Update custom title for a step */
  onTitleChange: (stepIndex: number, title: string) => void;

  /** Send a message in the active step */
  onSendMessage: (message: string) => void;

  /** Handle button click */
  onButtonClick: (buttonValue: string) => void;

  /** Handle branch navigation */
  onBranchNavigation: (branchName: string, value?: unknown) => void;

  /** Handle component value change */
  onComponentValueChange: (componentId: string, value: unknown) => void;

  /** Chat input value */
  chatInputValue: string;

  /** Update chat input value */
  onChatInputChange: (value: string) => void;

  /** Chat input ref for focus management */
  chatInputRef?: React.RefObject<HTMLInputElement | null>;

  /** Is LLM currently generating? */
  isGeneratingLLM?: boolean;

  /** Panel width in pixels */
  panelWidth: number;

  /** Update panel width (for resize) */
  onPanelWidthChange: (width: number) => void;

  /** Execution context for step actions (snooze/skip) */
  actionContext?: StepActionContext;

  /** Callback when step action succeeds (snooze/skip) */
  onActionSuccess?: () => void;
}

/**
 * Execution context for step actions (snooze/skip popovers)
 */
export interface StepActionContext {
  /** Workflow execution ID */
  executionId: string;

  /** Current user ID */
  userId: string;
}

/**
 * Props for the StepHeader component
 */
export interface StepHeaderProps {
  /** The step data */
  step: StepChatGroup;

  /** Whether the step is expanded */
  isExpanded: boolean;

  /** Whether the step is pinned */
  isPinned: boolean;

  /** Toggle expand/collapse */
  onToggle: () => void;

  /** Navigate to this step (for re-opening completed steps) */
  onNavigateToStep?: () => void;

  /** Toggle pin state */
  onTogglePin: () => void;

  /** Update custom title */
  onTitleChange: (title: string) => void;

  /** Whether this is the current step */
  isCurrentStep: boolean;

  /** Execution context for step actions (snooze/skip) */
  actionContext?: StepActionContext;

  /** Callback when step action succeeds (snooze/skip) */
  onActionSuccess?: () => void;
}

/**
 * Props for StepMessages component
 */
export interface StepMessagesProps {
  /** Messages to display */
  messages: ChatMessage[];

  /** Handle button click */
  onButtonClick: (buttonValue: string) => void;

  /** Handle component value change */
  onComponentValueChange: (componentId: string, value: unknown) => void;

  /** Whether this step is active (affects button states) */
  isActive: boolean;
}

/**
 * Props for StepInput component
 */
export interface StepInputProps {
  /** Current input value */
  value: string;

  /** Update input value */
  onChange: (value: string) => void;

  /** Submit the message */
  onSubmit: () => void;

  /** Input ref for focus management */
  inputRef?: React.RefObject<HTMLInputElement | null>;

  /** Is LLM generating? */
  isGenerating?: boolean;

  /** Placeholder text */
  placeholder?: string;
}

// ============================================================================
// LAYOUT CONFIGURATION
// ============================================================================

/**
 * Step chat panel layout configuration
 */
export interface StepChatLayoutConfig {
  /** Default panel width in pixels */
  defaultWidth: number;

  /** Minimum panel width in pixels */
  minWidth: number;

  /** Maximum panel width in pixels */
  maxWidth: number;
}

/**
 * Default layout configuration
 */
export const DEFAULT_STEP_CHAT_LAYOUT: StepChatLayoutConfig = {
  defaultWidth: 340,
  minWidth: 280,
  maxWidth: 450,
};

// ============================================================================
// HOOKS TYPES
// ============================================================================

/**
 * Return type for useStepExpansionState hook
 */
export interface UseStepExpansionStateReturn {
  /** Expansion states keyed by step index */
  expansionStates: Record<number, ExpansionState>;

  /** Expand a step */
  expandStep: (stepIndex: number) => void;

  /** Collapse a step */
  collapseStep: (stepIndex: number) => void;

  /** Pin a step (prevent auto-collapse) */
  pinStep: (stepIndex: number) => void;

  /** Unpin a step */
  unpinStep: (stepIndex: number) => void;

  /** Toggle pin state */
  togglePin: (stepIndex: number) => void;

  /** Mark step as completed (triggers auto-collapse timer) */
  setStepCompleted: (stepIndex: number) => void;

  /** Get expansion state for a step */
  getExpansionState: (stepIndex: number) => ExpansionState;

  /** Check if a step is expanded (expanded or pinned) */
  isStepExpanded: (stepIndex: number) => boolean;

  /** Check if a step is pinned */
  isStepPinned: (stepIndex: number) => boolean;
}

/**
 * Props for useStepExpansionState hook
 */
export interface UseStepExpansionStateProps {
  /** Total number of steps */
  totalSteps: number;

  /** Current active step index */
  currentStepIndex: number;

  /** Delay before auto-collapse in ms (default: 1500) */
  autoCollapseDelay?: number;

  /** Callback when step expansion changes */
  onExpansionChange?: (stepIndex: number, state: ExpansionState) => void;
}

/**
 * Return type for useStepChatState hook
 */
export interface UseStepChatStateReturn {
  /** Step-grouped structure */
  stepGroups: StepChatGroup[];

  /** Custom titles keyed by step index */
  customTitles: Record<number, string>;

  /** Update custom title for a step */
  setCustomTitle: (stepIndex: number, title: string) => void;

  /** Get the current step group */
  currentStepGroup: StepChatGroup | undefined;

  // Expansion state (delegated)
  expansionStates: Record<number, ExpansionState>;
  expandStep: (stepIndex: number) => void;
  collapseStep: (stepIndex: number) => void;
  togglePin: (stepIndex: number) => void;
}
