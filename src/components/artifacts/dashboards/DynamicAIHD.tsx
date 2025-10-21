"use client";

import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import CustomerOverviewHD from '../workflows/components/CustomerOverviewHD';
import AnalyticsHD from '../workflows/components/AnalyticsHD';
import ChatInterfaceHD from '../workflows/components/ChatInterfaceHD';
import ArtifactsPanelHD from '../workflows/components/ArtifactsPanelHD';
import { WorkflowConfig } from '../workflows/config/WorkflowConfig';
import { dynamicChatAI } from '../workflows/config/configs/DynamicChatFixed';

const DynamicAIHD: React.FC = () => {
  const [statsHeight, setStatsHeight] = useState(50); // 50% height for stats section
  const [isSplitMode, setIsSplitMode] = useState(true); // Start with artifacts visible
  const [chatWidth, setChatWidth] = useState(50); // Chat takes up 50% of lower half
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [visibleArtifacts, setVisibleArtifacts] = useState<Set<string>>(new Set(['planning-checklist-renewal']));
  const [isDragging, setIsDragging] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showFinalSlide, setShowFinalSlide] = useState(false);

  // Ref for ChatInterface to call its methods
  const chatInterfaceRef = useRef<{
    getMessages: () => any[];
    getCurrentInput: () => string;
    restoreState: (messages: any[], inputValue: string) => void;
    showWorkingMessage: () => void;
    hideWorkingMessage: () => void;
    resetChat: () => void;
    advanceToNextStep: (stepTitle: string) => void;
  } | null>(null);

  // Use the dynamic AI configuration
  const config: WorkflowConfig = dynamicChatAI;

  // Get current slide configuration
  const currentSlide = config.slides?.[currentSlideIndex];
  const currentArtifactsConfig = currentSlide?.artifacts || config.artifacts;
  const currentSidePanelConfig = currentSlide?.sidePanel || config.sidePanel;

  const handleStepClick = (stepId: string) => {
    console.log('Step clicked:', stepId);
  };

  // Handle actions from artifacts (like "Let's Do It" button)
  const handleArtifactAction = (action: any) => {
    console.log('DynamicAIHD: Received action:', action);

    if (action.type === 'nextStep') {
      const { stepId, stepTitle, artifactId, showMenu } = action.payload || {};

      // Show artifact if specified
      if (artifactId) {
        console.log('nextStep: Showing artifact:', artifactId);
        setVisibleArtifacts(new Set([artifactId]));
      }

      // Trigger separator scroll with step title
      if (stepTitle && chatInterfaceRef.current?.advanceToNextStep) {
        console.log('nextStep: Triggering separator scroll with title:', stepTitle);
        chatInterfaceRef.current.advanceToNextStep(stepTitle);
      }

      // Hide stats to give artifact full space
      setIsStatsVisible(false);
    }
  };

  const toggleSplitMode = () => {
    setIsSplitMode(!isSplitMode);
  };

  const startStatsResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerHeight = window.innerHeight;
      const newHeight = (e.clientY / containerHeight) * 100;
      setStatsHeight(Math.max(20, Math.min(60, newHeight)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden">
      {/* STATS SECTION - 70% width, Customer Overview and Analytics stacked vertically */}
      {isStatsVisible && (
        <div 
          className="bg-white border-b border-gray-200 overflow-hidden"
          style={{ height: `${statsHeight}%` }}
        >
          <div className="h-full flex justify-center">
            {/* Stats Container - 70% width to remove 30% whitespace */}
            <div className="h-full flex flex-col" style={{ width: '70%' }}>
              {/* Customer Overview - 50% height */}
              {config.customerOverview && (
                <div className="h-1/2 border-b border-gray-200">
                  <CustomerOverviewHD
                    config={config.customerOverview}
                    className="h-full"
                  />
                </div>
              )}

              {/* Analytics - 50% height */}
              {config.analytics && (
                <div className="h-1/2">
                  <AnalyticsHD
                    config={config.analytics as any}
                    className="h-full"
                  />
                </div>
              )}
            </div>
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
        {/* CHAT CONTAINER - Reduced width */}
        <div className="h-full border-r border-gray-200" style={{ width: `${chatWidth}%` }}>
          <ChatInterfaceHD
            ref={chatInterfaceRef}
            config={config.chat}
            workflowConfigName="dynamic-ai-hd"
            className="h-full"
            onStepClick={handleStepClick}
            onArtifactAction={handleArtifactAction}
            visibleArtifacts={visibleArtifacts}
            setVisibleArtifacts={setVisibleArtifacts}
            currentSlideIndex={currentSlideIndex}
            setCurrentSlideIndex={setCurrentSlideIndex}
            showFinalSlide={showFinalSlide}
            setShowFinalSlide={setShowFinalSlide}
            isSplitMode={isSplitMode}
            onToggleSplitMode={toggleSplitMode}
            workflowConfig={config}
          />
        </div>

        {/* ARTIFACTS CONTAINER - Expanded width */}
        {isSplitMode && (
          <div className="h-full overflow-hidden" style={{ width: `${100 - chatWidth}%` }}>
            <ArtifactsPanelHD
              config={currentArtifactsConfig}
              sidePanelConfig={currentSidePanelConfig as any}
              workflowConfigName="dynamic-ai-hd"
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

export default DynamicAIHD;
