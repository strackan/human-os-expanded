"use client";

import { useState, useEffect } from "react";

export function ScoreGauge({ score }: { score: number }) {
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
      <svg
        width="200"
        height="120"
        viewBox="0 0 200 120"
        aria-hidden="true"
      >
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
