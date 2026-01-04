'use client';

import type { Badge } from '@/lib/assessment/types';

interface BadgeShowcaseProps {
  badges: Badge[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  if (badges.length === 0) {
    return (
      <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-8 mb-8 text-center">
        <p className="text-gray-400">No badges earned yet. Keep improving to unlock achievements!</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
        Badges Earned
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map(badge => (
          <div
            key={badge.id}
            className="bg-gray-900/50 border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500/40 transition-all"
          >
            <div className="text-5xl mb-3">{badge.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{badge.name}</h3>
            <p className="text-gray-300 text-sm mb-3">{badge.description}</p>
            <p className="text-xs text-gray-500">Earned {new Date(badge.earned_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
