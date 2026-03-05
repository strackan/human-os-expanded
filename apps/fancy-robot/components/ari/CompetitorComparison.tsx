"use client";

import { useEffect, useState } from "react";

interface Entity {
  name: string;
  score: number;
  isSelected?: boolean;
  id?: string;
}

interface CompetitorComparisonProps {
  entities: Entity[];
  onEntityClick?: (entity: Entity) => void;
}

const barColors = [
  "from-indigo-500 to-purple-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-cyan-500 to-blue-500",
];

export default function CompetitorComparison({
  entities,
  onEntityClick,
}: CompetitorComparisonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedEntities = [...entities].sort((a, b) => b.score - a.score);

  return (
    <div className="h-full rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Competitive Analysis
      </h3>

      <div className="space-y-3">
        {sortedEntities.map((entity, index) => (
          <div
            key={entity.name}
            onClick={() => onEntityClick?.(entity)}
            className={
              onEntityClick
                ? "-m-2 cursor-pointer rounded-lg p-2 transition-colors hover:bg-secondary"
                : ""
            }
          >
            <div className="mb-1 flex items-center justify-between">
              <span
                className={`font-medium ${entity.isSelected ? "text-foreground" : "text-muted-foreground"} ${onEntityClick ? "hover:text-foreground" : ""}`}
              >
                {entity.name}
              </span>
              <span
                className={`font-bold ${entity.isSelected ? "text-foreground" : "text-muted-foreground"}`}
              >
                {entity.score}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${barColors[index % barColors.length]}`}
                style={{
                  width: mounted ? `${entity.score}%` : "0%",
                  transitionDelay: `${index * 100}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
