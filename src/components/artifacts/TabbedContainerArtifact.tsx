/**
 * TabbedContainerArtifact
 *
 * A composable container that renders multiple artifacts in a tabbed interface.
 * Instead of creating separate "Tab" versions of components, embed existing
 * artifacts within this tabbed container for flexible composition.
 *
 * @example
 * ```tsx
 * <TabbedContainerArtifact
 *   title="Account Review"
 *   tabs={[
 *     { id: 'usage', label: 'Usage', icon: 'chart-bar', artifact: 'BrandPerformanceArtifact', props: {...} },
 *     { id: 'contract', label: 'Contract', icon: 'document-text', artifact: 'ContractArtifact', props: {...} },
 *   ]}
 * />
 * ```
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Check,
  LucideIcon,
} from 'lucide-react';
import componentMap from './componentImports';

// Icon mapping for string-based icon references
const iconMap: Record<string, LucideIcon> = {
  'chart-bar': BarChart3,
  'document-text': FileText,
  'users': Users,
  'trending-up': TrendingUp,
  'exclamation-triangle': AlertTriangle,
};

// Tab status for approval workflow
export type TabStatus = 'pending' | 'current' | 'approved';

export interface TabDefinition {
  id: string;
  label: string;
  icon?: string | LucideIcon;
  artifact: string; // Component name from componentMap
  props?: Record<string, any>;
  show?: boolean; // Optional conditional rendering
  // v0.1.12: Approval workflow status
  status?: TabStatus;
  approvedAt?: string;
  hasComments?: boolean;
}

// Phase approval data for context accumulation
export interface PhaseApproval {
  phaseId: string;
  status: TabStatus;
  llmAnalysis?: string;
  userComments?: string;
  approvedAt?: string;
}

export interface TabbedContainerArtifactProps {
  artifactId?: string;
  title?: string;
  subtitle?: string;
  customerName?: string;
  tabs: TabDefinition[];
  defaultTab?: string;
  onContinue?: () => void;
  onBack?: () => void;
  showNavigation?: boolean;
  // Pass-through props that will be merged with each tab's props
  sharedProps?: Record<string, any>;
  // v0.1.12: Approval workflow callbacks and state
  showApprovalWorkflow?: boolean;
  phaseApprovals?: PhaseApproval[];
  onTabApprove?: (tabId: string, comments?: string) => void;
  onTabStatusChange?: (tabId: string, status: TabStatus) => void;
  // Workflow state communication - triggers chat buttons when all tabs reviewed
  onUpdateState?: (key: string, value: any) => void;
}

export function TabbedContainerArtifact({
  artifactId: _artifactId = 'tabbed-container',
  title = 'Account Review',
  subtitle,
  customerName,
  tabs,
  defaultTab,
  onContinue,
  onBack,
  showNavigation = true,
  sharedProps = {},
  showApprovalWorkflow = false,
  phaseApprovals = [],
  onTabApprove: _onTabApprove,
  onTabStatusChange,
  onUpdateState,
}: TabbedContainerArtifactProps) {
  // Suppress unused variable warnings for optional props
  void _artifactId;
  void _onTabApprove;
  // Filter tabs based on 'show' property (default to true if not specified)
  const visibleTabs = tabs.filter(tab => tab.show !== false);

  const [activeTabId, setActiveTabId] = useState(
    defaultTab || visibleTabs[0]?.id || ''
  );

  // Track which tabs have been reviewed (internal state)
  const [reviewedTabs, setReviewedTabs] = useState<Set<string>>(new Set());

  // Mark a tab as reviewed
  const markTabReviewed = useCallback((tabId: string, reviewed: boolean) => {
    setReviewedTabs(prev => {
      const next = new Set(prev);
      if (reviewed) {
        next.add(tabId);
      } else {
        next.delete(tabId);
      }
      return next;
    });
    // Also call external callback if provided
    if (onTabStatusChange) {
      onTabStatusChange(tabId, reviewed ? 'approved' : 'pending');
    }
  }, [onTabStatusChange]);

  // Check if a tab has been reviewed
  const isTabReviewed = useCallback((tabId: string): boolean => {
    return reviewedTabs.has(tabId);
  }, [reviewedTabs]);

  // Detect when all tabs are reviewed and notify workflow
  useEffect(() => {
    const allReviewed = visibleTabs.length > 0 && visibleTabs.every(tab => reviewedTabs.has(tab.id));

    if (onUpdateState) {
      onUpdateState('allTabsReviewed', allReviewed);

      // Log for debugging
      console.log('[TabbedContainerArtifact] All tabs reviewed:', allReviewed, {
        total: visibleTabs.length,
        reviewed: reviewedTabs.size,
        tabs: visibleTabs.map(t => t.id),
        reviewedTabs: Array.from(reviewedTabs),
      });
    }
  }, [reviewedTabs, visibleTabs, onUpdateState]);

  const activeTab = visibleTabs.find(tab => tab.id === activeTabId);
  const allTabsReviewed = visibleTabs.length > 0 && visibleTabs.every(tab => reviewedTabs.has(tab.id));

  // Get tab status from reviewed state, phaseApprovals, or tab definition
  const getTabStatus = useCallback((tabId: string): TabStatus => {
    // Check internal reviewed state first
    if (reviewedTabs.has(tabId)) return 'approved';
    // Check phaseApprovals (dynamic state)
    const approval = phaseApprovals.find(p => p.phaseId === tabId);
    if (approval) return approval.status;
    // Fall back to tab definition status
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.status) return tab.status;
    // Default: current tab is 'current', others are 'pending'
    return tabId === activeTabId ? 'current' : 'pending';
  }, [reviewedTabs, phaseApprovals, tabs, activeTabId]);

  // Check if tab has comments
  const tabHasComments = useCallback((tabId: string): boolean => {
    const approval = phaseApprovals.find(p => p.phaseId === tabId);
    return !!(approval?.userComments);
  }, [phaseApprovals]);

  // Resolve icon from string or use directly if it's a component
  const resolveIcon = (icon?: string | LucideIcon): LucideIcon | null => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return iconMap[icon] || null;
    }
    return icon;
  };

  // Get the artifact component from the map
  const getArtifactComponent = (artifactName: string): React.ComponentType<any> | null => {
    return componentMap[artifactName] || null;
  };

  if (visibleTabs.length === 0) {
    return (
      <div className="bg-white h-full flex items-center justify-center rounded-lg border border-gray-200">
        <p className="text-gray-500">No tabs configured</p>
      </div>
    );
  }

  const displaySubtitle = subtitle || (customerName ? `Review details for ${customerName}` : undefined);

  return (
    <div className="bg-white h-full flex flex-col rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {displaySubtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{displaySubtitle}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-2">
        {visibleTabs.map((tab) => {
          const Icon = resolveIcon(tab.icon);
          const isActive = tab.id === activeTabId;
          const status = getTabStatus(tab.id);
          const hasComments = showApprovalWorkflow ? tabHasComments(tab.id) : false;
          const isReviewed = status === 'approved';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isReviewed
                  ? 'text-green-600'
                  : isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {/* Reviewed indicator */}
              {isReviewed && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-100">
                  <Check className="w-3 h-3 text-green-600" />
                </span>
              )}
              {/* Tab icon (only show if not reviewed) */}
              {!isReviewed && Icon && (
                <Icon className="w-4 h-4" />
              )}
              {tab.label}
              {/* Comments indicator */}
              {hasComments && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Has notes" />
              )}
              {isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isReviewed ? 'bg-green-600' : 'bg-blue-600'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {activeTab && (() => {
            const ArtifactComponent = getArtifactComponent(activeTab.artifact);

            if (!ArtifactComponent) {
              return (
                <div className="p-6 text-center text-gray-500">
                  <p>Component &quot;{activeTab.artifact}&quot; not found in registry</p>
                  <p className="text-xs mt-1">Check componentImports.ts</p>
                </div>
              );
            }

            // Merge shared props with tab-specific props
            const mergedProps = {
              ...sharedProps,
              ...activeTab.props,
              customerName: activeTab.props?.customerName || customerName,
            };

            return <ArtifactComponent {...mergedProps} />;
          })()}
        </div>

        {/* Review Checkbox */}
        {activeTab && (
          <div className={`px-6 py-3 border-t flex items-center gap-3 transition-colors ${
            isTabReviewed(activeTabId)
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
              <input
                type="checkbox"
                checked={isTabReviewed(activeTabId)}
                onChange={(e) => markTabReviewed(activeTabId, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
              />
              <span className={`text-sm font-medium ${
                isTabReviewed(activeTabId) ? 'text-green-700' : 'text-gray-700'
              }`}>
                {isTabReviewed(activeTabId)
                  ? `${activeTab.label} reviewed`
                  : `I've reviewed ${activeTab.label.toLowerCase()}`
                }
              </span>
            </label>

            {/* Continue button - appears right-justified when all tabs reviewed */}
            {allTabsReviewed && onContinue && (
              <button
                onClick={onContinue}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {showNavigation && (onBack || onContinue) && (
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
              >
                Back
              </button>
            )}
          </div>

          {onContinue && (
            <button
              onClick={onContinue}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

TabbedContainerArtifact.displayName = 'TabbedContainerArtifact';
export default TabbedContainerArtifact;
