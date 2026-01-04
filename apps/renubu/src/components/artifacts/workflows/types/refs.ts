/**
 * Shared reference interfaces for workflow components
 *
 * These interfaces ensure consistency across all component ref implementations
 * and make it clear what methods are available on each component.
 */

/**
 * ChatInterface Component Reference
 *
 * Exposed methods for programmatic control of the chat interface.
 * Used by: TaskModeAdvanced, TaskModeStandalone, DynamicAIHD
 */
export interface ChatInterfaceRef {
  // Message management
  getMessages: () => any[];
  getCurrentInput: () => string;
  restoreState: (messages: any[], inputValue: string) => void;

  // Working state
  showWorkingMessage: () => void;
  hideWorkingMessage: () => void;

  // Chat control
  resetChat: () => void;

  // Navigation
  navigateToBranch: (branchId: string) => void;

  // Step transitions (with separator scroll)
  advanceToNextStep: (stepTitle: string) => void;

  // Slide transitions (complete reset)
  startNewSlideConversation: (slideTitle: string) => void;

  // Scroll control
  scrollForward: () => void;
  scrollBackward: () => void;
}

/**
 * SideMenu Component Reference
 *
 * Exposed methods for programmatic control of the side menu/panel.
 * Used by: ArtifactsPanel
 */
export interface SideMenuRef {
  showSideMenu: () => void;
  hideSideMenu?: () => void; // Optional, some implementations use removeSideMenu
  removeSideMenu?: () => void; // Optional, some implementations use hideSideMenu
  toggleSideMenu: () => void;
}

/**
 * TaskMode Component Reference
 *
 * Exposed methods for programmatic control of the task mode modal.
 * Used by: CSMDashboard, other parent components
 */
export interface TaskModeRef {
  openArtifact: () => void;
  closeArtifact: () => void;
  toggleSplitMode: () => void;
  resetToInitialState: () => void;
}
