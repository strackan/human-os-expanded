import { Search, EyeOff, TrendingUp, BarChart3 } from "lucide-react";

const problems = [
  {
    icon: Search,
    title: "AI is the new search.",
    description:
      "People are asking ChatGPT instead of Google. If AI doesn't mention you, a growing segment of buyers will never find you.",
  },
  {
    icon: EyeOff,
    title: "You're probably invisible.",
    description:
      "Most brands have no idea where they stand in AI recommendations. Or that this shift is even happening. (It is. Fast.)",
  },
  {
    icon: TrendingUp,
    title: "Your competitors figured it out.",
    description:
      "While you're optimizing for Google, they're already showing up in ChatGPT, Claude, and Perplexity answers.",
  },
  {
    icon: BarChart3,
    title: "Nobody's measuring this.",
    description:
      "There's no Google Analytics for AI visibility. You can't optimize what you can't measure. Until now.",
  },
];

export function Problem() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            {"If AI doesn't know you, neither do your future customers."}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {"Here's what we keep hearing from brands just like yours."}
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2">
          {problems.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-border bg-card p-7 transition-all hover:border-accent/30 hover:shadow-sm"
            >
              <div className="mb-4 inline-flex rounded-xl bg-accent/10 p-3">
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
