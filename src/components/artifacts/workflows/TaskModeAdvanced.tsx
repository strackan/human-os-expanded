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

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import CustomerOverview from './components/CustomerOverview';
import Analytics from './components/Analytics';
import ChatInterface from './components/ChatInterface';
import ArtifactsPanel from './components/ArtifactsPanel';
import { WorkflowConfig, defaultWorkflowConfig } from './config/WorkflowConfig';
import { ConversationAction } from './utils/conversationEngine';

interface TaskModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact_visible?: boolean;
  showArtifact?: boolean; // New prop to control initial artifact visibility
  conversationSeed?: any[] | null;
  starting_with?: "ai" | "user";
  workflowConfig?: WorkflowConfig;
  workflowConfigName?: string;
  onNextCustomer?: () => void;
  groupProgress?: string;
  inline?: boolean; // New prop to render inline instead of as modal
  onShowWorkingMessage?: () => void; // Callback to show "Working On It" message
  onHideWorkingMessage?: () => void; // Callback to hide "Working On It" message
}

// Interface for exposed methods
export interface TaskModeModalRef {
  openArtifact: () => void;
  closeArtifact: () => void;
  toggleSplitMode: () => void;
}

const TaskModeModal = forwardRef<TaskModeModalRef, TaskModeModalProps>(({
  isOpen,
  onClose,
  artifact_visible = false,
  showArtifact = true, // Default to true for backward compatibility
  conversationSeed = null,
  starting_with = "ai",
  workflowConfig = defaultWorkflowConfig,
  workflowConfigName = "default",
  onNextCustomer,
  groupProgress,
  inline = false,
  onShowWorkingMessage,
  onHideWorkingMessage
}, ref) => {
  // Use configuration with overrides
  const config: WorkflowConfig = {
    ...workflowConfig,
    chat: {
      ...workflowConfig.chat,
      conversationSeed: conversationSeed || workflowConfig.chat.conversationSeed
    },
    layout: {
      ...workflowConfig.layout,
      splitModeDefault: showArtifact ? artifact_visible : false
    }
  };

  // Initialize with config defaults

  // Modal dimensions and position
  const [modalDimensions, setModalDimensions] = useState(config.layout.modalDimensions);

  // Layout states
  const [dividerPosition, setDividerPosition] = useState(config.layout.dividerPosition);
  const [isSplitMode, setIsSplitMode] = useState(config.layout.splitModeDefault);
  const [chatWidth, setChatWidth] = useState(config.layout.chatWidth);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [visibleArtifacts, setVisibleArtifacts] = useState<Set<string>>(new Set());

  const modalRef = useRef<HTMLDivElement>(null);
  const chatInterfaceRef = useRef<{
    showWorkingMessage: () => void;
    hideWorkingMessage: () => void;
    getMessages?: () => any[];
    getCurrentInput?: () => string;
    restoreState?: (messages: any[], inputValue: string) => void;
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
    } else {
      console.log('TaskModeAdvanced: Unknown action type:', action.type);
    }
  };

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    openArtifact,
    closeArtifact,
    toggleSplitMode
  }), []);

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
    
    const startY = e.clientY;
    const modalRect = modalRef.current?.getBoundingClientRect();
    if (!modalRect) return;
    const startPosition = dividerPosition;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const modalHeight = modalRect.height - 60; // Account for header height
      const deltaPercent = (deltaY / modalHeight) * 100;
      const newPosition = Math.max(25, Math.min(75, startPosition + deltaPercent));
      setDividerPosition(newPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Vertical divider resize
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

  // Render inline or as modal based on inline prop
  const containerClasses = inline 
    ? "w-full h-full bg-white flex flex-col"
    : "fixed bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col z-50";
  
  const containerStyles = inline 
    ? {}
    : {
        top: '50px',
        left: '50px',
        width: '1200px',
        height: '800px',
        minWidth: '400px',
        minHeight: '300px',
        maxWidth: '95vw',
        maxHeight: '95vh'
      };

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
                onClick={onNextCustomer}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
              >
                Next Customer - {config.customer.nextCustomer || 'Next'}
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
        className={`bg-gray-50 border-b border-gray-200 flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${
          isStatsVisible ? 'opacity-100' : 'opacity-0 max-h-0'
        }`}
        style={{ 
          maxHeight: isStatsVisible ? '250px' : '0px',
          minHeight: isStatsVisible ? '150px' : '0px',
          padding: isStatsVisible ? '1rem' : '0rem'
        }}
      >
        <div className="flex space-x-4">
          {/* Left Side - Customer Overview */}
          <CustomerOverview config={config.customerOverview} />

          {/* Right Side - Analytics Quadrants */}
          <Analytics config={config.analytics} />
        </div>
      </div>

      {/* HORIZONTAL DIVIDER - Only visible when stats are shown */}
      {isStatsVisible && (
        <div
          className="bg-gray-200 border-y border-gray-300 cursor-ns-resize flex items-center justify-center hover:bg-gray-300 transition-all duration-500 ease-in-out flex-shrink-0"
          style={{ height: '6px' }}
          onMouseDown={startHorizontalDividerResize}
        >
          <div className="flex flex-col space-y-px">
            <div className="w-8 h-px bg-gray-500"></div>
            <div className="w-8 h-px bg-gray-500"></div>
          </div>
        </div>
      )}

      {/* CHAT AND ARTIFACTS AREA */}
      <div
        className="flex bg-white flex-1 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* CHAT CONTAINER */}
        <div
          className="flex flex-col h-full overflow-hidden"
          style={{
            width: isSplitMode ? `${chatWidth}%` : '100%',
            borderRight: isSplitMode ? '1px solid #e5e7eb' : 'none'
          }}
        >
          <ChatInterface
            config={config.chat}
            isSplitMode={isSplitMode}
            onToggleSplitMode={toggleSplitMode}
            startingWith={starting_with as "ai" | "user"}
            className="flex-1 overflow-hidden"
            onArtifactAction={handleArtifactAction}
            workingMessageRef={chatInterfaceRef}
          />
        </div>

        {/* VERTICAL DIVIDER - Only in split mode */}
        {isSplitMode && (
          <div 
            className="w-2 bg-gray-200 cursor-ew-resize hover:bg-gray-300 transition-colors flex items-center justify-center"
            onMouseDown={startVerticalDividerResize}
          >
            <div className="flex flex-col space-y-1">
              <div className="w-px h-3 bg-gray-500"></div>
              <div className="w-px h-3 bg-gray-500"></div>
              <div className="w-px h-3 bg-gray-500"></div>
            </div>
          </div>
        )}

        {/* ARTIFACTS CONTAINER - Only in split mode */}
        {isSplitMode && (
          <div className="h-full overflow-hidden" style={{ width: `${100 - chatWidth}%` }}>
            <ArtifactsPanel
              config={config.artifacts}
              workflowConfigName={workflowConfigName}
              className="h-full overflow-hidden"
              visibleArtifacts={config.chat.mode === 'dynamic' ? visibleArtifacts : undefined}
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
      />
      {!isModalOpen && (
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