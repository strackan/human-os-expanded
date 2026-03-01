"use client";

import { useEffect, useState } from "react";

function ScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 400);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 80;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120" aria-hidden="true">
        <path
          d="M 10 110 A 80 80 0 0 1 190 110"
          fill="none"
          stroke="oklch(0.90 0.008 80)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 10 110 A 80 80 0 0 1 190 110"
          fill="none"
          stroke="oklch(0.68 0.14 25)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-[1.2s] ease-out"
        />
      </svg>
      <div className="absolute bottom-1 flex flex-col items-center">
        <span className="font-mono text-4xl font-bold text-foreground">
          {animatedScore}
        </span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

const models = [
  { name: "ChatGPT", score: 12 },
  { name: "Claude", score: 3 },
  { name: "Gemini", score: 8 },
  { name: "Perplexity", score: 22 },
  { name: "Copilot", score: 5 },
];

function ModelBreakdown() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs tracking-wider text-muted-foreground">
        How often AI recommends you
      </span>
      {models.map((model, i) => (
        <div key={model.name} className="flex items-center gap-3">
          <span className="w-20 text-xs text-muted-foreground">
            {model.name}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all duration-[1s] ease-out"
              style={{
                width: visible ? `${model.score}%` : "0%",
                transitionDelay: `${i * 120 + 800}ms`,
              }}
            />
          </div>
          <span className="w-8 text-right font-mono text-xs text-muted-foreground">
            {model.score}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-start lg:gap-20">
          <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
            <span className="mb-5 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              Greetings, human.
            </span>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] text-balance">
              Does AI recommend
              <br />
              <span className="text-accent">your brand?</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              {"Millions of buying decisions now start with "}
              <span className="italic">
                {'"Hey ChatGPT, what\'s the best..."'}
              </span>
              {" We measure how AI sees you, find the gaps, and fix them."}
            </p>

            <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/5 px-5 py-3.5">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-accent">Real finding:</span>{" "}
                One enterprise brand appeared in only 3.6% of AI recommendations
                while competitors hit 66%.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/snapshot"
                className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110"
              >
                Get Your AI Visibility Score
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-border bg-card px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                See How It Works
              </a>
            </div>
          </div>

          <div className="w-full max-w-sm shrink-0">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-2 text-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Your AI Visibility Score
                </span>
              </div>
              <ScoreGauge score={18} />
              <div className="mt-6 border-t border-border pt-5">
                <ModelBreakdown />
              </div>
              <p className="mt-4 text-center font-mono text-[10px] text-muted-foreground/70">
                (yikes. but we can fix that.)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
