"use client";
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  segment: string;
  timeToClose: number;
  priceIncrease: number;
  renewalRate: number;
  nrg: number;
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

const RenewalPerformanceChart: React.FC<Props> = ({ data }) => {
  const [legendPayload, setLegendPayload] = useState<any[]>([]);

  return (
    <div className="flex flex-col h-full min-h-[350px]">
      <div className="flex-1 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onMouseEnter={({ chartName, payload }: any) => setLegendPayload(payload)}
            onMouseLeave={() => setLegendPayload([])}
            onMouseMove={({ chartName, payload }: any) => setLegendPayload(payload)}
          >
            <XAxis dataKey="segment" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
            <Bar dataKey="timeToClose" fill="#6366f1" name="Time to Close (days)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="priceIncrease" fill="#2563eb" name="Price Increase %" radius={[4, 4, 0, 0]} />
            <Bar dataKey="renewalRate" fill="#059669" name="Renewal Rate" radius={[4, 4, 0, 0]} />
            <Bar dataKey="nrg" fill="#f59e42" name="NRG" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-auto">
        <TwoColumnLegend payload={Array.isArray(legendPayload) && legendPayload.length ? legendPayload : [
          { value: 'Time to Close (days)', color: '#6366f1' },
          { value: 'Price Increase %', color: '#2563eb' },
          { value: 'Renewal Rate', color: '#059669' },
          { value: 'NRG', color: '#f59e42' },
        ]} />
      </div>
    </div>
  );
};

export default RenewalPerformanceChart; 