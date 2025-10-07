/**
 * ArtifactsPanel Component with Collapsible Side Menu
 * 
 * Features:
 * - Collapsible side menu that extends to the right of artifacts
 * - Three methods: showSideMenu(), removeSideMenu(), toggleSideMenu()
 * - Keyboard accessible with proper ARIA labels
 * - Callback support for parent components to track state changes
 * - Ref-based API for programmatic control
 * 
 * Usage:
 * ```tsx
 * const sideMenuRef = useRef();
 * 
 * // Programmatically control side menu
 * sideMenuRef.current?.showSideMenu();
 * sideMenuRef.current?.removeSideMenu();
 * sideMenuRef.current?.toggleSideMenu();
 * 
 * <ArtifactsPanel
 *   config={config}
 *   sideMenuRef={sideMenuRef}
 *   onSideMenuToggle={(isVisible) => console.log('Side menu visible:', isVisible)}
 * />
 * ```
 */

import React, { useState, useImperativeHandle, useEffect, useMemo } from 'react';
import { ArtifactsConfig, SidePanelConfig } from '../config/WorkflowConfig';
import { ChevronLeft, ChevronRight, X, CheckSquare, Square } from 'lucide-react';
import EmailComposer from './EmailComposer';
import PlanningChecklistArtifact, { ChecklistItem } from '../../PlanningChecklistArtifact';
import PlanningChecklistEnhancedArtifact from '../../PlanningChecklistEnhancedArtifact';
import PricingAnalysisArtifact from '../../PricingAnalysisArtifact';
import ContractArtifact from '../../ContractArtifact';
import ContactStrategyArtifact from '../../ContactStrategyArtifact';
import PlanSummaryArtifact from '../../PlanSummaryArtifact';
import DocumentArtifact from '../../DocumentArtifact';
import QuoteArtifact from '../../QuoteArtifact';

interface ArtifactsPanelProps {
  config: ArtifactsConfig;
  sidePanelConfig?: SidePanelConfig; // Add sidePanel configuration
  className?: string;
  workflowConfigName?: string; // Add this to identify which config is being used
  visibleArtifacts?: Set<string>; // For dynamic mode - controls which artifacts are visible
  onSideMenuToggle?: (isVisible: boolean) => void; // Callback for side menu state changes
  onStepClick?: (stepId: string, workflowBranch: string) => void; // Callback for step clicks
  onChapterNavigation?: (chapterNumber: number) => void; // Callback for chapter navigation
  onToggleStatsVisibility?: () => void; // Function to toggle stats visibility (Hide Stats functionality)
  onArtifactButtonClick?: (action: any) => void; // Callback for artifact button clicks (Let's Do It, Not Yet, etc.)
  sideMenuRef?: React.RefObject<{
    showSideMenu: () => void;
    removeSideMenu: () => void;
    toggleSideMenu: () => void;
  }>; // Ref to expose side menu methods to parent components
  completedSteps?: Set<string>; // Shared state for completed steps
  progressPercentage?: number; // Progress percentage based on step completion
  currentStepNumber?: number; // Current step number
  totalSteps?: number; // Total number of steps in the workflow
}

interface SideMenuState {
  isVisible: boolean;
  isCollapsed: boolean;
}

