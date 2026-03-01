import { ArrowRight } from "lucide-react";

const audiences = [
  {
    title: "Brands losing share in AI",
    description:
      "Your competitors show up when prospects ask AI for recommendations. You don't. Let's fix that.",
  },
  {
    title: "Hidden differentiators",
    description:
      "You have a great product AI doesn't know about yet. We make sure the models learn your story.",
  },
  {
    title: "Forward-thinking teams",
    description:
      "You need to understand and influence the AI discovery channel before it becomes table stakes.",
  },
];

const industries = [
  "Financial Services",
  "SaaS",
  "Healthcare",
  "Professional Services",
];

export function WhoItsFor() {
  return (
    <section
      id="who-its-for"
      className="border-t border-border bg-secondary/50 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            {"Who It's For"}
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Built for brands that want to lead, not catch up.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 lg:grid-cols-3">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className="group flex flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:border-accent/30 hover:shadow-sm"
            >
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                {audience.title}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                {audience.description}
              </p>
              <div className="mt-5">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent/80"
                >
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">
              Common industries:
            </span>
            {industries.map((industry) => (
              <span
                key={industry}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-secondary-foreground"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
