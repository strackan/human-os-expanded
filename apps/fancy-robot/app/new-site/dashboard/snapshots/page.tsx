"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useScoreHistory } from "@/hooks/use-ari";
import ScoreTrendChart from "@/components/ari/ScoreTrendChart";
import ProviderTrendChart from "@/components/ari/ProviderTrendChart";
import { Camera } from "lucide-react";

export default function SnapshotsPage() {
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>();
  const { data: history = [], isLoading } = useScoreHistory(
    selectedDomain,
    50,
  );

  // Unique domains from all history data
  const allHistory = useScoreHistory(undefined, 100);
  const domains = useMemo(() => {
    const set = new Set<string>();
    (allHistory.data ?? []).forEach((e) => set.add(e.domain));
    return Array.from(set).sort();
  }, [allHistory.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (history.length === 0 && !selectedDomain) {
    return (
      <div className="py-20 text-center">
        <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          No score history yet
        </h2>
        <p className="mb-6 text-muted-foreground">
          Run a score calculation from the Brands page to start tracking trends.
        </p>
        <Link
          href="/new-site/dashboard/brands"
          className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
        >
          Go to Brands
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Score History</h1>
          <p className="text-sm text-muted-foreground">
            Track your ARI scores over time
          </p>
        </div>

        {domains.length > 0 && (
          <select
            value={selectedDomain ?? ""}
            onChange={(e) =>
              setSelectedDomain(e.target.value || undefined)
            }
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <ScoreTrendChart data={history} />
        <ProviderTrendChart data={history} />
      </div>

      {/* History table */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Recent Scores
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">Domain</th>
                <th className="pb-2 pr-4">Score</th>
                <th className="pb-2 pr-4">Mention Rate</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2 pr-4 font-medium text-foreground">
                    {entry.domain}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`font-semibold ${
                        entry.overall_score >= 80
                          ? "text-emerald-400"
                          : entry.overall_score >= 60
                            ? "text-blue-400"
                            : entry.overall_score >= 40
                              ? "text-amber-400"
                              : "text-red-400"
                      }`}
                    >
                      {entry.overall_score.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {(entry.mention_rate * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {new Date(entry.scored_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
