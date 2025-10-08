/**
 * Customer Metrics Component
 *
 * Collapsible metrics panel that slides down from the top of the workflow area.
 * Can expand to full width for detailed view.
 *
 * Features:
 * - Slides down from chat area (takes 50% height)
 * - Toggle button in header
 * - Expand to full width option
 * - Compact metric cards
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

// =====================================================
// Types
// =====================================================

export interface CustomerMetric {
  label: string;
  value: string;
  sublabel?: string;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
  trend?: 'up' | 'down' | 'flat';
}

export interface CustomerMetricsProps {
  customerId: string;
  executionId?: string;
  metrics?: CustomerMetric[];
  isOpen: boolean;
  onToggle: () => void;
}

// =====================================================
// Default Metrics (for demo/fallback)
// =====================================================

const DEFAULT_METRICS: CustomerMetric[] = [
  {
    label: 'ARR',
    value: '$725,000',
    sublabel: '+12% YoY',
    status: 'green',
    trend: 'up'
  },
  {
    label: 'Health Score',
    value: '85%',
    sublabel: 'Healthy',
    status: 'green'
  },
  {
    label: 'Renewal',
    value: '120 days',
    sublabel: 'Feb 28, 2026',
    status: 'yellow'
  },
  {
    label: 'Risk Score',
    value: '3.2/10',
    sublabel: 'Low Risk',
    status: 'green'
  },
  {
    label: 'NPS',
    value: '45',
    sublabel: 'Promoter',
    status: 'green'
  },
  {
    label: 'Engagement',
    value: '78%',
    sublabel: 'High',
    status: 'green'
  },
  {
    label: 'Support Tickets',
    value: '3 open',
    sublabel: '1 critical',
    status: 'yellow'
  },
  {
    label: 'Last Contact',
    value: '5 days ago',
    sublabel: 'Email',
    status: 'neutral'
  }
];

// =====================================================
// CustomerMetrics Component
// =====================================================

export const CustomerMetrics: React.FC<CustomerMetricsProps> = ({
  customerId,
  executionId,
  metrics: propMetrics,
  isOpen,
  onToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<CustomerMetric[]>(propMetrics || DEFAULT_METRICS);
  const [loading, setLoading] = useState(false);

  // Fetch metrics from API when opened
  React.useEffect(() => {
    if (isOpen && !propMetrics && executionId) {
      fetchMetrics();
    }
  }, [isOpen, executionId, propMetrics]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflows/executions/${executionId}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Fallback to defaults
      setMetrics(DEFAULT_METRICS);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'green': return 'bg-green-50 border-green-200';
      case 'yellow': return 'bg-yellow-50 border-yellow-200';
      case 'red': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTextColor = (status?: string) => {
    switch (status) {
      case 'green': return 'text-green-900';
      case 'yellow': return 'text-yellow-900';
      case 'red': return 'text-red-900';
      default: return 'text-gray-900';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'flat': return '→';
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        bg-white border-b border-gray-200 transition-all duration-300
        ${isExpanded ? 'fixed inset-0 z-50' : 'relative'}
      `}
      style={!isExpanded ? { height: '50%' } : {}}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {/* Expand/Collapse Button - Upper Left */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? 'Exit full screen' : 'Expand to full screen'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <h3 className="text-sm font-semibold text-gray-700">
            📊 Customer Metrics
          </h3>
        </div>

        {/* Close Button - Upper Right */}
        <button
          onClick={onToggle}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
          title="Hide metrics"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="h-full overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`
                p-3 rounded-lg border transition-colors
                ${getStatusColor(metric.status)}
              `}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {metric.label}
                </span>
                {metric.trend && (
                  <span className="text-sm opacity-60">
                    {getTrendIcon(metric.trend)}
                  </span>
                )}
              </div>

              <div className={`text-2xl font-bold ${getStatusTextColor(metric.status)}`}>
                {metric.value}
              </div>

              {metric.sublabel && (
                <div className="text-xs text-gray-600 mt-1">
                  {metric.sublabel}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional details when expanded */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Last product update deployed</span>
                <span className="text-xs text-gray-500">2 days ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Quarterly business review completed</span>
                <span className="text-xs text-gray-500">1 week ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Contract renewal discussion started</span>
                <span className="text-xs text-gray-500">2 weeks ago</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// Toggle Button Component (for header)
// =====================================================

export const MetricsToggleButton: React.FC<{
  isOpen: boolean;
  onClick: () => void;
}> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center space-x-1 px-3 py-1.5
        text-sm font-medium text-gray-700
        bg-gray-100 hover:bg-gray-200
        rounded-md transition-colors
      "
      title={isOpen ? 'Hide metrics' : 'Show metrics'}
    >
      <span>📊 Metrics</span>
      {isOpen ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );
};
