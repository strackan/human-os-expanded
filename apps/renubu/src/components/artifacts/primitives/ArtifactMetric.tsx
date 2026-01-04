/**
 * ArtifactMetric - Key value display with optional trend
 *
 * Provides:
 * - Large value display
 * - Optional label/description
 * - Optional trend indicator
 * - Multiple size variants
 */

import React from 'react';

export type MetricSize = 'sm' | 'md' | 'lg';
export type TrendDirection = 'up' | 'down' | 'neutral';

export interface ArtifactMetricProps {
  /** Metric label */
  label: string;
  /** Main value */
  value: string | number;
  /** Optional secondary value or unit */
  suffix?: string;
  /** Optional prefix (currency, etc.) */
  prefix?: string;
  /** Trend direction */
  trend?: TrendDirection;
  /** Trend value (e.g., "+5%") */
  trendValue?: string;
  /** Size variant */
  size?: MetricSize;
  /** Additional CSS classes */
  className?: string;
  /** Debug section ID */
  sectionId?: string;
}

const SIZE_CLASSES = {
  sm: {
    label: 'text-xs',
    value: 'text-lg font-semibold',
    trend: 'text-xs',
  },
  md: {
    label: 'text-sm',
    value: 'text-2xl font-bold',
    trend: 'text-sm',
  },
  lg: {
    label: 'text-base',
    value: 'text-3xl font-bold',
    trend: 'text-base',
  },
};

const TREND_COLORS: Record<TrendDirection, string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-500',
};

const TREND_ICONS: Record<TrendDirection, React.ReactNode> = {
  up: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  down: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  neutral: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
};

export const ArtifactMetric = React.memo(function ArtifactMetric({
  label,
  value,
  suffix,
  prefix,
  trend,
  trendValue,
  size = 'md',
  className = '',
  sectionId,
}: ArtifactMetricProps) {
  const sizeStyles = SIZE_CLASSES[size];

  return (
    <div id={sectionId} className={className}>
      <div className={`${sizeStyles.label} text-gray-600 mb-1`}>{label}</div>
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span className={`${sizeStyles.value} text-gray-900`}>{prefix}</span>
        )}
        <span className={`${sizeStyles.value} text-gray-900`}>{value}</span>
        {suffix && (
          <span className="text-gray-500 text-sm ml-0.5">{suffix}</span>
        )}
      </div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-1 ${TREND_COLORS[trend]} ${sizeStyles.trend}`}>
          {TREND_ICONS[trend]}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
});

ArtifactMetric.displayName = 'ArtifactMetric';
export default ArtifactMetric;
