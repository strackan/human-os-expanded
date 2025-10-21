/**
 * ArtifactsPanel Component with Collapsible Side Menu
 *
 * Refactored version using hooks and extracted components for better maintainability.
 *
 * Features:
 * - Collapsible side menu that extends to the right of artifacts
 * - Three methods: showSideMenu(), removeSideMenu(), toggleSideMenu()
 * - Keyboard accessible with proper ARIA labels
 * - Callback support for parent components to track state changes
 * - Ref-based API for programmatic control
 */

import React, { useState, useImperativeHandle } from 'react';
import { ChevronRight } from 'lucide-react';
import { ArtifactsConfig, SidePanelConfig } from '../config/WorkflowConfig';
import { useSideMenu } from './hooks/useSideMenu';
import { useVisibleArtifacts } from './hooks/useVisibleArtifacts';
import { useChecklistItems } from './hooks/useChecklistItems';
import { SideMenu } from './SideMenu';
import { renderArtifact } from './ArtifactRendererRegistry';

interface ArtifactsPanelProps {
  config: ArtifactsConfig;
  sidePanelConfig?: SidePanelConfig;
  className?: string;
  workflowConfigName?: string;
  visibleArtifacts?: Set<string>;
  onSideMenuToggle?: (isVisible: boolean) => void;
  onStepClick?: (stepId: string, workflowBranch: string) => void;
  onChapterNavigation?: (chapterNumber: number) => void;
  onToggleStatsVisibility?: () => void;
  onArtifactButtonClick?: (action: any) => void;
  sideMenuRef?: React.RefObject<{
    showSideMenu: () => void;
    removeSideMenu: () => void;
    toggleSideMenu: () => void;
  }>;
  completedSteps?: Set<string>;
  progressPercentage?: number;
  currentStepNumber?: number;
  totalSteps?: number;
  currentSlideIndex?: number;
  totalSlides?: number;
}

const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({
  config,
  sidePanelConfig,
  className = '',
  workflowConfigName = 'bluebird-planning',
  visibleArtifacts,
  onSideMenuToggle,
  onStepClick,
  onChapterNavigation,
  onToggleStatsVisibility,
  onArtifactButtonClick,
  sideMenuRef,
  completedSteps,
  progressPercentage,
  currentSlideIndex,
  totalSlides,
  currentStepNumber,
  totalSteps
}) => {
  // Hooks
  const sideMenu = useSideMenu({ onToggle: onSideMenuToggle });
  const visibleSections = useVisibleArtifacts({ config, visibleArtifacts });
  const { checklistItems, setChecklistItems, handleChecklistItemClick } = useChecklistItems({
    visibleSections,
    onChapterNavigation
  });

  // State for side menu active status (enabled after planning)
  const [isSideMenuActive, setIsSideMenuActive] = useState<boolean>(false);

  // Fixed sidebar width - no resizing
  const sidebarWidth = 240;

  // Expose side menu methods to parent components via ref
  useImperativeHandle(sideMenuRef, () => ({
    showSideMenu: sideMenu.showSideMenu,
    removeSideMenu: sideMenu.removeSideMenu,
    toggleSideMenu: sideMenu.toggleSideMenuVisibility
  }), [sideMenu]);

  return (
    <div className={`bg-gray-50 h-full relative ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Artifacts</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={sideMenu.toggleSideMenuVisibility}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            title={sideMenu.state.isVisible ? "Hide workflow steps" : "Show workflow steps"}
            aria-label={sideMenu.state.isVisible ? "Hide workflow steps" : "Show workflow steps"}
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${sideMenu.state.isVisible ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-full" style={{ height: 'calc(100% - 60px)' }}>
        <div className="flex flex-col flex-1">
          {/* Scrollable Artifacts Content */}
          <div
            className="p-6 text-gray-700 overflow-y-auto"
            style={{ paddingBottom: '140px' }}
          >
            {visibleSections.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <p>No artifacts yet</p>
                  <p className="text-sm mt-2">Artifacts will appear here as you interact</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {visibleSections.map((section) =>
                  renderArtifact({
                    section,
                    onArtifactButtonClick,
                    onChapterNavigation,
                    setChecklistItems
                  })
                )}
              </div>
            )}
          </div>

          {/* Fixed Progress Meter Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">Planning Stage</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage !== undefined ? progressPercentage : 20}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {/* Show step-based progress for workflows */}
                {totalSteps ? (
                  currentStepNumber === 0 ? (
                    <>Opening</>
                  ) : (
                    <>Step {currentStepNumber} of {totalSteps}</>
                  )
                ) : (
                  <>Workflow 1 of 1</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side Menu */}
        <SideMenu
          isVisible={sideMenu.state.isVisible}
          isCollapsed={sideMenu.state.isCollapsed}
          onToggleCollapse={sideMenu.toggleSideMenuCollapse}
          onRemove={sideMenu.removeSideMenu}
          sidePanelConfig={sidePanelConfig}
          width={sidebarWidth}
          onStepClick={onStepClick}
          checklistItems={checklistItems}
          onChecklistItemClick={handleChecklistItemClick}
          isActive={isSideMenuActive}
          completedSteps={completedSteps}
          progressPercentage={progressPercentage}
          currentSlideIndex={currentSlideIndex}
          totalSlides={totalSlides}
        />
      </div>
    </div>
  );
};

export default ArtifactsPanel;
