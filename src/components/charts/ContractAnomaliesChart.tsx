"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  anomaly: string;
  count: number;
  percent: number;
}

interface Props {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded bg-white/80 backdrop-blur px-2 py-1 text-xs text-gray-900 border border-gray-200" style={{ minWidth: 80, fontSize: 12, pointerEvents: 'none' }}>
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}:</span>
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
          <span className="inline-block w-3 h-3 rounded mr-2" style={{ background: entry.color }} />
          <span className="text-xs" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const ContractAnomaliesChart: React.FC<Props> = ({ data }) => (
  <div className="w-full h-72">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <XAxis dataKey="anomaly" className="text-xs" />
        <YAxis yAxisId="left" orientation="left" className="text-xs" />
        <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
        <Legend verticalAlign="bottom" align="center" layout="vertical" content={<TwoColumnLegend />} />
        <Bar yAxisId="left" dataKey="count" fill="#f59e42" name="Count" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="percent" fill="#6366f1" name="Percent" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default ContractAnomaliesChart; 