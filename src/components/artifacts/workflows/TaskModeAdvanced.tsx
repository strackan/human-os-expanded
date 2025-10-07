/**
 * TaskModeModal Component with Enhanced Artifact Control
 * 
 * Features:
 * - showArtifact prop: Controls initial artifact visibility (default: true)
 * - openArtifact(): Programmatically opens split mode and shows artifacts
 * - closeArtifact(): Programmatically closes artifacts and exits split mode
 * - toggleSplitMode(): Toggles between split and full-width chat modes
 * - Fixed "Exit Split" button functionality
 * - inline prop: Renders inline instead of as modal overlay
 * 
 * Usage:
 * ```tsx
 * const taskModeRef = useRef<TaskModeModalRef>(null);
 * 
 * // Control artifacts programmatically
 * taskModeRef.current?.openArtifact();
 * taskModeRef.current?.closeArtifact();
 * taskModeRef.current?.toggleSplitMode();
 * 
 * // As modal overlay
 * <TaskModeModal
 *   ref={taskModeRef}
 *   isOpen={isOpen}
 *   showArtifact={false} // Start without artifacts
 *   onClose={onClose}
 * />
 * 
 * // As inline component
 * <TaskModeModal
 *   ref={taskModeRef}
 *   isOpen={isOpen}
 *   inline={true} // Renders inline instead of as modal
 *   onClose={onClose}
 * />
 * ```
 */

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import CustomerOverview from './components/CustomerOverview';
import Analytics from './components/Analytics';
import ChatInterface from './components/ChatInterface';
import ArtifactsPanel from './components/ArtifactsPanel';
import FinalSlide from './components/FinalSlide';
import { WorkflowConfig, defaultWorkflowConfig } from './config/WorkflowConfig';
import { ConversationAction } from './utils/conversationEngine';
import { isLastTemplateInGroup } from './config/templateGroups';
import { getChartTemplate } from './config/chartTemplates';
import { getWorkflow } from './configs/workflows/workflowRegistry';

interface TaskModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact_visible?: boolean;
  showArtifact?: boolean; // New prop to control initial artifact visibility
  conversationSeed?: any[] | null;
  starting_with?: "ai" | "user";
  workflowId?: string; // NEW: Load workflow from registry (e.g., 'renewal-planning')
  workflowConfig?: WorkflowConfig; // LEGACY: Direct config for backwards compat
  workflowConfigName?: string;
  onNextCustomer?: () => void;
  nextCustomerName?: string; // Next customer name for template groups
  groupProgress?: string;
  inline?: boolean; // New prop to render inline instead of as modal
  onShowWorkingMessage?: () => void; // Callback to show "Working On It" message
  onHideWorkingMessage?: () => void; // Callback to hide "Working On It" message
  templateGroupId?: string; // Template group ID for checking if this is the last template
  currentTemplateIndex?: number; // Current template index in the group
}

// Interface for exposed methods
export interface TaskModeModalRef {
  openArtifact: () => void;
  closeArtifact: () => void;
  toggleSplitMode: () => void;
  resetToInitialState: () => void;
}

