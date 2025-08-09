"use client";
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface DataPoint {
  quarter: string;
  actual: number;
  recommended: number;
  churnRelease: number;
  delta: number;
}

interface Props {
  data: DataPoint[];
}

const UnrealizedProfitChart: React.FC<Props> = ({ data }) => {
  // Default to most recent quarter
  const [selected, setSelected] = useState(data[data.length - 1]);

  return (
    <div className="flex flex-col md:flex-row w-full gap-6 items-stretch min-h-[260px]">
      <div className="flex-1 flex items-center justify-center min-w-0">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
            <XAxis dataKey="quarter" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Bar dataKey="delta" name="Money Left on the Table" radius={[4, 4, 0, 0]} onClick={(_, index) => setSelected(data[index])} cursor="pointer">
              {data.map((entry) => (
                <Cell key={entry.quarter} fill={selected.quarter === entry.quarter ? '#059669' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full md:max-w-xs flex-shrink-0 flex flex-col justify-center bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-sm mt-4 md:mt-0">
        <div className="text-xs text-gray-500 mb-1">Quarter</div>
        <div className="text-lg font-bold text-gray-900 mb-2">{selected.quarter}</div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Actual Price Increase</span><span className="font-medium text-gray-900">${selected.actual.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Potential Price Increase</span><span className="font-medium text-gray-900">${(selected.recommended + selected.churnRelease).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Anticipated Return (Churn Release)</span><span className="font-medium text-gray-900">${selected.churnRelease.toLocaleString()}</span></div>
          <div className="flex justify-between mt-2"><span className="text-green-700 font-semibold">Potential Profit</span><span className="font-bold text-green-700">${selected.delta.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );
};

export default UnrealizedProfitChart; 