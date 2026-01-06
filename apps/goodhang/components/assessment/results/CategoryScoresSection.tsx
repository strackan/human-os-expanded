'use client';

import type { CategoryScores } from '@/lib/assessment/types';

interface CategoryScoresSectionProps {
  categoryScores: CategoryScores;
}

export function CategoryScoresSection({ categoryScores }: CategoryScoresSectionProps) {
  const technical = categoryScores.technical;
  const emotional = categoryScores.emotional;
  const creative = categoryScores.creative;

  // Only render if at least one category exists
  if (!technical && !emotional && !creative) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold mb-6 text-white">Category Scores</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Technical */}
        {technical && (
          <CategoryCard
            title="Technical"
            score={technical.overall}
            subscores={technical.subscores}
            color="blue"
            icon="⚙️"
          />
        )}

        {/* Emotional */}
        {emotional && (
          <CategoryCard
            title="Emotional"
            score={emotional.overall}
            subscores={emotional.subscores}
            color="purple"
            icon="❤️"
          />
        )}

        {/* Creative */}
        {creative && (
          <CategoryCard
            title="Creative"
            score={creative.overall}
            subscores={creative.subscores}
            color="pink"
            icon="🎨"
          />
        )}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  title: string;
  score: number;
  subscores?: Record<string, number> | undefined;
  color: 'blue' | 'purple' | 'pink';
  icon: string;
}

function CategoryCard({ title, score, subscores, color, icon }: CategoryCardProps) {
  const colorClasses = {
    blue: 'from-blue-900/20 to-cyan-900/20 border-blue-500/30',
    purple: 'from-purple-900/20 to-pink-900/20 border-purple-500/30',
    pink: 'from-pink-900/20 to-red-900/20 border-pink-500/30'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <div className="text-5xl font-bold text-white mb-4">{score}</div>

      {/* Subscores */}
      {subscores && (
        <div className="space-y-2">
          {Object.entries(subscores).map(([name, value]) => (
            <div key={name} className="flex justify-between items-center text-sm">
              <span className="text-gray-300 capitalize">{name.replace('_', ' ')}</span>
              <span className="text-white font-semibold">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
