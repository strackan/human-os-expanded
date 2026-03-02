const industries = [
  "Financial Services",
  "Healthcare",
  "SaaS",
  "Professional Services",
  "E-Commerce",
  "Nonprofits",
];

export function LogoBar() {
  return (
    <section className="border-y border-border bg-secondary/40 py-8">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <p className="text-sm font-medium text-muted-foreground">
              Trusted by brands in:
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {industries.map((industry) => (
                <span
                  key={industry}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-5 py-3">
            <span className="font-mono text-2xl font-bold text-accent">
              200+
            </span>
            <span className="text-sm text-muted-foreground">
              AI visibility audits
              <br />
              delivered
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
