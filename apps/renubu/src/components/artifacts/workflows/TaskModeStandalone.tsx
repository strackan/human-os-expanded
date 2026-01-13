"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import CustomerOverview from './components/CustomerOverview';
import Analytics from './components/Analytics';
import ChatInterface from './components/ChatInterface';
import ArtifactsPanel from './components/ArtifactsPanel';
import FinalSlide from './components/FinalSlide';
import { WorkflowConfig } from './config/WorkflowConfig';
import { ConversationAction } from './utils/conversationEngine';
import { getChartTemplate } from './config/chartTemplates';

interface TaskModeStandaloneProps {
  workflowConfig: WorkflowConfig;
  workflowConfigName?: string;
  showArtifact?: boolean;
  startingWith?: "ai" | "user";
  className?: string;
}

/**
 * Standalone version of TaskModeAdvanced without modal constraints
 * Extracts the core layout and functionality for full-page rendering
 */
const TaskModeStandalone: React.FC<TaskModeStandaloneProps> = ({
  workflowConfig,
  workflowConfigName = "standalone",
  showArtifact = false,
  startingWith = "ai",
  className = ""
}) => {
  // Use the provided config
  const config: WorkflowConfig = workflowConfig;
  
  // Debug: Log what config we received
  console.log('TaskModeStandalone received:', {
    workflowConfigName,
    customerName: config.customer?.name,
    configPassed: !!workflowConfig,
    hasAnalytics: !!config.analytics,
    hasCustomerOverview: !!config.customerOverview,
    hasChat: !!config.chat,
    hasArtifacts: !!config.artifacts
  });

  // Layout states - no modal constraints
  const [statsHeight, setStatsHeight] = useState(config.layout?.statsHeight || 45.3);
  const [isSplitMode, setIsSplitMode] = useState(config.layout?.splitModeDefault || false);
  const [chatWidth, setChatWidth] = useState(config.layout?.chatWidth || 50);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [visibleArtifacts, setVisibleArtifacts] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showFinalSlide, setShowFinalSlide] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Initialize with showArtifact if requested
  useEffect(() => {
    if (showArtifact) {
      setIsSplitMode(true);
      setVisibleArtifacts(new Set(['planning-checklist-renewal']));
    }
  }, [showArtifact]);

  // Determine if we're using slides or traditional config
  const isSlideBased = config.slides && config.slides.length > 0;
  const currentConfig = isSlideBased ? config.slides![currentSlideIndex] : config;

  // Create proper ChatConfig from slide config or use main config
  const currentChatConfig = isSlideBased ? {
    ...config.chat,
    mode: 'dynamic' as const,
    dynamicFlow: {
      startsWith: 'ai' as const,
      defaultMessage: config.chat.dynamicFlow?.defaultMessage || "I understand you'd like to discuss something else. How can I help?",
      initialMessage: (currentConfig.chat as any).dynamicFlow?.initialMessage,
      branches: (currentConfig.chat as any).dynamicFlow?.branches || {},
      userTriggers: (currentConfig.chat as any).dynamicFlow?.userTriggers || {}
    }
  } : config.chat;

  const currentArtifactsConfig = isSlideBased
    ? (currentConfig.artifacts || config.artifacts)
    : config.artifacts;
  const currentSidePanelConfig = config.sidePanel;

  // Check if current slide has visible artifacts (standard mode)
  const hasVisibleArtifacts = currentArtifactsConfig?.sections?.some(s => s.visible) ?? false;

  // Debug logging
  console.log('[TaskModeStandalone] Slide:', currentSlideIndex, {
    isSlideBased,
    currentConfigId: (currentConfig as any)?.id,
    currentArtifactsConfig,
    hasVisibleArtifacts,
    sections: currentArtifactsConfig?.sections
  });

  const chatInterfaceRef = useRef<{
    showWorkingMessage: () => void;
    hideWorkingMessage: () => void;
    getMessages?: () => any[];
    getCurrentInput?: () => string;
    restoreState?: (messages: any[], inputValue: string) => void;
    resetChat?: () => void;
    navigateToBranch?: (branchId: string) => void;
    advanceToNextStep?: (stepTitle: string) => void;
    startNewSlideConversation?: (slideTitle: string) => void;
  }>(null);

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

  const handleStepComplete = (stepId: string) => {
    console.log('TaskModeStandalone: Marking step as completed:', stepId);
    setCompletedSteps(prev => new Set(prev).add(stepId));
  };

  const handleArtifactAction = (action: ConversationAction) => {
    if (action.type === 'showArtifact' && action.payload?.artifactId) {
      setVisibleArtifacts(prev => new Set(prev).add(action.payload.artifactId));
      setIsSplitMode(true);
    } else if (action.type === 'removeArtifact' && action.payload?.artifactId) {
      setVisibleArtifacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(action.payload.artifactId);
        if (newSet.size === 0) {
          setIsSplitMode(false);
        }
        return newSet;
      });
    } else if (action.type === 'completeStep') {
      if (action.payload?.stepId) {
        handleStepComplete(action.payload.stepId);
      }
    } else if (action.type === 'advanceWithoutComplete') {
      console.log('TaskModeStandalone: Processing advanceWithoutComplete action - smart progression');
      // Smart progression: step → step → slide → customer (without marking complete)
      if (isSlideBased && config.slides) {
        const currentSlide = config.slides[currentSlideIndex];

        // Check if there are pending steps in the current slide
        const currentSlideSteps = currentSlide?.sidePanel?.steps || [];
        const nextPendingStep = currentSlideSteps.find(step => !completedSteps.has(step.id));

        if (nextPendingStep && nextPendingStep.workflowBranch) {
          // Advance to next step within current slide
          console.log('Smart progression: Advancing to next step:', nextPendingStep.id, 'branch:', nextPendingStep.workflowBranch);
          if (chatInterfaceRef.current?.navigateToBranch) {
            chatInterfaceRef.current.navigateToBranch(nextPendingStep.workflowBranch);
          }
        } else {
          // No pending steps in current slide, advance to next slide
          const nextSlideIndex = currentSlideIndex + 1;
          if (nextSlideIndex < config.slides.length) {
            // Advance to next slide
            console.log('Smart progression: No pending steps, advancing to next slide:', nextSlideIndex);
            const nextSlide = config.slides[nextSlideIndex];

            // Reset UI state for new workflow
            setIsSplitMode(false);
            setVisibleArtifacts(new Set());
            setIsStatsVisible(true);
            // Reset to 50/50 split
            setChatWidth(50);

            // Update slide index
            setCurrentSlideIndex(nextSlideIndex);

            // Reset chat with separator and new slide conversation
            setTimeout(() => {
              if (chatInterfaceRef.current?.startNewSlideConversation) {
                chatInterfaceRef.current.startNewSlideConversation(nextSlide.title);
              }
            }, 50);
          } else {
            // At last slide, just reset in standalone mode
            console.log('Smart progression: At last slide, resetting');
            chatInterfaceRef.current?.resetChat?.();
            setVisibleArtifacts(new Set());
            setIsSplitMode(false);
            setShowFinalSlide(false);
          }
        }
      }
    } else if (action.type === 'resetWorkflow') {
      console.log('TaskModeStandalone: Processing resetWorkflow action');
      setCompletedSteps(new Set());
      setCurrentSlideIndex(0);
      if (chatInterfaceRef.current?.resetChat) {
        chatInterfaceRef.current.resetChat();
      }
    } else if ((action as any).type === 'nextStep') {
      console.log('TaskModeStandalone: Processing nextStep action');
      const { stepId, stepTitle, artifactId, branchId } = action.payload || {};

      if (stepId) {
        handleStepComplete(stepId);
      }
      if (artifactId) {
        setVisibleArtifacts(new Set([artifactId]));
        setIsSplitMode(true);
      }
      if (stepTitle && chatInterfaceRef.current?.advanceToNextStep) {
        chatInterfaceRef.current.advanceToNextStep(stepTitle);
      }
      if (branchId && chatInterfaceRef.current?.navigateToBranch) {
        setTimeout(() => {
          chatInterfaceRef.current?.navigateToBranch?.(branchId);
        }, 100);
      }
      setIsStatsVisible(false);
    } else if (action.type === 'exitTaskMode') {
      // In standalone, just reset the state
      chatInterfaceRef.current?.resetChat?.();
      setVisibleArtifacts(new Set());
      setIsSplitMode(false);
      setShowFinalSlide(false);
    } else if (action.type === 'nextCustomer') {
      // In standalone, just reset the state
      chatInterfaceRef.current?.resetChat?.();
      setVisibleArtifacts(new Set());
      setIsSplitMode(false);
      setShowFinalSlide(false);
    } else if (action.type === 'showFinalSlide') {
      setShowFinalSlide(true);
    } else if ((action as any).type === 'showWorkingMessage') {
      chatInterfaceRef.current?.showWorkingMessage();
    } else if ((action as any).type === 'hideWorkingMessage') {
      chatInterfaceRef.current?.hideWorkingMessage();
    }
  };

  const handleStepClick = (stepId: string) => {
    console.log('Step clicked:', stepId);
  };

  const toggleSplitMode = () => {
    setIsSplitMode(prev => !prev);
    if (!isSplitMode && visibleArtifacts.size === 0) {
      setVisibleArtifacts(new Set(['planning-checklist-renewal']));
    } else if (isSplitMode && visibleArtifacts.size > 0) {
      setVisibleArtifacts(new Set());
    }
  };

  const toggleStatsVisibility = () => {
    setIsStatsVisible(prev => !prev);
  };

  const startHorizontalDividerResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startY = e.clientY;
    const startHeight = statsHeight;

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = ((startHeight + (deltaY / window.innerHeight) * 100));
      setStatsHeight(Math.max(0, Math.min(100, newHeight)));
    };

    const stopDrag = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const startVerticalDividerResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = chatWidth;

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = ((startWidth + (deltaX / window.innerWidth) * 100));
      setChatWidth(Math.max(0, Math.min(100, newWidth)));
    };

    const stopDrag = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  if (showFinalSlide) {
    return (
      <FinalSlide
        onClose={() => {}}
        message="That's all for today!"
      />
    );
  }

  return (
    <div id="task-mode-container" data-mode="standalone" className={`w-full h-screen bg-gray-50 overflow-hidden ${className}`}>
      {/* HEADER */}
      <div id="task-mode-header" className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Task Mode</h2>
          </div>
          <button
            onClick={toggleStatsVisibility}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 rounded-md transition-all duration-200 shadow-sm"
            title={isStatsVisible ? "Hide stats section" : "Show stats section"}
          >
            {isStatsVisible ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="text-xs font-medium">{isStatsVisible ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-800">{config.customer.name}</h2>
            {config.customer.nextCustomer && (
              <button
                onClick={() => handleArtifactAction({ type: 'nextCustomer' })}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
              >
                Next Customer - {config.customer.nextCustomer}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATS SECTION */}
      {isStatsVisible && (
        <div
          id="task-mode-stats"
          data-visible={isStatsVisible}
          data-dragging={isDragging}
          className={`bg-gray-50 border-b border-gray-200 flex-shrink-0 overflow-hidden ${
            isDragging ? '' : 'transition-all duration-500 ease-in-out'
          }`}
          style={{
            height: `${statsHeight}%`,
            minHeight: '120px',
            maxHeight: '50%',
            padding: '1rem',
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
      )}

      {/* HORIZONTAL DIVIDER - Only visible when stats are shown */}
      {isStatsVisible && (
        <div
          id="divider-horizontal"
          className="divider-horizontal"
          onMouseDown={startHorizontalDividerResize}
        >
          <div className="divider-handle">
            <div className="divider-handle-horizontal"></div>
            <div className="divider-handle-horizontal"></div>
          </div>
        </div>
      )}

      {/* BODY AREA - Chat messages and artifacts */}
      <div
        id="task-mode-body"
        data-dragging={isDragging}
        className={`flex bg-white overflow-hidden ${
          isDragging ? '' : 'transition-all duration-500 ease-in-out'
        }`}
        style={{
          minHeight: '300px',
          height: isStatsVisible ? `calc(100% - 80px - ${statsHeight}% - 6px)` : 'calc(100% - 80px)',
          maxHeight: isStatsVisible ? `calc(100% - 80px - ${statsHeight}% - 6px)` : 'calc(100% - 80px)'
        }}
      >
        {/* CHAT MESSAGES CONTAINER */}
        <div
          id="task-mode-chat"
          className="flex flex-col h-full overflow-hidden"
          style={{
            width: (isSplitMode || visibleArtifacts.size > 0 || hasVisibleArtifacts) ? `${chatWidth}%` : '100%',
            borderRight: (isSplitMode || visibleArtifacts.size > 0 || hasVisibleArtifacts) ? '1px solid #e5e7eb' : 'none'
          }}
        >
          <ChatInterface
            key="standalone-chat"
            config={currentChatConfig}
            isSplitMode={isSplitMode}
            onToggleSplitMode={toggleSplitMode}
            startingWith={startingWith}
            className="h-full overflow-hidden"
            onArtifactAction={handleArtifactAction}
            workingMessageRef={chatInterfaceRef}
            workflowConfig={config}
          />
        </div>

        {/* VERTICAL DIVIDER - Show when there are visible artifacts */}
        {(isSplitMode || visibleArtifacts.size > 0 || hasVisibleArtifacts) && (
          <div
            id="divider-vertical"
            className="divider-vertical"
            onMouseDown={startVerticalDividerResize}
          >
            <div className="divider-handle">
              <div className="divider-handle-vertical"></div>
              <div className="divider-handle-vertical"></div>
            </div>
          </div>
        )}

        {/* ARTIFACTS CONTAINER - Show when current slide has visible artifacts */}
        {(isSplitMode || visibleArtifacts.size > 0 || hasVisibleArtifacts) && (
          <div id="task-mode-artifacts" className="h-full overflow-hidden" style={{ width: `${100 - chatWidth}%` }}>
            <ArtifactsPanel
              config={currentArtifactsConfig}
              sidePanelConfig={currentSidePanelConfig}
              workflowConfigName={workflowConfigName}
              className="h-full overflow-hidden"
              visibleArtifacts={config.chat.mode === 'dynamic' ? visibleArtifacts : undefined}
              onStepClick={handleStepClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModeStandalone;