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

import React, { useState } from 'react';
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
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

export interface TabDefinition {
  id: string;
  label: string;
  icon?: string | LucideIcon;
  artifact: string; // Component name from componentMap
  props?: Record<string, any>;
  show?: boolean; // Optional conditional rendering
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
}

export function TabbedContainerArtifact({
  artifactId = 'tabbed-container',
  title = 'Account Review',
  subtitle,
  customerName,
  tabs,
  defaultTab,
  onContinue,
  onBack,
  showNavigation = true,
  sharedProps = {},
}: TabbedContainerArtifactProps) {
  // Filter tabs based on 'show' property (default to true if not specified)
  const visibleTabs = tabs.filter(tab => tab.show !== false);

  const [activeTabId, setActiveTabId] = useState(
    defaultTab || visibleTabs[0]?.id || ''
  );

  const activeTab = visibleTabs.find(tab => tab.id === activeTabId);

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

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab && (() => {
          const ArtifactComponent = getArtifactComponent(activeTab.artifact);

          if (!ArtifactComponent) {
            return (
              <div className="p-6 text-center text-gray-500">
                <p>Component "{activeTab.artifact}" not found in registry</p>
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
