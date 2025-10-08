/**
 * Dashboard Artifact Component
 *
 * Renders interactive dashboard with charts as an artifact.
 * Can be embedded in the ArtifactDisplay panel.
 *
 * Features:
 * - Metric cards with status colors
 * - Simple bar/line charts (no heavy charting library needed)
 * - Responsive grid layout
 * - Embeddable as artifact content
 */

'use client';

import React from 'react';

// =====================================================
// Types
// =====================================================

export interface DashboardMetric {
  label: string;
  value: string;
  sublabel?: string;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
  trend?: 'up' | 'down' | 'flat';
}

export interface DashboardChart {
  type: 'bar' | 'line' | 'progress';
  title: string;
  data: number[];
  labels?: string[];
  threshold?: number;
  color?: string;
}

export interface DashboardArtifactData {
  title: string;
  metrics: DashboardMetric[];
  charts?: DashboardChart[];
}

export interface DashboardArtifactProps {
  data: DashboardArtifactData;
}

// =====================================================
// Simple Chart Components (No external library)
// =====================================================

const SimpleBarChart: React.FC<{ data: number[]; labels?: string[]; threshold?: number; color?: string }> = ({
  data,
  labels,
  threshold,
  color = 'bg-blue-500'
}) => {
  const maxValue = Math.max(...data, threshold || 0);

  return (
    <div className="space-y-2">
      {data.map((value, index) => (
        <div key={index} className="flex items-center space-x-2">
          {labels && (
            <span className="text-xs text-gray-600 w-16 text-right">{labels[index]}</span>
          )}
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
            <div
              className={`h-6 rounded-full ${value >= (threshold || 0) ? 'bg-green-500' : color} transition-all duration-300`}
              style={{ width: `${(value / maxValue) * 100}%` }}
            />
            {threshold && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400"
                style={{ left: `${(threshold / maxValue) * 100}%` }}
              />
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 w-12">{value}</span>
        </div>
      ))}
    </div>
  );
};

const SimpleLineChart: React.FC<{ data: number[]; threshold?: number; color?: string }> = ({
  data,
  threshold,
  color = 'stroke-blue-500'
}) => {
  const maxValue = Math.max(...data, threshold || 0);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-full h-24" viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* Threshold line */}
      {threshold !== undefined && (
        <line
          x1="0"
          y1={100 - ((threshold - minValue) / range) * 100}
          x2="100"
          y2={100 - ((threshold - minValue) / range) * 100}
          stroke="red"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          opacity="0.5"
        />
      )}
      {/* Data line */}
      <polyline
        points={points}
        fill="none"
        className={color}
        strokeWidth="2"
      />
      {/* Data points */}
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - minValue) / range) * 100;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            className={color.replace('stroke', 'fill')}
          />
        );
      })}
    </svg>
  );
};

const ProgressBar: React.FC<{ value: number; max: number; label: string; color?: string }> = ({
  value,
  max,
  label,
  color = 'bg-blue-500'
}) => {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}/{max}</span>
      </div>
      <div className="bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// =====================================================
// Main Dashboard Artifact Component
// =====================================================

export const DashboardArtifact: React.FC<DashboardArtifactProps> = ({ data }) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {data.metrics.map((metric, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getStatusColor(metric.status)}`}
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

            <div className={`text-xl font-bold ${getStatusTextColor(metric.status)}`}>
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

      {/* Charts Section */}
      {data.charts && data.charts.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {data.charts.map((chart, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{chart.title}</h4>

              {chart.type === 'bar' && (
                <SimpleBarChart
                  data={chart.data}
                  labels={chart.labels}
                  threshold={chart.threshold}
                  color={chart.color}
                />
              )}

              {chart.type === 'line' && (
                <SimpleLineChart
                  data={chart.data}
                  threshold={chart.threshold}
                  color={chart.color || 'stroke-blue-500'}
                />
              )}

              {chart.type === 'progress' && chart.data.length >= 2 && (
                <ProgressBar
                  value={chart.data[0]}
                  max={chart.data[1]}
                  label={chart.title}
                  color={chart.color}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================================
// Helper: Generate Dashboard Artifact Content
// =====================================================

export function generateDashboardArtifact(
  metrics: DashboardMetric[],
  charts?: DashboardChart[],
  title: string = 'Customer Dashboard'
): string {
  const data: DashboardArtifactData = {
    title,
    metrics,
    charts
  };

  // Return as JSON that can be stored in artifact.content
  return JSON.stringify(data, null, 2);
}
