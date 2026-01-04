/**
 * BrandPerformanceArtifact
 *
 * Simple, attractive brand performance display with mini charts.
 * Designed for InHerSight workflows to show growth/adoption metrics.
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Eye, Users, MousePointer, Star } from 'lucide-react';
import {
  ArtifactContainer,
  ArtifactHeader,
  ArtifactSection,
} from '@/components/artifacts/primitives';

export interface BrandMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  sparkData?: number[];
}

export interface BrandPerformanceArtifactProps {
  artifactId?: string;
  customerName?: string;
  title?: string;
  subtitle?: string;
  reportingPeriod?: string;
  healthScore?: number;
  metrics?: {
    impressions?: BrandMetric;
    profileViews?: BrandMetric;
    applyClicks?: BrandMetric;
    newRatings?: BrandMetric;
  };
  isLoading?: boolean;
  error?: string;
}

// Mini sparkline chart component
function MiniSparkline({ data, trend }: { data: number[]; trend?: 'up' | 'down' | 'flat' }) {
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

// Metric card with mini chart
function MetricCard({ metric, icon: Icon }: { metric: BrandMetric; icon: React.ComponentType<{ className?: string }> }) {
  const getTrendIcon = () => {
    if (metric.trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (metric.trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (metric.trend === 'up') return 'text-green-600';
    if (metric.trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            <Icon className="w-4 h-4 text-gray-500" />
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {metric.label}
          </span>
        </div>
        {metric.trend && getTrendIcon()}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
          {metric.trendValue && (
            <div className={`text-xs font-medium ${getTrendColor()} mt-0.5`}>
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

// Health score circular display
function HealthScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{score}</span>
        <span className="text-xs text-gray-500">Score</span>
      </div>
    </div>
  );
}

// Default mock data for demonstration
const DEFAULT_METRICS = {
  impressions: {
    label: 'Impressions',
    value: '24.5K',
    trend: 'up' as const,
    trendValue: '+12% vs last period',
    sparkData: [30, 45, 35, 50, 42, 55, 60, 52, 65, 70, 68, 75],
  },
  profileViews: {
    label: 'Profile Views',
    value: '3,842',
    trend: 'up' as const,
    trendValue: '+8% vs last period',
    sparkData: [20, 25, 22, 30, 28, 35, 32, 40, 38, 45, 42, 48],
  },
  applyClicks: {
    label: 'Apply Clicks',
    value: '847',
    trend: 'flat' as const,
    trendValue: '+2% vs last period',
    sparkData: [15, 18, 16, 20, 19, 18, 22, 21, 20, 23, 22, 24],
  },
  newRatings: {
    label: 'New Ratings',
    value: '156',
    trend: 'up' as const,
    trendValue: '+23% vs last period',
    sparkData: [8, 12, 10, 15, 14, 18, 16, 22, 20, 25, 28, 32],
  },
};

export function BrandPerformanceArtifact({
  artifactId = 'brand-performance',
  customerName = 'GrowthStack',
  title = 'Brand Performance',
  subtitle,
  reportingPeriod = 'Last 90 Days',
  healthScore = 78,
  metrics = DEFAULT_METRICS,
  isLoading = false,
  error,
}: BrandPerformanceArtifactProps) {
  const displaySubtitle = subtitle || `${customerName} • ${reportingPeriod}`;

  // Merge provided metrics with defaults
  const displayMetrics = {
    impressions: metrics.impressions || DEFAULT_METRICS.impressions,
    profileViews: metrics.profileViews || DEFAULT_METRICS.profileViews,
    applyClicks: metrics.applyClicks || DEFAULT_METRICS.applyClicks,
    newRatings: metrics.newRatings || DEFAULT_METRICS.newRatings,
  };

  return (
    <ArtifactContainer
      artifactId={artifactId}
      variant="default"
      isLoading={isLoading}
      error={error}
    >
      <ArtifactHeader
        title={title}
        subtitle={displaySubtitle}
        variant="default"
      />

      <div className="px-6 py-5">
        {/* Top row: Health score + summary */}
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
          <HealthScoreCircle score={healthScore} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Health Score</h3>
            <p className="text-sm text-gray-600">
              {healthScore >= 70
                ? 'Strong brand presence with healthy engagement metrics.'
                : healthScore >= 50
                ? 'Moderate brand health with room for improvement.'
                : 'Brand needs attention - engagement metrics are below target.'}
            </p>
          </div>
        </div>

        {/* Metrics grid */}
        <ArtifactSection
          title="Key Metrics"
          titleSize="sm"
          variant="transparent"
          padding="none"
          noMargin
        >
          <div className="grid grid-cols-2 gap-4">
            <MetricCard metric={displayMetrics.impressions} icon={Eye} />
            <MetricCard metric={displayMetrics.profileViews} icon={Users} />
            <MetricCard metric={displayMetrics.applyClicks} icon={MousePointer} />
            <MetricCard metric={displayMetrics.newRatings} icon={Star} />
          </div>
        </ArtifactSection>
      </div>
    </ArtifactContainer>
  );
}

BrandPerformanceArtifact.displayName = 'BrandPerformanceArtifact';
export default BrandPerformanceArtifact;
