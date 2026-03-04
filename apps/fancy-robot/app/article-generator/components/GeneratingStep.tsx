"use client";

import { Spinner } from "@/app/snapshot/components/Spinner";
import { PHASE_LABELS, phaseToProgress } from "../lib/constants";
import type { PhaseData } from "../hooks/useArticleFlow";

interface GeneratingStepProps {
  currentPhase: string;
  statusMessage: string;
  completedPhases: string[];
  phaseData: PhaseData;
  onCancel: () => void;
}

const PHASE_ORDER = [
  { key: "writer", label: "Writer", getStats: (d: PhaseData) =>
    d.writerWordCount ? `${d.writerWordCount} words` : null },
  { key: "editor", label: "Editor", getStats: (d: PhaseData) =>
    d.editorChanges != null ? `${d.editorChanges} changes across ${d.editorPasses?.length ?? 0} passes` : null },
  { key: "condenser", label: "Condenser", getStats: (d: PhaseData) =>
    d.compressionRatio ? `${d.condenserWordCount} words (${Math.round(d.compressionRatio * 100)}% compression)` : null },
  { key: "optimizer", label: "HTML Optimizer", getStats: (d: PhaseData) =>
    d.scoreAfter != null ? `Score: ${d.scoreBefore} → ${d.scoreAfter}` : null },
];

export function GeneratingStep({
  currentPhase,
  statusMessage,
  completedPhases,
  phaseData,
  onCancel,
}: GeneratingStepProps) {
  const progress = phaseToProgress(currentPhase);
  const phaseInfo = PHASE_LABELS[currentPhase];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Generating Article
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Running the 4-phase AI pipeline...
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {phaseInfo?.label ?? currentPhase}
            </span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current phase card */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <Spinner size="sm" />
          <span className="text-sm text-muted-foreground">
            {statusMessage || phaseInfo?.description || "Processing..."}
          </span>
        </div>

        {/* Completed phases */}
        {PHASE_ORDER.map(({ key, label, getStats }) => {
          const done = completedPhases.includes(key);
          if (!done) return null;
          const stats = getStats(phaseData);
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 text-green-600 text-xs">
                  ✓
                </span>
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
              </div>
              {stats && (
                <span className="text-xs text-muted-foreground">{stats}</span>
              )}
            </div>
          );
        })}

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="w-full rounded-full border border-border px-6 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
