import { TrendingUp, Bot, FileText, Newspaper } from "lucide-react";

const metrics = [
  { icon: Bot, value: "9", label: "AI models tested" },
  { icon: FileText, value: "80+", label: "prompts per audit" },
  { icon: Newspaper, value: "2,500+", label: "publication network" },
];

export function Proof() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            Real results
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            The data speaks for itself
          </h2>
        </div>

        {/* Case study card */}
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-3xl border border-accent/20 bg-accent/5 p-8 lg:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  3.6% → 47% AI visibility in 60 days
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  One financial services brand was virtually invisible to AI
                  assistants — appearing in only 3.6% of relevant
                  recommendations while competitors hit 66%. After a full audit
                  and content strategy, their visibility jumped to 47% across
                  all tested models.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metric strip */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
            >
              <metric.icon className="h-6 w-6 text-accent" />
              <span className="font-mono text-3xl font-bold text-foreground">
                {metric.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
