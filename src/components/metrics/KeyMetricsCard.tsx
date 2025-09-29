"use client";

import React, { useState, useEffect } from "react";

export interface Metric {
  label: string;
  value: string;
}

export interface MiniChart {
  label: string;
  data: number[];
}

export interface Insight {
  category: string;
  color: 'green' | 'blue' | 'purple' | 'red';
  text: string;
}

interface KeyMetricsCardProps {
  metrics: Metric[];
  miniCharts?: MiniChart[];
  insights?: Insight[];
  animate?: boolean;
  animationDelayMs?: number;
}

const categoryColor = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
};

const MiniSparklineChart: React.FC<{ data: number[] }> = ({ data }) => (
  <svg width="60" height="24" viewBox="0 0 60 24" fill="none" className="overflow-visible">
    <polyline
      fill="none"
      stroke="#3B82F6"
      strokeWidth="2"
      points={data
        .map((d, i) => `${(i / (data.length - 1)) * 58 + 1},${23 - ((d - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * 20}`)
        .join(" ")}
    />
  </svg>
);

const KeyMetricsCard: React.FC<KeyMetricsCardProps> = ({
  metrics,
  miniCharts = [],
  insights = [],
  animate = true,
  animationDelayMs = 120,
}) => {
  const [revealIdx, setRevealIdx] = useState(0);
  const totalItems = metrics.length + miniCharts.length + insights.length;

  useEffect(() => {
    if (!animate) {
      setRevealIdx(totalItems);
      return;
    }
    if (revealIdx < totalItems) {
      const timeout = setTimeout(() => setRevealIdx(revealIdx + 1), animationDelayMs);
      return () => clearTimeout(timeout);
    }
  }, [revealIdx, totalItems, animate, animationDelayMs]);

  let itemIdx = 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col h-full w-full overflow-hidden">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Key Metrics</h3>
        <div className="grid grid-cols-2 gap-4 overflow-hidden">
          {metrics.map((stat, i) => (
            <div
              className="bg-gray-50 rounded-lg p-4 min-h-[72px] min-w-0 flex flex-col justify-between"
              key={stat.label}
            >
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              <span className="text-lg font-bold text-gray-900 mt-1 block">
                {i < revealIdx ? stat.value : ''}
                {i === revealIdx && animate && <span className="animate-pulse text-blue-500 ml-1">|</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Sparklines */}
      {miniCharts.length > 0 && (
        <div className="flex gap-4 mb-4">
          {miniCharts.map((chart, i) => {
            itemIdx = metrics.length + i;
            return (
              <div className="flex-1 flex flex-col items-center min-w-0" key={chart.label}>
                {itemIdx < revealIdx ? <MiniSparklineChart data={chart.data} /> : null}
                {itemIdx === revealIdx && animate && <span className="animate-pulse text-blue-500">|</span>}
                <span className="text-xs text-gray-500 mt-1">{chart.label}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-0 overflow-hidden">
          {insights.map((insight, i) => {
            itemIdx = metrics.length + miniCharts.length + i;
            return (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-4 min-h-[72px] h-full flex flex-col items-center justify-between"
              >
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColor[insight.color]}`}
                >
                  {itemIdx < revealIdx ? insight.category : ''}
                  {itemIdx === revealIdx && animate && <span className="animate-pulse text-blue-500 ml-1">|</span>}
                </span>
                <span className="text-sm text-gray-700 text-center">
                  {itemIdx < revealIdx ? insight.text : ''}
                  {itemIdx === revealIdx && animate && <span className="animate-pulse text-blue-500 ml-1">|</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KeyMetricsCard; 