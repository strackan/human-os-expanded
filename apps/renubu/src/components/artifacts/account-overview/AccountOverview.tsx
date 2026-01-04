'use client';

import React, { useState } from 'react';
import { ChevronRight, Clock, X } from 'lucide-react';
import { TabConfig } from './types';

interface AccountOverviewProps {
  customerName: string;
  tabs: TabConfig[];
  onContinue?: () => void;
  onBack?: () => void;
  showSkipSnooze?: boolean;
  onSkip?: () => void;
  onSnooze?: () => void;
}

/**
 * AccountOverview - Generic composable tab container
 *
 * Accepts any combination of tab components and renders them with tab navigation.
 * This is the core composable component that enables mix-and-match functionality.
 *
 * @example
 * ```tsx
 * <AccountOverview
 *   customerName="Acme Corp"
 *   tabs={[
 *     {
 *       id: 'contract',
 *       label: 'Contract',
 *       icon: FileText,
 *       component: ContractTab,
 *       props: { contractInfo }
 *     },
 *     {
 *       id: 'pricing',
 *       label: 'Pricing',
 *       icon: DollarSign,
 *       component: PricingTab,
 *       props: { pricingInfo },
 *       show: true // Optional conditional rendering
 *     }
 *   ]}
 *   onContinue={() => console.log('Continue clicked')}
 * />
 * ```
 */
export function AccountOverview({
  customerName,
  tabs,
  onContinue,
  onBack,
  showSkipSnooze = false,
  onSkip,
  onSnooze
}: AccountOverviewProps) {
  // Filter tabs based on 'show' property (default to true if not specified)
  const visibleTabs = tabs.filter(tab => tab.show !== false);

  const [activeTabId, setActiveTabId] = useState(visibleTabs[0]?.id || '');

  const activeTab = visibleTabs.find(tab => tab.id === activeTabId);

  if (visibleTabs.length === 0) {
    return (
      <div className="bg-white h-full flex items-center justify-center">
        <p className="text-gray-500">No tabs available to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Account Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Review key details for {customerName}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-8 py-4 text-sm font-medium ${
                isActive
                  ? 'text-gray-900 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab && (
          <activeTab.component {...activeTab.props} />
        )}
      </div>

      {/* Footer Actions - Only show if any callbacks are provided */}
      {(onBack || onContinue || showSkipSnooze) && (
        <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
              >
                Back
              </button>
            )}

            {/* Skip/Snooze Controls */}
            {showSkipSnooze && (
              <div className="flex items-center gap-2 ml-2">
                {onSnooze && (
                  <button
                    onClick={onSnooze}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                    title="Snooze this workflow"
                  >
                    <Clock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>
                )}
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                    title="Skip this workflow"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1"></div>

          {onContinue && (
            <button
              onClick={onContinue}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
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
