import type { DiscoveryResult, PromptStart } from "@/lib/lite-report-client";
import { STYLE_LABELS, getInterstitialMessage } from "../lib/constants";
import { Spinner } from "./Spinner";

export function AnalysisStep({
  analysisCurrent,
  analysisTotal,
  currentPrompt,
  discovery,
  statusMessage,
  onReset,
}: {
  analysisCurrent: number;
  analysisTotal: number;
  currentPrompt: PromptStart | null;
  discovery: DiscoveryResult | null;
  statusMessage: string;
  onReset: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto max-w-2xl">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground">
          Running AI Analysis
        </h3>
      </div>

      {/* Progress bar */}
      <div className="mb-6 w-full">
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
            style={{
              width:
                analysisTotal > 0
                  ? `${(analysisCurrent / analysisTotal) * 100}%`
                  : "0%",
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <p className="text-xs text-muted-foreground">
            {analysisCurrent}/{analysisTotal} prompts
          </p>
          {discovery && (
            <p className="text-xs text-muted-foreground/70">
              Discovering who AI recommends for {discovery.company_name}
            </p>
          )}
        </div>
      </div>

      {/* Interstitial message */}
      {currentPrompt && (
        <p className="mb-3 text-sm text-muted-foreground/70">
          {getInterstitialMessage(currentPrompt)}
        </p>
      )}

      {/* Current prompt card */}
      {currentPrompt ? (
        <div
          key={currentPrompt.current}
          className="animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent border border-accent/20">
              {STYLE_LABELS[currentPrompt.style] || currentPrompt.style}
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              Prompt {currentPrompt.current} of {currentPrompt.total}
            </span>
            <div className="ml-auto">
              <Spinner size="sm" />
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
              {currentPrompt.persona}
            </span>
            <span className="self-center text-xs text-muted-foreground/50">
              &times;
            </span>
            <span className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
              {currentPrompt.topic}
            </span>
          </div>
          <p className="text-sm italic leading-relaxed text-muted-foreground">
            &ldquo;{currentPrompt.prompt_text}&rdquo;
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <Spinner />
          <p className="mt-2 text-xs text-muted-foreground/70">
            {statusMessage || "Preparing prompts..."}
          </p>
        </div>
      )}

      <button
        onClick={onReset}
        className="mt-4 mx-auto block text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
