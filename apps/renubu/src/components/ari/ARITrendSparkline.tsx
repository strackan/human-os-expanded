'use client';

import type { ARIScoreSnapshot } from '@/lib/mcp/types/ari.types';

interface ARITrendSparklineProps {
  history: ARIScoreSnapshot[];
  width?: number;
  height?: number;
}

export function ARITrendSparkline({
  history,
  width = 200,
  height = 40,
}: ARITrendSparklineProps) {
  if (!history || history.length < 2) return null;

  // Sort chronologically (oldest first)
  const sorted = [...history].sort(
    (a, b) => new Date(a.scan_completed_at).getTime() - new Date(b.scan_completed_at).getTime()
  );

  const scores = sorted.map((s) => s.overall_score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const padding = 4;

  const points = scores.map((score, i) => {
    const x = padding + (i / (scores.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (score - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Gradient fill area
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaD = `${pathD} L ${lastPoint.split(',')[0]},${height - padding} L ${firstPoint.split(',')[0]},${height - padding} Z`;

  // Trend direction
  const first = scores[0];
  const last = scores[scores.length - 1];
  const trendColor = last >= first ? '#2BA86A' : '#D94F4F';

  return (
    <div className="flex items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparkline-gradient)" />
        <path
          d={pathD}
          fill="none"
          stroke={trendColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <circle
          cx={parseFloat(points[points.length - 1].split(',')[0])}
          cy={parseFloat(points[points.length - 1].split(',')[1])}
          r={2.5}
          fill={trendColor}
        />
      </svg>
      <span className="text-[10px] text-gray-400">
        {scores.length} scans
      </span>
    </div>
  );
}
