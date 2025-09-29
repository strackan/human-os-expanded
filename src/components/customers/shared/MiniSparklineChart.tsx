import React from 'react';

interface MiniSparklineChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

const MiniSparklineChart: React.FC<MiniSparklineChartProps> = ({
  data,
  color = "#3B82F6",
  width = 60,
  height = 24
}) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="2"
      points={data
        .map((d, i) => `${(i / (data.length - 1)) * (width - 2) + 1},${height - 1 - ((d - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 4)}`)
        .join(" ")}
    />
  </svg>
);

export default MiniSparklineChart; 