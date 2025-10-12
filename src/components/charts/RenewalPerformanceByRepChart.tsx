"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { repPerformanceTrailing4QData } from '@/data/mockReportsData';
import '@/styles/chart-tooltips.css';

const reps = [
  { key: 'Sarah', color: '#6366f1' },
  { key: 'Michael', color: '#059669' },
  { key: 'Alex', color: '#f59e42' },
  { key: 'Priya', color: '#2563eb' },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    name: string;
    value: number | string;
    color: string;
  }>;
  label?: string;
}

interface LegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

interface RenewalPerformanceByRepChartProps {
  data: Array<{
    rep: string;
    timeToClose: number;
    priceIncrease: number;
    renewalRate: number;
    nrg: number;
  }>;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip rounded bg-white/80 backdrop-blur px-2 py-1 text-xs text-gray-900 border border-gray-200">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="chart-tooltip-label" style={{ color: entry.color }}>{entry.name}:</span>
          <span className="ml-auto">{(entry.value as number * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

const TwoColumnLegend = (props: LegendProps) => {
  const { payload } = props;
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 py-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center min-w-[120px]">
          <span className="chart-legend-dot" style={{ background: entry.color }} />
          <span className="chart-legend-label" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const RenewalPerformanceByRepChart: React.FC<RenewalPerformanceByRepChartProps> = ({ data }) => (
  <div className="flex flex-col h-full min-h-[400px]">
    <div className="flex-1 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
          <XAxis dataKey="quarter" className="text-xs" />
          <YAxis className="text-xs" tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
          <Legend verticalAlign="bottom" align="center" layout="vertical" content={<TwoColumnLegend />} />
          {reps.map(rep => (
            <Bar
              key={rep.key}
              dataKey={rep.key}
              stackId="a"
              name={rep.key}
              fill={rep.color}
              radius={[4, 4, 0, 0]}
              activeBar={{ filter: 'none', stroke: 'none' }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-auto">
      {/* Legend */}
    </div>
  </div>
);

export default RenewalPerformanceByRepChart; 