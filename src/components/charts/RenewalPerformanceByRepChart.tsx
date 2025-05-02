"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { repPerformanceTrailing4QData } from '@/data/mockReportsData';

const reps = [
  { key: 'Sarah', color: '#6366f1' },
  { key: 'Michael', color: '#059669' },
  { key: 'Alex', color: '#f59e42' },
  { key: 'Priya', color: '#2563eb' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded bg-white/80 backdrop-blur px-2 py-1 text-xs text-gray-900 border border-gray-200" style={{ minWidth: 80, fontSize: 12, pointerEvents: 'none' }}>
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}:</span>
          <span className="ml-auto">{(entry.value * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

const TwoColumnLegend = (props: any) => {
  const { payload } = props;
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 py-2">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center min-w-[120px]">
          <span className="inline-block w-3 h-3 rounded mr-2" style={{ background: entry.color }} />
          <span className="text-xs" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const RenewalPerformanceByRepChart: React.FC = () => (
  <div className="flex flex-col h-full min-h-[400px]">
    <div className="flex-1 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={repPerformanceTrailing4QData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
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
              activeBar={{ filter: 'none', boxShadow: 'none', stroke: 'none' }}
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