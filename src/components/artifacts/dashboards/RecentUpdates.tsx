"use client";

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';

interface Update {
  id: string;
  customer: string;
  update: string;
  time: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'trend_up' | 'trend_down';
  priority?: 'high' | 'medium' | 'low';
}

interface RecentUpdatesProps {
  data: {
    [key: string]: Update[];
  };
  activeTab: 'adoption' | 'sentiment' | 'market' | 'commercial' | 'conversation';
  showCriticalOnly: boolean;
  onTabChange: (tab: 'adoption' | 'sentiment' | 'market' | 'commercial' | 'conversation') => void;
  onCriticalToggle: (show: boolean) => void;
  onContextualHelp: (update: Update) => void;
}

const RecentUpdates: React.FC<RecentUpdatesProps> = ({
  data,
  activeTab,
  showCriticalOnly,
  onTabChange,
  onCriticalToggle,
  onContextualHelp
}) => {
  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />;
      case 'trend_up':
        return <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />;
      case 'trend_down':
        return <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />;
    }
  };

  const tabs = [
    { id: 'adoption', label: 'Adoption' },
    { id: 'sentiment', label: 'Sentiment' },
    { id: 'market', label: 'Market' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'conversation', label: 'Conversation Starters' }
  ] as const;

  const getUpdatesToShow = () => {
    let updatesToShow = data[activeTab] || [];
    
    if (showCriticalOnly && activeTab !== 'conversation') {
      if (activeTab === 'adoption') {
        // For adoption, show warning and error types
        updatesToShow = updatesToShow.filter(update => 
          update.type === 'warning' || update.type === 'error'
        );
      } else {
        // For other tabs, show high priority items
        updatesToShow = updatesToShow.filter(update => 
          update.priority === 'high' || update.type === 'warning' || update.type === 'error'
        );
      }
    } else if (showCriticalOnly && activeTab === 'conversation') {
      // Conversation starters don't have critical items, so show empty or all
      updatesToShow = [];
    }
    
    return updatesToShow;
  };

  const updatesToShow = getUpdatesToShow();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Updates</h2>
        <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
          Go To Updates
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Critical Only Filter */}
      {activeTab !== 'conversation' && (
        <div className="flex justify-end mb-4">
          <label className="flex items-center gap-2 text-xs text-red-600 font-medium">
            <input
              type="checkbox"
              checked={showCriticalOnly}
              onChange={(e) => onCriticalToggle(e.target.checked)}
              className="w-3 h-3 text-red-600 border-red-300 rounded focus:ring-red-500"
            />
            Critical Only
          </label>
        </div>
      )}

      {/* Updates List */}
      <div className="space-y-4">
        {updatesToShow.length > 0 ? (
          updatesToShow.map((update) => (
            <div key={update.id} className="flex items-start gap-3">
              {getUpdateIcon(update.type)}
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{update.customer}</span>
                </p>
                <p className="text-sm text-gray-600">{update.update}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{update.time}</p>
                  <button 
                    onClick={() => onContextualHelp(update)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Help me with this
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {showCriticalOnly ? 'No critical updates at this time' : 'No updates available'}
            </p>
          </div>
        )}
      </div>

      <button className="flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 transition-colors">
        View all {showCriticalOnly ? 'critical' : activeTab} updates
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export default RecentUpdates;

