"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ModelBreakdownProps {
  entityName: string;
  providerScores: Record<string, number>;
}

const PROVIDER_CONFIG: Record<
  string,
  { name: string; color: string; icon: string }
> = {
  openai: { name: "ChatGPT", color: "#10b981", icon: "🤖" },
  anthropic: { name: "Claude", color: "#8b5cf6", icon: "🧠" },
  perplexity: { name: "Perplexity", color: "#3b82f6", icon: "🔍" },
  gemini: { name: "Gemini", color: "#f59e0b", icon: "✨" },
};

export default function ModelBreakdown({
  entityName,
  providerScores,
}: ModelBreakdownProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = Object.entries(providerScores).map(([provider, score]) => ({
    provider,
    name: PROVIDER_CONFIG[provider]?.name || provider,
    score,
    color: PROVIDER_CONFIG[provider]?.color || "#6366f1",
    icon: PROVIDER_CONFIG[provider]?.icon || "🤖",
  }));

  data.sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...data.map((d) => d.score));
  const minScore = Math.min(...data.map((d) => d.score));
  const variance = maxScore - minScore;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Model Breakdown
        </h3>
        <div className="text-sm text-muted-foreground">
          How each AI views {entityName}
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 20, right: 20 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="oklch(0.55 0.02 260)"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="oklch(0.55 0.02 260)"
              fontSize={12}
              width={80}
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
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Provider cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.map((item, index) => (
          <div
            key={item.provider}
            className={`rounded-lg bg-secondary p-3 text-center transition-all duration-300 ${mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="mb-1 text-2xl">{item.icon}</div>
            <div className="text-sm text-muted-foreground">{item.name}</div>
            <div className="text-xl font-bold" style={{ color: item.color }}>
              {item.score}
            </div>
          </div>
        ))}
      </div>

      {/* Variance insight */}
      {variance > 15 && (
        <div
          className={`mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: "500ms" }}
        >
          <div className="flex items-start gap-2">
            <span className="text-amber-400">⚠️</span>
            <p className="text-sm text-amber-200/80">
              <strong>High variance detected:</strong> {maxScore - minScore}{" "}
              point difference between models. {entityName} performs best on{" "}
              {data[0].name} ({data[0].score}) and worst on{" "}
              {data[data.length - 1].name} ({data[data.length - 1].score}).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
