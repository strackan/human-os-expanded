import { createContext, useContext } from 'react';
import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { ChatMessage } from '@/components/workflows/sections/ChatRenderer';

/**
 * TaskModeContext - Communication layer for TaskMode components
 *
 * This context provides bidirectional communication between:
 * - TaskMode (orchestrator)
 * - ChatPanel (left side)
 * - ArtifactPanel (right side)
 * - Header (top)
 * - Modals (overlays)
 *
 * Components can both READ state and TRIGGER actions through this context.
 */
export interface TaskModeContextValue {
  // ============================================================
  // STATE (Read-Only)
  // ============================================================

  /** Current slide being displayed */
  currentSlide: WorkflowSlide | null;

  /** All slides in the workflow */
  slides: WorkflowSlide[];

  /** Index of current slide (0-based) */
  currentSlideIndex: number;

  /** Workflow-specific state data (answers, selections, etc.) */
  workflowState: Record<string, any>;

  /** Chat message history */
  chatMessages: ChatMessage[];

  /** Whether artifacts panel is visible */
  showArtifacts: boolean;

  /** Current branch in conversation flow */
  currentBranch: string | null;

  /** Current chat input value */
  chatInputValue: string;

  /** Customer name for display */
  customerName: string;

  /** Customer data object */
  customer: any | null;

  /** Expansion data (if applicable) */
  expansionData: any | null;

  /** Stakeholder data (if applicable) */
  stakeholders: any[] | null;

  /** UI State */
  showMetricsSlideup: boolean;
  showPlaysDropdown: boolean;
  stepActionMenu: number | null;
  artifactsPanelWidth: number;
  isArtifactResizing: boolean;

  /** Loading/Error states */
  contextLoading: boolean;
  contextError: Error | null;

  // ============================================================
  // NAVIGATION ROUTES
  // ============================================================

  /** Navigate to next slide */
  goToNextSlide: () => void;

  /** Navigate to previous slide */
  goToPreviousSlide: () => void;

  /** Navigate to specific slide by index */
  goToSlide: (index: number) => void;

  // ============================================================
  // CHAT ROUTES (Chat → TaskMode)
  // ============================================================

  /** Send a chat message */
  sendMessage: (message: string) => void;

  /** Handle button click in chat */
  handleButtonClick: (value: string) => void;

  /** Navigate to a conversation branch */
  handleBranchNavigation: (branchId: string) => void;

  /** Update chat input value */
  setChatInputValue: (value: string) => void;

  /** Handle component value change in chat */
  handleComponentValueChange: (componentId: string, value: any) => void;

  // ============================================================
  // ARTIFACT ROUTES (Artifact → TaskMode)
  // ============================================================

  /** Toggle artifacts panel visibility */
  toggleArtifacts: (show: boolean) => void;

  /** Update workflow state from artifact */
  updateWorkflowState: (key: string, value: any) => void;

  /** Set artifacts panel width */
  setArtifactsPanelWidth: (width: number) => void;

  /** Set artifact panel resizing state */
  setIsArtifactResizing: (isResizing: boolean) => void;

  // ============================================================
  // HEADER ROUTES (Header → TaskMode)
  // ============================================================

  /** Toggle metrics slideup */
  toggleMetricsSlideup: (show: boolean) => void;

  /** Toggle plays dropdown */
  togglePlaysDropdown: (show: boolean) => void;

  /** Set step action menu */
  setStepActionMenu: (index: number | null) => void;

  // ============================================================
  // LIFECYCLE ROUTES
  // ============================================================

  /** Complete the workflow */
  handleComplete: () => void;

  /** Snooze current workflow */
  handleSnooze: () => void;

  /** Skip current workflow */
  handleSkip: () => void;

  /** Close the workflow */
  handleClose: () => void;

  /** Skip specific step */
  skipStep: (stepIndex: number) => void;

  /** Snooze specific step */
  snoozeStep: (stepIndex: number) => void;
}

const TaskModeContext = createContext<TaskModeContextValue | null>(null);

/**
 * Hook to access TaskMode context
 * Throws error if used outside TaskModeProvider
 */
export function useTaskModeContext(): TaskModeContextValue {
  const context = useContext(TaskModeContext);

  if (!context) {
    throw new Error('useTaskModeContext must be used within TaskModeProvider');
  }

  return context;
}

export default TaskModeContext;
