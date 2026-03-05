"use client";

import { useEffect, useState } from "react";

interface ARIScoreCardProps {
  entityName: string;
  score: number;
  mentionRate: number;
  totalPrompts: number;
  onNameClick?: () => void;
}

function getScoreColor(s: number) {
  if (s >= 80) return "from-[var(--chart-2)] to-[var(--chart-4)]";
  if (s >= 60) return "from-[var(--chart-1)] to-[var(--chart-5)]";
  if (s >= 40) return "from-[var(--chart-4)] to-[var(--chart-1)]";
  return "from-[var(--chart-1)] to-[var(--chart-3)]";
}

function getScoreLabel(s: number) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Needs Work";
}

export default function ARIScoreCard({
  entityName,
  score,
  mentionRate,
  totalPrompts,
  onNameClick,
}: ARIScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate score counting up
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-center">
        {/* Entity Name */}
        <h2
          className={`mb-4 text-xl font-semibold text-foreground ${onNameClick ? "cursor-pointer transition-colors hover:text-accent" : ""}`}
          onClick={onNameClick}
        >
          {entityName}
          {onNameClick && (
            <span className="ml-2 text-sm text-muted-foreground">&rarr;</span>
          )}
        </h2>

        {/* Score Display */}
        <div
          className={`relative inline-block transition-all duration-500 ${mounted ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
        >
          {/* Glow effect */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r opacity-30 blur-3xl ${getScoreColor(score)}`}
          />

          {/* Score number */}
          <div
            className={`relative bg-gradient-to-r bg-clip-text text-8xl font-bold text-transparent ${getScoreColor(score)}`}
          >
            {displayScore}
          </div>
        </div>

        {/* Score label */}
        <div className="mt-2">
          <span
            className={`inline-block rounded-full bg-gradient-to-r px-3 py-1 text-sm font-medium text-white ${getScoreColor(score)}`}
          >
            {getScoreLabel(score)}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-secondary p-3">
            <div className="text-muted-foreground">Mention Rate</div>
            <div className="text-xl font-semibold text-foreground">
              {Math.round(mentionRate * 100)}%
            </div>
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <div className="text-muted-foreground">Prompts Tested</div>
            <div className="text-xl font-semibold text-foreground">
              {totalPrompts}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-muted-foreground">
          ARI Score measures how often AI models recommend {entityName} across
          various prompts.
        </p>
      </div>
    </div>
  );
}
