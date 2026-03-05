"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ScoreHistoryEntry } from "@/lib/ari-client";

interface ProviderTrendChartProps {
  data: ScoreHistoryEntry[];
}

const PROVIDER_COLORS: Record<string, { name: string; color: string }> = {
  openai: { name: "ChatGPT", color: "#10b981" },
  anthropic: { name: "Claude", color: "#8b5cf6" },
  perplexity: { name: "Perplexity", color: "#3b82f6" },
  gemini: { name: "Gemini", color: "#f59e0b" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ProviderTrendChart({ data }: ProviderTrendChartProps) {
  const { chartData, providers } = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) =>
        new Date(a.scored_at).getTime() - new Date(b.scored_at).getTime(),
    );

    // Collect all provider keys
    const providerSet = new Set<string>();
    sorted.forEach((entry) => {
      Object.keys(entry.provider_scores || {}).forEach((p) =>
        providerSet.add(p),
      );
    });

    const points = sorted.map((entry) => {
      const point: Record<string, string | number> = {
        date: formatDate(entry.scored_at),
      };
      providerSet.forEach((p) => {
        point[p] = entry.provider_scores?.[p] ?? 0;
      });
      return point;
    });

    return { chartData: points, providers: Array.from(providerSet) };
  }, [data]);

  if (chartData.length === 0 || providers.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Provider Trends
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
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
              formatter={(value, name) => [
                `${value} ARI`,
                PROVIDER_COLORS[name as string]?.name || name,
              ]}
            />
            <Legend
              formatter={(value: string) =>
                PROVIDER_COLORS[value]?.name || value
              }
            />
            {providers.map((provider) => (
              <Line
                key={provider}
                type="monotone"
                dataKey={provider}
                stroke={PROVIDER_COLORS[provider]?.color || "#6366f1"}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
