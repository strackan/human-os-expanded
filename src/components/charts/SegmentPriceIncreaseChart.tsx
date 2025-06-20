"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import '@/styles/chart-tooltips.css';

interface DataPoint {
  segment: string;
  avgIncrease: number;
  optimal: number;
  winRate: number;
}

interface Props {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip rounded bg-white/80 backdrop-blur px-2 py-1 text-xs text-gray-900 border border-gray-200">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="chart-tooltip-label" style={{ color: entry.color }}>{entry.name}:</span>
          <span className="ml-auto">{typeof entry.value === 'number' ? entry.value : ''}</span>
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
          <span className="chart-legend-dot" style={{ background: entry.color }} />
          <span className="chart-legend-label" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const SegmentPriceIncreaseChart: React.FC<Props> = ({ data }) => (
  <div className="w-full h-72">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <XAxis dataKey="segment" className="text-xs" />
        <YAxis unit="%" className="text-xs" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
        <Legend verticalAlign="bottom" align="center" layout="vertical" content={<TwoColumnLegend />} />
        <Bar dataKey="avgIncrease" fill="#2563eb" name="Avg Increase %" radius={[4, 4, 0, 0]} />
        {data.map((entry, idx) => (
          <ReferenceLine key={entry.segment} x={entry.segment} y={entry.optimal} stroke="#f59e42" strokeDasharray="3 3" label={{ value: `Optimal: ${entry.optimal}%`, position: 'top', fill: '#f59e42', fontSize: 12 }} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default SegmentPriceIncreaseChart; 