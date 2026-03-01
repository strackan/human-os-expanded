import type { CompetitorScore } from "@/lib/lite-report-client";

export function CompetitorBars({
  companyName,
  companyRate,
  competitors,
}: {
  companyName: string;
  companyRate: number;
  competitors: CompetitorScore[];
}) {
  const all = [
    { name: companyName, rate: companyRate, isCompany: true, source: "known" as const },
    ...competitors.map((c) => ({
      name: c.name,
      rate: c.mention_rate,
      isCompany: false,
      source: (c.source ?? "known") as "known" | "discovered",
    })),
  ].sort((a, b) => b.rate - a.rate);

  const maxRate = Math.max(...all.map((a) => a.rate), 0.01);

  return (
    <div className="space-y-3">
      {all.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <div className="w-36 text-right">
            <span
              className={`text-sm ${
                item.isCompany
                  ? "font-bold text-accent"
                  : item.source === "discovered"
                    ? "text-amber-500"
                    : "text-muted-foreground"
              }`}
            >
              {item.name}
            </span>
            {item.source === "discovered" && (
              <span className="ml-1.5 inline-block rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-500 border border-amber-500/25">
                NEW
              </span>
            )}
          </div>
          <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                item.isCompany
                  ? "bg-accent"
                  : item.source === "discovered"
                    ? "bg-amber-500/40"
                    : "bg-muted-foreground/30"
              }`}
              style={{ width: `${(item.rate / maxRate) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center px-3">
              <span className="text-xs font-medium text-foreground">
                {(item.rate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
