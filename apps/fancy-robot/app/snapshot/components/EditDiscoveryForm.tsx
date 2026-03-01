import type { DiscoveryResult } from "@/lib/lite-report-client";

export function EditDiscoveryForm({
  discovery,
  onChange,
  onSubmit,
  onCancel,
}: {
  discovery: DiscoveryResult;
  onChange: (d: DiscoveryResult) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const updateField = <K extends keyof DiscoveryResult>(
    key: K,
    value: DiscoveryResult[K]
  ) => {
    onChange({ ...discovery, [key]: value });
  };

  const updateCompetitor = (idx: number, name: string) => {
    const comps = [...discovery.competitors];
    comps[idx] = { ...comps[idx], name };
    updateField("competitors", comps);
  };

  const updateListItem = (
    key: "personas" | "topics",
    idx: number,
    value: string
  ) => {
    const list = [...discovery[key]];
    list[idx] = value;
    updateField(key, list);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-foreground">
        Edit Discovery Results
      </h3>

      <div className="grid gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-accent">
            Company Name
          </label>
          <input
            value={discovery.company_name}
            onChange={(e) => updateField("company_name", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-accent">
            Industry
          </label>
          <input
            value={discovery.industry}
            onChange={(e) => updateField("industry", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-accent">
            Competitors
          </label>
          {discovery.competitors.map((c, i) => (
            <input
              key={i}
              value={c.name}
              onChange={(e) => updateCompetitor(i, e.target.value)}
              className={`${inputClass} mb-2`}
            />
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-accent">
            Personas
          </label>
          {discovery.personas.map((p, i) => (
            <input
              key={i}
              value={p}
              onChange={(e) => updateListItem("personas", i, e.target.value)}
              className={`${inputClass} mb-2`}
            />
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-accent">
            Topics
          </label>
          {discovery.topics.map((t, i) => (
            <input
              key={i}
              value={t}
              onChange={(e) => updateListItem("topics", i, e.target.value)}
              className={`${inputClass} mb-2`}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onSubmit}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
        >
          Run Analysis
        </button>
        <button
          onClick={onCancel}
          className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
