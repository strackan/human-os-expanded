/**
 * MetricsSlide Component
 *
 * Displays brand performance metrics with trends and sparklines.
 * Designed for InHerSight QBR presentations.
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Eye, Users, MousePointer, Star } from 'lucide-react';

export interface MetricData {
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  sparkData?: number[];
}

export interface MetricsSlideContent {
  impressions?: MetricData;
  profileViews?: MetricData;
  applyClicks?: MetricData;
  newRatings?: MetricData;
  reportingPeriod?: string;
}

interface MetricsSlideProps {
  title: string;
  content: MetricsSlideContent;
  editable?: boolean;
  onContentChange?: (content: MetricsSlideContent) => void;
}

// Mini sparkline component
function MiniSparkline({ data, trend }: { data: number[]; trend?: 'up' | 'down' | 'flat' }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const normalized = data.map(d => (d / max) * 100);
  const color = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';

  return (
    <div className="flex items-end gap-0.5 h-8">
      {normalized.map((height, i) => (
        <div
          key={i}
          className="w-1.5 rounded-t transition-all"
          style={{
            height: `${Math.max(height, 10)}%`,
            backgroundColor: color,
            opacity: 0.3 + (i / normalized.length) * 0.7,
          }}
        />
      ))}
    </div>
  );
}

// Metric card component
function MetricCard({
  label,
  metric,
  icon: Icon
}: {
  label: string;
  metric: MetricData;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const getTrendIcon = () => {
    if (metric.trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (metric.trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (metric.trend === 'up') return 'text-green-600';
    if (metric.trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        {metric.trend && getTrendIcon()}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
          {metric.trendValue && (
            <div className={`text-sm font-medium ${getTrendColor()} mt-1`}>
              {metric.trendValue}
            </div>
          )}
        </div>
        {metric.sparkData && (
          <MiniSparkline data={metric.sparkData} trend={metric.trend} />
        )}
      </div>
    </div>
  );
}

export function MetricsSlide({ title, content, editable, onContentChange }: MetricsSlideProps) {
  // Default values for demo
  const defaultMetrics: MetricsSlideContent = {
    impressions: { value: '60K', trend: 'up', trendValue: '+12% vs prior' },
    profileViews: { value: '4,500', trend: 'up', trendValue: '+8% vs prior' },
    applyClicks: { value: '120', trend: 'up', trendValue: '+15% vs prior' },
    newRatings: { value: '45', trend: 'up', trendValue: '+23% vs prior' },
    reportingPeriod: 'Last 90 Days',
  };

  const metrics = {
    impressions: content.impressions || defaultMetrics.impressions,
    profileViews: content.profileViews || defaultMetrics.profileViews,
    applyClicks: content.applyClicks || defaultMetrics.applyClicks,
    newRatings: content.newRatings || defaultMetrics.newRatings,
    reportingPeriod: content.reportingPeriod || defaultMetrics.reportingPeriod,
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{metrics.reportingPeriod}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {metrics.impressions && (
          <MetricCard
            label="Brand Impressions"
            metric={metrics.impressions}
            icon={Eye}
          />
        )}
        {metrics.profileViews && (
          <MetricCard
            label="Profile Views"
            metric={metrics.profileViews}
            icon={Users}
          />
        )}
        {metrics.applyClicks && (
          <MetricCard
            label="Apply Clicks"
            metric={metrics.applyClicks}
            icon={MousePointer}
          />
        )}
        {metrics.newRatings && (
          <MetricCard
            label="New Ratings"
            metric={metrics.newRatings}
            icon={Star}
          />
        )}
      </div>
    </div>
  );
}

export default MetricsSlide;
