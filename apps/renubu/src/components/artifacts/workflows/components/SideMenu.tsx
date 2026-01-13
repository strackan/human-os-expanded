import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { SidePanelConfig } from '../config/WorkflowConfig';
import { ChecklistItem } from '../../PlanningChecklistArtifact';

interface SideMenuProps {
  isVisible: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  sidePanelConfig?: SidePanelConfig;
  width?: number;
  onStepClick?: (stepId: string, workflowBranch: string) => void;
  checklistItems?: ChecklistItem[];
  onChecklistItemClick?: (itemId: string, index: number) => void;
  isActive?: boolean;
  completedSteps?: Set<string>;
  progressPercentage?: number;
  currentSlideIndex?: number;
  totalSlides?: number;
}

/**
 * SideMenu Component
 *
 * Collapsible side menu that displays workflow steps or checklist items.
 * Features:
 * - Shows workflow progress
 * - Displays checklist items with navigation
 * - Step-based progress tracking
 * - Collapsible for space optimization
 */
export const SideMenu: React.FC<SideMenuProps> = ({
  isVisible,
  isCollapsed,
  onToggleCollapse,
  onRemove,
  sidePanelConfig,
  width = 240,
  onStepClick,
  checklistItems,
  onChecklistItemClick,
  isActive = false,
  completedSteps,
  progressPercentage,
  currentSlideIndex,
  totalSlides
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="flex-shrink-0 transition-all duration-300 ease-in-out border-l border-gray-200"
      style={{
        width: isCollapsed ? '48px' : `${width}px`
      }}
    >
      {/* Sidebar Content */}
      <div className="bg-white h-full overflow-hidden">
        {/* Side Menu Content */}
        {!isCollapsed && (
          <div className="flex flex-col h-full">
            {/* Fixed Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
              {sidePanelConfig ? (
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm">{sidePanelConfig.title.text}</h5>
                  {sidePanelConfig.title.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{sidePanelConfig.title.subtitle}</p>
                  )}
                </div>
              ) : (
                <div>
                  <h5 className="font-semibold text-gray-800 text-sm">Process Steps</h5>
                  <p className="text-xs text-gray-500 mt-1">No configuration available</p>
                </div>
              )}
            </div>

            {/* Scrollable Content - Steps or Checklist Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Show checklist items if available, otherwise show steps */}
              {checklistItems && checklistItems.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-3">Click any item to navigate to that chapter:</p>
                  {checklistItems.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => onChecklistItemClick?.(item.id, index)}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                        item.completed
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      title={`Click to navigate to: ${item.label}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          item.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {item.completed ? (
                            <span className="text-xs">✓</span>
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${
                            item.completed
                              ? 'text-green-800 line-through'
                              : 'text-gray-700'
                          }`}>
                            {item.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sidePanelConfig && sidePanelConfig.showSteps && (
                <ul className="space-y-2">
                  {sidePanelConfig.steps.map((step, index) => {
                    const isCompleted = completedSteps?.has(step.id) || step.status === 'completed';
                    // Active step is the first uncompleted step
                    const firstUncompletedIndex = sidePanelConfig.steps.findIndex(s =>
                      !completedSteps?.has(s.id) && s.status !== 'completed'
                    );
                    const isActive = index === firstUncompletedIndex;

                    return (
                      <li
                        key={step.id}
                        onClick={() => onStepClick?.(step.id, step.workflowBranch ?? '')}
                        className={`flex items-center gap-3 py-1.5 px-2 cursor-pointer rounded transition-colors ${
                          isActive ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-50'
                        }`}
                        title={`Click to navigate to ${step.title}`}
                      >
                        {isCompleted ? (
                          <CheckSquare size={18} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <Square size={18} className="text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          isCompleted ? 'text-gray-500 line-through' : isActive ? 'text-blue-800 font-medium' : 'text-gray-800'
                        }`}>
                          {step.title}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Sticky Progress Meter Footer */}
            {sidePanelConfig && sidePanelConfig.showProgressMeter && (
              <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-700">Progress</span>
                    {sidePanelConfig.progressMeter.showPercentage && (
                      <span className="text-xs text-gray-500">
                        {progressPercentage !== undefined ? Math.round(progressPercentage) : sidePanelConfig.progressMeter.progressPercentage}%
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage !== undefined ? progressPercentage : sidePanelConfig.progressMeter.progressPercentage}%` }}
                    ></div>
                  </div>
                  {sidePanelConfig.progressMeter.showStepNumbers && (
                    <div className="text-xs text-gray-500">
                      {currentSlideIndex !== undefined ? currentSlideIndex + 1 : sidePanelConfig.progressMeter.currentStep} of {totalSlides !== undefined ? totalSlides : sidePanelConfig.progressMeter.totalSteps} completed
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
