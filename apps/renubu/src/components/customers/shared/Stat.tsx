import React from 'react';

interface StatProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const Stat: React.FC<StatProps> = ({
  label,
  value,
  icon,
  trend
}) => (
  <div className="flex flex-col items-start bg-gray-50 rounded-lg p-4 min-w-[120px] min-h-[64px]">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-lg font-bold text-gray-900">{value}</span>
      {trend && (
        <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </span>
      )}
    </div>
  </div>
);

export default Stat; 