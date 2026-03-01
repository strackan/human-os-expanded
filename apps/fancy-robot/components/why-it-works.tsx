import { BookOpen, Sparkles, TrendingUp, Globe } from "lucide-react";

const reasons = [
  {
    icon: BookOpen,
    title: "AI learns from what's published",
    description:
      "News articles, educational guides, review sites. AI models synthesize what's already out there. We make sure your brand is part of that picture.",
  },
  {
    icon: Sparkles,
    title: "Real story, real placement",
    description:
      "We don't game the system. We put your genuine differentiators in the places AI already looks for authoritative information. No tricks, just strategy.",
  },
  {
    icon: TrendingUp,
    title: "Content compounds over time",
    description:
      "Articles stay indexed and cited for months or years. Each piece builds your brand's AI presence. It's like interest, but for visibility.",
  },
  {
    icon: Globe,
    title: "Massive distribution network",
    description:
      "Our media partners include 2,500+ publications. We know exactly which outlets AI models cite most, and we get you there.",
  },
];

export function WhyItWorks() {
  return (
    <section id="why-it-works" className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            Why It Works
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            We work with AI, not against it.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {"(Turns out, the robots respond well to good content. Who knew.)"}
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-10 sm:grid-cols-2">
          {reasons.map((reason) => (
            <div key={reason.title} className="flex gap-4">
              <div className="shrink-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                  <reason.icon className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
