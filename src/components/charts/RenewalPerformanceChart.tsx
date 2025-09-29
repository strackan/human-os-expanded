"use client";
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '@/styles/chart-tooltips.css';

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

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip rounded bg-white/80 backdrop-blur px-2 py-1 text-xs text-gray-900 border border-gray-200">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="chart-tooltip-label" style={{ color: entry.color }}>{entry.name}:</span>
          <span className="ml-auto">{typeof entry.value === 'number' ? entry.value : ''}</span>
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

const RenewalPerformanceChart: React.FC<Props> = ({ data }) => {
  const [legendPayload, setLegendPayload] = useState<LegendProps['payload']>([]);

  return (
    <div className="flex flex-col h-full min-h-[350px]">
      <div className="flex-1 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onMouseEnter={() => setLegendPayload([
              { value: 'Time to Close (days)', color: '#6366f1' },
              { value: 'Price Increase %', color: '#2563eb' },
              { value: 'Renewal Rate', color: '#059669' },
              { value: 'NRG', color: '#f59e42' },
            ])}
            onMouseLeave={() => setLegendPayload([])}
            onMouseMove={() => setLegendPayload([
              { value: 'Time to Close (days)', color: '#6366f1' },
              { value: 'Price Increase %', color: '#2563eb' },
              { value: 'Renewal Rate', color: '#059669' },
              { value: 'NRG', color: '#f59e42' },
            ])}
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