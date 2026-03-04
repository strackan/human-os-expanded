import { ArrowRight } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Free",
    tagline: "AI Visibility Snapshot",
    description: "See your score in 30 seconds",
    cta: "Check My Score",
    href: "/snapshot",
    accent: false,
  },
  {
    name: "Audit",
    tagline: "Full Visibility Audit",
    description: "Competitive analysis across 9 AI models",
    cta: "Request Audit",
    href: "#contact",
    accent: true,
  },
  {
    name: "Growth",
    tagline: "Strategy + Execution",
    description: "AI-optimized articles, 2,500+ pub network, re-measurement",
    cta: "Let's Talk",
    href: "#contact",
    accent: false,
  },
];

export function Pricing() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            Simple, transparent
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Start free, scale when ready
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every engagement starts with data. Pick the depth that fits.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-3xl border p-8 shadow-sm transition-shadow hover:shadow-md ${
                tier.accent
                  ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                  : "border-border bg-card"
              }`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  tier.accent ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {tier.name}
              </span>
              <h3 className="mt-3 text-lg font-bold text-foreground">
                {tier.tagline}
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {tier.description}
              </p>
              <Link
                href={tier.href}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all hover:brightness-110 ${
                  tier.accent
                    ? "bg-accent text-accent-foreground"
                    : "border border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
