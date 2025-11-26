import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';

export interface MetricDisplayProps {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  icon?: React.ReactNode;
  format?: 'currency' | 'percent' | 'number' | 'text';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * MetricDisplay - Atomic Component
 *
 * Displays a single metric with label, value, optional trend indicator, and icon.
 * Used throughout the application for KPIs, health scores, ARR, etc.
 *
 * @example
 * <MetricDisplay
 *   label="Current ARR"
 *   value={100000}
 *   format="currency"
 *   trend="up"
 *   trendValue="+15%"
 *   color="green"
 * />
 */
export const MetricDisplay = React.memo(function MetricDisplay({
  label,
  value,
  trend,
  trendValue,
  color = 'gray',
  icon,
  format = 'text',
  size = 'md'
}: MetricDisplayProps) {
  // Format value based on type
  const formattedValue = React.useMemo(() => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value as number);

      case 'percent':
        return `${value}%`;

      case 'number':
        return new Intl.NumberFormat('en-US').format(value as number);

      default:
        return value;
    }
  }, [value, format]);

  // Color mappings
  const colorClasses = {
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    gray: 'text-gray-600 bg-gray-50 border-gray-200'
  };

  const trendColorClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-500'
  };

  // Size mappings
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div
      className={`
        flex flex-col p-4 rounded-lg border
        ${colorClasses[color]}
        ${sizeClasses[size]}
        transition-all duration-200 hover:shadow-md
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium opacity-80">{label}</span>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div className={`font-bold ${valueSizeClasses[size]}`}>
          {formattedValue}
        </div>

        {trend && (
          <div className={`flex items-center gap-1 ${trendColorClasses[trend]} ml-2`}>
            {trend === 'up' && <ArrowUpIcon className="w-4 h-4" />}
            {trend === 'down' && <ArrowDownIcon className="w-4 h-4" />}
            {trend === 'stable' && <MinusIcon className="w-4 h-4" />}
            {trendValue && <span className="text-sm font-medium">{trendValue}</span>}
          </div>
        )}
      </div>
    </div>
  );
});

MetricDisplay.displayName = 'MetricDisplay';

export default MetricDisplay;
