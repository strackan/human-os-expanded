import React from 'react';
import '@/styles/chart-tooltips.css';

interface ChartLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    name?: string;
  }>;
  className?: string;
}

const ChartLegend: React.FC<ChartLegendProps> = ({ payload, className = '' }) => {
  if (!payload) return null;
  
  return (
    <div className={`flex flex-wrap justify-center gap-x-8 gap-y-1 py-2 ${className}`}>
      {payload.map((entry) => (
        <div key={entry.value} className="chart-legend-item flex items-center">
          <span 
            className="chart-legend-dot"
            style={{ background: entry.color }} 
          />
          <span 
            className="chart-legend-label"
            style={{ color: entry.color }}
          >
            {entry.name || entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChartLegend; 