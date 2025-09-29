"use client";
import React from "react";

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

export interface CustomerMetricsCardProps {
  stats: Metric[];
  miniCharts?: MiniChart[];
  aiInsights?: Insight[];
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

const CustomerMetricsCard: React.FC<CustomerMetricsCardProps> = ({
  stats,
  miniCharts = [],
  aiInsights = [],
  animate = true,
  animationDelayMs = 120,
}) => {
  const [revealIdx, setRevealIdx] = React.useState(0);
  const totalItems = stats.length + miniCharts.length + aiInsights.length;

  React.useEffect(() => {
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
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-full w-full">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Key Metrics</h3>
        <div className="grid grid-cols-2 gap-3 overflow-hidden">
          {stats.map((stat, i) => (
            <div className="bg-gray-50 rounded-lg p-2 min-h-0 min-w-0" key={stat.label}>
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
            itemIdx = stats.length + i;
            return (
              <div className="flex flex-col items-center" key={i}>
                {itemIdx < revealIdx ? <MiniSparklineChart data={chart.data} /> : null}
                {itemIdx === revealIdx && animate && <span className="animate-pulse text-blue-500">|</span>}
                <span className="text-xs text-gray-500 mt-1">{chart.label}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4 overflow-hidden">
          {aiInsights.map((insight, i) => {
            itemIdx = stats.length + miniCharts.length + i;
            return (
              <div key={i} className="bg-gray-50 rounded-lg p-2 h-full flex flex-col items-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${categoryColor[insight.color]}`}>
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

export default CustomerMetricsCard; 