const TaskModeModal = forwardRef<TaskModeModalRef, TaskModeModalProps>(({
  isOpen,
  onClose,
  artifact_visible = false,
  showArtifact = true, // Default to true for backward compatibility
  conversationSeed = null,
  starting_with = "ai",
  workflowId,
  workflowConfig,
  workflowConfigName = "default",
  onNextCustomer,
  nextCustomerName,
  groupProgress,
  inline = false,
  onShowWorkingMessage,
  onHideWorkingMessage,
  templateGroupId,
  currentTemplateIndex = 0
}, ref) => {
  // Load workflow from registry if workflowId provided
  // Initialize with default first to avoid conditional hooks
  const initialConfig = workflowId
    ? getWorkflow(workflowId) || defaultWorkflowConfig
    : workflowConfig || defaultWorkflowConfig;

  const [loadedConfig, setLoadedConfig] = useState<WorkflowConfig>(initialConfig);

  useEffect(() => {
    if (workflowId) {
      // NEW: Load from registry
      console.log('TaskModeAdvanced: Loading workflow from registry:', workflowId);
      const config = getWorkflow(workflowId);
      if (config) {
        setLoadedConfig(config);
      } else {
        console.error('TaskModeAdvanced: Workflow not found:', workflowId);
        setLoadedConfig(defaultWorkflowConfig);
      }
    } else if (workflowConfig) {
      // LEGACY: Use passed config
      console.log('TaskModeAdvanced: Using passed workflowConfig');
      setLoadedConfig(workflowConfig);
    }
  }, [workflowId, workflowConfig]);

  // Use loaded configuration with overrides
  // Memoize to prevent recreation on every render, which was causing useEffect instability
  const config: WorkflowConfig = useMemo(() => ({
    ...loadedConfig,
    chat: {
      ...loadedConfig.chat,
      conversationSeed: conversationSeed || loadedConfig.chat.conversationSeed
    }
  }), [loadedConfig, conversationSeed]);

  // Initialize with config defaults

  // Modal dimensions and position
  const [modalDimensions, setModalDimensions] = useState(loadedConfig.layout.modalDimensions);

  // Layout states
  const [statsHeight, setStatsHeight] = useState(loadedConfig.layout.statsHeight || 45.3); // Default 45.3% for stats
  const [isSplitMode, setIsSplitMode] = useState(loadedConfig.layout.splitModeDefault || false); // Honor each config's splitModeDefault
  const [chatWidth, setChatWidth] = useState(loadedConfig.layout.chatWidth);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [visibleArtifacts, setVisibleArtifacts] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false); // Track dragging state
  const [showFinalSlide, setShowFinalSlide] = useState(false); // Track final slide state
  const [currentStepNumber, setCurrentStepNumber] = useState(0); // Single source of truth for step tracking (0 = initial greeting)
  const [isSideMenuVisible, setIsSideMenuVisible] = useState(false); // Track side menu visibility
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set()); // Track which steps have been completed

  // Reset split mode when template changes
  React.useEffect(() => {
    setIsSplitMode(loadedConfig.layout.splitModeDefault || false);
    setVisibleArtifacts(new Set()); // Also clear any visible artifacts
  }, [workflowConfigName, loadedConfig.layout.splitModeDefault]);

  // Adjust chat width when side menu visibility changes to maintain equal widths
  React.useEffect(() => {
    if (isSideMenuVisible) {
      // Side menu is visible, adjust chat width to compensate
      // The side menu takes 240px, so we need to reduce the chat percentage
      // to maintain equal widths between chat and artifacts
      setChatWidth(45); // Reduce from 50% to 45% to compensate for side menu
    } else {
      // Side menu is hidden, restore original chat width
      setChatWidth(loadedConfig.layout.chatWidth);
    }
  }, [isSideMenuVisible, loadedConfig.layout.chatWidth]);

  // Use config directly (no more slide-based complexity)
  console.log('TaskModeAdvanced: Config analysis:', {
    customerName: config.customer?.name,
    hasInitialMessage: !!config.chat?.dynamicFlow?.initialMessage,
    hasDynamicFlow: !!config.chat?.dynamicFlow,
    totalSteps: config.sidePanel?.steps?.length || 0,
    initialMessageText: config.chat?.dynamicFlow?.initialMessage?.text?.substring(0, 50)
  });
  
  // Use config directly (no more slide-based complexity)
  const currentArtifactsConfig = config.artifacts;
  const currentSidePanelConfig = config.sidePanel;

  // Calculate progress percentage based on current step number
  const progressPercentage = currentSidePanelConfig?.steps
    ? (Math.min(currentStepNumber, currentSidePanelConfig.steps.length) / currentSidePanelConfig.steps.length) * 100
    : 0;

  const modalRef = useRef<HTMLDivElement>(null);
  const chatInterfaceRef = useRef<{
    showWorkingMessage: () => void;
    hideWorkingMessage: () => void;
    getMessages?: () => any[];
    getCurrentInput?: () => string;
    restoreState?: (messages: any[], inputValue: string) => void;
    resetChat?: () => void;
  }>(null);
  const sideMenuRef = useRef<{
    showSideMenu: () => void;
    removeSideMenu: () => void;
    toggleSideMenu: () => void;
  }>(null);

  // Simple close handler
  const handleClose = () => {
    onClose();
  };

  // New artifact control methods
  const openArtifact = () => {
    setIsSplitMode(true);
    setChatWidth(50);
  };

  const closeArtifact = () => {
    setIsSplitMode(false);
    setVisibleArtifacts(new Set());
  };

  const toggleSplitMode = () => {
    if (isSplitMode) {
      // Use closeArtifact method when exiting split mode
      closeArtifact();
    } else {
      // Use openArtifact method when entering split mode
      openArtifact();
    }
  };

  const toggleStatsVisibility = () => {
    console.log('Toggling stats visibility from:', isStatsVisible, 'to:', !isStatsVisible);
    setIsStatsVisible(!isStatsVisible);
  };

  /**
   * Central action handler for all workflow actions
   *
   * UI/Layout Actions:
   * - launch-artifact: Add artifact to visible set (keeps existing artifacts)
   * - showArtifact: Show artifact exclusively (replaces all other visible artifacts)
   * - removeArtifact: Remove artifact from visible set
   * - showMenu: Open side menu in artifacts panel
   *
   * Navigation Actions:
   * - exitTaskMode: Close modal, used for snooze/skip workflow
   * - nextCustomer: Advance to next customer in sequence
   * - nextSlide: Advance to next workflow slide
   * - showFinalSlide: Show completion screen
   * - advanceWithoutComplete: Smart progression without marking step complete
   *
   * Workflow State Actions:
   * - completeStep: Mark step complete, increment currentStepNumber, auto-navigate to next step's branch
   * - resetWorkflow: Reset workflow state (currentStepNumber + chat)
   * - resetChat: Reset chat only (clear messages, reset conversation engine)
   * - resetToInitialState: Full reset (workflow + UI layout + all state)
   *
   * Chat Flow Actions (handled in ChatInterface, passed through here):
   * - nextChat: Auto-continue to next conversation branch (internal to ChatInterface)
   */
  const handleArtifactAction = (action: ConversationAction) => {
    console.log('TaskModeAdvanced: Received action:', action);
    
    if (action.type === 'launch-artifact' && action.payload?.artifactId) {
      console.log('TaskModeAdvanced: Processing launch-artifact for:', action.payload.artifactId);
      setVisibleArtifacts(prev => new Set(prev).add(action.payload.artifactId));
    } else if (action.type === 'showArtifact') {
      console.log('TaskModeAdvanced: Processing showArtifact for:', action.payload?.artifactId);
      
      // Open the artifact and enable split mode
      if (action.payload?.artifactId) {
        setVisibleArtifacts(new Set([action.payload.artifactId]));
        openArtifact();
        setIsStatsVisible(false); // Hide stats to give artifact full right side
      }
    } else if (action.type === 'removeArtifact') {
      console.log('TaskModeAdvanced: Processing removeArtifact for:', action.payload?.artifactId);
      // Remove the artifact if specified
      if (action.payload?.artifactId) {
        setVisibleArtifacts(prev => {
          const newSet = new Set(prev);
          newSet.delete(action.payload.artifactId);
          return newSet;
        });
        // If no artifacts are visible, close the artifact panel
        if (visibleArtifacts.size <= 1) {
          closeArtifact();
        }
      }
    } else if (action.type === 'showMenu') {
      console.log('TaskModeAdvanced: Processing showMenu action');
      // Enable split mode and show the menu/artifacts panel
      openArtifact();
      setIsStatsVisible(false); // Hide stats when showing menu
      // Open the side menu within ArtifactsPanel
      if (sideMenuRef.current) {
        sideMenuRef.current.showSideMenu();
      }
    } else if (action.type === 'exitTaskMode') {
      console.log('TaskModeAdvanced: Processing exitTaskMode action');
      // For snooze/skip actions, use display:none to completely reset content
      if (modalRef.current) {
        modalRef.current.style.display = 'none';
      }
      // Also call onClose to trigger any parent component cleanup
      onClose();
    } else if (action.type === 'nextCustomer') {
      console.log('TaskModeAdvanced: Processing nextCustomer action');
      // For snooze/skip actions, use display:none to completely reset content
      if (modalRef.current) {
        modalRef.current.style.display = 'none';
      }
      // Trigger next customer functionality if provided, otherwise just close
      if (onNextCustomer) {
        onNextCustomer();
      } else {
        onClose();
      }
    } else if (action.type === 'resetChat') {
      console.log('TaskModeAdvanced: Processing resetChat action');
      // Reset the chat interface to initial state
      if (chatInterfaceRef.current && chatInterfaceRef.current.resetChat) {
        chatInterfaceRef.current.resetChat();
      }
    } else if (action.type === 'resetToInitialState') {
      console.log('TaskModeAdvanced: Processing resetToInitialState action');
      // Check if this is the last template in a group
      if (templateGroupId && isLastTemplateInGroup(templateGroupId, currentTemplateIndex)) {
        console.log('TaskModeAdvanced: Last template in group, showing final slide instead of reset');
        setShowFinalSlide(true);
      } else {
        // Reset everything to initial state - simulate browser refresh
        resetToInitialState();
      }
    } else if (action.type === 'showFinalSlide') {
      console.log('TaskModeAdvanced: Processing showFinalSlide action');
      // Show the final slide
      setShowFinalSlide(true);
    } else if (action.type === 'nextSlide') {
      console.log('TaskModeAdvanced: nextSlide action deprecated - workflows use steps, not slides');
    } else if (action.type === 'completeStep') {
      console.log('TaskModeAdvanced: Processing completeStep action for:', action.payload?.stepId);
      // Mark step as completed
      if (action.payload?.stepId) {
        handleStepComplete(action.payload.stepId);
      }
    } else if (action.type === 'enterStep') {
      console.log('TaskModeAdvanced: Processing enterStep action - advancing to step:', action.payload?.stepNumber);
      // Enter a new step (increment step number without marking previous complete)
      if (action.payload?.stepNumber !== undefined) {
        const stepNumber = action.payload.stepNumber;

        // Get the step info for the step we're entering
        const enteringStep = currentSidePanelConfig?.steps?.[stepNumber - 1]; // stepNumber is 1-based, array is 0-based

        // Add separator for the step we're entering
        if (enteringStep && chatInterfaceRef.current?.addSeparator) {
          chatInterfaceRef.current.addSeparator(enteringStep.title);
        }

        // Update step number
        setCurrentStepNumber(stepNumber);
      }
    } else if (action.type === 'advanceWithoutComplete') {
      console.log('TaskModeAdvanced: Processing advanceWithoutComplete action');
      // Advance to next customer without marking step complete
      if (modalRef.current) {
        modalRef.current.style.display = 'none';
      }
      if (onNextCustomer) {
        onNextCustomer();
      } else {
        onClose();
      }
    } else if (action.type === 'resetWorkflow') {
      console.log('TaskModeAdvanced: Processing resetWorkflow action');
      // Reset step number to beginning
      setCurrentStepNumber(1);
      // Reset the chat interface
      if (chatInterfaceRef.current && chatInterfaceRef.current.resetChat) {
        chatInterfaceRef.current.resetChat();
      }
    } else if (action.type === 'navigateToBranch') {
      console.log('TaskModeAdvanced: Processing navigateToBranch action for:', action.payload?.branchId);
      // Navigate to a specific conversation branch
      if (action.payload?.branchId && chatInterfaceRef.current) {
        // @ts-ignore - navigateToBranch might not be in the type definition yet
        if (chatInterfaceRef.current.navigateToBranch) {
          // @ts-ignore
          chatInterfaceRef.current.navigateToBranch(action.payload.branchId);
        } else {
          console.warn('navigateToBranch method not available on chat interface');
        }
      }
    } else {
      console.log('TaskModeAdvanced: Unknown action type:', action.type);
    }
  };

  const handleStepClick = (stepId: string, workflowBranch: string) => {
    console.log('TaskModeAdvanced: Step clicked:', stepId, 'branch:', workflowBranch);

    // Trigger the chat to navigate to the specific workflow branch
    if (chatInterfaceRef.current && workflowBranch) {
      // We'll need to add a method to the chat interface to handle branch navigation
      // For now, we can trigger it through the conversation engine
      console.log('Navigating to workflow branch:', workflowBranch);
      // This would need to be implemented in the ChatInterface component
    }
  };

  const handleStepComplete = (stepId: string) => {
    console.log('TaskModeAdvanced: Completing step:', stepId, 'Current step number:', currentStepNumber);

    // Mark step as completed (for sidebar visual feedback)
    setCompletedSteps(prev => new Set([...prev, stepId]));

    // Increment step number when a step is completed
    const nextStepNumber = currentStepNumber + 1;
    setCurrentStepNumber(nextStepNumber);

    console.log('TaskModeAdvanced: Step completed, advanced to step:', nextStepNumber);

    // Note: Separator is added by enterStep action when entering the NEXT step
    // This separates step completion from step entry
  };

  // No longer needed - workflows don't have slide navigation

  // Resolve analytics config template variables
  const resolveAnalyticsConfig = (analyticsConfig: any) => {
    const resolved = { ...analyticsConfig };
    
    // Resolve usageTrend if it's a template variable
    if (typeof resolved.usageTrend === 'string' && resolved.usageTrend.startsWith('{{chart.')) {
      const match = resolved.usageTrend.match(/\{\{chart\.(\w+)\.(\w+)\}\}/);
      if (match) {
        const [, chartType, trend] = match;
        resolved.usageTrend = getChartTemplate(chartType as any, trend as 'falling' | 'flat' | 'rising');
      }
    }
    
    // Resolve userLicenses if it's a template variable
    if (typeof resolved.userLicenses === 'string' && resolved.userLicenses.startsWith('{{chart.')) {
      const match = resolved.userLicenses.match(/\{\{chart\.(\w+)\.(\w+)\}\}/);
      if (match) {
        const [, chartType, trend] = match;
        resolved.userLicenses = getChartTemplate(chartType as any, trend as 'falling' | 'flat' | 'rising');
      }
    }
    
    return resolved;
  };

  // Resolve customer overview config template variables
  const resolveCustomerOverviewConfig = (customerOverviewConfig: any) => {
    const resolved = { ...customerOverviewConfig };
    
    // Resolve yoyGrowth if it's a template variable
    if (typeof resolved.metrics?.yoyGrowth === 'string' && resolved.metrics.yoyGrowth.startsWith('{{chart.')) {
      const match = resolved.metrics.yoyGrowth.match(/\{\{chart\.(\w+)\.(\w+)\}\}/);
      if (match) {
        const [, chartType, trend] = match;
        resolved.metrics.yoyGrowth = getChartTemplate(chartType as any, trend as 'falling' | 'flat' | 'rising');
      }
    }
    
    // Resolve lastMonth if it's a template variable
    if (typeof resolved.metrics?.lastMonth === 'string' && resolved.metrics.lastMonth.startsWith('{{chart.')) {
      const match = resolved.metrics.lastMonth.match(/\{\{chart\.(\w+)\.(\w+)\}\}/);
      if (match) {
        const [, chartType, trend] = match;
        resolved.metrics.lastMonth = getChartTemplate(chartType as any, trend as 'falling' | 'flat' | 'rising');
      }
    }
    
    return resolved;
  };

  // Reset to initial state method
  const resetToInitialState = () => {
    console.log('TaskModeAdvanced: Resetting to initial state');
    // Reset all component state to initial values
    setStatsHeight(config.layout.statsHeight || 50);
    setIsSplitMode(config.layout.splitModeDefault);
    setChatWidth(config.layout.chatWidth);
    setIsStatsVisible(true);
    setVisibleArtifacts(new Set());
    setIsDragging(false);
    setCurrentStepNumber(0); // Reset to step 0 (initial greeting/opening)
    setShowFinalSlide(false); // Reset final slide state
    setCompletedSteps(new Set()); // Reset completed steps
    
    // Reset modal dimensions to initial values
    setModalDimensions(config.layout.modalDimensions);
    
    // Show the modal again (in case it was hidden)
    if (modalRef.current) {
      modalRef.current.style.display = 'block';
    }
    
    // Reset the chat interface - this will handle both dynamic and static configs
    if (chatInterfaceRef.current && chatInterfaceRef.current.resetChat) {
      chatInterfaceRef.current.resetChat();
    }
  };

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    openArtifact,
    closeArtifact,
    toggleSplitMode,
    resetToInitialState
  }), [config]);

  // External modal resize functionality
  const startModalResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const modalRect = modalRef.current?.getBoundingClientRect();
    if (!modalRect) return;

    const startWidth = modalRect.width;
    const startHeight = modalRect.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('right')) {
        newWidth = Math.max(400, Math.min(window.innerWidth * 0.95, startWidth + deltaX));
      }
      if (direction.includes('left')) {
        newWidth = Math.max(400, Math.min(window.innerWidth * 0.95, startWidth - deltaX));
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(300, Math.min(window.innerHeight - 160, startHeight + deltaY));
      }
      if (direction.includes('top')) {
        newHeight = Math.max(300, Math.min(window.innerHeight - 160, startHeight - deltaY));
      }

      if (modalRef.current) {
        modalRef.current.style.width = `${newWidth}px`;
        modalRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    let cursor = 'nwse-resize';
    if (direction === 'top' || direction === 'bottom') cursor = 'ns-resize';
    if (direction === 'left' || direction === 'right') cursor = 'ew-resize';
    if (direction === 'top-left' || direction === 'bottom-right') cursor = 'nwse-resize';
    if (direction === 'top-right' || direction === 'bottom-left') cursor = 'nesw-resize';

    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Horizontal divider resize
  const startHorizontalDividerResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true); // Start dragging
    const startY = e.clientY;
    const modalRect = modalRef.current?.getBoundingClientRect();
    if (!modalRect) return;
    const startStatsHeight = statsHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const modalHeight = modalRect.height - 60; // Account for header height
      const deltaPercent = (deltaY / modalHeight) * 100;
      const newStatsHeight = Math.max(15, Math.min(60, startStatsHeight + deltaPercent));
      setStatsHeight(newStatsHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setIsDragging(false); // End dragging
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Vertical divider resize - using same pattern as horizontal divider
  const startVerticalDividerResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const modalRect = modalRef.current?.getBoundingClientRect();
    if (!modalRect) return;
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / modalRect.width) * 100;
      const newWidth = Math.max(25, Math.min(75, startWidth + deltaPercent));
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Always render to preserve state - visibility controlled by parent
  // Reset display style when modal is reopened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.style.display = 'block';
    }
  }, [isOpen]);

  // Render inline or as modal based on inline prop
  const containerClasses = inline
    ? "w-full h-full bg-white flex flex-col"
    : "fixed bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col z-50";

  // Calculate modal width and positioning based on side menu visibility
  const sideMenuWidth = 240;
  const baseModalWidth = 90; // 90vw
  const additionalWidth = isSideMenuVisible ? sideMenuWidth : 0;

  const containerStyles = inline
    ? {}
    : {
        top: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `calc(${baseModalWidth}vw + ${additionalWidth}px)`,
        height: '90vh',
        minWidth: '400px',
        minHeight: '500px',
        transition: 'width 300ms ease-in-out'
      };

  // Show final slide if requested
  if (showFinalSlide) {
    return (
      <FinalSlide 
        onClose={onClose}
        message="That's all for today!"
      />
    );
  }

  return (
    <div
      ref={modalRef}
      className={containerClasses}
      style={containerStyles}
    >
      {/* EXTERNAL RESIZE HANDLES - Only show when not inline */}
      {!inline && (
        <>
          {/* Corner Handles */}
      <div
        className="absolute -top-1 -left-1 w-5 h-5 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity z-50"
        onMouseDown={(e) => startModalResize(e, 'top-left')}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-br"></div>
      </div>
      <div
        className="absolute -top-1 -right-1 w-5 h-5 cursor-ne-resize opacity-0 hover:opacity-100 transition-opacity z-50"
        onMouseDown={(e) => startModalResize(e, 'top-right')}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-bl ml-2"></div>
      </div>
      <div
        className="absolute -bottom-1 -left-1 w-5 h-5 cursor-sw-resize opacity-0 hover:opacity-100 transition-opacity z-50"
        onMouseDown={(e) => startModalResize(e, 'bottom-left')}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-tr"></div>
      </div>
      <div
        className="absolute -bottom-1 -right-1 w-5 h-5 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity z-50"
        onMouseDown={(e) => startModalResize(e, 'bottom-right')}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-tl ml-2"></div>
      </div>
      
      {/* Edge Handles */}
      <div
        className="absolute -top-2 h-4 cursor-ns-resize opacity-0 hover:opacity-50 bg-blue-500 transition-opacity z-40"
        style={{ left: '20px', right: '20px' }}
        onMouseDown={(e) => startModalResize(e, 'top')}
      >
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600"></div>
      </div>
      <div
        className="absolute -bottom-2 h-4 cursor-ns-resize opacity-0 hover:opacity-50 bg-blue-500 transition-opacity z-40"
        style={{ left: '20px', right: '20px' }}
        onMouseDown={(e) => startModalResize(e, 'bottom')}
      >
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600"></div>
      </div>
      <div
        className="absolute -left-2 w-4 cursor-ew-resize opacity-0 hover:opacity-50 bg-blue-500 transition-opacity z-40"
        style={{ top: '20px', bottom: '20px' }}
        onMouseDown={(e) => startModalResize(e, 'left')}
      >
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-blue-600"></div>
      </div>
      <div
        className="absolute -right-2 w-4 cursor-ew-resize opacity-0 hover:opacity-50 bg-blue-500 transition-opacity z-40"
        style={{ top: '20px', bottom: '20px' }}
        onMouseDown={(e) => startModalResize(e, 'right')}
      >
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-blue-600"></div>
      </div>
        </>
      )}

      {/* HEADER */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Task Mode</h2>
            {groupProgress && (
              <p className="text-sm text-gray-600">Demo Progress: {groupProgress}</p>
            )}
          </div>
          <button
            onClick={toggleStatsVisibility}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 rounded-md transition-all duration-200 shadow-sm"
            title={isStatsVisible ? "Hide stats section" : "Show stats section"}
          >
            {isStatsVisible ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">
              {isStatsVisible ? 'Hide Stats' : 'Show Stats'}
            </span>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-800">{config.customer.name}</h2>
            {(onNextCustomer || config.customer.nextCustomer) && (
              <button
                onClick={() => {
                  // Check if this is the last template in a group
                  if (templateGroupId && isLastTemplateInGroup(templateGroupId, currentTemplateIndex)) {
                    setShowFinalSlide(true);
                  } else if (onNextCustomer) {
                    onNextCustomer();
                  }
                }}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
              >
                {templateGroupId && isLastTemplateInGroup(templateGroupId, currentTemplateIndex)
                  ? "That's all for today!"
                  : `Next Customer - ${nextCustomerName || config.customer.nextCustomer || 'Next'}`
                }
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold ml-4"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* DATA AREA */}
      <div
        className={`bg-gray-50 border-b border-gray-200 flex-shrink-0 overflow-hidden ${
          isStatsVisible ? 'opacity-100' : 'opacity-0'
        } ${
          isDragging ? '' : 'transition-all duration-500 ease-in-out'
        }`}
        style={{
          height: isStatsVisible ? `${statsHeight}%` : '0px',
          minHeight: isStatsVisible ? '120px' : '0px',
          maxHeight: isStatsVisible ? '50%' : '0px',
          padding: isStatsVisible ? '1rem' : '0rem',
          boxSizing: 'border-box'
        }}
      >
        <div className="flex space-x-4 h-full">
          {/* Left Side - Customer Overview */}
          <CustomerOverview config={resolveCustomerOverviewConfig(config.customerOverview)} />

          {/* Right Side - Analytics Quadrants */}
          <Analytics config={resolveAnalyticsConfig(config.analytics)} />
        </div>
      </div>

      {/* HORIZONTAL DIVIDER - Only visible when stats are shown */}
      {isStatsVisible && (
        <div
          className="bg-gray-200 border-y border-gray-300 cursor-ns-resize flex items-center justify-center hover:bg-gray-300 transition-colors duration-200 flex-shrink-0"
          style={{ height: '6px' }}
          onMouseDown={startHorizontalDividerResize}
        >
          <div className="flex flex-col space-y-px">
            <div className="w-8 h-px bg-gray-500"></div>
            <div className="w-8 h-px bg-gray-500"></div>
          </div>
        </div>
      )}

      {/* BODY AREA - Chat messages and artifacts */}
      <div
        className={`flex bg-white overflow-hidden ${
          isDragging ? '' : 'transition-all duration-500 ease-in-out'
        }`}
        style={{
          minHeight: '300px',
          height: isStatsVisible ? 'calc(100% - 80px - ' + statsHeight + '% - 6px)' : 'calc(100% - 80px)',
          maxHeight: isStatsVisible ? 'calc(100% - 80px - ' + statsHeight + '% - 6px)' : 'calc(100% - 80px)'
        }}
      >
        {/* CHAT MESSAGES CONTAINER */}
        <div
          className="flex flex-col h-full overflow-hidden"
          style={{
            width: (isSplitMode || visibleArtifacts.size > 0) ? `${chatWidth}%` : '100%',
            borderRight: (isSplitMode || visibleArtifacts.size > 0) ? '1px solid #e5e7eb' : 'none'
          }}
        >
          <ChatInterface
            key={workflowConfigName} // Force remount when template changes
            config={config.chat}
            isSplitMode={isSplitMode}
            onToggleSplitMode={toggleSplitMode}
            startingWith={starting_with as "ai" | "user"}
            className="h-full overflow-hidden"
            onArtifactAction={handleArtifactAction}
            workingMessageRef={chatInterfaceRef}
            workflowConfig={config}
            sidePanelConfig={currentSidePanelConfig}
            currentStepNumber={currentStepNumber}
          />
        </div>

        {/* VERTICAL DIVIDER - Show when there are visible artifacts */}
        {(isSplitMode || visibleArtifacts.size > 0) && (
          <div
            className="bg-gray-200 border-x border-gray-300 cursor-ew-resize flex items-center justify-center hover:bg-gray-300 transition-all duration-500 ease-in-out flex-shrink-0"
            style={{ width: '6px' }}
            onMouseDown={startVerticalDividerResize}
          >
            <div className="flex flex-col space-y-px">
              <div className="w-px h-8 bg-gray-500"></div>
              <div className="w-px h-8 bg-gray-500"></div>
            </div>
          </div>
        )}

        {/* ARTIFACTS CONTAINER - Show when there are visible artifacts */}
        {(isSplitMode || visibleArtifacts.size > 0) && (
          <div className="h-full overflow-hidden" style={{ width: `${100 - chatWidth}%` }}>
            <ArtifactsPanel
              config={currentArtifactsConfig}
              sidePanelConfig={currentSidePanelConfig}
              workflowConfigName={workflowConfigName}
              className="h-full overflow-hidden"
              visibleArtifacts={config.chat.mode === 'dynamic' ? visibleArtifacts : undefined}
              onStepClick={handleStepClick}
              onArtifactButtonClick={handleArtifactAction}
              currentStepNumber={currentStepNumber}
              progressPercentage={progressPercentage}
              totalSteps={currentSidePanelConfig?.steps?.length}
              completedSteps={completedSteps}
              onSideMenuToggle={(isVisible) => setIsSideMenuVisible(isVisible)}
              sideMenuRef={sideMenuRef}
            />
          </div>
        )}
      </div>

    </div>
  );
});

TaskModeModal.displayName = 'TaskModeModal';

// Minimal demo wrapper to show the component
const Demo = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const taskModeRef = useRef<TaskModeModalRef>(null);

  // Detect if we're in gallery context by checking if we're in a constrained container
  const isInGallery = typeof window !== 'undefined' &&
    window.location.pathname.includes('/artifacts/gallery');

  const exampleConversationSeed = [
    {
      sender: 'ai',
      text: 'Hi, Justin! It appears AcmeCorp\'s usage has increased significantly over the past 4 weeks. Reaching out proactively to engaged customers can increase renewal rates and likelihood of multi-year extensions. Because their renewal is over 120 days away, I recommend an Early Outreach strategy. Shall we proceed, snooze for now, or skip?',
      type: 'buttons',
      buttons: [
        { 
          label: 'Skip', 
          value: 'skip',
          'label-background': '#ef4444',
          'label-text': '#ffffff'
        },
        { 
          label: 'Snooze', 
          value: 'snooze',
          'label-background': '#f59e0b',
          'label-text': '#ffffff'
        },
        { 
          label: 'Proceed', 
          value: 'proceed',
          'label-background': '#10b981',
          'label-text': '#ffffff'
        }
      ]
    },
    {
      sender: 'user',
      text: 'Proceed'
    },
    {
      sender: 'ai',
      text: 'Great. Let\'s get started. Last year, this customer paid $485,000 for 100,000 tokens. This year their usage is projected to be 240,000 tokens, which would generate renewal license fees at $1,164,000. I recommend sending an initial email bringing this to the customer\'s attention. Shall I draft one for you?',
      type: 'buttons',
      buttons: [
        { 
          label: 'No', 
          value: 'no',
          'label-background': '#ef4444',
          'label-text': '#ffffff'
        },
        { 
          label: 'Yes', 
          value: 'yes',
          'label-background': '#10b981',
          'label-text': '#ffffff'
        }
      ]
    },
    {
      sender: 'user',
      text: 'Yes'
    },
    {
      sender: 'ai',
      text: 'Great, I\'ve drafted an email to Sarah Chen to the right. You can send it here or review in your drafts folder. I recommend pursuing a multi-year extension. Let\'s talk later to prepare our strategy. Shall I set a task in three days?',
      type: 'buttons',
      buttons: [
        { 
          label: 'No', 
          value: 'no',
          'label-background': '#ef4444',
          'label-text': '#ffffff'
        },
        { 
          label: 'Yes', 
          value: 'yes',
          'label-background': '#10b981',
          'label-text': '#ffffff'
        }
      ]
    },
    {
      sender: 'user',
      text: 'Yes'
    },
    {
      sender: 'ai',
      text: 'Talk to you then!'
    }
  ];

  return (
    <>
      <TaskModeModal
        ref={taskModeRef}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        artifact_visible={true}
        showArtifact={false} // Start without artifacts visible
        conversationSeed={exampleConversationSeed as any[]}
        starting_with="ai"
        workflowConfig={defaultWorkflowConfig}
        inline={isInGallery} // Render inline when in gallery
      />
      {!isModalOpen && !isInGallery && (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Reopen Task Mode
            </button>
            <div className="text-center text-sm text-gray-600">
              <p>Demo: TaskModeModal with new artifact control methods</p>
              <p>• showArtifact=false: Chat stretches full width initially</p>
              <p>• openArtifact(): Opens split mode with artifacts</p>
              <p>• closeArtifact(): Closes artifacts and exits split</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { TaskModeModal };
export default Demo;