// Typing animation component for artifact content
const TypingText = ({ text, speed = 10 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span>{displayedText}</span>;
};

const LicenseAnalysisSection = ({ content }: { content: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-800 mb-6 text-lg">License Analysis</h3>
    <div className="space-y-4 text-sm">
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Current License:</span>
        <span className="font-medium">
          {content.currentLicense.tokens.toLocaleString()} tokens @ ${content.currentLicense.unitPrice} - <strong>${content.currentLicense.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Anticipated Renewal Cost:</span>
        <span className="font-medium">
          {content.anticipatedRenewal.tokens.toLocaleString()} tokens @ ${content.anticipatedRenewal.unitPrice} = <strong>${content.anticipatedRenewal.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Early Renewal Discount:</span>
        <span className="font-medium text-orange-600">
          {content.earlyDiscount.percentage}% - <strong>${content.earlyDiscount.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="text-gray-600">Multi-year Discount:</span>
        <span className="font-medium text-green-600">
          {content.multiYearDiscount.percentage}% - <strong>${content.multiYearDiscount.total.toLocaleString()}</strong>
        </span>
      </div>
    </div>
  </div>
);

const EmailDraftSection = ({ content }: { content: any }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content with typing animation after a short delay
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 text-lg">Draft Email</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
            Edit
          </button>
          <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
            Send
          </button>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 border-b border-gray-100 pb-4">
          <div>
            <span className="block font-medium">To:</span>
            <span>{showContent ? <TypingText text={content.to} speed={13} /> : ''}</span>
          </div>
          <div>
            <span className="block font-medium">Subject:</span>
            <span>{showContent ? <TypingText text={content.subject} speed={13} /> : ''}</span>
          </div>
          <div>
            <span className="block font-medium">Priority:</span>
            <span>{showContent ? <TypingText text={content.priority || 'Normal'} speed={13} /> : ''}</span>
          </div>
        </div>

        <div className="space-y-4 leading-relaxed">
          {showContent && content.body && (
            <div className="text-gray-600">
              <TypingText text={content.body} speed={10} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HtmlSection = ({ section }: { section: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    {section.styles && (
      <style dangerouslySetInnerHTML={{ __html: section.styles }} />
    )}
    <div
      className="html-artifact-content"
      dangerouslySetInnerHTML={{ __html: section.htmlContent || '' }}
    />
  </div>
);

const WorkflowSummarySection = ({ content }: { content: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-semibold text-gray-800 text-lg">Workflow Summary</h3>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">{content.customerName}</span>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
    </div>

    {/* Progress Overview */}
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-800">Current Stage</span>
        <span className="text-sm text-blue-600">{content.currentStage}</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${content.progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-blue-600 mt-1">{content.progressPercentage}% Complete</div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Completed Actions */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Completed Actions
          </h4>
          <ul className="space-y-2">
            {content.completedActions.map((action: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                {action}
              </li>
            ))}
          </ul>
        </div>

        {/* Pending Actions */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Pending Actions
          </h4>
          <ul className="space-y-2">
            {content.pendingActions.map((action: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-orange-500 mr-2 mt-1">○</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Next Steps */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Next Steps
          </h4>
          <ul className="space-y-2">
            {content.nextSteps.map((step: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Key Metrics */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Key Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Current ARR</div>
              <div className="font-medium text-gray-800">{content.keyMetrics.currentARR}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Projected ARR</div>
              <div className="font-medium text-gray-800">{content.keyMetrics.projectedARR}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Growth Rate</div>
              <div className="font-medium text-green-600">{content.keyMetrics.growthRate}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Risk Score</div>
              <div className="font-medium text-green-600">{content.keyMetrics.riskScore}</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
            Recommendations
          </h4>
          <ul className="space-y-2">
            {content.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-indigo-500 mr-2 mt-1">💡</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const CustomSection = ({ section }: { section: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-800 mb-6 text-lg">{section.title}</h3>
    <div className="text-sm text-gray-600">
      {JSON.stringify(section.content, null, 2)}
    </div>
  </div>
);

// Side Menu Component
interface SideMenuProps {
  isVisible: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  sidePanelConfig?: SidePanelConfig;
  width?: number;
  onStepClick?: (stepId: string, workflowBranch: string) => void;
  checklistItems?: ChecklistItem[]; // Add checklist items
  onChecklistItemClick?: (itemId: string, index: number) => void; // Add click handler for checklist items
  isActive?: boolean; // Track if side menu is active (enabled after planning)
  completedSteps?: Set<string>; // Shared state for completed steps
  progressPercentage?: number; // Progress percentage based on slide number
  currentSlideIndex?: number; // Current slide index for progress tracking
  totalSlides?: number; // Total number of slides in the workflow
}

const SideMenu: React.FC<SideMenuProps> = ({ isVisible, isCollapsed, onToggleCollapse, onRemove, sidePanelConfig, width = 240, onStepClick, checklistItems, onChecklistItemClick, isActive = false, completedSteps, progressPercentage, currentSlideIndex, totalSlides }) => {
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
                      onClick={() => onStepClick?.(step.id, step.workflowBranch)}
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

const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ config, sidePanelConfig, className = '', workflowConfigName = 'bluebird-planning', visibleArtifacts, onSideMenuToggle, onStepClick, onChapterNavigation, onToggleStatsVisibility, onArtifactButtonClick, sideMenuRef, completedSteps, progressPercentage, currentSlideIndex, totalSlides, currentStepNumber, totalSteps }) => {
  // Side menu state
  const [sideMenuState, setSideMenuState] = useState<SideMenuState>({
    isVisible: false,
    isCollapsed: false
  });

  // State for checklist items
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  // State for side menu active status (enabled after planning)
  const [isSideMenuActive, setIsSideMenuActive] = useState<boolean>(false);

  // Fixed sidebar width - no resizing
  const sidebarWidth = 240; // Fixed width for better UX

  const visibleSections = useMemo(() => {
    return config.sections.filter(s => {
      // If visibleArtifacts is provided (dynamic mode), use it to filter
      if (visibleArtifacts !== undefined) {
        return visibleArtifacts.has(s.id);
      }
      // Otherwise, use the default visibility from config
      return s.visible;
    });
  }, [config.sections, visibleArtifacts]);

  // Extract checklist items from visible sections
  useEffect(() => {
    const checklistSection = visibleSections.find(s =>
      s.type === 'planning-checklist' || s.type === 'planning-checklist-enhanced'
    );

    if (checklistSection && checklistSection.content?.items) {
      setChecklistItems(checklistSection.content.items);
    } else {
      setChecklistItems([]);
    }
  }, [visibleSections]);

  // Handle checklist item clicks in side menu
  const handleChecklistItemClick = (itemId: string, index: number) => {
    // Scroll to the checklist artifact in the main panel
    const checklistElement = document.querySelector(`[data-checklist-item="${itemId}"]`);
    if (checklistElement) {
      checklistElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // If there's an onChapterNavigation callback, use it
    if (onChapterNavigation) {
      onChapterNavigation(index + 1); // Convert to 1-based chapter number
    }
  };

  // Side menu methods
  const showSideMenu = () => {
    setSideMenuState(prev => ({
      ...prev,
      isVisible: true,
      isCollapsed: false
    }));
    onSideMenuToggle?.(true);
  };

  const removeSideMenu = () => {
    setSideMenuState(prev => ({
      ...prev,
      isVisible: false,
      isCollapsed: false
    }));
    onSideMenuToggle?.(false);
  };

  const toggleSideMenuVisibility = () => {
    setSideMenuState(prev => ({
      ...prev,
      isVisible: !prev.isVisible
    }));
    onSideMenuToggle?.(!sideMenuState.isVisible);
  };

  const toggleSideMenuCollapse = () => {
    setSideMenuState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed
    }));
  };

  // Expose side menu methods to parent components via ref
  useImperativeHandle(sideMenuRef, () => ({
    showSideMenu,
    removeSideMenu,
    toggleSideMenu: toggleSideMenuVisibility
  }), []);


  return (
    <div className={`bg-gray-50 h-full relative ${className}`}>
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Artifacts</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSideMenuVisibility}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            title={sideMenuState.isVisible ? "Hide workflow steps" : "Show workflow steps"}
            aria-label={sideMenuState.isVisible ? "Hide workflow steps" : "Show workflow steps"}
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${sideMenuState.isVisible ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
      <div className="flex h-full" style={{ height: 'calc(100% - 60px)' }}>
        <div className="flex flex-col flex-1">
          {/* Scrollable Artifacts Content */}
          <div
            className="p-6 text-gray-700 overflow-y-auto"
            style={{ paddingBottom: '140px' }} // Make room for the fixed footer (increased for better scrolling)
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
                {visibleSections.map((section) => {
                switch (section.type) {
                  case 'license-analysis':
                    return <LicenseAnalysisSection key={section.id} content={section.content} />;
                  case 'email-draft':
                    return <EmailDraftSection key={section.id} content={section.content} />;
                  case 'email':
                    return (
                      <EmailComposer 
                        key={section.id} 
                        content={section.content} 
                        editable={section.editable !== false} // Default to true for email type
                        typingSpeed={8}
                      />
                    );
                  case 'workflow-summary':
                    return <WorkflowSummarySection key={section.id} content={section.content} />;
                  case 'planning-checklist':
                    return (
                      <PlanningChecklistArtifact
                        key={section.id}
                        title={section.content?.description || "Let's review what we need to accomplish:"}
                        items={section.content?.items || []}
                        showActions={section.content?.showActions !== false}
                        onItemToggle={(itemId, completed) => {
                          // Update local checklist state when items are toggled
                          setChecklistItems(prev =>
                            prev.map(item =>
                              item.id === itemId ? { ...item, completed } : item
                            )
                          );
                        }}
                        onLetsDoIt={() => {
                          console.log('Planning Checklist: Let\'s Do It clicked!');
                          // Mark "start-planning" as completed in local state
                          setChecklistItems(prev =>
                            prev.map(item =>
                              item.id === 'start-planning' ? { ...item, completed: true } : item
                            )
                          );
                          // Trigger all actions needed to transition to contract view
                          if (onArtifactButtonClick) {
                            // 1. Complete the step (this updates the shared completedSteps state)
                            onArtifactButtonClick({
                              type: 'completeStep',
                              payload: { stepId: 'start-planning' }
                            });
                            // 2. Show the contract artifact
                            onArtifactButtonClick({
                              type: 'showArtifact',
                              payload: { artifactId: 'enterprise-contract' }
                            });
                            // 3. Show the side menu
                            onArtifactButtonClick({ type: 'showMenu' });
                            // 4. Navigate to the conversation branch to show AI response
                            onArtifactButtonClick({
                              type: 'navigateToBranch',
                              payload: { branchId: 'contract-planning' }
                            });
                          }
                        }}
                        onNotYet={() => {
                          console.log('Planning Checklist: Not Yet clicked - showing concern dialog');
                          // For "Not Yet", we could show a dialog or trigger nextCustomer
                          // For now, just log it - you can add custom behavior here
                          if (onArtifactButtonClick) {
                            onArtifactButtonClick({ type: 'nextCustomer' });
                          }
                        }}
                      />
                    );
                  case 'planning-checklist-enhanced':
                    return (
                      <PlanningChecklistEnhancedArtifact
                        key={section.id}
                        title={section.content?.title || section.content?.description || "Let's review what we need to accomplish:"}
                        subtitle={section.content?.subtitle || "Click any item to navigate to that section of the plan"}
                        items={section.content?.items || []}
                        onChapterNavigation={onChapterNavigation}
                        showActions={section.content?.showActions !== false}
                        enableAnimations={section.content?.enableAnimations !== false}
                        theme={section.content?.theme || 'professional'}
                      />
                    );
                  case 'pricing-analysis':
                    return (
                      <PricingAnalysisArtifact
                        key={section.id}
                        data={section.data || section.content}
                        isLoading={section.isLoading}
                      />
                    );
                  case 'contract':
                    return (
                      <ContractArtifact
                        key={section.id}
                        data={section.data || section.content}
                        isLoading={section.isLoading}
                        error={section.error}
                      />
                    );
                  case 'document':
                    return (
                      <DocumentArtifact
                        key={section.id}
                        data={section.data || section.content}
                        readOnly={section.readOnly === true}
                        title={section.title || 'Document'}
                        onFieldChange={(field, value) => {
                          console.log('Document field changed:', field, value);
                        }}
                      />
                    );
                  case 'contact-strategy':
                    return (
                      <ContactStrategyArtifact
                        key={section.id}
                        {...section.content}
                      />
                    );
                  case 'plan-summary':
                    return (
                      <PlanSummaryArtifact
                        key={section.id}
                        {...section.content}
                      />
                    );
                  case 'quote':
                    return (
                      <QuoteArtifact
                        key={section.id}
                        data={section.data || section.content}
                        readOnly={section.readOnly === true}
                        onFieldChange={(field, value) => {
                          console.log('Quote field changed:', field, value);
                        }}
                      />
                    );
                  case 'html':
                    return <HtmlSection key={section.id} section={section} />;
                  case 'custom':
                    return <CustomSection key={section.id} section={section} />;
                  default:
                    return null;
                }
              })}
              </div>
            )}
          </div>

          {/* Fixed Progress Meter Footer for Main Content */}
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
          isVisible={sideMenuState.isVisible}
          isCollapsed={sideMenuState.isCollapsed}
          onToggleCollapse={toggleSideMenuCollapse}
          onRemove={removeSideMenu}
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