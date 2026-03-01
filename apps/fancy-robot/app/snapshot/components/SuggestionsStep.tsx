import type { DomainSuggestion } from "../lib/constants";

export function SuggestionsStep({
  suggestions,
  query,
  onSelect,
  onReset,
}: {
  suggestions: DomainSuggestion[];
  query: string;
  onSelect: (domain: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Did you mean?
        </h2>
        <p className="mt-3 text-muted-foreground">
          We found a few brands matching &ldquo;{query}&rdquo;
        </p>
      </div>

      <div className="w-full max-w-lg space-y-3">
        {suggestions.map((s) => (
          <button
            key={s.domain}
            onClick={() => onSelect(s.domain)}
            className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-foreground">
              {s.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {s.domain}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={onReset}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        None of these — try again with full domain
      </button>
    </div>
  );
}
