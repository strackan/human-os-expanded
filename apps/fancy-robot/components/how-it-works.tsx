import { BarChart3, FileText, Repeat } from "lucide-react";

const phases = [
  {
    step: "01",
    icon: BarChart3,
    title: "Measure",
    subtitle: "AI Visibility Audit",
    description:
      "We test your brand across 80+ real buyer prompts, 9 major AI models, and multiple personas. You get a full scorecard with visibility rate, model-by-model breakdown, competitor benchmarks, persona gaps, and source citations.",
    deliverable: "Your AI Visibility Report with competitive positioning",
    details: [
      "80+ real buyer prompts",
      "9 major AI models tested",
      "Competitor benchmarking",
      "Source citation analysis",
    ],
  },
  {
    step: "02",
    icon: FileText,
    title: "Strategize",
    subtitle: "Content & Distribution Plan",
    description:
      "We analyze the 3,500+ sources AI models actually cite to find exactly where your brand needs to show up. Then we design targeted content mapped to your weakest personas and highest-value blind spots. Every piece is structured for LLM readability\u2014clear claims, cited evidence, semantic formatting\u2014so AI models can actually parse your story and retell it accurately.",
    deliverable: "Prioritized content strategy with LLM-optimized formatting playbook",
    details: [
      "3,500+ source analysis",
      "Persona gap mapping",
      "LLM-readable content structuring",
      "Semantic formatting for AI parsing",
    ],
  },
  {
    step: "03",
    icon: Repeat,
    title: "Execute & Re-Measure",
    subtitle: "Campaign + Proof",
    description:
      "We produce and distribute strategic content through our publishing network. Every article is written to be LLM-friendly: clear narrative structure, authoritative sourcing, and semantic markup that helps AI models understand and surface your brand\u2019s story\u2014not just your keywords. At 30 and 60 days we re-run the full audit to prove it worked.",
    deliverable: "Before/after visibility report with ROI analysis",
    details: [
      "LLM-optimized content production",
      "2,500+ publication network",
      "Narrative-first, not keyword-stuffed",
      "30 & 60 day re-audits with proof",
    ],
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-border bg-secondary/50 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            How It Works
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Three phases. Clear deliverables. No mystery.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {"We like to keep things simple. (The data is complex enough.)"}
          </p>
        </div>

        <div className="mx-auto mt-14 flex max-w-4xl flex-col gap-6">
          {phases.map((phase, index) => (
            <div
              key={phase.step}
              className="relative rounded-3xl border border-border bg-card p-8 transition-all hover:shadow-sm lg:p-10"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
                <div className="shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 font-mono text-lg font-bold text-accent">
                      {phase.step}
                    </span>
                    <div className="inline-flex rounded-xl bg-secondary p-2.5">
                      <phase.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground">
                    {phase.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-accent">
                    {phase.subtitle}
                  </p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {phase.description}
                  </p>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {phase.details.map((detail) => (
                      <div
                        key={detail}
                        className="flex items-center gap-2.5 text-sm text-secondary-foreground"
                      >
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {detail}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl bg-secondary px-5 py-3.5">
                    <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      What you get
                    </span>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {phase.deliverable}
                    </p>
                  </div>
                </div>
              </div>

              {index < phases.length - 1 && (
                <div
                  className="absolute -bottom-6 left-14 hidden h-6 w-px bg-border lg:block"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
