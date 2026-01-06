'use client';

interface ResultsHeaderProps {
  archetype?: string | undefined;
  overall_score: number;
  tier?: string | undefined;
}

export function ResultsHeader({ archetype, overall_score, tier }: ResultsHeaderProps) {
  const getTierLabel = (tierValue?: string) => {
    switch (tierValue) {
      case 'top_1':
        return 'Top 1% Candidate';
      case 'benched':
        return 'Talent Bench';
      case 'passed':
        return 'Assessed';
      default:
        return tierValue || 'Assessed';
    }
  };

  const getTierColor = (tierValue?: string) => {
    switch (tierValue) {
      case 'top_1':
        return 'text-yellow-400';
      case 'benched':
        return 'text-green-400';
      case 'passed':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="text-center mb-12">
      <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        {archetype || 'Your Results'}
      </h1>
      <div className="flex items-center justify-center gap-6 mb-4">
        <div>
          <span className="text-6xl font-bold text-white">{overall_score}</span>
          <span className="text-gray-400 ml-2">/ 100</span>
        </div>
        {tier && (
          <div className={`text-2xl font-semibold ${getTierColor(tier)}`}>
            {getTierLabel(tier)}
          </div>
        )}
      </div>
    </div>
  );
}
