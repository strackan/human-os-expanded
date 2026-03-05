"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEntities,
  useARIScore,
  useCalculateScore,
  useCalculationStatus,
  queryKeys,
} from "@/hooks/use-ari";
import { useAuth } from "@/components/auth/AuthProvider";
import ARIScoreCard from "@/components/ari/ARIScoreCard";
import CompetitorComparison from "@/components/ari/CompetitorComparison";
import ModelBreakdown from "@/components/ari/ModelBreakdown";
import { RefreshCw } from "lucide-react";

export default function BrandsPage() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [calculatingJob, setCalculatingJob] = useState<string | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: entities = [], isLoading: entitiesLoading } =
    useEntities("company");
  const calculateScore = useCalculateScore();

  // Select first entity by default
  useEffect(() => {
    if (entities.length > 0 && !selectedEntityId) {
      setSelectedEntityId(entities[0].id);
    }
  }, [entities, selectedEntityId]);

  const { data: score, isLoading: scoreLoading } = useARIScore(
    selectedEntityId || "",
  );
  const { data: jobStatus } = useCalculationStatus(calculatingJob);

  // When job completes, clear the calculating state and refetch score
  useEffect(() => {
    if (jobStatus?.status === "completed") {
      setCalculatingJob(null);
      if (selectedEntityId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.score(selectedEntityId),
        });
      }
    }
  }, [jobStatus, selectedEntityId, queryClient]);

  const handleRecalculate = () => {
    if (!selectedEntityId) return;
    calculateScore.mutate(
      { entityId: selectedEntityId, userId: user?.id },
      { onSuccess: (data) => setCalculatingJob(data.job_id) },
    );
  };

  // Build comparison data from all entities with scores
  const comparisonEntities = entities
    .filter((e) => e.id === selectedEntityId || entities.length <= 5)
    .map((e) => ({
      name: e.name,
      score: e.id === selectedEntityId ? (score?.overall_score ?? 0) : 0,
      isSelected: e.id === selectedEntityId,
      id: e.id,
    }));

  const selectedEntity = entities.find((e) => e.id === selectedEntityId);

  if (entitiesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          No brands tracked yet
        </h2>
        <p className="text-muted-foreground">
          Run a snapshot or audit to start tracking brand visibility.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Brand Visibility
          </h1>
          <p className="text-sm text-muted-foreground">
            AI recommendation scores across models
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Entity selector */}
          <select
            value={selectedEntityId || ""}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>

          {/* Recalculate button */}
          <button
            onClick={handleRecalculate}
            disabled={!!calculatingJob || calculateScore.isPending}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${calculatingJob ? "animate-spin" : ""}`}
            />
            {calculatingJob ? "Calculating..." : "Recalculate"}
          </button>
        </div>
      </div>

      {/* Calculating status */}
      {calculatingJob && jobStatus && (
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/10 p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Calculating ARI Score...
              </p>
              <p className="text-xs text-muted-foreground">
                {jobStatus.message || `Status: ${jobStatus.status}`}
                {jobStatus.progress
                  ? ` (${Math.round(jobStatus.progress * 100)}%)`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Score content */}
      {scoreLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : score ? (
        <div className="space-y-6">
          {/* Score + Comparison row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ARIScoreCard
              entityName={selectedEntity?.name || ""}
              score={score.overall_score}
              mentionRate={score.mention_rate}
              totalPrompts={score.total_prompts}
            />
            <CompetitorComparison
              entities={comparisonEntities}
              onEntityClick={(entity) => {
                if (entity.id) setSelectedEntityId(entity.id);
              }}
            />
          </div>

          {/* Model Breakdown */}
          <ModelBreakdown
            entityName={selectedEntity?.name || ""}
            providerScores={score.provider_scores}
          />
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="mb-4 text-muted-foreground">
            No ARI score calculated yet for {selectedEntity?.name}.
          </p>
          <button
            onClick={handleRecalculate}
            disabled={!!calculatingJob}
            className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
          >
            Calculate ARI Score
          </button>
        </div>
      )}
    </div>
  );
}
