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
// Fallback Metrics (shown only during initial load)
// =====================================================

const LOADING_PLACEHOLDER_METRICS: CustomerMetric[] = [
  { label: 'ARR', value: 'Loading...', status: 'neutral' },
  { label: 'Health Score', value: 'Loading...', status: 'neutral' },
  { label: 'Renewal', value: 'Loading...', status: 'neutral' },
  { label: 'Risk Score', value: 'Loading...', status: 'neutral' }
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
  const [metrics, setMetrics] = useState<CustomerMetric[]>(propMetrics || LOADING_PLACEHOLDER_METRICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

  // Fetch metrics from API when opened
  React.useEffect(() => {
    if (isOpen && !propMetrics && customerId) {
      fetchMetrics();
    }
  }, [isOpen, customerId, propMetrics]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[CustomerMetrics] Fetching metrics for customer:', customerId);
      const response = await fetch(`/api/customers/${customerId}/metrics`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[CustomerMetrics] Received metrics:', data);

      setMetrics(data.metrics);
      setCustomerName(data.customerName || '');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metrics';
      console.error('[CustomerMetrics] Error fetching metrics:', error);
      setError(errorMessage);

      // Keep placeholder metrics visible on error
      setMetrics(LOADING_PLACEHOLDER_METRICS);
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
            📊 Customer Metrics{customerName && ` - ${customerName}`}
          </h3>

          {loading && (
            <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
          )}

          {error && (
            <span className="text-xs text-red-600" title={error}>⚠ Error loading metrics</span>
          )}
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
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-red-600 font-medium">Failed to load metrics:</span>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
            <button
              onClick={fetchMetrics}
              className="mt-2 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`
                p-3 rounded-lg border transition-colors
                ${getStatusColor(metric.status)}
                ${loading ? 'animate-pulse' : ''}
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
