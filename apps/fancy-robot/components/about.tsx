export function About() {
  return (
    <section id="about" className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="flex shrink-0 flex-col items-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-3xl border border-border bg-card shadow-sm">
              <span className="text-5xl font-bold text-accent">FR</span>
            </div>
            <span className="mt-4 font-mono text-xs tracking-wider text-muted-foreground">
              est. 2024 / raleigh, nc
            </span>
          </div>

          <div>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              About Us
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Fancy Robot Creative
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {"We're an AI-native creative agency. Small team, big data, zero corporate nonsense. We saw this shift happening before most brands even knew AI was answering questions about them, and we built the tools to measure it, the strategy to fix it, and the network to make it happen."}
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {"We combine real-time AI model testing, competitive intelligence, and strategic content distribution to ensure your brand shows up where it matters most: in the answers AI gives your future customers."}
            </p>
            <p className="mt-4 text-sm italic text-muted-foreground">
              {"(We named ourselves after a fancy robot. We don't take ourselves too seriously. But we take your visibility very seriously.)"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
