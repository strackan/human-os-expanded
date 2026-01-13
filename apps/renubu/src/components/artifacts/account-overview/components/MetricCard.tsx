import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  valueColor?: string;
}

/**
 * Reusable metric display card
 *
 * Used for displaying market percentile, usage score, adoption rate, etc.
 */
export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  valueColor = 'text-gray-900'
}: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <Icon className="w-3 h-3 text-gray-400" />
      </div>
      <div className={`text-lg font-bold ${valueColor}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}
