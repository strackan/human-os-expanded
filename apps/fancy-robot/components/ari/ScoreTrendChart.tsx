"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import type { ScoreHistoryEntry } from "@/lib/ari-client";

interface ScoreTrendChartProps {
  data: ScoreHistoryEntry[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const chartData = useMemo(
    () =>
      [...data]
        .sort(
          (a, b) =>
            new Date(a.scored_at).getTime() - new Date(b.scored_at).getTime(),
        )
        .map((entry, i, arr) => ({
          date: formatDate(entry.scored_at),
          score: Math.round(entry.overall_score * 10) / 10,
          delta:
            i > 0
              ? Math.round(
                  (entry.overall_score - arr[i - 1].overall_score) * 10,
                ) / 10
              : null,
        })),
    [data],
  );

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Score Trend
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            {/* Color bands */}
            <ReferenceArea y1={0} y2={39} fill="#ef4444" fillOpacity={0.06} />
            <ReferenceArea y1={40} y2={59} fill="#f59e0b" fillOpacity={0.06} />
            <ReferenceArea y1={60} y2={79} fill="#3b82f6" fillOpacity={0.06} />
            <ReferenceArea
              y1={80}
              y2={100}
              fill="#10b981"
              fillOpacity={0.06}
            />

            <XAxis
              dataKey="date"
              stroke="oklch(0.55 0.02 260)"
              fontSize={12}
              tick={{ fill: "oklch(0.7 0.02 260)" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="oklch(0.55 0.02 260)"
              fontSize={12}
              tick={{ fill: "oklch(0.7 0.02 260)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.25 0.02 260)",
                border: "1px solid oklch(0.45 0.1 260)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value) => [`${value} ARI`, "Score"]}
              labelFormatter={(label, payload) => {
                const delta = payload?.[0]?.payload?.delta;
                const deltaStr =
                  delta != null
                    ? ` (${delta > 0 ? "+" : ""}${delta})`
                    : "";
                return `${label}${deltaStr}`;
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="oklch(0.7 0.15 260)"
              strokeWidth={2}
              dot={{ fill: "oklch(0.7 0.15 260)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
