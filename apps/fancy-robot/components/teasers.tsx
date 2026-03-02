import { ArrowRight, BarChart3, Zap, Users } from "lucide-react";

const teasers = [
  {
    icon: BarChart3,
    label: "How It Works",
    headline: "Three phases. Clear deliverables.",
    description:
      "80+ buyer prompts across 9 AI models. We measure, strategize, and execute — then prove it with before/after data.",
    href: "#how-it-works",
  },
  {
    icon: Zap,
    label: "Why It Works",
    headline: "AI learns from what's published.",
    description:
      "Strategic content placed where AI models actually look. Not keyword stuffing — real stories that compound over time.",
    href: "#why-it-works",
  },
  {
    icon: Users,
    label: "Who It's For",
    headline: "Brands that want to lead.",
    description:
      "If competitors show up in AI answers and you don't, or AI doesn't know your differentiators yet — this is for you.",
    href: "#who-its-for",
  },
];

export function Teasers() {
  return (
    <section className="border-t border-border bg-card/50 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {teasers.map((teaser) => (
            <a
              key={teaser.label}
              href={teaser.href}
              className="group flex flex-col gap-3 rounded-2xl p-6 transition-all hover:bg-card hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-xl bg-accent/10 p-2.5">
                  <teaser.icon className="h-5 w-5 text-accent" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                  {teaser.label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {teaser.headline}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {teaser.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-all group-hover:gap-2.5">
                Learn more
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
