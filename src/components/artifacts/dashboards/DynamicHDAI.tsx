"use client";

import React, { useState } from 'react';
import CustomerOverview from '../workflows/components/CustomerOverview';
import Analytics from '../workflows/components/Analytics';
import ChatInterface from '../workflows/components/ChatInterface';
import ArtifactsPanel from '../workflows/components/ArtifactsPanel';
import { WorkflowConfig } from '../workflows/config/WorkflowConfig';
import { pricingAnalysisDemoConfig } from '../workflows/config/configs/PricingAnalysisDemoConfig';

const DynamicHDAI: React.FC = () => {
  // Use the pricing analysis demo configuration (has proper analytics structure)
  const config: WorkflowConfig = pricingAnalysisDemoConfig;

  // Initialize with config defaults - force split mode to show all four quadrants
  const [statsHeight, setStatsHeight] = useState(config.layout.statsHeight || 45.3);
  const [chatWidth] = useState(50); // 50% width for chat
  const [isSplitMode, setIsSplitMode] = useState(true); // Force split mode to show artifacts panel
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [visibleArtifacts, setVisibleArtifacts] = useState<Set<string>>(new Set());

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
      initialMessage: (currentConfig.chat as any).initialMessage,
      branches: (currentConfig.chat as any).branches || {},
      userTriggers: (currentConfig.chat as any).userTriggers || {}
    }
  } : config.chat;
  
  const currentArtifactsConfig = isSlideBased
    ? (currentConfig.artifacts || config.artifacts)
    : config.artifacts;
  const currentSidePanelConfig = config.sidePanel;

  const handleStepClick = (stepId: string) => {
    console.log('Step clicked:', stepId);
  };

  const toggleSplitMode = () => {
    setIsSplitMode(!isSplitMode);
  };

  const startStatsResize = (e: React.MouseEvent) => {
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      const containerHeight = window.innerHeight;
      const newHeight = (e.clientY / containerHeight) * 100;
      setStatsHeight(Math.max(20, Math.min(60, newHeight)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden">
      {/* STATS SECTION */}
      {isStatsVisible && (
        <div 
          className="bg-white border-b border-gray-200 overflow-hidden"
          style={{ height: `${statsHeight}%` }}
        >
          <div className="h-full flex">
            {/* Customer Overview */}
            {config.customerOverview && (
              <div className="h-full" style={{ width: `${100 - chatWidth}%` }}>
                <CustomerOverview
                  config={config.customerOverview}
                  className="h-full"
                />
              </div>
            )}

            {/* Analytics */}
            {config.analytics && (
              <div className="h-full border-l border-gray-200" style={{ width: `${chatWidth}%` }}>
                <Analytics
                  config={config.analytics as any}
                  className="h-full"
                />
              </div>
            )}
          </div>
          
          {/* Resize Handle */}
          <div
            className="h-1 bg-gray-300 hover:bg-blue-500 cursor-ns-resize transition-colors"
            onMouseDown={startStatsResize}
          >
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-0.5 bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA - Chat and Artifacts */}
      <div className="flex h-full" style={{ height: `${100 - statsHeight}%` }}>
        {/* CHAT CONTAINER */}
        <div className="h-full border-r border-gray-200" style={{ width: `${chatWidth}%` }}>
          <ChatInterface
            config={currentChatConfig}
            isSplitMode={isSplitMode}
            onToggleSplitMode={toggleSplitMode}
            className="h-full"
            startingWith="ai"
            workflowConfig={config}
          />
        </div>

        {/* ARTIFACTS CONTAINER */}
        {isSplitMode && (
          <div className="h-full overflow-hidden" style={{ width: `${100 - chatWidth}%` }}>
            <ArtifactsPanel
              config={currentArtifactsConfig}
              sidePanelConfig={currentSidePanelConfig}
              workflowConfigName="dynamic-hd-ai"
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

export default DynamicHDAI;